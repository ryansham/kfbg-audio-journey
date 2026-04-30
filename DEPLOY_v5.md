# KFBG Audio Journey — Deploy Guide v5 (SPA)

## Important: this is now a Single Page App

The app now lives in ONE file: `app.html`
- No more `index.html` / `journey.html` navigation
- Audio persists across all "pages" (no reload = no audio interruption)
- All views are JS-driven inside a single HTML shell

## Files to upload to GitHub repo root

| File | Purpose |
|---|---|
| `app.html` | The entire app (home + journey player) |
| `sw.js` | Service Worker (bump PAGE_CACHE version on each deploy) |
| `manifest.json` | PWA installability |
| `KFBG_Logo.png` | Transparent logo |

## Audio file structure (RENAME your existing files)

Rename and reorganize in GitHub:

```
audio/
  grounding-walk/
    ch01.mp3   ← was 01_Final_v01_20260211.mp3
    ch02.mp3   ← was 02_Final_v01_20260211.mp3
    ch03.mp3   ← was 03_Final_v01_20260211.mp3
    ch04.mp3   ← was 04_Final_v01_20260211.mp3
    ch05.mp3   ← was 05_Final_v01_20260211.mp3
```

In GitHub web UI:
1. Go to each file in `audio/` folder
2. Click the file → Edit (pencil icon)
3. In the filename field, change to `grounding-walk/ch01.mp3` etc.
4. Commit each change

## GitHub Pages URL

After upload, the app lives at:
  https://ryansham.github.io/kfbg-audio-journey/app.html

## Version control — on every deploy

Open `sw.js` and bump the cache version:
  `const PAGE_CACHE = 'kfbg-pages-v5';`  →  `'kfbg-pages-v6'`

Users will see "New version available" banner automatically.

## Adding future journeys

In `app.html`, find the `CHAPTERS` array and duplicate it for the new journey.
Add the journey card in the home view HTML.
Add audio files to `audio/[journey-key]/ch01.mp3` etc.
