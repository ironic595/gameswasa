// games/crypto-crush/game.js - v3 CANDY CRUSH VIVO + ESPECIALES - 4 en linea = rayada, L/T = bomba
export function init(container, args){
  const WORKER_URL = window.WASA_CONFIG?.WORKER_URL || 'https://games-wasa-worker.javisimes.workers.dev/';
  function getDeviceId(){ let id=localStorage.getItem('wasa_device_id'); if(!id){ id='dev_'+Math.random().toString(36).slice(2)+Date.now().toString(36); localStorage.setItem('wasa_device_id',id);} return id; }
  function fmt(n){ const v=parseFloat(n)||0; if(v===0) return '0'; return (Math.round(v*1e7)/1e7).toFixed(7).replace(/0+$/,'').replace(/\.$/,''); }

  // colores VIVOS candy
  const ICONS = ['₿','Ξ','₮','🐶','◎','Ł'];
  const COLORS = [
    {bg:'#FFB347', bd:'#FF8C00', light:'#FFD699'}, // BTC naranja vivo
    {bg:'#7DD3FC', bd:'#0EA5E9', light:'#BAE6FD'}, // ETH celeste vivo
    {bg:'#6EE7B7', bd:'#10B981', light:'#A7F3D0'}, // USDT verde vivo
    {bg:'#FDE047', bd:'#EAB308', light:'#FEF08A'}, // DOGE amarillo vivo
    {bg:'#C4B5FD', bd:'#8B5CF6', light:'#DDD6FE'}, // SOL violeta vivo
    {bg:'#FDA4AF', bd:'#F43F5E', light:'#FECDD3'}  // LTC rosa vivo
  ];
  const SZ = 8;
  const BASE_REWARD = 0.0001;
  const MERGES_FOR_REWARD = 25;

  container.innerHTML=`<style>
.cc{width:100%;height:100%;min-height:100vh;display:flex;flex-direction:column;align-items:center;background:#6B3DF0;background:radial-gradient(ellipse at 50% 0%, #8B5CF6 0%, #6D28D9 25%, #4C1D95 60%, #1E0B3A 100%);color:#fff;font-family:Inter,system-ui;overflow:auto;position:relative;padding-bottom:24px}
.cc-area{width:100%;max-width:480px;padding:10px 12px;display:flex;flex-direction:column;gap:10px;align-items:center}
.cc-stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;width:100%}
.cc-stat{background:rgba(255,255,255,.95);border-radius:14px;padding:8px 12px;color:#2a1a5e;box-shadow:0 6px 16px rgba(0,0,0,.25), inset 0 1px 0 #fff}
.cc-stat b{font-size:16px;font-weight:900;display:block;color:#2a1a5e}
.cc-stat span{font-size:8px;letter-spacing:.08em;opacity:.6;font-weight:800;text-transform:uppercase}
.cc-stat.gold{background:linear-gradient(180deg,#FEF08A,#FACC15);border:2px solid #EAB308}
.cc-stat.gold b{color:#000}
.cc-bar-wrap{width:100%;background:rgba(255,255,255,.92);border-radius:14px;padding:8px 12px;color:#2a1a5e;box-shadow:0 4px 12px rgba(0,0,0,.2)}
.cc-bar{height:12px;background:#EDE9FE;border-radius:999px;overflow:hidden;margin-top:6px;border:1px solid #DDD6FE}
.cc-bar-fill{height:100%;background:linear-gradient(90deg,#22C55E,#4ADE80);width:0%;transition:width .5s ease;border-radius:999px}

.cc-board{width:100%;aspect-ratio:1;background:rgba(255,255,255,.96);border-radius:22px;padding:8px;box-shadow:0 24px 60px rgba(0,0,0,.45), 0 0 0 3px rgba(255,255,255,.9), inset 0 2px 0 #fff;position:relative;touch-action:none;user-select:none}
.cc-grid{display:grid;grid-template-columns:repeat(${SZ},1fr);grid-template-rows:repeat(${SZ},1fr);gap:5px;width:100%;height:100%}
.cc-cell{position:relative;border-radius:14px;display:grid;place-items:center;cursor:pointer;transition:transform .18s cubic-bezier(.34,1.56,.64,1);will-change:transform}
.cc-cell:active{transform:scale(.88)}
.cc-cell.sel{transform:scale(1.15);z-index:5}
.cc-cell.sel::after{content:'';position:absolute;inset:-3px;border:3.5px solid #FACC15;border-radius:16px;box-shadow:0 0 18px #FACC15, inset 0 0 8px rgba(250,204,21,.5);pointer-events:none}

.cc-candy{width:88%;height:88%;border-radius:18px;display:grid;place-items:center;font-weight:900;font-size:22px;position:relative;box-shadow:0 4px 0 rgba(0,0,0,.15), inset 0 2px 0 rgba(255,255,255,.9), inset 0 -2px 0 rgba(0,0,0,.1);border:2px solid rgba(0,0,0,.08);overflow:hidden}
.cc-candy::before{content:'';position:absolute;top:8%;left:14%;width:36%;height:28%;background:rgba(255,255,255,.85);border-radius:50%;filter:blur(.3px)}
.cc-candy.bomb{border-radius:14px;box-shadow:0 0 0 2px #fff, 0 4px 0 rgba(0,0,0,.2), 0 0 16px currentColor}
.cc-candy.bomb::after{content:'💥';position:absolute;bottom:-4px;right:-4px;font-size:14px}
.cc-candy.striped-h{overflow:visible}
.cc-candy.striped-h::after{content:'';position:absolute;left:-6px;right:-6px;top:50%;height:6px;background:repeating-linear-gradient(90deg, #fff 0 6px, transparent 6px 12px);transform:translateY(-50%);border-radius:999px;box-shadow:0 0 8px #fff}
.cc-candy.striped-v::after{content:'';position:absolute;top:-6px;bottom:-6px;left:50%;width:6px;background:repeating-linear-gradient(180deg, #fff 0 6px, transparent 6px 12px);transform:translateX(-50%);border-radius:999px;box-shadow:0 0 8px #fff}
.cc-candy.color-bomb{background:radial-gradient(circle at 30% 30%, #fff, #ddd 20%, #aaa 40%, #444 100%) !important;color:#fff !important;border:3px solid #fff !important;box-shadow:0 0 20px #fff, 0 4px 0 rgba(0,0,0,.3) !important;animation:rainbow 1.5s linear infinite}
@keyframes rainbow{0%{filter:hue-rotate(0deg) brightness(1.2)}100%{filter:hue-rotate(360deg) brightness(1.2)}}

.cc-cell.matched{animation:pop .5s cubic-bezier(.34,1.56,.64,1) forwards}
@keyframes pop{0%{transform:scale(1)}25%{transform:scale(1.4)}100%{transform:scale(0) rotate(180deg);opacity:0}}
.cc-cell.fall{animation:fall .38s cubic-bezier(.25,.46,.45,.94)}
@keyframes fall{0%{transform:translateY(-140%)}70%{transform:translateY(10%)}100%{transform:translateY(0)}}
.cc-cell.new{animation:newpop .35s cubic-bezier(.34,1.56,.64,1)}
@keyframes newpop{0%{transform:scale(0)}60%{transform:scale(1.2)}100%{transform:scale(1)}}
.cc-explo{position:absolute;left:50%;top:50%;width:10px;height:10px;background:radial-gradient(circle, #fff, #FACC15, transparent);border-radius:50%;pointer-events:none;transform:translate(-50%,-50%);animation:explo .5s ease-out forwards;z-index:20}
@keyframes explo{0%{width:10px;height:10px;opacity:1}100%{width:120px;height:120px;opacity:0}}
.cc-combo{position:absolute;left:50%;top:20%;transform:translateX(-50%);background:linear-gradient(135deg,#FACC15,#F59E0B);color:#000;padding:6px 14px;border-radius:999px;font-weight:900;font-size:16px;box-shadow:0 6px 16px rgba(0,0,0,.4);pointer-events:none;animation:combo .9s ease forwards;z-index:30;border:2px solid #fff}
@keyframes combo{0%{opacity:0;transform:translateX(-50%) translateY(20px) scale(.6)}20%{opacity:1;transform:translateX(-50%) translateY(0) scale(1.2)}100%{opacity:0;transform:translateX(-50%) translateY(-40px) scale(1)}}

.cc-diffs{display:flex;gap:8px;width:100%}
.cc-diff{flex:1;height:42px;border-radius:14px;border:2.5px solid #fff;background:rgba(255,255,255,.9);color:#4C1D95;font-weight:900;font-size:11px;cursor:pointer;display:grid;place-items:center;box-shadow:0 4px 12px rgba(0,0,0,.2);transition:all .15s}
.cc-diff.active{background:#FACC15;border-color:#EAB308;color:#000;transform:translateY(-2px);box-shadow:0 8px 20px rgba(250,204,21,.5)}
@media(max-width:480px){.cc-grid{gap:4px}.cc-candy{font-size:19px;border-radius:13px}.cc-board{padding:6px;border-radius:18px}.cc-cell{border-radius:11px}}
</style>
<div class="cc" id="root">
  <div class="cc-area">
    <div class="cc-stats">
      <div class="cc-stat"><b id="cScore">0</b><span>Score</span></div>
      <div class="cc-stat"><b id="cBest">0</b><span>Best</span></div>
      <div class="cc-stat gold"><b id="cReward">+0.0000000</b><span>WASA TOTAL</span></div>
    </div>
    <div class="cc-bar-wrap">
      <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:900"><span>PROGRESO PREMIO</span><span id="cProg">0/${MERGES_FOR_REWARD}</span></div>
      <div class="cc-bar"><div class="cc-bar-fill" id="cBar"></div></div>
      <div style="font-size:9px;opacity:.7;margin-top:4px;display:flex;gap:8px"><span>4 en línea = rayada</span><span>•</span><span>L/T = bomba 💥</span><span>•</span><span>5 = arcoiris</span></div>
    </div>
    <div class="cc-board" id="board"><div class="cc-grid" id="grid"></div></div>
    <div class="cc-diffs">
      <div class="cc-diff" id="d1">EASY</div><div class="cc-diff active" id="d2">MEDIUM</div><div class="cc-diff" id="d3">HARD X2</div>
    </div>
  </div>
  <div id="ui"></div>
</div>`;

  const root=container.querySelector('#root'); const ui=root.querySelector('#ui');
  const gridEl=root.querySelector('#grid');
  let best=parseInt(localStorage.getItem('wcrush_best')||'0');
  let score=0, board=[], totalReward=0, crushes=0, mult=2, busy=false, sel=null, lastSwap=null;
  let session=null, claiming=false, pendingAd=null, startTime=Date.now();

  async function startSession(){ try{ const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start_game_session', email:localStorage.getItem('wasa_email'), wallet:localStorage.getItem('wasa_wallet'), device_id:getDeviceId(), game_slug:'crypto-crush', level:MERGES_FOR_REWARD})}); const j=await r.json(); if(j.ok) session=j.session_id; }catch{} }
  async function claim(isDouble, ad){ if(claiming) return {ok:false}; if(!session) await startSession(); if(!session) return {ok:false}; claiming=true; try{ const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'claim_reward', session_id:session, email:localStorage.getItem('wasa_email'), wallet:localStorage.getItem('wasa_wallet'), device_id:getDeviceId(), game_slug:'crypto-crush', level:MERGES_FOR_REWARD, ad_watched:ad, double_reward:isDouble, time_taken:(Date.now()-startTime)/1000})}); const j=await r.json(); if(j.ok){ const b=j.wasa_balance??j.guest_balance??0; localStorage.setItem(j.is_guest?'wasa_coins_guest':'wasa_coins',b); if(window.setCoinsUI) window.setCoinsUI(b); session=null; claiming=false; return j; } claiming=false; return {ok:false, error:j.error}; }catch{ claiming=false; return {ok:false}; } }
  function openAd(t){ if(window.vrAd!==0 && window.vrAd!==undefined) return; pendingAd=t; window.vrAdType=t; window.vrAd=1; ui.innerHTML=`<div style="position:fixed;inset:0;background:rgba(0,0,0,.7);display:grid;place-items:center;z-index:50;color:white;font-weight:800">Cargando anuncio...</div>`; }

  function randColor(){ return Math.floor(Math.random()*(mult===1?4:mult===2?5:6)); }
  function makeCell(color, special=null){ return {c:color, s:special}; } // s: null, 'h','v','bomb','color'

  function createBoard(){
    let tries=0;
    do{
      board=Array(SZ).fill(0).map(()=>Array(SZ).fill(0).map(()=>makeCell(randColor())));
      tries++;
    }while(findMatches().groups.length>0 && tries<100);
    score=0; crushes=0; sel=null; busy=false; lastSwap=null; startTime=Date.now(); startSession(); draw();
  }

  function draw(){
    gridEl.innerHTML='';
    for(let r=0;r<SZ;r++) for(let c=0;c<SZ;c++){
      const cell=document.createElement('div'); cell.className='cc-cell'; cell.dataset.r=r; cell.dataset.c=c;
      const obj=board[r][c]; if(!obj) continue;
      const candy=document.createElement('div'); 
      let cls='cc-candy';
      if(obj.s==='bomb') cls+=' bomb';
      else if(obj.s==='h') cls+=' striped-h';
      else if(obj.s==='v') cls+=' striped-v';
      else if(obj.s==='color') cls+=' color-bomb';
      candy.className=cls;
      if(obj.s==='color'){
        candy.textContent='🌈';
      } else {
        candy.textContent=ICONS[obj.c];
        const col=COLORS[obj.c];
        candy.style.background=`linear-gradient(180deg, ${col.light}, ${col.bg})`;
        candy.style.borderColor=col.bd;
        candy.style.color='#fff';
        if(obj.s==='bomb') candy.style.boxShadow=`0 0 0 2px #fff, 0 4px 0 rgba(0,0,0,.2), 0 0 18px ${col.bg}`;
      }
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
    // si es bomba de color activada
    const obj=board[r][c];
    if(obj.s==='color' && sel){
      // color bomb + normal = borra todo ese color
      const targetColor=board[sel.r][sel.c].c;
      activateColorBomb(r,c,targetColor);
      return;
    }
    if(obj.s && sel===null && (obj.s==='h'||obj.s==='v'||obj.s==='bomb')){
      // activar especial sola
      activateSpecial(r,c);
      return;
    }
    if(!sel){ sel={r,c}; draw(); return; }
    if(sel.r===r && sel.c===c){ sel=null; draw(); return; }
    if(!isAdj(sel.r,sel.c,r,c)){ sel={r,c}; draw(); return; }
    trySwap(sel.r,sel.c,r,c);
  }

  function activateSpecial(r,c){
    if(busy) return; busy=true;
    const obj=board[r][c];
    let toRemove=new Set();
    if(obj.s==='h'){
      for(let cc=0;cc<SZ;cc++) toRemove.add(r+','+cc);
    } else if(obj.s==='v'){
      for(let rr=0;rr<SZ;rr++) toRemove.add(rr+','+c);
    } else if(obj.s==='bomb'){
      for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
        const nr=r+dr, nc=c+dc; if(nr>=0&&nr<SZ&&nc>=0&&nc<SZ) toRemove.add(nr+','+nc);
      }
    }
    processMatchesWithSet(Array.from(toRemove), {r,c});
  }

  function activateColorBomb(r,c,targetColor){
    if(busy) return; busy=true;
    let toRemove=new Set();
    toRemove.add(r+','+c);
    for(let rr=0;rr<SZ;rr++) for(let cc=0;cc<SZ;cc++) if(board[rr][cc].c===targetColor) toRemove.add(rr+','+cc);
    processMatchesWithSet(Array.from(toRemove), {r,c});
  }

  async function trySwap(r1,c1,r2,c2){
    if(busy) return; busy=true; lastSwap={r1,c1,r2,c2};
    const a=board[r1][c1], b=board[r2][c2];
    // color bomb swap
    if(a.s==='color' || b.s==='color'){
      const colorBomb = a.s==='color' ? a : b;
      const other = a.s==='color' ? b : a;
      const br = a.s==='color' ? r1 : r2;
      const bc = a.s==='color' ? c1 : c2;
      let toRemove=new Set();
      toRemove.add(br+','+bc);
      if(other.s==='color'){
        // color + color = limpia todo
        for(let rr=0;rr<SZ;rr++) for(let cc=0;cc<SZ;cc++) toRemove.add(rr+','+cc);
      } else {
        for(let rr=0;rr<SZ;rr++) for(let cc=0;cc<SZ;cc++) if(board[rr][cc].c===other.c) toRemove.add(rr+','+cc);
      }
      sel=null; draw();
      await new Promise(r=>setTimeout(r,120));
      await processMatchesWithSet(Array.from(toRemove), {r:br,c:bc});
      busy=false;
      return;
    }

    swap(r1,c1,r2,c2); draw();
    await new Promise(res=>setTimeout(res,140));
    let found=findMatches();
    if(found.groups.length===0){
      swap(r1,c1,r2,c2); draw(); busy=false; sel=null; return;
    }
    sel=null;
    await processCascade(found);
    busy=false;
  }

  function swap(r1,c1,r2,c2){ const t=board[r1][c1]; board[r1][c1]=board[r2][c2]; board[r2][c2]=t; }

  function findMatches(){
    const groups=[]; const allCells=new Set();
    // horizontales
    for(let r=0;r<SZ;r++){
      let c=0;
      while(c<SZ){
        const start=c; const col=board[r][c]?.c; if(col===undefined){ c++; continue; }
        let end=c+1; while(end<SZ && board[r][end]?.c===col) end++;
        const len=end-start;
        if(len>=3){
          const cells=[]; for(let k=start;k<end;k++) cells.push({r,c:k});
          groups.push({cells, len, dir:'h', color:col, row:r});
          cells.forEach(cell=>allCells.add(cell.r+','+cell.c));
        }
        c=end;
      }
    }
    // verticales
    for(let c=0;c<SZ;c++){
      let r=0;
      while(r<SZ){
        const start=r; const col=board[r][c]?.c; if(col===undefined){ r++; continue; }
        let end=r+1; while(end<SZ && board[end][c]?.c===col) end++;
        const len=end-start;
        if(len>=3){
          const cells=[]; for(let k=start;k<end;k++) cells.push({r:k,c});
          groups.push({cells, len, dir:'v', color:col, col:c});
          cells.forEach(cell=>allCells.add(cell.r+','+cell.c));
        }
        r=end;
      }
    }
    return {groups, all:Array.from(allCells)};
  }

  async function processCascade(firstFind){
    let combo=0;
    let current=firstFind;
    while(current.groups.length>0){
      combo++;
      // detectar especiales a crear
      const specialsToCreate=[];
      const cellToGroups=new Map();
      current.groups.forEach(g=>g.cells.forEach(cell=>{
        const key=cell.r+','+cell.c;
        if(!cellToGroups.has(key)) cellToGroups.set(key,[]);
        cellToGroups.get(key).push(g);
      }));
      // T/L -> bomba
      for(const [key, gList] of cellToGroups){
        if(gList.length>=2){
          // cruza h y v
          const hasH=gList.some(g=>g.dir==='h'); const hasV=gList.some(g=>g.dir==='v');
          if(hasH && hasV){
            const [r,c]=key.split(',').map(Number);
            specialsToCreate.push({r,c,type:'bomb', color:board[r][c].c});
          }
        }
      }
      // 4 en linea -> rayada, 5+ -> color
      current.groups.forEach(g=>{
        if(g.len===4){
          // crea rayada en posicion del swap si esta en el grupo, sino en centro
          let target=g.cells[Math.floor(g.cells.length/2)];
          if(lastSwap){
            const inGroup = g.cells.some(cell=> (cell.r===lastSwap.r1 && cell.c===lastSwap.c1) || (cell.r===lastSwap.r2 && cell.c===lastSwap.c2));
            if(inGroup){
              // elige el del swap
              if(g.cells.some(cell=>cell.r===lastSwap.r1 && cell.c===lastSwap.c1)) target={r:lastSwap.r1,c:lastSwap.c1};
              else target={r:lastSwap.r2,c:lastSwap.c2};
            }
          }
          const already= specialsToCreate.some(s=>s.r===target.r && s.c===target.c);
          if(!already) specialsToCreate.push({r:target.r,c:target.c,type: g.dir==='h' ? 'v' : 'h', color:g.color});
        } else if(g.len>=5){
          let target=g.cells[Math.floor(g.cells.length/2)];
          if(lastSwap){
            if(g.cells.some(cell=>cell.r===lastSwap.r1 && cell.c===lastSwap.c1)) target={r:lastSwap.r1,c:lastSwap.c1};
            else if(g.cells.some(cell=>cell.r===lastSwap.r2 && cell.c===lastSwap.c2)) target={r:lastSwap.r2,c:lastSwap.c2};
          }
          specialsToCreate.push({r:target.r,c:target.c,type:'color', color:g.color});
        }
      });

      // marcar celdas a borrar (quitando donde se creara especial)
      let toRemoveSet=new Set(current.all);
      specialsToCreate.forEach(s=> toRemoveSet.delete(s.r+','+s.c));

      await processMatchesWithSet(Array.from(toRemoveSet), null, combo, specialsToCreate);
      // siguiente cascada
      current=findMatches();
      if(current.groups.length>0) await new Promise(r=>setTimeout(r,150));
    }
    if(crushes>=MERGES_FOR_REWARD) showReward();
  }

  async function processMatchesWithSet(keys, origin, combo=1, specialsToCreate=[]){
    // animar
    keys.forEach(k=>{
      const [r,c]=k.split(',').map(Number);
      const el=gridEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
      if(el){
        el.classList.add('matched');
        const explo=document.createElement('div'); explo.className='cc-explo'; el.appendChild(explo);
      }
      board[r][c]=null;
    });
    score+=keys.length*10*combo*mult;
    crushes+=1;
    if(combo>1){
      const comboEl=document.createElement('div'); comboEl.className='cc-combo'; comboEl.textContent=`COMBO x${combo}! +${keys.length*10*combo*mult}`;
      root.querySelector('#board').appendChild(comboEl); setTimeout(()=>comboEl.remove(),900);
    }
    draw();
    await new Promise(r=>setTimeout(r,420));
    // gravedad
    for(let c=0;c<SZ;c++){
      let write=SZ-1;
      for(let r=SZ-1;r>=0;r--){
        if(board[r][c]!==null){
          if(write!==r){ board[write][c]=board[r][c]; board[r][c]=null; }
          write--;
        }
      }
      for(let r=write;r>=0;r--) board[r][c]=makeCell(randColor());
    }
    // colocar especiales
    specialsToCreate.forEach(s=>{
      if(board[s.r] && board[s.r][s.c]!==undefined){
        board[s.r][s.c]=makeCell(s.color, s.type);
      }
    });
    draw();
    gridEl.querySelectorAll('.cc-cell').forEach(el=>{
      if(!el.classList.contains('matched')){
        el.classList.add('fall');
        setTimeout(()=>el.classList.remove('fall'),380);
      }
    });
    await new Promise(r=>setTimeout(r,200));
    lastSwap=null;
  }

  function showReward(){
    ui.innerHTML=`<div style="position:fixed;inset:0;background:rgba(18,10,42,.88);backdrop-filter:blur(14px);display:grid;place-items:center;z-index:30;padding:16px"><div style="background:linear-gradient(180deg,#fff,#F3F0FF);border:3px solid #8B5CF6;border-radius:22px;padding:22px;text-align:center;width:min(360px,94vw);color:#2a1a5e;box-shadow:0 24px 60px rgba(0,0,0,.5)"><div style="font-size:40px">🍬✨</div><div style="font-weight:900;margin:8px 0;font-size:20px;color:#4C1D95">¡${MERGES_FOR_REWARD} CRUSHES!</div><div style="background:linear-gradient(180deg,#DCFCE7,#86EFAC);border:2px solid #22C55E;border-radius:14px;padding:12px;margin:12px 0;font-weight:900;color:#065F46">💰 +${fmt(BASE_REWARD*mult)} WASA</div><button id="btnDouble" style="width:100%;height:46px;border-radius:14px;font-weight:900;border:0;background:linear-gradient(135deg,#FACC15,#F59E0B);color:#000;cursor:pointer;box-shadow:0 6px 0 #CA8A04">📺 X2 VER ANUNCIO = ${fmt(BASE_REWARD*mult*2)}</button><button id="btnClaim" style="width:100%;height:46px;border-radius:14px;font-weight:900;border:2.5px solid #DDD6FE;background:#fff;color:#4C1D95;margin-top:10px;cursor:pointer">COBRAR ${fmt(BASE_REWARD*mult)} WASA</button></div></div>`;
    ui.querySelector('#btnDouble').onclick=()=>openAd('double');
    ui.querySelector('#btnClaim').onclick=async()=>{
      const btn=ui.querySelector('#btnClaim'); btn.textContent='⏳ VALIDANDO...'; btn.disabled=true;
      const res=await claim(false,false);
      if(res.ok){ totalReward+=BASE_REWARD*mult; crushes=0; startTime=Date.now(); startSession(); draw(); ui.innerHTML=`<div style="position:fixed;inset:0;background:rgba(0,0,0,.75);display:grid;place-items:center;z-index:40"><div style="background:#fff;border:3px solid #22C55E;border-radius:18px;padding:18px;text-align:center;color:#065F46;width:min(320px,90vw)"><div style="font-weight:900;font-size:18px">¡+${fmt(BASE_REWARD*mult)} WASA!</div><button id="ok" style="margin-top:12px;width:100%;height:44px;border-radius:999px;background:#22C55E;color:#000;font-weight:900;border:0;cursor:pointer">SEGUIR</button></div></div>`; ui.querySelector('#ok').onclick=()=>{ ui.innerHTML=''; draw(); }; } else { btn.textContent=res.error||'REINTENTAR'; btn.disabled=false; }
    };
  }

  // INPUT DRAG
  let dragStart=null;
  gridEl.addEventListener('pointerdown', e=>{
    const cell=e.target.closest('.cc-cell'); if(!cell || busy) return;
    dragStart={r:+cell.dataset.r, c:+cell.dataset.c, x:e.clientX, y:e.clientY};
    e.preventDefault();
    cell.setPointerCapture(e.pointerId);
  });
  gridEl.addEventListener('pointerup', e=>{
    if(!dragStart) return;
    const cell=document.elementFromPoint(e.clientX,e.clientY)?.closest('.cc-cell');
    const dx=e.clientX-dragStart.x, dy=e.clientY-dragStart.y;
    if(cell && (dragStart.r!==+cell.dataset.r || dragStart.c!==+cell.dataset.c) && isAdj(dragStart.r,dragStart.c,+cell.dataset.r,+cell.dataset.c)){
      trySwap(dragStart.r,dragStart.c,+cell.dataset.r,+cell.dataset.c);
    } else if(Math.abs(dx)>22 || Math.abs(dy)>22){
      let nr=dragStart.r, nc=dragStart.c;
      if(Math.abs(dx)>Math.abs(dy)){ nc+= dx>0?1:-1; } else { nr+= dy>0?1:-1; }
      if(nr>=0&&nr<SZ&&nc>=0&&nc<SZ) trySwap(dragStart.r,dragStart.c,nr,nc);
      else handleSelect(dragStart.r,dragStart.c);
    } else {
      handleSelect(dragStart.r,dragStart.c);
    }
    dragStart=null;
  });

  const watcher=setInterval(()=>{ if(window.vrAd===4 && pendingAd){ const t=pendingAd; pendingAd=null; window.vrAd=0; window.vrAdType=null; (async()=>{
    if(t==='double'){
      ui.innerHTML=`<div style="position:fixed;inset:0;background:rgba(0,0,0,.7);display:grid;place-items:center;z-index:40;color:white">Validando X2...</div>`;
      const res=await claim(true,true);
      if(res.ok){ totalReward+=BASE_REWARD*mult*2; crushes=0; startTime=Date.now(); startSession(); draw(); ui.innerHTML=`<div style="position:fixed;inset:0;background:rgba(0,0,0,.75);display:grid;place-items:center;z-index:40"><div style="background:#fff;border:3px solid #22C55E;border-radius:18px;padding:18px;text-align:center;width:min(320px,90vw)"><div style="color:#065F46;font-weight:900;font-size:18px">¡X2 +${fmt(BASE_REWARD*mult*2)} WASA!</div><button id="ok2" style="margin-top:10px;width:100%;height:44px;border-radius:999px;background:#22C55E;color:#000;font-weight:900;border:0">OK</button></div></div>`; ui.querySelector('#ok2').onclick=()=>{ ui.innerHTML=''; draw(); }; }
      else { ui.innerHTML=`<div style="position:fixed;inset:0;background:rgba(0,0,0,.75);display:grid;place-items:center;z-index:40"><div style="background:#fff;border:2px solid #ef4444;border-radius:12px;padding:12px;text-align:center;color:#991B1B"><div>Error: ${res.error||'server'}</div><button id="retry" style="margin-top:8px">Reintentar</button></div></div>`; ui.querySelector('#retry').onclick=()=>{ ui.innerHTML=''; showReward(); }; }
    }
  })(); } },150);

  root.querySelector('#d1').onclick=()=>{ mult=1; root.querySelectorAll('.cc-diff').forEach(el=>el.classList.remove('active')); root.querySelector('#d1').classList.add('active'); createBoard(); };
  root.querySelector('#d2').onclick=()=>{ mult=2; root.querySelectorAll('.cc-diff').forEach(el=>el.classList.remove('active')); root.querySelector('#d2').classList.add('active'); createBoard(); };
  root.querySelector('#d3').onclick=()=>{ mult=3; root.querySelectorAll('.cc-diff').forEach(el=>el.classList.remove('active')); root.querySelector('#d3').classList.add('active'); createBoard(); };

  createBoard();
  container._cleanup=()=>{ clearInterval(watcher); window.vrAd=0; };
}
