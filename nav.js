/* ── KFBG SHARED NAV v5 ─────────────────────────────────────────
   - Shared hamburger nav across all pages
   - Persistent audio player that survives navigation
   - Pills moved to bottom bar
   - Logo: KFBG_Logo.png (bigger, in nav only — no logo in drawer header bar)
   - Download shows journey selector on home page
   - Delete: plain text link
   - Brand: EN="Kadoorie Farm and Botanic Garden" TC="嘉道理農場暨植物園"
─────────────────────────────────────────────────────────────────── */
(function(){
  const UTM = '?utm_source=kfbg_audio_journey&utm_medium=pwa&utm_campaign=audio_journey';
  const LINKS = {
    home:   { en:'https://kfbg.org/en/',               tc:'https://kfbg.org/tc/' },
    events: { en:'https://kfbg.org/en/event-calendar',  tc:'https://kfbg.org/tc/event-calendar' },
    donate: { en:'https://kfbg.org/en/donation',         tc:'https://kfbg.org/tc/donation' },
  };
  const BRAND = { en:'Kadoorie Farm and Botanic Garden', tc:'嘉道理農場暨植物園' };
  const JOURNEYS = [
    { key:'grounding-walk', label:{ en:'Grounding Walk · Lower Hillside', tc:'連結大地 — 嘉道理下山區靜心漫步' }, audioFiles:[
      'audio/01_Final_v01_20260211.mp3','audio/02_Final_v01_20260211.mp3',
      'audio/03_Final_v01_20260211.mp3','audio/04_Final_v01_20260211.mp3',
      'audio/05_Final_v01_20260211.mp3'
    ]},
    { key:'coming-soon-2', label:{ en:'Upper Farm Trail (coming soon)', tc:'上農場步道（即將推出）'}, audioFiles:[] },
    { key:'coming-soon-3', label:{ en:'Woodland Sanctuary (coming soon)', tc:'林地靜境（即將推出）'}, audioFiles:[] },
  ];
  const SOCIALS = [
    { label:'Facebook',  href:'https://www.facebook.com/KadoorieFarmAndBotanicGarden/'+UTM, svg:'<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>'},
    { label:'Instagram', href:'https://www.instagram.com/kfbg.official/'+UTM, svg:'<rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="currentColor" stroke-width="2"/>'},
    { label:'YouTube',   href:'https://www.youtube.com/@KadoorieFarm'+UTM, svg:'<path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#4A5C3A"/>'},
    { label:'LinkedIn',  href:'https://www.linkedin.com/company/kfbg/'+UTM, svg:'<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>'},
    { label:'Weibo',     href:'https://weibo.com/kfbg'+UTM, svg:'<path d="M10.1 20c-3.87 0-7-1.79-7-4s3.13-4 7-4 7 1.79 7 4-3.14 4-7 4zm0-6.5c-2.98 0-5.4 1.12-5.4 2.5S7.12 18.5 10.1 18.5s5.4-1.12 5.4-2.5-2.42-2.5-5.4-2.5zM8.5 16.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm3 .5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zM18.5 7c-.17 0-.34.01-.5.04A4.5 4.5 0 0 0 10 8.5h-.5A3.5 3.5 0 0 0 6 12.5v.04A8.4 8.4 0 0 1 3.1 12C3.1 8.69 6.23 6 10.1 6c2.11 0 4 .79 5.35 2.06A3.98 3.98 0 0 1 18.5 7z"/>'},
  ];

  function getLang(){ return document.documentElement.getAttribute('data-lang')||'zh'; }
  function dk(){ return getLang()==='zh'?'tc':'en'; }
  function getLinkUrl(key){ return (LINKS[key][dk()]||LINKS[key].en)+UTM; }
  function isHomePage(){ return window.location.pathname.endsWith('index.html')||window.location.pathname.endsWith('/'); }

  // ── STYLES ──
  if(!document.getElementById('kfbg-nav-styles')){
    const s=document.createElement('style');
    s.id='kfbg-nav-styles';
    s.textContent=`
:root{--olive:#4A5C3A;--olive-mid:#3B4A2F;--olive-light:#8A9A78;--cream:#F7F3EC;--sand:#EEEBE4;--border:#D8D3CB;--text:#1E2418;--text-mid:#444;--text-muted:#7A7A6A;--gold:#C4A96A;--nav-h:56px;--bar-h:80px;--fs:1rem;}
[data-lang="en"] .kn-tc{display:none!important;}[data-lang="zh"] .kn-en{display:none!important;}
.kn-en,.kn-tc{display:inline;}
#kfbg-topnav{position:fixed;top:0;left:0;right:0;z-index:300;height:var(--nav-h);background:rgba(247,243,236,0.97);backdrop-filter:blur(10px);border-bottom:1px solid var(--border);padding:0 12px;display:flex;align-items:center;gap:10px;}
.kn-logo{height:36px;display:block;flex-shrink:0;cursor:pointer;}
.kn-title{font-size:0.78rem;color:var(--text-muted);flex:1;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;}
.kn-back{display:inline-flex;align-items:center;gap:5px;font-size:0.78rem;color:var(--olive);text-decoration:none;font-weight:500;flex-shrink:0;}
.kn-back svg{width:18px;height:18px;}
.kn-hamburger{width:40px;height:40px;border-radius:10px;background:var(--olive);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.kn-hamburger svg{width:18px;height:18px;stroke:#fff;stroke-width:2;fill:none;stroke-linecap:round;}
/* drawer overlay */
.kn-overlay{position:fixed;inset:0;z-index:400;background:rgba(0,0,0,0);pointer-events:none;transition:background 0.3s;}
.kn-overlay.open{background:rgba(0,0,0,0.35);pointer-events:all;}
/* drawer */
.kn-drawer{position:fixed;top:0;right:0;bottom:0;width:min(320px,88vw);z-index:500;background:var(--cream);box-shadow:-8px 0 32px rgba(0,0,0,0.15);transform:translateX(100%);transition:transform 0.32s cubic-bezier(0.32,0.72,0,1);display:flex;flex-direction:column;overflow-y:auto;}
.kn-drawer.open{transform:translateX(0);}
.kn-drawer-head{padding:14px 14px 12px;background:var(--olive);display:flex;align-items:center;justify-content:flex-end;flex-shrink:0;}
.kn-close{background:rgba(255,255,255,0.12);border:none;color:rgba(247,243,236,0.7);width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;}
.kn-body{padding:16px;flex:1;}
.kn-sec{margin-bottom:20px;}
.kn-sec-label{font-size:0.58rem;letter-spacing:0.18em;text-transform:uppercase;color:var(--olive-light);margin-bottom:10px;font-weight:600;}
/* lang */
.kn-lang-row{display:flex;gap:8px;}
.kn-lang-opt{flex:1;padding:11px;border:2px solid var(--border);border-radius:10px;background:transparent;font-size:0.82rem;font-family:inherit;font-weight:500;color:var(--text-muted);cursor:pointer;text-align:center;transition:all 0.2s;}
.kn-lang-opt.active{border-color:var(--olive);background:var(--olive);color:#fff;}
/* font slider */
.kn-fs-row{display:flex;align-items:center;gap:10px;}
.kn-fs-a{font-size:0.75rem;color:var(--text-muted);font-family:inherit;flex-shrink:0;}
.kn-fs-a.big{font-size:1.1rem;}
input.kn-slider{flex:1;height:4px;-webkit-appearance:none;appearance:none;background:var(--border);border-radius:2px;outline:none;cursor:pointer;}
input.kn-slider::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;border-radius:50%;background:var(--olive);cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.18);}
input.kn-slider::-moz-range-thumb{width:24px;height:24px;border-radius:50%;background:var(--olive);border:none;cursor:pointer;}
/* download */
.kn-btn-dl{width:100%;padding:13px 16px;background:var(--olive);color:#fff;border:none;border-radius:12px;font-size:0.85rem;font-family:inherit;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;transition:opacity 0.2s;}
.kn-btn-dl:hover{opacity:0.88;}
.kn-btn-dl:disabled{opacity:0.45;cursor:default;}
/* delete — plain text link */
.kn-del-link{display:inline-block;font-size:0.75rem;color:#c0392b;text-decoration:underline;cursor:pointer;background:none;border:none;font-family:inherit;padding:2px 0;margin-top:4px;}
.kn-del-link:hover{color:#922b21;}
.kn-dl-prog{margin-top:6px;display:none;}
.kn-dl-bar{height:4px;background:var(--sand);border-radius:2px;overflow:hidden;}
.kn-dl-fill{height:100%;background:var(--olive);width:0%;transition:width 0.3s;border-radius:2px;}
.kn-dl-txt{font-size:0.7rem;color:var(--text-muted);margin-top:5px;}
/* journey select modal */
.kn-modal{position:fixed;inset:0;z-index:600;background:rgba(0,0,0,0.45);display:flex;align-items:flex-end;justify-content:center;padding-bottom:0;opacity:0;pointer-events:none;transition:opacity 0.25s;}
.kn-modal.open{opacity:1;pointer-events:all;}
.kn-modal-box{background:var(--cream);border-radius:18px 18px 0 0;padding:20px 16px 36px;width:100%;max-width:480px;}
.kn-modal-title{font-size:0.72rem;letter-spacing:0.14em;text-transform:uppercase;color:var(--text-muted);margin-bottom:14px;}
.kn-journey-row{display:flex;align-items:center;justify-content:space-between;padding:13px 14px;background:var(--sand);border-radius:10px;margin-bottom:8px;}
.kn-journey-name{font-size:0.85rem;color:var(--text-mid);flex:1;line-height:1.3;}
.kn-journey-btn{background:var(--olive);color:#fff;border:none;padding:7px 14px;border-radius:100px;font-size:0.75rem;font-family:inherit;cursor:pointer;flex-shrink:0;transition:opacity 0.2s;}
.kn-journey-btn:hover{opacity:0.85;}
.kn-journey-btn:disabled{opacity:0.35;cursor:default;}
.kn-modal-close{display:block;width:100%;margin-top:12px;padding:12px;background:transparent;border:1px solid var(--border);border-radius:10px;font-size:0.85rem;font-family:inherit;color:var(--text-muted);cursor:pointer;}
/* links */
.kn-link{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:var(--sand);border-radius:10px;text-decoration:none;color:var(--text-mid);font-size:0.82rem;margin-bottom:8px;min-height:46px;transition:background 0.18s;}
.kn-link:hover{background:var(--border);}
.kn-link svg{width:13px;height:13px;stroke:var(--text-muted);fill:none;stroke-width:2;flex-shrink:0;}
/* social row */
.kn-social-row{display:flex;gap:10px;flex-wrap:wrap;}
.kn-soc{width:40px;height:40px;border-radius:50%;background:var(--olive);display:flex;align-items:center;justify-content:center;text-decoration:none;transition:opacity 0.2s;}
.kn-soc:hover{opacity:0.78;}
.kn-soc svg{width:16px;height:16px;fill:#fff;stroke:none;}
/* update banner */
.kn-update{position:fixed;bottom:0;left:0;right:0;z-index:600;background:var(--olive-mid);padding:10px 16px 14px;display:none;align-items:center;gap:10px;}
.kn-update.show{display:flex;}
.kn-update p{font-size:0.78rem;color:rgba(247,243,236,0.88);flex:1;}
.kn-update p strong{color:#fff;}
.kn-update-btn{background:var(--gold);color:var(--olive-mid);border:none;padding:7px 14px;border-radius:100px;font-size:0.78rem;font-weight:600;cursor:pointer;white-space:nowrap;font-family:inherit;}
.kn-update-x{background:transparent;border:none;color:rgba(247,243,236,0.4);font-size:20px;cursor:pointer;}
/* persistent mini player — shown on HOME page when audio is playing from journey */
.kn-mini-player{position:fixed;bottom:0;left:0;right:0;z-index:200;background:var(--olive-mid);border-top:1px solid rgba(255,255,255,0.07);display:none;}
.kn-mini-player.show{display:block;}
.kn-mp-track{height:3px;background:rgba(255,255,255,0.1);cursor:pointer;}
.kn-mp-fill{height:100%;background:var(--gold);width:0%;transition:width 0.1s linear;}
.kn-mp-inner{padding:9px 14px 13px;display:flex;align-items:center;gap:10px;}
.kn-mp-info{flex:1;min-width:0;cursor:pointer;}
.kn-mp-ch{font-size:0.58rem;color:rgba(196,169,106,0.52);letter-spacing:0.1em;margin-bottom:1px;}
.kn-mp-title{font-size:0.88rem;font-weight:500;color:var(--cream);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.kn-mp-time{font-size:0.62rem;color:rgba(247,243,236,0.3);margin-top:1px;}
.kn-mp-controls{display:flex;align-items:center;gap:8px;flex-shrink:0;}
.kn-mp-play{width:40px;height:40px;border-radius:50%;background:var(--gold);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;}
.kn-mp-play svg{width:14px;height:14px;fill:var(--olive-mid);}
.kn-mp-play .i-pause{display:none;}
.kn-mp-play.playing .i-play{display:none;}
.kn-mp-play.playing .i-pause{display:block;}
.kn-mp-next{background:transparent;border:none;cursor:pointer;color:rgba(247,243,236,0.4);padding:4px;display:flex;align-items:center;}
.kn-mp-next svg{width:18px;height:18px;}
    `;
    document.head.appendChild(s);
  }

  // ── BUILD NAV ──
  function buildNav(){
    const home=isHomePage();
    const nav=document.createElement('nav');
    nav.id='kfbg-topnav';
    nav.innerHTML=`
      <a href="index.html"><img src="KFBG_Logo.png" class="kn-logo" alt="KFBG" onerror="this.src='KFBG_Logo_Square.png';this.onerror=null;"/></a>
      ${home?`<div class="kn-title kn-en">${BRAND.en}</div><div class="kn-title kn-tc">${BRAND.tc}</div>`
            :`<a href="index.html" class="kn-back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg><span class="kn-en">Journeys</span><span class="kn-tc">旅程</span></a><div class="kn-title" id="kn-page-title"></div>`}
      <button class="kn-hamburger" onclick="kfbgOpen()" aria-label="Menu">
        <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>`;
    document.body.prepend(nav);

    // overlay
    const ov=document.createElement('div');
    ov.className='kn-overlay';ov.id='knOv';ov.onclick=kfbgClose;
    document.body.appendChild(ov);

    // drawer
    const dr=document.createElement('div');
    dr.className='kn-drawer';dr.id='knDr';
    dr.innerHTML=`
      <div class="kn-drawer-head">
        <button class="kn-close" onclick="kfbgClose()">×</button>
      </div>
      <div class="kn-body">

        <div class="kn-sec">
          <div class="kn-sec-label"><span class="kn-en">Language</span><span class="kn-tc">語言</span></div>
          <div class="kn-lang-row">
            <button class="kn-lang-opt" id="kn-len" onclick="kfbgLang('en')">English</button>
            <button class="kn-lang-opt" id="kn-lzh" onclick="kfbgLang('zh')">繁中</button>
          </div>
        </div>

        <div class="kn-sec">
          <div class="kn-sec-label"><span class="kn-en">Text size</span><span class="kn-tc">文字大小</span></div>
          <div class="kn-fs-row">
            <span class="kn-fs-a">A</span>
            <input type="range" class="kn-slider" id="knFs" min="0" max="5" step="1" value="2" oninput="kfbgFont(this.value)"/>
            <span class="kn-fs-a big">A</span>
          </div>
        </div>

        <div class="kn-sec">
          <div class="kn-sec-label"><span class="kn-en">Offline</span><span class="kn-tc">離線使用</span></div>
          <button class="kn-btn-dl" id="knDlBtn" onclick="kfbgDownloadClick()">
            <span class="kn-en">Download audio chapters</span>
            <span class="kn-tc">下載音頻章節</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
          <div class="kn-dl-prog" id="knDlProg">
            <div class="kn-dl-bar"><div class="kn-dl-fill" id="knDlFill"></div></div>
            <div class="kn-dl-txt" id="knDlTxt"></div>
          </div>
          <button class="kn-del-link" id="knDelBtn" onclick="kfbgDelCache()" style="display:none">
            <span class="kn-en">Delete downloaded audio</span>
            <span class="kn-tc">刪除已下載音頻</span>
          </button>
        </div>

        <div class="kn-sec">
          <div class="kn-sec-label"><span class="kn-en">Kadoorie Farm and Botanic Garden</span><span class="kn-tc">嘉道理農場暨植物園</span></div>
          <a id="kn-lh" class="kn-link" target="_blank" rel="noopener">
            <span class="kn-en">Homepage</span><span class="kn-tc">主頁</span>
            <svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
          <a id="kn-le" class="kn-link" target="_blank" rel="noopener">
            <span class="kn-en">Events &amp; Programmes</span><span class="kn-tc">活動及課程</span>
            <svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
          <a id="kn-ld" class="kn-link" target="_blank" rel="noopener">
            <span class="kn-en">Donate</span><span class="kn-tc">捐款</span>
            <svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </div>

        <div class="kn-sec">
          <div class="kn-sec-label"><span class="kn-en">Follow us</span><span class="kn-tc">關注我們</span></div>
          <div class="kn-social-row">
            ${SOCIALS.map(s=>`<a href="${s.href}" class="kn-soc" target="_blank" rel="noopener" aria-label="${s.label}"><svg viewBox="0 0 24 24">${s.svg}</svg></a>`).join('')}
          </div>
        </div>
      </div>`;
    document.body.appendChild(dr);

    // journey select modal
    const modal=document.createElement('div');
    modal.className='kn-modal';modal.id='knModal';
    modal.innerHTML=`
      <div class="kn-modal-box">
        <div class="kn-modal-title"><span class="kn-en">Select a journey to download</span><span class="kn-tc">選擇要下載的旅程</span></div>
        ${JOURNEYS.map(j=>`
          <div class="kn-journey-row" id="kn-jrow-${j.key}">
            <div class="kn-journey-name"><span class="kn-en">${j.label.en}</span><span class="kn-tc">${j.label.tc}</span></div>
            ${j.audioFiles.length>0
              ?`<button class="kn-journey-btn" id="kn-jbtn-${j.key}" onclick="kfbgDownloadJourney('${j.key}')">${'<span class="kn-en">Download</span><span class="kn-tc">下載</span>'}</button>`
              :`<span style="font-size:0.7rem;color:var(--text-muted)"><span class="kn-en">Coming soon</span><span class="kn-tc">即將推出</span></span>`
            }
          </div>`).join('')}
        <button class="kn-modal-close" onclick="kfbgModalClose()"><span class="kn-en">Cancel</span><span class="kn-tc">取消</span></button>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click',e=>{if(e.target===modal)kfbgModalClose();});

    // update banner
    const ub=document.createElement('div');
    ub.className='kn-update';ub.id='knUpdate';
    ub.innerHTML=`
      <p class="kn-en"><strong>New version available.</strong> Refresh to update.</p>
      <p class="kn-tc"><strong>有新版本。</strong>重新整理以更新。</p>
      <button class="kn-update-btn" onclick="location.reload(true)"><span class="kn-en">Refresh</span><span class="kn-tc">更新</span></button>
      <button class="kn-update-x" onclick="this.parentElement.classList.remove('show')">×</button>`;
    document.body.appendChild(ub);

    // mini player for home page
    if(home){
      buildMiniPlayer();
    }

    refreshState();
  }

  // ── MINI PLAYER (home page) ──
  function buildMiniPlayer(){
    const mp=document.createElement('div');
    mp.className='kn-mini-player';mp.id='knMiniPlayer';
    mp.innerHTML=`
      <div class="kn-mp-track" id="knMpTrack"><div class="kn-mp-fill" id="knMpFill"></div></div>
      <div class="kn-mp-inner">
        <div class="kn-mp-info" onclick="kfbgMpGoToJourney()">
          <div class="kn-mp-ch" id="knMpCh"></div>
          <div class="kn-mp-title" id="knMpTitle"></div>
          <div class="kn-mp-time" id="knMpTime">0:00 / —:——</div>
        </div>
        <div class="kn-mp-controls">
          <button class="kn-mp-next" onclick="kfbgMpNext()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="5 4 15 12 5 20"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
          </button>
          <button class="kn-mp-play" id="knMpPlay" onclick="kfbgMpToggle()">
            <svg class="i-play" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
            <svg class="i-pause" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          </button>
        </div>
      </div>`;
    document.body.appendChild(mp);
    document.body.style.paddingBottom='var(--bar-h)';

    // connect to shared audio state
    syncMiniPlayer();
    // poll for audio updates since audio lives in journey page
    setInterval(syncMiniPlayer,500);
    // click track
    document.getElementById('knMpTrack').addEventListener('click',e=>{
      const state=getAudioState();
      if(!state||!state.dur) return;
      const r=e.currentTarget.getBoundingClientRect();
      const pct=(e.clientX-r.left)/r.width;
      // store seek request for journey page to pick up
      sessionStorage.setItem('kfbg-seek',JSON.stringify({pct,t:Date.now()}));
    });
  }

  // ── AUDIO STATE via sessionStorage ──
  // Journey page writes state; home page reads it
  function getAudioState(){
    try{ return JSON.parse(sessionStorage.getItem('kfbg-audio-state')||'null'); }catch(e){ return null; }
  }
  function syncMiniPlayer(){
    const st=getAudioState();
    const mp=document.getElementById('knMiniPlayer');
    if(!mp) return;
    if(!st||!st.journeyKey){ mp.classList.remove('show'); return; }
    mp.classList.add('show');
    const k=dk();
    document.getElementById('knMpCh').textContent=st.chLabel||'';
    document.getElementById('knMpTitle').textContent=st.chTitle||'';
    document.getElementById('knMpTime').textContent=fmt(st.cur)+' / '+fmt(st.dur||0);
    document.getElementById('knMpFill').style.width=(st.dur>0?(st.cur/st.dur)*100:0)+'%';
    document.getElementById('knMpPlay').classList.toggle('playing',st.playing||false);
    // home page body padding
    document.body.style.paddingBottom='var(--bar-h)';
  }
  window.kfbgMpToggle=function(){
    const st=getAudioState();
    if(!st) return;
    st.toggleCmd=Date.now();
    sessionStorage.setItem('kfbg-audio-cmd',JSON.stringify({cmd:'toggle',t:Date.now()}));
  };
  window.kfbgMpNext=function(){
    sessionStorage.setItem('kfbg-audio-cmd',JSON.stringify({cmd:'next',t:Date.now()}));
  };
  window.kfbgMpGoToJourney=function(){
    const st=getAudioState();
    if(st&&st.journeyKey) window.location.href='journey.html?set='+st.journeyKey;
    else window.location.href='journey.html?set=grounding-walk';
  };

  function fmt(s){if(!isFinite(s)||s<0)return'0:00';const m=Math.floor(s/60),sc=Math.floor(s%60);return m+':'+(sc<10?'0':'')+sc;}

  // ── DRAWER CONTROLS ──
  function refreshState(){
    const l=getLang();
    document.getElementById('kn-len')?.classList.toggle('active',l==='en');
    document.getElementById('kn-lzh')?.classList.toggle('active',l==='zh');
    const fs=parseInt(localStorage.getItem('kfbg-fs')||'2');
    const sl=document.getElementById('knFs');if(sl) sl.value=fs;
    document.documentElement.style.setProperty('--fs',['0.88rem','0.94rem','1rem','1.08rem','1.16rem','1.25rem'][fs]||'1rem');
    ['lh','le','ld'].forEach((id,i)=>{
      const el=document.getElementById('kn-'+id);
      if(el) el.href=getLinkUrl(['home','events','donate'][i]);
    });
    checkCacheState();
  }
  async function checkCacheState(){
    if(!('caches'in window))return;
    try{
      const c=await caches.open('kfbg-audio-v1');
      const keys=await c.keys();
      const has=keys.some(r=>r.url.endsWith('.mp3'));
      const btn=document.getElementById('knDelBtn');
      if(btn) btn.style.display=has?'inline-block':'none';
    }catch(e){}
  }

  window.kfbgOpen=function(){document.getElementById('knDr')?.classList.add('open');document.getElementById('knOv')?.classList.add('open');refreshState();};
  window.kfbgClose=function(){document.getElementById('knDr')?.classList.remove('open');document.getElementById('knOv')?.classList.remove('open');};
  window.kfbgModalClose=function(){document.getElementById('knModal')?.classList.remove('open');};
  window.kfbgLang=function(l){
    document.documentElement.setAttribute('data-lang',l);
    document.documentElement.lang=l==='zh'?'zh-Hant':'en';
    localStorage.setItem('kfbg-lang',l);
    refreshState();
    if(typeof window.setLang==='function') window.setLang(l);
  };
  window.kfbgFont=function(v){
    const sizes=['0.88rem','0.94rem','1rem','1.08rem','1.16rem','1.25rem'];
    document.documentElement.style.setProperty('--fs',sizes[v]||'1rem');
    localStorage.setItem('kfbg-fs',v);
  };
  window.kfbgDownloadClick=function(){
    // If on journey page, window.CH exists — download directly
    if(window.CH&&window.CH.length){
      runDownload(window.CH.map(c=>c.audio), window.CH[0]?.audio?.split('/')[0]||'grounding-walk');
    } else {
      // On home page — show journey selector
      document.getElementById('knModal')?.classList.add('open');
    }
  };
  window.kfbgDownloadJourney=async function(key){
    const journey=JOURNEYS.find(j=>j.key===key);
    if(!journey||!journey.audioFiles.length) return;
    const btn=document.getElementById('kn-jbtn-'+key);
    if(btn){btn.disabled=true;btn.innerHTML='<span class="kn-en">Downloading…</span><span class="kn-tc">下載中…</span>';}
    await runDownload(journey.audioFiles, key);
    if(btn){btn.innerHTML='<span class="kn-en">Downloaded ✓</span><span class="kn-tc">已下載 ✓</span>';}
    kfbgModalClose();
  };
  async function runDownload(audioFiles, key){
    const btn=document.getElementById('knDlBtn');
    const prog=document.getElementById('knDlProg');
    const fill=document.getElementById('knDlFill');
    const txt=document.getElementById('knDlTxt');
    if(btn) btn.disabled=true;
    if(prog) prog.style.display='block';
    const l=getLang();
    try{
      const c=await caches.open('kfbg-audio-v1');
      for(let i=0;i<audioFiles.length;i++){
        const url=audioFiles[i];
        if(txt) txt.textContent=(l==='zh'?'下載中 ':'Downloading ')+`${i+1}/${audioFiles.length}...`;
        if(!await c.match(url).catch(()=>null)){const r=await fetch(url);if(r.ok)await c.put(url,r);}
        if(fill) fill.style.width=Math.round(((i+1)/audioFiles.length)*100)+'%';
      }
      if(btn){btn.innerHTML='<span class="kn-en">Downloaded ✓</span><span class="kn-tc">已下載 ✓</span>';}
      if(txt) txt.textContent=l==='zh'?'✓ 可離線收聽':'✓ Ready for offline use';
      checkCacheState();
    }catch(e){if(btn)btn.disabled=false;if(txt)txt.textContent='Error — please retry';}
  }
  window.kfbgDelCache=async function(){
    const l=getLang();
    if(!confirm(l==='zh'?'確定要刪除所有已下載的音頻嗎？':'Delete all downloaded audio files?'))return;
    try{
      await caches.delete('kfbg-audio-v1');
      document.getElementById('knDelBtn').style.display='none';
      const b=document.getElementById('knDlBtn');
      if(b){b.disabled=false;b.innerHTML='<span class="kn-en">Download audio chapters</span><span class="kn-tc">下載音頻章節</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';}
      const f=document.getElementById('knDlFill');if(f)f.style.width='0%';
      const p=document.getElementById('knDlProg');if(p)p.style.display='none';
    }catch(e){}
  };
  window.kfbgSetPageTitle=function(t){const el=document.getElementById('kn-page-title');if(el)el.textContent=t;};

  // ── INIT ──
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',buildNav);}
  else{buildNav();}
  document.addEventListener('DOMContentLoaded',()=>{
    const sl=localStorage.getItem('kfbg-lang')||'zh';
    document.documentElement.setAttribute('data-lang',sl);
    document.documentElement.lang=sl==='zh'?'zh-Hant':'en';
    const fs=parseInt(localStorage.getItem('kfbg-fs')||'2');
    document.documentElement.style.setProperty('--fs',['0.88rem','0.94rem','1rem','1.08rem','1.16rem','1.25rem'][fs]);
  });
})();
