# TubeMusic Offline Hub

A YouTube-Music-style web app for playing **music and videos in one library**.

## What it does

- Combines YouTube links + local files in one searchable library.
- Filters by **All / Music / Videos / YouTube**.
- Plays local audio/video files directly in-app (offline-ready after upload).
- Plays YouTube videos in an embedded player when online.

## Run locally

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Publish it

Because this is static HTML/CSS/JS, deploy to GitHub Pages, Netlify, or Vercel.

### GitHub Pages

1. Push your repo.
2. Open **Settings → Pages**.
3. Source: **Deploy from a branch**.
4. Select your branch and `/ (root)`.
5. Visit `https://<username>.github.io/<repo>/`.

## Notes

- User data is saved in browser storage (`IndexedDB` and `localStorage`) on that device/browser.
- YouTube playback requires internet and may be limited by embed permissions on some videos.
