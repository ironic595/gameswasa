// games/puzzle-bubble/game.js - v2 FINAL - 0,01 por nivel + X2 AD = 0,02 + TECHO QUE BAJA cada 25s/8 shots - SECURE like banatron
export function init(container, args){
  const WORKER_URL = window.WASA_CONFIG?.WORKER_URL || 'https://games-wasa-worker.javimsites.workers.dev/';
  function getDeviceId(){ if(window.getDeviceId) return window.getDeviceId(); let id=localStorage.getItem('wasa_device_id'); if(!id){ id='dev_'+Math.random().toString(36).slice(2)+Date.now().toString(36); localStorage.setItem('wasa_device_id',id);} return id; }
  function fmt(n){ const v=parseFloat(n)||0; if(v===0) return '0'; return (Math.round(v*1000000)/1000000).toFixed(6).replace(/0+$/,'').replace(/\.$/,''); }
  function getCoins(){ return window.getCoins? window.getCoins() : parseFloat(localStorage.getItem('wasa_coins')||'0'); }

  container.innerHTML=`<style>
.pb{width:100%;height:100%;min-height:100%;position:relative;background:radial-gradient(ellipse at 50% 0%, rgba(56,189,248,.18), transparent 60%), linear-gradient(180deg,#020617 0%,#0f172a 60%,#1e1b4b 100%);font-family:Inter,system-ui;overflow:hidden;display:flex;flex-direction:column}
.pb-top{flex-shrink:0;display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:rgba(15,23,42,.88);backdrop-filter:blur(12px);border-bottom:1px solid rgba(56,189,248,.15);gap:8px;flex-wrap:wrap;color:#e2e8f0;z-index:5}
.pb-pill{border:1px solid rgba(56,189,248,.2);border-radius:20px;padding:5px 10px;font-size:10px;background:rgba(15,23,42,.6);cursor:pointer;font-weight:700;color:#e2e8f0;white-space:nowrap}
.pb-pill.yellow{background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#000;border-color:transparent;font-weight:800}
.pb-pill.red{background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;border-color:transparent;animation:pulse 1s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.7}}
.pb-body{flex:1;display:flex;align-items:center;justify-content:center;gap:20px;padding:12px;overflow:hidden;width:100%;max-width:1200px;margin:0 auto;min-height:0}
.pb-left{flex:0 0 420px;width:420px;height:100%;max-height:720px;display:flex;flex-direction:column;background:linear-gradient(180deg,#0f172a,#020617);border:2px solid rgba(56,189,248,.2);border-radius:18px;box-shadow:0 12px 32px rgba(0,0,0,.5);overflow:hidden;position:relative}
.pb-ceiling{height:28px;background:linear-gradient(180deg,#334155,#1e293b);border-bottom:2px solid #475569;display:flex;align-items:center;justify-content:space-between;padding:0 10px;font-size:10px;font-weight:800;color:#e2e8f0;transition:transform.5s ease}
.pb-ceiling.danger{background:linear-gradient(180deg,#ef4444,#dc2626);animation:pulse 0.8s infinite}
.pb-ceiling-bar{height:4px;background:rgba(0,0,0,.4);position:relative;overflow:hidden}
.pb-ceiling-progress{height:100%;background:linear-gradient(90deg,#38bdf8,#fbbf24);transition:width 1s linear}
.pb-canvas{width:100%;flex:1;display:block;touch-action:none;cursor:crosshair}
.pb-right{flex:1;max-width:360px;display:flex;flex-direction:column;gap:12px;color:#e2e8f0}
.pb-stats{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.pb-stat{background:rgba(15,23,42,.7);border:1px solid rgba(56,189,248,.15);border-radius:12px;padding:10px 12px}
.pb-stat b{font-family:JetBrains Mono;font-size:16px;display:block;color:#f8fafc}.pb-stat span{font-size:9px;opacity:.6;text-transform:uppercase}
.pb-ctrl{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}
.pb-btn{padding:12px;border-radius:12px;font-weight:800;font-size:11px;text-transform:uppercase;cursor:pointer;border:1px solid rgba(56,189,248,.2);background:#0f172a;color:#e2e8f0;transition:.15s}
.pb-btn:active{transform:scale(.96)}.pb-btn.primary{background:linear-gradient(135deg,#38bdf8,#818cf8);color:#0f172a;border-color:transparent}
.pb-btn.shoot{background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#000;border-color:transparent;font-size:14px;grid-column: span 3}
@media(max-width:900px){.pb-body{flex-direction:column;align-items:stretch;justify-content:flex-start;gap:12px;padding:8px}.pb-left{flex:0 0 68vh;width:100%;height:68vh;max-height:68vh}.pb-right{max-width:100%}}
.pb-win{position:absolute;inset:0;background:rgba(3,6,16,.88);backdrop-filter:blur(18px);display:grid;place-items:center;z-index:20}
.pb-win-card{background:linear-gradient(180deg,rgba(15,23,42,.96),rgba(3,6,16,.98));border:1px solid rgba(56,189,248,.26);border-radius:22px;padding:24px;text-align:center;width:min(360px,92vw);color:#e2e8f0;box-shadow:0 24px 80px rgba(0,0,0,.6)}
.pb-win-amount{background:linear-gradient(135deg,rgba(34,197,94,.15),rgba(34,197,94,.08));border:1px solid rgba(34,197,94,.3);border-radius:14px;padding:12px;margin:12px 0;font-weight:800;color:#22c55e}
.pb-win-btn{width:100%;padding:12px;border-radius:14px;font-weight:800;font-size:11px;text-transform:uppercase;cursor:pointer;border:1px solid rgba(56,189,248,.2);margin-top:8px}
.pb-win-btn.x2{background:linear-gradient(135deg,#fbbf24,#f59e0b 55%,#d97706);color:#000;box-shadow:0 0 22px rgba(251,191,36,.4)}
.pb-win-btn.secondary{background:linear-gradient(135deg,#38bdf8,#818cf8);color:#0f172a}.pb-win-btn.ghost{background:rgba(15,23,42,.7);color:#94a3b8}
  </style><div class="pb" id="pbRoot"><div class="pb-top"><div style="font-weight:800;font-size:11px;letter-spacing:.1em">🫧 PUZZLE BUBBLE • TECHO BAJA + 0,01/NIVEL + X2 AD</div><div style="display:flex;gap:5px"><button class="pb-pill yellow" id="pbStats">LVL 1</button><button class="pb-pill" id="pbTimer">TECHO: 25s</button><button class="pb-pill" id="pbNew">↻ NUEVO</button></div></div><div class="pb-body"><div class="pb-left"><div class="pb-ceiling" id="pbCeiling"><span>▼ TECHO ▼</span><span id="pbCeilText">BAJA EN 25s</span><span>▼ TECHO ▼</span></div><div class="pb-ceiling-bar"><div class="pb-ceiling-progress" id="pbCeilProg" style="width:0%"></div></div><canvas class="pb-canvas" id="pbCanvas"></canvas></div><div class="pb-right"><div class="pb-stats"><div class="pb-stat"><b id="pbScore">0</b><span>SCORE</span></div><div class="pb-stat"><b id="pbLevel">1</b><span>NIVEL</span></div><div class="pb-stat"><b id="pbReward">+0.000000</b><span>WASA TOTAL</span></div><div class="pb-stat"><b id="pbShots">0/8</b><span>TIROS P/BAJADA</span></div></div><div class="pb-ctrl"><button class="pb-btn" id="pbLeft">◀</button><button class="pb-btn" id="pbUp">▲ CENTRAR</button><button class="pb-btn" id="pbRight">▶</button><button class="pb-btn shoot" id="pbShoot">🎯 DISPARAR [ESPACIO]</button></div><div style="font-size:11px;line-height:1.5;color:#94a3b8;background:rgba(15,23,42,.5);border:1px solid rgba(56,189,248,.1);border-radius:12px;padding:12px"><b>Techo descendente:</b> Como el original, el techo baja cada <b>25s o 8 tiros</b> y agrega una fila nueva. ¡No dejes que toquen la línea roja!<br><br><b>Economía:</b> 0,01 WASA por nivel + X2 con ad = 0,02 (server valida como banatron)</div></div></div><div id="pbUI"></div></div>`;

  const root=container.querySelector('#pbRoot'); const canvas=root.querySelector('#pbCanvas'); const ctx=canvas.getContext('2d'); const ui=root.querySelector('#pbUI');
  const COLS=8, ROWS=14, R=20; const COLORS=['#ef4444','#3b82f6','#22c55e','#eab308','#a855f7'];
  let grid=[], score=0, level=1, best=parseInt(localStorage.getItem('pb_best')||'0'), totalReward=0, currentColor=0, nextColor=0, shooterAngle=-Math.PI/2, bubbleX=0, bubbleY=0, isShooting=false, particles=[], shotCount=0, ceilingTimer=25, ceilingInterval=null, ceilingOffset=0;
  const BASE_REWARD=0.01;
  let currentSessionId=null, isClaiming=false, _rewardPending=null;

  function resize(){ const dpr=devicePixelRatio||1; const rect=root.querySelector('.pb-left').getBoundingClientRect(); const ch=rect.height-32-4; canvas.width=rect.width*dpr; canvas.height=ch*dpr; canvas.style.width=rect.width+'px'; canvas.style.height=ch+'px'; ctx.setTransform(dpr,0,0,dpr,0,0); bubbleX=rect.width/2; bubbleY=ch-40; }
  const ro=new ResizeObserver(resize); ro.observe(root.querySelector('.pb-left')); resize();

  async function startSession(){ currentSessionId=null; try{ const email=localStorage.getItem('wasa_email'); const wallet=localStorage.getItem('wasa_wallet'); const device_id=getDeviceId(); const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start_game_session', email, wallet, device_id, game_slug:'puzzle-bubble', level})}); const j=await r.json(); if(j.ok){ currentSessionId=j.session_id; return j.session_id; } }catch(e){} return null; }
  async function claimSession(isDouble,adWatched){
    if(isClaiming) return {ok:false}; if(!currentSessionId) await startSession();
    if(!currentSessionId) return {ok:false, error:'sin sesion'}; isClaiming=true;
    try{ const email=localStorage.getItem('wasa_email'); const wallet=localStorage.getItem('wasa_wallet'); const device_id=getDeviceId();
      const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'claim_reward', session_id:currentSessionId, email, wallet, device_id, game_slug:'puzzle-bubble', level, ad_watched:adWatched, double_reward:isDouble, time_taken:30})});
      const j=await r.json(); if(j.ok){ const bal=j.wasa_balance??j.guest_balance??0; if(j.is_guest){ localStorage.setItem('wasa_coins_guest',bal); localStorage.setItem('wasa_coins','0'); } else{ localStorage.setItem('wasa_coins',bal);} if(typeof window.setCoinsUI==='function') window.setCoinsUI(bal); currentSessionId=null; isClaiming=false; return j; } else{ isClaiming=false; return {ok:false, error:j.error}; }
    }catch(e){ isClaiming=false; return {ok:false}; }
  }
  function openAd(type){ if(window.vrAd!==0) return; _rewardPending=type; window.vrAdType=type; window.vrAd=1; ui.innerHTML=`<div style="position:absolute;inset:0;background:rgba(0,0,0,.6);display:grid;place-items:center;z-index:20;color:white">Cargando ad para ${fmt(BASE_REWARD)} WASA... vrAd=${window.vrAd}</div>`; }

  function initGrid(){
    grid=[]; for(let r=0;r<ROWS;r++){ grid[r]=[]; for(let c=0;c<COLS;c++){ if(r<5){ grid[r][c]=Math.floor(Math.random()*COLORS.length); } else grid[r][c]=-1; } }
    score=0; level=parseInt(localStorage.getItem('pb_level')||'1'); shotCount=0; ceilingOffset=0; ceilingTimer=25;
    currentColor=Math.floor(Math.random()*COLORS.length); nextColor=Math.floor(Math.random()*COLORS.length); shooterAngle=-Math.PI/2; isShooting=false; particles=[]; startSession(); renderStats(); startCeilingTimer();
  }

  function startCeilingTimer(){
    if(ceilingInterval) clearInterval(ceilingInterval);
    ceilingTimer=25;
    ceilingInterval=setInterval(()=>{ ceilingTimer--; updateCeilingUI(); if(ceilingTimer<=0){ pushCeiling(); ceilingTimer=25; } },1000);
  }

  function updateCeilingUI(){
    const el=root.querySelector('#pbTimer'); const txt=root.querySelector('#pbCeilText'); const prog=root.querySelector('#pbCeilProg'); const ceilEl=root.querySelector('#pbCeiling');
    if(el) el.textContent='TECHO: '+ceilingTimer+'s';
    if(txt) txt.textContent='BAJA EN '+ceilingTimer+'s';
    if(prog) prog.style.width=((25-ceilingTimer)/25*100)+'%';
    if(ceilEl){ if(ceilingTimer<=5) ceilEl.classList.add('danger'); else ceilEl.classList.remove('danger'); }
    root.querySelector('#pbShots').textContent=shotCount+'/8';
  }

  function pushCeiling(){
    // Empuja todo una fila abajo y agrega fila nueva arriba (como original)
    for(let r=ROWS-1;r>0;r--){ for(let c=0;c<COLS;c++) grid[r][c]=grid[r-1][c]; }
    for(let c=0;c<COLS;c++) grid[0][c]=Math.floor(Math.random()*COLORS.length);
    ceilingOffset++;
    // efecto visual: techo tiembla
    const ceilEl=root.querySelector('#pbCeiling'); ceilEl.style.transform='translateY(4px)'; setTimeout(()=>ceilEl.style.transform='translateY(0)',200);
    // check lose
    const w=canvas.width/(devicePixelRatio||1), h=canvas.height/(devicePixelRatio||1);
    for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) if(grid[r][c]!==-1){ const pos=hexPos(r,c,w,h); if(pos.y>h-100){ showLose(); return; } }
    if(navigator.vibrate) navigator.vibrate([30,20,30]);
    shotCount=0; updateCeilingUI();
  }

  function hexPos(r,c,w,h){ const xOff=(r%2===1)?R:0; return {x: xOff + c*(R*2) + R + 8, y: r*(R*1.72) + R + 8 + ceilingOffset*4}; }

  function draw(){
    const w=canvas.width/(devicePixelRatio||1), h=canvas.height/(devicePixelRatio||1);
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle='rgba(15,23,42,.3)'; ctx.fillRect(0,0,w,h);
    // danger line
    ctx.strokeStyle='rgba(239,68,68,.6)'; ctx.setLineDash([6,6]); ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0,h-100); ctx.lineTo(w,h-100); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle='rgba(239,68,68,.15)'; ctx.fillRect(0,h-100,w,100);
    // bubbles
    for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){ const col=grid[r][c]; if(col===-1) continue; const pos=hexPos(r,c,w,h); if(pos.y<h-10) drawBubble(pos.x,pos.y,R-2,COLORS[col],false); }
    if(!isShooting){ drawBubble(bubbleX,bubbleY,R,COLORS[currentColor],true); drawCannon(bubbleX,bubbleY,shooterAngle); drawTrajectory(w,h); }
    particles.forEach(p=>{ ctx.globalAlpha=p.a; ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1; });
    // next preview
    ctx.fillStyle='rgba(0,0,0,.5)'; ctx.fillRect(w-66,8,56,56); ctx.fillStyle='#94a3b8'; ctx.font='800 8px Inter'; ctx.fillText('NEXT',w-54,18); drawBubble(w-38,40,R-4,COLORS[nextColor],false);
  }

  function drawBubble(x,y,r,color,gloss){ ctx.fillStyle=color; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); if(gloss){ const grad=ctx.createRadialGradient(x-r*0.3,y-r*0.3,r*0.2,x,y,r); grad.addColorStop(0,'rgba(255,255,255,.85)'); grad.addColorStop(1,'rgba(255,255,255,0)'); ctx.fillStyle=grad; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); } ctx.strokeStyle='rgba(0,0,0,.25)'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.stroke(); }
  function drawCannon(x,y,ang){ ctx.save(); ctx.translate(x,y); ctx.rotate(ang+Math.PI/2); ctx.fillStyle='#334155'; ctx.fillRect(-8,-28,16,28); ctx.fillStyle='#475569'; ctx.fillRect(-12,-6,24,12); ctx.restore(); }
  function drawTrajectory(w,h){
    let tx=bubbleX, ty=bubbleY, ang=shooterAngle, bounces=0;
    ctx.strokeStyle='rgba(56,189,248,.35)'; ctx.setLineDash([4,6]); ctx.beginPath(); ctx.moveTo(tx,ty);
    for(let i=0;i<280;i++){ tx+=Math.cos(ang)*6; ty+=Math.sin(ang)*6; if(tx<R || tx>w-R){ ang=Math.PI-ang; bounces++; if(bounces>2) break; } if(ty<0) break; if(i%8===0) ctx.lineTo(tx,ty); }
    ctx.stroke(); ctx.setLineDash([]);
    const snap=findSnap(tx,ty,w,h); if(snap){ ctx.globalAlpha=0.35; drawBubble(snap.x,snap.y,R-2,COLORS[currentColor],false); ctx.globalAlpha=1; }
  }
  function findSnap(x,y,w,h){
    let best=null, bestD=9999;
    for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){ if(grid[r][c]!==-1) continue; const pos=hexPos(r,c,w,h); const d=Math.hypot(x-pos.x,y-pos.y); if(d<bestD && d<R*1.6){ bestD=d; best={...pos,r,c}; } }
    if(!best){ for(let c=0;c<COLS;c++){ const pos=hexPos(0,c,w,h); const d=Math.hypot(x-pos.x,y-pos.y); if(d<bestD){ bestD=d; best={...pos,r:0,c}; } } }
    return best;
  }
  function shoot(){
    if(isShooting) return; isShooting=true;
    const w=canvas.width/(devicePixelRatio||1), h=canvas.height/(devicePixelRatio||1);
    let tx=bubbleX, ty=bubbleY, ang=shooterAngle;
    const speed=12;
    const anim=()=>{
      tx+=Math.cos(ang)*speed; ty+=Math.sin(ang)*speed;
      if(tx<R || tx>w-R) ang=Math.PI-ang;
      for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){ if(grid[r][c]===-1) continue; const pos=hexPos(r,c,w,h); if(Math.hypot(tx-pos.x,ty-pos.y)<R*1.8){ placeBubble(tx,ty,w,h); return; } }
      if(ty<R){ placeBubble(tx,ty,w,h); return; }
      if(ty>h){ isShooting=false; draw(); return; }
      draw(); drawBubble(tx,ty,R,COLORS[currentColor],true);
      requestAnimationFrame(anim);
    }; anim();
  }
  function placeBubble(x,y,w,h){
    const snap=findSnap(x,y,w,h); if(!snap){ isShooting=false; return; }
    grid[snap.r][snap.c]=currentColor;
    const placedColor=currentColor;
    currentColor=nextColor; nextColor=Math.floor(Math.random()*COLORS.length);
    isShooting=false; shotCount++; if(shotCount>=8){ pushCeiling(); ceilingTimer=25; shotCount=0; }
    const connected=getConnected(snap.r,snap.c);
    if(connected.length>=3){
      connected.forEach(({r,c})=>{ const pos=hexPos(r,c,w,h); for(let i=0;i<8;i++) particles.push({x:pos.x,y:pos.y,r:Math.random()*4+1,color:COLORS[grid[r][c]],a:1,vx:(Math.random()-0.5)*8,vy:(Math.random()-0.5)*8}); grid[r][c]=-1; });
      score+=connected.length*15;
      setTimeout(()=>{ const floating=getFloating(); floating.forEach(({r,c})=>{ const pos=hexPos(r,c,w,h); for(let i=0;i<6;i++) particles.push({x:pos.x,y:pos.y,r:Math.random()*4+1,color:COLORS[grid[r][c]],a:1,vx:(Math.random()-0.5)*6,vy:(Math.random()-0.5)*6}); grid[r][c]=-1; score+=8; }); checkWinLose(w,h); },140);
    } else { checkWinLose(w,h); }
    renderStats(); draw(); updateCeilingUI();
  }
  function getConnected(sr,sc){
    const color=grid[sr][sc]; if(color===-1) return []; const visited=new Set(); const q=[[sr,sc]]; visited.add(sr+','+sc); let head=0;
    while(head<q.length){ const [r,c]=q[head++]; for(let [nr,nc] of getNeighbors(r,c)){ if(nr<0||nr>=ROWS||nc<0||nc>=COLS) continue; if(grid[nr][nc]!==color) continue; const key=nr+','+nc; if(visited.has(key)) continue; visited.add(key); q.push([nr,nc]); } }
    return Array.from(visited).map(k=>{ const [r,c]=k.split(',').map(Number); return {r,c}; });
  }
  function getNeighbors(r,c){ return r%2===0? [[-1,-1],[-1,0],[0,-1],[0,1],[1,-1],[1,0]] : [[-1,0],[-1,1],[0,-1],[0,1],[1,0],[1,1]]; }
  function getFloating(){
    const connectedToTop=new Set(); const q=[]; for(let c=0;c<COLS;c++) if(grid[0][c]!==-1){ q.push([0,c]); connectedToTop.add('0,'+c); }
    let head=0; while(head<q.length){ const [r,c]=q[head++]; for(let [nr,nc] of getNeighbors(r,c)){ if(nr<0||nr>=ROWS||nc<0||nc>=COLS) continue; if(grid[nr][nc]===-1) continue; const key=nr+','+nc; if(connectedToTop.has(key)) continue; connectedToTop.add(key); q.push([nr,nc]); } }
    const floating=[]; for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) if(grid[r][c]!==-1 &&!connectedToTop.has(r+','+c)) floating.push({r,c}); return floating;
  }
  function renderStats(){ root.querySelector('#pbScore').textContent=score; root.querySelector('#pbLevel').textContent=level; root.querySelector('#pbReward').textContent='+'+(Math.round(totalReward*1000000)/1000000).toFixed(6); root.querySelector('#pbStats').textContent='LVL '+level+' • '+fmt(getCoins())+' WASA'; }
  function checkWinLose(w,h){
    for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) if(grid[r][c]!==-1){ const pos=hexPos(r,c,w,h); if(pos.y>h-95){ showLose(); return; } }
    let count=0; for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) if(grid[r][c]!==-1) count++;
    if(count===0) showWin();
  }
  function showWin(){
    if(ceilingInterval) clearInterval(ceilingInterval);
    level++; localStorage.setItem('pb_level',level); localStorage.setItem('pb_best',Math.max(best,score)); best=Math.max(best,score);
    ui.innerHTML=`<div class="pb-win"><div class="pb-win-card"><div style="font-size:42px">🎉🫧</div><div style="font-weight:900;font-size:18px;margin:14px 0 6px">¡NIVEL ${level-1} COMPLETADO!</div><div style="font-size:12px;opacity:.7">Score: ${score} • Nivel: ${level}</div><div class="pb-win-amount">💰 +${fmt(BASE_REWARD)} $WASA por nivel<br><span style="font-size:10px;opacity:.7">Secure • Server valida</span></div><div style="display:flex;flex-direction:column;gap:8px;margin-top:12px"><button class="pb-win-btn x2" id="btnX2">📺 X2 VIENDO AD (+${fmt(BASE_REWARD)} = ${fmt(BASE_REWARD*2)} WASA)</button><button class="pb-win-btn secondary" id="btnClaim">COBRAR ${fmt(BASE_REWARD)} WASA</button><button class="pb-win-btn ghost" id="btnNext">SIGUIENTE NIVEL ↻</button></div><div id="adMsg" style="font-size:10px;opacity:.7;margin-top:10px;min-height:14px"></div></div></div>`;
    ui.querySelector('#btnClaim').onclick=async()=>{ const btn=ui.querySelector('#btnClaim'); btn.textContent='⏳ VALIDANDO SERVER...'; btn.disabled=true; const res=await claimSession(false,false); if(res.ok){ totalReward+=BASE_REWARD; renderStats(); btn.textContent='✅ COBRADO '+fmt(BASE_REWARD)+' WASA'; btn.style.background='linear-gradient(135deg,#22c55e,#16a34a)'; ui.querySelector('#btnX2').style.display='none'; } else{ btn.textContent='REINTENTAR COBRO'; btn.disabled=false; } };
    ui.querySelector('#btnX2').onclick=()=>{ openAd('double'); ui.querySelector('#btnX2').textContent='⏳ Cargando ad... vrAd='+window.vrAd; ui.querySelector('#btnX2').disabled=true; };
    ui.querySelector('#btnNext').onclick=()=>{ ui.innerHTML=''; initGrid(); };
  }
  function showLose(){
    if(ceilingInterval) clearInterval(ceilingInterval);
    ui.innerHTML=`<div class="pb-win"><div class="pb-win-card"><div style="font-size:42px">💀</div><div style="font-weight:900;font-size:18px;margin:14px 0 6px">¡EL TECHO TE APLASTÓ!</div><div style="font-size:12px;opacity:.7">Score: ${score} • Nivel: ${level}<br>El techo bajó demasiado</div><div style="display:flex;flex-direction:column;gap:8px;margin-top:12px"><button class="pb-win-btn secondary" id="btnAgain">JUGAR OTRA VEZ ↻</button><button class="pb-win-btn ghost" id="btnClose">Cerrar</button></div></div></div>`;
    ui.querySelector('#btnAgain').onclick=()=>{ ui.innerHTML=''; initGrid(); };
    ui.querySelector('#btnClose').onclick=()=> ui.innerHTML='';
  }

  const watcher=setInterval(()=>{ if(window.vrAd===4 && _rewardPending){
      const type=_rewardPending; _rewardPending=null; window.vrAd=0; window.vrAdType=null; window._gm_shown=false;
      (async()=>{
        if(type==='double'){
          ui.innerHTML=`<div style="position:absolute;inset:0;background:rgba(0,0,0,.75);display:grid;place-items:center;z-index:20"><div style="background:linear-gradient(180deg,#0f172a,#020617);border:1px solid rgba(56,189,248,.2);border-radius:12px;padding:12px;text-align:center;color:#e2e8f0"><div style="font-weight:900">Validando X2 server...</div><div style="font-size:11px">${fmt(BASE_REWARD)} → ${fmt(BASE_REWARD*2)} WASA</div></div></div>`;
          const res=await claimSession(true,true);
          if(res.ok){ totalReward+=BASE_REWARD*2; renderStats(); ui.innerHTML=`<div class="pb-win"><div class="pb-win-card"><div style="font-size:32px">✅🫧</div><div style="font-weight:900;margin:8px 0">¡X2 ACREDITADO!</div><div class="pb-win-amount">💰 +${fmt(BASE_REWARD*2)} WASA<br><span style="font-size:10px">Total: ${fmt(totalReward)} WASA</span></div><button class="pb-win-btn secondary" id="ok2">SIGUIENTE NIVEL ↻</button></div></div>`; ui.querySelector('#ok2').onclick=()=>{ ui.innerHTML=''; initGrid(); }; }
          else{ ui.innerHTML=`<div class="pb-win"><div class="pb-win-card"><div style="color:#ef4444">Error X2: ${res.error||'server'}</div><button class="pb-win-btn ghost" id="retry">Reintentar</button></div></div>`; ui.querySelector('#retry').onclick=()=>{ ui.innerHTML=''; }; }
        }
      })();
    }
    particles.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.vy+=0.2; p.a-=0.02; }); particles=particles.filter(p=>p.a>0); draw();
  }, 30);

  canvas.addEventListener('mousemove', e=>{ const rect=canvas.getBoundingClientRect(); const mx=e.clientX-rect.left, my=e.clientY-rect.top; shooterAngle=Math.atan2(my-bubbleY,mx-bubbleX); if(shooterAngle>-0.2) shooterAngle=-0.2; if(shooterAngle<-Math.PI+0.2) shooterAngle=-Math.PI+0.2; draw(); });
  canvas.addEventListener('click', e=>{ if(!isShooting) { shoot(); } });
  canvas.addEventListener('touchstart', e=>{ e.preventDefault(); const rect=canvas.getBoundingClientRect(); const mx=e.touches[0].clientX-rect.left, my=e.touches[0].clientY-rect.top; shooterAngle=Math.atan2(my-bubbleY,mx-bubbleX); draw(); }, {passive:false});
  canvas.addEventListener('touchmove', e=>{ e.preventDefault(); const rect=canvas.getBoundingClientRect(); const mx=e.touches[0].clientX-rect.left, my=e.touches[0].clientY-rect.top; shooterAngle=Math.atan2(my-bubbleY,mx-bubbleX); if(shooterAngle>-0.2) shooterAngle=-0.2; if(shooterAngle<-Math.PI+0.2) shooterAngle=-Math.PI+0.2; draw(); }, {passive:false});
  canvas.addEventListener('touchend', e=>{ e.preventDefault(); if(!isShooting) shoot(); }, {passive:false});

  root.querySelector('#pbLeft').onclick=()=>{ shooterAngle-=0.15; draw(); };
  root.querySelector('#pbRight').onclick=()=>{ shooterAngle+=0.15; draw(); };
  root.querySelector('#pbUp').onclick=()=>{ shooterAngle=-Math.PI/2; draw(); };
  root.querySelector('#pbShoot').onclick=()=>{ if(!isShooting) shoot(); };
  root.querySelector('#pbNew').onclick=initGrid;
  addEventListener('keydown',e=>{ if(e.key==='ArrowLeft'){ shooterAngle-=0.12; draw(); } if(e.key==='ArrowRight'){ shooterAngle+=0.12; draw(); } if(e.key==='ArrowUp'){ shooterAngle=-Math.PI/2; draw(); } if(e.key===' '||e.key==='Enter'){ e.preventDefault(); if(!isShooting) shoot(); } });

  initGrid(); (function loop(){ draw(); requestAnimationFrame(loop); })();
  container._cleanup=()=>{ clearInterval(watcher); if(ceilingInterval) clearInterval(ceilingInterval); ro.disconnect(); window.vrAd=0; };
}
