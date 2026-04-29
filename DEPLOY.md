# KFBG Audio Journey — Deployment Guide

## Files in this package

| File | What it is | Where it goes |
|---|---|---|
| `index.html` | Home page + journey library | GitHub repo root |
| `journey.html` | Audio player (all journey sets) | GitHub repo root |
| `manifest.json` | Makes the app installable | Domain root |
| `sw.js` | Offline / Service Worker | Domain root |
| `icons/` | App icons (192px + 512px) | Domain root |

---

## GitHub Pages (testing & staging)

1. Create repo: `github.com/ryansham` → New → `kfbg-audio-journey` → Public
2. Upload all files by dragging into the GitHub web interface
3. Settings → Pages → Source: Deploy from branch → main → /(root) → Save
4. Live at: `https://ryansham.github.io/kfbg-audio-journey`

---

## KFBG Production (developer task — ~2 hours)

The developer needs to place two files at the **domain root** of kfbg.org.hk:

```
kfbg.org.hk/manifest.json
kfbg.org.hk/sw.js
```

These CANNOT go in /wp-content/ or any subfolder — Service Workers must be served
from the root to have full-page scope.

The HTML pages can be embedded in WordPress as usual.

Add this to the WordPress page <head> (via theme or plugin):
```html
<link rel="manifest" href="/manifest.json"/>
<meta name="theme-color" content="#4A5C3A"/>
```

---

## Updating audio files

Audio files are referenced in `journey.html` in the `JOURNEYS` data object.
Paths are relative to the KFBG upload directory:

```
/upload/audio-journey/01_Final_v01_20260211.mp3
/upload/audio-journey/02_Final_v01_20260211.mp3
... etc
```

Update these paths in `journey.html` if audio files move.

---

## Adding a new journey set

In `journey.html`, add a new entry to the `JOURNEYS` object:

```javascript
'new-journey-key': {
  title: { en: 'English Title', tc: '繁中標題' },
  subtitle: { en: 'Subtitle', tc: '副標題' },
  chapters: [ /* same structure as grounding-walk */ ]
}
```

Then in `index.html`, add a new `.journey-card` block pointing to:
```
href="journey.html?set=new-journey-key"
```

---

## App icons

Two PNG icons are required for PWA install:
- `icons/icon-192.png` — 192×192px
- `icons/icon-512.png` — 512×512px

Use KFBG logo on olive (#4A5C3A) background.
Generate at: https://maskable.app/editor

---

## Testing the PWA install on iPhone

1. Open the URL in Safari (must be Safari, not Chrome, on iOS)
2. Tap the Share icon
3. Tap "Add to Home Screen"
4. The app icon appears — tap to open full-screen, works offline

On Android Chrome, a banner appears automatically after ~30 seconds on the page.

---

## Offline behaviour

- All 5 audio files are cached silently in the background on first visit
- Pages (index.html, journey.html) are cached on first visit
- If user goes offline, everything plays from cache
- A small notice bar appears when offline: "You're offline — audio is playing from cache"
