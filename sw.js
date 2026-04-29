/* KFBG Audio Journey — Service Worker v1 */
const CACHE = 'kfbg-v1';
const STATIC = [
  './',
  './index.html',
  './journey.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:wght@300;400;500&family=Noto+Serif+TC:wght@400;500&display=swap',
];
const AUDIO = [
  '/upload/audio-journey/01_Final_v01_20260211.mp3',
  '/upload/audio-journey/02_Final_v01_20260211.mp3',
  '/upload/audio-journey/03_Final_v01_20260211.mp3',
  '/upload/audio-journey/04_Final_v01_20260211.mp3',
  '/upload/audio-journey/05_Final_v01_20260211.mp3',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(STATIC))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isAudio = AUDIO.some(a => url.pathname.includes(a));
  const isStatic = STATIC.some(s => e.request.url.includes(s) || url.pathname === '/');

  if (isAudio || isStatic) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res && res.ok) {
            caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          }
          return res;
        }).catch(() => cached);
      })
    );
  }
});
