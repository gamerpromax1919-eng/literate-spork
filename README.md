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

## Notes

- The app uses browser storage (`localStorage` + `IndexedDB`) on your device.
- YouTube links are saved as bookmarks; playback requires internet unless you have legal local files.
