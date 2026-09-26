/* KFBG Audio Journey — SW v64 */
const PAGE_CACHE='kfbg-pages-v64';   // 版本號要同 index.html 嘅 APP_VER 一樣（頁面靠佢判斷自己係咪舊版）
const AUDIO_CACHE='kfbg-audio-v1';
const IMAGE_CACHE='kfbg-images-v1';
// 字型唔會變，放一個唔跟版本嘅快取：以前放 PAGE_CACHE，每次改版都清走，改版後第一次離線開要多等 3 秒先出畫面
const FONT_CACHE='kfbg-fonts-v1';
// staging 喺 /kfbg-audio-journey/、正式喺 /：用 SW 自己嘅範圍，唔寫死 '/'（以前 staging 嘅資料夾網址唔經 SW，離線開唔到）
const SCOPE=self.registration&&self.registration.scope?new URL(self.registration.scope).pathname:'/';
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
  // './' 同 index.html 係同一份（每次裝多下載 176KB），離線時資料夾網址會用 index.html 頂上；192 圖示只有 manifest 用，頁面冇讀
  './index.html', './manifest.json',
  './KFBG_Logo.png',
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
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('kfbg-')&&![PAGE_CACHE,AUDIO_CACHE,IMAGE_CACHE,FONT_CACHE].includes(k)).map(k=>caches.delete(k)))).then(()=>self.clients.matchAll({includeUncontrolled:true})).then(clients=>clients.filter(c=>!self.registration||c.url.startsWith(self.registration.scope)).forEach(c=>c.postMessage({type:'SW_UPDATED',version:PAGE_CACHE}))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);const path=url.pathname;
  const isAudio=path.endsWith('.mp3'); // match by extension so a Sanity-hosted audio_url still gets offline caching
  // 要完全等於：API 嘅 apicdn.sanity.io 都包含 'cdn.sanity.io'，以前被當成圖片行快取優先，CMS 改咗嘢舊用戶永遠睇唔到
  const isSanityImg=url.hostname==='cdn.sanity.io';
  const isSanityApi=url.hostname.includes('sanity.io')&&!isSanityImg;
  const isLocalImg=(path.includes('/images/')&&(path.endsWith('.jpg')||path.endsWith('.png')));
  const isFont=url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com';
  const isPage=path===SCOPE||path.endsWith('/index.html')||path.endsWith('/manifest.json')||path.endsWith('/KFBG_Logo.png')||path.endsWith('/og-image.jpg');

  if(isAudio){
    // Audio: cache-first (user explicitly downloaded)
    e.respondWith(caches.open(AUDIO_CACHE).then(c=>c.match(e.request).then(cached=>cached||fetch(e.request).then(res=>{if(res.status===200)c.put(e.request,res.clone());return res;})))); // only full 200s are cacheable — Cache API rejects 206 range responses
  } else if(isSanityImg||isLocalImg){
    // Images: check IMAGE_CACHE first, then PAGE_CACHE (precache), then network. 睇過嘅相存入 IMAGE_CACHE：
    // 以前存 PAGE_CACHE，每次改版都清走，未撳下載嘅人睇過嘅相離線就冇咗
    e.respondWith(
      caches.open(IMAGE_CACHE).then(ic=>ic.match(e.request).then(cached=>{
        if(cached) return cached;
        return caches.open(PAGE_CACHE).then(pc=>pc.match(e.request).then(cached2=>{
          if(cached2) return cached2;
          return fetch(e.request).then(res=>{
            if(res.ok) ic.put(e.request,res.clone());
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
    e.respondWith(caches.open(FONT_CACHE).then(c=>c.match(e.request).then(hit=>{
      const net=fetch(e.request).then(res=>{if(res.ok||res.type==='opaque')c.put(e.request,res.clone());return res;});
      net.catch(()=>{});
      if(hit)return hit;
      const empty=()=>new Response('',{headers:{'Content-Type':url.hostname==='fonts.googleapis.com'?'text/css':'font/woff2'}});
      return Promise.race([net,new Promise(r=>setTimeout(r,3000,null))]).then(r=>r||empty()).catch(empty);
    })));
  } else if(isPage){
    // 快取優先，背景去網絡攞新版存低（Ryan 2026-09-27：飛行模式冷開要黑屏約 5 秒）。以前網絡優先等 3 秒，iPhone 離線時
    // fetch 唔會即刻失敗、onLine 又報 true，所以每次都等足。有新版時：瀏覽器開頁會自己檢查 sw.js → 新 SW 裝好發 SW_UPDATED →
    // 頁面見到自己版本號舊咗就重新載入（見 index.html applyUpdate），所以唔會卡喺舊版；代價係改版後第一次開會先見舊版一兩秒
    const isDoc=path===SCOPE||path.endsWith('/index.html');
    // no-cache forces revalidation so a heuristically-cached page can't outlive a release
    const cleanReq=isDoc?new Request(url.origin+path,{cache:'no-cache'}):e.request;
    const net=fetch(cleanReq).then(res=>{if(res.ok){const copy=res.clone();caches.open(PAGE_CACHE).then(c=>c.put(cleanReq,copy));}return res;});
    net.catch(()=>{});
    if(e.waitUntil)e.waitUntil(net.catch(()=>{}));   // 交咗快取之後，背景更新都要做完
    e.respondWith((async()=>{
      const hit=await caches.match(cleanReq)||(isDoc?await caches.match('./index.html'):null);   // 資料夾網址用 index.html 頂；manifest 等唔好
      return hit||net.catch(()=>Response.error());   // 第一次嚟冇快取：等網絡
    })());
  }
});
