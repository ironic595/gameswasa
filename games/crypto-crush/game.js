// games/crypto-crush/game.js - v2 CANDY CRUSH EDITION - MOBILE FIRST - ECONOMIA REAL
export function init(container, args){
  const WORKER_URL = window.WASA_CONFIG?.WORKER_URL || 'https://games-wasa-worker.javisimes.workers.dev/';
  function getDeviceId(){ let id=localStorage.getItem('wasa_device_id'); if(!id){ id='dev_'+Math.random().toString(36).slice(2)+Date.now().toString(36); localStorage.setItem('wasa_device_id',id);} return id; }
  function fmt(n){ const v=parseFloat(n)||0; if(v===0) return '0'; return (Math.round(v*1e7)/1e7).toFixed(7).replace(/0+$/,'').replace(/\.$/,''); }

  const ICONS = ['₿','Ξ','₮','🐶','◎','Ł'];
  const COLORS = ['#f7931a','#627eea','#26a17b','#c2a633','#9945ff','#345d9d'];
  const NAMES = ['BTC','ETH','USDT','DOGE','SOL','LTC'];
  const SZ = 8;
  const BASE_REWARD = 0.0001;
  const MERGES_FOR_REWARD = 25;

  container.innerHTML=`<style>
*{box-sizing:border-box}
.cc{width:100%;height:100%;min-height:100vh;display:flex;flex-direction:column;align-items:center;background:radial-gradient(ellipse at 50% 0%, #3b2a8a 0%, transparent 55%), linear-gradient(180deg,#1a1033 0%,#0f0a1e 100%);color:#fff;font-family:Inter,system-ui;overflow:auto;overflow-x:hidden;position:relative;padding:0 0 20px}
.cc-board-area{width:100%;max-width:480px;display:flex;flex-direction:column;align-items:center;padding:12px;gap:10px}
.cc-top-stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;width:100%}
.cc-stat{background:linear-gradient(180deg,#2a2252,#1d1840);border:1.5px solid #3d3370;border-radius:14px;padding:8px 12px;text-align:left;box-shadow:0 4px 12px rgba(0,0,0,.4)}
.cc-stat b{font-size:15px;font-weight:900;display:block;line-height:1}
.cc-stat span{font-size:8px;letter-spacing:.08em;opacity:.6;text-transform:uppercase;font-weight:700}
.cc-stat.gold{background:linear-gradient(180deg,#fde68a,#fbbf24);border-color:#f59e0b;color:#000}.cc-stat.gold span{color:rgba(0,0,0,.6)}
.cc-progress{width:100%;background:rgba(0,0,0,.35);border:1px solid #3d3370;border-radius:12px;padding:8px 10px}
.cc-progress-bar{height:10px;background:#1a1635;border-radius:999px;overflow:hidden;margin-top:6px;border:1px solid #2a2252}
.cc-progress-fill{height:100%;background:linear-gradient(90deg,#22c55e,#4ade80);width:0%;transition:width .4s ease;box-shadow:0 0 10px rgba(34,197,94,.5)}

.cc-board{width:100%;aspect-ratio:1;background:linear-gradient(180deg,#1c1740,#12102a);border-radius:22px;padding:8px;box-shadow:0 20px 50px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.08);border:2px solid #2f285e;position:relative;touch-action:none;user-select:none}
.cc-grid{display:grid;grid-template-columns:repeat(${SZ},1fr);grid-template-rows:repeat(${SZ},1fr);gap:5px;width:100%;height:100%}
.cc-cell{position:relative;border-radius:12px;display:grid;place-items:center;cursor:pointer;transition:transform .15s cubic-bezier(.34,1.56,.64,1), filter .15s;will-change:transform;user-select:none;-webkit-tap-highlight-color:transparent}
.cc-cell:active{transform:scale(.92)}
.cc-cell.sel{transform:scale(1.12);z-index:5;filter:brightness(1.25)}
.cc-cell.sel::after{content:'';position:absolute;inset:-3px;border:3px solid #facc15;border-radius:14px;box-shadow:0 0 18px #facc15, inset 0 0 10px rgba(250,204,21,.3);pointer-events:none}
.cc-candy{width:86%;height:86%;border-radius:50% 50% 50% 50% / 60% 60% 40% 40%;display:grid;place-items:center;font-weight:900;font-size:22px;box-shadow:inset 0 -4px 0 rgba(0,0,0,.25), inset 0 2px 0 rgba(255,255,255,.35), 0 3px 8px rgba(0,0,0,.35);position:relative;overflow:hidden}
.cc-candy::before{content:'';position:absolute;top:6%;left:18%;width:34%;height:28%;background:rgba(255,255,255,.45);border-radius:50%;filter:blur(.5px)}
.cc-cell.matched{animation:pop .45s cubic-bezier(.34,1.56,.64,1) forwards}
@keyframes pop{0%{transform:scale(1)}30%{transform:scale(1.35)}100%{transform:scale(0);opacity:0}}
.cc-cell.fall{animation:fall .32s cubic-bezier(.25,.46,.45,.94)}
@keyframes fall{0%{transform:translateY(-120%)}100%{transform:translateY(0)}}
.cc-cell.hint{animation:hint 1s ease-in-out infinite}
@keyframes hint{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
.cc-combo{position:absolute;left:50%;top:30%;transform:translateX(-50%);font-weight:900;font-size:18px;color:#fff;text-shadow:0 2px 0 #000, 0 0 12px #facc15;pointer-events:none;animation:combo .8s ease forwards;z-index:10}
@keyframes combo{0%{opacity:0;transform:translateX(-50%) translateY(10px) scale(.8)}20%{opacity:1;transform:translateX(-50%) translateY(0) scale(1.15)}100%{opacity:0;transform:translateX(-50%) translateY(-30px) scale(1)}}
.cc-diffs{display:flex;gap:6px;width:100%}
.cc-diff{flex:1;height:38px;border-radius:12px;border:2px solid #3d3370;background:#1d1840;color:#fff;font-weight:900;font-size:11px;cursor:pointer;display:grid;place-items:center;letter-spacing:.05em}
.cc-diff.active{background:linear-gradient(135deg,#a78bfa,#7c3aed);border-color:#a78bfa;box-shadow:0 0 16px rgba(124,58,237,.5)}
@media(max-width:480px){.cc-candy{font-size:18px}.cc-board{border-radius:18px;padding:6px}.cc-grid{gap:4px}.cc-cell{border-radius:10px}}
</style>
<div class="cc" id="root">
  <div class="cc-board-area">
    <div class="cc-top-stats">
      <div class="cc-stat"><b id="cScore">0</b><span>Score</span></div>
      <div class="cc-stat"><b id="cBest">0</b><span>Best</span></div>
      <div class="cc-stat gold"><b id="cReward">+0.0000000</b><span id="cRewardLabel">WASA TOTAL</span></div>
    </div>
    <div class="cc-progress">
      <div style="display:flex;justify-content:space-between;font-size:10px;font-weight:800"><span>PROGRESO PREMIO</span><span id="cProg">0/${MERGES_FOR_REWARD}</span></div>
      <div class="cc-progress-bar"><div class="cc-progress-fill" id="cBar"></div></div>
      <div style="font-size:9px;opacity:.6;margin-top:4px">${MERGES_FOR_REWARD} crush = ${BASE_REWARD} WASA • Arrastrá para intercambiar</div>
    </div>
    <div class="cc-board" id="board"><div class="cc-grid" id="grid"></div></div>
    <div class="cc-diffs">
      <div class="cc-diff" id="d1">EASY</div><div class="cc-diff active" id="d2">MEDIUM</div><div class="cc-diff" id="d3">HARD X2</div>
    </div>
    <div style="font-size:10px;opacity:.5;text-align:center;line-height:1.4">💡 Arrastrá o tocá 2 criptos vecinas • 3+ iguales explotan • Combos dan más puntos</div>
  </div>
  <div id="ui"></div>
</div>`;

  const root=container.querySelector('#root'); const ui=root.querySelector('#ui');
  const gridEl=root.querySelector('#grid');
  let best=parseInt(localStorage.getItem('wcrush_best')||'0');
  let score=0, board=[], totalReward=0, crushes=0, mult=2, busy=false, sel=null;
  let session=null, claiming=false, pendingAd=null, startTime=Date.now();

  async function startSession(){ try{ const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start_game_session', email:localStorage.getItem('wasa_email'), wallet:localStorage.getItem('wasa_wallet'), device_id:getDeviceId(), game_slug:'crypto-crush', level:MERGES_FOR_REWARD})}); const j=await r.json(); if(j.ok) session=j.session_id; }catch{} }
  async function claim(isDouble, ad){ if(claiming) return {ok:false}; if(!session) await startSession(); if(!session) return {ok:false}; claiming=true; try{ const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'claim_reward', session_id:session, email:localStorage.getItem('wasa_email'), wallet:localStorage.getItem('wasa_wallet'), device_id:getDeviceId(), game_slug:'crypto-crush', level:MERGES_FOR_REWARD, ad_watched:ad, double_reward:isDouble, time_taken:(Date.now()-startTime)/1000})}); const j=await r.json(); if(j.ok){ const b=j.wasa_balance??j.guest_balance??0; localStorage.setItem(j.is_guest?'wasa_coins_guest':'wasa_coins',b); if(window.setCoinsUI) window.setCoinsUI(b); session=null; claiming=false; return j; } claiming=false; return {ok:false, error:j.error}; }catch{ claiming=false; return {ok:false}; } }

  function openAd(t){ if(window.vrAd!==0 && window.vrAd!==undefined) return; pendingAd=t; window.vrAdType=t; window.vrAd=1; ui.innerHTML=`<div style="position:fixed;inset:0;background:rgba(0,0,0,.7);display:grid;place-items:center;z-index:50;color:white;font-weight:800">Cargando anuncio...</div>`; }

  function randIcon(){ return Math.floor(Math.random()*(mult===1?4:mult===2?5:6)); }

  function createBoard(){
    // evita matches iniciales
    do{
      board=Array(SZ).fill(0).map(()=>Array(SZ).fill(0).map(()=>randIcon()));
    }while(findAllMatches().length>0);
    score=0; crushes=0; sel=null; busy=false; startTime=Date.now(); startSession(); draw();
  }

  function draw(){
    gridEl.innerHTML='';
    for(let r=0;r<SZ;r++) for(let c=0;c<SZ;c++){
      const cell=document.createElement('div'); cell.className='cc-cell'; cell.dataset.r=r; cell.dataset.c=c;
      const v=board[r][c];
      const candy=document.createElement('div'); candy.className='cc-candy';
      candy.style.background=`radial-gradient(ellipse at 30% 20%, ${COLORS[v]}ff, ${COLORS[v]}cc)`;
      candy.style.border=`2px solid ${COLORS[v]}`;
      candy.textContent=ICONS[v];
      candy.style.color='#fff'; candy.style.textShadow='0 1px 0 rgba(0,0,0,.8)';
      if(sel && sel.r==r && sel.c==c) cell.classList.add('sel');
      cell.appendChild(candy);
      gridEl.appendChild(cell);
    }
    root.querySelector('#cScore').textContent=score;
    root.querySelector('#cBest').textContent=Math.max(best,score);
    root.querySelector('#cReward').textContent='+'+fmt(totalReward);
    root.querySelector('#cProg').textContent=crushes+'/'+MERGES_FOR_REWARD;
    root.querySelector('#cBar').style.width=(crushes/MERGES_FOR_REWARD*100)+'%';
    if(score>best){ best=score; localStorage.setItem('wcrush_best',best); }
  }

  function isAdj(r1,c1,r2,c2){ return Math.abs(r1-r2)+Math.abs(c1-c2)===1; }

  function handleSelect(r,c){
    if(busy) return;
    if(!sel){ sel={r,c}; draw(); return; }
    if(sel.r===r && sel.c===c){ sel=null; draw(); return; }
    if(!isAdj(sel.r,sel.c,r,c)){ sel={r,c}; draw(); return; }
    trySwap(sel.r,sel.c,r,c);
  }

  async function trySwap(r1,c1,r2,c2){
    if(busy) return; busy=true;
    swap(r1,c1,r2,c2); draw();
    await new Promise(res=>setTimeout(res,120));
    let matches=findAllMatches();
    if(matches.length===0){
      swap(r1,c1,r2,c2); draw(); busy=false; sel=null; return;
    }
    sel=null;
    await processCascade(matches);
    busy=false;
  }

  function swap(r1,c1,r2,c2){ const t=board[r1][c1]; board[r1][c1]=board[r2][c2]; board[r2][c2]=t; }

  function findAllMatches(){
    const matched=new Set();
    // horizontal
    for(let r=0;r<SZ;r++){
      let count=1;
      for(let c=1;c<SZ;c++){
        if(board[r][c]===board[r][c-1] && board[r][c]!==-1) count++;
        else{
          if(count>=3){ for(let k=0;k<count;k++) matched.add(r+','+(c-1-k)); }
          count=1;
        }
      }
      if(count>=3){ for(let k=0;k<count;k++) matched.add(r+','+(SZ-1-k)); }
    }
    // vertical
    for(let c=0;c<SZ;c++){
      let count=1;
      for(let r=1;r<SZ;r++){
        if(board[r][c]===board[r-1][c] && board[r][c]!==-1) count++;
        else{
          if(count>=3){ for(let k=0;k<count;k++) matched.add((r-1-k)+','+c); }
          count=1;
        }
      }
      if(count>=3){ for(let k=0;k<count;k++) matched.add((SZ-1-k)+','+c); }
    }
    return Array.from(matched);
  }

  async function processCascade(initialMatches){
    let totalMatched=0; let combo=0; let matches=initialMatches;
    while(matches.length>0){
      combo++;
      totalMatched+=matches.length;
      // animar pop
      matches.forEach(key=>{
        const [r,c]=key.split(',').map(Number);
        const el=gridEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
        if(el) el.classList.add('matched');
        board[r][c]=-1;
      });
      if(combo>1){
        const comboEl=document.createElement('div'); comboEl.className='cc-combo'; comboEl.textContent=`COMBO x${combo}! +${matches.length*10*combo*mult}`;
        root.querySelector('#board').appendChild(comboEl);
        setTimeout(()=>comboEl.remove(),800);
      }
      score+=matches.length*10*combo*mult;
      crushes+=1;
      draw();
      await new Promise(r=>setTimeout(r,350));
      // gravedad + rellenar
      for(let c=0;c<SZ;c++){
        let write=SZ-1;
        for(let r=SZ-1;r>=0;r--){
          if(board[r][c]!==-1){
            board[write][c]=board[r][c];
            if(write!==r) board[r][c]=-1;
            write--;
          }
        }
        for(let r=write;r>=0;r--) board[r][c]=randIcon();
      }
      draw();
      await new Promise(r=>setTimeout(r,180));
      // marcar caida
      gridEl.querySelectorAll('.cc-cell').forEach(el=>{ el.classList.add('fall'); setTimeout(()=>el.classList.remove('fall'),320); });
      await new Promise(r=>setTimeout(r,150));
      matches=findAllMatches();
    }
    if(crushes>=MERGES_FOR_REWARD) showReward();
  }

  function showReward(){
    ui.innerHTML=`<div style="position:fixed;inset:0;background:rgba(8,6,20,.88);backdrop-filter:blur(14px);display:grid;place-items:center;z-index:30;padding:16px"><div style="background:linear-gradient(180deg,#1e1b3a,#12102a);border:2px solid #3d3370;border-radius:22px;padding:22px;text-align:center;width:min(360px,94vw);color:white;box-shadow:0 20px 60px rgba(0,0,0,.6)"><div style="font-size:36px">₿✨</div><div style="font-weight:900;margin:8px 0;font-size:18px">¡${MERGES_FOR_REWARD} CRUSHES!</div><div style="background:rgba(34,197,94,.15);border:1px solid #22c55e;border-radius:12px;padding:10px;margin:12px 0;font-weight:800;color:#86efac">💰 +${fmt(BASE_REWARD*mult)} WASA</div><button id="btnDouble" style="width:100%;height:44px;border-radius:12px;font-weight:900;border:0;background:linear-gradient(135deg,#facc15,#f59e0b);color:#000;cursor:pointer">📺 X2 VER ANUNCIO = ${fmt(BASE_REWARD*mult*2)}</button><button id="btnClaim" style="width:100%;height:44px;border-radius:12px;font-weight:900;border:2px solid #3d3370;background:#0f0a1e;color:#fff;margin-top:8px;cursor:pointer">COBRAR ${fmt(BASE_REWARD*mult)} WASA</button></div></div>`;
    ui.querySelector('#btnDouble').onclick=()=>openAd('double');
    ui.querySelector('#btnClaim').onclick=async()=>{
      const btn=ui.querySelector('#btnClaim'); btn.textContent='⏳ VALIDANDO...'; btn.disabled=true;
      const res=await claim(false,false);
      if(res.ok){ totalReward+=BASE_REWARD*mult; crushes=0; startTime=Date.now(); startSession(); draw(); ui.innerHTML=`<div style="position:fixed;inset:0;background:rgba(0,0,0,.75);display:grid;place-items:center;z-index:40"><div style="background:#12102a;border:2px solid #22c55e;border-radius:14px;padding:16px;text-align:center;color:white;width:min(300px,90vw)"><div style="color:#22c55e;font-weight:900">¡+${fmt(BASE_REWARD*mult)} WASA ACREDITADO!</div><button id="ok" style="margin-top:10px;width:100%;height:40px;border-radius:999px;background:#22c55e;color:#000;font-weight:900;border:0;cursor:pointer">SEGUIR JUGANDO</button></div></div>`; ui.querySelector('#ok').onclick=()=>{ ui.innerHTML=''; draw(); }; } else { btn.textContent=res.error||'REINTENTAR'; btn.disabled=false; }
    };
  }

  // INPUT: click + drag mobile
  let dragStart=null;
  gridEl.addEventListener('pointerdown', e=>{
    const cell=e.target.closest('.cc-cell'); if(!cell) return;
    dragStart={r:+cell.dataset.r, c:+cell.dataset.c, x:e.clientX, y:e.clientY};
    e.preventDefault();
  });
  gridEl.addEventListener('pointerup', e=>{
    if(!dragStart) return;
    const cell=e.target.closest('.cc-cell');
    const dx=e.clientX-dragStart.x, dy=e.clientY-dragStart.y;
    if(cell && isAdj(dragStart.r,dragStart.c,+cell.dataset.r,+cell.dataset.c)){
      trySwap(dragStart.r,dragStart.c,+cell.dataset.r,+cell.dataset.c);
    } else if(Math.abs(dx)>24 || Math.abs(dy)>24){
      // swipe direction
      let nr=dragStart.r, nc=dragStart.c;
      if(Math.abs(dx)>Math.abs(dy)){ nc+= dx>0?1:-1; } else { nr+= dy>0?1:-1; }
      if(nr>=0&&nr<SZ&&nc>=0&&nc<SZ) trySwap(dragStart.r,dragStart.c,nr,nc);
      else handleSelect(dragStart.r,dragStart.c);
    } else {
      handleSelect(dragStart.r,dragStart.c);
    }
    dragStart=null;
  });
  // fallback click
  gridEl.addEventListener('click', e=>{
    const cell=e.target.closest('.cc-cell'); if(!cell) return;
    // evita doble trigger con pointer
    if(dragStart) return;
    handleSelect(+cell.dataset.r,+cell.dataset.c);
  });

  const watcher=setInterval(()=>{ if(window.vrAd===4 && pendingAd){ const t=pendingAd; pendingAd=null; window.vrAd=0; window.vrAdType=null; (async()=>{
    if(t==='double'){
      ui.innerHTML=`<div style="position:fixed;inset:0;background:rgba(0,0,0,.7);display:grid;place-items:center;z-index:40;color:white">Validando X2...</div>`;
      const res=await claim(true,true);
      if(res.ok){ totalReward+=BASE_REWARD*mult*2; crushes=0; startTime=Date.now(); startSession(); draw(); ui.innerHTML=`<div style="position:fixed;inset:0;background:rgba(0,0,0,.75);display:grid;place-items:center;z-index:40"><div style="background:#12102a;border:2px solid #22c55e;border-radius:14px;padding:16px;text-align:center;color:white;width:min(300px,90vw)"><div style="color:#22c55e;font-weight:900">¡X2 +${fmt(BASE_REWARD*mult*2)} WASA!</div><button id="ok2" style="margin-top:10px;width:100%;height:40px;border-radius:999px;background:#22c55e;color:#000;font-weight:900;border:0">OK</button></div></div>`; ui.querySelector('#ok2').onclick=()=>{ ui.innerHTML=''; draw(); }; }
      else { ui.innerHTML=`<div style="position:fixed;inset:0;background:rgba(0,0,0,.75);display:grid;place-items:center;z-index:40"><div style="background:#12102a;border:2px solid #ef4444;border-radius:12px;padding:12px;text-align:center;color:white"><div style="color:#ef4444">Error: ${res.error||'server'}</div><button id="retry">Reintentar</button></div></div>`; ui.querySelector('#retry').onclick=()=>{ ui.innerHTML=''; showReward(); }; }
    }
  })(); } },150);

  root.querySelector('#d1').onclick=()=>{ mult=1; root.querySelectorAll('.cc-diff').forEach(el=>el.classList.remove('active')); root.querySelector('#d1').classList.add('active'); createBoard(); };
  root.querySelector('#d2').onclick=()=>{ mult=2; root.querySelectorAll('.cc-diff').forEach(el=>el.classList.remove('active')); root.querySelector('#d2').classList.add('active'); createBoard(); };
  root.querySelector('#d3').onclick=()=>{ mult=3; root.querySelectorAll('.cc-diff').forEach(el=>el.classList.remove('active')); root.querySelector('#d3').classList.add('active'); createBoard(); };

  createBoard();
  container._cleanup=()=>{ clearInterval(watcher); window.vrAd=0; };
}
