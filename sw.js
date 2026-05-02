/* KFBG Audio Journey — Service Worker v6
   BUMP PAGE_CACHE on every deploy:
   'kfbg-pages-v6' → 'kfbg-pages-v7' etc.
*/
const PAGE_CACHE  = 'kfbg-pages-v6';
const AUDIO_CACHE = 'kfbg-audio-v1';

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './KFBG_Logo.png',
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
        keys.filter(k => k !== PAGE_CACHE && k !== AUDIO_CACHE)
            .map(k => caches.delete(k))
      ))
      .then(() => self.clients.matchAll({includeUncontrolled:true}))
      .then(clients => clients.forEach(c => c.postMessage({type:'SW_UPDATED', version:PAGE_CACHE})))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isAudio = url.pathname.includes('/audio/') && url.pathname.endsWith('.mp3');
  const isPage  = url.pathname === '/'
               || url.pathname.endsWith('/index.html')
               || url.pathname.endsWith('/manifest.json')
               || url.pathname.endsWith('/KFBG_Logo.png');

  if (isAudio) {
    // Cache-first: user-downloaded audio served from cache, else fetch
    e.respondWith(
      caches.open(AUDIO_CACHE).then(cache =>
        cache.match(e.request).then(cached =>
          cached || fetch(e.request).then(res => {
            if (res.ok) cache.put(e.request, res.clone());
            return res;
          })
        )
      )
    );
  } else if (isPage) {
    // Network-first: always try to get latest, fall back to cache offline
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) caches.open(PAGE_CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  }
});
