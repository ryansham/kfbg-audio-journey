/* ── KFBG SHARED NAV — inject into any page ──────────────────────
   Usage: <script src="nav.js"></script>
   Requires: lang, setLang(), dk() defined on page, or standalone mode
──────────────────────────────────────────────────────────────────── */
(function(){
  const UTM = '?utm_source=kfbg_audio_journey&utm_medium=pwa&utm_campaign=audio_journey';
  const LINKS = {
    home:   { en:'https://kfbg.org/en/',              tc:'https://kfbg.org/tc/' },
    events: { en:'https://kfbg.org/en/event-calendar', tc:'https://kfbg.org/tc/event-calendar' },
    donate: { en:'https://kfbg.org/en/donation',       tc:'https://kfbg.org/tc/donation' },
  };
  const SOCIALS = [
    { label:'Facebook', href:'https://www.facebook.com/KadoorieFarmAndBotanicGarden/'+UTM,
      svg:'<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>' },
    { label:'Instagram', href:'https://www.instagram.com/kfbg.official/'+UTM,
      svg:'<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="currentColor" stroke-width="2"/>' },
    { label:'YouTube', href:'https://www.youtube.com/@KadoorieFarm'+UTM,
      svg:'<path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#4A5C3A"/>' },
    { label:'LinkedIn', href:'https://www.linkedin.com/company/kfbg/'+UTM,
      svg:'<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>' },
    { label:'Weibo', href:'https://weibo.com/kfbg'+UTM,
      svg:'<path d="M10.1 20c-3.87 0-7-1.79-7-4s3.13-4 7-4 7 1.79 7 4-3.14 4-7 4zm0-6.5c-2.98 0-5.4 1.12-5.4 2.5S7.12 18.5 10.1 18.5s5.4-1.12 5.4-2.5-2.42-2.5-5.4-2.5zM8.5 16.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm3 .5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zM18.5 7c-.17 0-.34.01-.5.04A4.5 4.5 0 0 0 10 8.5h-.5A3.5 3.5 0 0 0 6 12.5v.04A8.4 8.4 0 0 1 3.1 12C3.1 8.69 6.23 6 10.1 6c2.11 0 4 .79 5.35 2.06A3.98 3.98 0 0 1 18.5 7z"/>'},
  ];

  // CSS injected once
  if (!document.getElementById('kfbg-nav-styles')) {
    const s = document.createElement('style');
    s.id = 'kfbg-nav-styles';
    s.textContent = `
:root{--olive:#4A5C3A;--olive-mid:#3B4A2F;--olive-light:#8A9A78;--cream:#F7F3EC;--sand:#EEEBE4;--border:#D8D3CB;--text:#1E2418;--text-mid:#444;--text-muted:#7A7A6A;--gold:#C4A96A;--nav-h:54px;--fs:1rem;}
[data-lang="en"] .kn-tc{display:none!important;}[data-lang="zh"] .kn-en{display:none!important;}
.kn-en,.kn-tc{display:inline;}
/* top nav */
#kfbg-topnav{position:fixed;top:0;left:0;right:0;z-index:300;height:var(--nav-h);background:rgba(247,243,236,0.97);backdrop-filter:blur(10px);border-bottom:1px solid var(--border);padding:0 12px;display:flex;align-items:center;gap:8px;}
#kfbg-topnav .nav-logo{height:28px;display:block;flex-shrink:0;cursor:pointer;}
#kfbg-topnav .nav-spacer{flex:1;}
#kfbg-topnav .nav-title{font-size:0.78rem;color:var(--text-muted);flex:1;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;}
#kfbg-topnav .back-btn{display:inline-flex;align-items:center;gap:5px;font-size:0.78rem;color:var(--olive);text-decoration:none;font-weight:500;flex-shrink:0;padding:6px 0;}
#kfbg-topnav .back-btn svg{width:18px;height:18px;}
.btn-hamburger{width:40px;height:40px;border-radius:10px;background:var(--olive);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.btn-hamburger svg{width:18px;height:18px;stroke:#fff;stroke-width:2;fill:none;stroke-linecap:round;}
/* drawer */
.kfbg-drawer-overlay{position:fixed;inset:0;z-index:400;background:rgba(0,0,0,0);pointer-events:none;transition:background 0.3s;}
.kfbg-drawer-overlay.open{background:rgba(0,0,0,0.35);pointer-events:all;}
.kfbg-drawer{position:fixed;top:0;right:0;bottom:0;width:min(320px,88vw);z-index:500;background:var(--cream);box-shadow:-8px 0 32px rgba(0,0,0,0.15);transform:translateX(100%);transition:transform 0.32s cubic-bezier(0.32,0.72,0,1);display:flex;flex-direction:column;overflow-y:auto;}
.kfbg-drawer.open{transform:translateX(0);}
.drawer-head{padding:18px 16px 14px;background:var(--olive);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
.drawer-logo{height:26px;}
.btn-close-drawer{background:rgba(255,255,255,0.12);border:none;color:rgba(247,243,236,0.7);width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;}
.drawer-body{padding:18px 16px;flex:1;display:flex;flex-direction:column;gap:0;}
.drawer-section{margin-bottom:22px;}
.drawer-section-label{font-size:0.58rem;letter-spacing:0.18em;text-transform:uppercase;color:var(--olive-light);margin-bottom:10px;font-weight:600;}
/* lang */
.lang-row{display:flex;gap:8px;}
.lang-opt{flex:1;padding:11px;border:2px solid var(--border);border-radius:10px;background:transparent;font-size:0.82rem;font-family:inherit;font-weight:500;color:var(--text-muted);cursor:pointer;text-align:center;transition:all 0.2s;}
.lang-opt.active{border-color:var(--olive);background:var(--olive);color:#fff;}
/* font slider */
.fs-slider-row{display:flex;align-items:center;gap:10px;}
.fs-icon{font-size:0.75rem;color:var(--text-muted);flex-shrink:0;font-family:inherit;}
.fs-icon.big{font-size:1.1rem;}
input.fs-slider{flex:1;height:4px;-webkit-appearance:none;appearance:none;background:var(--border);border-radius:2px;outline:none;cursor:pointer;}
input.fs-slider::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;border-radius:50%;background:var(--olive);cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.18);}
input.fs-slider::-moz-range-thumb{width:24px;height:24px;border-radius:50%;background:var(--olive);border:none;cursor:pointer;}
/* download */
.btn-dl-drawer{width:100%;padding:13px 16px;background:var(--olive);color:#fff;border:none;border-radius:12px;font-size:0.85rem;font-family:inherit;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;transition:opacity 0.2s;}
.btn-dl-drawer:hover{opacity:0.88;}
.btn-dl-drawer:disabled{opacity:0.45;cursor:default;}
.btn-del-cache{width:100%;padding:10px 16px;background:transparent;color:#c0392b;border:1px solid #e8b4b0;border-radius:10px;font-size:0.78rem;font-family:inherit;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:8px;transition:all 0.2s;}
.btn-del-cache:hover{background:#fdf2f2;}
.dl-prog-wrap{margin-top:6px;display:none;}
.dl-prog-bar{height:4px;background:var(--sand);border-radius:2px;overflow:hidden;}
.dl-prog-fill{height:100%;background:var(--olive);width:0%;transition:width 0.3s;border-radius:2px;}
.dl-prog-text{font-size:0.7rem;color:var(--text-muted);margin-top:5px;}
/* links */
.drawer-link{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:var(--sand);border-radius:10px;text-decoration:none;color:var(--text-mid);font-size:0.82rem;margin-bottom:8px;transition:background 0.18s;min-height:44px;}
.drawer-link:hover{background:var(--border);}
.drawer-link svg{width:13px;height:13px;stroke:var(--text-muted);fill:none;stroke-width:2;flex-shrink:0;}
/* socials */
.social-row-drawer{display:flex;gap:10px;flex-wrap:wrap;}
.social-btn-d{width:40px;height:40px;border-radius:50%;background:var(--olive);display:flex;align-items:center;justify-content:center;text-decoration:none;transition:opacity 0.2s;flex-shrink:0;}
.social-btn-d:hover{opacity:0.78;}
.social-btn-d svg{width:16px;height:16px;fill:#fff;stroke:none;}
/* update banner */
.kfbg-update-banner{position:fixed;bottom:0;left:0;right:0;z-index:600;background:var(--olive-mid);padding:12px 16px;display:none;align-items:center;justify-content:space-between;gap:12px;}
.kfbg-update-banner.show{display:flex;}
.kfbg-update-banner p{font-size:0.78rem;color:rgba(247,243,236,0.88);flex:1;}
.kfbg-update-banner p strong{color:#fff;}
.btn-update-reload{background:var(--gold);color:var(--olive-mid);border:none;padding:8px 16px;border-radius:100px;font-size:0.78rem;font-weight:600;cursor:pointer;white-space:nowrap;font-family:inherit;}
.btn-update-dismiss{background:transparent;border:none;color:rgba(247,243,236,0.4);font-size:20px;cursor:pointer;}
    `;
    document.head.appendChild(s);
  }

  function getLang(){ return document.documentElement.getAttribute('data-lang')||'zh'; }
  function dk(){ return getLang()==='zh'?'tc':'en'; }
  function getLinkUrl(key){ const l=LINKS[key]; return (l[dk()]||l.en)+UTM; }

  // inject nav HTML
  function buildNav(){
    const isHome = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
    const nav = document.createElement('nav');
    nav.id='kfbg-topnav';
    nav.innerHTML=`
      <a href="index.html"><img src="KFBG_Logo_Square.png" class="nav-logo" alt="KFBG" onerror="this.style.display='none'"/></a>
      ${isHome
        ? `<div class="nav-spacer"></div>`
        : `<a href="index.html" class="back-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            <span class="kn-en">Journeys</span><span class="kn-tc">旅程</span>
          </a>
          <div id="kfbg-nav-title" class="nav-title"></div>`
      }
      <button class="btn-hamburger" onclick="kfbgNavOpen()" aria-label="Menu">
        <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
    `;
    document.body.prepend(nav);

    // overlay + drawer
    const overlay=document.createElement('div');
    overlay.className='kfbg-drawer-overlay';
    overlay.id='kfbgOverlay';
    overlay.onclick=kfbgNavClose;
    document.body.appendChild(overlay);

    const drawer=document.createElement('div');
    drawer.className='kfbg-drawer';
    drawer.id='kfbgDrawer';
    drawer.innerHTML=`
      <div class="drawer-head">
        <img src="KFBG_Logo_Square.png" class="drawer-logo" alt="KFBG" onerror="this.style.display='none'"/>
        <button class="btn-close-drawer" onclick="kfbgNavClose()">×</button>
      </div>
      <div class="drawer-body">

        <div class="drawer-section">
          <div class="drawer-section-label"><span class="kn-en">Language</span><span class="kn-tc">語言</span></div>
          <div class="lang-row">
            <button class="lang-opt" id="kn-lang-en" onclick="kfbgSetLang('en')">English</button>
            <button class="lang-opt" id="kn-lang-zh" onclick="kfbgSetLang('zh')">繁中</button>
          </div>
        </div>

        <div class="drawer-section">
          <div class="drawer-section-label"><span class="kn-en">Text size</span><span class="kn-tc">文字大小</span></div>
          <div class="fs-slider-row">
            <span class="fs-icon">A</span>
            <input type="range" class="fs-slider" id="kn-fs-slider" min="0" max="5" step="1" value="2" oninput="kfbgSetFont(this.value)"/>
            <span class="fs-icon big">A</span>
          </div>
        </div>

        <div class="drawer-section">
          <div class="drawer-section-label"><span class="kn-en">Offline</span><span class="kn-tc">離線使用</span></div>
          <button class="btn-dl-drawer" id="kn-btn-dl" onclick="kfbgDownload()">
            <span class="kn-en">Download audio chapters</span>
            <span class="kn-tc">下載音頻章節</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
          <div class="dl-prog-wrap" id="kn-dl-wrap">
            <div class="dl-prog-bar"><div class="dl-prog-fill" id="kn-dl-fill"></div></div>
            <div class="dl-prog-text" id="kn-dl-text"></div>
          </div>
          <button class="btn-del-cache" id="kn-btn-del" onclick="kfbgDeleteCache()">
            <span class="kn-en">Delete downloaded audio</span>
            <span class="kn-tc">刪除已下載音頻</span>
            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>

        <div class="drawer-section">
          <div class="drawer-section-label"><span class="kn-en">KFBG</span><span class="kn-tc">嘉道理農場</span></div>
          <a id="kn-link-home" class="drawer-link" target="_blank" rel="noopener">
            <span class="kn-en">Homepage</span><span class="kn-tc">主頁</span>
            <svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
          <a id="kn-link-events" class="drawer-link" target="_blank" rel="noopener">
            <span class="kn-en">Events &amp; Programmes</span><span class="kn-tc">活動及課程</span>
            <svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
          <a id="kn-link-donate" class="drawer-link" target="_blank" rel="noopener">
            <span class="kn-en">Donate</span><span class="kn-tc">捐款</span>
            <svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </div>

        <div class="drawer-section">
          <div class="drawer-section-label"><span class="kn-en">Follow us</span><span class="kn-tc">關注我們</span></div>
          <div class="social-row-drawer">
            ${SOCIALS.map(s=>`<a href="${s.href}" class="social-btn-d" target="_blank" rel="noopener" aria-label="${s.label}"><svg viewBox="0 0 24 24">${s.svg}</svg></a>`).join('')}
          </div>
        </div>

      </div>
    `;
    document.body.appendChild(drawer);

    // update banner
    const banner=document.createElement('div');
    banner.className='kfbg-update-banner';
    banner.id='kfbgUpdateBanner';
    banner.innerHTML=`
      <p class="kn-en"><strong>New version available.</strong> Refresh to update.</p>
      <p class="kn-tc"><strong>有新版本。</strong>重新整理以更新。</p>
      <button class="btn-update-reload" onclick="window.location.reload(true)"><span class="kn-en">Refresh</span><span class="kn-tc">更新</span></button>
      <button class="btn-update-dismiss" onclick="document.getElementById('kfbgUpdateBanner').classList.remove('show')">×</button>
    `;
    document.body.appendChild(banner);

    refreshNavState();
  }

  function refreshNavState(){
    const lang=getLang();
    // lang buttons
    document.getElementById('kn-lang-en')?.classList.toggle('active',lang==='en');
    document.getElementById('kn-lang-zh')?.classList.toggle('active',lang==='zh');
    // links
    ['home','events','donate'].forEach(k=>{
      const el=document.getElementById('kn-link-'+k);
      if(el) el.href=getLinkUrl(k);
    });
    // font slider
    const fs=parseInt(localStorage.getItem('kfbg-fs')||'2');
    const slider=document.getElementById('kn-fs-slider');
    if(slider) slider.value=fs;
    document.documentElement.style.setProperty('--fs',['0.88rem','0.94rem','1rem','1.08rem','1.16rem','1.25rem'][fs]||'1rem');
    checkCacheNavState();
  }

  async function checkCacheNavState(){
    if(!('caches' in window)) return;
    try{
      const c=await caches.open('kfbg-audio-v1');
      const keys=await c.keys();
      const hasAudio=keys.some(r=>r.url.endsWith('.mp3'));
      const btn=document.getElementById('kn-btn-del');
      if(btn) btn.style.display=hasAudio?'flex':'none';
    }catch(e){}
  }

  // ── GLOBALS ──
  window.kfbgNavOpen=function(){
    document.getElementById('kfbgDrawer')?.classList.add('open');
    document.getElementById('kfbgOverlay')?.classList.add('open');
    refreshNavState();
  };
  window.kfbgNavClose=function(){
    document.getElementById('kfbgDrawer')?.classList.remove('open');
    document.getElementById('kfbgOverlay')?.classList.remove('open');
  };
  window.kfbgSetLang=function(l){
    document.documentElement.setAttribute('data-lang',l);
    document.documentElement.lang=l==='zh'?'zh-Hant':'en';
    localStorage.setItem('kfbg-lang',l);
    refreshNavState();
    // call page-level setLang if available
    if(typeof window.setLang==='function') window.setLang(l);
  };
  window.kfbgSetFont=function(v){
    const sizes=['0.88rem','0.94rem','1rem','1.08rem','1.16rem','1.25rem'];
    document.documentElement.style.setProperty('--fs',sizes[v]||'1rem');
    localStorage.setItem('kfbg-fs',v);
  };
  window.kfbgDownload=async function(){
    if(!('caches' in window)) return;
    // get audio list from page or use window.CH
    const chapters=window.CH||[];
    if(!chapters.length){ alert('Open a journey page to download its audio.'); return; }
    const btn=document.getElementById('kn-btn-dl');
    const wrap=document.getElementById('kn-dl-wrap');
    const fill=document.getElementById('kn-dl-fill');
    const text=document.getElementById('kn-dl-text');
    btn.disabled=true; wrap.style.display='block';
    const lang=getLang();
    try{
      const c=await caches.open('kfbg-audio-v1');
      for(let i=0;i<chapters.length;i++){
        const url=chapters[i].audio;
        text.textContent=(lang==='zh'?'下載中 ':'Downloading ')+`${i+1}/${chapters.length}...`;
        if(!await c.match(url).catch(()=>null)){
          const r=await fetch(url); if(r.ok) await c.put(url,r);
        }
        fill.style.width=Math.round(((i+1)/chapters.length)*100)+'%';
      }
      btn.innerHTML='<span class="kn-en">Downloaded ✓</span><span class="kn-tc">已下載 ✓</span>';
      text.textContent=lang==='zh'?'可離線收聽':'Ready for offline use';
      checkCacheNavState();
    }catch(e){btn.disabled=false;text.textContent='Error — please retry';}
  };
  window.kfbgDeleteCache=async function(){
    const lang=getLang();
    const msg=lang==='zh'?'確定要刪除所有已下載的音頻嗎？':'Delete all downloaded audio files?';
    if(!confirm(msg)) return;
    try{
      await caches.delete('kfbg-audio-v1');
      const btn=document.getElementById('kn-btn-del');
      if(btn) btn.style.display='none';
      const dlBtn=document.getElementById('kn-btn-dl');
      if(dlBtn){dlBtn.disabled=false;dlBtn.innerHTML='<span class="kn-en">Download audio chapters</span><span class="kn-tc">下載音頻章節</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';}
      const fill=document.getElementById('kn-dl-fill');
      if(fill) fill.style.width='0%';
      const wrap=document.getElementById('kn-dl-wrap');
      if(wrap) wrap.style.display='none';
    }catch(e){}
  };
  window.kfbgSetNavTitle=function(t){ const el=document.getElementById('kfbg-nav-title'); if(el) el.textContent=t; };

  // build on DOMReady
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',buildNav);
  } else {
    buildNav();
  }
  // restore lang + font on load
  document.addEventListener('DOMContentLoaded',()=>{
    const sl=localStorage.getItem('kfbg-lang')||'zh';
    document.documentElement.setAttribute('data-lang',sl);
    document.documentElement.lang=sl==='zh'?'zh-Hant':'en';
    const fs=parseInt(localStorage.getItem('kfbg-fs')||'2');
    document.documentElement.style.setProperty('--fs',['0.88rem','0.94rem','1rem','1.08rem','1.16rem','1.25rem'][fs]);
  });
})();
