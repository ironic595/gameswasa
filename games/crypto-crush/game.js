// games/crypto-crush/game.js - v5.2 NIVELES ESPECIALES POR TIEMPO - con pantalla Aceptar que arranca contador
export function init(container, args){
  const WORKER_URL = window.WASA_CONFIG?.WORKER_URL || 'https://games-wasa-worker.javisimes.workers.dev/';
  function getDeviceId(){ let id=localStorage.getItem('wasa_device_id'); if(!id){ id='dev_'+Math.random().toString(36).slice(2)+Date.now().toString(36); localStorage.setItem('wasa_device_id',id);} return id; }
  function fmt(n){ const v=parseFloat(n)||0; if(v===0) return '0'; return (Math.round(v*1e7)/1e7).toFixed(7).replace(/0+$/,'').replace(/\.$/,''); }

  function getAssetBases(){
    const bases=[];
    try{
      const scripts=document.querySelectorAll('script[src*="crypto-crush"]');
      scripts.forEach(s=>{
        const url=new URL(s.src, window.location.origin);
        const dir=url.pathname.substring(0, url.pathname.lastIndexOf('/')+1);
        bases.push(dir+'assets/'); bases.push(dir);
      });
    }catch{}
    bases.push('/games/crypto-crush/assets/','games/crypto-crush/assets/','./games/crypto-crush/assets/','./assets/','assets/','/assets/','./','/');
    return [...new Set(bases)];
  }
  const ASSET_BASES=getAssetBases();

  const ALL_TOKENS = [
    {icon:'₿', name:'BTC',  bg:'#F7931A', bd:'#E67E00', light:'#FFB84D', img:'btc.png'},
    {icon:'Ξ', name:'ETH',  bg:'#627EEA', bd:'#3C5FE3', light:'#8AA0FF', img:'eth.png'},
    {icon:'Đ', name:'DASH', bg:'#1E88E5', bd:'#1565C0', light:'#42A5F5', img:'dash.png'},
    {icon:'Ł', name:'LTC',  bg:'#A6A9AA', bd:'#7A7D7E', light:'#CFD8DC', img:'ltc.png'},
    {icon:'W', name:'WASA', bg:'#A855F7', bd:'#7E22CE', light:'#38BDF8', img:'wasa.png'},
    {icon:'B', name:'BNB',  bg:'#F3BA2F', bd:'#D99A00', light:'#FCD535', img:'bnb.png'},
    {icon:'₮', name:'USDT', bg:'#26A17B', bd:'#1A7A5C', light:'#4ECC9E', img:'usdt.png'},
    {icon:'🐶', name:'DOGE',  bg:'#C2A633', bd:'#9A8300', light:'#E8C547', img:'doge.png'},
    {icon:'🐕', name:'SHIB',  bg:'#FF4565', bd:'#E02D4A', light:'#FF7A91', img:'shib.png'},
    {icon:'🐸', name:'PEPE',  bg:'#22C55E', bd:'#16A34A', light:'#4ADE80', img:'pepe.png'},
    {icon:'🐺', name:'FLOKI', bg:'#8B5CF6', bd:'#6D28D9', light:'#A78BFA', img:'floki.png'},
  ];
  const SZ = 8;
  const BASE_REWARD = 0.0001;

  function getUnlockedTokens(level){ const count=Math.min(11, 5+Math.floor((level-1)/3)); return ALL_TOKENS.slice(0, count); }
  function getActiveTokensForLevel(level){
    const unlocked=getUnlockedTokens(level);
    const maxPerGame=level<10?5:6;
    const take=Math.min(maxPerGame, unlocked.length);
    const shuffled=[...unlocked].sort(()=>Math.random()-0.5);
    let active=shuffled.slice(0, take);
    if(level%3===0 && unlocked.some(t=>t.name==='WASA') && !active.some(t=>t.name==='WASA')) active[0]=ALL_TOKENS.find(t=>t.name==='WASA');
    return active;
  }

  function generateLevel(n, activeTokens){
    const lvl={number:n, moves:0, time:0, type:'moves', objectives:[], reward: BASE_REWARD * (1 + Math.floor(n/10)*0.5), activeTokens };
    
    // cada 7 niveles después del 5 es POR TIEMPO (especial)
    const isTimed = n>=7 && n%7===0;
    
    if(isTimed){
      lvl.type='time';
      lvl.time=Math.max(45, 75 - Math.floor(n/2) + 45); // 60-90 seg
      lvl.moves=999;
      // objetivo principal: puntos
      const scoreTarget=Math.floor(800 + n*180 + Math.random()*400);
      lvl.objectives.push({id:'score_main', type:'score', name:'PUNTOS', icon:'⭐', target:scoreTarget, current:0});
      // + 1 objetivo secundario de color si quiere
      if(Math.random()<0.6){
        const tok=activeTokens[Math.floor(Math.random()*activeTokens.length)];
        lvl.objectives.push({id:tok.name+'_sec', type:'collect_color', color:ALL_TOKENS.indexOf(tok), token:tok, name:tok.name, icon:tok.icon, target:Math.floor(6+n*0.8), current:0});
      }
    } else {
      lvl.type='moves';
      lvl.moves=Math.max(14, 24 - Math.floor(n/4) + Math.floor(n/12)); // 14-24 movs
      const numObjs=n<5?1:n<12?2:n<35?3:4;
      const usedNames=new Set();
      let hasRainbow=false, hasSpecial=false;
      let attempts=0;
      while(lvl.objectives.length < numObjs && attempts<30){
        attempts++;
        const roll=Math.random();
        if(roll<0.75){
          let available=activeTokens.filter(t=>!usedNames.has(t.name));
          if(available.length===0){
            if(lvl.objectives.filter(o=>o.type==='collect_color').length>=2) continue;
            available=activeTokens;
          }
          if(usedNames.size>0 && available.some(t=>!usedNames.has(t.name)) && Math.random()<0.7){
            available=available.filter(t=>!usedNames.has(t.name));
          }
          const token=available[Math.floor(Math.random()*available.length)];
          usedNames.add(token.name);
          const target=Math.floor(7 + n*1.6 + Math.random()*7 + lvl.objectives.length*2.5);
          lvl.objectives.push({id:token.name+'_'+lvl.objectives.length, type:'collect_color', color:ALL_TOKENS.indexOf(token), token, name:token.name, icon:token.icon, target, current:0});
        } else if(roll<0.86 && !hasSpecial){
          const special=Math.random()<0.5?'bomb':'striped';
          const target=Math.floor(1 + n/22);
          lvl.objectives.push({id:special+'_'+lvl.objectives.length, type:'collect_special', special, name:special==='bomb'?'BOMBAS 💥':'RAYADAS ↔', icon:special==='bomb'?'💥':'↔', target, current:0});
          hasSpecial=true;
        } else if(!hasRainbow){
          if(n<8) continue;
          lvl.objectives.push({id:'rainbow_'+lvl.objectives.length, type:'collect_rainbow', name:'ARCOIRIS 🌈', icon:'🌈', target:1, current:0});
          hasRainbow=true;
        }
      }
    }

    if(!lvl.objectives.some(o=>o.type==='collect_color') && lvl.type==='moves'){
      const tok=activeTokens[Math.floor(Math.random()*activeTokens.length)];
      lvl.objectives[0]={id:tok.name, type:'collect_color', color:ALL_TOKENS.indexOf(tok), token:tok, name:tok.name, icon:tok.icon, target:10+n*2, current:0};
    }

    if(n%15===0){
      const wasa=ALL_TOKENS.find(t=>t.name==='WASA');
      if(activeTokens.some(t=>t.name==='WASA') && !lvl.objectives.some(o=>o.name==='WASA' && o.type==='collect_color')){
        if(lvl.objectives.length<3) lvl.objectives.push({id:'wasa15', type:'collect_color', color:ALL_TOKENS.indexOf(wasa), token:wasa, name:'WASA', icon:'W', target:Math.floor(10+n), current:0});
      }
    }

    lvl.objectives=lvl.objectives.filter(o=>{ if(o.type==='collect_color'){ return activeTokens.some(t=>t.name===o.name); } return true; });
    const seen=new Set();
    lvl.objectives=lvl.objectives.filter(o=>{
      const key=o.type+'_'+o.name+'_'+(o.special||'');
      if(seen.has(key) && o.type!=='collect_color') return false;
      if(o.type==='collect_rainbow' && seen.has('rainbow')) return false;
      seen.add(key);
      if(o.type==='collect_rainbow') seen.add('rainbow');
      return true;
    });

    return lvl;
  }

  container.style.height='100%'; container.style.overflow='hidden'; container.style.display='flex'; container.style.flexDirection='column';

  container.innerHTML=`<style>
*{box-sizing:border-box}
html,body{overscroll-behavior:none}
.cc{width:100%;height:100%;display:flex;flex-direction:column;background:radial-gradient(ellipse at 50% 0%, #8B5CF6 0%, #6D28D9 25%, #4C1D95 60%, #1E0B3A 100%);color:#fff;font-family:Inter,system-ui;overflow:hidden;position:relative;touch-action:none}
.cc-header{width:100%;background:rgba(255,255,255,.97);color:#2a1a5e;box-shadow:0 4px 20px rgba(0,0,0,.3);z-index:10;flex-shrink:0;border-bottom:2px solid #E9D5FF}
.cc-header-inner{width:100%;padding:8px 10px;display:flex;align-items:center;gap:10px;justify-content:space-between;flex-wrap:nowrap;min-height:48px}
.cc-header-left{display:flex;align-items:center;gap:8px;flex-shrink:0}
.cc-level-badge{background:#4C1D95;color:#fff;border-radius:10px;padding:4px 10px;font-weight:900;font-size:12px;line-height:1}
.cc-level-badge span{font-size:9px;opacity:.7;font-weight:700;display:block}
.cc-level-badge.timed{background:linear-gradient(135deg,#EF4444,#DC2626); animation:pulse 1s infinite}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
.cc-tokens{display:flex;gap:4px;align-items:center}
.cc-token-chip{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;font-weight:900;font-size:12px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.2);flex-shrink:0;transition:all .2s;overflow:hidden;background:#fff}
.cc-token-chip img{width:82%;height:82%;object-fit:contain;display:block}
.cc-token-chip.needed{transform:scale(1.25);box-shadow:0 0 0 2.5px #22C55E, 0 0 12px #22C55E;z-index:2;border-color:#22C55E}
.cc-token-chip.wasa{box-shadow:0 0 0 2px #fff, 0 0 12px #A855F7; border-color:#A855F7}
.cc-header-center{flex:1;min-width:0;display:flex;gap:6px;align-items:center;overflow:hidden}
.cc-obj-mini{flex:1;min-width:70px;background:#F5F3FF;border:1.5px solid #DDD6FE;border-radius:10px;padding:4px 7px;display:flex;align-items:center;gap:5px}
.cc-obj-mini.done{background:#DCFCE7;border-color:#22C55E}
.cc-obj-mini-icon{width:24px;height:24px;border-radius:7px;display:grid;place-items:center;font-weight:900;font-size:11px;flex-shrink:0;overflow:hidden;background:#fff; border:1.5px solid #e5e7eb}
.cc-obj-mini-icon img{width:82%;height:82%;object-fit:contain}
.cc-obj-mini-info{flex:1;min-width:0}
.cc-obj-mini-name{font-weight:900;font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cc-obj-mini-bar{height:5px;background:#EDE9FE;border-radius:999px;overflow:hidden;margin-top:2px}
.cc-obj-mini-fill{height:100%;background:linear-gradient(90deg,#22C55E,#4ADE80);transition:width .3s}
.cc-obj-mini.time{border-color:#F59E0B; background:linear-gradient(180deg,#FFFBEB,#FEF3C7)}
.cc-obj-mini.time .cc-obj-mini-fill{background:linear-gradient(90deg,#F59E0B,#EF4444)}
.cc-header-right{display:flex;gap:5px;align-items:center;flex-shrink:0}
.cc-stat-mini{background:#fff;border:1.5px solid #E9D5FF;border-radius:10px;padding:4px 7px;min-width:52px;text-align:center}
.cc-stat-mini b{font-size:11px;font-weight:900;display:block;line-height:1;color:#2a1a5e}
.cc-stat-mini span{font-size:6px;font-weight:800;opacity:.6;letter-spacing:.05em;text-transform:uppercase;color:#4C1D95}
.cc-stat-mini.gold{background:linear-gradient(180deg,#FEF08A,#FACC15);border-color:#EAB308}
.cc-stat-mini.timer{background:linear-gradient(180deg,#FEE2E2,#FCA5A5);border-color:#EF4444; animation:pulse 1s infinite}
.cc-stat-mini.timer b{color:#991B1B}
.cc-main{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:10px 10px 6px;overflow:auto;overflow-x:hidden;touch-action:none;width:100%;min-height:0;gap:8px}
.cc-board{width:min(92vw, 460px);aspect-ratio:1;background:rgba(255,255,255,.98);border-radius:18px;padding:6px;box-shadow:0 24px 60px rgba(0,0,0,.45), 0 0 0 2.5px rgba(255,255,255,.95);position:relative;touch-action:none;user-select:none;contain:layout;flex-shrink:0}
.cc-grid{display:grid;grid-template-columns:repeat(${SZ},1fr);grid-template-rows:repeat(${SZ},1fr);gap:4px;width:100%;height:100%;touch-action:none}
.cc-cell{position:relative;border-radius:11px;display:grid;place-items:center;cursor:pointer;touch-action:none}
.cc-cell.sel{transform:scale(1.1);z-index:5}.cc-cell.sel::after{content:'';position:absolute;inset:-2px;border:3px solid #FACC15;border-radius:12px;box-shadow:0 0 14px #FACC15;pointer-events:none}
.cc-candy{width:88%;height:88%;border-radius:13px;display:grid;place-items:center;font-weight:900;font-size:15px;position:relative;box-shadow:0 4px 0 rgba(0,0,0,.18), inset 0 2px 0 rgba(255,255,255,.95);border:2px solid rgba(0,0,0,.08);overflow:hidden;background:#fff}
.cc-candy img{width:76%;height:76%;object-fit:contain;display:block;pointer-events:none;filter:drop-shadow(0 1px 2px rgba(0,0,0,.22))}
.cc-candy.wasa-candy{background:linear-gradient(180deg, #38BDF8 0%, #0EA5E9 25%, #A855F7 70%, #9333EA 100%) !important; border-color:#7E22CE !important; box-shadow:0 4px 0 rgba(126,34,206,.35), inset 0 2px 0 rgba(255,255,255,.95), 0 0 16px rgba(168,85,247,.55) !important}
.cc-candy.wasa-candy img{filter:drop-shadow(0 2px 3px rgba(0,0,0,.3)) brightness(1.08) contrast(1.1)}
.cc-candy.dash-candy{background:linear-gradient(180deg, #42A5F5 0%, #1E88E5 100%) !important; border-color:#1565C0 !important; box-shadow:0 4px 0 rgba(21,101,192,.3), inset 0 2px 0 rgba(255,255,255,.9), 0 0 10px rgba(30,136,229,.4) !important}
.cc-candy::before{content:'';position:absolute;top:8%;left:14%;width:34%;height:26%;background:rgba(255,255,255,.9);border-radius:50%;pointer-events:none;z-index:1}
.cc-candy.bomb{box-shadow:0 0 0 2px #fff, 0 4px 0 rgba(0,0,0,.2), 0 0 16px currentColor}
.cc-candy.striped-h::after{content:'';position:absolute;left:-4px;right:-4px;top:50%;height:6px;background:repeating-linear-gradient(90deg, #fff 0 6px, transparent 6px 12px);transform:translateY(-50%);border-radius:999px;z-index:2;box-shadow:0 0 6px #fff}
.cc-candy.striped-v::after{content:'';position:absolute;top:-4px;bottom:-4px;left:50%;width:6px;background:repeating-linear-gradient(180deg, #fff 0 6px, transparent 6px 12px);transform:translateX(-50%);border-radius:999px;z-index:2;box-shadow:0 0 6px #fff}
.cc-candy.color-bomb{background:radial-gradient(circle at 30% 30%, #fff, #ffd700 20%, #ff8c00 45%, #444 100%) !important;border:2.5px solid #fff !important;box-shadow:0 0 22px #FFD700, 0 0 12px #fff !important;animation:rainbow 1.5s linear infinite}
.cc-candy.color-bomb img{display:none}
@keyframes rainbow{0%{filter:hue-rotate(0deg) brightness(1.2)}100%{filter:hue-rotate(360deg) brightness(1.2)}}
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
@media(min-width:769px){
  .cc-header-inner{max-width:1400px;margin:0 auto;padding:8px 16px}
  .cc-main{padding:12px 12px 8px}
  .cc-board{width:min(68vh, 500px)}
}
@media(max-width:768px){
  .cc-header-inner{flex-wrap:wrap;gap:5px;padding:6px 8px;min-height:auto}
  .cc-header-left{flex:1 1 auto}
  .cc-header-center{flex:1 1 100%;order:3}
  .cc-header-right{flex:0 0 auto}
  .cc-stat-mini{min-width:44px;padding:3px 5px}.cc-stat-mini b{font-size:10px}
  .cc-token-chip{width:20px;height:20px;font-size:10px}
  .cc-board{width:min(96vw, 420px);padding:5px;border-radius:16px}
  .cc-grid{gap:3px}
  .cc-main{padding:8px 6px 6px}
}
</style>
<div class="cc" id="root">
  <div class="cc-header">
    <div class="cc-header-inner">
      <div class="cc-header-left">
        <div class="cc-level-badge" id="lvlBadge"><b id="lvlNum">N1</b><span id="lvlUnlock">5/11</span></div>
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
  <div class="cc-bottom"><div class="cc-bottom-info" id="debugInfo">Niveles especiales por tiempo y movimientos</div></div>
  <div id="ui"></div>
</div>`;

  const root=container.querySelector('#root'); const ui=root.querySelector('#ui'); const gridEl=root.querySelector('#grid'); const mainArea=root.querySelector('#mainArea'); const debugInfo=root.querySelector('#debugInfo');
  let best=parseInt(localStorage.getItem('wcrush_best')||'0');
  let currentLevelNum=parseInt(localStorage.getItem('wcrush_level')||'1');
  let level=null; let board=[], score=0, totalReward=parseFloat(localStorage.getItem('wcrush_wasa')||'0'), moves=0, timeLeft=0, timerInt=null, busy=false, sel=null, lastSwap=null;
  let session=null, claiming=false, pendingAd=null, startTime=Date.now();
  let workingBase=null; let gameStarted=false;

  async function startSession(){ try{ const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start_game_session', email:localStorage.getItem('wasa_email'), wallet:localStorage.getItem('wasa_wallet'), device_id:getDeviceId(), game_slug:'crypto-crush', level:currentLevelNum})}); const j=await r.json(); if(j.ok) session=j.session_id; }catch{} }
  async function claim(isDouble, ad){ if(claiming) return {ok:false}; if(!session) await startSession(); if(!session) return {ok:false}; claiming=true; try{ const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'claim_reward', session_id:session, email:localStorage.getItem('wasa_email'), wallet:localStorage.getItem('wasa_wallet'), device_id:getDeviceId(), game_slug:'crypto-crush', level:currentLevelNum, ad_watched:ad, double_reward:isDouble, time_taken:(Date.now()-startTime)/1000})}); const j=await r.json(); if(j.ok){ const b=j.wasa_balance??j.guest_balance??0; localStorage.setItem(j.is_guest?'wasa_coins_guest':'wasa_coins',b); if(window.setCoinsUI) window.setCoinsUI(b); session=null; claiming=false; return j; } claiming=false; return {ok:false, error:j.error}; }catch{ claiming=false; return {ok:false}; } }
  function openAd(t){ if(window.vrAd!==0 && window.vrAd!==undefined) return; pendingAd=t; window.vrAdType=t; window.vrAd=1; ui.innerHTML=`<div style="position:fixed;inset:0;background:rgba(0,0,0,.7);display:grid;place-items:center;z-index:50;color:white;font-weight:800">Cargando anuncio...</div>`; }
  function randColorFromActive(active){ const tok=active[Math.floor(Math.random()*active.length)]; return ALL_TOKENS.indexOf(tok); }
  function makeCell(color, special=null){ return {c:color, s:special}; }

  function createTokenImg(token, fallbackText){
    const wrapper=document.createElement('div');
    wrapper.style.width='100%'; wrapper.style.height='100%'; wrapper.style.display='grid'; wrapper.style.placeItems='center';
    const img=document.createElement('img');
    img.alt=token.name; img.loading='lazy'; img.style.width='76%'; img.style.height='76%'; img.style.objectFit='contain';
    let baseIndex=0;
    function tryNextBase(){
      if(baseIndex>=ASSET_BASES.length){
        const span=document.createElement('span'); span.textContent=fallbackText||token.icon; span.style.fontWeight='900'; span.style.fontSize='13px'; wrapper.innerHTML=''; wrapper.appendChild(span); return;
      }
      const base=ASSET_BASES[baseIndex];
      const urlToTry = workingBase ? workingBase + token.img : base + token.img;
      img.src=urlToTry;
    }
    img.onload=()=>{ if(!workingBase){ workingBase=ASSET_BASES[baseIndex]; if(!workingBase.endsWith('/')) workingBase+='/'; const src=img.src; workingBase=src.substring(0, src.lastIndexOf('/')+1); } };
    img.onerror=()=>{ baseIndex++; if(workingBase) workingBase=null; tryNextBase(); };
    tryNextBase(); wrapper.appendChild(img); return wrapper;
  }

  function showLevelIntro(){
    gameStarted=false;
    if(timerInt) clearInterval(timerInt);
    const isTimeLevel = level.type==='time';
    const title = isTimeLevel ? '⏰ NIVEL POR TIEMPO' : '🎯 NIVEL POR MOVIMIENTOS';
    const desc = isTimeLevel 
      ? `¡Alcanza <b style="color:#F59E0B">${level.objectives.find(o=>o.type==='score')?.target || 1000} puntos</b> antes de que se acabe el tiempo!<br>Tienes <b>${level.time} segundos</b> para lograrlo.`
      : `Consigue los objetivos con solo <b style="color:#4C1D95">${level.moves} movimientos</b>.<br>¡Piensa cada jugada!`;
    
    const objsHtml = level.objectives.map(o=>{
      if(o.type==='score') return `<div style="background:#FFFBEB;border:2px solid #F59E0B;border-radius:10px;padding:8px;display:flex;align-items:center;gap:8px"><div style="font-size:20px">⭐</div><div><b style="font-size:12px">${o.target} PUNTOS</b><div style="font-size:9px;opacity:.7">Consigue esa puntuación</div></div></div>`;
      if(o.type==='collect_color'){
        const tok=ALL_TOKENS[o.color];
        return `<div style="background:#F5F3FF;border:2px solid #DDD6FE;border-radius:10px;padding:8px;display:flex;align-items:center;gap:8px"><div style="width:28px;height:28px;border-radius:8px;background:linear-gradient(180deg,${tok.light},${tok.bg});display:grid;place-items:center;border:1.5px solid ${tok.bd}"><img src="${workingBase||'/games/crypto-crush/assets/'}${tok.img}" style="width:70%;height:70%;object-fit:contain" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span style="display:none;font-weight:900;font-size:12px">${tok.icon}</span></div><div><b style="font-size:12px">${o.name} ${o.target}</b><div style="font-size:9px;opacity:.7">Recolecta fichas</div></div></div>`;
      }
      return `<div style="background:#F5F3FF;border:2px solid #DDD6FE;border-radius:10px;padding:8px;display:flex;align-items:center;gap:8px"><div style="font-size:18px">${o.icon}</div><div><b style="font-size:12px">${o.name} ${o.target}</b></div></div>`;
    }).join('');

    ui.innerHTML=`<div style="position:fixed;inset:0;background:rgba(18,10,42,.92);backdrop-filter:blur(16px);display:grid;place-items:center;z-index:40;padding:16px">
      <div style="background:linear-gradient(180deg,#fff,#F3F0FF);border:3px solid ${isTimeLevel?'#EF4444':'#4C1D95'};border-radius:22px;padding:20px;text-align:center;width:min(380px,94vw);color:#2a1a5e;box-shadow:0 20px 60px rgba(0,0,0,.5)">
        <div style="font-size:12px;font-weight:900;letter-spacing:.1em;opacity:.6">${title}</div>
        <div style="font-size:32px;font-weight:900;margin:6px 0;color:${isTimeLevel?'#DC2626':'#4C1D95'}">NIVEL ${currentLevelNum}</div>
        <div style="background:${isTimeLevel?'#FEF2F2':'#F5F3FF'};border:1.5px solid ${isTimeLevel?'#FECACA':'#DDD6FE'};border-radius:12px;padding:12px;margin:10px 0;font-size:13px;line-height:1.4">${desc}</div>
        <div style="display:grid;gap:6px;margin:12px 0;text-align:left">${objsHtml}</div>
        <div style="font-size:10px;opacity:.6;margin:8px 0">Tokens en esta partida: ${level.activeTokens.map(t=>t.name).join(', ')}</div>
        <button id="btnStart" style="width:100%;height:52px;border-radius:14px;font-weight:900;font-size:16px;border:0;background:${isTimeLevel?'linear-gradient(135deg,#EF4444,#DC2626)':'linear-gradient(135deg,#4C1D95,#6D28D9)'};color:#fff;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.25);letter-spacing:.02em">▶ ACEPTAR Y EMPEZAR</button>
        <div style="font-size:9px;opacity:.5;margin-top:8px">${isTimeLevel?'El contador empieza al aceptar':'Los movimientos se descuentan al jugar'}</div>
      </div>
    </div>`;
    ui.querySelector('#btnStart').onclick=()=>{
      ui.innerHTML='';
      startGameTimer();
    };
  }

  function startGameTimer(){
    gameStarted=true;
    startTime=Date.now();
    if(level.type==='time'){
      if(timerInt) clearInterval(timerInt);
      timerInt=setInterval(()=>{
        if(!gameStarted) return;
        timeLeft--;
        if(timeLeft<=0){
          timeLeft=0;
          clearInterval(timerInt);
          checkFail();
        }
        updateUI();
      },1000);
    }
    updateUI();
  }

  function loadLevel(n){
    currentLevelNum=n; localStorage.setItem('wcrush_level', n);
    const activeTokens=getActiveTokensForLevel(n);
    level=generateLevel(n, activeTokens);
    score=0; moves=level.moves; timeLeft=level.time; sel=null; busy=false; lastSwap=null; gameStarted=false;
    if(timerInt) clearInterval(timerInt);
    let tries=0; do{ board=Array(SZ).fill(0).map(()=>Array(SZ).fill(0).map(()=>makeCell(randColorFromActive(activeTokens)))); tries++; }while(findMatches().groups.length>0 && tries<100);
    gridEl.innerHTML=''; for(let r=0;r<SZ;r++) for(let c=0;c<SZ;c++){ const cell=document.createElement('div'); cell.className='cc-cell'; cell.dataset.r=r; cell.dataset.c=c; gridEl.appendChild(cell); }
    const activeDiv=root.querySelector('#activeTokens'); activeDiv.innerHTML='';
    const neededNames=new Set(level.objectives.filter(o=>o.type==='collect_color').map(o=>o.name));
    activeTokens.forEach(tok=>{
      const chip=document.createElement('div');
      const isWasa=tok.name==='WASA';
      chip.className='cc-token-chip'+(neededNames.has(tok.name)?' needed':'')+(isWasa?' wasa':'');
      chip.style.background=`linear-gradient(180deg, ${tok.light}, ${tok.bg})`;
      chip.style.borderColor=tok.bd;
      chip.title=tok.name + (neededNames.has(tok.name)?' - OBJETIVO':'');
      chip.appendChild(createTokenImg(tok, tok.icon));
      activeDiv.appendChild(chip);
    });
    startSession(); draw(); updateObjectivesUI(); updateUI();
    showLevelIntro();
  }

  function updateUI(){
    const badge=root.querySelector('#lvlBadge');
    if(level.type==='time'){
      badge.classList.add('timed');
      badge.innerHTML=`<b id="lvlNum">N${currentLevelNum} ⏰</b><span id="lvlUnlock">${level.time}s</span>`;
    } else {
      badge.classList.remove('timed');
      badge.innerHTML=`<b id="lvlNum">N${currentLevelNum}</b><span id="lvlUnlock">${getUnlockedTokens(currentLevelNum).length}/11</span>`;
    }

    if(level.type==='time'){
      root.querySelector('#moves').textContent=gameStarted ? timeLeft+'s' : level.time+'s';
      root.querySelector('#movesLabel').textContent=gameStarted ? 'TIEMPO' : 'LISTO';
      const movesEl=root.querySelector('#moves').parentElement.parentElement;
      movesEl.querySelector('#moves').style.color=timeLeft<=10 ? '#DC2626' : '';
      // convierte el contador de movs en timer rojo
      const rightStats=root.querySelectorAll('.cc-stat-mini');
      // el contador de movs se vuelve timer
      const movesStat=root.querySelector('#moves').closest('.cc-stat-mini') || document.querySelector('.cc-header-left div:last-child');
      if(movesStat){
        movesStat.style.background = timeLeft<=10 ? 'linear-gradient(180deg,#FEE2E2,#FCA5A5)' : '';
        movesStat.style.borderColor = timeLeft<=10 ? '#EF4444' : '';
      }
    } else {
      root.querySelector('#moves').textContent=moves;
      root.querySelector('#movesLabel').textContent='MOVS';
    }
    root.querySelector('#cScore').textContent=score;
    root.querySelector('#cBest').textContent=best;
    root.querySelector('#cReward').textContent='+'+fmt(totalReward).slice(0,6);
  }

  function updateObjectivesUI(){
    const list=root.querySelector('#objList'); list.innerHTML='';
    level.objectives.forEach(obj=>{
      const item=document.createElement('div'); 
      item.className='cc-obj-mini'+(obj.current>=obj.target?' done':'')+(obj.type==='score'?' time':'');
      const icon=document.createElement('div'); icon.className='cc-obj-mini-icon';
      if(obj.type==='collect_color'){
        const tok=ALL_TOKENS[obj.color];
        icon.style.background=`linear-gradient(180deg, ${tok.light}, ${tok.bg})`;
        icon.style.border=`1.5px solid ${tok.bd}`;
        icon.innerHTML=''; icon.appendChild(createTokenImg(tok, tok.icon));
      } else { icon.style.background='#fff'; icon.textContent=obj.icon; }
      const info=document.createElement('div'); info.className='cc-obj-mini-info'; info.innerHTML=`<div class="cc-obj-mini-name">${obj.name} ${obj.current}/${obj.target}</div><div class="cc-obj-mini-bar"><div class="cc-obj-mini-fill" style="width:${Math.min(100, obj.current/obj.target*100)}%"></div></div>`;
      item.appendChild(icon); item.appendChild(info); list.appendChild(item);
    });
  }

  function draw(){
    for(let r=0;r<SZ;r++) for(let c=0;c<SZ;c++){
      const idx=r*SZ+c; const cellEl=gridEl.children[idx]; if(!cellEl) continue;
      const obj=board[r][c]; if(!obj){ cellEl.innerHTML=''; continue; }
      let candy=cellEl.querySelector('.cc-candy');
      if(!candy){ candy=document.createElement('div'); cellEl.appendChild(candy); }
      const tok=ALL_TOKENS[obj.c];
      let cls='cc-candy'; if(tok?.name==='WASA') cls+=' wasa-candy'; if(tok?.name==='DASH') cls+=' dash-candy'; if(obj.s==='bomb') cls+=' bomb'; else if(obj.s==='h') cls+=' striped-h'; else if(obj.s==='v') cls+=' striped-v'; else if(obj.s==='color') cls+=' color-bomb';
      candy.className=cls;
      if(obj.s==='color'){ candy.innerHTML='🌈'; }
      else {
        candy.innerHTML='';
        candy.appendChild(createTokenImg(tok, tok.icon));
        if(tok.name!=='WASA' && tok.name!=='DASH'){
          candy.style.background=`linear-gradient(180deg, ${tok.light}, ${tok.bg})`;
          candy.style.borderColor=tok.bd;
        }
      }
      cellEl.classList.remove('sel','matched','new'); if(sel && sel.r==r && sel.c==c) cellEl.classList.add('sel');
    }
  }

  function isAdj(r1,c1,r2,c2){ return Math.abs(r1-r2)+Math.abs(c1-c2)===1; }
  function checkWin(){ return level.objectives.every(o=>o.current>=o.target); }
  function checkFail(){ 
    if(!gameStarted) return;
    if(level.type==='time' && timeLeft<=0 && !checkWin()){ showFail(); } 
    if(level.type==='moves' && moves<=0 && !checkWin()){ showFail(); } 
  }

  async function handleSelect(r,c){
    if(busy || !gameStarted) return;
    const obj=board[r][c];
    if(obj.s==='color' && sel){ const targetColor=board[sel.r][sel.c].c; await activateColorBomb(r,c,targetColor); return; }
    if(obj.s && sel===null && (obj.s==='h'||obj.s==='v'||obj.s==='bomb'||obj.s==='color')){ await activateSpecial(r,c); return; }
    if(!sel){ sel={r,c}; draw(); return; }
    if(sel.r===r && sel.c===c){ sel=null; draw(); return; }
    if(!isAdj(sel.r,sel.c,r,c)){ sel={r,c}; draw(); return; }
    await trySwap(sel.r,sel.c,r,c);
  }

  async function activateSpecial(r,c){
    if(busy || !gameStarted) return; busy=true; sel=null;
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
    if(level.type==='moves') moves--;
    updateObjectivesUI(); updateUI(); busy=false;
    if(checkWin()) showWin(); else checkFail();
  }

  async function activateColorBomb(r,c,targetColor){
    if(busy || !gameStarted) return; busy=true; sel=null;
    let toRemove=new Set(); toRemove.add(r+','+c);
    for(let rr=0;rr<SZ;rr++) for(let cc=0;cc<SZ;cc++) if(board[rr][cc]?.c===targetColor) toRemove.add(rr+','+cc);
    toRemove.forEach(k=>{ const [rr,cc]=k.split(',').map(Number); const col=board[rr][cc]?.c; if(col!==undefined) level.objectives.forEach(o=>{ if(o.type==='collect_color' && o.color===col) o.current++; }); });
    level.objectives.forEach(o=>{ if(o.type==='collect_rainbow') o.current++; });
    await processMatchesWithSet(Array.from(toRemove), null, 1, []);
    await runAutoCascade();
    if(level.type==='moves') moves--;
    updateObjectivesUI(); updateUI(); busy=false;
    if(checkWin()) showWin(); else checkFail();
  }

  async function trySwap(r1,c1,r2,c2){
    if(busy || !gameStarted) return; busy=true; lastSwap={r1,c1,r2,c2};
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
      if(level.type==='moves') moves--; updateObjectivesUI(); updateUI(); busy=false;
      if(checkWin()) showWin(); else checkFail(); return;
    }
    swap(r1,c1,r2,c2); draw(); await new Promise(res=>setTimeout(res,120));
    let found=findMatches();
    if(found.groups.length===0){ swap(r1,c1,r2,c2); draw(); busy=false; sel=null; return; }
    sel=null; await processCascade(found);
    if(level.type==='moves') moves--; updateObjectivesUI(); updateUI(); busy=false;
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
    gameStarted=false;
    if(timerInt) clearInterval(timerInt);
    const reward=level.reward; totalReward+=reward; localStorage.setItem('wcrush_wasa', totalReward);
    if(score>best){ best=score; localStorage.setItem('wcrush_best',best); }
    const isTimeLevel=level.type==='time';
    ui.innerHTML=`<div style="position:fixed;inset:0;background:rgba(18,10,42,.88);backdrop-filter:blur(14px);display:grid;place-items:center;z-index:30;padding:16px"><div style="background:linear-gradient(180deg,#fff,#F3F0FF);border:3px solid #22C55E;border-radius:22px;padding:22px;text-align:center;width:min(360px,94vw);color:#2a1a5e"><div style="font-size:48px">🎉</div><div style="font-weight:900;font-size:11px;opacity:.6">${isTimeLevel?'⏰ NIVEL POR TIEMPO COMPLETADO':'🎯 NIVEL POR MOVIMIENTOS COMPLETADO'}</div><div style="font-weight:900;font-size:22px;color:#065F46">¡NIVEL ${currentLevelNum}!</div><div style="font-size:11px;opacity:.7;margin-top:6px">Tokens: ${level.activeTokens.map(t=>t.name).join(', ')} • Score: ${score}</div><div style="background:linear-gradient(180deg,#DCFCE7,#86EFAC);border:2px solid #22C55E;border-radius:14px;padding:12px;margin:12px 0;font-weight:900;color:#065F46">💰 +${fmt(reward)} WASA</div><button id="btnNext" style="width:100%;height:46px;border-radius:14px;font-weight:900;border:0;background:linear-gradient(135deg,#22C55E,#16A34A);color:#000;cursor:pointer">SIGUIENTE NIVEL ${currentLevelNum+1} (${getUnlockedTokens(currentLevelNum+1).length}/11)</button><button id="btnDouble" style="width:100%;height:44px;border-radius:14px;font-weight:900;border:2.5px solid #FACC15;background:linear-gradient(135deg,#FEF08A,#FACC15);color:#000;margin-top:8px;cursor:pointer">📺 X2 = ${fmt(reward*2)} WASA</button></div></div>`;
    ui.querySelector('#btnNext').onclick=async()=>{ const res=await claim(false,false); currentLevelNum++; loadLevel(currentLevelNum); ui.innerHTML=''; };
    ui.querySelector('#btnDouble').onclick=()=>openAd('double_level');
  }
  function showFail(){
    gameStarted=false;
    if(timerInt) clearInterval(timerInt);
    const isTimeLevel=level.type==='time';
    const reason=isTimeLevel ? `⏰ ¡Se acabó el tiempo! Te faltaron ${level.objectives.filter(o=>o.current<o.target).map(o=>o.name+' '+o.current+'/'+o.target).join(', ')}` : `Te faltó ${level.objectives.filter(o=>o.current<o.target).map(o=>o.name).join(', ')} en ${level.moves} movs`;
    ui.innerHTML=`<div style="position:fixed;inset:0;background:rgba(18,10,42,.88);backdrop-filter:blur(14px);display:grid;place-items:center;z-index:30;padding:16px"><div style="background:linear-gradient(180deg,#fff,#F3F0FF);border:3px solid #EF4444;border-radius:22px;padding:22px;text-align:center;width:min(360px,94vw);color:#2a1a5e"><div style="font-size:40px">${isTimeLevel?'⏰':'😵'}</div><div style="font-weight:900;font-size:20px;color:#991B1B">${isTimeLevel?'¡TIEMPO AGOTADO!':'¡SIN MOVIMIENTOS!'}</div><div style="font-size:12px;opacity:.7;margin:8px 0">${reason}</div><button id="btnRetry" style="width:100%;height:46px;border-radius:14px;font-weight:900;border:0;background:#EF4444;color:#fff;cursor:pointer">REINTENTAR NIVEL ${currentLevelNum}</button><button id="btnSkip" style="width:100%;height:44px;border-radius:14px;border:2.5px solid #DDD6FE;background:#fff;color:#4C1D95;margin-top:8px;cursor:pointer">${isTimeLevel?'VER ANUNCIO +15s':'VER ANUNCIO +5 MOVS'}</button></div></div>`;
    ui.querySelector('#btnRetry').onclick=()=>{ ui.innerHTML=''; loadLevel(currentLevelNum); };
    ui.querySelector('#btnSkip').onclick=()=>openAd(isTimeLevel?'extra_time':'extra_moves');
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
    if(t==='extra_moves'){ moves+=5; gameStarted=true; startGameTimer(); updateUI(); ui.innerHTML=''; }
    if(t==='extra_time'){ timeLeft+=15; gameStarted=true; startGameTimer(); updateUI(); ui.innerHTML=''; }
  })(); } },150);
  loadLevel(currentLevelNum);
  container._cleanup=()=>{ clearInterval(watcher); if(timerInt) clearInterval(timerInt); document.removeEventListener('touchmove', preventScroll); window.vrAd=0; };
}
