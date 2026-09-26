/* KFBG Audio Journey — SW v57 */
const PAGE_CACHE='kfbg-pages-v57';   // 版本號要同 index.html 嘅 APP_VER 一樣（頁面靠佢判斷自己係咪舊版）
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
  // images/lockscreen.jpg (165KB, lock-screen art) likewise: fetched on first play, stored on Download.
  './', './index.html', './manifest.json',
  './KFBG_Logo.png', './KFBG_Logo_192.png',
  './images/speakers/stanley-chan.jpg', // genuinely displayed — CMS speaker has no photo, so the local file is the live one
];
// cache:'reload' — addAll() otherwise reads the browser's HTTP cache, which can bake a stale
// index.html into a brand-new cache. Seen live: kfbg-pages-v48 holding a v45 page.
// iOS 離線（飛行模式）時 fetch 唔一定即刻失敗，可以一直唔返。網絡優先嘅請求冇時限，respondWith 就永遠等，
// 主畫面 app 一開就黑屏（Ryan 2026-09-26 真機）。過咗時限：有快取就用快取；冇快取先繼續等網絡（第一次嚟、網慢）
function netFirst(req,ms,fromCache,save){
  const offline=self.navigator&&self.navigator.onLine===false;
  const net=offline?Promise.reject(new Error('offline')):fetch(req).then(res=>{if(save)save(res.clone());return res;});
  net.catch(()=>{});
  const late=new Promise(r=>setTimeout(r,ms,'late'));
  return Promise.race([net,late])
    .then(r=>r!=='late'?r:fromCache().then(hit=>hit||net))
    .catch(()=>fromCache().then(hit=>hit||net))
    .catch(()=>Response.error());
}
self.addEventListener('install',e=>{e.waitUntil(caches.open(PAGE_CACHE).then(c=>c.addAll(PRECACHE.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==PAGE_CACHE&&k!==AUDIO_CACHE&&k!==IMAGE_CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.matchAll({includeUncontrolled:true})).then(clients=>clients.forEach(c=>c.postMessage({type:'SW_UPDATED',version:PAGE_CACHE}))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);const path=url.pathname;
  const isAudio=path.endsWith('.mp3'); // match by extension so a Sanity-hosted audio_url still gets offline caching
  // 要完全等於：API 嘅 apicdn.sanity.io 都包含 'cdn.sanity.io'，以前被當成圖片行快取優先，CMS 改咗嘢舊用戶永遠睇唔到
  const isSanityImg=url.hostname==='cdn.sanity.io';
  const isSanityApi=url.hostname.includes('sanity.io')&&!isSanityImg;
  const isLocalImg=(path.includes('/images/')&&(path.endsWith('.jpg')||path.endsWith('.png')));
  const isFont=url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com';
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
    e.respondWith(netFirst(e.request,4000,()=>caches.match(e.request),res=>{if(res.ok)caches.open(PAGE_CACHE).then(c=>c.put(e.request,res));}));
  } else if(isFont){
    // Google Fonts：<head> 嘅樣式表會阻住畫面顯示，離線時等佢就成版唔出。快取優先（字型檔永遠唔變），背景更新；
    // 冇快取又等唔到就回空白，用後備字體照出版面。樣式表冇 crossorigin，回應係 opaque，都照存
    e.respondWith(caches.open(PAGE_CACHE).then(c=>c.match(e.request).then(hit=>{
      const net=fetch(e.request).then(res=>{if(res.ok||res.type==='opaque')c.put(e.request,res.clone());return res;});
      net.catch(()=>{});
      if(hit)return hit;
      const empty=()=>new Response('',{headers:{'Content-Type':url.hostname==='fonts.googleapis.com'?'text/css':'font/woff2'}});
      return Promise.race([net,new Promise(r=>setTimeout(r,3000,null))]).then(r=>r||empty()).catch(empty);
    })));
  } else if(isPage){
    // no-cache forces revalidation so a heuristically-cached page can't outlive a release
    const cleanReq=(path.endsWith('/index.html')||path==='/')?new Request(url.origin+path,{cache:'no-cache'}):e.request;
    e.respondWith(netFirst(cleanReq,3000,async()=>await caches.match(cleanReq)||await caches.match('./index.html'),res=>{if(res.ok)caches.open(PAGE_CACHE).then(c=>c.put(cleanReq,res));})); // 過咗 3 秒用快取：見 netFirst
  }
});
