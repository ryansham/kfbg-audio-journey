/* KFBG Audio Journey — Service Worker v4
   VERSION STRATEGY:
   - PAGE_CACHE version bumps every deploy (change 'kfbg-pages-v4' → 'kfbg-pages-v5' etc.)
   - AUDIO_CACHE is user-triggered and persists across SW updates intentionally
   - On activation, old page caches are deleted; audio cache is preserved
   - Clients are notified via postMessage so they can show "update available" banner
*/
const PAGE_CACHE  = 'kfbg-pages-v4';   // ← BUMP THIS on every deploy
const AUDIO_CACHE = 'kfbg-audio-v1';   // ← Keep stable; user-downloaded audio persists

const PRECACHE = [
  './',
  './index.html',
  './journey.html',
  './manifest.json',
  './nav.js',
  './KFBG_Logo_Square.png',
];

// ── INSTALL: pre-cache pages ──
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(PAGE_CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())  // take over immediately
  );
});

// ── ACTIVATE: clear old page caches, keep audio ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(k => k !== PAGE_CACHE && k !== AUDIO_CACHE)
          .map(k => caches.delete(k))
      );
    }).then(() => {
      // notify all open clients that a new version is active
      return self.clients.matchAll({includeUncontrolled:true}).then(clients => {
        clients.forEach(c => c.postMessage({type:'SW_UPDATED', version: PAGE_CACHE}));
      });
    }).then(() => self.clients.claim())
  );
});

// ── FETCH: cache-first for pages & audio ──
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isAudio = url.pathname.endsWith('.mp3');
  const isPage  = PRECACHE.some(p => url.href.endsWith(p.replace('./','')))
                  || url.pathname === '/'
                  || url.pathname.endsWith('/index.html')
                  || url.pathname.endsWith('/journey.html')
                  || url.pathname.endsWith('/nav.js')
                  || url.pathname.endsWith('/manifest.json')
                  || url.pathname.endsWith('/KFBG_Logo_Square.png');

  if (isAudio) {
    // Audio: cache-first, update in background if online
    e.respondWith(
      caches.open(AUDIO_CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          return cached || fetch(e.request).then(res => {
            if (res.ok) cache.put(e.request, res.clone());
            return res;
          });
        })
      )
    );
  } else if (isPage) {
    // Pages: network-first so users always get latest if online, fallback to cache
    e.respondWith(
      fetch(e.request).then(res => {
        if (res.ok) {
          caches.open(PAGE_CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => caches.match(e.request))
    );
  }
});
