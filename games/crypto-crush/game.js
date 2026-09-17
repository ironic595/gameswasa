// games/crypto-crush/game.js - v4.4 FIX OBJETIVO SIEMPRE EN PARTIDA - garantiza cripto pedida está en tablero
export function init(container, args){
  const WORKER_URL = window.WASA_CONFIG?.WORKER_URL || 'https://games-wasa-worker.javisimes.workers.dev/';
  function getDeviceId(){ let id=localStorage.getItem('wasa_device_id'); if(!id){ id='dev_'+Math.random().toString(36).slice(2)+Date.now().toString(36); localStorage.setItem('wasa_device_id',id);} return id; }
  function fmt(n){ const v=parseFloat(n)||0; if(v===0) return '0'; return (Math.round(v*1e7)/1e7).toFixed(7).replace(/0+$/,'').replace(/\.$/,''); }

  const ALL_TOKENS = [
    {icon:'₿', name:'BTC',  bg:'#FFB347', bd:'#FF8C00', light:'#FFD699'},
    {icon:'Ξ', name:'ETH',  bg:'#7DD3FC', bd:'#0EA5E9', light:'#BAE6FD'},
    {icon:'Đ', name:'DASH', bg:'#60A5FA', bd:'#2563EB', light:'#93C5FD'},
    {icon:'Ł', name:'LTC',  bg:'#D1D5DB', bd:'#9CA3AF', light:'#F3F4F6'},
    {icon:'W', name:'WASA', bg:'#FDE047', bd:'#EAB308', light:'#FEF08A'},
    {icon:'B', name:'BNB',  bg:'#FBBF24', bd:'#D97706', light:'#FDE68A'},
    {icon:'₮', name:'USDT', bg:'#6EE7B7', bd:'#10B981', light:'#A7F3D0'},
    {icon:'🐶', name:'DOGE',  bg:'#FDE68A', bd:'#EAB308', light:'#FEF9C3'},
    {icon:'🐕', name:'SHIB',  bg:'#FDA4AF', bd:'#F43F5E', light:'#FFE4E6'},
    {icon:'🐸', name:'PEPE',  bg:'#86EFAC', bd:'#22C55E', light:'#DCFCE7'},
    {icon:'🐺', name:'FLOKI', bg:'#C4B5FD', bd:'#7C3AED', light:'#DDD6FE'},
  ];
  const SZ = 8;
  const BASE_REWARD = 0.0001;

  function getUnlockedTokens(level){
    // nivel 1: 5 tokens, cada 3 niveles +1, max 11 - FIX: sin saltos raros
    const count = Math.min(11, 5 + Math.floor((level-1)/3));
    return ALL_TOKENS.slice(0, count);
  }
  function getActiveTokensForLevel(level){
    const unlocked=getUnlockedTokens(level);
    const maxPerGame=level<10?5:6;
    const take=Math.min(maxPerGame, unlocked.length);
    // shuffle deterministico por nivel para evitar que en nivel 2 aparezca BNB si no está desbloqueado
    const shuffled=[...unlocked].sort(()=>Math.random()-0.5);
    let active=shuffled.slice(0, take);
    // fuerza WASA solo si ya está desbloqueado Y ya está en active (no lo mete si no está)
    if(level%3===0 && unlocked.some(t=>t.name==='WASA') && !active.some(t=>t.name==='WASA')){
      // reemplaza uno random por WASA, pero solo si WASA ya desbloqueado
      active[0]=ALL_TOKENS.find(t=>t.name==='WASA');
    }
    return active;
  }

  function generateLevel(n, activeTokens){
    // FIX CRITICO: objetivos SOLO de activeTokens
    const lvl={number:n, moves:0, time:0, objectives:[], reward: BASE_REWARD * (1 + Math.floor(n/10)*0.5), activeTokens };
    const isTimed=n%7===0 && n>10;
    if(isTimed){ lvl.time=Math.max(45, 120-Math.floor(n*0.8)); lvl.moves=999; } else { lvl.moves=Math.max(16, 26-Math.floor(n/25)+Math.floor(n/8)); }

    const numObjs=n<5?1:n<12?2:n<35?3:4;
    const usedNames=new Set();

    for(let i=0;i<numObjs;i++){
      const roll=Math.random();
      if(roll<0.70){
        // 70% cripto - GARANTIZADO que está en esta partida
        let available = activeTokens.filter(t=>!usedNames.has(t.name));
        if(available.length===0) available=activeTokens; // si ya usamos todos, repite
        const token=available[Math.floor(Math.random()*available.length)];
        usedNames.add(token.name);
        const target=Math.floor(8 + n*1.9 + Math.random()*8 + i*3);
        lvl.objectives.push({
          id:token.name+'_'+i+'_'+Date.now(),
          type:'collect_color',
          color:ALL_TOKENS.indexOf(token),
          token,
          name:token.name,
          icon:token.icon,
          target,
          current:0
        });
      } else if(roll<0.85){
        const special=Math.random()<0.5?'bomb':'striped';
        const target=Math.floor(1 + n/14 + Math.random()*2);
        lvl.objectives.push({id:special+'_'+i, type:'collect_special', special, name:special==='bomb'?'BOMBAS 💥':'RAYADAS ↔', icon:special==='bomb'?'💥':'↔', target, current:0});
      } else if(roll<0.95){
        const target=Math.floor(1 + n/22);
        lvl.objectives.push({id:'rainbow_'+i, type:'collect_rainbow', name:'ARCOIRIS 🌈', icon:'🌈', target, current:0});
      } else {
        const target=Math.floor(600 + n*130 + Math.random()*300);
        lvl.objectives.push({id:'score_'+i, type:'score', name:'SCORE', icon:'⭐', target, current:0});
      }
    }

    // FIX: WASA forzado solo si WASA está en activeTokens
    if(n%15===0){
      const wasa=ALL_TOKENS.find(t=>t.name==='WASA');
      if(activeTokens.some(t=>t.name==='WASA') && !lvl.objectives.some(o=>o.name==='WASA')){
        lvl.objectives.push({
          id:'wasa15', type:'collect_color', color:ALL_TOKENS.indexOf(wasa), token:wasa,
          name:'WASA', icon:'W', target:Math.floor(12+n*1.2), current:0
        });
      }
    }

    // validacion final: todos los objetivos de color deben estar en activeTokens
    lvl.objectives = lvl.objectives.filter(o=>{
      if(o.type==='collect_color'){
        return activeTokens.some(t=>t.name===o.name);
      }
      return true;
    });

    // si por filtro quedó vacío, agrega uno de activeTokens
    if(lvl.objectives.length===0){
      const tok=activeTokens[0];
      lvl.objectives.push({id:tok.name, type:'collect_color', color:ALL_TOKENS.indexOf(tok), token:tok, name:tok.name, icon:tok.icon, target:10+n*2, current:0});
    }

    return lvl;
  }

  container.innerHTML=`<style>
html,body{overscroll-behavior:none}
.cc{width:100%;height:100%;min-height:100vh;display:flex;flex-direction:column;background:radial-gradient(ellipse at 50% 0%, #8B5CF6 0%, #6D28D9 25%, #4C1D95 60%, #1E0B3A 100%);color:#fff;font-family:Inter,system-ui;overflow:hidden;position:relative;touch-action:none}
.cc-header{width:100%;background:rgba(255,255,255,.96);color:#2a1a5e;box-shadow:0 4px 20px rgba(0,0,0,.3);z-index:10;flex-shrink:0;border-bottom:2px solid #E9D5FF}
.cc-header-inner{width:100%;padding:6px 10px;display:flex;align-items:center;gap:10px;justify-content:space-between;flex-wrap:nowrap}
.cc-header-left{display:flex;align-items:center;gap:8px;flex-shrink:0}
.cc-level-badge{background:#4C1D95;color:#fff;border-radius:10px;padding:4px 10px;font-weight:900;font-size:12px;line-height:1}
.cc-level-badge span{font-size:9px;opacity:.7;font-weight:700;display:block}
.cc-tokens{display:flex;gap:4px;align-items:center}
.cc-token-chip{width:24px;height:24px;border-radius:7px;display:grid;place-items:center;font-weight:900;font-size:12px;border:1.5px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.15);flex-shrink:0;transition:all .2s}
.cc-token-chip.needed{transform:scale(1.25);box-shadow:0 0 0 2.5px #22C55E, 0 0 12px #22C55E;z-index:2;border-color:#22C55E}
.cc-header-center{flex:1;min-width:0;display:flex;gap:6px;align-items:center;overflow:hidden}
.cc-obj-mini{flex:1;min-width:70px;background:#F5F3FF;border:1.5px solid #DDD6FE;border-radius:10px;padding:4px 7px;display:flex;align-items:center;gap:5px}
.cc-obj-mini.done{background:#DCFCE7;border-color:#22C55E}
.cc-obj-mini-icon{width:22px;height:22px;border-radius:7px;display:grid;place-items:center;font-weight:900;font-size:11px;flex-shrink:0}
.cc-obj-mini-info{flex:1;min-width:0}
.cc-obj-mini-name{font-weight:900;font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cc-obj-mini-bar{height:4px;background:#EDE9FE;border-radius:999px;overflow:hidden;margin-top:2px}
.cc-obj-mini-fill{height:100%;background:linear-gradient(90deg,#22C55E,#4ADE80);transition:width .3s}
.cc-header-right{display:flex;gap:5px;align-items:center;flex-shrink:0}
.cc-stat-mini{background:#fff;border:1.5px solid #E9D5FF;border-radius:10px;padding:4px 7px;min-width:52px;text-align:center}
.cc-stat-mini b{font-size:11px;font-weight:900;display:block;line-height:1;color:#2a1a5e}
.cc-stat-mini span{font-size:6px;font-weight:800;opacity:.6;letter-spacing:.05em;text-transform:uppercase;color:#4C1D95}
.cc-stat-mini.gold{background:linear-gradient(180deg,#FEF08A,#FACC15);border-color:#EAB308}
.cc-main{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px;overflow:hidden;touch-action:none;width:100%;min-height:0}
.cc-board{width:min(92vw, 480px);aspect-ratio:1;background:rgba(255,255,255,.96);border-radius:18px;padding:6px;box-shadow:0 20px 50px rgba(0,0,0,.4), 0 0 0 2.5px rgba(255,255,255,.9);position:relative;touch-action:none;user-select:none;contain:layout}
.cc-grid{display:grid;grid-template-columns:repeat(${SZ},1fr);grid-template-rows:repeat(${SZ},1fr);gap:4px;width:100%;height:100%;touch-action:none}
.cc-cell{position:relative;border-radius:11px;display:grid;place-items:center;cursor:pointer;touch-action:none}
.cc-cell.sel{transform:scale(1.1);z-index:5}.cc-cell.sel::after{content:'';position:absolute;inset:-2px;border:3px solid #FACC15;border-radius:12px;box-shadow:0 0 14px #FACC15;pointer-events:none}
.cc-candy{width:86%;height:86%;border-radius:12px;display:grid;place-items:center;font-weight:900;font-size:15px;position:relative;box-shadow:0 3px 0 rgba(0,0,0,.12), inset 0 1.5px 0 rgba(255,255,255,.9);border:1.5px solid rgba(0,0,0,.06);overflow:hidden}
.cc-candy::before{content:'';position:absolute;top:8%;left:14%;width:34%;height:26%;background:rgba(255,255,255,.8);border-radius:50%}
.cc-candy.bomb{box-shadow:0 0 0 2px #fff, 0 3px 0 rgba(0,0,0,.15), 0 0 14px currentColor}
.cc-candy.striped-h::after{content:'';position:absolute;left:-4px;right:-4px;top:50%;height:5px;background:repeating-linear-gradient(90deg, #fff 0 5px, transparent 5px 10px);transform:translateY(-50%);border-radius:999px}
.cc-candy.striped-v::after{content:'';position:absolute;top:-4px;bottom:-4px;left:50%;width:5px;background:repeating-linear-gradient(180deg, #fff 0 5px, transparent 5px 10px);transform:translateX(-50%);border-radius:999px}
.cc-candy.color-bomb{background:radial-gradient(circle at 30% 30%, #fff, #ddd 20%, #aaa 40%, #444 100%) !important;border:2.5px solid #fff !important;box-shadow:0 0 16px #fff !important;animation:rainbow 1.5s linear infinite}
@keyframes rainbow{0%{filter:hue-rotate(0deg) brightness(1.15)}100%{filter:hue-rotate(360deg) brightness(1.15)}}
.cc-cell.matched{animation:pop .38s cubic-bezier(.34,1.56,.64,1) forwards}
@keyframes pop{0%{transform:scale(1)}25%{transform:scale(1.32)}100%{transform:scale(0) rotate(80deg);opacity:0}}
.cc-cell.new{animation:newpop .28s cubic-bezier(.34,1.56,.64,1)}
@keyframes newpop{0%{transform:scale(0)}60%{transform:scale(1.15)}100%{transform:scale(1)}}
.cc-explo{position:absolute;left:50%;top:50%;width:8px;height:8px;background:radial-gradient(circle, #fff, #FACC15, transparent);border-radius:50%;pointer-events:none;transform:translate(-50%,-50%);animation:explo .4s ease-out forwards;z-index:20}
@keyframes explo{0%{width:8px;height:8px;opacity:1}100%{width:90px;height:90px;opacity:0}}
.cc-combo{position:absolute;left:50%;top:16%;transform:translateX(-50%);background:linear-gradient(135deg,#FACC15,#F59E0B);color:#000;padding:5px 12px;border-radius:999px;font-weight:900;font-size:13px;box-shadow:0 4px 12px rgba(0,0,0,.35);pointer-events:none;animation:combo .8s ease forwards;z-index:30;border:2px solid #fff}
@keyframes combo{0%{opacity:0;transform:translateX(-50%) translateY(16px) scale(.6)}20%{opacity:1;transform:translateX(-50%) translateY(0) scale(1.15)}100%{opacity:0;transform:translateX(-50%) translateY(-32px) scale(1)}}
.cc-bottom{width:100%;background:rgba(0,0,0,.25);backdrop-filter:blur(6px);padding:5px 10px;display:flex;justify-content:center;gap:8px;flex-shrink:0;border-top:1px solid rgba(255,255,255,.15)}
.cc-bottom-info{font-size:8px;opacity:.7;text-align:center}
@media(max-width:768px){
  .cc-header-inner{flex-wrap:wrap;gap:5px;padding:5px 8px}
  .cc-header-left{flex:1 1 auto}
  .cc-header-center{flex:1 1 100%;order:3}
  .cc-header-right{flex:0 0 auto}
  .cc-stat-mini{min-width:44px;padding:3px 5px}.cc-stat-mini b{font-size:10px}
  .cc-token-chip{width:20px;height:20px;font-size:10px}
  .cc-board{width:min(96vw, 440px);padding:5px;border-radius:16px}
  .cc-grid{gap:3px}
}
</style>
<div class="cc" id="root">
  <div class="cc-header">
    <div class="cc-header-inner">
      <div class="cc-header-left">
        <div class="cc-level-badge"><b id="lvlNum">N1</b><span id="lvlUnlock">5/11</span></div>
        <div class="cc-tokens" id="activeTokens"></div>
        <div style="font-weight:900;font-size:11px;opacity:.8"><span id="moves">25</span> <span id="movesLabel" style="font-size:8px;opacity:.6">MOVS</span></div>
      </div>
      <div class="cc-header-center" id="objList"></div>
      <div class="cc-header-right">
        <div class="cc-stat-mini"><b id="cScore">0</b><span>Score</span></div>
        <div class="cc-stat-mini"><b id="cBest">0</b><span>Best</span></div>
        <div class="cc-stat-mini gold"><b id="cReward">+0.0000</b><span>WASA</span></div>
      </div>
    </div>
  </div>
  <div class="cc-main" id="mainArea"><div class="cc-board" id="board"><div class="cc-grid" id="grid"></div></div></div>
  <div class="cc-bottom"><div class="cc-bottom-info">✅ FIX: objetivo siempre está en esta partida • Arrastrá sin soltar</div></div>
  <div id="ui"></div>
</div>`;

  const root=container.querySelector('#root'); const ui=root.querySelector('#ui'); const gridEl=root.querySelector('#grid'); const mainArea=root.querySelector('#mainArea');
  let best=parseInt(localStorage.getItem('wcrush_best')||'0');
  let currentLevelNum=parseInt(localStorage.getItem('wcrush_level')||'1');
  let level=null; let board=[], score=0, totalReward=parseFloat(localStorage.getItem('wcrush_wasa')||'0'), moves=0, timeLeft=0, timerInt=null, busy=false, sel=null, lastSwap=null;
  let session=null, claiming=false, pendingAd=null, startTime=Date.now();

  async function startSession(){ try{ const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start_game_session', email:localStorage.getItem('wasa_email'), wallet:localStorage.getItem('wasa_wallet'), device_id:getDeviceId(), game_slug:'crypto-crush', level:currentLevelNum})}); const j=await r.json(); if(j.ok) session=j.session_id; }catch{} }
  async function claim(isDouble, ad){ if(claiming) return {ok:false}; if(!session) await startSession(); if(!session) return {ok:false}; claiming=true; try{ const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'claim_reward', session_id:session, email:localStorage.getItem('wasa_email'), wallet:localStorage.getItem('wasa_wallet'), device_id:getDeviceId(), game_slug:'crypto-crush', level:currentLevelNum, ad_watched:ad, double_reward:isDouble, time_taken:(Date.now()-startTime)/1000})}); const j=await r.json(); if(j.ok){ const b=j.wasa_balance??j.guest_balance??0; localStorage.setItem(j.is_guest?'wasa_coins_guest':'wasa_coins',b); if(window.setCoinsUI) window.setCoinsUI(b); session=null; claiming=false; return j; } claiming=false; return {ok:false, error:j.error}; }catch{ claiming=false; return {ok:false}; } }
  function openAd(t){ if(window.vrAd!==0 && window.vrAd!==undefined) return; pendingAd=t; window.vrAdType=t; window.vrAd=1; ui.innerHTML=`<div style="position:fixed;inset:0;background:rgba(0,0,0,.7);display:grid;place-items:center;z-index:50;color:white;font-weight:800">Cargando anuncio...</div>`; }
  function randColorFromActive(active){ const tok=active[Math.floor(Math.random()*active.length)]; return ALL_TOKENS.indexOf(tok); }
  function makeCell(color, special=null){ return {c:color, s:special}; }

  function loadLevel(n){
    currentLevelNum=n; localStorage.setItem('wcrush_level', n);
    const activeTokens=getActiveTokensForLevel(n);
    level=generateLevel(n, activeTokens);
    score=0; moves=level.moves; timeLeft=level.time; sel=null; busy=false; lastSwap=null; startTime=Date.now();
    if(timerInt) clearInterval(timerInt);
    if(level.time>0){ timerInt=setInterval(()=>{ timeLeft--; if(timeLeft<=0){ timeLeft=0; clearInterval(timerInt); checkFail(); } updateUI(); },1000); }
    let tries=0; do{ board=Array(SZ).fill(0).map(()=>Array(SZ).fill(0).map(()=>makeCell(randColorFromActive(activeTokens)))); tries++; }while(findMatches().groups.length>0 && tries<100);
    gridEl.innerHTML=''; for(let r=0;r<SZ;r++) for(let c=0;c<SZ;c++){ const cell=document.createElement('div'); cell.className='cc-cell'; cell.dataset.r=r; cell.dataset.c=c; gridEl.appendChild(cell); }
    const activeDiv=root.querySelector('#activeTokens'); activeDiv.innerHTML='';
    const neededNames=new Set(level.objectives.filter(o=>o.type==='collect_color').map(o=>o.name));
    activeTokens.forEach(tok=>{
      const chip=document.createElement('div');
      chip.className='cc-token-chip'+(neededNames.has(tok.name)?' needed':'');
      chip.style.background=`linear-gradient(180deg, ${tok.light}, ${tok.bg})`;
      chip.style.borderColor=tok.bd;
      chip.textContent=tok.icon;
      chip.title=tok.name + (neededNames.has(tok.name)?' - OBJETIVO':'');
      activeDiv.appendChild(chip);
    });
    startSession(); draw(); updateObjectivesUI(); updateUI();
  }

  function updateUI(){
    root.querySelector('#lvlNum').textContent='N'+currentLevelNum;
    root.querySelector('#lvlUnlock').textContent=getUnlockedTokens(currentLevelNum).length+'/11';
    if(level.time>0){ root.querySelector('#moves').textContent=timeLeft+'s'; root.querySelector('#movesLabel').textContent='TIEMPO'; }
    else { root.querySelector('#moves').textContent=moves; root.querySelector('#movesLabel').textContent='MOVS'; }
    root.querySelector('#cScore').textContent=score;
    root.querySelector('#cBest').textContent=best;
    root.querySelector('#cReward').textContent='+'+fmt(totalReward).slice(0,6);
  }

  function updateObjectivesUI(){
    const list=root.querySelector('#objList'); list.innerHTML='';
    level.objectives.forEach(obj=>{
      const item=document.createElement('div'); item.className='cc-obj-mini'+(obj.current>=obj.target?' done':'');
      const icon=document.createElement('div'); icon.className='cc-obj-mini-icon';
      if(obj.type==='collect_color'){ const tok=ALL_TOKENS[obj.color]; icon.style.background=`linear-gradient(180deg, ${tok.light}, ${tok.bg})`; icon.textContent=tok.icon; icon.style.border=`1.5px solid ${tok.bd}`; }
      else { icon.style.background='#fff'; icon.textContent=obj.icon; }
      const info=document.createElement('div'); info.className='cc-obj-mini-info'; info.innerHTML=`<div class="cc-obj-mini-name">${obj.name} ${obj.current}/${obj.target}</div><div class="cc-obj-mini-bar"><div class="cc-obj-mini-fill" style="width:${Math.min(100, obj.current/obj.target*100)}%"></div></div>`;
      item.appendChild(icon); item.appendChild(info); list.appendChild(item);
    });
  }

  function draw(){
    for(let r=0;r<SZ;r++) for(let c=0;c<SZ;c++){
      const idx=r*SZ+c; const cellEl=gridEl.children[idx]; if(!cellEl) continue;
      const obj=board[r][c]; if(!obj){ cellEl.innerHTML=''; continue; }
      let candy=cellEl.querySelector('.cc-candy'); if(!candy){ candy=document.createElement('div'); cellEl.appendChild(candy); }
      let cls='cc-candy'; if(obj.s==='bomb') cls+=' bomb'; else if(obj.s==='h') cls+=' striped-h'; else if(obj.s==='v') cls+=' striped-v'; else if(obj.s==='color') cls+=' color-bomb';
      candy.className=cls;
      if(obj.s==='color'){ candy.textContent='🌈'; }
      else { const tok=ALL_TOKENS[obj.c]; candy.textContent=tok.icon; candy.style.background=`linear-gradient(180deg, ${tok.light}, ${tok.bg})`; candy.style.borderColor=tok.bd; }
      cellEl.classList.remove('sel','matched','new'); if(sel && sel.r==r && sel.c==c) cellEl.classList.add('sel');
    }
  }

  function isAdj(r1,c1,r2,c2){ return Math.abs(r1-r2)+Math.abs(c1-c2)===1; }
  function checkWin(){ return level.objectives.every(o=>o.current>=o.target); }
  function checkFail(){ if(level.time>0 && timeLeft<=0 && !checkWin()){ showFail(); } if(level.moves<=0 && !checkWin() && level.time===0){ showFail(); } }

  async function handleSelect(r,c){
    if(busy) return;
    const obj=board[r][c];
    if(obj.s==='color' && sel){ const targetColor=board[sel.r][sel.c].c; await activateColorBomb(r,c,targetColor); return; }
    if(obj.s && sel===null && (obj.s==='h'||obj.s==='v'||obj.s==='bomb'||obj.s==='color')){ await activateSpecial(r,c); return; }
    if(!sel){ sel={r,c}; draw(); return; }
    if(sel.r===r && sel.c===c){ sel=null; draw(); return; }
    if(!isAdj(sel.r,sel.c,r,c)){ sel={r,c}; draw(); return; }
    await trySwap(sel.r,sel.c,r,c);
  }

  async function activateSpecial(r,c){
    if(busy) return; busy=true; sel=null;
    const obj=board[r][c]; let toRemove=new Set();
    if(obj.s==='h'){ for(let cc=0;cc<SZ;cc++) toRemove.add(r+','+cc); }
    else if(obj.s==='v'){ for(let rr=0;rr<SZ;rr++) toRemove.add(rr+','+c); }
    else if(obj.s==='bomb'){ for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){ const nr=r+dr, nc=c+dc; if(nr>=0&&nr<SZ&&nc>=0&&nc<SZ) toRemove.add(nr+','+nc); } }
    else if(obj.s==='color'){ for(let rr=0;rr<SZ;rr++) for(let cc=0;cc<SZ;cc++) toRemove.add(rr+','+cc); }
    toRemove.forEach(k=>{ const [rr,cc]=k.split(',').map(Number); const col=board[rr][cc]?.c; if(col!==undefined) level.objectives.forEach(o=>{ if(o.type==='collect_color' && o.color===col) o.current++; }); });
    if(obj.s==='bomb' || obj.s==='h' || obj.s==='v') level.objectives.forEach(o=>{ if(o.type==='collect_special') o.current++; });
    if(obj.s==='color') level.objectives.forEach(o=>{ if(o.type==='collect_rainbow') o.current++; });
    await processMatchesWithSet(Array.from(toRemove), null, 1, []);
    await runAutoCascade();
    if(level.time===0) moves--;
    updateObjectivesUI(); updateUI(); busy=false;
    if(checkWin()) showWin(); else checkFail();
  }

  async function activateColorBomb(r,c,targetColor){
    if(busy) return; busy=true; sel=null;
    let toRemove=new Set(); toRemove.add(r+','+c);
    for(let rr=0;rr<SZ;rr++) for(let cc=0;cc<SZ;cc++) if(board[rr][cc]?.c===targetColor) toRemove.add(rr+','+cc);
    toRemove.forEach(k=>{ const [rr,cc]=k.split(',').map(Number); const col=board[rr][cc]?.c; if(col!==undefined) level.objectives.forEach(o=>{ if(o.type==='collect_color' && o.color===col) o.current++; }); });
    level.objectives.forEach(o=>{ if(o.type==='collect_rainbow') o.current++; });
    await processMatchesWithSet(Array.from(toRemove), null, 1, []);
    await runAutoCascade();
    if(level.time===0) moves--;
    updateObjectivesUI(); updateUI(); busy=false;
    if(checkWin()) showWin(); else checkFail();
  }

  async function trySwap(r1,c1,r2,c2){
    if(busy) return; busy=true; lastSwap={r1,c1,r2,c2};
    const a=board[r1][c1], b=board[r2][c2];
    if(a.s==='color' || b.s==='color'){
      const br=a.s==='color'?r1:r2, bc=a.s==='color'?c1:c2; const other=a.s==='color'?b:a;
      let toRemove=new Set(); toRemove.add(br+','+bc);
      if(other.s==='color'){ for(let rr=0;rr<SZ;rr++) for(let cc=0;cc<SZ;cc++) toRemove.add(rr+','+cc); }
      else { for(let rr=0;rr<SZ;rr++) for(let cc=0;cc<SZ;cc++) if(board[rr][cc]?.c===other.c) toRemove.add(rr+','+cc); }
      sel=null; draw(); await new Promise(r=>setTimeout(r,100));
      toRemove.forEach(k=>{ const [rr,cc]=k.split(',').map(Number); const col=board[rr][cc]?.c; if(col!==undefined) level.objectives.forEach(o=>{ if(o.type==='collect_color' && o.color===col) o.current++; }); });
      level.objectives.forEach(o=>{ if(o.type==='collect_rainbow') o.current++; });
      await processMatchesWithSet(Array.from(toRemove), null, 1, []);
      await runAutoCascade();
      if(level.time===0) moves--; updateObjectivesUI(); updateUI(); busy=false;
      if(checkWin()) showWin(); else checkFail(); return;
    }
    swap(r1,c1,r2,c2); draw(); await new Promise(res=>setTimeout(res,120));
    let found=findMatches();
    if(found.groups.length===0){ swap(r1,c1,r2,c2); draw(); busy=false; sel=null; return; }
    sel=null; await processCascade(found);
    if(level.time===0) moves--; updateObjectivesUI(); updateUI(); busy=false;
    if(checkWin()) showWin(); else checkFail();
  }

  function swap(r1,c1,r2,c2){ const t=board[r1][c1]; board[r1][c1]=board[r2][c2]; board[r2][c2]=t; }
  function findMatches(){
    const groups=[]; const allCells=new Set();
    for(let r=0;r<SZ;r++){ let c=0; while(c<SZ){ const col=board[r][c]?.c; if(col===undefined){ c++; continue; } let end=c+1; while(end<SZ && board[r][end]?.c===col) end++; const len=end-c; if(len>=3){ const cells=[]; for(let k=c;k<end;k++) cells.push({r,c:k}); groups.push({cells, len, dir:'h', color:col}); cells.forEach(cell=>allCells.add(cell.r+','+cell.c)); } c=end; } }
    for(let c=0;c<SZ;c++){ let r=0; while(r<SZ){ const col=board[r][c]?.c; if(col===undefined){ r++; continue; } let end=r+1; while(end<SZ && board[end][c]?.c===col) end++; const len=end-r; if(len>=3){ const cells=[]; for(let k=r;k<end;k++) cells.push({r:k,c}); groups.push({cells, len, dir:'v', color:col}); cells.forEach(cell=>allCells.add(cell.r+','+cell.c)); } r=end; } }
    return {groups, all:Array.from(allCells)};
  }
  async function runAutoCascade(){
    let combo=1; let found=findMatches();
    while(found.groups.length>0){
      combo++;
      const specialsToCreate=[]; const cellToGroups=new Map();
      found.groups.forEach(g=>g.cells.forEach(cell=>{ const key=cell.r+','+cell.c; if(!cellToGroups.has(key)) cellToGroups.set(key,[]); cellToGroups.get(key).push(g); }));
      for(const [key, gList] of cellToGroups){ if(gList.length>=2){ const hasH=gList.some(g=>g.dir==='h'); const hasV=gList.some(g=>g.dir==='v'); if(hasH && hasV){ const [r,c]=key.split(',').map(Number); specialsToCreate.push({r,c,type:'bomb', color:board[r][c]?.c}); } } }
      found.groups.forEach(g=>{ if(g.len===4){ let target=g.cells[Math.floor(g.cells.length/2)]; if(!specialsToCreate.some(s=>s.r===target.r && s.c===target.c)) specialsToCreate.push({r:target.r,c:target.c,type: g.dir==='h' ? 'v' : 'h', color:g.color}); } else if(g.len>=5){ let target=g.cells[Math.floor(g.cells.length/2)]; specialsToCreate.push({r:target.r,c:target.c,type:'color', color:g.color}); } });
      let toRemoveSet=new Set(found.all); specialsToCreate.forEach(s=> toRemoveSet.delete(s.r+','+s.c));
      toRemoveSet.forEach(k=>{ const [rr,cc]=k.split(',').map(Number); const col=board[rr][cc]?.c; if(col!==undefined) level.objectives.forEach(o=>{ if(o.type==='collect_color' && o.color===col) o.current++; }); });
      specialsToCreate.forEach(s=>{ if(s.type==='bomb' || s.type==='h' || s.type==='v') level.objectives.forEach(o=>{ if(o.type==='collect_special') o.current++; }); if(s.type==='color') level.objectives.forEach(o=>{ if(o.type==='collect_rainbow') o.current++; }); });
      await processMatchesWithSet(Array.from(toRemoveSet), null, combo, specialsToCreate);
      found=findMatches(); if(found.groups.length>0) await new Promise(r=>setTimeout(r,100));
    }
    updateObjectivesUI(); updateUI();
  }
  async function processCascade(firstFind){
    let combo=0; let current=firstFind;
    while(current.groups.length>0){
      combo++;
      const specialsToCreate=[]; const cellToGroups=new Map();
      current.groups.forEach(g=>g.cells.forEach(cell=>{ const key=cell.r+','+cell.c; if(!cellToGroups.has(key)) cellToGroups.set(key,[]); cellToGroups.get(key).push(g); }));
      for(const [key, gList] of cellToGroups){ if(gList.length>=2){ const hasH=gList.some(g=>g.dir==='h'); const hasV=gList.some(g=>g.dir==='v'); if(hasH && hasV){ const [r,c]=key.split(',').map(Number); specialsToCreate.push({r,c,type:'bomb', color:board[r][c]?.c}); } } }
      current.groups.forEach(g=>{
        if(g.len===4){ let target=g.cells[Math.floor(g.cells.length/2)]; if(lastSwap){ if(g.cells.some(cell=>cell.r===lastSwap.r1 && cell.c===lastSwap.c1)) target={r:lastSwap.r1,c:lastSwap.c1}; else if(g.cells.some(cell=>cell.r===lastSwap.r2 && cell.c===lastSwap.c2)) target={r:lastSwap.r2,c:lastSwap.c2}; } if(!specialsToCreate.some(s=>s.r===target.r && s.c===target.c)) specialsToCreate.push({r:target.r,c:target.c,type: g.dir==='h' ? 'v' : 'h', color:g.color}); }
        else if(g.len>=5){ let target=g.cells[Math.floor(g.cells.length/2)]; if(lastSwap){ if(g.cells.some(cell=>cell.r===lastSwap.r1 && cell.c===lastSwap.c1)) target={r:lastSwap.r1,c:lastSwap.c1}; else if(g.cells.some(cell=>cell.r===lastSwap.r2 && cell.c===lastSwap.c2)) target={r:lastSwap.r2,c:lastSwap.c2}; } specialsToCreate.push({r:target.r,c:target.c,type:'color', color:g.color}); }
      });
      let toRemoveSet=new Set(current.all); specialsToCreate.forEach(s=> toRemoveSet.delete(s.r+','+s.c));
      toRemoveSet.forEach(k=>{ const [rr,cc]=k.split(',').map(Number); const col=board[rr][cc]?.c; if(col!==undefined) level.objectives.forEach(o=>{ if(o.type==='collect_color' && o.color===col) o.current++; }); });
      specialsToCreate.forEach(s=>{ if(s.type==='bomb' || s.type==='h' || s.type==='v') level.objectives.forEach(o=>{ if(o.type==='collect_special') o.current++; }); if(s.type==='color') level.objectives.forEach(o=>{ if(o.type==='collect_rainbow') o.current++; }); });
      level.objectives.forEach(o=>{ if(o.type==='score') o.current=score; });
      await processMatchesWithSet(Array.from(toRemoveSet), null, combo, specialsToCreate);
      current=findMatches(); if(current.groups.length>0) await new Promise(r=>setTimeout(r,100));
    }
    updateObjectivesUI(); updateUI();
  }
  async function processMatchesWithSet(keys, origin, combo=1, specialsToCreate=[]){
    keys.forEach(k=>{
      const [r,c]=k.split(',').map(Number);
      const el=gridEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
      if(el){ el.classList.add('matched'); const explo=document.createElement('div'); explo.className='cc-explo'; el.appendChild(explo); }
      if(board[r] && board[r][c]!==undefined) board[r][c]=null;
    });
    score+=keys.length*10*combo*(currentLevelNum<20?1:2);
    if(combo>1){ const comboEl=document.createElement('div'); comboEl.className='cc-combo'; comboEl.textContent=`COMBO x${combo}!`; root.querySelector('#board').appendChild(comboEl); setTimeout(()=>comboEl.remove(),800); }
    await new Promise(r=>setTimeout(r,300));
    for(let c=0;c<SZ;c++){
      let write=SZ-1;
      for(let r=SZ-1;r>=0;r--){ if(board[r][c]!==null){ if(write!==r){ board[write][c]=board[r][c]; board[r][c]=null; } write--; } }
      for(let r=write;r>=0;r--) board[r][c]=makeCell(randColorFromActive(level.activeTokens));
    }
    specialsToCreate.forEach(s=>{ if(board[s.r]) board[s.r][s.c]=makeCell(s.color, s.type); });
    draw();
    for(let c=0;c<SZ;c++){ for(let r=0;r<2;r++){ const el=gridEl.querySelector(`[data-r="${r}"][data-c="${c}"]`); if(el){ el.classList.add('new'); setTimeout(()=>el.classList.remove('new'),300); } } }
    await new Promise(r=>setTimeout(r,80));
    lastSwap=null;
    level.objectives.forEach(o=>{ if(o.type==='score') o.current=score; });
  }
  function showWin(){
    if(timerInt) clearInterval(timerInt);
    const reward=level.reward; totalReward+=reward; localStorage.setItem('wcrush_wasa', totalReward);
    if(score>best){ best=score; localStorage.setItem('wcrush_best',best); }
    ui.innerHTML=`<div style="position:fixed;inset:0;background:rgba(18,10,42,.88);backdrop-filter:blur(14px);display:grid;place-items:center;z-index:30;padding:16px"><div style="background:linear-gradient(180deg,#fff,#F3F0FF);border:3px solid #22C55E;border-radius:22px;padding:22px;text-align:center;width:min(360px,94vw);color:#2a1a5e"><div style="font-size:48px">🎉</div><div style="font-weight:900;font-size:22px;color:#065F46">¡NIVEL ${currentLevelNum} COMPLETADO!</div><div style="font-size:11px;opacity:.7;margin-top:6px">Tokens: ${level.activeTokens.map(t=>t.name).join(', ')}</div><div style="background:linear-gradient(180deg,#DCFCE7,#86EFAC);border:2px solid #22C55E;border-radius:14px;padding:12px;margin:12px 0;font-weight:900;color:#065F46">💰 +${fmt(reward)} WASA</div><button id="btnNext" style="width:100%;height:46px;border-radius:14px;font-weight:900;border:0;background:linear-gradient(135deg,#22C55E,#16A34A);color:#000;cursor:pointer">SIGUIENTE NIVEL ${currentLevelNum+1} (${getUnlockedTokens(currentLevelNum+1).length}/11)</button><button id="btnDouble" style="width:100%;height:44px;border-radius:14px;font-weight:900;border:2.5px solid #FACC15;background:linear-gradient(135deg,#FEF08A,#FACC15);color:#000;margin-top:8px;cursor:pointer">📺 X2 = ${fmt(reward*2)} WASA</button></div></div>`;
    ui.querySelector('#btnNext').onclick=async()=>{ const res=await claim(false,false); currentLevelNum++; loadLevel(currentLevelNum); ui.innerHTML=''; };
    ui.querySelector('#btnDouble').onclick=()=>openAd('double_level');
  }
  function showFail(){
    if(timerInt) clearInterval(timerInt);
    ui.innerHTML=`<div style="position:fixed;inset:0;background:rgba(18,10,42,.88);backdrop-filter:blur(14px);display:grid;place-items:center;z-index:30;padding:16px"><div style="background:linear-gradient(180deg,#fff,#F3F0FF);border:3px solid #EF4444;border-radius:22px;padding:22px;text-align:center;width:min(360px,94vw);color:#2a1a5e"><div style="font-size:40px">😵</div><div style="font-weight:900;font-size:20px;color:#991B1B">¡SIN MOVIMIENTOS!</div><div style="font-size:12px;opacity:.7;margin:8px 0">Te faltó ${level.objectives.filter(o=>o.current<o.target).map(o=>o.name).join(', ')}</div><button id="btnRetry" style="width:100%;height:46px;border-radius:14px;font-weight:900;border:0;background:#EF4444;color:#fff;cursor:pointer">REINTENTAR NIVEL ${currentLevelNum}</button><button id="btnSkip" style="width:100%;height:44px;border-radius:14px;border:2.5px solid #DDD6FE;background:#fff;color:#4C1D95;margin-top:8px;cursor:pointer">VER ANUNCIO +5 MOVS</button></div></div>`;
    ui.querySelector('#btnRetry').onclick=()=>{ ui.innerHTML=''; loadLevel(currentLevelNum); };
    ui.querySelector('#btnSkip').onclick=()=>openAd('extra_moves');
  }
  let dragStart=null;
  function preventScroll(e){ if(dragStart) e.preventDefault(); }
  document.addEventListener('touchmove', preventScroll, {passive:false});
  mainArea.addEventListener('touchmove', (e)=>{ if(dragStart) e.preventDefault(); }, {passive:false});
  gridEl.addEventListener('pointerdown', e=>{
    const cell=e.target.closest('.cc-cell'); if(!cell || busy) return;
    dragStart={r:+cell.dataset.r, c:+cell.dataset.c, x:e.clientX, y:e.clientY};
    e.preventDefault(); try{ cell.setPointerCapture(e.pointerId); }catch{}
  });
  gridEl.addEventListener('pointerup', e=>{
    if(!dragStart) return;
    const cell=document.elementFromPoint(e.clientX,e.clientY)?.closest('.cc-cell');
    const dx=e.clientX-dragStart.x, dy=e.clientY-dragStart.y;
    if(cell && (dragStart.r!==+cell.dataset.r || dragStart.c!==+cell.dataset.c) && Math.abs(dragStart.r-+cell.dataset.r)+Math.abs(dragStart.c-+cell.dataset.c)===1){
      trySwap(dragStart.r,dragStart.c,+cell.dataset.r,+cell.dataset.c);
    } else if(Math.abs(dx)>18 || Math.abs(dy)>18){
      let nr=dragStart.r, nc=dragStart.c;
      if(Math.abs(dx)>Math.abs(dy)){ nc+= dx>0?1:-1; } else { nr+= dy>0?1:-1; }
      if(nr>=0&&nr<SZ&&nc>=0&&nc<SZ) trySwap(dragStart.r,dragStart.c,nr,nc); else handleSelect(dragStart.r,dragStart.c);
    } else { handleSelect(dragStart.r,dragStart.c); }
    dragStart=null;
  });
  gridEl.addEventListener('pointercancel', ()=>{ dragStart=null; });
  const watcher=setInterval(()=>{ if(window.vrAd===4 && pendingAd){ const t=pendingAd; pendingAd=null; window.vrAd=0; window.vrAdType=null; (async()=>{
    if(t==='double_level'){
      ui.innerHTML=`<div style="position:fixed;inset:0;background:rgba(0,0,0,.7);display:grid;place-items:center;z-index:40;color:white">Validando X2...</div>`;
      const res=await claim(true,true);
      if(res.ok){ totalReward+=level.reward; localStorage.setItem('wcrush_wasa', totalReward); currentLevelNum++; loadLevel(currentLevelNum); ui.innerHTML=`<div style="position:fixed;inset:0;background:rgba(0,0,0,.75);display:grid;place-items:center;z-index:40"><div style="background:#fff;border:3px solid #22C55E;border-radius:18px;padding:18px;text-align:center;width:min(320px,90vw)"><div style="color:#065F46;font-weight:900;font-size:18px">¡X2 +${fmt(level.reward*2)} WASA!</div><button id="ok2" style="margin-top:10px;width:100%;height:44px;border-radius:999px;background:#22C55E;color:#000;font-weight:900;border:0">SIGUIENTE</button></div></div>`; ui.querySelector('#ok2').onclick=()=>{ ui.innerHTML=''; }; }
      else { ui.innerHTML=''; showWin(); }
    }
    if(t==='extra_moves'){ moves+=5; updateUI(); ui.innerHTML=''; }
  })(); } },150);
  loadLevel(currentLevelNum);
  container._cleanup=()=>{ clearInterval(watcher); if(timerInt) clearInterval(timerInt); document.removeEventListener('touchmove', preventScroll); window.vrAd=0; };
}
