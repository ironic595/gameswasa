// game.v6.js - PUZZLE BUBBLE v5 ARTIFACT CONVERTIDO 1:1 - LA QUE ANDA
export function init(container, args){
  const WORKER_URL = window.WASA_CONFIG?.WORKER_URL || 'https://games-wasa-worker.javimsites.workers.dev/';
  const getDeviceId = ()=> window.getDeviceId?window.getDeviceId():(()=>{let id=localStorage.getItem('wasa_device_id'); if(!id){id='dev_'+Math.random().toString(36).slice(2)+Date.now().toString(36); localStorage.setItem('wasa_device_id',id);} return id;})();
  const fmt = n => { const v=parseFloat(n)||0; if(v===0) return '0'; return (Math.round(v*1e6)/1e6).toFixed(6).replace(/0+$/,'').replace(/\.$/,''); }

  const B=8,Q=12,WE=38,HALF=WE/2,UU=WE*0.865,RN=B*WE+HALF+2,NU=Q*UU+80;
  const XE=[{hex:"#00F0FF",grad:"radial-gradient(65% 65% at 35% 30%, #fff 0%, #a8f7ff 15%, #00F0FF 55%, #0090a6 100%)",glow:"#00F0FF"},{hex:"#FF00D4",grad:"radial-gradient(65% 65% at 35% 30%, #fff 0%, #ffb3f0 15%, #FF00D4 55%, #8a006e 100%)",glow:"#FF00D4"},{hex:"#FFE600",grad:"radial-gradient(65% 65% at 35% 30%, #fff 0%, #fff6a0 18%, #FFE600 55%, #a68600 100%)",glow:"#FFE600"},{hex:"#00FF88",grad:"radial-gradient(65% 65% at 35% 30%, #fff 0%, #a6ffd1 18%, #00FF88 55%, #008a48 100%)",glow:"#00FF88"},{hex:"#FF6B2B",grad:"radial-gradient(65% 65% at 35% 30%, #fff 0%, #ffcfad 18%, #FF6B2B 55%, #9c3100 100%)",glow:"#FF6B2B"}];
  const Oe=(r,c)=>{let x=c*WE+(r%2?HALF:0)+HALF+1,y=r*UU+HALF+8;return{x,y}};
  const mm=(x,y)=>{let r=Math.round((y-HALF-8)/UU),off=r%2?HALF:0,c=Math.round((x-HALF-1-off)/WE);return{r,c}};
  const ru=(r,c)=>r%2===0?[[r-1,c-1],[r-1,c],[r,c-1],[r,c+1],[r+1,c-1],[r+1,c]]:[[r-1,c],[r-1,c+1],[r,c-1],[r,c+1],[r+1,c],[r+1,c+1]];
  const tu=e=>e.map(n=>[...n]); const Vo=e=>{let n=0;for(let t=0;t<e.length;t++)for(let r=0;r<B;r++)if(e[t][r]!==null)n++;return n};
  function vm(e,r,c){let col=e[r]?.[c];if(col===null||col===void 0)return[];let seen=new Set(),q=[[r,c]];seen.add(`${r},${c}`);let out=[];while(q.length){let [rr,cc]=q.shift();if(e[rr]?.[cc]!==col)continue;out.push([rr,cc]);for(let [nr,nc] of ru(rr,cc)){if(nr<0||nr>=Q||nc<0||nc>=B)continue;let k=`${nr},${nc}`;if(seen.has(k))continue;if(e[nr][nc]===col)seen.add(k),q.push([nr,nc])}}return out}
  function hm(e){let seen=new Set(),qq=[];for(let c=0;c<B;c++)if(e[0][c]!==null)qq.push([0,c]),seen.add(`0,${c}`);while(qq.length){let [r,c]=qq.shift();for(let [nr,nc] of ru(r,c)){if(nr<0||nr>=Q||nc<0||nc>=B)continue;let k=`${nr},${nc}`;if(seen.has(k))continue;if(e[nr][nc]!==null)seen.add(k),qq.push([nr,nc])}}let floating=[];for(let r=0;r<Q;r++)for(let c=0;c<B;c++)if(e[r][c]!==null&&!seen.has(`${r},${c}`))floating.push([r,c]);return floating}
  function lu(x,y,grid){let {r,c}=mm(x,y),best=[];for(let dr=-3;dr<=3;dr++)for(let dc=-3;dc<=3;dc++){let nr=r+dr,nc=c+dc;if(nr<0||nr>=Q||nc<0||nc>=B)continue;if(grid[nr][nc]!==null)continue;if(!(nr===0||ru(nr,nc).some(([rr,cc])=>rr>=0&&rr<Q&&cc>=0&&cc<B&&grid[rr][cc]!==null)))continue;let p=Oe(nr,nc),d=Math.hypot(p.x-x,p.y-y);best.push({r:nr,c:nc,d})}if(best.length===0){for(let rr=0;rr<Q;rr++)for(let cc=0;cc<B;cc++)if(grid[rr][cc]===null){if(!(rr===0||ru(rr,cc).some(([a,b])=>a>=0&&a<Q&&b>=0&&b<B&&grid[a][b]!==null)))continue;let p=Oe(rr,cc);best.push({r:rr,c:cc,d:Math.hypot(p.x-x,p.y-y)})}}if(best.length===0)return null;best.sort((a,b)=>a.d-b.d);return best[0]}
  function ym(angle,grid,ox,oy){let rad=angle*Math.PI/180,dx=Math.cos(rad),dy=Math.sin(rad),x=ox,y=oy;for(let i=0;i<600;i++){x+=dx*6;y+=dy*6;if(x<=HALF+2){x=HALF+2;dx*=-1}if(x>=RN-HALF-2){x=RN-HALF-2;dx*=-1}if(y<=HALF+10){let p=lu(x,y,grid);if(p){let v=Oe(p.r,p.c);return{place:p,x:v.x,y:v.y}}return null}for(let r=0;r<Q;r++)for(let c=0;c<B;c++){if(grid[r][c]===null)continue;let g=Oe(r,c);if(Math.hypot(g.x-x,g.y-y)<WE*0.88){let pp=lu(x,y,grid);if(pp){let vv=Oe(pp.r,pp.c);return{place:pp,x:vv.x,y:vv.y,hitBubble:{r,c}}}return null}}}return null}
  function gm(angle,grid,ox,oy,l=3){let rad=angle*Math.PI/180,dx=Math.cos(rad),dy=Math.sin(rad),x=ox,y=oy,p=[{x,y}],bounces=0;for(let i=0;i<400;i++){x+=dx*8;y+=dy*8;if(x<=HALF+2||x>=RN-HALF-2){dx*=-1;x=Math.max(HALF+2,Math.min(RN-HALF-2,x));p.push({x,y});bounces++;if(bounces>=l)break}if(y<=HALF+12){p.push({x,y});break}let hit=false;for(let r=0;r<Q;r++)for(let c=0;c<B;c++)if(grid[r][c]!==null){let H=Oe(r,c);if(Math.hypot(H.x-x,H.y-y)<WE*0.9){hit=true;break}}if(hit){p.push({x,y});return p}}return p}

  container.innerHTML=`
  <style>
 .pb6{width:100%;height:100%;background:#08080d;color:#fff;font-family:'Space Grotesk',system-ui;display:flex;flex-direction:column;overflow:hidden}
 .pb6-top{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:rgba(15,15,23,.9);border-bottom:1px solid rgba(255,255,255,.1)}
 .pb6-board{position:relative;background:#0f0f17;border-radius:20px;border:1px solid rgba(255,255,255,.1);overflow:hidden;touch-action:none;margin:10px auto;width:min(100vw - 24px, ${RN}px);height:min(78vh, ${NU}px);box-shadow:0 0 0 1px rgba(255,255,255,.06) inset, 0 20px 60px rgba(0,0,0,.7)}
 .bubble{box-shadow:inset -3px -4px 8px rgba(0,0,0,.6), inset 3px 3px 6px rgba(255,255,255,.9), 0 2px 8px rgba(0,0,0,.5);border-radius:50%;position:absolute}
 .bubble::after{content:'';position:absolute;width:42%;height:32%;left:18%;top:14%;background:radial-gradient(ellipse at center, rgba(255,255,255,.9) 0%, rgba(255,255,255,0) 70%);border-radius:50%}
 .pb6-stats{display:grid;grid-template-columns:1fr 1fr;gap:8px;max-width:520px;margin:10px auto 0;padding:0 14px;width:100%}
 .pb6-st{background:rgba(21,21,29,.8);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:10px}.pb6-st b{font-family:monospace;font-size:15px;display:block}.pb6-st span{font-size:9px;opacity:.5;text-transform:uppercase}
 .pb6-win{position:absolute;inset:0;background:rgba(0,0,0,.82);backdrop-filter:blur(8px);display:grid;place-items:center;z-index:50;padding:16px}
 .pb6-card{background:linear-gradient(180deg,#15151f,#0f0f17);border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:22px;text-align:center;width:min(360px,92vw)}
  @keyframes pop{0%{transform:scale(.7);opacity:0}40%{transform:scale(1.15);opacity:1}100%{transform:scale(1);opacity:1}}@keyframes fall{0%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(120px) scale(.6);opacity:0}}
  </style>
  <div class="pb6" id="pb6">
    <div class="pb6-top"><div style="font-weight:900;font-size:11px;letter-spacing:.18em;color:#00F0FF">PUZZLE BUBBLE • v6 PROGRESIVO • 45→10s • FIX CACHE</div><div style="display:flex;gap:6px"><div style="background:#1b1b27;border-radius:20px;padding:6px 10px;font-size:10px;font-weight:800" id="pb6lvl">LVL 1</div><div style="background:linear-gradient(135deg,#FFE600,#FF6B2B);color:#000;border-radius:20px;padding:6px 10px;font-size:10px;font-weight:900" id="pb6w">0 WASA</div></div></div>
    <div class="pb6-stats"><div class="pb6-st"><b id="pb6obj">0/30</b><span>OBJETIVO POPS</span></div><div class="pb6-st"><b id="pb6tm">45s / 12 tiros</b><span>TECHO</span></div><div class="pb6-st"><b id="pb6sc">0</b><span>SCORE</span></div><div class="pb6-st"><b id="pb6rw">+0.000000</b><span>WASA</span></div></div>
    <div style="max-width:520px;margin:8px auto 0;padding:0 14px;width:100%"><div style="height:8px;background:#1e1e28;border-radius:10px;border:1px solid rgba(255,255,255,.08);padding:2px"><div id="pb6bar" style="height:100%;border-radius:6px;background:linear-gradient(90deg,#00F0FF,#FF00D4);width:0%;transition:width.4s"></div></div></div>
    <div class="pb6-board" id="pb6board"></div>
    <div style="text-align:center;font-size:10px;opacity:.4;margin-top:6px;font-family:monospace">🖱 MOVER / TOCAR / ←→ + ESPACIO • TRAYECTORIA + GHOST</div>
    <div id="pb6ui"></div>
  </div>`;

  const board=container.querySelector('#pb6board'), ui=container.querySelector('#pb6ui');
  let level=parseInt(localStorage.getItem('pb_level')||'1'), target=()=>Math.min(80,30+(level-1)*5), need=()=>Math.max(5,12-Math.floor((level-1)/4)), maxT=()=>Math.max(10,45-(level-1)*0.5);
  let grid=[], score=0, popped=0, cur=0, nxt=0, angle=-90, ghost=null, traj=[], parts=[], shooting=null, shot=0, ceilT=maxT(), ceilIv=null, total=0, sess=null, pend=null, claiming=false;
  let colors=()=>Math.min(5,3+Math.floor(level/2)), It=RN/2, Dt=NU-22;

  async function startSess(){ try{ const email=localStorage.getItem('wasa_email'), wallet=localStorage.getItem('wasa_wallet'), device_id=getDeviceId(); const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start_game_session',email,wallet,device_id,game_slug:'puzzle-bubble',level})}); const j=await r.json(); if(j.ok) sess=j.session_id; }catch(e){} }
  async function claim(isDouble, ad){ if(claiming) return {ok:false}; if(!sess) await startSess(); if(!sess) return {ok:false}; claiming=true; try{ const email=localStorage.getItem('wasa_email'), wallet=localStorage.getItem('wasa_wallet'), device_id=getDeviceId(); const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'claim_reward',session_id:sess,email,wallet,device_id,game_slug:'puzzle-bubble',level,ad_watched:ad,double_reward:isDouble,time_taken:30})}); const j=await r.json(); if(j.ok){ const bal=j.wasa_balance??j.guest_balance??0; if(j.is_guest){ localStorage.setItem('wasa_coins_guest',bal); localStorage.setItem('wasa_coins','0'); } else localStorage.setItem('wasa_coins',bal); if(window.setCoinsUI) window.setCoinsUI(bal); sess=null; claiming=false; return j; } claiming=false; return {ok:false}; }catch(e){ claiming=false; return {ok:false}; } }
  function openAd(t){ if(window.vrAd!==0) return; pend=t; window.vrAdType=t; window.vrAd=1; }

  function initGrid(){
    let rows=Math.min(7,5+Math.floor(level/3)); grid=Array.from({length:Q},()=>Array(B).fill(null));
    for(let r=0;r<rows;r++){ let cols=r%2===1?B-1:B; for(let c=0;c<cols;c++){ if(level===1&&Math.random()<0.12) continue; grid[r][c]=Math.floor(Math.random()*colors()); } }
    popped=0; shot=0; ceilT=maxT(); cur=Math.floor(Math.random()*colors()); nxt=Math.floor(Math.random()*colors()); angle=-90; shooting=null; ghost=null; traj=[]; parts=[]; score=0; startSess(); updateUI(); startCeil(); draw();
  }
  function startCeil(){ if(ceilIv) clearInterval(ceilIv); ceilIv=setInterval(()=>{ ceilT--; updateUI(); if(ceilT<=0){ pushCeil(); ceilT=maxT(); } },1000); }
  function pushCeil(){ let ng=tu(grid); for(let r=Q-1;r>0;r--) ng[r]=[...ng[r-1]]; let nr=Array(B).fill(null); for(let c=0;c<B;c++) if(Math.random()>0.15) nr[c]=Math.floor(Math.random()*colors()); ng[0]=nr; if(ng[Q-1].some(v=>v!==null)){ lose(); return; } grid=ng; shot=0; if(navigator.vibrate) navigator.vibrate(30); draw(); }
  function updateUI(){ container.querySelector('#pb6lvl').textContent='LVL '+level; container.querySelector('#pb6obj').textContent=popped+'/'+target(); container.querySelector('#pb6tm').textContent=ceilT+'s / '+need()+' tiros'; container.querySelector('#pb6sc').textContent=score; container.querySelector('#pb6rw').textContent='+'+fmt(total); container.querySelector('#pb6bar').style.width=Math.min(100,popped/target()*100)+'%'; container.querySelector('#pb6w').textContent=fmt(total)+' WASA'; }
  function draw(){
    board.innerHTML='';
    let svg=document.createElementNS('http://www.w3.org/2000/svg','svg'); svg.setAttribute('width',RN); svg.setAttribute('height',NU); svg.style.position='absolute'; svg.style.inset='0'; svg.style.pointerEvents='none';
    let poly=document.createElementNS('http://www.w3.org/2000/svg','polyline'); poly.setAttribute('points',traj.map(p=>`${p.x},${p.y}`).join(' ')); poly.setAttribute('fill','none'); poly.setAttribute('stroke','white'); poly.setAttribute('stroke-opacity','0.25'); poly.setAttribute('stroke-width','1.5'); poly.setAttribute('stroke-dasharray','6 6'); svg.appendChild(poly);
    traj.forEach((p,i)=>{ if(i===0) return; let c=document.createElementNS('http://www.w3.org/2000/svg','circle'); c.setAttribute('cx',p.x); c.setAttribute('cy',p.y); c.setAttribute('r',i===traj.length-1?3:1.5); c.setAttribute('fill',i===traj.length-1?'#00F0FF':'white'); c.setAttribute('opacity','0.6'); svg.appendChild(c); });
    board.appendChild(svg);
    grid.forEach((row,r)=>row.forEach((col,c)=>{ if(col===null) return; let {x,y}=Oe(r,c); let d=document.createElement('div'); d.className='bubble'; d.style.left=(x-HALF)+'px'; d.style.top=(y-HALF)+'px'; d.style.width=(WE-2)+'px'; d.style.height=(WE-2)+'px'; d.style.background=XE[col].grad; d.style.boxShadow=`0 0 12px ${XE[col].glow}66, inset -3px -4px 8px rgba(0,0,0,.6)`; board.appendChild(d); }));
    if(ghost &&!shooting){ let gd=document.createElement('div'); gd.style.position='absolute'; gd.style.left=(ghost.x-HALF)+'px'; gd.style.top=(ghost.y-HALF)+'px'; gd.style.width=(WE-2)+'px'; gd.style.height=(WE-2)+'px'; gd.style.borderRadius='50%'; gd.style.border='2px dashed rgba(255,255,255,.4)'; gd.style.background=XE[cur].hex+'22'; board.appendChild(gd); }
    if(shooting){ let sd=document.createElement('div'); sd.className='bubble'; sd.style.left=(shooting.x-HALF)+'px'; sd.style.top=(shooting.y-HALF)+'px'; sd.style.width=(WE-2)+'px'; sd.style.height=(WE-2)+'px'; sd.style.background=XE[shooting.col].grad; sd.style.zIndex='10'; board.appendChild(sd); }
    parts.forEach(p=>{ let pd=document.createElement('div'); pd.style.position='absolute'; pd.style.left=(p.x-4)+'px'; pd.style.top=(p.y-4)+'px'; pd.style.width='8px'; pd.style.height='8px'; pd.style.borderRadius='50%'; pd.style.background=XE[p.col].hex; pd.style.opacity=p.life; pd.style.boxShadow=`0 0 8px ${XE[p.col].glow}`; board.appendChild(pd); });
    let cannon=document.createElement('div'); cannon.style.position='absolute'; cannon.style.left=(It-29)+'px'; cannon.style.top=(Dt-6)+'px'; cannon.style.width='58px'; cannon.style.height='58px'; cannon.style.borderRadius='50%'; cannon.style.background='#1b1b27'; cannon.style.border='2px solid rgba(255,255,255,.15)'; cannon.style.display='grid'; cannon.style.placeItems='center'; cannon.innerHTML=`<div class="bubble" style="width:40px;height:40px;background:${XE[cur].grad};box-shadow:0 0 20px ${XE[cur].glow}"></div>`; board.appendChild(cannon);
  }
  function popAnim(x,y,col,n=8){ for(let i=0;i<n;i++) parts.push({x,y,vx:(Math.random()-0.5)*8,vy:(Math.random()-0.5)*8-2,col,life:1}); }
  function place(r,c,col){
    let ng=tu(grid); ng[r][c]=col; let conn=vm(ng,r,c);
    if(conn.length>=3){
      conn.forEach(([rr,cc])=>{ let p=Oe(rr,cc); popAnim(p.x,p.y,ng[rr][cc],10); ng[rr][cc]=null; });
      let floating=hm(ng);
      if(floating.length){ floating.forEach(([rr,cc])=>{ let p=Oe(rr,cc); popAnim(p.x,p.y,ng[rr][cc],8); ng[rr][cc]=null; }); showMsg(`+${floating.length} FLOTANTES!`); }
      else showMsg(`POP x${conn.length}`);
      popped+=conn.length+floating.length; score+=conn.length*15+floating.length*8;
      grid=ng; updateUI();
      if(popped>=target()||Vo(grid)===0){ win(); return; }
    } else { grid=ng; }
    shot++; if(shot>=need()){ pushCeil(); ceilT=maxT(); shot=0; }
    cur=nxt; nxt=Math.floor(Math.random()*colors()); shooting=null; updateUI(); draw(); checkLose();
  }
  function showMsg(t){ let m=document.createElement('div'); m.textContent=t; m.style.position='absolute'; m.style.top='42%'; m.style.left='50%'; m.style.transform='translate(-50%,-50%)'; m.style.background='#FF00D4'; m.style.color='#fff'; m.style.fontWeight='900'; m.style.padding='6px 14px'; m.style.borderRadius='20px'; m.style.zIndex='20'; m.style.animation='pop.8s ease-out'; board.appendChild(m); setTimeout(()=>m.remove(),800); }
  function checkLose(){ if(grid[Q-1].some(v=>v!==null)) lose(); }
  function win(){
    if(ceilIv) clearInterval(ceilIv);
    let nt=maxT(), nNeed=need(), nTarget=Math.min(80,30+level*5);
    ui.innerHTML=`<div class="pb6-win"><div class="pb6-card"><div style="width:64px;height:64px;margin:0 auto;border-radius:50%;background:linear-gradient(135deg,#00F0FF,#FF00D4);display:grid;place-items:center;font-size:28px">✓</div><h2 style="font-size:22px;font-weight:900;margin-top:10px">¡NIVEL ${level} COMPLETADO!</h2><p style="font-size:12px;opacity:.6;font-family:monospace;margin-top:4px">OBJETIVO: ${popped}/${target()} • ${Vo(grid)===0?'TABLERO LIMPIO + BONUS':'OBJETIVO'}</p><div style="margin-top:14px;background:#0e0e14;border-radius:16px;padding:14px;border:1px solid rgba(255,255,255,.1)"><div style="display:flex;justify-content:space-between;font-size:11px;opacity:.5"><span>RECOMPENSA</span><span style="background:rgba(0,255,136,.2);color:#00FF88;border-radius:10px;padding:2px 8px">FIXED v6</span></div><div style="font-size:26px;font-weight:900;color:#00FF88;margin-top:6px">${fmt(0.01)} WASA</div><button id="bCl" style="margin-top:12px;width:100%;height:48px;border-radius:24px;background:#fff;color:#000;font-weight:900">RECLAMAR +0.01 WASA</button><button id="bX2" style="margin-top:8px;width:100%;height:48px;border-radius:24px;background:linear-gradient(90deg,#FF00D4,#00F0FF);color:#fff;font-weight:900">VER ANUNCIO X2 → 0.02 WASA</button></div><p style="font-size:10px;opacity:.3;margin-top:10px;font-family:monospace">Ceiling v6: ${nt}s / ${nNeed} tiros • Target ${nTarget}=30+${level}*5</p></div></div>`;
    ui.querySelector('#bCl').onclick=async()=>{ let b=ui.querySelector('#bCl'); b.textContent='VALIDANDO...'; b.disabled=true; let r=await claim(false,false); if(r.ok){ total+=0.01; updateUI(); level++; localStorage.setItem('pb_level',level); ui.innerHTML=`<div class="pb6-win"><div class="pb6-card"><div style="font-size:32px">✅</div><div style="font-weight:900;margin:8px 0">ACREDITADO ${fmt(0.01)} WASA</div><div style="background:rgba(0,255,136,.08);border:1px solid rgba(0,255,136,.25);border-radius:14px;padding:12px;color:#00FF88;font-weight:800">Total: ${fmt(total)}</div><button id="ok" style="margin-top:12px;width:100%;height:48px;border-radius:24px;background:#fff;color:#000;font-weight:900">SIGUIENTE LVL${level}</button></div></div>`; ui.querySelector('#ok').onclick=()=>{ ui.innerHTML=''; initGrid(); }; } else { b.textContent='REINTENTAR'; b.disabled=false; } };
    ui.querySelector('#bX2').onclick=()=>{ openAd('double'); ui.querySelector('#bX2').textContent='CARGANDO AD...'; ui.querySelector('#bX2').disabled=true; };
  }
  function lose(){ if(ceilIv) clearInterval(ceilIv); ui.innerHTML=`<div class="pb6-win"><div class="pb6-card" style="background:#1a1012;border-color:rgba(255,43,43,.3)"><div style="width:64px;height:64px;margin:0 auto;border-radius:50%;background:#FF2B2B;display:grid;place-items:center;font-size:28px">✕</div><h2 style="font-size:20px;font-weight:900;margin-top:10px">TECHO ALCANZADO</h2><p style="font-size:12px;opacity:.6;font-family:monospace;margin-top:4px">Burbujas llegaron al fondo • ${popped}/${target()}</p><div style="display:flex;gap:8px;margin-top:16px"><button id="bAg" style="flex:1;height:44px;border-radius:24px;background:#fff;color:#000;font-weight:800">REINTENTAR LVL ${level}</button><button id="bR" style="flex:1;height:44px;border-radius:24px;background:#222;color:#fff;border:1px solid rgba(255,255,255,.15)">RESET</button></div></div></div>`; ui.querySelector('#bAg').onclick=()=>{ ui.innerHTML=''; initGrid(); }; ui.querySelector('#bR').onclick=()=>{ level=1; localStorage.setItem('pb_level',1); ui.innerHTML=''; initGrid(); }; }

  function shoot(){
    if(shooting) return;
    let rad=angle*Math.PI/180; shooting={x:It,y:Dt,dirX:Math.cos(rad),dirY:Math.sin(rad),col:cur};
    let raf; let step=()=>{ if(!shooting) return; shooting.x+=shooting.dirX*12; shooting.y+=shooting.dirY*12;
      if(shooting.x<=HALF+2||shooting.x>=RN-HALF-2){ shooting.dirX*=-1; shooting.x=Math.max(HALF+2,Math.min(RN-HALF-2,shooting.x)); }
      if(shooting.y<=HALF+10){ let p=lu(shooting.x,shooting.y,grid); if(p) place(p.r,p.c,shooting.col); else lose(); shooting=null; draw(); return; }
      for(let r=0;r<Q;r++)for(let c=0;c<B;c++) if(grid[r][c]!==null){ let g=Oe(r,c); if(Math.hypot(g.x-shooting.x,g.y-shooting.y)<WE*0.9){ let p=lu(shooting.x,shooting.y,grid); if(p) place(p.r,p.c,shooting.col); else lose(); shooting=null; draw(); return; } }
      draw(); raf=requestAnimationFrame(step);
    }; raf=requestAnimationFrame(step);
  }

  board.addEventListener('pointermove', e=>{ if(shooting) return; let rect=board.getBoundingClientRect(), scaleX=RN/rect.width, scaleY=NU/rect.height, x=(e.clientX-rect.left)*scaleX, y=(e.clientY-rect.top)*scaleY; let ang=Math.atan2(y-Dt,x-It)*180/Math.PI; if(ang>-15) ang=-15; if(ang<-165) ang=-165; angle=ang; let g=ym(angle,grid,It,Dt); ghost=g?{x:g.x,y:g.y}:null; traj=gm(angle,grid,It,Dt); draw(); });
  board.addEventListener('pointerdown', e=>{ e.preventDefault(); let rect=board.getBoundingClientRect(), scaleX=RN/rect.width, scaleY=NU/rect.height, x=(e.clientX-rect.left)*scaleX, y=(e.clientY-rect.top)*scaleY; let ang=Math.atan2(y-Dt,x-It)*180/Math.PI; if(ang>-15) ang=-15; if(ang<-165) ang=-165; angle=ang; shoot(); }, {passive:false});

  window.addEventListener('keydown', e=>{ if(e.code==='ArrowLeft') angle=Math.max(-165,angle-4); if(e.code==='ArrowRight') angle=Math.min(-15,angle+4); if(e.code==='Space'||e.code==='ArrowUp'){ e.preventDefault(); shoot(); } let g=ym(angle,grid,It,Dt); ghost=g?{x:g.x,y:g.y}:null; traj=gm(angle,grid,It,Dt); draw(); });

  let partIv=setInterval(()=>{ parts=parts.map(p=>({...p,x:p.x+p.vx,y:p.y+p.vy,vy:p.vy+0.25,life:p.life-0.02})).filter(p=>p.life>0); draw(); },16);
  let adIv=setInterval(async()=>{ if(window.vrAd===4 && pend){ let t=pend; pend=null; window.vrAd=0; window.vrAdType=null; window._gm_shown=false; ui.innerHTML=`<div style="position:absolute;inset:0;background:rgba(0,0,0,.75);display:grid;place-items:center;z-index:60;color:#fff">Validando X2...</div>`; let r=await claim(true,true); if(r.ok){ total+=0.02; updateUI(); level++; localStorage.setItem('pb_level',level); ui.innerHTML=`<div class="pb6-win"><div class="pb6-card"><div style="font-size:32px">✅</div><div style="font-weight:900;margin:8px 0">X2 ACREDITADO v6</div><div style="background:rgba(0,255,136,.08);border:1px solid rgba(0,255,136,.25);border-radius:14px;padding:12px;color:#00FF88;font-weight:800">+${fmt(0.02)} WASA<br>Total: ${fmt(total)}</div><button id="ok2" style="margin-top:12px;width:100%;height:48px;border-radius:24px;background:#fff;color:#000;font-weight:900">SIGUIENTE LVL${level}</button></div></div>`; ui.querySelector('#ok2').onclick=()=>{ ui.innerHTML=''; initGrid(); }; } else { ui.innerHTML=`<div class="pb6-win"><div class="pb6-card"><div style="color:#FF2B2B">Error X2</div><button id="rt" style="margin-top:12px;width:100%;height:44px;border-radius:20px;background:#222;color:#fff">Reintentar</button></div></div>`; ui.querySelector('#rt').onclick=()=> ui.innerHTML=''; } } },300);

  initGrid();
  container._cleanup=()=>{ clearInterval(ceilIv); clearInterval(partIv); clearInterval(adIv); window.vrAd=0; };
}
