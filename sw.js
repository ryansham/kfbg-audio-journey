/* KFBG Audio Journey — SW v48 */
const PAGE_CACHE='kfbg-pages-v48';
const AUDIO_CACHE='kfbg-audio-v1';
const IMAGE_CACHE='kfbg-images-v1';
const PRECACHE=[
  // ponytail: app shell only. The journey images this app actually displays come from cdn.sanity.io
  // (measured on prod), so precaching the local copies cost every first visitor 1351KB for files
  // that never appear on screen — 77% of the old precache. They are still reachable on demand, and
  // the offline path is covered twice over: the image handler below caches whatever the page really
  // requests, and cacheImages() stores every real URL when the user taps Download.
  // Trade: a first visit that ALSO cannot reach Sanity falls back to the hardcoded chapter list,
  // whose local image paths are then uncached — that narrow case shows broken images.
  // og-image.jpg stays out too: only social scrapers read it, server-side.
  './', './index.html', './manifest.json',
  './KFBG_Logo.png', './KFBG_Logo_192.png',
  './images/speakers/stanley-chan.jpg', // genuinely displayed — CMS speaker has no photo, so the local file is the live one
];
self.addEventListener('install',e=>{e.waitUntil(caches.open(PAGE_CACHE).then(c=>c.addAll(PRECACHE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==PAGE_CACHE&&k!==AUDIO_CACHE&&k!==IMAGE_CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.matchAll({includeUncontrolled:true})).then(clients=>clients.forEach(c=>c.postMessage({type:'SW_UPDATED',version:PAGE_CACHE}))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);const path=url.pathname;
  const isAudio=path.endsWith('.mp3'); // match by extension so a Sanity-hosted audio_url still gets offline caching
  const isSanityImg=url.hostname.includes('cdn.sanity.io');
  const isSanityApi=url.hostname.includes('sanity.io')&&!isSanityImg;
  const isLocalImg=(path.includes('/images/')&&(path.endsWith('.jpg')||path.endsWith('.png')));
  const isPage=path==='/'||path.endsWith('/index.html')||path.endsWith('/manifest.json')||path.endsWith('/KFBG_Logo.png')||path.endsWith('/og-image.jpg');

  if(isAudio){
    // Audio: cache-first (user explicitly downloaded)
    e.respondWith(caches.open(AUDIO_CACHE).then(c=>c.match(e.request).then(cached=>cached||fetch(e.request).then(res=>{if(res.status===200)c.put(e.request,res.clone());return res;})))); // only full 200s are cacheable — Cache API rejects 206 range responses
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
    e.respondWith(fetch(cleanReq).then(res=>{if(res.ok)caches.open(PAGE_CACHE).then(c=>c.put(cleanReq,res.clone()));return res;}).catch(async()=>await caches.match(cleanReq)||await caches.match('./index.html'))); // await both so the app-shell fallback actually fires offline
  }
});
