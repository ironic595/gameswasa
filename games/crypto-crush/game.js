// games/crypto-crush/game.js - v1 CRYPTO CRUSH - MATCH 3 ECONOMIA REAL
export function init(container, args){
  const WORKER_URL = window.WASA_CONFIG?.WORKER_URL || 'https://games-wasa-worker.javimsites.workers.dev/';
  function getDeviceId(){ if(window.getDeviceId) return window.getDeviceId(); let id=localStorage.getItem('wasa_device_id'); if(!id){ id='dev_'+Math.random().toString(36).slice(2)+Date.now().toString(36); localStorage.setItem('wasa_device_id',id);} return id; }
  function fmt(n){ const v=parseFloat(n)||0; if(v===0) return '0'; return (Math.round(v*1e7)/1e7).toFixed(7).replace(/0+$/,'').replace(/\.$/,''); }

  // --- CONFIG CRYPTO ---
  const ICONS = ['₿','Ξ','$','🐶','◎','Ł'];
  const COLORS = ['#f7931a','#627eea','#26a17b','#c2a633','#9945ff','#345d9d'];
  const NAMES = ['BTC','ETH','USDT','DOGE','SOL','LTC'];
  const SZ = 8;
  const MERGES_FOR_REWARD = 25; // en Crush cuesta mas, pongo 25 crushes = 0.0001
  const MERGES_FOR_FORCED = 35;
  const BASE_REWARD = 0.0001;

  container.innerHTML=`<style>
.wcrush{width:100%;height:100%;min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;font-family:Inter,system-ui;background:radial-gradient(ellipse at 20% 10%,rgba(139,90,255,.18),transparent 60%),linear-gradient(180deg,#1e1b4b 0%,#312e81 30%,#020617 100%);color:#fff;overflow:hidden;position:relative;padding:12px;box-sizing:border-box}
.w-header{width:100%;max-width:820px;display:flex;flex-direction:column;gap:10px;flex-shrink:0}
.w-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.w-stat{background:linear-gradient(180deg,#1e293b,#0f172a);border:1.5px solid #334155;border-radius:12px;padding:8px 10px}
.w-stat b{font-size:14px;color:#fff;font-weight:900;display:block}
.w-stat span{font-size:8px;opacity:.7;text-transform:uppercase;color:#94a3b8;font-weight:800;margin-top:3px;display:block;letter-spacing:.5px}
.w-stat.highlight{background:linear-gradient(180deg,#d1fae5,#a7f3d0);border-color:#065f46}
.w-stat.highlight b{color:#065f46}
.w-layout{flex:1;width:100%;max-width:820px;display:flex;gap:16px;justify-content:center;align-items:flex-start;margin-top:14px;min-height:0}
.w-board-wrap{flex:0 0 480px;width:480px;background:linear-gradient(180deg,#1e293b,#0f172a);padding:10px;border-radius:18px;box-shadow:0 12px 32px rgba(0,0,0,.6);border:2px solid #334155;aspect-ratio:1;box-sizing:border-box}
.w-grid{display:grid;grid-template-columns:repeat(${SZ},1fr);gap:6px;width:100%;height:100%}
.w-cell{width:100%;aspect-ratio:1;background:rgba(255,255,255,.08);border-radius:50%;display:grid;place-items:center;font-weight:900;font-size:22px;cursor:pointer;user-select:none;transition:all.12s;position:relative;box-shadow:inset 0 2px 6px rgba(0,0,0,.4)}
.w-cell.sel{outline:3px solid #facc15;transform:scale(1.1);z-index:2;box-shadow:0 0 18px #facc15}
.w-cell.matched{animation:boom.4s forwards}
@keyframes boom{0%{transform:scale(1)}50%{transform:scale(1.3)}100%{transform:scale(0);opacity:0}}
.w-side{flex:1;min-width:220px;max-width:300px;display:flex;flex-direction:column;gap:12px;position:sticky;top:12px}
.w-progress-wrap{width:100%;background:rgba(15,23,42,.9);border:1.5px solid #334155;border-radius:12px;padding:10px;box-sizing:border-box}
.w-progress{height:10px;background:rgba(255,255,255,.15);border-radius:5px;overflow:hidden;border:1px solid rgba(255,255,255,.1);margin-top:8px}.w-progress-bar{height:100%;background:linear-gradient(90deg,#22c55e,#16a34a);transition:width.3s ease;width:0%}
.w-hint{font-size:10px;opacity:.7;line-height:1.4;background:rgba(15,23,42,.6);border:1px dashed #475569;border-radius:10px;padding:8px 10px;color:#cbd5e1}
.w-levels{display:flex;gap:6px}
.w-lv{flex:1;padding:8px;border-radius:8px;border:1.5px solid #334155;font-weight:900;font-size:10px;text-align:center;cursor:pointer}
@media(max-width:820px){.wcrush{overflow:auto}.w-layout{flex-direction:column;align-items:center;max-width:480px}.w-board-wrap{flex:0 0 auto;width:100%;max-width:480px}.w-side{max-width:480px;width:100%;min-width:0;position:static}.w-stats{grid-template-columns:1fr 1fr}}
</style>
<div class="wcrush" id="wRoot">
  <div class="w-header">
    <div style="font-weight:900;text-align:center;letter-spacing:1px">CRYPTO CRUSH ₿ MATCH 3</div>
    <div class="w-stats"><div class="w-stat"><b id="wScore">0</b><span>SCORE</span></div><div class="w-stat"><b id="wBest">0</b><span>BEST</span></div><div class="w-stat highlight"><b id="wReward">+0.0000000</b><span>WASA TOTAL</span></div><div class="w-stat"><b id="wCount">0</b><span>CRUSH</span></div></div>
    <div class="w-levels">
      <div class="w-lv" id="lvEasy" style="background:#22c55e">EASY</div>
      <div class="w-lv" id="lvMed" style="background:#f97316">MEDIUM</div>
      <div class="w-lv" id="lvHard" style="background:#ef4444">HARD COLLECT</div>
    </div>
  </div>
  <div class="w-layout"><div class="w-board-wrap"><div class="w-grid" id="wGrid"></div></div><div class="w-side"><div class="w-progress-wrap"><div style="display:flex;justify-content:space-between;font-size:10px;font-weight:900"><span>PROGRESO AD</span><span id="wProgText">0/${MERGES_FOR_REWARD}</span></div><div style="font-size:9px;opacity:.7;margin-top:2px">${MERGES_FOR_REWARD} crush = 0,0001 + X2 AD</div><div class="w-progress"><div class="w-progress-bar" id="wProgBar"></div></div></div><div class="w-hint">👆 <b>Toca 2 criptos</b> adyacentes para intercambiar<br>🔥 Junta 3 o más iguales<br>💰 HARD paga X2 WASA</div></div></div><div id="wUI"></div></div>`;

  const root=container.querySelector('#wRoot'); const ui=root.querySelector('#wUI');
  let best=parseInt(localStorage.getItem('wcrush_best')||'0'); let score=0, board=[], totalReward=0, mergeCount=0;
  let currentSessionId=null, isClaiming=false, _rewardPending=null;
  let mergesSinceForced=0; let lastWasDouble=true; let gameStartTime=Date.now();
  let sel=null; let mult=1;

  async function startSession(){ currentSessionId=null; try{ const email=localStorage.getItem('wasa_email'); const wallet=localStorage.getItem('wasa_wallet'); const device_id=getDeviceId(); const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start_game_session', email, wallet, device_id, game_slug:'crypto-crush', level:MERGES_FOR_REWARD})}); const j=await r.json(); if(j.ok){ currentSessionId=j.session_id; } }catch(e){} return currentSessionId; }
  async function claimSession(isDouble,adWatched){
    if(isClaiming) return {ok:false}; if(!currentSessionId) await startSession();
    if(!currentSessionId) return {ok:false, error:'sin sesion'}; isClaiming=true;
    try{
      const email=localStorage.getItem('wasa_email'); const wallet=localStorage.getItem('wasa_wallet'); const device_id=getDeviceId();
      const elapsed = (Date.now() - gameStartTime)/1000;
      const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'claim_reward', session_id:currentSessionId, email, wallet, device_id, game_slug:'crypto-crush', level:MERGES_FOR_REWARD, ad_watched:adWatched, double_reward:isDouble, time_taken: elapsed})});
      const j=await r.json(); if(j.ok){ const bal=j.wasa_balance??j.guest_balance??0; if(j.is_guest){ localStorage.setItem('wasa_coins_guest',bal); localStorage.setItem('wasa_coins','0'); } else{ localStorage.setItem('wasa_coins',bal);} if(typeof window.setCoinsUI==='function') window.setCoinsUI(bal); currentSessionId=null; isClaiming=false; return j; } else{ isClaiming=false; return {ok:false, error:j.error}; }
    }catch(e){ isClaiming=false; return {ok:false}; }
  }
  function openAd(type){ if(window.vrAd!==0 && window.vrAd!==undefined) return; _rewardPending=type; window.vrAdType=type; window.vrAd=1; ui.innerHTML=`<div style="position:absolute;inset:0;background:rgba(0,0,0,.75);display:grid;place-items:center;z-index:30;color:white">Cargando anuncio...</div>`; }

  function initBoard(difficulty=1){
    mult=difficulty; board=Array(SZ).fill(0).map(()=>Array(SZ).fill(0).map(()=>Math.floor(Math.random()* (4+difficulty))));
    score=0; mergeCount=0; mergesSinceForced=0; lastWasDouble=true; sel=null; gameStartTime=Date.now(); startSession(); render(); ui.innerHTML='';
  }

  function render(){
    const gEl=root.querySelector('#wGrid'); gEl.innerHTML='';
    for(let r=0;r<SZ;r++) for(let c=0;c<SZ;c++){
      const d=document.createElement('div'); d.className='w-cell'+(sel&&sel.r==r&&sel.c==c?' sel':'');
      const v=board[r][c]; d.textContent=ICONS[v]; d.style.background=COLORS[v]+'33'; d.style.border=`2px solid ${COLORS[v]}`; d.style.color=COLORS[v];
      d.onclick=()=>clickCell(r,c); gEl.appendChild(d);
    }
    const set=(id,val)=>{ const el=root.querySelector('#'+id); if(el) el.textContent=val; };
    set('wScore',score); set('wBest',Math.max(best,score)); set('wReward','+'+fmt(totalReward*mult)); set('wCount',mergeCount);
    set('wProgText',mergeCount+'/'+MERGES_FOR_REWARD); const bar=root.querySelector('#wProgBar'); if(bar) bar.style.width=(mergeCount/MERGES_FOR_REWARD*100)+'%';
    if(score>best){ best=score; localStorage.setItem('wcrush_best',best); }
  }

  function clickCell(r,c){
    if(!sel){ sel={r,c}; render(); return; }
    if(Math.abs(sel.r-r)+Math.abs(sel.c-c)==1){
      swap(sel.r,sel.c,r,c);
      const matches=findMatches();
      if(matches.length>0){
        processMatches(matches);
      } else {
        swap(sel.r,sel.c,r,c);
      }
    }
    sel=null; render();
  }
  function swap(r1,c1,r2,c2){ let t=board[r1][c1]; board[r1][c1]=board[r2][c2]; board[r2][c2]=t; }
  function findMatches(){
    const m=new Set();
    for(let r=0;r<SZ;r++) for(let c=0;c<SZ-2;c++) if(board[r][c]==board[r][c+1]&&board[r][c]==board[r][c+2]){ m.add(r+','+c); m.add(r+','+(c+1)); m.add(r+','+(c+2)); }
    for(let c=0;c<SZ;c++) for(let r=0;r<SZ-2;r++) if(board[r][c]==board[r+1][c]&&board[r][c]==board[r+2][c]){ m.add(r+','+c); m.add((r+1)+','+c); m.add((r+2)+','+c); }
    return Array.from(m);
  }
  function processMatches(matches){
    if(matches.length==0) return;
    mergeCount+=1; mergesSinceForced+=1; score+=matches.length*10*mult;
    matches.forEach(k=>{ const [r,c]=k.split(',').map(Number); board[r][c]=-1; });
    render();
    setTimeout(()=>{
      // gravity
      for(let c=0;c<SZ;c++){ let col=[]; for(let r=SZ-1;r>=0;r--) if(board[r][c]!==-1) col.push(board[r][c]); for(let r=SZ-1;r>=0;r--){ if(col.length) board[r][c]=col.shift(); else board[r][c]=Math.floor(Math.random()*(4+mult)); } }
      render();
      const next=findMatches();
      if(next.length>0) setTimeout(()=>processMatches(next),200);
      else {
        if(mergeCount>=MERGES_FOR_REWARD){ showRewardModal(); return; }
        if(mergesSinceForced>=MERGES_FOR_FORCED &&!lastWasDouble){ openAd('forced'); return; }
      }
    },200);
  }

  function showRewardModal(){ ui.innerHTML=`<div style="position:absolute;inset:0;background:rgba(2,6,23,.88);backdrop-filter:blur(16px);display:grid;place-items:center;z-index:20"><div style="background:linear-gradient(180deg,#0f172a,#1e293b);border:2px solid #334155;border-radius:20px;padding:24px;text-align:center;width:min(360px,92vw);color:white"><div style="font-size:32px">₿🎉</div><div style="font-weight:900;margin:8px 0">¡${MERGES_FOR_REWARD} CRUSHES!</div><div style="display:flex;justify-content:center;background:rgba(34,197,94,.15);border:1px solid rgba(34,197,94,.4);border-radius:12px;padding:10px;margin:12px 0;font-weight:800;color:#86efac">💰 +${fmt(BASE_REWARD*mult)} WASA</div><button id="btnDouble" style="width:100%;padding:12px;border-radius:12px;font-weight:800;border:2px solid #fbbf24;background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#000">📺 X2 = ${fmt(BASE_REWARD*mult*2)} WASA</button><button id="btnClaim" style="width:100%;padding:12px;border-radius:12px;font-weight:800;border:2px solid #334155;background:#020617;color:#fff;margin-top:8px">COBRAR ${fmt(BASE_REWARD*mult)} WASA</button></div></div>`; ui.querySelector('#btnDouble').onclick=()=> openAd('double'); ui.querySelector('#btnClaim').onclick=async()=>{ const btn=ui.querySelector('#btnClaim'); if(btn){ btn.textContent='⏳ VALIDANDO...'; btn.disabled=true; } const res=await claimSession(false,false); if(res.ok){ totalReward+=BASE_REWARD*mult; mergeCount=0; lastWasDouble=false; gameStartTime=Date.now(); startSession(); render(); ui.innerHTML=`<div style="position:absolute;inset:0;background:rgba(0,0,0,.75);display:grid;place-items:center;z-index:20"><div style="background:#0f172a;border:2px solid #22c55e;border-radius:12px;padding:12px;text-align:center;width:min(320px,92vw);color:white"><div style="color:#22c55e;font-weight:900">¡+${fmt(BASE_REWARD*mult)} WASA!</div><button id="ok" style="margin-top:8px;width:100%;background:#22c55e;color:black;font-weight:900;padding:10px;border-radius:999px">OK</button></div></div>`; ui.querySelector('#ok').onclick=()=>{ ui.innerHTML=''; render(); }; } else { if(btn){ btn.textContent=res.error||'REINTENTAR'; btn.disabled=false; } } }; }

  const watcher=setInterval(()=>{ if(window.vrAd===4 && _rewardPending){ const type=_rewardPending; _rewardPending=null; window.vrAd=0; window.vrAdType=null; window._gm_shown=false; (async()=>{ if(type==='double'){ ui.innerHTML=`<div style="position:absolute;inset:0;background:rgba(0,0,0,.75);display:grid;place-items:center;z-index:20"><div style="background:#0f172a;border:2px solid #334155;border-radius:12px;padding:12px;text-align:center;color:white"><div style="font-weight:900">Validando X2...</div></div></div>`; const res=await claimSession(true,true); if(res.ok){ totalReward+=BASE_REWARD*mult*2; mergeCount=0; mergesSinceForced=0; lastWasDouble=true; gameStartTime=Date.now(); startSession(); render(); ui.innerHTML=`<div style="position:absolute;inset:0;background:rgba(0,0,0,.75);display:grid;place-items:center;z-index:20"><div style="background:#0f172a;border:2px solid #22c55e;border-radius:12px;padding:12px;text-align:center;width:min(320px,92vw);color:white"><div style="color:#22c55e;font-weight:900">¡X2 +${fmt(BASE_REWARD*mult*2)} WASA!</div><button id="ok2" style="margin-top:8px;width:100%;background:#22c55e;color:black;font-weight:900;padding:10px;border-radius:999px">OK</button></div></div>`; ui.querySelector('#ok2').onclick=()=>{ ui.innerHTML=''; render(); }; } else{ ui.innerHTML=`<div style="position:absolute;inset:0;background:rgba(0,0,0,.75);display:grid;place-items:center;z-index:20"><div style="background:#0f172a;border:2px solid #ef4444;border-radius:12px;padding:12px;text-align:center;color:white"><div style="color:#ef4444">Error X2: ${res.error||'server'}</div><button id="retry" style="margin-top:8px;width:100%;background:white;color:black;padding:8px;border-radius:999px">Reintentar</button></div></div>`; ui.querySelector('#retry').onclick=()=>{ ui.innerHTML=''; showRewardModal(); }; } } if(type==='forced'){ mergesSinceForced=0; ui.innerHTML=''; render(); } })(); } },150);

  root.querySelector('#lvEasy').onclick=()=>initBoard(1);
  root.querySelector('#lvMed').onclick=()=>initBoard(2);
  root.querySelector('#lvHard').onclick=()=>initBoard(3);

  initBoard(2);
  container._cleanup=()=>{ clearInterval(watcher); window.vrAd=0; };
}
