export function init(container, args){
  const WORKER_URL = window.WASA_CONFIG?.WORKER_URL || 'https://games-wasa-worker.javimsites.workers.dev/';
  function getDeviceId(){ if(window.getDeviceId) return window.getDeviceId(); let id=localStorage.getItem('wasa_device_id'); if(!id){ id='dev_'+Math.random().toString(36).slice(2)+Date.now().toString(36); localStorage.setItem('wasa_device_id',id);} return id; }
  function fmt(n){ const v=parseFloat(n)||0; if(v===0) return '0'; return (Math.round(v*1000000)/1000000).toFixed(6).replace(/0+$/,'').replace(/\.$/,''); }

  container.innerHTML=`
<style>
.pb{width:100%;height:100%;min-height:100%;position:relative;background:radial-gradient(ellipse at 50% 0%, rgba(0,240,255,.12), transparent 60%), linear-gradient(180deg,#08080d,#0f0f17);font-family:'Space Grotesk',Inter,system-ui;overflow:hidden;display:flex;flex-direction:column;touch-action:none}
.pb-top{flex-shrink:0;display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:rgba(15,15,23,.9);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,.08);color:#fff;z-index:5}
.pb-pill{border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:6px 10px;font-size:10px;background:#1b1b27;color:#fff;font-weight:700;white-space:nowrap}
.pb-pill.y{background:linear-gradient(135deg,#FFE600,#FF6B2B);color:#000;border:none;font-weight:900}
.pb-body{flex:1;display:flex;gap:12px;padding:10px;overflow:hidden;width:100%;max-width:1100px;margin:0 auto;min-height:0}
.pb-left{flex:0 0 420px;width:420px;height:100%;max-height:740px;display:flex;flex-direction:column;background:#0f0f17;border:1px solid rgba(255,255,255,.1);border-radius:20px;overflow:hidden;position:relative}
.pb-ceil{height:26px;background:#1e1e28;border-bottom:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:space-between;padding:0 10px;font-size:9px;font-weight:800;color:#fff}
.pb-ceil.danger{background:#FF2B2B;animation:blink.6s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.6}}
.pb-bar{height:4px;background:rgba(0,0,0,.5)}.pb-prog{height:100%;background:linear-gradient(90deg,#00F0FF,#FF00D4);transition:width 1s linear}
.pb-canvas{width:100%;flex:1;display:block;touch-action:none;cursor:crosshair}
.pb-right{flex:1;max-width:360px;display:flex;flex-direction:column;gap:10px;color:#fff;overflow:auto}
.pb-stats{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.pb-st{background:rgba(21,21,29,.8);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:10px}
.pb-st b{font-family:JetBrains Mono;font-size:15px;display:block}.pb-st span{font-size:9px;opacity:.5;text-transform:uppercase}
.pb-obj{background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:10px}
.pb-obj-head{display:flex;justify-content:space-between;font-size:9px;opacity:.6;margin-bottom:6px;font-family:JetBrains Mono}
.pb-obj-track{height:8px;background:#1e1e28;border-radius:6px;overflow:hidden;border:1px solid rgba(255,255,255,.06);padding:2px}
.pb-obj-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,#00F0FF,#FF00D4);transition:width.35s}
.pb-ctrl{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}
.pb-btn{padding:14px;border-radius:12px;font-weight:800;font-size:11px;text-transform:uppercase;border:1px solid rgba(255,255,255,.1);background:#1b1b27;color:#fff;touch-action:manipulation}
.pb-btn:active{transform:scale(.97)}.pb-btn.shoot{background:#fff;color:#000;grid-column:span 3;font-size:13px;font-weight:900}
.pb-win{position:absolute;inset:0;background:rgba(0,0,0,.82);backdrop-filter:blur(8px);display:grid;place-items:center;z-index:30;padding:16px}
.pb-card{background:linear-gradient(180deg,#15151f,#0f0f17);border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:22px;text-align:center;width:min(360px,92vw);color:#fff}
.pb-amount{background:rgba(0,255,136,.08);border:1px solid rgba(0,255,136,.25);border-radius:14px;padding:12px;margin:12px 0;font-weight:800;color:#00FF88}
.pb-wbtn{width:100%;padding:13px;border-radius:14px;font-weight:900;font-size:11px;text-transform:uppercase;border:1px solid rgba(255,255,255,.1);margin-top:8px;cursor:pointer;touch-action:manipulation}
.pb-wbtn.x2{background:linear-gradient(135deg,#FF00D4,#00F0FF);color:#fff}.pb-wbtn.main{background:#fff;color:#000}.pb-wbtn.ghost{background:#1e1e28;color:#888}
.pb-pop{position:absolute;left:50%;top:42%;transform:translate(-50%,-50%);font-family:JetBrains Mono;font-weight:900;font-size:22px;color:#FFE600;text-shadow:0 0 14px rgba(255,230,0,.8);pointer-events:none;z-index:20;animation:pop.7s forwards}
@keyframes pop{0%{transform:translate(-50%,-50%) scale(.5);opacity:0}30%{transform:translate(-50%,-50%) scale(1.2);opacity:1}100%{transform:translate(-50%,-80%) scale(.9);opacity:0}}
@media(max-width:900px){.pb-body{flex-direction:column}.pb-left{flex:0 0 62vh;width:100%;height:62vh;max-height:62vh}.pb-right{max-width:100%}}
</style>
<div class="pb" id="pbRoot">
  <div class="pb-top"><div style="font-weight:900;font-size:11px;letter-spacing:.18em">PUZZLE BUBBLE • 45s→10s • 0,01 + X2</div><div style="display:flex;gap:6px"><div class="pb-pill y" id="pbLevelPill">LVL 1</div><div class="pb-pill" id="pbTimer">45s</div></div></div>
  <div class="pb-body">
    <div class="pb-left" id="pbLeftBox"><div class="pb-ceil" id="pbCeil"><span>▼ TECHO ▼</span><span id="pbCeilText">45s</span><span>▼ TECHO ▼</span></div><div class="pb-bar"><div class="pb-prog" id="pbCeilProg" style="width:0%"></div></div><canvas class="pb-canvas" id="pbCanvas"></canvas></div>
    <div class="pb-right">
      <div class="pb-stats"><div class="pb-st"><b id="pbScore">0</b><span>Score</span></div><div class="pb-st"><b id="pbLevel">1</b><span>Nivel</span></div><div class="pb-st"><b id="pbReward">+0.000000</b><span>WASA Total</span></div><div class="pb-st"><b id="pbShots">0/12</b><span>Tiros p/ bajada</span></div></div>
      <div class="pb-obj"><div class="pb-obj-head"><span>OBJETIVO</span><span id="pbObjText">0/30</span></div><div class="pb-obj-track"><div class="pb-obj-fill" id="pbObjBar" style="width:0%"></div></div><div style="display:flex;justify-content:space-between;margin-top:8px;font-size:10px;opacity:.6"><span id="pbCeilInfo">TECHO EN 12 tiros</span><span id="pbNextCol">SIG</span></div></div>
      <div class="pb-ctrl"><button class="pb-btn" id="pbL">◀</button><button class="pb-btn" id="pbC">▲</button><button class="pb-btn" id="pbR">▶</button><button class="pb-btn shoot" id="pbShoot">TOCÁ / ESPACIO</button></div>
    </div>
  </div><div id="pbUI"></div>
</div>`;

  const root=container.querySelector('#pbRoot'), canvas=root.querySelector('#pbCanvas'), ctx=canvas.getContext('2d'), ui=root.querySelector('#pbUI');
  const COLS=8, ROWS=12, R=19;
  const COLORS=['#00F0FF','#FF00D4','#FFE600','#00FF88','#FF6B2B'];
  let grid=[], score=0, level=1, totalReward=0, curCol=0, nextCol=0, angle=-Math.PI/2, bx=0, by=0, shooting=false, particles=[], shotCount=0, ceilTimer=45, ceilInt=null, ceilOffset=0, maxCeil=45, needShots=12, popped=0, target=30, sessionId=null, claiming=false, pending=null;

  function ceilTime(l){ return Math.max(10, 45 - (l-1)*0.5); }
  function shotsNeed(l){ return Math.max(5, 12 - Math.floor((l-1)/4)); }
  function targetPops(l){ return Math.min(80, 30 + (l-1)*5); }

  function resize(){
    const dpr=devicePixelRatio||1, box=root.querySelector('#pbLeftBox').getBoundingClientRect(), ch=box.height-30;
    canvas.width=box.width*dpr; canvas.height=ch*dpr; canvas.style.width=box.width+'px'; canvas.style.height=ch+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0); bx=box.width/2; by=ch-34;
  }
  const ro=new ResizeObserver(resize); ro.observe(root.querySelector('#pbLeftBox')); resize();

  async function startSession(){ sessionId=null; try{ const email=localStorage.getItem('wasa_email'), wallet=localStorage.getItem('wasa_wallet'), device_id=getDeviceId(); const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start_game_session',email,wallet,device_id,game_slug:'puzzle-bubble',level})}); const j=await r.json(); if(j.ok) sessionId=j.session_id; }catch(e){} }
  async function claim(isDouble, adWatched){
    if(claiming) return {ok:false}; if(!sessionId) await startSession(); if(!sessionId) return {ok:false}; claiming=true;
    try{ const email=localStorage.getItem('wasa_email'), wallet=localStorage.getItem('wasa_wallet'), device_id=getDeviceId(); const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'claim_reward',session_id:sessionId,email,wallet,device_id,game_slug:'puzzle-bubble',level,ad_watched:adWatched,double_reward:isDouble,time_taken:30})}); const j=await r.json(); if(j.ok){ const bal=j.wasa_balance??j.guest_balance??0; if(j.is_guest){ localStorage.setItem('wasa_coins_guest',bal); localStorage.setItem('wasa_coins','0'); } else localStorage.setItem('wasa_coins',bal); if(window.setCoinsUI) window.setCoinsUI(bal); sessionId=null; claiming=false; return j; } claiming=false; return {ok:false}; }catch(e){ claiming=false; return {ok:false}; }
  }
  function openAd(t){ if(window.vrAd!==0) return; pending=t; window.vrAdType=t; window.vrAd=1; }

  function initGrid(){
    grid=[]; for(let r=0;r<ROWS;r++){ grid[r]=[]; for(let c=0;c<COLS;c++){ if(r<5) grid[r][c]=Math.floor(Math.random()*Math.min(5,3+Math.floor(level/2))); else grid[r][c]=-1; } }
    score=0; level=parseInt(localStorage.getItem('pb_level')||'1'); shotCount=0; ceilOffset=0; popped=0; target=targetPops(level); maxCeil=ceilTime(level); needShots=shotsNeed(level); ceilTimer=maxCeil;
    curCol=Math.floor(Math.random()*Math.min(5,3+Math.floor(level/2))); nextCol=Math.floor(Math.random()*Math.min(5,3+Math.floor(level/2))); angle=-Math.PI/2; shooting=false; particles=[]; startSession(); updateUI(); startCeil();
  }
  function startCeil(){ if(ceilInt) clearInterval(ceilInt); maxCeil=ceilTime(level); needShots=shotsNeed(level); ceilTimer=maxCeil; ceilInt=setInterval(()=>{ ceilTimer--; if(ceilTimer<0) ceilTimer=0; updateUI(); if(ceilTimer<=0){ pushCeil(); ceilTimer=maxCeil; } },1000); }
  function updateUI(){
    root.querySelector('#pbTimer').textContent=Math.ceil(ceilTimer)+'s / '+(maxCeil%1===0?maxCeil.toFixed(0):maxCeil.toFixed(1))+'s';
    root.querySelector('#pbCeilText').textContent=Math.ceil(ceilTimer)+'s • LVL'+level;
    root.querySelector('#pbCeilProg').style.width=((maxCeil-ceilTimer)/maxCeil*100)+'%';
    const ceilEl=root.querySelector('#pbCeil'); if(ceilTimer<=5) ceilEl.classList.add('danger'); else ceilEl.classList.remove('danger');
    root.querySelector('#pbShots').textContent=shotCount+'/'+needShots; root.querySelector('#pbScore').textContent=score; root.querySelector('#pbLevel').textContent=level;
    root.querySelector('#pbReward').textContent='+'+(Math.round(totalReward*1e6)/1e6).toFixed(6); root.querySelector('#pbLevelPill').textContent='LVL '+level;
    root.querySelector('#pbObjText').textContent=popped+'/'+target; root.querySelector('#pbObjBar').style.width=Math.min(100,popped/target*100)+'%';
    root.querySelector('#pbCeilInfo').textContent='TECHO EN '+(needShots-shotCount)+' tiros • '+Math.ceil(ceilTimer)+'s';
    root.querySelector('#pbNextCol').innerHTML='<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:'+COLORS[nextCol]+'"></span> SIG';
  }
  function pushCeil(){
    for(let r=ROWS-1;r>0;r--) for(let c=0;c<COLS;c++) grid[r][c]=grid[r-1][c];
    for(let c=0;c<COLS;c++) grid[0][c]=Math.random()>0.15?Math.floor(Math.random()*Math.min(5,3+Math.floor(level/2))):-1;
    ceilOffset++; const w=canvas.width/(devicePixelRatio||1), h=canvas.height/(devicePixelRatio||1);
    for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) if(grid[r][c]!==-1){ const p=hexPos(r,c,w,h); if(p.y>h-90){ showLose(); return; } }
    if(navigator.vibrate) navigator.vibrate(30); shotCount=0; updateUI();
  }
  function hexPos(r,c,w,h){ const off=(r%2===1)?R:0; return {x:off + c*(R*2) + R + 6, y:r*(R*1.72) + R + 6 + ceilOffset*3}; }
  function drawBubble(x,y,r,col,gloss){ ctx.fillStyle=col; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); if(gloss){ const g=ctx.createRadialGradient(x-r*0.3,y-r*0.35,r*0.2,x,y,r); g.addColorStop(0,'rgba(255,255,255,.9)'); g.addColorStop(1,'rgba(255,255,255,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); } ctx.strokeStyle='rgba(0,0,0,.25)'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.stroke(); }
  function drawCannon(x,y,a){ ctx.save(); ctx.translate(x,y); ctx.rotate(a+Math.PI/2); ctx.fillStyle='#2a2a36'; ctx.fillRect(-7,-26,14,26); ctx.fillStyle='#15151d'; ctx.fillRect(-10,-6,20,10); ctx.restore(); }
  function drawTraj(w,h){ let tx=bx, ty=by, a=angle, b=0; ctx.strokeStyle='rgba(255,255,255,.22)'; ctx.setLineDash([5,6]); ctx.beginPath(); ctx.moveTo(tx,ty); for(let i=0;i<260;i++){ tx+=Math.cos(a)*6; ty+=Math.sin(a)*6; if(tx<R||tx>w-R){ a=Math.PI-a; b++; if(b>2) break; } if(ty<0) break; if(i%8===0) ctx.lineTo(tx,ty); } ctx.stroke(); ctx.setLineDash([]); const s=findSnap(tx,ty,w,h); if(s){ ctx.globalAlpha=.35; drawBubble(s.x,s.y,R-2,COLORS[curCol],false); ctx.globalAlpha=1; } }
  function draw(){ const w=canvas.width/(devicePixelRatio||1), h=canvas.height/(devicePixelRatio||1); ctx.clearRect(0,0,w,h); ctx.fillStyle='rgba(15,15,23,.35)'; ctx.fillRect(0,0,w,h); ctx.strokeStyle='rgba(255,43,43,.45)'; ctx.setLineDash([6,6]); ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(0,h-90); ctx.lineTo(w,h-90); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle='rgba(255,43,43,.08)'; ctx.fillRect(0,h-90,w,90); for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){ const col=grid[r][c]; if(col===-1) continue; const p=hexPos(r,c,w,h); if(p.y<h) drawBubble(p.x,p.y,R-2,COLORS[col],false); } if(!shooting){ drawBubble(bx,by,R,COLORS[curCol],true); drawCannon(bx,by,angle); drawTraj(w,h); } particles.forEach(p=>{ ctx.globalAlpha=p.a; ctx.fillStyle=p.col; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1; }); ctx.fillStyle='rgba(0,0,0,.45)'; ctx.fillRect(w-62,8,52,52); ctx.fillStyle='#aaa'; ctx.font='800 8px JetBrains Mono'; ctx.fillText('NEXT',w-50,18); drawBubble(w-36,38,R-4,COLORS[nextCol],false); }
  function findSnap(x,y,w,h){ let best=null,bd=9999; for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){ if(grid[r][c]!==-1) continue; const p=hexPos(r,c,w,h); const d=Math.hypot(x-p.x,y-p.y); if(d<bd && d<R*1.7){ bd=d; best={...p,r,c}; } } if(!best){ for(let c=0;c<COLS;c++){ const p=hexPos(0,c,w,h); const d=Math.hypot(x-p.x,y-p.y); if(d<bd){ bd=d; best={...p,r:0,c}; } } } return best; }
  function shoot(){ if(shooting) return; shooting=true; const w=canvas.width/(devicePixelRatio||1), h=canvas.height/(devicePixelRatio||1); let tx=bx, ty=by, a=angle; const sp=13; const anim=()=>{ tx+=Math.cos(a)*sp; ty+=Math.sin(a)*sp; if(tx<R||tx>w-R) a=Math.PI-a; for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){ if(grid[r][c]===-1) continue; const p=hexPos(r,c,w,h); if(Math.hypot(tx-p.x,ty-p.y)<R*1.8){ place(tx,ty,w,h); return; } } if(ty<R){ place(tx,ty,w,h); return; } if(ty>h){ shooting=false; draw(); return; } draw(); drawBubble(tx,ty,R,COLORS[curCol],true); requestAnimationFrame(anim); }; anim(); }
  function neighbors(r,c){ return r%2===0?[[-1,-1],[-1,0],[0,-1],[0,1],[1,-1],[1,0]]:[[-1,0],[-1,1],[0,-1],[0,1],[1,0],[1,1]]; }
  function connected(sr,sc){ const col=grid[sr][sc]; if(col===-1) return []; const vis=new Set(); const q=[[sr,sc]]; vis.add(sr+','+sc); let head=0; while(head<q.length){ const [r,c]=q[head++]; for(let [nr,nc] of neighbors(r,c)){ if(nr<0||nr>=ROWS||nc<0||nc>=COLS) continue; if(grid[nr][nc]!==col) continue; const k=nr+','+nc; if(vis.has(k)) continue; vis.add(k); q.push([nr,nc]); } } return Array.from(vis).map(k=>{ const [r,c]=k.split(',').map(Number); return {r,c}; }); }
  function floating(){ const conn=new Set(); const q=[]; for(let c=0;c<COLS;c++) if(grid[0][c]!==-1){ q.push([0,c]); conn.add('0,'+c); } let head=0; while(head<q.length){ const [r,c]=q[head++]; for(let [nr,nc] of neighbors(r,c)){ if(nr<0||nr>=ROWS||nc<0||nc>=COLS) continue; if(grid[nr][nc]===-1) continue; const k=nr+','+nc; if(conn.has(k)) continue; conn.add(k); q.push([nr,nc]); } } const fl=[]; for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) if(grid[r][c]!==-1 &&!conn.has(r+','+c)) fl.push({r,c}); return fl; }
  function popText(n){ const el=document.createElement('div'); el.className='pb-pop'; el.textContent='POP x'+n+'!'; root.querySelector('#pbLeftBox').appendChild(el); setTimeout(()=>el.remove(),700); }
  function place(x,y,w,h){
    const s=findSnap(x,y,w,h); if(!s){ shooting=false; return; }
    grid[s.r][s.c]=curCol; const pr=s.r, pc=s.c; curCol=nextCol; nextCol=Math.floor(Math.random()*Math.min(5,3+Math.floor(level/2))); shooting=false; shotCount++; if(shotCount>=needShots){ pushCeil(); ceilTimer=maxCeil; shotCount=0; }
    const conn=connected(pr,pc);
    if(conn.length>=3){
      popText(conn.length); conn.forEach(({r,c})=>{ const p=hexPos(r,c,w,h); for(let i=0;i<8;i++) particles.push({x:p.x,y:p.y,r:Math.random()*3+1,col:COLORS[grid[r][c]],a:1,vx:(Math.random()-.5)*7,vy:(Math.random()-.5)*7}); grid[r][c]=-1; }); score+=conn.length*15; popped+=conn.length;
      setTimeout(()=>{ const fl=floating(); if(fl.length) popText(fl.length); fl.forEach(({r,c})=>{ const p=hexPos(r,c,w,h); for(let i=0;i<6;i++) particles.push({x:p.x,y:p.y,r:Math.random()*3+1,col:COLORS[grid[r][c]],a:1,vx:(Math.random()-.5)*6,vy:(Math.random()-.5)*6}); grid[r][c]=-1; score+=8; popped+=1; }); updateUI(); check(w,h); },120);
    }
    updateUI(); draw(); check(w,h);
  }
  function check(w,h){ for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) if(grid[r][c]!==-1){ const p=hexPos(r,c,w,h); if(p.y>h-88){ showLose(); return; } } let cnt=0; for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) if(grid[r][c]!==-1) cnt++; if(popped>=target || cnt===0) showWin(); }
  function showWin(){
    if(ceilInt) clearInterval(ceilInt); const nextT=ceilTime(level+1), nextS=shotsNeed(level+1), nextTarget=targetPops(level+1);
    level++; localStorage.setItem('pb_level',level);
    ui.innerHTML=`<div class="pb-win"><div class="pb-card"><div style="font-size:36px">🎉</div><div style="font-weight:900;font-size:18px;margin:10px 0 4px">¡NIVEL ${level-1} COMPLETADO!</div><div style="font-size:11px;opacity:.6">${popped}/${target} • SIG: ${nextT.toFixed(1)}s / ${nextS} tiros</div><div class="pb-amount">+${fmt(0.01)} WASA • ${target} → ${nextTarget}<br><span style="font-size:10px;opacity:.7">${maxCeil.toFixed(1)}s → ${nextT.toFixed(1)}s</span></div><button class="pb-wbtn x2" id="bX2">VER ANUNCIO X2 → ${fmt(0.02)} WASA</button><button class="pb-wbtn main" id="bCl">RECLAMAR ${fmt(0.01)} WASA</button><button class="pb-wbtn ghost" id="bNx">SIGUIENTE LVL${level}</button></div></div>`;
    ui.querySelector('#bCl').onclick=async()=>{ const b=ui.querySelector('#bCl'); b.textContent='VALIDANDO...'; b.disabled=true; const r=await claim(false,false); if(r.ok){ totalReward+=0.01; updateUI(); b.textContent='ACREDITADO '+fmt(0.01); b.style.background='#00FF88'; ui.querySelector('#bX2').style.display='none'; } else{ b.textContent='REINTENTAR'; b.disabled=false; } };
    ui.querySelector('#bX2').onclick=()=>{ openAd('double'); ui.querySelector('#bX2').textContent='CARGANDO AD...'; ui.querySelector('#bX2').disabled=true; };
    ui.querySelector('#bNx').onclick=()=>{ ui.innerHTML=''; initGrid(); };
  }
  function showLose(){ if(ceilInt) clearInterval(ceilInt); ui.innerHTML=`<div class="pb-win"><div class="pb-card"><div style="font-size:36px">💀</div><div style="font-weight:900;font-size:18px;margin:10px 0 4px">TECHO ALCANZADO</div><div style="font-size:11px;opacity:.6">${popped}/${target} • LVL${level}</div><button class="pb-wbtn main" id="bAg">REINTENTAR LVL${level}</button><button class="pb-wbtn ghost" id="bCl2">CERRAR</button></div></div>`; ui.querySelector('#bAg').onclick=()=>{ ui.innerHTML=''; initGrid(); }; ui.querySelector('#bCl2').onclick=()=> ui.innerHTML=''; }

  const watcher=setInterval(()=>{ if(window.vrAd===4 && pending){ const t=pending; pending=null; window.vrAd=0; window.vrAdType=null; window._gm_shown=false; (async()=>{ ui.innerHTML=`<div style="position:absolute;inset:0;background:rgba(0,0,0,.75);display:grid;place-items:center;z-index:30;color:#fff">Validando X2...</div>`; const r=await claim(true,true); if(r.ok){ totalReward+=0.02; updateUI(); ui.innerHTML=`<div class="pb-win"><div class="pb-card"><div style="font-size:32px">✅</div><div style="font-weight:900;margin:8px 0">X2 ACREDITADO</div><div class="pb-amount">+${fmt(0.02)} WASA<br>Total: ${fmt(totalReward)}</div><button class="pb-wbtn main" id="ok">SIGUIENTE LVL${level+1}</button></div></div>`; ui.querySelector('#ok').onclick=()=>{ ui.innerHTML=''; initGrid(); }; } else{ ui.innerHTML=`<div class="pb-win"><div class="pb-card"><div style="color:#FF2B2B">Error X2</div><button class="pb-wbtn ghost" id="rt">Reintentar</button></div></div>`; ui.querySelector('#rt').onclick=()=> ui.innerHTML=''; } })(); } particles.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.vy+=0.22; p.a-=0.02; }); particles=particles.filter(p=>p.a>0); draw(); }, 30);

  function setAngleFromEvent(cx,cy){ const rect=canvas.getBoundingClientRect(); const w=canvas.width/(devicePixelRatio||1); const sx=w/rect.width; const mx=(cx-rect.left)*sx, my=(cy-rect.top)*sx; angle=Math.atan2(my-by,mx-bx); if(angle>-0.15) angle=-0.15; if(angle<-Math.PI+0.15) angle=-Math.PI+0.15; }
  let down=false;
  canvas.addEventListener('pointerdown', e=>{ e.preventDefault(); down=true; setAngleFromEvent(e.clientX,e.clientY); draw(); }, {passive:false});
  canvas.addEventListener('pointermove', e=>{ e.preventDefault(); if(!down) return; setAngleFromEvent(e.clientX,e.clientY); draw(); }, {passive:false});
  canvas.addEventListener('pointerup', e=>{ e.preventDefault(); if(!down) return; down=false; setAngleFromEvent(e.clientX,e.clientY); if(!shooting) shoot(); }, {passive:false});
  canvas.addEventListener('pointercancel', ()=>{ down=false; });

  root.querySelector('#pbL').addEventListener('touchstart', e=>{ e.preventDefault(); angle-=0.18; draw(); }, {passive:false});
  root.querySelector('#pbR').addEventListener('touchstart', e=>{ e.preventDefault(); angle+=0.18; draw(); }, {passive:false});
  root.querySelector('#pbL').onclick=()=>{ angle-=0.18; draw(); };
  root.querySelector('#pbR').onclick=()=>{ angle+=0.18; draw(); };
  root.querySelector('#pbC').onclick=()=>{ angle=-Math.PI/2; draw(); };
  root.querySelector('#pbShoot').onclick=()=>{ if(!shooting) shoot(); };
  window.addEventListener('keydown', e=>{ if(e.key==='ArrowLeft'){ angle-=0.14; draw(); } if(e.key==='ArrowRight'){ angle+=0.14; draw(); } if(e.key==='ArrowUp'||e.key===' '){ e.preventDefault(); if(!shooting) shoot(); } });

  initGrid(); (function loop(){ draw(); requestAnimationFrame(loop); })();
  container._cleanup=()=>{ clearInterval(watcher); if(ceilInt) clearInterval(ceilInt); ro.disconnect(); window.vrAd=0; };
}
