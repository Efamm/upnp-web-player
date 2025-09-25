const serversDiv = document.getElementById('servers');
const filesDiv = document.getElementById('files');
const videoPlayer = document.getElementById('videoPlayer');

let currentServerId = null;

// Load and display discovered servers
// Load and display discovered servers
async function loadServers() {
  serversDiv.innerHTML = '<p>Searching...</p>';
  try {
    const res = await fetch('/api/servers');
    const servers = await res.json();
    if (servers.length === 0) {
      serversDiv.innerHTML = '<p>No UPnP servers found.</p>';
      return;
    }
    serversDiv.innerHTML = '';
    servers.forEach(server => {
      const btn = document.createElement('button');
      btn.textContent = server.friendlyName;
      // Start browsing from the root when a server is clicked
      btn.onclick = () => selectServer({ id: server.id, objectId: '0' });
      serversDiv.appendChild(btn);
    });
  } catch (err) {
    serversDiv.innerHTML = '<p>Error loading servers.</p>';
    console.error(err);
  }
}

let pathStack = []; // keep track of folder path

async function selectServer({ id, objectId = '0', page = 0, pageSize = 100, parentId = null }) {
  currentServerId = id;
  filesDiv.innerHTML = '<p>Loading files...</p>';

  try {
    let allFiles = [];
    let startIndex = 0;
    const batchSize = 50; // many UPnP servers return max 50 items per request

    while (true) {
      const res = await fetch(`/api/browse?serverId=${id}&objectId=${objectId}&startIndex=${startIndex}&requestedCount=${batchSize}`);
      const data = await res.json();

      const filesBatch = [
        ...(data.containers || []).map(f => ({ ...f, isFolder: true })),
        ...(data.items || []).map(i => ({ ...i, isFolder: false }))
      ];

      allFiles = allFiles.concat(filesBatch);

      // Stop if no more items
      if (!data.numberReturned || allFiles.length >= (data.totalMatches || allFiles.length)) break;

      startIndex += data.numberReturned;
    }

    if (allFiles.length === 0) {
      filesDiv.innerHTML = '<p>No media files found.</p>';
      return;
    }

    filesDiv.innerHTML = '';

    // Add Up Folder button if not root
    if (objectId !== '0') {
      const upBtn = document.createElement('button');
      upBtn.textContent = '⬆️ Up';
      upBtn.onclick = () => selectServer({ id, objectId: parentId || data.parentID || '0' });
      filesDiv.appendChild(upBtn);
    }

    // Pagination: display only current page
    const start = page * pageSize;
    const end = Math.min(start + pageSize, allFiles.length);
    const filesPage = allFiles.slice(start, end);

    filesPage.forEach(file => {
      const btn = document.createElement('button');
      btn.textContent = `${getFileIcon(file)} ${file.title}`;
      if (file.isFolder) {
        btn.onclick = () => selectServer({ id, objectId: file.id, parentId: objectId });
      } else {
        btn.onclick = () => playFile(id, file.res);
      }
      filesDiv.appendChild(btn);
    });

    // Pagination buttons
    if (end < allFiles.length) {
      const nextBtn = document.createElement('button');
      nextBtn.textContent = 'Next Page →';
      nextBtn.onclick = () => selectServer({ id, objectId, page: page + 1, parentId });
      filesDiv.appendChild(nextBtn);
    }
    if (page > 0) {
      const prevBtn = document.createElement('button');
      prevBtn.textContent = '← Previous Page';
      prevBtn.onclick = () => selectServer({ id, objectId, page: page - 1, parentId });
      filesDiv.insertBefore(prevBtn, filesDiv.firstChild.nextSibling); // after Up button
    }

  } catch (err) {
    filesDiv.innerHTML = '<p>Error loading files.</p>';
    console.error('Error browsing files:', err);
  }
}


// Utility function for file icons
function getFileIcon(file) {
  if (file.isFolder) return '📁';
  if (file.res) {
    const url = file.res.toLowerCase();
    // Check URL or "pn=" parameter for type
    const pnMatch = url.match(/pn=([a-z0-9_]+)/i);
    const mimeHint = pnMatch ? pnMatch[1].toLowerCase() : '';

    if (/\.mp4|\.mkv|\.avi|\.mov/.test(url) || mimeHint.includes('mp4') || mimeHint.includes('video')) return '🎬';
    if (/\.mp3|\.wav|\.flac/.test(url) || mimeHint.includes('mp3') || mimeHint.includes('audio')) return '🎵';
    if (/\.jpg|\.jpeg|\.png|\.gif/.test(url) || mimeHint.includes('image')) return '🖼️';
  }
  return '📄';
}










// Play selected media file
// Play selected media file
function playFile(id, fileUrl) {
  if (!fileUrl) {
    alert('No media URL found for this file.');
    return;
  }
  console.log(`DEBUG: Streaming URL → ${fileUrl}`);
  videoPlayer.src = `/proxy?url=${encodeURIComponent(fileUrl)}`;
  videoPlayer.play();
}




// Refresh server list every 30 seconds
loadServers();
setInterval(loadServers, 30000);
