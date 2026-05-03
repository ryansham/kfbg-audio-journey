/* KFBG Audio Journey — SW v11
   BUMP PAGE_CACHE on every deploy */
const PAGE_CACHE='kfbg-pages-v11';
const AUDIO_CACHE='kfbg-audio-v1';
const PRECACHE=['./', './index.html', './manifest.json', './KFBG_Logo.png', './og-image.jpg'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(PAGE_CACHE).then(c=>c.addAll(PRECACHE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==PAGE_CACHE&&k!==AUDIO_CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.matchAll({includeUncontrolled:true}))
      .then(clients=>clients.forEach(c=>c.postMessage({type:'SW_UPDATED',version:PAGE_CACHE})))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  const path=url.pathname;
  const isAudio=path.includes('/audio/')&&path.endsWith('.mp3');
  // Match page regardless of query params or hash — strip them for cache lookup
  const isPage=path==='/'||path.endsWith('/index.html')||path.endsWith('/manifest.json')||path.endsWith('/KFBG_Logo.png')||path.endsWith('/og-image.jpg');

  if(isAudio){
    e.respondWith(
      caches.open(AUDIO_CACHE).then(c=>
        c.match(e.request).then(cached=>
          cached||fetch(e.request).then(res=>{if(res.ok)c.put(e.request,res.clone());return res;})
        )
      )
    );
  } else if(isPage){
    // For pages with query/hash (deep links), fetch network-first
    // Cache using the clean URL (no params) so it's reusable
    const cleanReq=path.endsWith('/index.html')||path==='/'
      ? new Request(url.origin+path)
      : e.request;
    e.respondWith(
      fetch(cleanReq).then(res=>{
        if(res.ok)caches.open(PAGE_CACHE).then(c=>c.put(cleanReq,res.clone()));
        return res;
      }).catch(()=>caches.match(cleanReq)||caches.match('./index.html'))
    );
  }
});
