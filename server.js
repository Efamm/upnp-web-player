// UPnP/DLNA discovery + media streaming proxy
// Run with: node server.js

const express = require('express');
const cors = require('cors');
const { Client: SSDP } = require('node-ssdp');
const { parseStringPromise } = require('xml2js');
const { URL } = require('url');
const { Readable } = require('stream');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.static('public'));

// Store discovered servers
const mediaServers = new Map(); // id -> { id, usn, location, friendlyName, baseURL, controlURL }
let nextId = 1;
// Helper: Build absolute URL from device base and relative path
function resolveURL(base, relativePath) {
  try {
    return new URL(relativePath, base).toString();
  } catch (e) {
    return null;
  }
}

// Helper: Fetch URL text
async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return await response.text();
}

// Discover DLNA/UPnP devices and get control URL
async function discoverOnce(location, usn) {
  try {
    const xml = await fetchText(location);
    const doc = await parseStringPromise(xml, { explicitArray: false, ignoreAttrs: false });

    // Base URL of device
    const baseURL = doc?.root?.URLBase || new URL(location).origin + '/';

    const device = doc?.root?.device;
    const friendlyName = device?.friendlyName || 'UPnP Media Server';

    const services = device?.serviceList?.service;
    let controlURL = null;

    if (services) {
      const list = Array.isArray(services) ? services : [services];
      for (const s of list) {
        if (s?.serviceType?.includes('urn:schemas-upnp-org:service:ContentDirectory:1')) {
          controlURL = resolveURL(baseURL, s.controlURL);
          break;
        }
      }
    }

    if (!controlURL) return;

    // Avoid duplicates
    let existing = [...mediaServers.values()].find(x => x.usn === usn || x.location === location);
    if (existing) {
      existing.baseURL = baseURL;
      existing.controlURL = controlURL;
      existing.friendlyName = friendlyName;
      return;
    }

    const id = String(nextId++);
    mediaServers.set(id, { id, usn, location, friendlyName, baseURL, controlURL });
    console.log(`[DLNA] Found: ${friendlyName} @ ${location}`);
  } catch (e) {
    console.warn(`[DLNA] Failed parsing ${location}:`, e.message);
  }
}
// Start SSDP discovery
function startSSDP() {
  const client = new SSDP({ explicitSocketBind: true });

  client.on('response', (headers) => {
    const location = headers.LOCATION || headers.Location || headers.location;
    const usn = headers.USN || headers.Usn || headers.usn;
    if (location) discoverOnce(location, usn);
  });

  const searches = [
    'urn:schemas-upnp-org:device:MediaServer:1',
    'urn:schemas-upnp-org:service:ContentDirectory:1'
  ];

  function burstSearches() {
    searches.forEach(st => client.search(st));
  }

  burstSearches();
  setTimeout(burstSearches, 1500);
  setTimeout(burstSearches, 4000);
  setInterval(burstSearches, 30000);

  console.log('[SSDP] Searching for DLNA/UPnP Media Servers...');
}

// SOAP helper to browse media folders
async function cdBrowse(controlURL, objectId = '0', startIndex = 0, requestedCount = 200) {
  const soapBody = `<?xml version="1.0" encoding="utf-8"?>
  <s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
    <s:Body>
      <u:Browse xmlns:u="urn:schemas-upnp-org:service:ContentDirectory:1">
        <ObjectID>${objectId}</ObjectID>
        <BrowseFlag>BrowseDirectChildren</BrowseFlag>
        <Filter>*</Filter>
        <StartingIndex>${startIndex}</StartingIndex>
        <RequestedCount>${requestedCount}</RequestedCount>
        <SortCriteria></SortCriteria>
      </u:Browse>
    </s:Body>
  </s:Envelope>`;

  const resp = await fetch(controlURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset="utf-8"',
      'SOAPAction': '"urn:schemas-upnp-org:service:ContentDirectory:1#Browse"'
    },
    body: soapBody
  });

  const text = await resp.text();
  const parsed = await parseStringPromise(text, { explicitArray: false, ignoreAttrs: false });
  const result = parsed?.['s:Envelope']?.['s:Body']?.['u:BrowseResponse']?.Result;
  if (!result) return { containers: [], items: [] };

  const didl = await parseStringPromise(result, { explicitArray: false, ignoreAttrs: false });
  const dl = didl['DIDL-Lite'] || {};

  const containers = (dl.container ? (Array.isArray(dl.container) ? dl.container : [dl.container]) : []).map(c => ({
    id: c['$']?.id,
    parentID: c['$']?.parentID,
    title: c['dc:title'] || 'Folder',
    childCount: Number(c['$']?.childCount || 0)
  }));

const items = (dl.item ? (Array.isArray(dl.item) ? dl.item : [dl.item]) : []).map(i => {
  let resURL = null;
  let protocolInfo = null;

  // Handle different res formats (array, object, string)
  if (i.res) {
    if (Array.isArray(i.res)) {
      const firstRes = i.res[0];
      resURL = typeof firstRes === 'string' ? firstRes : firstRes?._ || null;
      protocolInfo = firstRes?.['$']?.protocolInfo || null;
    } else if (typeof i.res === 'object') {
      resURL = i.res._ || null;
      protocolInfo = i.res?.['$']?.protocolInfo || null;
    } else if (typeof i.res === 'string') {
      resURL = i.res;
    }
  }

  const mime = protocolInfo ? protocolInfo.split(':').pop() : null;

  return {
    id: i['$']?.id,
    parentID: i['$']?.parentID,
    title: i['dc:title'] || 'Item',
    class: i['upnp:class'] || '',
    res: resURL,
    mime
  };
});


  return { containers, items };
}
// --- API Endpoints ---

// Get list of discovered servers
app.get('/api/servers', (req, res) => {
  res.json([...mediaServers.values()]);

});

// Browse folders and files on the selected server
app.get('/api/browse', async (req, res) => {
  try {
    const { serverId, objectId } = req.query;

    if (!serverId || !mediaServers.has(serverId)) {
      return res.status(400).json({ error: 'Invalid serverId' });
    }

    const server = mediaServers.get(serverId);

    // Use the passed objectId if available; otherwise browse the root (0)
    const browseId = objectId && objectId !== '' ? objectId : '0';

    console.log(`[Browse] Server: ${server.friendlyName}, ObjectID: ${browseId}`);

    const out = await cdBrowse(server.controlURL, browseId);
    res.json(out);
  } catch (e) {
    console.error('[Browse Error]', e);
    res.status(500).json({ error: e.message });
  }
});


// Proxy endpoint to handle CORS and support streaming/range requests
app.get('/proxy', async (req, res) => {
  try {
    const target = req.query.url;
    if (!target) return res.status(400).send('Missing url');

    const headers = {};
    if (req.headers['range']) headers['Range'] = req.headers['range'];
    if (req.headers['user-agent']) headers['User-Agent'] = req.headers['user-agent'];

    const upstream = await fetch(target, { headers });

    res.status(upstream.status);
    for (const [k, v] of upstream.headers) {
      if (/^transfer-encoding|connection|keep-alive|proxy-connection|upgrade|access-control-/i.test(k)) continue;
      res.setHeader(k, v);
    }

    res.setHeader('Access-Control-Allow-Origin', '*');

    if (!upstream.body) return res.end();
    const nodeStream = Readable.fromWeb(upstream.body);
    nodeStream.pipe(res);
  } catch (e) {
    console.error('Proxy error:', e);
    res.status(502).send('Bad gateway');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`UPnP Web Player running at http://localhost:${PORT}`);
  startSSDP();
});
