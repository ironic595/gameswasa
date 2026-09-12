// games/2048-madera/game.js - v4 FINAL ECONOMY - 20 merges = 0,001 base + X2 ad = 0,002 - FIXED no w-top
export function init(container, args){
  const getCoins = args.getCoins||(()=>parseFloat(localStorage.getItem('wasa_coins')||'0'));
  const WORKER_URL = window.WASA_CONFIG?.WORKER_URL || 'https://games-wasa-worker.javimsites.workers.dev/';
  function getDeviceId(){ if(window.getDeviceId) return window.getDeviceId(); let id=localStorage.getItem('wasa_device_id'); if(!id){ id='dev_'+Math.random().toString(36).slice(2)+Date.now().toString(36); localStorage.setItem('wasa_device_id',id);} return id; }
  function fmt(n){ const v=parseFloat(n)||0; if(v===0) return '0'; return (Math.round(v*1000000)/1000000).toFixed(6).replace(/0+$/,'').replace(/\.$/,''); }

  container.innerHTML=`<style>
.w2048{width:100%;height:100%;min-height:100%;display:flex;flex-direction:column;font-family:Inter,system-ui;background:radial-gradient(ellipse at 20% 10%,rgba(139,90,43,.18),transparent 60%),linear-gradient(180deg,#d2b48c 0%,#bc9a6a 30%,#8b5a2b 100%);color:#3e2723;overflow:hidden;position:relative}
.w-pill{border:1px solid rgba(245,222,179,.25);border-radius:20px;padding:5px 10px;font-size:10px;background:rgba(92,64,51,.6);cursor:pointer;font-weight:700;color:#f5deb3}
.w-pill.yellow{background:#f5deb3;color:#3e2723;border-color:#3e2723;font-weight:800}
.w-body{flex:1;display:flex;align-items:center;justify-content:center;gap:28px;padding:20px;overflow:auto;width:100%;max-width:1100px;margin:0 auto}
.w-left{flex:0 0 320px;display:flex;flex-direction:column;gap:12px}
.w-board-wrap{background:linear-gradient(180deg,#5c4033,#3e2723);padding:12px;border-radius:18px;box-shadow:0 12px 32px rgba(0,0,0,.4);border:2px solid #4a2c17}
.w-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;width:100%;aspect-ratio:1}
.w-cell{width:100%;aspect-ratio:1;background:rgba(62,39,35,.6);border-radius:10px}
.w-tiles{position:relative;width:100%;aspect-ratio:1;margin-top:-100%;pointer-events:none}
.w-tile{position:absolute;width:calc(25% - 7.5px);height:calc(25% - 7.5px);border-radius:10px;display:grid;place-items:center;font-family:JetBrains Mono;font-weight:800;font-size:28px;transition:all.15s cubic-bezier(.34,1.56,.64,1);box-shadow:0 4px 12px rgba(0,0,0,.25);animation:pop.25s}
 @keyframes pop{0%{transform:scale(.2)}60%{transform:scale(1.15)}100%{transform:scale(1)}}
.t-2{background:linear-gradient(180deg,#fff8e7,#f5deb3);color:#3e2723}.t-4{background:linear-gradient(180deg,#f5deb3,#deb887);color:#3e2723}.t-8{background:linear-gradient(180deg,#deb887,#d2b48c);color:#3e2723}.t-16{background:linear-gradient(180deg,#d2b48c,#bc9a6a);color:#fff}.t-32{background:linear-gradient(180deg,#bc9a6a,#a67b5b);color:#fff}.t-64{background:linear-gradient(180deg,#a67b5b,#8b5a2b);color:#fff}.t-128{background:linear-gradient(180deg,#cd853f,#a0522d);color:#fff;font-size:24px}.t-256{background:linear-gradient(180deg,#a0522d,#8b4513);color:#fff;font-size:24px}.t-512{background:linear-gradient(180deg,#8b4513,#654321);color:#fff;font-size:22px}.t-1024{background:linear-gradient(180deg,#654321,#3e2723);color:#f5deb3;font-size:20px}.t-2048{background:linear-gradient(135deg,#ffd700,#ffb700 50%,#ff8c00);color:#3e2723;font-size:20px;box-shadow:0 0 24px rgba(255,215,0,.6);border:2px solid #fff}
.w-right{flex:1;max-width:400px;display:flex;flex-direction:column;gap:14px}
.w-stats{display:grid;grid-template-columns:1fr 1fr;gap:8px}.w-stat{background:linear-gradient(180deg,#fef9c3,#fde68a);border:1px solid #5c4033;border-radius:12px;padding:10px 12px}.w-stat b{font-size:16px;display:block;color:#3e2723}.w-stat span{font-size:9px;opacity:.7;text-transform:uppercase;color:#5c4033;font-weight:700}
.w-progress{height:8px;background:rgba(92,64,51,.2);border-radius:4px;overflow:hidden;border:1px solid rgba(92,64,51,.2)}.w-progress-bar{height:100%;background:linear-gradient(90deg,#8b5a2b,#3e2723);transition:width.3s ease;width:0%}
.w-controls{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.w-btn{padding:10px;border-radius:12px;font-weight:800;font-size:10px;text-transform:uppercase;cursor:pointer;border:2px solid #5c4033;background:#f5deb3;color:#3e2723}
.w-btn.primary{background:#3e2723;color:#f5deb3}
@media(max-width:900px){.w-body{flex-direction:column;align-items:stretch;justify-content:flex-start;gap:16px;padding:12px}.w-left{flex:0 0 auto;width:100%}.w-right{max-width:100%}}
.w-win{position:absolute;inset:0;background:rgba(62,39,35,.88);backdrop-filter:blur(16px);display:grid;place-items:center;z-index:20}
.w-win-card{background:linear-gradient(180deg,#fef9c3,#fde68a);border:2px solid #5c4033;border-radius:20px;padding:24px;text-align:center;width:min(360px,92vw)}
.w-win-amount{display:flex;align-items:center;justify-content:center;gap:8px;background:rgba(34,197,94,.15);border:1px solid rgba(34,197,94,.4);border-radius:12px;padding:10px;margin:12px 0;font-weight:800;color:#14532d}
.w-win-btn{width:100%;padding:12px;border-radius:12px;font-weight:800;font-size:11px;text-transform:uppercase;cursor:pointer;border:2px solid #5c4033;margin-top:8px}.w-win-btn.x2{background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#000}.w-win-btn.secondary{background:#3e2723;color:#f5deb3}.w-win-btn.ghost{background:#f5deb3;color:#3e2723}
  </style><div class="w2048" id="wRoot"><div class="w-body"><div class="w-left"><div class="w-board-wrap"><div class="w-grid" id="wGrid"></div><div class="w-tiles" id="wTiles"></div></div><div style="background:rgba(245,222,179,.7);border:1px solid #5c4033;border-radius:12px;padding:10px"><div style="display:flex;justify-content:space-between;font-size:10px;font-weight:800;margin-bottom:6px"><span>PROGRESO AD (20 merges = 0,001 + X2)</span><span id="wProgText">0/20</span></div><div class="w-progress"><div class="w-progress-bar" id="wProgBar"></div></div></div></div><div class="w-right"><div class="w-stats"><div class="w-stat"><b id="wScore">0</b><span>SCORE</span></div><div class="w-stat"><b id="wBest">0</b><span>BEST</span></div><div class="w-stat"><b id="wReward">+0.000000</b><span>WASA TOTAL</span></div><div class="w-stat"><b id="wCount">0</b><span>MERGES</span></div></div><div class="w-controls"><button class="w-btn" id="wUp">↑</button><button class="w-btn" id="wUp2">↑</button><button class="w-btn" id="wDown">↓</button><button class="w-btn" id="wLeft">←</button><button class="w-btn" id="wReset">RESET</button><button class="w-btn" id="wRight">→</button></div></div></div><div id="wUI"></div></div>`;

  const root=container.querySelector('#wRoot'); const ui=root.querySelector('#wUI');
  let best=parseInt(localStorage.getItem('w2048_best')||'0'); let score=0, grid=[], totalReward=0, mergeCount=0;
  const MERGES_FOR_AD=20; const BASE_REWARD=0.001;
  let currentSessionId=null, isClaiming=false, _rewardPending=null, lastBase=0;

  async function startSession(){ currentSessionId=null; try{ const email=localStorage.getItem('wasa_email'); const wallet=localStorage.getItem('wasa_wallet'); const device_id=getDeviceId(); const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start_game_session', email, wallet, device_id, game_slug:'2048-madera', level:MERGES_FOR_AD})}); const j=await r.json(); if(j.ok){ currentSessionId=j.session_id; return j.session_id; } }catch(e){} return null; }
  async function claimSession(isDouble,adWatched){
    if(isClaiming) return {ok:false}; if(!currentSessionId) await startSession();
    if(!currentSessionId) return {ok:false, error:'sin sesion'}; isClaiming=true;
    try{ const email=localStorage.getItem('wasa_email'); const wallet=localStorage.getItem('wasa_wallet'); const device_id=getDeviceId();
      const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'claim_reward', session_id:currentSessionId, email, wallet, device_id, game_slug:'2048-madera', level:MERGES_FOR_AD, ad_watched:adWatched, double_reward:isDouble, time_taken:20})});
      const j=await r.json(); if(j.ok){ const bal=j.wasa_balance??j.guest_balance??0; if(j.is_guest){ localStorage.setItem('wasa_coins_guest',bal); localStorage.setItem('wasa_coins','0'); } else{ localStorage.setItem('wasa_coins',bal);} if(typeof window.setCoinsUI==='function') window.setCoinsUI(bal); currentSessionId=null; isClaiming=false; return j; } else{ isClaiming=false; return {ok:false, error:j.error}; }
    }catch(e){ isClaiming=false; return {ok:false}; }
  }

  function openAd(type){ if(window.vrAd!==0 && window.vrAd!==undefined) return; _rewardPending=type; window.vrAdType=type; window.vrAd=1; ui.innerHTML=`<div style="position:absolute;inset:0;background:rgba(0,0,0,.6);display:grid;place-items:center;z-index:20;color:white">Cargando ad para ${fmt(BASE_REWARD)} WASA... vrAd=${window.vrAd}</div>`; }

  function initGrid(){ grid=Array(4).fill(0).map(()=>Array(4).fill(0)); const gEl=root.querySelector('#wGrid'); gEl.innerHTML=''; for(let i=0;i<16;i++){ const c=document.createElement('div'); c.className='w-cell'; gEl.appendChild(c);} addRandom(); addRandom(); score=0; mergeCount=0; totalReward=0; startSession(); render(); ui.innerHTML=''; }
  function addRandom(){ const empties=[]; for(let r=0;r<4;r++) for(let c=0;c<4;c++) if(grid[r][c]===0) empties.push([r,c]); if(empties.length===0) return; const [r,c]=empties[Math.floor(Math.random()*empties.length)]; grid[r][c]=Math.random()<0.9?2:4; }
  function render(){
    const tilesEl=root.querySelector('#wTiles'); if(!tilesEl) return;
    tilesEl.innerHTML=''; let max=2;
    for(let r=0;r<4;r++) for(let c=0;c<4;c++){ const v=grid[r][c]; if(v===0) continue; max=Math.max(max,v); const t=document.createElement('div'); t.className='w-tile t-'+(v>2048?'super':v>1024?1024:v); t.textContent=v; t.style.left='calc('+c+' * (25% + 2.5px))'; t.style.top='calc('+r+' * (25% + 2.5px))'; t.style.width='calc(25% - 7.5px)'; t.style.height='calc(25% - 7.5px)'; tilesEl.appendChild(t); }
    const set = (id, val) => { const el = root.querySelector('#'+id); if(el) el.textContent = val; };
    set('wScore', score);
    set('wBest', Math.max(best,score));
    set('wReward', '+'+(Math.round(totalReward*1000000)/1000000).toFixed(6));
    set('wCount', mergeCount);
    set('wProgText', mergeCount+'/'+MERGES_FOR_AD);
    const bar = root.querySelector('#wProgBar'); if(bar) bar.style.width=(mergeCount/MERGES_FOR_AD*100)+'%';
    if(score>best){ best=score; localStorage.setItem('w2048_best',best); }
  }

  function showRewardModal(){
    lastBase=BASE_REWARD;
    ui.innerHTML=`<div style="position:absolute;inset:0;background:rgba(62,39,35,.88);backdrop-filter:blur(16px);display:grid;place-items:center;z-index:20"><div style="background:linear-gradient(180deg,#fef9c3,#fde68a);border:2px solid #5c4033;border-radius:20px;padding:24px;text-align:center;width:min(360px,92vw)"><div style="font-size:32px">🪵🎉</div><div style="font-weight:900;margin:8px 0">¡20 COMBINACIONES!</div><div class="w-win-amount">💰 +${fmt(BASE_REWARD)} $WASA ganados</div><div style="font-size:10px;opacity:.7;margin-bottom:12px">¿Querés duplicar viendo un anuncio?</div><button class="w-win-btn x2" id="btnDouble">📺 X2 VIENDO AD (+${fmt(BASE_REWARD)} = ${fmt(BASE_REWARD*2)} WASA)</button><button class="w-win-btn secondary" id="btnClaim">COBRAR ${fmt(BASE_REWARD)} WASA</button></div></div>`;
    ui.querySelector('#btnDouble').onclick=()=> openAd('double');
    ui.querySelector('#btnClaim').onclick=async()=>{
      const btn = ui.querySelector('#btnClaim');
      if(btn){ btn.textContent='⏳ VALIDANDO SERVER...'; btn.disabled=true; }
      const res=await claimSession(false,false);
      if(res.ok){ totalReward+=BASE_REWARD; mergeCount=0; startSession(); render(); ui.innerHTML=`<div style="position:absolute;inset:0;background:rgba(0,0,0,.75);display:grid;place-items:center;z-index:20"><div style="background:#fef9c3;border:2px solid #22c55e;border-radius:12px;padding:12px;text-align:center;width:min(320px,92vw)"><div style="color:#22c55e;font-weight:900">¡+${fmt(BASE_REWARD)} WASA acreditado!</div><div style="font-size:10px">Total: ${fmt(totalReward)} WASA</div><button id="ok" style="margin-top:8px;width:100%;background:#22c55e;color:black;font-weight:900;padding:10px;border-radius:999px">OK</button></div></div>`; ui.querySelector('#ok').onclick=()=>{ ui.innerHTML=''; render(); }; }
      else{ if(btn){ btn.textContent='REINTENTAR COBRO'; btn.disabled=false; } }
    };
  }

  function move(dir){
    const old=JSON.stringify(grid); let gained=0, merges=0;
    const proc=(arr)=>{ let a=arr.filter(x=>x!==0); for(let i=0;i<a.length-1;i++){ if(a[i]===a[i+1]){ a[i]*=2; a[i+1]=0; gained+=a[i]; merges++; } } a=a.filter(x=>x!==0); while(a.length<4) a.push(0); return a; };
    const ng=grid.map(r=>[...r]);
    if(dir==='left'){ for(let r=0;r<4;r++) ng[r]=proc(ng[r]); }
    else if(dir==='right'){ for(let r=0;r<4;r++) ng[r]=proc([...ng[r]].reverse()).reverse(); }
    else if(dir==='up'){ for(let c=0;c<4;c++){ let col=[ng[0][c],ng[1][c],ng[2][c],ng[3][c]]; col=proc(col); for(let r=0;r<4;r++) ng[r][c]=col[r]; } }
    else if(dir==='down'){ for(let c=0;c<4;c++){ let col=[ng[0][c],ng[1][c],ng[2][c],ng[3][c]]; col=proc(col.reverse()).reverse(); for(let r=0;r<4;r++) ng[r][c]=col[r]; } }
    if(JSON.stringify(ng)!==old){ grid=ng; score+=gained; mergeCount+=merges; addRandom(); render();
      if(mergeCount>=MERGES_FOR_AD){ showRewardModal(); }
    }
  }

  const watcher=setInterval(()=>{ if(window.vrAd===4 && _rewardPending){
      const type=_rewardPending; _rewardPending=null; window.vrAd=0; window.vrAdType=null; window._gm_shown=false;
      (async()=>{
        if(type==='double'){
          ui.innerHTML=`<div style="position:absolute;inset:0;background:rgba(0,0,0,.75);display:grid;place-items:center;z-index:20"><div style="background:#fef9c3;border:2px solid #5c4033;border-radius:12px;padding:12px;text-align:center"><div style="font-weight:900">Validando X2 server...</div><div style="font-size:11px">${fmt(BASE_REWARD)} → ${fmt(BASE_REWARD*2)} WASA</div></div></div>`;
          const res=await claimSession(true,true);
          if(res.ok){ totalReward+=BASE_REWARD*2; mergeCount=0; startSession(); render(); ui.innerHTML=`<div style="position:absolute;inset:0;background:rgba(0,0,0,.75);display:grid;place-items:center;z-index:20"><div style="background:#fef9c3;border:2px solid #22c55e;border-radius:12px;padding:12px;text-align:center;width:min(320px,92vw)"><div style="color:#22c55e;font-weight:900">¡X2 ACREDITADO! +${fmt(BASE_REWARD*2)} WASA</div><div style="font-size:10px">Total: ${fmt(totalReward)} WASA</div><button id="ok2" style="margin-top:8px;width:100%;background:#22c55e;color:black;font-weight:900;padding:10px;border-radius:999px">OK</button></div></div>`; ui.querySelector('#ok2').onclick=()=>{ ui.innerHTML=''; render(); }; }
          else{ ui.innerHTML=`<div style="position:absolute;inset:0;background:rgba(0,0,0,.75);display:grid;place-items:center;z-index:20"><div style="background:#fef9c3;border:2px solid #ef4444;border-radius:12px;padding:12px;text-align:center"><div style="color:#ef4444">Error X2: ${res.error||'server'}</div><button id="retry" style="margin-top:8px;width:100%;background:white;color:black;padding:8px;border-radius:999px">Reintentar</button></div></div>`; ui.querySelector('#retry').onclick=()=>{ ui.innerHTML=''; showRewardModal(); }; }
        }
      })();
    } },150);

  root.querySelector('#wReset')?.addEventListener('click', initGrid);
  root.querySelector('#wUp')?.addEventListener('click', ()=>move('up'));
  root.querySelector('#wDown')?.addEventListener('click', ()=>move('down'));
  root.querySelector('#wLeft')?.addEventListener('click', ()=>move('left'));
  root.querySelector('#wRight')?.addEventListener('click', ()=>move('right'));
  root.querySelector('#wUp2')?.addEventListener('click', ()=>move('up'));

  const keyHandler = e=>{ if(e.key==='ArrowUp'||e.key==='w'||e.key==='W') move('up'); if(e.key==='ArrowDown'||e.key==='s'||e.key==='S') move('down'); if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A') move('left'); if(e.key==='ArrowRight'||e.key==='d'||e.key==='D') move('right'); };
  window.addEventListener('keydown', keyHandler);

  let sx=0,sy=0;
  root.addEventListener('touchstart',e=>{ sx=e.touches[0].clientX; sy=e.touches[0].clientY; },{passive:true});
  root.addEventListener('touchend',e=>{ if(!sx) return; const dx=e.changedTouches[0].clientX-sx; const dy=e.changedTouches[0].clientY-sy; if(Math.abs(dx)>Math.abs(dy)){ if(Math.abs(dx)>30) move(dx>0?'right':'left'); } else{ if(Math.abs(dy)>30) move(dy>0?'down':'up'); } sx=0; sy=0; },{passive:true});

  initGrid();
  container._cleanup=()=>{ clearInterval(watcher); window.removeEventListener('keydown', keyHandler); window.vrAd=0; };
}
