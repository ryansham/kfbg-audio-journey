/* KFBG Audio Journey — SW v43 */
const PAGE_CACHE='kfbg-pages-v43';
const AUDIO_CACHE='kfbg-audio-v1';
const IMAGE_CACHE='kfbg-images-v1';
const PRECACHE=[
  './', './index.html', './manifest.json',
  './KFBG_Logo.png', './og-image.jpg',
  './images/maps/kfbg-map-full.jpg',
  './images/journeys/grounding-walk/grounding-walk-map-preview.jpg.jpg',
  './images/journeys/grounding-walk/grounding-walk-card.jpg',
  './images/journeys/grounding-walk/grounding-walk-ch01.jpg',
  './images/journeys/grounding-walk/grounding-walk-ch02.jpg',
  './images/journeys/grounding-walk/grounding-walk-ch03.jpg',
  './images/journeys/grounding-walk/grounding-walk-ch04.jpg',
  './images/journeys/grounding-walk/grounding-walk-ch05.jpg',
  './images/speakers/stanley-chan.jpg',
];
self.addEventListener('install',e=>{e.waitUntil(caches.open(PAGE_CACHE).then(c=>c.addAll(PRECACHE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==PAGE_CACHE&&k!==AUDIO_CACHE&&k!==IMAGE_CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.matchAll({includeUncontrolled:true})).then(clients=>clients.forEach(c=>c.postMessage({type:'SW_UPDATED',version:PAGE_CACHE}))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);const path=url.pathname;
  const isAudio=path.includes('/audio/')&&path.endsWith('.mp3');
  const isSanityImg=url.hostname.includes('cdn.sanity.io');
  const isSanityApi=url.hostname.includes('sanity.io')&&!isSanityImg;
  const isLocalImg=(path.includes('/images/')&&(path.endsWith('.jpg')||path.endsWith('.png')));
  const isPage=path==='/'||path.endsWith('/index.html')||path.endsWith('/manifest.json')||path.endsWith('/KFBG_Logo.png')||path.endsWith('/og-image.jpg');

  if(isAudio){
    // Audio: cache-first (user explicitly downloaded)
    e.respondWith(caches.open(AUDIO_CACHE).then(c=>c.match(e.request).then(cached=>cached||fetch(e.request).then(res=>{if(res.ok)c.put(e.request,res.clone());return res;}))));
  } else if(isSanityImg||isLocalImg){
    // Images: check IMAGE_CACHE first, then PAGE_CACHE, then network
    e.respondWith(
      caches.open(IMAGE_CACHE).then(ic=>ic.match(e.request).then(cached=>{
        if(cached) return cached;
        return caches.open(PAGE_CACHE).then(pc=>pc.match(e.request).then(cached2=>{
          if(cached2) return cached2;
          return fetch(e.request).then(res=>{
            if(res.ok) pc.put(e.request,res.clone());
            return res;
          });
        }));
      }))
    );
  } else if(isSanityApi){
    // Sanity API: network-first, cache for offline
    e.respondWith(fetch(e.request).then(res=>{if(res.ok)caches.open(PAGE_CACHE).then(c=>c.put(e.request,res.clone()));return res;}).catch(()=>caches.match(e.request)));
  } else if(isPage){
    const cleanReq=(path.endsWith('/index.html')||path==='/')?new Request(url.origin+path):e.request;
    e.respondWith(fetch(cleanReq).then(res=>{if(res.ok)caches.open(PAGE_CACHE).then(c=>c.put(cleanReq,res.clone()));return res;}).catch(()=>caches.match(cleanReq)||caches.match('./index.html')));
  }
});
