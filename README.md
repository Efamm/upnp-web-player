# UPnP Web Player

A simple browser-based **UPnP/DLNA media player** that lets you:

* Browse media servers on your local network
* Stream audio and video files directly in the browser
* Play files with a built-in HTML5 player

## ✨ Features

* Browse servers and folders
* Stream both audio and video
* Resizable built-in player
* Works directly in the browser (no extra apps required)

## 🚀 Planned Features

**Level 1:**

* Cleaner UI
* Smaller server list, larger file list
* Resizable player
* Smaller headings
* Up-folder button
* Folder/file icons
* Auto play next song/video

**Level 2:**

* Separate **Player Page** (like YouTube’s watch page)
* Pass file URL as query parameter

**Level 3:**

* YouTube-style pages: `/video` for videos, `/music` for music
* Different players for video and music
* Recommendations, repeat, shuffle
* Auto play recommended items

## 🛠️ Setup

1. Clone the repo:

   ```bash
   git clone https://github.com/Efamm/upnp-web-player.git
   cd upnp-web-player
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the server:

   ```bash
   node server.js
   ```

4. Open your browser and visit:
   [http://localhost:8080](http://localhost:8080)

## 📌 Requirements

* Node.js & npm installed
* A UPnP/DLNA media server on the same network

## 📜 License

This project is licensed under the **MIT License**.