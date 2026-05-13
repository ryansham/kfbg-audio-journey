# KFBG Self-guided Audio Journey
### 嘉道理農場暨植物園 · 自助語音旅程

A Progressive Web App (PWA) that guides visitors through mindful audio stops along the trails of Kadoorie Farm and Botanic Garden, Hong Kong. Bilingual (English / Traditional Chinese), offline-capable, and fully content-managed via Sanity CMS.

**Staging:** https://ryansham.github.io/kfbg-audio-journey
**Production:** https://audio.kfbg.org *(pending IT setup)*
**Sanity Studio:** https://kfbg-audio-journey.sanity.studio

---

## Overview

Each journey guides visitors through a series of audio stops on the trail. At each stop, visitors listen to a narrated audio chapter, engage with a mindful practice prompt, and read the transcript at their own pace. The app works entirely in the mobile browser — no App Store download required.

**Current journeys:**
| # | Journey | Status |
|---|---|---|
| 1 | 連結大地 — 下山區靜心漫步 | 🟢 Published |
| 2 | 上農場步道 | 🟡 Coming Soon |
| 3 | 林地靜境 | 🟡 Coming Soon |

---

## Features

- **Bilingual** — English and Traditional Chinese, switchable at any time
- **Progressive Web App** — installable on iOS and Android home screen, no App Store
- **Offline playback** — audio and images can be downloaded for use without internet
- **Sanity CMS** — all content (text, images, audio URLs, journey status) managed via browser-based Studio, no code deployment required
- **Staging / Production datasets** — content can be tested on staging before promoting to production
- **Interactive trail map** — pinch-to-zoom, pan with momentum/inertia, fullscreen expand
- **Audible-style audio player** — seek bar, speed control, previous/next chapter, minimise toggle
- **QR code deep links** — each chapter can be linked directly via QR code on-site
- **Service Worker caching** — audio files and images cached separately for offline use

---

## Repository Structure

```
kfbg-audio-journey/
│
├── index.html                          # Single-file PWA — entire app
├── sw.js                               # Service Worker (caching strategy)
├── manifest.json                       # PWA manifest (icons, display mode)
├── KFBG_Logo.png                       # App icon (512×512)
├── og-image.jpg                        # Social share image (1200×630)
│
├── images/
│   ├── journeys/
│   │   └── grounding-walk/
│   │       ├── grounding-walk-card.jpg         # Home screen card (900×506)
│   │       ├── grounding-walk-ch01.jpg         # Chapter photos (800×450)
│   │       ├── grounding-walk-ch02.jpg
│   │       ├── grounding-walk-ch03.jpg
│   │       ├── grounding-walk-ch04.jpg
│   │       ├── grounding-walk-ch05.jpg
│   │       └── grounding-walk-map-preview.jpg  # Trail map thumbnail
│   ├── maps/
│   │   └── kfbg-map-full.jpg                  # Full KFBG farm map (fullscreen)
│   └── speakers/
│       └── stanley-chan.jpg                    # Speaker profile (400×400)
│
├── audio/
│   └── grounding-walk/
│       ├── grounding-walk-ch01.mp3
│       ├── grounding-walk-ch02.mp3
│       ├── grounding-walk-ch03.mp3
│       ├── grounding-walk-ch04.mp3
│       └── grounding-walk-ch05.mp3
│
└── studio/                             # Sanity Studio (CMS)
    ├── sanity.config.ts
    ├── sanity.cli.ts
    ├── package.json
    ├── structure.ts
    └── schemaTypes/
        ├── index.ts
        ├── journey.ts
        ├── chapter.ts
        ├── speaker.ts
        ├── siteSettings.ts
        └── uiStrings.ts
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Sanity Studio (browser-based editor)                        │
│  https://kfbg-audio-journey.sanity.studio                   │
│  ├── staging dataset  → ryansham.github.io (testing)        │
│  └── production dataset → audio.kfbg.org (public)          │
└──────────────────────┬──────────────────────────────────────┘
                       │ GROQ API fetch on app load
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  PWA (index.html)                                            │
│  Auto-detects hostname → reads correct Sanity dataset       │
│  Caches Sanity response in localStorage for offline         │
└──────────────────────┬──────────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
  ryansham.github.io          audio.kfbg.org
  (GitHub Pages · staging)    (KFBG server · production)
```

### Cache layers (Service Worker)

| Cache | Contents | Strategy |
|---|---|---|
| `kfbg-pages-vN` | HTML, CSS, JS, local images | Network-first, cache fallback |
| `kfbg-audio-v1` | MP3 audio files | Cache-first (user downloads) |
| `kfbg-images-v1` | Chapter photos, maps, Sanity CDN images | Cache-first (user downloads) |

---

## Content Management

All content is managed via **Sanity Studio** at `https://kfbg-audio-journey.sanity.studio`. No code changes are required to update text, images, or journey status.

### Sanity schema

| Document | Purpose |
|---|---|
| **Journey** | Journey title, status, chapters, map images, completion message |
| **Chapter** | Audio URL, chapter photo, description, mindful practice, transcript |
| **Speaker** | Profile photo, bio, title (reusable across journeys) |
| **Site Settings** | App name, OG image, colours, notice bar, analytics |
| **UI Strings** | Every interface text string in EN and TC |

### Journey status

| Status | Effect |
|---|---|
| 🟢 Published | Fully accessible in app |
| 🟡 Coming Soon | Visible on home screen as locked card |
| ⚫ Hidden | Not shown in app at all |

Change status in Studio → click **Publish** → live in app within seconds.

---

## Content Workflow

### Updating content (no code required)

```
1. Edit in Sanity Studio (staging dataset)
2. Preview on ryansham.github.io
3. Team approves
4. Promote to production:
   npx sanity dataset copy staging production
5. audio.kfbg.org updates instantly
```

### Adding a new journey

```
1. Studio → Journeys → + New Journey
2. Set status to Hidden while building
3. Add all chapters with audio URLs and photos
4. Assign speaker, upload map images
5. Set status to Coming Soon or Published
6. Click Publish
```

### Updating audio files

Audio files are hosted on the KFBG server, not in Sanity. Update audio by:
1. Upload new MP3 to KFBG server at the same path
2. Or update the Audio URL field in the relevant Chapter in Sanity Studio

---

## Deep Link QR Codes

Each chapter can be linked directly. Use these URL formats for on-site QR codes:

```
https://audio.kfbg.org/index.html#journey=grounding-walk&chapter=1
https://audio.kfbg.org/index.html#journey=grounding-walk&chapter=2
https://audio.kfbg.org/index.html#journey=grounding-walk&chapter=3
https://audio.kfbg.org/index.html#journey=grounding-walk&chapter=4
https://audio.kfbg.org/index.html#journey=grounding-walk&chapter=5
```

For staging, replace `audio.kfbg.org` with `ryansham.github.io/kfbg-audio-journey`.

---

## Map Images

| Image | Path | Recommended size |
|---|---|---|
| Trail map thumbnail | `images/journeys/grounding-walk/grounding-walk-map-preview.jpg` | 1500px+ wide, PNG or JPG |
| Full KFBG farm map | `images/maps/kfbg-map-full.jpg` | 1500px+ wide, PNG or JPG |

Maps can also be uploaded via Sanity Studio (Journey → Map Preview Image / Map Full Image). Sanity CDN serves the original at full resolution for sharp zoom.

---

## Deployment

### GitHub Pages (staging — automatic)

Push to the `main` branch. GitHub Pages serves the site automatically at `ryansham.github.io/kfbg-audio-journey`. No build step required — the app is a single HTML file.

### KFBG subdomain (production — manual)

Copy all files from the repository root to the KFBG server via FTP/SFTP:

```
index.html
sw.js
manifest.json
KFBG_Logo.png
og-image.jpg
images/  (entire folder)
audio/   (entire folder)
```

The `studio/` folder does **not** need to be copied to the server.

When to re-deploy code to the server:
- After bug fixes or new features (generated via Claude)
- `sw.js` version must be bumped with each deploy to invalidate old caches

When **not** needed:
- Content changes via Sanity Studio → updates instantly, no deployment

### Promoting staging content to production

```bash
cd studio/
npx sanity dataset copy staging production
```

---

## Sanity Studio Setup (one-time)

```bash
# From the studio/ folder
npm install
npm run dev      # Local preview at http://localhost:3333
npm run deploy   # Deploy to https://kfbg-audio-journey.sanity.studio
```

After deploying once, all content editing happens in the browser. Terminal is not required for day-to-day use.

### CORS origins (required for API access)

Add these in `sanity.io/manage` → KFBG Audio Journey → API → CORS Origins:

| Origin | Credentials |
|---|---|
| `https://ryansham.github.io` | ✅ Allow |
| `https://audio.kfbg.org` | ✅ Allow |
| `http://localhost:3333` | ✅ Allow |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML/CSS/JS — single file, no framework, no build step |
| Fonts | Cormorant Garamond, DM Sans, Noto Serif TC (Google Fonts) |
| CMS | Sanity (hosted, free tier) |
| Hosting — staging | GitHub Pages |
| Hosting — production | KFBG server (audio.kfbg.org) |
| Audio hosting | KFBG server |
| Image CDN | Sanity CDN (cdn.sanity.io) |
| Offline | Service Worker + Cache API (3 separate caches) |
| PWA | Web App Manifest + Service Worker |

---

## Browser Support

| Platform | Browser | Install method |
|---|---|---|
| iOS 16+ | Safari | Share → Add to Home Screen |
| Android | Chrome | ⋮ menu → Install App |
| Desktop | Chrome, Edge, Safari | Address bar install prompt |

---

## Image Specifications

| Asset | Dimensions | Format | Notes |
|---|---|---|---|
| Journey card (home) | 1600×900 | JPG | 16:9, focal point centred |
| Chapter photo | 1200×675 | JPG | 16:9 |
| Speaker profile | 400×400 | JPG | Square, head and shoulders |
| Trail map | 1500px+ wide | PNG preferred | Portrait, cream background |
| OG social image | 1200×630 | JPG | ~1.91:1 |
| PWA icon | 512×512 | PNG | Square, white background |

---

## Credits

**Design & Development:** @ryansham.martechtalks
**Organisation:** Kadoorie Farm and Botanic Garden (KFBG)
**Audio Content & Voice:** Dr. Stanley Chan
**Audio Co-design:** KFBG & Dr. Stanley Chan
