# 📌 UPnP Web Player – Development Roadmap

## ✅ Current Status

* DLNA/UPnP servers discovered successfully.
* Browsing works: can see folders and files.
* Video & audio streaming works (audio plays inside video player).

---

# 🔹 Level 1 (UI polish & usability improvements)

* Reduce size of server list (make compact sidebar).
* Increase size of files list (use more screen space).
* Reduce heading size (cleaner layout).
* Resizable player (drag to resize width/height).
* **“Up Folder” button** → one click to go to parent folder.

  * Should always appear at top of file list when not in root.
  * Example: ⬆ Up button that navigates to parentID.
* Folder / File icons → visually distinguish content.

  * Folder 📁 icon for containers.
  * Video 🎬, audio 🎵, image 🖼️ icons depending on MIME type.
* **Auto play next song/video** → when current file ends, automatically start the next one in the list.

---

# 🔹 Level 2 (Separate player page)

* When clicking a file, open a new **"watch" page** for playback.
* Pass file ID or URL in query string (e.g. `?v=someid`), similar to YouTube.
* Dedicated player page should have:

  * Larger player.
  * Clear metadata (title, server name, etc.).
  * Back button to return to file browser.
  * Browser history integration → user can copy/share link with video ID.

---

# 🔹 Level 3 (Advanced – YouTube-style experience)

### Different landing pages:

* `/` → opens file browser (default).
* `/video` → video portal (grid of video files with thumbnails & recommendations).
* `/music` → music portal (like YouTube Music, optimized for audio).

### Different players:

* Video player with video-first UI.
* Music player with album-art style UI + audio-focused controls.

### Recommendation system:

* Show “related” files in sidebar (same folder, or by metadata).
* **Auto play recommended song/video** → when one ends, continue with a related one.
* **Repeat / Shuffle buttons** for music playback.
* Reuse existing code from earlier project **Learn Quest (Skill City)** for layout/UI logic.

👉 Long-term: Search bar across all servers, playlists, favorites.

---

# 🔹 Level 4 (Future Ideas Bucket 🚀)

* Mobile-first responsive UI (like YouTube’s app layout).
* Thumbnails / album art preview for files (fetch metadata).
* Playlist support (create, save, share playlists).
* User accounts & login → personal favorites, history, settings.
* Offline sync (cache files locally in browser).
* Multi-server search with filters (e.g. search all servers for “song.mp3”).
* Cast to TV / Chromecast / DLNA renderer.
* Dark/light mode toggle.
* Keyboard shortcuts (space = play/pause, arrows = seek, etc.).


---
# 🎯 Side Quest

* ✅ Create GitHub Account – Done
* ✅ Upload the code to GitHub
* ✅ Learn how to use GitHub (basics: repos, commits, branches, pull requests)
* ✅ Learn how to sync code from laptop → GitHub (push changes)

---

# 📘 Beginner GitHub Guide

## 🔹 Prerequisites

1. GitHub account ✅ (already done).
2. Install Git on your laptop:

   * [Download Git](https://git-scm.com/downloads)
   * During install → choose **“Use Git from the command line and also from 3rd-party software.”**
   * After install, open Command Prompt / PowerShell and check:
     `git --version`

---

## 🔹 Step 1: Upload the code to GitHub (first time)

1. Go to [GitHub](https://github.com/) → click **New Repository**.

   * Name: e.g. `upnp-web-player`
   * Visibility: Public (or Private).
   * Don’t add README (we’ll add locally).

2. On laptop, open terminal in your project folder:
   `cd C:\\path\\to\\your\\project`
3. Initialize Git:
   `git init`
   `git add .`
   `git commit -m "Initial commit"`
4. Link repo:
   `git remote add origin https://github.com/YOUR-USERNAME/upnp-web-player.git`
5. Push code:
   `git branch -M main`
   `git push -u origin main`

✅ Now your code is uploaded.

---

## 🔹 Step 2: Learn the Basics

### 📌 Important Git Commands

* `git status` → check changes.
* `git add file.js` → stage a specific file.
* `git add .` → stage all changes.
* `git commit -m "message"` → save changes locally.
* `git push` → upload to GitHub.
* `git pull` → download from GitHub.

---

## 🔹 Step 3: Sync Code (Laptop → GitHub)

Whenever you make changes:
`git add .`
`git commit -m "Describe what changed"`
`git push`

Example:
`git add .`
`git commit -m "Added up folder button"`
`git push`

---

## 🔹 Step 4: Sync Code (GitHub → Laptop)

If you made changes on GitHub (e.g. edited README online):
`git pull`

---

## 🎯 Extra: First Test Run

1. Edit something small (like README.md) on laptop → push.
2. Edit README again on GitHub → pull.
3. ✅ Full sync cycle complete.