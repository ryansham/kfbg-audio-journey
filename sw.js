/* KFBG Audio Journey — Service Worker v3 */
const PAGE_CACHE = 'kfbg-pages-v1';
const AUDIO_CACHE = 'kfbg-audio-v1';

// Pages & assets to pre-cache on install (no audio — too large for auto)
const PRECACHE = [
  './',
  './index.html',
  './journey.html',
  './manifest.json',
  './KFBG_Logo_Square.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(PAGE_CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== PAGE_CACHE && k !== AUDIO_CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isAudio = url.pathname.endsWith('.mp3');
  const isPage = PRECACHE.some(p => url.pathname.endsWith(p.replace('./',''))) || url.pathname === '/';
  const cacheName = isAudio ? AUDIO_CACHE : PAGE_CACHE;

  if (isAudio || isPage) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res && res.ok) {
            caches.open(cacheName).then(c => c.put(e.request, res.clone()));
          }
          return res;
        }).catch(() => cached);
      })
    );
  }
});
