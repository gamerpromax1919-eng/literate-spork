# Offline Media + Chat Hub

A lightweight web app that helps with:

- quick chat-style notes and suggestions,
- saving YouTube links for watch-later planning,
- storing local video files for offline playback,
- storing local audio/music files for offline playback.

## Run locally

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Publish it

Because this is a static app (`index.html`, CSS, JS, manifest, service worker), you can publish it on any static host.

### Option 1: GitHub Pages (free)

1. Push this repo to GitHub.
2. In GitHub, go to **Settings → Pages**.
3. Under **Build and deployment**, set:
   - **Source**: `Deploy from a branch`
   - **Branch**: `work` (or your default branch), folder `/ (root)`
4. Save and wait ~1–2 minutes.
5. Open the provided URL, usually:
   - `https://<your-username>.github.io/<repo-name>/`

### Option 2: Netlify (drag-and-drop)

1. Zip the project files.
2. Go to Netlify and create a new site.
3. Drag the folder/zip into Netlify Deploy.
4. Netlify gives you a live URL immediately.

### Option 3: Vercel

1. Import the GitHub repo in Vercel.
2. Framework preset: **Other** (no build command needed).
3. Deploy.

## Important publishing notes

- Use **HTTPS** in production so service workers work reliably.
- If you host under a subpath (like GitHub Pages project site), keep links relative (`./...`) as already configured.
- Browser storage (`localStorage`, `IndexedDB`) is per-browser and per-device; user data does not sync automatically.

## Notes

- The app uses browser storage (`localStorage` + `IndexedDB`) on your device.
- YouTube links are saved as bookmarks; playback requires internet unless you have legal local files.
