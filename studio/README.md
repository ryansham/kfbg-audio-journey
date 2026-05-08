# KFBG Audio Journey — Sanity Studio

Content management system for the KFBG Self-guided Audio Journey PWA.

## Project info
- **Sanity Project ID:** bw3aid78
- **Dataset:** production
- **Studio URL (after deploy):** https://kfbg-audio-journey.sanity.studio

---

## First-time setup (one time only)

You need Node.js installed. Check: `node --version` (needs v18+)

```bash
# 1. Install dependencies
npm install

# 2. Run Studio locally to test
npm run dev
# Opens at http://localhost:3333

# 3. Deploy Studio to web (free Sanity hosting)
npm run deploy
# Studio becomes live at https://kfbg-audio-journey.sanity.studio
```

---

## Daily use (no terminal needed)

After deploying once, your team edits content at:
**https://kfbg-audio-journey.sanity.studio**

No terminal. No deployments. Just a browser.

---

## Schema overview

| Document | Purpose |
|---|---|
| **Journey** | One per audio journey — content, chapters, status, maps |
| **Speaker** | Reusable speaker profiles (Dr. Stanley Chan etc.) |
| **Site Settings** | App name, OG image, colours, notice bar, analytics |
| **UI Strings** | Every piece of interface text in EN and TC |

## Journey status

| Status | What it does |
|---|---|
| 🟢 Published | Fully live and accessible |
| 🟡 Coming Soon | Visible on home but locked — shows teaser text |
| ⚫ Hidden | Not shown in app at all |

Change status in Studio → Journey → flip the radio button → Publish.
Change goes live in the app within seconds.

---

## Adding a new Journey

1. In Studio → Journeys → click **+ New Journey**
2. Set status to **Hidden** while building
3. Add all chapters (drag to reorder)
4. Upload chapter images and enter audio URLs
5. Assign a Speaker
6. Upload map images
7. When ready: change status to **Published** → click **Publish**

---

## Audio files

Audio files are NOT stored in Sanity. They are hosted on the KFBG server.
In each Chapter, enter the full URL:
```
https://audio.kfbg.org/audio/grounding-walk/grounding-walk-ch01.mp3
```

---

## Credit
Built by @ryansham.martechtalks
