// games/banatron-royale/game.js - v1.1 - FIX AMARILLO CONGELADO + GRIS -> LILA VIOLETA
export function init(container, args){
  const getCoins = args.getCoins||(()=>parseFloat(localStorage.getItem('wasa_coins')||'0'));
  const WORKER_URL = window.WASA_CONFIG?.WORKER_URL || 'https://games-wasa-worker.javimsites.workers.dev/';
  function getDeviceId(){ if(window.getDeviceId) return window.getDeviceId(); let id=localStorage.getItem('wasa_device_id'); if(!id){ id='dev_'+Math.random().toString(36).slice(2)+Date.now().toString(36); localStorage.setItem('wasa_device_id',id);} return id; }
  container.innerHTML = `<style>
.bt{width:100%;height:100%;position:relative;background:#0a0a1a;overflow:hidden;font-family:Inter,system-ui,sans-serif;touch-action:none;user-select:none}
.bt canvas{width:100%;height:100%;display:block;touch-action:none}
.bt-ui{position:absolute;inset:0;pointer-events:none}
.bt-ui button{pointer-events:auto}
.bt-hint{position:absolute;bottom:12px;left:50%;transform:translateX(-50%);background:rgba(168,85,247,.2);color:#e9d5ff;border:1px solid rgba(168,85,247,.3);border-radius:999px;padding:6px 14px;font-size:10px;font-weight:800;z-index:15;transition:opacity .4s}
.bt-hint.hide{opacity:0}
  </style><div class="bt"><canvas id="c"></canvas><div id="ui" class="bt-ui"></div><div id="hint" class="bt-hint">👑 ROYALE 4 LINEAS • Swipe para girar • Elimina a 3</div></div>`;
  const wrap=container.querySelector('.bt'); const canvas=wrap.querySelector('#c'); const ctx=canvas.getContext('2d'); const ui=wrap.querySelector('#ui'); const hint=wrap.querySelector('#hint');
  let W=wrap.clientWidth,H=wrap.clientHeight; function resize(){W=wrap.clientWidth;H=wrap.clientHeight;const dpr=devicePixelRatio||1;canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0);} resize(); const ro=new ResizeObserver(resize); ro.observe(wrap);
  const COLS=64, ROWS=44; let cellW,cellH,offsetX,offsetY;
  function calcMetrics(){ const border=10; const availW=W-border*2, availH=H*0.88-border*2; cellW=Math.floor(availW/COLS); cellH=Math.floor(availH/ROWS); const cs=Math.min(cellW,cellH); cellW=cs; cellH=cs; offsetX=Math.floor((W - COLS*cs)/2); offsetY=Math.floor((H*0.88 - ROWS*cs)/2)+border; } calcMetrics();
  let state='menu'; let round=1; let grid, players=[], tick=0, roundStart=0, currentSessionId=null, isClaiming=false, _rewardPending=null, adClaimed=false, lastReward=0;
  const DIRS=[{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
  let hasPass=false, passChecked=false;
  function fmt(n){ const v=parseFloat(n)||0; return v.toFixed(7).replace(/0+$/,'').replace(/\.$/,''); }
  function baseReward(){ return 0.0003; }
  function rewardWithPass(kills){ const base = 0.0003 * kills; return base * (hasPass?5:1); }
  async function checkPass(){
    if(passChecked) return hasPass;
    try{
      const email=localStorage.getItem('wasa_email')||'', wallet=localStorage.getItem('wasa_wallet')||'', device_id=getDeviceId();
      const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'check_pass', email, wallet, device_id})});
      const j=await r.json(); if(j.ok && (j.has_pass||j.hasPass)){ hasPass=true; localStorage.setItem('wasa_pass_active','1'); }
    }catch{ hasPass = localStorage.getItem('wasa_pass_active')==='1'; }
    passChecked=true; return hasPass;
  }
  function newGrid(){ const g=[]; for(let y=0;y<ROWS;y++){ g[y]=Array(COLS).fill(0); } return g; }
  function canMove(x,y){ if(x<0||x>=COLS||y<0||y>=ROWS) return false; return grid[y][x]===0; }
  function floodCount(sx,sy){
    if(!canMove(sx,sy)) return 0;
    const visited=new Set(); const q=[[sx,sy]]; visited.add(sx+','+sy); let head=0;
    while(head<q.length && visited.size<900){
      const [x,y]=q[head++]; for(let d=0;d<4;d++){ const nx=x+DIRS[d].x, ny=y+DIRS[d].y; const key=nx+','+ny; if(nx<0||nx>=COLS||ny<0||ny>=ROWS) continue; if(visited.has(key)) continue; if(grid[ny][nx]!==0) continue; visited.add(key); q.push([nx,ny]); }
    } return visited.size;
  }
  function aiChoose(p){
    const cur=p.dir; 
    const cands=[];
    // probar las 4 direcciones, no solo 3, para evitar congelamiento
    const order = p.personality==='chaotic' ? [0,1,2,3].sort(()=>Math.random()-0.5) : [0,-1,1,2]; // caotico orden random, otros prefieren seguir
    for(let o of order){
      let nd;
      if(p.personality==='chaotic'){ nd=o; } else { nd=(cur+o+4)%4; }
      if((nd+2)%4===cur) { // no permitir 180 grados salvo que sea unica salida
        // solo permitir si es la unica opcion
        let hasOther=false;
        for(let d=0;d<4;d++){ if(d===nd) continue; if(d===(cur+2)%4) continue; const tx=p.x+DIRS[d].x, ty=p.y+DIRS[d].y; if(canMove(tx,ty)) hasOther=true; }
        if(hasOther) continue;
      }
      const nx=p.x+DIRS[nd].x, ny=p.y+DIRS[nd].y;
      if(!canMove(nx,ny)) continue;
      let exits=0; for(let d=0;d<4;d++){ if(d===(nd+2)%4) continue; const ex=nx+DIRS[d].x, ey=ny+DIRS[d].y; if(canMove(ex,ey)) exits++; }
      let score=0; const flood=floodCount(nx,ny);
      if(flood<2) score-=8000; else if(flood<8) score-=600; else score+=flood*2.2;
      if(exits===0) score-=3000; if(exits===1 && flood<30) score-=500;
      if(p.personality==='aggressive'){
        const player=players.find(pl=>pl.isPlayer && pl.alive);
        if(player){ const dist=Math.abs(nx-player.x)+Math.abs(ny-player.y); if(dist<8) score+=90; if(dist<16) score+=35; }
      }
      if(p.personality==='defensive'){ score+=exits*25; score+=flood*0.5; }
      if(p.personality==='chaotic'){ score+=Math.random()*60; score+=exits*15; } // caotico pero no suicida
      if(o===0) score+=8;
      cands.push({dir:nd,score,flood,exits});
    }
    if(cands.length===0){
      // ultimo intento: incluso 180 grados si es la unica salida
      for(let d=0;d<4;d++){ const nx=p.x+DIRS[d].x, ny=p.y+DIRS[d].y; if(canMove(nx,ny)) return d; }
      return cur; // se va a morir en step, no congelar
    }
    cands.sort((a,b)=>b.score-a.score); return cands[0].dir;
  }

  async function startSession(lvl){
    currentSessionId=null;
    try{
      const email=localStorage.getItem('wasa_email'), wallet=localStorage.getItem('wasa_wallet'), device_id=getDeviceId();
      const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start_game_session', email, wallet, device_id, game_slug:'banatron-royale', level:lvl})});
      const j=await r.json(); if(j.ok){ currentSessionId=j.session_id; return j.session_id; }
    }catch{} return null;
  }
  async function claimSession(isDouble,adWatched,kills){
    if(isClaiming) return {ok:false}; if(!currentSessionId) await startSession(round);
    if(!currentSessionId) return {ok:false, error:'sin sesion'}; isClaiming=true;
    try{
      const email=localStorage.getItem('wasa_email'), wallet=localStorage.getItem('wasa_wallet'), device_id=getDeviceId();
      const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'claim_reward', session_id:currentSessionId, email, wallet, device_id, game_slug:'banatron-royale', level:round, kills:kills, ad_watched:adWatched, double_reward:isDouble, time_taken:0})});
      const j=await r.json(); if(j.ok){ const bal=j.wasa_balance??j.guest_balance??0; if(j.is_guest) localStorage.setItem('wasa_coins_guest',bal); else localStorage.setItem('wasa_coins',bal); if(window.setCoinsUI) window.setCoinsUI(bal); currentSessionId=null; isClaiming=false; return j; } else { isClaiming=false; return {ok:false, error:j.error}; }
    }catch(e){ isClaiming=false; return {ok:false}; }
  }

  function resetRound(r){
    round=r; grid=newGrid(); players=[];
    const configs=[
      {x:Math.floor(COLS*0.18), y:Math.floor(ROWS*0.25), dir:1, color:'#22c55e', light:'#86efac', deadColor:'#a7f3d0', name:'TU', isPlayer:true, personality:'player'},
      {x:Math.floor(COLS*0.82), y:Math.floor(ROWS*0.25), dir:3, color:'#ef4444', light:'#fca5a5', deadColor:'#fda4af', name:'ROJO', isPlayer:false, personality:'aggressive'},
      {x:Math.floor(COLS*0.18), y:Math.floor(ROWS*0.75), dir:1, color:'#3b82f6', light:'#93c5fd', deadColor:'#c4b5fd', name:'AZUL', isPlayer:false, personality:'defensive'},
      {x:Math.floor(COLS*0.82), y:Math.floor(ROWS*0.75), dir:3, color:'#eab308', light:'#fde68a', deadColor:'#d8b4fe', name:'AMARILLO', isPlayer:false, personality:'chaotic'},
    ];
    configs.forEach((c,i)=>{
      const p={...c, id:i+1, alive:true, trail:[{x:c.x,y:c.y}]}; players.push(p); grid[c.y][c.x]=p.id;
    });
    tick=0; roundStart=performance.now(); adClaimed=false; startSession(r);
  }

  function step(){
    players.forEach(p=>{ if(!p.alive||p.isPlayer) return; p.dir=aiChoose(p); });
    const nextPos=new Map();
    players.forEach(p=>{
      if(!p.alive) return;
      const nx=p.x+DIRS[p.dir].x, ny=p.y+DIRS[p.dir].y;
      const key=nx+','+ny;
      if(!nextPos.has(key)) nextPos.set(key,[]);
      nextPos.get(key).push(p);
    });
    nextPos.forEach((list,key)=>{
      if(list.length>1){ list.forEach(p=> p.alive=false); }
    });
    players.forEach(p=>{
      if(!p.alive) return;
      const nx=p.x+DIRS[p.dir].x, ny=p.y+DIRS[p.dir].y;
      if(!canMove(nx,ny)){ p.alive=false; return; }
      p.x=nx; p.y=ny; grid[ny][nx]=p.id; p.trail.push({x:nx,y:ny});
    });
    tick++;
  }

  function getAliveCount(){ return players.filter(p=>p.alive).length; }
  function getPlayerAlive(){ return players.find(p=>p.isPlayer)?.alive; }
  function getKills(){ return players.filter(p=>!p.isPlayer && !p.alive).length; }
  function openAd(t){ if(window.vrAd!==0) return; _rewardPending=t; window.vrAdType=t; window.vrAd=1; state='paused_ad'; renderUI(); }

  function renderUI(){
    const coins=getCoins();
    if(state==='menu'){
      const base=baseReward(); const basePass=rewardWithPass(3);
      ui.innerHTML=`<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%, rgba(168,85,247,.22), transparent 60%), linear-gradient(180deg,#0a0a1a,#120a2a);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14px;text-align:center">
        <div style="font-size:10px;letter-spacing:.3em;color:#c084fc">BANATRON ROYALE • 4 LINEAS • LILA FIX • ${hasPass?'PASS X5 💎':''}</div>
        <div style="margin-top:6px;font-size:36px;font-weight:900;color:white">BANANA<span style="color:#22c55e">TRON</span> <span style="color:#c084fc">ROYALE</span></div>
        <div style="margin-top:4px;display:flex;gap:6px;flex-wrap:wrap;justify-content:center">
          <span style="background:#22c55e;color:#000;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:900">TU VERDE</span>
          <span style="background:#ef4444;color:#fff;padding:2px 8px;border-radius:999px;font-size:10px">ROJO AGRESIVO</span>
          <span style="background:#8b5cf6;color:#fff;padding:2px 8px;border-radius:999px;font-size:10px">LILA DEF</span>
          <span style="background:#eab308;color:#000;padding:2px 8px;border-radius:999px;font-size:10px">AMARILLO</span>
        </div>
        <div style="margin-top:8px;color:#a78bfa;font-size:10px">Elimina a 3 • Gana hasta ${fmt(basePass)} WASA ${hasPass?'💎 X5':''} • ${fmt(coins)} $WASA</div>
        ${hasPass?`<div style="margin-top:8px;background:linear-gradient(135deg,#A855F7,#7E22CE);color:#fff;border-radius:8px;padding:5px 12px;font-weight:900;font-size:11px">💎 PASS X5 ACTIVO - ${fmt(basePass)} por victoria total</div>`:`<div style="margin-top:8px;font-size:9px;color:#c084fc"><a href="/wasa-pass.html" style="color:#c084fc;font-weight:800">💎 Con PASS X5 ganarías ${fmt(base*5*3)} por victoria → Comprar</a></div>`}
        <div style="margin-top:14px;width:100%;max-width:300px;display:flex;flex-direction:column;gap:8px">
          <button id="play" style="background:linear-gradient(135deg,#c084fc,#7e22ce);color:#fff;font-weight:900;padding:14px;border-radius:999px;border:0;cursor:pointer">👑 JUGAR ROYALE 4 LINEAS ${hasPass?'💎 X5':''}</button>
          <div style="display:flex;gap:8px"><button id="how" style="flex:1;background:rgba(168,85,247,.15);border:1px solid rgba(168,85,247,.3);color:#c084fc;padding:10px;border-radius:999px">¿Como se juega?</button><button id="classic" style="flex:1;background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.25);color:#22c55e;padding:10px;border-radius:999px;font-weight:800">2 Lineas Classic</button></div>
        </div>
        <div style="margin-top:10px;font-size:9px;color:#a78bfa;background:rgba(168,85,247,.12);padding:6px 10px;border-radius:8px;border:1px solid rgba(168,85,247,.2)">👆 Swipe: si vas ↕️ deslizas ↔️ • si vas ↔️ deslizas ↕️ • FIX AMARILLO</div>
      </div>`;
      ui.querySelector('#play').onclick=()=>{ resetRound(1); state='playing'; renderUI(); };
      ui.querySelector('#how').onclick=()=>{ alert('Royale 4 lineas v1.1:\n\n- Fix amarillo congelado\n- Muertos ahora lila claro, no gris\n- 4 gusanos, ultimo vivo gana'); };
      ui.querySelector('#classic').onclick=()=>{ window.location.href='/play?game=banatron'; };
      if(hint) hint.classList.add('hide');
    }else if(state==='playing'){
      const alive=getAliveCount(); const kills=getKills();
      const elapsed=((performance.now()-roundStart)/1000).toFixed(1);
      const currentReward = rewardWithPass(kills);
      ui.innerHTML=`<div style="position:absolute;top:6px;left:8px;right:8px;display:flex;justify-content:space-between;font-size:10px;color:white;font-family:monospace"><div style="color:#c084fc">👑 ${alive} VIVOS • ${kills}/3 KILLS • ${elapsed}s • ${fmt(currentReward)} ${hasPass?'💎':''}</div><div style="color:#22c55e">${fmt(coins)} $WASA</div></div><div style="position:absolute;top:24px;left:8px;display:flex;gap:4px">${players.map(p=>`<div style="width:8px;height:8px;border-radius:50%;background:${p.alive?p.color:p.deadColor};border:1px solid ${p.color};opacity:${p.alive?1:0.5}"></div>`).join('')}</div>`;
      if(hint){ hint.classList.remove('hide'); const p=players.find(pl=>pl.isPlayer); if(p) hint.textContent = (p.dir===0||p.dir===2) ? '👆 Desliza ↔️ para girar • Quedan '+alive : '👆 Desliza ↕️ para girar • Quedan '+alive; }
    }else if(state==='roundover'){
      const playerAlive=getPlayerAlive(); const kills=getKills(); const isWin=playerAlive && kills===3;
      const reward=rewardWithPass(kills); const rewardX2=reward*2;
      lastReward=reward;
      ui.innerHTML=`<div style="position:absolute;inset:0;background:rgba(10,10,26,.88);display:flex;align-items:center;justify-content:center;padding:12px"><div style="background:#1a1030;border:2px solid ${isWin?'#c084fc':'#ef4444'};border-radius:16px;padding:16px;width:100%;max-width:340px;text-align:center">
        <div style="font-size:32px">${isWin?'👑':playerAlive?'😅':'💀'}</div>
        <div style="font-size:12px;letter-spacing:.2em;color:${isWin?'#c084fc':playerAlive?'#22c55e':'#ef4444'};margin-top:4px">${isWin?'VICTORIA ROYALE!':playerAlive?'SOBREVIVISTE':'ELIMINADO'}</div>
        <div style="color:white;font-weight:900;margin-top:6px">Matastes ${kills}/3 • ${isWin?'GANASTE TODO':'QUEDASTE '+ (getAliveCount()) +' vivo'}</div>
        <div style="margin-top:8px;background:rgba(0,0,0,.4);border-radius:10px;padding:8px;font-size:11px;color:#e9d5ff">
          <div style="display:flex;justify-content:space-between"><span>Kills</span><span>${kills}/3</span></div>
          <div style="display:flex;justify-content:space-between;font-weight:800;color:${hasPass?'#c084fc':'#22c55e'};margin-top:4px"><span>Reward ${hasPass?'💎 X5':''}</span><span>${fmt(reward)} WASA</span></div>
          <div style="display:flex;justify-content:space-between;font-size:10px;opacity:.7"><span>Con AD X2 ${hasPass?'💎 X10':''}</span><span>${fmt(rewardX2)}</span></div>
        </div>
        <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px">
          ${kills>0 && !adClaimed?`<button id="dbl" style="background:linear-gradient(135deg,#c084fc,#7e22ce);color:#fff;font-weight:900;padding:12px;border-radius:999px;border:0">📺 X2 = ${fmt(rewardX2)} ${hasPass?'💎 X10':''}</button>`:''}
          <button id="claim" style="background:${isWin?'linear-gradient(135deg,#c084fc,#7e22ce)':'#fff'};color:${isWin?'#fff':'#000'};font-weight:900;padding:12px;border-radius:999px;border:0">${kills>0?`COBRAR ${fmt(reward)} WASA ${hasPass?'💎':''} Y SIGUIENTE`:'REINTENTAR ROYALE'}</button>
          <button id="menu" style="background:rgba(168,85,247,.12);color:#c084fc;padding:10px;border-radius:999px;border:1px solid rgba(168,85,247,.2)">MENU</button>
        </div>
      </div></div>`;
      ui.querySelector('#dbl')?.addEventListener('click',()=>{ openAd('double'); });
      ui.querySelector('#claim').onclick=async()=>{
        const btn=ui.querySelector('#claim'); if(btn){ btn.textContent='⏳ VALIDANDO SERVER...'; btn.disabled=true; }
        if(kills===0){ resetRound(1); state='playing'; renderUI(); return; }
        const res=await claimSession(false,false,kills);
        if(res.ok){ resetRound(1); state='playing'; renderUI(); } else { if(btn){ btn.textContent='REINTENTAR: '+(res.error||''); btn.disabled=false; } }
      };
      ui.querySelector('#menu').onclick=()=>{ state='menu'; renderUI(); };
      if(hint) hint.classList.add('hide');
    }else if(state==='paused_ad'){ ui.innerHTML=`<div style="position:absolute;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;color:white">Cargando ad royale... vrAd=${window.vrAd}</div>`; }
    else if(state==='reward_modal'){
      const kills=getKills(); const rew=rewardWithPass(kills)*2;
      ui.innerHTML=`<div style="position:absolute;inset:0;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:12px"><div style="background:#1a1030;border:1px solid #c084fc;border-radius:12px;padding:14px;width:100%;max-width:280px;text-align:center"><div style="color:#c084fc;font-weight:900">👑 X2 ROYALE SERVER! ${hasPass?'💎 X10':''}</div><div style="color:white;font-size:13px;margin-top:6px">${fmt(lastReward)} → ${fmt(rew)} WASA</div><button id="claim2" style="margin-top:10px;width:100%;background:#c084fc;color:#000;font-weight:900;padding:12px;border-radius:999px;border:0">RECLAMAR ${fmt(rew)} 💎</button></div></div>`;
      ui.querySelector('#claim2').onclick=async()=>{
        const btn=ui.querySelector('#claim2'); if(btn){ btn.textContent='⏳ VALIDANDO...'; btn.disabled=true; }
        adClaimed=true;
        const res=await claimSession(true,true,kills);
        if(res.ok){ resetRound(1); state='playing'; renderUI(); }
      };
    }
  }

  let touchStartX=0, touchStartY=0;
  const SWIPE_TH=18;
  function handleSwipe(dx,dy){
    const p=players.find(pl=>pl.isPlayer); if(!p||!p.alive||state!=='playing') return false;
    if(p.dir===0||p.dir===2){
      if(Math.abs(dx)>Math.abs(dy) && Math.abs(dx)>SWIPE_TH){ if(dx>0 && p.dir!==3) p.dir=1; else if(dx<0 && p.dir!==1) p.dir=3; return true; }
    } else {
      if(Math.abs(dy)>Math.abs(dx) && Math.abs(dy)>SWIPE_TH){ if(dy>0 && p.dir!==0) p.dir=2; else if(dy<0 && p.dir!==2) p.dir=0; return true; }
    } return false;
  }
  wrap.addEventListener('touchstart',e=>{ if(e.touches.length!==1) return; touchStartX=e.touches[0].clientX; touchStartY=e.touches[0].clientY; },{passive:true});
  wrap.addEventListener('touchmove',e=>{
    if(state!=='playing') return; const curX=e.touches[0].clientX, curY=e.touches[0].clientY; const dx=curX-touchStartX, dy=curY-touchStartY;
    if(handleSwipe(dx,dy)){ touchStartX=curX; touchStartY=curY; }
  },{passive:true});
  wrap.addEventListener('touchend',e=>{
    const endX=e.changedTouches[0].clientX, endY=e.changedTouches[0].clientY; handleSwipe(endX-touchStartX, endY-touchStartY); touchStartX=0;
  },{passive:true});
  addEventListener('keydown',e=>{
    const p=players.find(pl=>pl.isPlayer); if(!p||state!=='playing') return;
    if((e.key==='ArrowUp'||e.key==='w') && p.dir!==2) p.dir=0;
    if((e.key==='ArrowRight'||e.key==='d') && p.dir!==3) p.dir=1;
    if((e.key==='ArrowDown'||e.key==='s') && p.dir!==0) p.dir=2;
    if((e.key==='ArrowLeft'||e.key==='a') && p.dir!==1) p.dir=3;
  });

  let watcher=setInterval(()=>{ if(window.vrAd===4 && _rewardPending && state!=='reward_modal'){ state='reward_modal'; renderUI(); } },150);
  let raf,acc=0,last=performance.now();
  function getInterval(){ return 100; }
  function loop(now){
    if(window.vrAd===1||window.vrAd===2||window.vrAd===3){ raf=requestAnimationFrame(loop); return; }
    const dt=Math.min((now-last)/1000,0.033); last=now; acc+=dt*1000;
    if(state==='playing'){
      if(acc>=getInterval()){ acc=0; step(); if(getAliveCount()<=1 || !getPlayerAlive()){ state='roundover'; renderUI(); } }
    }
    calcMetrics(); 
    // fondo violeta oscuro en vez de negro puro
    ctx.fillStyle='#120a2a'; ctx.fillRect(0,0,W,H); 
    ctx.strokeStyle='#4c1d95'; ctx.lineWidth=2; ctx.strokeRect(offsetX-2,offsetY-2,COLS*cellW+4,ROWS*cellH+4);
    // grid sutil violeta
    ctx.strokeStyle='rgba(168,85,247,0.08)'; ctx.lineWidth=0.5;
    for(let x=0;x<=COLS;x++){ ctx.beginPath(); ctx.moveTo(offsetX+x*cellW, offsetY); ctx.lineTo(offsetX+x*cellW, offsetY+ROWS*cellH); ctx.stroke(); }
    for(let y=0;y<=ROWS;y++){ ctx.beginPath(); ctx.moveTo(offsetX, offsetY+y*cellH); ctx.lineTo(offsetX+COLS*cellW, offsetY+y*cellH); ctx.stroke(); }
    players.forEach(p=>{
      if(p.trail.length<2) return;
      // trail vivo = color solido, muerto = lila claro
      ctx.strokeStyle=p.alive?p.color:p.deadColor; 
      ctx.lineWidth=Math.max(2,cellW*0.45); 
      ctx.globalAlpha=p.alive?1:0.55;
      ctx.setLineDash(p.isPlayer?[cellW*0.9,cellW*0.5]:[]); ctx.beginPath();
      for(let i=1;i<p.trail.length;i++){ const a=p.trail[i-1], b=p.trail[i]; if(i===1) ctx.moveTo(offsetX+a.x*cellW+cellW/2, offsetY+a.y*cellH+cellH/2); ctx.lineTo(offsetX+b.x*cellW+cellW/2, offsetY+b.y*cellH+cellH/2); }
      ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha=1;
    });
    players.forEach(p=>{
      if(!p.trail.length) return; const h=p.trail[p.trail.length-1];
      ctx.fillStyle=p.alive?p.light:p.deadColor; ctx.globalAlpha=p.alive?1:0.6;
      ctx.fillRect(offsetX+h.x*cellW+1, offsetY+h.y*cellH+1, cellW-2, cellH-2); ctx.globalAlpha=1;
      // cabeza con borde blanco si es player
      if(p.isPlayer && p.alive){ ctx.strokeStyle='#fff'; ctx.lineWidth=1; ctx.strokeRect(offsetX+h.x*cellW+1, offsetY+h.y*cellH+1, cellW-2, cellH-2); }
    });
    raf=requestAnimationFrame(loop);
  }

  checkPass().then(()=>{ renderUI(); });
  resetRound(1); state='menu'; renderUI(); raf=requestAnimationFrame(loop);
  container._cleanup=()=>{ cancelAnimationFrame(raf); clearInterval(watcher); ro.disconnect(); window.vrAd=0; };
}
