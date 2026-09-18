// games/banatron-royale/game.js - v1.3 - SNAKE STYLE - cabezas con ojos + escamas neón
export function init(container, args){
  const getCoins = args.getCoins||(()=>parseFloat(localStorage.getItem('wasa_coins')||'0'));
  const WORKER_URL = window.WASA_CONFIG?.WORKER_URL || 'https://games-wasa-worker.javimsites.workers.dev/';
  function getDeviceId(){ if(window.getDeviceId) return window.getDeviceId(); let id=localStorage.getItem('wasa_device_id'); if(!id){ id='dev_'+Math.random().toString(36).slice(2)+Date.now().toString(36); localStorage.setItem('wasa_device_id',id);} return id; }
  container.innerHTML = `<style>
.bt{width:100%;height:100%;position:relative;background:#0a0a1a;overflow:hidden;font-family:Inter,system-ui,sans-serif;touch-action:none;user-select:none}
.bt canvas{width:100%;height:100%;display:block;touch-action:none}
.bt-ui{position:absolute;inset:0;pointer-events:none}
.bt-ui button{pointer-events:auto}
.bt-hint{position:absolute;bottom:12px;left:50%;transform:translateX(-50%);background:rgba(168,85,247,.22);color:#e9d5ff;border:1px solid rgba(168,85,247,.35);border-radius:999px;padding:6px 14px;font-size:10px;font-weight:800;z-index:15}
  </style><div class="bt"><canvas id="c"></canvas><div id="ui" class="bt-ui"></div><div id="hint" class="bt-hint">🐍 SNAKE ROYALE • 4 serpientes desafiándose • VS</div></div>`;
  const wrap=container.querySelector('.bt'); const canvas=wrap.querySelector('#c'); const ctx=canvas.getContext('2d'); const ui=wrap.querySelector('#ui'); const hint=wrap.querySelector('#hint');
  let W=wrap.clientWidth,H=wrap.clientHeight; function resize(){W=wrap.clientWidth;H=wrap.clientHeight;const dpr=devicePixelRatio||1;canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0);} resize(); const ro=new ResizeObserver(resize); ro.observe(wrap);
  const COLS=64, ROWS=44; let cellW,cellH,offsetX,offsetY;
  function calcMetrics(){ const border=10; const availW=W-border*2, availH=H*0.88-border*2; cellW=Math.floor(availW/COLS); cellH=Math.floor(availH/ROWS); const cs=Math.min(cellW,cellH); cellW=cs; cellH=cs; offsetX=Math.floor((W - COLS*cs)/2); offsetY=Math.floor((H*0.88 - ROWS*cs)/2)+border; } calcMetrics();
  let state='menu'; let round=1; let grid, players=[], tick=0, roundStart=0, currentSessionId=null, isClaiming=false, _rewardPending=null, adClaimed=false, lastReward=0;
  const DIRS=[{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
  let hasPass=false, passChecked=false;
  function fmt(n){ const v=parseFloat(n)||0; return v.toFixed(7).replace(/0+$/,'').replace(/\.$/,''); }
  function baseReward(){ return 0.0003; }
  function rewardWithPass(kills){ return (0.0003 * kills) * (hasPass?5:1); }
  async function checkPass(){ if(passChecked) return hasPass; try{ const email=localStorage.getItem('wasa_email')||'', wallet=localStorage.getItem('wasa_wallet')||'', device_id=getDeviceId(); const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'check_pass', email, wallet, device_id})}); const j=await r.json(); if(j.ok && (j.has_pass||j.hasPass)){ hasPass=true; localStorage.setItem('wasa_pass_active','1'); } }catch{ hasPass = localStorage.getItem('wasa_pass_active')==='1'; } passChecked=true; return hasPass; }
  function newGrid(){ const g=[]; for(let y=0;y<ROWS;y++){ g[y]=Array(COLS).fill(0); } return g; }
  function canMove(x,y, g=grid){ if(x<0||x>=COLS||y<0||y>=ROWS) return false; return g[y][x]===0; }
  function floodFrom(sx,sy, g=grid, limit=1000){ if(!canMove(sx,sy,g)) return {count:0}; const visited=new Set(); const q=[[sx,sy]]; visited.add(sx+','+sy); let head=0; while(head<q.length && visited.size<limit){ const [x,y]=q[head++]; for(let d=0;d<4;d++){ const nx=x+DIRS[d].x, ny=y+DIRS[d].y; const key=nx+','+ny; if(nx<0||nx>=COLS||ny<0||ny>=ROWS) continue; if(visited.has(key)) continue; if(g[ny][nx]!==0) continue; visited.add(key); q.push([nx,ny]); } } return {count:visited.size}; }
  function voronoi(g, allPlayers){ const owners = Array.from({length:ROWS},()=>Array(COLS).fill(-1)); const dist = Array.from({length:ROWS},()=>Array(COLS).fill(Infinity)); const q=[]; allPlayers.forEach(p=>{ if(!p.alive) return; owners[p.y][p.x]=p.id; dist[p.y][p.x]=0; q.push([p.x,p.y,p.id,0]); }); let head=0; while(head<q.length){ const [x,y,owner,d]=q[head++]; for(let dir=0;dir<4;dir++){ const nx=x+DIRS[dir].x, ny=y+DIRS[dir].y; if(nx<0||nx>=COLS||ny<0||ny>=ROWS) continue; if(g[ny][nx]!==0) continue; if(dist[ny][nx]<=d+1) continue; dist[ny][nx]=d+1; owners[ny][nx]=owner; q.push([nx,ny,owner,d+1]); } } const counts={}; allPlayers.forEach(p=> counts[p.id]=0); for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++) if(owners[y][x]!==-1 && g[y][x]===0) counts[owners[y][x]]++; return counts; }
  function countExits(x,y,g=grid){ let c=0; for(let d=0;d<4;d++){ const nx=x+DIRS[d].x, ny=y+DIRS[d].y; if(canMove(nx,ny,g)) c++; } return c; }
  function smartChoose(p, allPlayers, g=grid){
    const cur=p.dir; let cands=[]; for(let d=0;d<4;d++){ if((d+2)%4===cur){ let hasOther=false; for(let dd=0;dd<4;dd++){ if(dd===d) continue; const tx=p.x+DIRS[dd].x, ty=p.y+DIRS[dd].y; if(canMove(tx,ty,g)) hasOther=true; } if(hasOther) continue; } const nx=p.x+DIRS[d].x, ny=p.y+DIRS[d].y; if(!canMove(nx,ny,g)) continue; cands.push(d); } if(cands.length===0) return cur; if(cands.length===1) return cands[0];
    let bestScore=-Infinity, bestDir=cands[0]; for(let nd of cands){ const nx=p.x+DIRS[nd].x, ny=p.y+DIRS[nd].y; const myFlood = floodFrom(nx,ny,g,1200); if(myFlood.count<3) continue; const exits = countExits(nx,ny,g); const simPlayers = allPlayers.map(pl=>{ if(pl.id===p.id) return {...pl, x:nx, y:ny}; return pl; }); const voro = voronoi(g, simPlayers); const myVoro = voro[p.id]||0; let nextExitsMin=Infinity, nextFloodMin=Infinity; for(let d2=0;d2<4;d2++){ if((d2+2)%4===nd) continue; const nnx=nx+DIRS[d2].x, nny=ny+DIRS[d2].y; if(!canMove(nnx,nny,g)) continue; const f2 = floodFrom(nnx,nny,g,300); nextFloodMin = Math.min(nextFloodMin, f2.count); const e2 = countExits(nnx,nny,g); nextExitsMin = Math.min(nextExitsMin, e2); } if(nextFloodMin===Infinity) nextFloodMin=0; if(nextExitsMin===Infinity) nextExitsMin=0; let score=0; score += myFlood.count * 2.5; score += myVoro * 3.0; score += exits * 18; score += nextExitsMin * 12; score += Math.min(nextFloodMin, 80); if(myFlood.count < 10) score -= 600; if(exits===0) score -= 4000; if(exits===1 && myFlood.count < 40) score -= 800; if(nextExitsMin===0) score -= 1000; const human = allPlayers.find(pl=>pl.isPlayer && pl.alive); if(human){ if(p.lastDirs && p.lastDirs.length>=2){ const last = p.trail[p.trail.length-1]; const prev = p.trail[p.trail.length-2]; if(prev){ const lastDir = (last.x - prev.x ===1)?1:(last.x-prev.x===-1)?3:(last.y-prev.y===1)?2:0; if(lastDir===nd) score += 6; } } } if(p.lastDirs && p.lastDirs.length>=3){ const [a,b,c]=p.lastDirs.slice(-3); if(a!==b && b!==c && a===c && c===nd) score -= 40; } const centerX=COLS/2, centerY=ROWS/2; const distCenter = Math.abs(nx - centerX) + Math.abs(ny - centerY); if(myFlood.count > 100) score -= distCenter * 0.15; if(score > bestScore){ bestScore=score; bestDir=nd; } } return bestDir;
  }
  async function startSession(lvl){ currentSessionId=null; try{ const email=localStorage.getItem('wasa_email'), wallet=localStorage.getItem('wasa_wallet'), device_id=getDeviceId(); const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start_game_session', email, wallet, device_id, game_slug:'banatron-royale', level:lvl})}); const j=await r.json(); if(j.ok){ currentSessionId=j.session_id; return j.session_id; } }catch{} return null; }
  async function claimSession(isDouble,adWatched,kills){ if(isClaiming) return {ok:false}; if(!currentSessionId) await startSession(round); if(!currentSessionId) return {ok:false, error:'sin sesion'}; isClaiming=true; try{ const email=localStorage.getItem('wasa_email'), wallet=localStorage.getItem('wasa_wallet'), device_id=getDeviceId(); const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'claim_reward', session_id:currentSessionId, email, wallet, device_id, game_slug:'banatron-royale', level:round, kills:kills, ad_watched:adWatched, double_reward:isDouble, time_taken:0})}); const j=await r.json(); if(j.ok){ const bal=j.wasa_balance??j.guest_balance??0; if(j.is_guest) localStorage.setItem('wasa_coins_guest',bal); else localStorage.setItem('wasa_coins',bal); if(window.setCoinsUI) window.setCoinsUI(bal); currentSessionId=null; isClaiming=false; return j; } else { isClaiming=false; return {ok:false, error:j.error}; } }catch(e){ isClaiming=false; return {ok:false}; } }
  function resetRound(r){ round=r; grid=newGrid(); players=[]; const configs=[ {x:Math.floor(COLS*0.18), y:Math.floor(ROWS*0.25), dir:1, color:'#22c55e', light:'#4ade80', glow:'#22c55e', deadColor:'#a7f3d0', name:'VERDE'}, {x:Math.floor(COLS*0.82), y:Math.floor(ROWS*0.25), dir:3, color:'#ef4444', light:'#f87171', glow:'#ef4444', deadColor:'#fda4af', name:'ROJO'}, {x:Math.floor(COLS*0.18), y:Math.floor(ROWS*0.75), dir:1, color:'#a78bfa', light:'#c4b5fd', glow:'#a78bfa', deadColor:'#ddd6fe', name:'LILA'}, {x:Math.floor(COLS*0.82), y:Math.floor(ROWS*0.75), dir:3, color:'#eab308', light:'#facc15', glow:'#eab308', deadColor:'#fde68a', name:'AMARILLA'}, ]; configs.forEach((c,i)=>{ const p={...c, id:i+1, alive:true, isPlayer:i===0, trail:[{x:c.x,y:c.y}], lastDirs:[]}; players.push(p); grid[c.y][c.x]=p.id; }); tick=0; roundStart=performance.now(); adClaimed=false; startSession(r); }
  function step(){ players.forEach(p=>{ if(!p.alive||p.isPlayer) return; const newDir = smartChoose(p, players, grid); if(p.lastDirs) { p.lastDirs.push(newDir); if(p.lastDirs.length>6) p.lastDirs.shift(); } p.dir=newDir; }); const nextPos=new Map(); players.forEach(p=>{ if(!p.alive) return; const nx=p.x+DIRS[p.dir].x, ny=p.y+DIRS[p.dir].y; const key=nx+','+ny; if(!nextPos.has(key)) nextPos.set(key,[]); nextPos.get(key).push(p); }); nextPos.forEach((list,key)=>{ if(list.length>1){ list.forEach(p=> p.alive=false); } }); players.forEach(p=>{ if(!p.alive) return; const nx=p.x+DIRS[p.dir].x, ny=p.y+DIRS[p.dir].y; if(!canMove(nx,ny)){ p.alive=false; return; } p.x=nx; p.y=ny; grid[ny][nx]=p.id; p.trail.push({x:nx,y:ny}); }); tick++; }
  function getAliveCount(){ return players.filter(p=>p.alive).length; } function getPlayerAlive(){ return players.find(p=>p.isPlayer)?.alive; } function getKills(){ return players.filter(p=>!p.isPlayer && !p.alive).length; } function openAd(t){ if(window.vrAd!==0) return; _rewardPending=t; window.vrAdType=t; window.vrAd=1; state='paused_ad'; renderUI(); }

  // === DIBUJO SERPIENTE ===
  function drawSnake(p){
    if(p.trail.length<1) return;
    const isDead = !p.alive;
    const alpha = isDead?0.5:1;
    ctx.globalAlpha = alpha;
    // cuerpo: segmentos con brillo neón y escamas
    for(let i=0;i<p.trail.length-1;i++){
      const a=p.trail[i], b=p.trail[i+1];
      const ax=offsetX+a.x*cellW+cellW/2, ay=offsetY+a.y*cellH+cellH/2;
      const bx=offsetX+b.x*cellW+cellW/2, by=offsetY+b.y*cellH+cellH/2;
      // glow exterior
      ctx.strokeStyle = isDead? p.deadColor : p.glow;
      ctx.lineWidth = cellW*0.9;
      ctx.globalAlpha = isDead?0.15:0.25;
      ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,by); ctx.stroke();
      // cuerpo principal
      ctx.strokeStyle = isDead? p.deadColor : p.color;
      ctx.lineWidth = Math.max(3, cellW*0.58);
      ctx.globalAlpha = isDead?0.45:1;
      ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,by); ctx.stroke();
      // escama central clara
      if(!isDead && i%2===0){
        ctx.strokeStyle = p.light;
        ctx.lineWidth = Math.max(1, cellW*0.18);
        ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.moveTo(ax,ay); ctx.lineTo(bx,by); ctx.stroke();
      }
    }
    ctx.globalAlpha = alpha;
    // cabeza
    const head = p.trail[p.trail.length-1];
    const hx=offsetX+head.x*cellW+cellW/2, hy=offsetY+head.y*cellH+cellH/2;
    const headRadius = cellW*0.75;
    // fondo cabeza
    ctx.fillStyle = isDead? p.deadColor : p.color;
    ctx.beginPath(); ctx.arc(hx,hy, headRadius, 0, Math.PI*2); ctx.fill();
    // borde neón
    if(!isDead){
      ctx.strokeStyle = p.light;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.shadowColor = p.glow; ctx.shadowBlur = 8;
      ctx.stroke(); ctx.shadowBlur=0;
    }
    if(isDead){
      // ojos X muertos
      ctx.strokeStyle='#4a044e'; ctx.lineWidth=1.5;
      const eyeOff = headRadius*0.35;
      // ojo izq X
      ctx.beginPath(); ctx.moveTo(hx-eyeOff-3, hy-3); ctx.lineTo(hx-eyeOff+3, hy+3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hx-eyeOff-3, hy+3); ctx.lineTo(hx-eyeOff+3, hy-3); ctx.stroke();
      // ojo der X
      ctx.beginPath(); ctx.moveTo(hx+eyeOff-3, hy-3); ctx.lineTo(hx+eyeOff+3, hy+3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hx+eyeOff-3, hy+3); ctx.lineTo(hx+eyeOff+3, hy-3); ctx.stroke();
    } else {
      // ojos vivos mirando hacia donde va
      const dir = p.dir;
      let eyeAngle1 = 0, eyeAngle2=0;
      if(dir===0){ eyeAngle1=-0.6; eyeAngle2=0.6; } // arriba
      else if(dir===1){ eyeAngle1=-0.4; eyeAngle2=0.4; } // derecha miran adelante
      else if(dir===2){ eyeAngle1=Math.PI-0.6; eyeAngle2=Math.PI+0.6; }
      else { eyeAngle1=Math.PI-0.4; eyeAngle2=Math.PI+0.4; }
      const eyeDist = headRadius*0.45;
      const eyeX1 = hx + Math.cos(dir===0?-0.8:dir===2?Math.PI+0.8:dir===1?0.2:Math.PI-0.2)*eyeDist;
      const eyeY1 = hy + Math.sin(dir===0?-0.8:dir===2?Math.PI+0.8:dir===1?0.2:Math.PI-0.2)*eyeDist;
      // simplificado: dos ojos blancos adelante
      const fwd = DIRS[dir];
      const eyeBaseX = hx + fwd.x*headRadius*0.35;
      const eyeBaseY = hy + fwd.y*headRadius*0.35;
      const perpX = -fwd.y, perpY = fwd.x;
      // ojo izq
      ctx.fillStyle='white';
      ctx.beginPath(); ctx.arc(eyeBaseX + perpX*headRadius*0.3, eyeBaseY + perpY*headRadius*0.3, headRadius*0.28, 0, Math.PI*2); ctx.fill();
      // ojo der
      ctx.beginPath(); ctx.arc(eyeBaseX - perpX*headRadius*0.3, eyeBaseY - perpY*headRadius*0.3, headRadius*0.28, 0, Math.PI*2); ctx.fill();
      // pupilas negras mirando al frente
      ctx.fillStyle='black';
      ctx.beginPath(); ctx.arc(eyeBaseX + perpX*headRadius*0.3 + fwd.x*2, eyeBaseY + perpY*headRadius*0.3 + fwd.y*2, headRadius*0.12, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(eyeBaseX - perpX*headRadius*0.3 + fwd.x*2, eyeBaseY - perpY*headRadius*0.3 + fwd.y*2, headRadius*0.12, 0, Math.PI*2); ctx.fill();
      // brillo pupila
      ctx.fillStyle='white';
      ctx.beginPath(); ctx.arc(eyeBaseX + perpX*headRadius*0.3 + fwd.x*2 +1, eyeBaseY + perpY*headRadius*0.3 + fwd.y*2 -1, headRadius*0.05, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(eyeBaseX - perpX*headRadius*0.3 + fwd.x*2 +1, eyeBaseY - perpY*headRadius*0.3 + fwd.y*2 -1, headRadius*0.05, 0, Math.PI*2); ctx.fill();
      // lengua si va ganando
      if(tick%20<4){
        ctx.strokeStyle='#ff4d6d'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(hx + fwd.x*headRadius*0.9, hy + fwd.y*headRadius*0.9);
        ctx.lineTo(hx + fwd.x*headRadius*1.4 + perpX*2, hy + fwd.y*headRadius*1.4 + perpY*2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(hx + fwd.x*headRadius*0.9, hy + fwd.y*headRadius*0.9);
        ctx.lineTo(hx + fwd.x*headRadius*1.4 - perpX*2, hy + fwd.y*headRadius*1.4 - perpY*2); ctx.stroke();
      }
    }
    ctx.globalAlpha=1;
  }

  function renderUI(){
    const coins=getCoins();
    if(state==='menu'){
      const basePass=rewardWithPass(3);
      ui.innerHTML=`<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%, rgba(168,85,247,.25), transparent 60%), linear-gradient(180deg,#0a0a1a,#1a0a2e);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14px;text-align:center">
        <div style="font-size:10px;letter-spacing:.3em;color:#c084fc">🐍 SNAKE STYLE v1.3 • CABEZAS CON OJOS • ${hasPass?'PASS X5 💎':''}</div>
        <div style="margin-top:6px;font-size:34px;font-weight:900;color:white">BANANA<span style="color:#22c55e">TRON</span> <span style="color:#c084fc">ROYALE</span></div>
        <div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap;justify-content:center"><span style="font-size:18px">🐍</span><span style="background:#22c55e;color:#000;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:900">VERDE TU</span><span style="background:#ef4444;color:#fff;padding:2px 8px;border-radius:999px;font-size:10px">🔴 ROJA</span><span style="background:#a78bfa;color:#000;padding:2px 8px;border-radius:999px;font-size:10px">🟣 LILA</span><span style="background:#eab308;color:#000;padding:2px 8px;border-radius:999px;font-size:10px">🟡 AMARILLA</span></div>
        <div style="margin-top:8px;color:#e9d5ff;font-size:11px">Ahora son serpientes con cabeza • Ojos que miran • VS en el centro</div>
        <div style="margin-top:4px;color:#64748b;font-size:10px">Gana hasta ${fmt(basePass)} WASA ${hasPass?'💎 X5':''}</div>
        <div style="margin-top:14px;width:100%;max-width:300px"><button id="play" style="width:100%;background:linear-gradient(135deg,#c084fc,#7e22ce);color:#fff;font-weight:900;padding:14px;border-radius:999px;border:0;cursor:pointer">🐍 JUGAR SNAKE ROYALE ${hasPass?'💎 X5':''}</button></div>
      </div>`;
      ui.querySelector('#play').onclick=()=>{ resetRound(1); state='playing'; renderUI(); };
      if(hint) hint.classList.add('hide');
    }else if(state==='playing'){
      const alive=getAliveCount(); const kills=getKills(); const elapsed=((performance.now()-roundStart)/1000).toFixed(1); const currentReward = rewardWithPass(kills);
      ui.innerHTML=`<div style="position:absolute;top:6px;left:8px;right:8px;display:flex;justify-content:space-between;font-size:10px;color:white;font-family:monospace"><div style="color:#c084fc">🐍 ${alive} VIVAS • ${kills}/3 • ${elapsed}s • ${fmt(currentReward)} ${hasPass?'💎':''}</div><div style="color:#22c55e">${fmt(coins)} $WASA</div></div>`;
      if(hint){ hint.classList.remove('hide'); const p=players.find(pl=>pl.isPlayer); if(p) hint.textContent = (p.dir===0||p.dir===2) ? '🐍 Desliza ↔️ • '+alive+' serpientes' : '🐍 Desliza ↕️ • '+alive+' serpientes'; }
    }else if(state==='roundover'){
      const playerAlive=getPlayerAlive(); const kills=getKills(); const isWin=playerAlive && kills===3; const reward=rewardWithPass(kills); const rewardX2=reward*2; lastReward=reward;
      ui.innerHTML=`<div style="position:absolute;inset:0;background:rgba(10,10,26,.88);display:flex;align-items:center;justify-content:center;padding:12px"><div style="background:#1a1030;border:2px solid ${isWin?'#c084fc':'#ef4444'};border-radius:16px;padding:16px;width:100%;max-width:340px;text-align:center">
        <div style="font-size:32px">${isWin?'👑🐍':playerAlive?'😅':'💀'}</div><div style="font-size:12px;letter-spacing:.2em;color:${isWin?'#c084fc':playerAlive?'#22c55e':'#ef4444'};margin-top:4px">${isWin?'VICTORIA SNAKE ROYALE!':playerAlive?'SOBREVIVISTE':'TE COMIERON'}</div><div style="color:white;font-weight:900;margin-top:6px">Matastes ${kills}/3 serpientes</div><div style="margin-top:8px;background:rgba(0,0,0,.4);border-radius:10px;padding:8px;font-size:11px;color:#e9d5ff"><div style="display:flex;justify-content:space-between"><span>Kills</span><span>${kills}/3</span></div><div style="display:flex;justify-content:space-between;font-weight:800;color:${hasPass?'#c084fc':'#22c55e'};margin-top:4px"><span>Reward ${hasPass?'💎 X5':''}</span><span>${fmt(reward)} WASA</span></div><div style="display:flex;justify-content:space-between;font-size:10px;opacity:.7"><span>Con AD X2 ${hasPass?'💎 X10':''}</span><span>${fmt(rewardX2)}</span></div></div><div style="margin-top:12px;display:flex;flex-direction:column;gap:8px">${kills>0 && !adClaimed?`<button id="dbl" style="background:linear-gradient(135deg,#c084fc,#7e22ce);color:#fff;font-weight:900;padding:12px;border-radius:999px;border:0">📺 X2 = ${fmt(rewardX2)} ${hasPass?'💎 X10':''}</button>`:''}<button id="claim" style="background:${isWin?'linear-gradient(135deg,#c084fc,#7e22ce)':'#fff'};color:${isWin?'#fff':'#000'};font-weight:900;padding:12px;border-radius:999px;border:0">${kills>0?`COBRAR ${fmt(reward)} WASA ${hasPass?'💎':''}`:'REINTENTAR SNAKE'}</button><button id="menu" style="background:rgba(168,85,247,.12);color:#c084fc;padding:10px;border-radius:999px;border:1px solid rgba(168,85,247,.2)">MENU</button></div></div></div>`;
      ui.querySelector('#dbl')?.addEventListener('click',()=>{ openAd('double'); });
      ui.querySelector('#claim').onclick=async()=>{ const btn=ui.querySelector('#claim'); if(btn){ btn.textContent='⏳ VALIDANDO SERVER...'; btn.disabled=true; } if(kills===0){ resetRound(1); state='playing'; renderUI(); return; } const res=await claimSession(false,false,kills); if(res.ok){ resetRound(1); state='playing'; renderUI(); } else { if(btn){ btn.textContent='REINTENTAR: '+(res.error||''); btn.disabled=false; } } };
      ui.querySelector('#menu').onclick=()=>{ state='menu'; renderUI(); }; if(hint) hint.classList.add('hide');
    }else if(state==='paused_ad'){ ui.innerHTML=`<div style="position:absolute;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;color:white">Cargando ad...</div>`; }
    else if(state==='reward_modal'){ const kills=getKills(); const rew=rewardWithPass(kills)*2; ui.innerHTML=`<div style="position:absolute;inset:0;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:12px"><div style="background:#1a1030;border:1px solid #c084fc;border-radius:12px;padding:14px;width:100%;max-width:280px;text-align:center"><div style="color:#c084fc;font-weight:900">🐍 X2 SNAKE ROYALE! ${hasPass?'💎 X10':''}</div><div style="color:white;font-size:13px;margin-top:6px">${fmt(lastReward)} → ${fmt(rew)} WASA</div><button id="claim2" style="margin-top:10px;width:100%;background:#c084fc;color:#000;font-weight:900;padding:12px;border-radius:999px;border:0">RECLAMAR ${fmt(rew)} 💎</button></div></div>`; ui.querySelector('#claim2').onclick=async()=>{ const btn=ui.querySelector('#claim2'); if(btn){ btn.textContent='⏳ VALIDANDO...'; btn.disabled=true; } adClaimed=true; const res=await claimSession(true,true,kills); if(res.ok){ resetRound(1); state='playing'; renderUI(); } }; }
  }
  let touchStartX=0, touchStartY=0; const SWIPE_TH=18;
  function handleSwipe(dx,dy){ const p=players.find(pl=>pl.isPlayer); if(!p||!p.alive||state!=='playing') return false; if(p.dir===0||p.dir===2){ if(Math.abs(dx)>Math.abs(dy) && Math.abs(dx)>SWIPE_TH){ if(dx>0 && p.dir!==3) p.dir=1; else if(dx<0 && p.dir!==1) p.dir=3; return true; } } else { if(Math.abs(dy)>Math.abs(dx) && Math.abs(dy)>SWIPE_TH){ if(dy>0 && p.dir!==0) p.dir=2; else if(dy<0 && p.dir!==2) p.dir=0; return true; } } return false; }
  wrap.addEventListener('touchstart',e=>{ if(e.touches.length!==1) return; touchStartX=e.touches[0].clientX; touchStartY=e.touches[0].clientY; },{passive:true});
  wrap.addEventListener('touchmove',e=>{ if(state!=='playing') return; const curX=e.touches[0].clientX, curY=e.touches[0].clientY; const dx=curX-touchStartX, dy=curY-touchStartY; if(handleSwipe(dx,dy)){ touchStartX=curX; touchStartY=curY; } },{passive:true});
  wrap.addEventListener('touchend',e=>{ const endX=e.changedTouches[0].clientX, endY=e.changedTouches[0].clientY; handleSwipe(endX-touchStartX, endY-touchStartY); touchStartX=0; },{passive:true});
  addEventListener('keydown',e=>{ const p=players.find(pl=>pl.isPlayer); if(!p||state!=='playing') return; if((e.key==='ArrowUp'||e.key==='w') && p.dir!==2) p.dir=0; if((e.key==='ArrowRight'||e.key==='d') && p.dir!==3) p.dir=1; if((e.key==='ArrowDown'||e.key==='s') && p.dir!==0) p.dir=2; if((e.key==='ArrowLeft'||e.key==='a') && p.dir!==1) p.dir=3; });
  let watcher=setInterval(()=>{ if(window.vrAd===4 && _rewardPending && state!=='reward_modal'){ state='reward_modal'; renderUI(); } },150);
  let raf,acc=0,last=performance.now(); function getInterval(){ return 90; }
  function loop(now){
    if(window.vrAd===1||window.vrAd===2||window.vrAd===3){ raf=requestAnimationFrame(loop); return; }
    const dt=Math.min((now-last)/1000,0.033); last=now; acc+=dt*1000;
    if(state==='playing'){ if(acc>=getInterval()){ acc=0; step(); if(getAliveCount()<=1 || !getPlayerAlive()){ state='roundover'; renderUI(); } } }
    calcMetrics(); 
    // fondo
    ctx.fillStyle='#120a2a'; ctx.fillRect(0,0,W,H); 
    // VS central sutil
    if(state==='playing' && getAliveCount()>1){
      ctx.fillStyle='rgba(234,179,8,0.08)'; ctx.font=`900 ${Math.min(W,H)*0.18}px Inter`; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('VS', W/2, H*0.44);
    }
    ctx.strokeStyle='#4c1d95'; ctx.lineWidth=2; ctx.strokeRect(offsetX-2,offsetY-2,COLS*cellW+4,ROWS*cellH+4);
    ctx.strokeStyle='rgba(168,85,247,0.06)'; ctx.lineWidth=0.5;
    for(let x=0;x<=COLS;x++){ ctx.beginPath(); ctx.moveTo(offsetX+x*cellW, offsetY); ctx.lineTo(offsetX+x*cellW, offsetY+ROWS*cellH); ctx.stroke(); }
    for(let y=0;y<=ROWS;y++){ ctx.beginPath(); ctx.moveTo(offsetX, offsetY+y*cellH); ctx.lineTo(offsetX+COLS*cellW, offsetY+y*cellH); ctx.stroke(); }
    // dibujar serpientes (orden: muertas primero, vivas despues para que queden arriba)
    const sorted = [...players].sort((a,b)=> (a.alive===b.alive?0:a.alive?1:-1));
    sorted.forEach(p=> drawSnake(p));
    raf=requestAnimationFrame(loop);
  }
  checkPass().then(()=>{ renderUI(); }); resetRound(1); state='menu'; renderUI(); raf=requestAnimationFrame(loop);
  container._cleanup=()=>{ cancelAnimationFrame(raf); clearInterval(watcher); ro.disconnect(); window.vrAd=0; };
}
