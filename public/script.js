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


async function selectServer({ id, objectId = '0' }) {
  currentServerId = id;
  filesDiv.innerHTML = '<p>Loading files...</p>';
  try {
    const res = await fetch(`/api/browse?serverId=${id}&objectId=${objectId}`);
    const data = await res.json();
    console.log('Raw browse response:', data);

    // Explicitly tag containers as folders
    const files = [
      ...(data.containers || []).map(folder => ({ ...folder, isFolder: true })),
      ...(data.items || []).map(item => ({ ...item, isFolder: false }))
    ];
    console.log('Flattened files:', files);


    if (files.length === 0) {
      filesDiv.innerHTML = '<p>No media files found.</p>';
      return;
    }

    filesDiv.innerHTML = '';
    files.forEach(file => {
      const btn = document.createElement('button');
      btn.textContent = file.title;

      if (file.isFolder) {
        // Folder click → browse inside
        btn.onclick = () => selectServer({ id, objectId: file.id });
      } else {
        // File click → play media
        btn.onclick = () => playFile(id, file.res);
      }

      filesDiv.appendChild(btn);
    });
  } catch (err) {
    filesDiv.innerHTML = '<p>Error loading files.</p>';
    console.error('Error browsing files:', err);
  }
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
