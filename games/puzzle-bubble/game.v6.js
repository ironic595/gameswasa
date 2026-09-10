export function init(container, args){
  const WORKER_URL = window.WASA_CONFIG?.WORKER_URL || 'https://games-wasa-worker.javimsites.workers.dev/';
  const getDeviceId = ()=> window.getDeviceId?window.getDeviceId():(()=>{let id=localStorage.getItem('wasa_device_id'); if(!id){id='dev_'+Math.random().toString(36).slice(2)+Date.now().toString(36); localStorage.setItem('wasa_device_id',id);} return id;})();
  const fmt = n => { const v=parseFloat(n)||0; if(v===0) return '0'; return (Math.round(v*1e6)/1e6).toFixed(6).replace(/0+$/,'').replace(/\.$/,''); }

  container.innerHTML=`
<style>
.pb{width:100%;height:100%;display:flex;flex-direction:column;background:radial-gradient(ellipse at 50% 0%, rgba(0,240,255,.12), transparent 60%), linear-gradient(180deg,#08080d,#0f0f17);font-family:'Space Grotesk',Inter,system-ui;touch-action:none;overflow:hidden}
.pb-top{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:rgba(15,15,23,.9);border-bottom:1px solid rgba(255,255,255,.08);color:#fff}
.pb-pill{border-radius:20px;padding:6px 10px;font-size:10px;font-weight:700;background:#1b1b27;border:1px solid rgba(255,255,255,.12);color:#fff}
.pb-pill.y{background:linear-gradient(135deg,#FFE600,#FF6B2B);color:#000;border:none;font-weight:900}
.pb-body{flex:1;display:flex;gap:12px;padding:10px;max-width:1100px;width:100%;margin:0 auto;min-height:0}
.pb-left{flex:0 0 420px;width:420px;max-height:740px;height:100%;background:#0f0f17;border:1px solid rgba(255,255,255,.1);border-radius:20px;overflow:hidden;position:relative;display:flex;flex-direction:column}
.pb-ceil{height:26px;background:#1e1e28;border-bottom:1px solid rgba(255,255,255,.1);display:flex;justify-content:space-between;align-items:center;padding:0 10px;font-size:9px;font-weight:800;color:#fff}
.pb-ceil.danger{background:#FF2B2B;animation:blink.6s infinite}@keyframes blink{0%,100%{opacity:1}50%{opacity:.6}}
.pb-bar{height:4px;background:rgba(0,0,0,.5)}.pb-prog{height:100%;background:linear-gradient(90deg,#00F0FF,#FF00D4);transition:width 1s linear}
.pb-canvas{flex:1;width:100%;display:block;touch-action:none;cursor:crosshair}
.pb-right{flex:1;max-width:360px;display:flex;flex-direction:column;gap:10px;color:#fff;overflow:auto}
.pb-stats{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.pb-st{background:rgba(21,21,29,.8);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:10px}
.pb-st b{font-family:JetBrains Mono;font-size:15px;display:block}.pb-st span{font-size:9px;opacity:.5;text-transform:uppercase;letter-spacing:.08em}
.pb-obj{background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:10px}
.pb-obj-head{display:flex;justify-content:space-between;font-size:9px;opacity:.6;margin-bottom:6px;font-family:JetBrains Mono}
.pb-track{height:8px;background:#1e1e28;border-radius:6px;overflow:hidden;border:1px solid rgba(255,255,255,.06);padding:2px}.pb-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,#00F0FF,#FF00D4);transition:width.35s}
.pb-ctrl{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}
.pb-btn{padding:14px;border-radius:12px;font-weight:800;font-size:11px;text-transform:uppercase;border:1px solid rgba(255,255,255,.1);background:#1b1b27;color:#fff;touch-action:manipulation}
.pb-btn:active{transform:scale(.97)}.pb-btn.shoot{background:#fff;color:#000;grid-column:span 3;font-size:13px;font-weight:900}
.pb-win{position:absolute;inset:0;background:rgba(0,0,0,.82);backdrop-filter:blur(8px);display:grid;place-items:center;z-index:30;padding:16px}
.pb-card{background:linear-gradient(180deg,#15151f,#0f0f17);border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:22px;text-align:center;width:min(360px,92vw);color:#fff}
.pb-amount{background:rgba(0,255,136,.08);border:1px solid rgba(0,255,136,.25);border-radius:14px;padding:12px;margin:12px 0;font-weight:800;color:#00FF88}
.pb-wbtn{width:100%;padding:13px;border-radius:14px;font-weight:900;font-size:11px;text-transform:uppercase;border:1px solid rgba(255,255,255,.1);margin-top:8px;cursor:pointer}
.pb-wbtn.x2{background:linear-gradient(135deg,#FF00D4,#00F0FF);color:#fff}.pb-wbtn.main{background:#fff;color:#000}.pb-wbtn.ghost{background:#1e1e28;color:#888}
.pb-pop{position:absolute;left:50%;top:42%;transform:translate(-50%,-50%);font-family:JetBrains Mono;font-weight:900;font-size:22px;color:#FFE600;text-shadow:0 0 14px rgba(255,230,0,.8);pointer-events:none;z-index:20;animation:pop.7s forwards}
@keyframes pop{0%{transform:translate(-50%,-50%) scale(.5);opacity:0}30%{transform:translate(-50%,-50%) scale(1.2);opacity:1}100%{transform:translate(-50%,-80%) scale(.9);opacity:0}}
@media(max-width:900px){.pb-body{flex-direction:column}.pb-left{flex:0 0 62vh;width:100%;height:62vh;max-height:62vh}.pb-right{max-width:100%}}
</style>
<div class="pb" id="pbRoot">
  <div class="pb-top"><div style="font-weight:900;font-size:11px;letter-spacing:.18em">PUZZLE BUBBLE • v5 PROGRESIVO</div><div style="display:flex;gap:6px"><div class="pb-pill y" id="pbLvl">LVL 1</div><div class="pb-pill" id="pbTim">45s</div></div></div>
  <div class="pb-body">
    <div class="pb-left" id="pbBox"><div class="pb-ceil" id="pbCeil"><span>▼ TECHO ▼</span><span id="pbCeilT">45s</span><span>▼ TECHO ▼</span></div><div class="pb-bar"><div class="pb-prog" id="pbProg" style="width:0%"></div></div><canvas class="pb-canvas" id="pbCan"></canvas></div>
    <div class="pb-right">
      <div class="pb-stats"><div class="pb-st"><b id="pbScore">0</b><span>Score</span></div><div class="pb-st"><b id="pbLevel">1</b><span>Nivel</span></div><div class="pb-st"><b id="pbReward">+0.000000</b><span>WASA</span></div><div class="pb-st"><b id="pbShots">0/12</b><span>Tiros</span></div></div>
      <div class="pb-obj"><div class="pb-obj-head"><span>OBJETIVO POPS</span><span id="pbObj">0/30</span></div><div class="pb-track"><div class="pb-fill" id="pbBar" style="width:0%"></div></div><div style="display:flex;justify-content:space-between;margin-top:8px;font-size:10px;opacity:.6"><span id="pbInfo">TECHO EN 12</span><span id="pbNext">SIG</span></div></div>
      <div class="pb-ctrl"><button class="pb-btn" id="pbL">◀</button><button class="pb-btn" id="pbC">▲</button><button class="pb-btn" id="pbR">▶</button><button class="pb-btn shoot" id="pbShoot">TOCÁ / ESPACIO</button></div>
    </div>
  </div><div id="pbUI"></div>
</div>`;

  const root=container.querySelector('#pbRoot'), canvas=root.querySelector('#pbCan'), ctx=canvas.getContext('2d'), ui=root.querySelector('#pbUI');
  const COLS=8, ROWS=12, R=19, COLORS=['#00F0FF','#FF00D4','#FFE600','#00FF88','#FF6B2B'];
  let grid=[], score=0, level=parseInt(localStorage.getItem('pb_level')||'1'), total=0, cur=0, nxt=0, angle=-Math.PI/2, bx=0, by=0, shooting=false, parts=[], shot=0, ceilT=45, ceilIv=null, ceilOff=0, maxC=45, need=12, popped=0, target=30, sess=null, claiming=false, pend=null;

  const ceilTime=l=>Math.max(10,45-(l-1)*0.5), shotsNeed=l=>Math.max(5,12-Math.floor((l-1)/4)), targetPops=l=>Math.min(80,30+(l-1)*5), colorsAvail=l=>Math.min(5,3+Math.floor(l/2));

  function resize(){
    const dpr=devicePixelRatio||1, box=root.querySelector('#pbBox').getBoundingClientRect(), h=box.height-30;
    canvas.width=box.width*dpr; canvas.height=h*dpr; canvas.style.width=box.width+'px'; canvas.style.height=h+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0); bx=box.width/2; by=h-34;
  }
  const ro=new ResizeObserver(resize); ro.observe(root.querySelector('#pbBox')); resize();

  async function startSess(){ sess=null; try{ const email=localStorage.getItem('wasa_email'), wallet=localStorage.getItem('wasa_wallet'), device_id=getDeviceId(); const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start_game_session',email,wallet,device_id,game_slug:'puzzle-bubble',level})}); const j=await r.json(); if(j.ok) sess=j.session_id; }catch(e){} }
  async function claim(isDouble, ad){
    if(claiming) return {ok:false}; if(!sess) await startSess(); if(!sess) return {ok:false}; claiming=true;
    try{ const email=localStorage.getItem('wasa_email'), wallet=localStorage.getItem('wasa_wallet'), device_id=getDeviceId(); const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'claim_reward',session_id:sess,email,wallet,device_id,game_slug:'puzzle-bubble',level,ad_watched:ad,double_reward:isDouble,time_taken:30})}); const j=await r.json(); if(j.ok){ const bal=j.wasa_balance??j.guest_balance??0; if(j.is_guest){ localStorage.setItem('wasa_coins_guest',bal); localStorage.setItem('wasa_coins','0'); } else localStorage.setItem('wasa_coins',bal); if(window.setCoinsUI) window.setCoinsUI(bal); sess=null; claiming=false; return j; } claiming=false; return {ok:false,error:j.error}; }catch(e){ claiming=false; return {ok:false}; }
  }
  function openAd(t){ if(window.vrAd!==0) return; pend=t; window.vrAdType=t; window.vrAd=1; }

  function initGrid(){
    const ca=colorsAvail(level); grid=[]; for(let r=0;r<ROWS;r++){ grid[r]=[]; for(let c=0;c<COLS;c++){ if(r<5) grid[r][c]=Math.floor(Math.random()*ca); else grid[r][c]=-1; } }
    score=0; shot=0; ceilOff=0; popped=0; target=targetPops(level); maxC=ceilTime(level); need=shotsNeed(level); ceilT=maxC; cur=Math.floor(Math.random()*ca); nxt=Math.floor(Math.random()*ca); angle=-Math.PI/2; shooting=false; parts=[]; startSess(); updateUI(); startCeil();
  }
  function startCeil(){ if(ceilIv) clearInterval(ceilIv); maxC=ceilTime(level); need=shotsNeed(level); ceilT=maxC; ceilIv=setInterval(()=>{ ceilT--; if(ceilT<0) ceilT=0; updateUI(); if(ceilT<=0){ pushCeil(); ceilT=maxC; } },1000); }
  function updateUI(){
    root.querySelector('#pbTim').textContent=Math.ceil(ceilT)+'s / '+(maxC%1===0?maxC.toFixed(0):maxC.toFixed(1))+'s';
    root.querySelector('#pbCeilT').textContent=Math.ceil(ceilT)+'s • LVL'+level;
    root.querySelector('#pbProg').style.width=((maxC-ceilT)/maxC*100)+'%';
    root.querySelector('#pbCeil').classList.toggle('danger', ceilT<=5);
    root.querySelector('#pbShots').textContent=shot+'/'+need;
    root.querySelector('#pbScore').textContent=score;
    root.querySelector('#pbLevel').textContent=level;
    root.querySelector('#pbLvl').textContent='LVL '+level;
    root.querySelector('#pbReward').textContent='+'+(Math.round(total*1e6)/1e6).toFixed(6);
    root.querySelector('#pbObj').textContent=popped+'/'+target;
    root.querySelector('#pbBar').style.width=Math.min(100,popped/target*100)+'%';
    root.querySelector('#pbInfo').textContent='TECHO EN '+(need-shot)+' tiros • '+Math.ceil(ceilT)+'s';
    root.querySelector('#pbNext').innerHTML='<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:'+COLORS[nxt]+'"></span> SIG';
  }
  function pushCeil(){
    for(let r=ROWS-1;r>0;r--) for(let c=0;c<COLS;c++) grid[r][c]=grid[r-1][c];
    const ca=colorsAvail(level); for(let c=0;c<COLS;c++) grid[0][c]=Math.random()>0.15?Math.floor(Math.random()*ca):-1;
    ceilOff++; const w=canvas.width/(devicePixelRatio||1), h=canvas.height/(devicePixelRatio||1);
    for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) if(grid[r][c]!==-1){ const p=pos(r,c,w,h); if(p.y>h-90){ lose(); return; } }
    if(navigator.vibrate) navigator.vibrate(30); shot=0; updateUI();
  }
  function pos(r,c,w,h){ const off=(r%2===1)?R:0; return {x:off + c*(R*2) + R + 6, y:r*(R*1.72) + R + 6 + ceilOff*3}; }
  function bubble(x,y,r,col,gloss){ ctx.fillStyle=col; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); if(gloss){ const g=ctx.createRadialGradient(x-r*0.3,y-r*0.35,r*0.2,x,y,r); g.addColorStop(0,'rgba(255,255,255,.9)'); g.addColorStop(1,'rgba(255,255,255,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); } ctx.strokeStyle='rgba(0,0,0,.25)'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.stroke(); }
  function cannon(x,y,a){ ctx.save(); ctx.translate(x,y); ctx.rotate(a+Math.PI/2); ctx.fillStyle='#2a2a36'; ctx.fillRect(-7,-26,14,26); ctx.fillStyle='#15151d'; ctx.fillRect(-10,-6,20,10); ctx.restore(); }
  function findSnap(x,y,w,h){ let best=null,bd=9999; for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){ if(grid[r][c]!==-1) continue; const p=pos(r,c,w,h); const d=Math.hypot(x-p.x,y-p.y); if(d<bd && d<R*1.7){ bd=d; best={...p,r,c}; } } if(!best){ for(let c=0;c<COLS;c++){ const p=pos(0,c,w,h); const d=Math.hypot(x-p.x,y-p.y); if(d<bd){ bd=d; best={...p,r:0,c}; } } } return best; }
  function traj(w,h){ let tx=bx, ty=by, a=angle, b=0; ctx.strokeStyle='rgba(255,255,255,.22)'; ctx.setLineDash([5,6]); ctx.beginPath(); ctx.moveTo(tx,ty); for(let i=0;i<260;i++){ tx+=Math.cos(a)*6; ty+=Math.sin(a)*6; if(tx<R||tx>w-R){ a=Math.PI-a; b++; if(b>2) break; } if(ty<0) break; if(i%8===0) ctx.lineTo(tx,ty); } ctx.stroke(); ctx.setLineDash([]); const s=findSnap(tx,ty,w,h); if(s){ ctx.globalAlpha=.35; bubble(s.x,s.y,R-2,COLORS[cur],false); ctx.globalAlpha=1; } }
  function draw(){ const w=canvas.width/(devicePixelRatio||1), h=canvas.height/(devicePixelRatio||1); ctx.clearRect(0,0,w,h); ctx.fillStyle='rgba(15,15,23,.35)'; ctx.fillRect(0,0,w,h); ctx.strokeStyle='rgba(255,43,43,.45)'; ctx.setLineDash([6,6]); ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(0,h-90); ctx.lineTo(w,h-90); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle='rgba(255,43,43,.08)'; ctx.fillRect(0,h-90,w,90); for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){ const col=grid[r][c]; if(col===-1) continue; const p=pos(r,c,w,h); if(p.y<h) bubble(p.x,p.y,R-2,COLORS[col],false); } if(!shooting){ bubble(bx,by,R,COLORS[cur],true); cannon(bx,by,angle); traj(w,h); } parts.forEach(p=>{ ctx.globalAlpha=p.a; ctx.fillStyle=p.col; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1; }); ctx.fillStyle='rgba(0,0,0,.45)'; ctx.fillRect(w-62,8,52,52); ctx.fillStyle='#aaa'; ctx.font='800 8px JetBrains Mono'; ctx.fillText('NEXT',w-50,18); bubble(w-36,38,R-4,COLORS[nxt],false); }
  function neigh(r,c){ return r%2===0?[[-1,-1],[-1,0],[0,-1],[0,1],[1,-1],[1,0]]:[[-1,0],[-1,1],[0,-1],[0,1],[1,0],[1,1]]; }
  function connected(sr,sc){ const col=grid[sr][sc]; if(col===-1) return []; const vis=new Set(); const q=[[sr,sc]]; vis.add(sr+','+sc); let head=0; while(head<q.length){ const [r,c]=q[head++]; for(let [nr,nc] of neigh(r,c)){ if(nr<0||nr>=ROWS||nc<0||nc>=COLS) continue; if(grid[nr][nc]!==col) continue; const k=nr+','+nc; if(vis.has(k)) continue; vis.add(k); q.push([nr,nc]); } } return Array.from(vis).map(k=>{ const [r,c]=k.split(',').map(Number); return {r,c}; }); }
  function floating(){ const conn=new Set(); const q=[]; for(let c=0;c<COLS;c++) if(grid[0][c]!==-1){ q.push([0,c]); conn.add('0,'+c); } let head=0; while(head<q.length){ const [r,c]=q[head++]; for(let [nr,nc] of neigh(r,c)){ if(nr<0||nr>=ROWS||nc<0||nc>=COLS) continue; if(grid[nr][nc]===-1) continue; const k=nr+','+nc; if(conn.has(k)) continue; conn.add(k); q.push([nr,nc]); } } const fl=[]; for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) if(grid[r][c]!==-1 &&!conn.has(r+','+c)) fl.push({r,c}); return fl; }
  function popTxt(n){ const el=document.createElement('div'); el.className='pb-pop'; el.textContent='POP x'+n+'!'; root.querySelector('#pbBox').appendChild(el); setTimeout(()=>el.remove(),700); }
  function place(x,y,w,h){
    const s=findSnap(x,y,w,h); if(!s){ shooting=false; return; }
    grid[s.r][s.c]=cur; const pr=s.r; cur=nxt; nxt=Math.floor(Math.random()*colorsAvail(level)); shooting=false; shot++; if(shot>=need){ pushCeil(); ceilT=maxC; shot=0; }
    const conn=connected(pr,s.c);
    if(conn.length>=3){
      popTxt(conn.length); conn.forEach(({r,c})=>{ const p=pos(r,c,w,h); for(let i=0;i<8;i++) parts.push({x:p.x,y:p.y,r:Math.random()*3+1,col:COLORS[grid[r][c]],a:1,vx:(Math.random()-.5)*7,vy:(Math.random()-.5)*7}); grid[r][c]=-1; }); score+=conn.length*15; popped+=conn.length;
      setTimeout(()=>{ const fl=floating(); if(fl.length) popTxt(fl.length); fl.forEach(({r,c})=>{ const p=pos(r,c,w,h); for(let i=0;i<6;i++) parts.push({x:p.x,y:p.y,r:Math.random()*3+1,col:COLORS[grid[r][c]],a:1,vx:(Math.random()-.5)*6,vy:(Math.random()-.5)*6}); grid[r][c]=-1; score+=8; popped+=1; }); updateUI(); check(w,h); },120);
    }
    updateUI(); draw(); check(w,h);
  }
  function check(w,h){ for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) if(grid[r][c]!==-1){ const p=pos(r,c,w,h); if(p.y>h-88){ lose(); return; } } let cnt=0; for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) if(grid[r][c]!==-1) cnt++; if(popped>=target || cnt===0) win(); }
  function win(){
    if(ceilIv) clearInterval(ceilIv); const nt=ceilTime(level+1), ns=shotsNeed(level+1), nT=targetPops(level+1); level++; localStorage.setItem('pb_level',level);
    ui.innerHTML=`<div class="pb-win"><div class="pb-card"><div style="font-size:36px">✓</div><div style="font-weight:900;font-size:18px;margin:10px 0 4px">¡NIVEL ${level-1} COMPLETADO!</div><div style="font-size:11px;opacity:.6">${popped}/${target} • SIG: ${nt.toFixed(1)}s / ${ns} tiros</div><div class="pb-amount">+${fmt(0.01)} WASA • OBJ ${target} → ${nT}<br><span style="font-size:10px;opacity:.7">${maxC.toFixed(1)}s → ${nt.toFixed(1)}s</span></div><button class="pb-wbtn x2" id="bX2">VER ANUNCIO X2 → ${fmt(0.02)} WASA</button><button class="pb-wbtn main" id="bCl">RECLAMAR ${fmt(0.01)} WASA</button><button class="pb-wbtn ghost" id="bNx">SIGUIENTE NIVEL LVL${level}</button></div></div>`;
    ui.querySelector('#bCl').onclick=async()=>{ const b=ui.querySelector('#bCl'); b.textContent='VALIDANDO...'; b.disabled=true; const r=await claim(false,false); if(r.ok){ total+=0.01; updateUI(); b.textContent='ACREDITADO '+fmt(0.01); b.style.background='#00FF88'; ui.querySelector('#bX2').style.display='none'; } else{ b.textContent='REINTENTAR'; b.disabled=false; } };
    ui.querySelector('#bX2').onclick=()=>{ openAd('double'); ui.querySelector('#bX2').textContent='CARGANDO AD...'; ui.querySelector('#bX2').disabled=true; };
    ui.querySelector('#bNx').onclick=()=>{ ui.innerHTML=''; initGrid(); };
  }
  function lose(){ if(ceilIv) clearInterval(ceilIv); ui.innerHTML=`<div class="pb-win"><div class="pb-card"><div style="font-size:36px">✕</div><div style="font-weight:900;font-size:18px;margin:10px 0 4px">TECHO ALCANZADO</div><div style="font-size:11px;opacity:.6">${popped}/${target} • LVL${level}</div><button class="pb-wbtn main" id="bAg">REINTENTAR LVL${level}</button><button class="pb-wbtn ghost" id="bCl2">CERRAR</button></div></div>`; ui.querySelector('#bAg').onclick=()=>{ ui.innerHTML=''; initGrid(); }; ui.querySelector('#bCl2').onclick=()=> ui.innerHTML=''; }

  const watcher=setInterval(()=>{
    if(window.vrAd===4 && pend){
      const t=pend; pend=null; window.vrAd=0; window.vrAdType=null; window._gm_shown=false;
      (async()=>{
        ui.innerHTML=`<div style="position:absolute;inset:0;background:rgba(0,0,0,.75);display:grid;place-items:center;z-index:30;color:#fff">Validando X2...</div>`;
        const r=await claim(true,true);
        if(r.ok){ total+=0.02; updateUI(); ui.innerHTML=`<div class="pb-win"><div class="pb-card"><div style="font-size:32px">✅</div><div style="font-weight:900;margin:8px 0">X2 ACREDITADO</div><div class="pb-amount">+${fmt(0.02)} WASA<br>Total: ${fmt(total)}</div><button class="pb-wbtn main" id="ok">SIGUIENTE LVL${level+1}</button></div></div>`; ui.querySelector('#ok').onclick=()=>{ ui.innerHTML=''; initGrid(); }; }
        else{ ui.innerHTML=`<div class="pb-win"><div class="pb-card"><div style="color:#FF2B2B">Error X2</div><button class="pb-wbtn ghost" id="rt">Reintentar</button></div></div>`; ui.querySelector('#rt').onclick=()=> ui.innerHTML=''; }
      })();
    }
    parts.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.vy+=0.22; p.a-=0.02; }); parts=parts.filter(p=>p.a>0); draw();
  }, 30);

  function setAng(cx,cy){ const rect=canvas.getBoundingClientRect(); const w=canvas.width/(devicePixelRatio||1); const sx=w/rect.width; const mx=(cx-rect.left)*sx, my=(cy-rect.top)*sx; angle=Math.atan2(my-by,mx-bx); if(angle>-0.15) angle=-0.15; if(angle<-Math.PI+0.15) angle=-Math.PI+0.15; }
  let down=false;
  canvas.addEventListener('pointerdown', e=>{ e.preventDefault(); down=true; setAng(e.clientX,e.clientY); draw(); }, {passive:false});
  canvas.addEventListener('pointermove', e=>{ e.preventDefault(); if(!down) return; setAng(e.clientX,e.clientY); draw(); }, {passive:false});
  canvas.addEventListener('pointerup', e=>{ e.preventDefault(); if(!down) return; down=false; setAng(e.clientX,e.clientY); if(!shooting) shoot(); }, {passive:false});
  canvas.addEventListener('pointercancel', ()=>{ down=false; });

  function shoot(){ if(shooting) return; shooting=true; const w=canvas.width/(devicePixelRatio||1), h=canvas.height/(devicePixelRatio||1); let tx=bx, ty=by, a=angle; const sp=13; const anim=()=>{ tx+=Math.cos(a)*sp; ty+=Math.sin(a)*sp; if(tx<R||tx>w-R) a=Math.PI-a; for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){ if(grid[r][c]===-1) continue; const p=pos(r,c,w,h); if(Math.hypot(tx-p.x,ty-p.y)<R*1.8){ place(tx,ty,w,h); return; } } if(ty<R){ place(tx,ty,w,h); return; } if(ty>h){ shooting=false; draw(); return; } draw(); bubble(tx,ty,R,COLORS[cur],true); requestAnimationFrame(anim); }; anim(); }

  root.querySelector('#pbL').addEventListener('touchstart', e=>{ e.preventDefault(); angle-=0.18; draw(); }, {passive:false});
  root.querySelector('#pbR').addEventListener('touchstart', e=>{ e.preventDefault(); angle+=0.18; draw(); }, {passive:false});
  root.querySelector('#pbL').onclick=()=>{ angle-=0.18; draw(); };
  root.querySelector('#pbR').onclick=()=>{ angle+=0.18; draw(); };
  root.querySelector('#pbC').onclick=()=>{ angle=-Math.PI/2; draw(); };
  root.querySelector('#pbShoot').onclick=()=>{ if(!shooting) shoot(); };
  window.addEventListener('keydown', e=>{ if(e.key==='ArrowLeft'){ angle-=0.14; draw(); } if(e.key==='ArrowRight'){ angle+=0.14; draw(); } if(e.key==='ArrowUp'||e.key===' '){ e.preventDefault(); if(!shooting) shoot(); } });

  initGrid(); (function loop(){ draw(); requestAnimationFrame(loop); })();
  container._cleanup=()=>{ clearInterval(watcher); if(ceilIv) clearInterval(ceilIv); ro.disconnect(); window.vrAd=0; };
}
