// v17 - FIX FLOATING + NO COLOR CHANGE - proper parity + floating removal
export function init(container, args){
  const WORKER_URL = window.WASA_CONFIG?.WORKER_URL || 'https://games-wasa-worker.javimsites.workers.dev/';
  const getDeviceId = ()=> window.getDeviceId?window.getDeviceId():(()=>{let id=localStorage.getItem('wasa_device_id'); if(!id){id='dev_'+Math.random().toString(36).slice(2)+Date.now().toString(36); localStorage.setItem('wasa_device_id',id);} return id;})();

  const B=8,Q=12,WE=32,UU=WE*0.865,RN=B*WE+WE/2+2,NU=Q*UU+80;
  const PAL=["#00D4FF","#FF3BB0","#FFD400","#2AFF8A","#FF7A2E"];

  const Oe=(r,c)=>({x:c*WE+(r%2?WE/2:0)+WE/2+1,y:r*UU+WE/2+8});
  const mm=(x,y)=>{let r=Math.round((y-WE/2-8)/UU),off=r%2?WE/2:0,c=Math.round((x-WE/2-1-off)/WE);return{r,c}};
  const ru=(r,c)=>r%2===0?[[r-1,c-1],[r-1,c],[r,c-1],[r,c+1],[r+1,c-1],[r+1,c]]:[[r-1,c],[r-1,c+1],[r,c-1],[r,c+1],[r+1,c],[r+1,c+1]];
  const tu=e=>e.map(n=>[...n]);

  function vm(e,r,c){let col=e[r]?.[c];if(col==null)return[];let seen=new Set(),q=[[r,c]];seen.add(`${r},${c}`);let out=[];while(q.length){let [rr,cc]=q.shift();if(e[rr]?.[cc]!==col)continue;out.push([rr,cc]);for(let [nr,nc] of ru(rr,cc)){if(nr<0||nr>=Q||nc<0||nc>=B)continue;if(nr%2===1 && nc>=B-1) continue; let k=`${nr},${nc}`;if(seen.has(k))continue;if(e[nr][nc]===col){seen.add(k);q.push([nr,nc]);}}}return out}

  function hm(e){
    let seen=new Set(),qq=[];
    for(let c=0;c<B;c++){ if(c===B-1) continue; if(e[0][c]!==null){ qq.push([0,c]); seen.add(`0,${c}`);} }
    // also check odd? top row 0 is even so B cols, but safe
    while(qq.length){
      let [r,c]=qq.shift();
      for(let [nr,nc] of ru(r,c)){
        if(nr<0||nr>=Q||nc<0||nc>=B)continue;
        if(nr%2===1 && nc>=B-1) continue;
        let k=`${nr},${nc}`;if(seen.has(k))continue;
        if(e[nr][nc]!==null){seen.add(k);qq.push([nr,nc]);}
      }
    }
    let floating=[];
    for(let r=0;r<Q;r++) for(let c=0;c<B;c++){
      if(r%2===1 && c>=B-1) continue;
      if(e[r][c]!==null&&!seen.has(`${r},${c}`))floating.push([r,c]);
    }
    return floating;
  }

  function isConnectedTop(grid,r,c){ if(r===0) return true; let seen=new Set(),qq=[[r,c]];seen.add(`${r},${c}`);while(qq.length){let [rr,cc]=qq.shift();if(rr===0) return true; for(let [nr,nc] of ru(rr,cc)){if(nr<0||nr>=Q||nc<0||nc>=B)continue;if(nr%2===1 && nc>=B-1) continue; if(grid[nr][nc]===null)continue;let k=`${nr},${nc}`;if(seen.has(k))continue;seen.add(k);qq.push([nr,nc]);}} return false; }

  function lu(x,y,grid){let {r,c}=mm(x,y),best=[];for(let dr=-3;dr<=3;dr++)for(let dc=-3;dc<=3;dc++){let nr=r+dr,nc=c+dc;if(nr<0||nr>=Q||nc<0||nc>=B)continue;if(nr%2===1 && nc>=B-1) continue; if(grid[nr][nc]!==null)continue;if(!(nr===0||ru(nr,nc).some(([rr,cc])=>{if(rr<0||rr>=Q||cc<0||cc>=B)return false; if(rr%2===1 && cc>=B-1) return false; return grid[rr][cc]!==null;})))continue;let p=Oe(nr,nc),d=Math.hypot(p.x-x,p.y-y);best.push({r:nr,c:nc,d})}if(best.length===0){for(let rr=0;rr<Q;rr++)for(let cc=0;cc<B;cc++){if(rr%2===1 && cc>=B-1) continue; if(grid[rr][cc]!==null) continue; if(!(rr===0||ru(rr,cc).some(([a,b])=>{if(a<0||a>=Q||b<0||b>=B)return false; if(a%2===1 && b>=B-1) return false; return grid[a][b]!==null;})))continue;let p=Oe(rr,cc);best.push({r:rr,c:cc,d:Math.hypot(p.x-x,p.y-y)})}}if(best.length===0)return null;best.sort((a,b)=>a.d-b.d);return best[0]}

  function ym(angle,grid,ox,oy){let rad=angle*Math.PI/180,dx=Math.cos(rad),dy=Math.sin(rad),x=ox,y=oy;for(let i=0;i<500;i++){x+=dx*6;y+=dy*6;if(x<=WE/2+2){x=WE/2+2;dx*=-1}if(x>=RN-WE/2-2){x=RN-WE/2-2;dx*=-1}if(y<=WE/2+10){let p=lu(x,y,grid);if(p){let v=Oe(p.r,p.c);return{place:p,x:v.x,y:v.y}}return null}for(let r=0;r<Q;r++)for(let c=0;c<B;c++){if(grid[r][c]===null)continue;if(r%2===1 && c>=B-1) continue; let g=Oe(r,c);if(Math.hypot(g.x-x,g.y-y)<WE*0.88){let pp=lu(x,y,grid);if(pp){let vv=Oe(pp.r,pp.c);return{place:pp,x:vv.x,y:vv.y}}return null}}}return null}
  function gm(angle,grid,ox,oy){let rad=angle*Math.PI/180,dx=Math.cos(rad),dy=Math.sin(rad),x=ox,y=oy,p=[{x,y}],bounces=0;for(let i=0;i<300;i++){x+=dx*8;y+=dy*8;if(x<=WE/2+2||x>=RN-WE/2-2){dx*=-1;x=Math.max(WE/2+2,Math.min(RN-WE/2-2,x));p.push({x,y});bounces++;if(bounces>=2)break}if(y<=WE/2+12){p.push({x,y});break}for(let r=0;r<Q;r++)for(let c=0;c<B;c++){if(grid[r][c]===null)continue;if(r%2===1 && c>=B-1) continue; let H=Oe(r,c);if(Math.hypot(H.x-x,H.y-y)<WE*0.9){p.push({x,y});return p}}}return p}

  container.innerHTML=`
  <style>
.pb6{width:100%;height:100%;background:#08080d;color:#fff;font-family:system-ui;display:flex;flex-direction:column;overflow:hidden}
.pb6-top{height:42px;display:flex;justify-content:space-between;align-items:center;padding:0 12px;background:#0f0f17;border-bottom:1px solid rgba(255,255,255,.08);flex-shrink:0}
.pb6-wrap{flex:1;display:flex;justify-content:center;align-items:center;padding:12px;overflow:auto}
.pb6-body{display:flex;gap:12px;align-items:flex-start;justify-content:center;margin:auto}
.pb6-left{flex:0 0 ${RN}px;width:${RN}px;background:#0f0f17;border:1px solid rgba(255,255,255,.08);border-radius:16px;overflow:hidden}
.pb6-canvas{display:block;width:${RN}px;height:${NU}px;touch-action:none}
.pb6-right{flex:0 0 280px;width:280px;display:flex;flex-direction:column;gap:8px}
.pb6-st{background:#15151f;border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:10px}.pb6-st b{font-family:monospace;font-size:14px}.pb6-st span{font-size:9px;opacity:.5}
.pb6-win{position:absolute;inset:0;background:rgba(0,0,0,.82);display:grid;place-items:center;z-index:20;padding:16px}
.pb6-card{background:#15151f;border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:18px;text-align:center;width:min(340px,92vw)}
@media(max-width:900px){.pb6-wrap{padding:8px}.pb6-body{flex-direction:column;align-items:center;width:100%}.pb6-left{width:min(100vw - 16px, ${RN}px);flex:0 0 auto}.pb6-right{width:min(100vw - 16px, ${RN}px);flex:0 0 auto}.pb6-canvas{width:100%!important;height:auto!important;aspect-ratio:${RN}/${NU}}}
  </style>
  <div class="pb6">
    <div class="pb6-top"><div style="font-weight:900;font-size:10px;letter-spacing:.15em;color:#00F0FF">PUZZLE BUBBLE • v18 POP ANIM • COMBO • 30 AD</div><div id="pb6lvl" style="background:#1b1b27;border-radius:16px;padding:4px 8px;font-size:10px;font-weight:800">LVL 1</div></div>
    <div class="pb6-wrap"><div class="pb6-body">
      <div class="pb6-left"><canvas id="pb6cv" class="pb6-canvas" width="${RN}" height="${NU}"></canvas><div style="height:3px;background:#000"><div id="pb6bar" style="height:100%;background:linear-gradient(90deg,#00F0FF,#FF00D4);width:0%"></div></div><div style="display:flex;justify-content:space-between;padding:4px 8px;font-size:8px;opacity:.4;font-family:monospace"><span>▼</span><span id="pb6ceil">45s</span><span>▼</span></div></div>
      <div class="pb6-right"><div class="pb6-stats" style="display:grid;grid-template-columns:1fr 1fr;gap:6px"><div class="pb6-st"><b id="pb6obj">0/30</b><br><span>OBJETIVO</span></div><div class="pb6-st"><b id="pb6tm">45s / 12</b><br><span>TECHO</span></div><div class="pb6-st"><b id="pb6sc">0</b><br><span>SCORE</span></div><div class="pb6-st"><b id="pb6nxt" style="display:inline-block;width:16px;height:16px;border-radius:50%"></b><br><span>SIGUIENTE</span></div></div></div>
    </div></div>
    <div id="pb6ui"></div>
  </div>`;

  const canvas=container.querySelector('#pb6cv');
  const DPR = Math.min(2, window.devicePixelRatio||1);
  canvas.width = RN * DPR; canvas.height = NU * DPR;
  canvas.style.width = RN+'px'; canvas.style.height = NU+'px';
  const ctx=canvas.getContext('2d',{alpha:false}); ctx.scale(DPR,DPR);

  let level=parseInt(localStorage.getItem('pb_level')||'1'), target=()=>Math.min(80,30+(level-1)*5), need=()=>Math.max(5,12-Math.floor((level-1)/4)), maxT=()=>Math.max(10,45-(level-1)*0.5);
  let grid=[], score=0, popped=0, cur=0, nxt=0, angle=-90, ghost=null, traj=[], shooting=null, shot=0, ceilT=maxT(), ceilIv=null, sess=null, pend=null, claiming=false;
  let colors=()=>Math.min(5,3+Math.floor(level/2)), It=RN/2, Dt=NU-22;
  let rafId=null, isShooting=false, shotsSinceAd=0; const SHOTS_PER_AD=30;
  // animaciones bajo consumo
  let popTexts=[]; // {x,y,text,color,life,maxLife,scale}
  let combo=0, lastPopTime=0;
  const COMBO_WORDS = ["Nice!","Good!","Great!","Very Good!","Excellent!","Amazing!","Incredible!","LEGENDARY!"];
  function addPopAnim(r,c,colIndex,count,isFloating){
    const p = Oe(r,c);
    let txt = "";
    let bonus = "";
    if(isFloating) txt = "Drop!";
    else {
      if(count>=8) txt = COMBO_WORDS[7];
      else if(count>=7) txt = COMBO_WORDS[6];
      else if(count>=6) txt = COMBO_WORDS[5];
      else if(count>=5) txt = COMBO_WORDS[4];
      else if(count>=4) txt = COMBO_WORDS[3];
      else if(count>=3) txt = COMBO_WORDS[2];
      else txt = COMBO_WORDS[0];
    }
    const now = Date.now();
    if(now - lastPopTime < 2000 && !isFloating) combo++; else combo=1;
    lastPopTime = now;
    if(combo>1) bonus = ` Combo x${combo}!`;
    popTexts.push({
      x:p.x, y:p.y, text: txt+bonus,
      color: PAL[colIndex] || "#fff",
      life: 60, maxLife: 60,
      scale: 0.5,
      isCombo: combo>1
    });
    // limit array
    if(popTexts.length>6) popTexts.shift();
  }


  const spriteCanvases = PAL.map(col=>{
    const s=document.createElement('canvas'); s.width=WE; s.height=WE; const sc=s.getContext('2d');
    sc.fillStyle=col; sc.beginPath(); sc.arc(WE/2,WE/2,WE/2-1,0,Math.PI*2); sc.fill(); sc.fillStyle='rgba(255,255,255,.35)'; sc.beginPath(); sc.arc(WE*0.35,WE*0.35,WE*0.18,0,Math.PI*2); sc.fill(); return s;
  });

  async function startSess(){ try{ const email=localStorage.getItem('wasa_email'), wallet=localStorage.getItem('wasa_wallet'), device_id=getDeviceId(); const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start_game_session',email,wallet,device_id,game_slug:'puzzle-bubble',level})}); const j=await r.json(); if(j.ok) sess=j.session_id; }catch(e){} }
  async function claim(isDouble, ad){ if(claiming) return {ok:false}; if(!sess) await startSess(); if(!sess) return {ok:false}; claiming=true; try{ const email=localStorage.getItem('wasa_email'), wallet=localStorage.getItem('wasa_wallet'), device_id=getDeviceId(); const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'claim_reward',session_id:sess,email,wallet,device_id,game_slug:'puzzle-bubble',level,ad_watched:ad,double_reward:isDouble,time_taken:30})}); const j=await r.json(); if(j.ok){ const bal=j.wasa_balance??j.guest_balance??0; if(j.is_guest){ localStorage.setItem('wasa_coins_guest',bal); localStorage.setItem('wasa_coins','0'); } else localStorage.setItem('wasa_coins',bal); if(window.setCoinsUI) window.setCoinsUI(bal); sess=null; claiming=false; return j; } claiming=false; return {ok:false}; }catch(e){ claiming=false; return {ok:false}; } }
  function openAd(t){ if(window.vrAd!==0) return; pend=t; window.vrAdType=t; window.vrAd=1; }
  function checkAd(){ if(shotsSinceAd>=SHOTS_PER_AD){ shotsSinceAd=0; if(window.vrAd===0 && !isShooting){ pend='inter'; window.vrAdType='inter'; window.vrAd=1; } } }

  function initGrid(){
    let rows=Math.min(7,5+Math.floor(level/3)); grid=Array.from({length:Q},()=>Array(B).fill(null));
    for(let r=0;r<rows;r++){ let cols=r%2===1?B-1:B; for(let c=0;c<cols;c++){ if(level===1&&Math.random()<0.12) continue; grid[r][c]=Math.floor(Math.random()*colors()); } }
    for(let r=0;r<Q;r++) if(r%2===1) grid[r][B-1]=null;
    popped=0; shot=0; ceilT=maxT(); cur=Math.floor(Math.random()*colors()); nxt=Math.floor(Math.random()*colors()); angle=-90; shooting=null; isShooting=false; ghost=null; traj=[]; score=0; startSess(); updateUI(); startCeil(); drawBoard();
  }
  function startCeil(){ if(ceilIv) clearInterval(ceilIv); ceilIv=setInterval(()=>{ ceilT--; updateUI(); if(ceilT<=0){ pushCeil(); ceilT=maxT(); } },1000); }

  function pushCeil(){
    if(isShooting) return;
    const old = tu(grid);
    let ng=Array.from({length:Q},()=>Array(B).fill(null));
    // FIX COLOR: shift with parity preservation
    for(let r=Q-1;r>0;r--){
      let srcRow = old[r-1];
      let newRow = [...srcRow];
      // if dest row is odd, last col must be null (no color change, just trim)
      if(r%2===1) newRow[B-1]=null;
      ng[r]=newRow;
    }
    let nr=Array(B).fill(null);
    for(let c=0;c<B-1;c++){ if(Math.random()>0.15) nr[c]=Math.floor(Math.random()*colors()); }
    nr[B-1]=null;
    ng[0]=nr;
    // FIX FLOATING: remove disconnected after push (these are the orange flotantes de tu captura)
    let floating = hm(ng);
    if(floating.length>0){
      floating.forEach(([rr,cc])=> ng[rr][cc]=null );
      popped+=floating.length;
      score+=floating.length*5;
    }
    if(ng[Q-1].some(v=>v!==null)){ lose(); return; }
    grid=ng; shot=0; updateUI(); drawBoard();
  }

  function updateUI(){
    container.querySelector('#pb6lvl').textContent='LVL '+level;
    container.querySelector('#pb6obj').textContent=popped+'/'+target();
    container.querySelector('#pb6tm').textContent=ceilT+'s / '+need();
    container.querySelector('#pb6sc').textContent=score;
    container.querySelector('#pb6bar').style.width=Math.min(100,popped/target()*100)+'%';
    container.querySelector('#pb6ceil').textContent=ceilT+'s';
    const nxtEl=container.querySelector('#pb6nxt'); if(nxtEl) nxtEl.style.background=PAL[nxt];
  }
  function drawBoard(){
    ctx.fillStyle='#0f0f17'; ctx.fillRect(0,0,RN,NU);
    if(traj.length>1){
      ctx.strokeStyle='rgba(255,255,255,.25)'; ctx.lineWidth=1; ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(traj[0].x,traj[0].y); for(let i=1;i<traj.length;i++) ctx.lineTo(traj[i].x,traj[i].y); ctx.stroke(); ctx.setLineDash([]);
    }
    for(let r=0;r<Q;r++) for(let c=0;c<B;c++){ if(r%2===1 && c>=B-1) continue; let col=grid[r][c]; if(col==null) continue; let {x,y}=Oe(r,c); ctx.drawImage(spriteCanvases[col], x-WE/2, y-WE/2); }
    if(isShooting && shooting){ ctx.drawImage(spriteCanvases[shooting.col], shooting.x-WE/2, shooting.y-WE/2); }
    // animaciones bajo consumo - textos flotantes
    for(let t of popTexts){
      let alpha = t.life / t.maxLife;
      if(alpha<=0) continue;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(t.x, t.y - (t.maxLife - t.life)*0.8);
      ctx.scale(t.scale, t.scale);
      ctx.font = `900 ${t.isCombo?18:14}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0,0,0,0.8)';
      ctx.strokeText(t.text, 0, 0);
      ctx.fillStyle = t.color;
      // brillo
      ctx.shadowColor = t.color;
      ctx.shadowBlur = t.isCombo?12:6;
      ctx.fillText(t.text, 0, 0);
      ctx.restore();
    }
    // update life
    for(let t of popTexts){ t.life--; t.scale += 0.015; }
    popTexts = popTexts.filter(t=>t.life>0);
    if(popTexts.length>0 && !isShooting){
      if(rafId) cancelAnimationFrame(rafId);
      rafId=requestAnimationFrame(()=>{ drawBoard(); });
    }

    ctx.fillStyle='#1b1b27'; ctx.beginPath(); ctx.arc(It,Dt,28,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='rgba(255,255,255,.15)'; ctx.stroke();
    ctx.drawImage(spriteCanvases[cur], It-16, Dt-16, 32,32);
  }
  function loop(){
    if(isShooting && shooting){
      shooting.x+=shooting.dirX*14; shooting.y+=shooting.dirY*14;
      if(shooting.x<=WE/2+2||shooting.x>=RN-WE/2-2){ shooting.dirX*=-1; shooting.x=Math.max(WE/2+2,Math.min(RN-WE/2-2,shooting.x)); }
      if(shooting.y<=WE/2+10){ let p=lu(shooting.x,shooting.y,grid); if(p) place(p.r,p.c,shooting.col); else { isShooting=false; shooting=null; drawBoard(); } return; }
      for(let r=0;r<Q;r++) for(let c=0;c<B;c++){ if(r%2===1 && c>=B-1) continue; if(grid[r][c]===null)continue; let g=Oe(r,c); if(Math.hypot(g.x-shooting.x,g.y-shooting.y)<WE*0.9){ let p=lu(shooting.x,shooting.y,grid); if(p) place(p.r,p.c,shooting.col); else { isShooting=false; shooting=null; drawBoard(); } return; } }
      drawBoard(); rafId=requestAnimationFrame(loop);
    }
  }
  function place(r,c,col){
    let pendingCol=col; isShooting=false; shooting=null; if(rafId){ cancelAnimationFrame(rafId); rafId=null; }
    if(r%2===1 && c>=B-1) c=B-2;
    if(grid[r][c]!==null){ let alt=lu(Oe(r,c).x,Oe(r,c).y,grid); if(!alt){ shot++; shotsSinceAd++; checkAd(); updateUI(); drawBoard(); return; } r=alt.r; c=alt.c; }
    let ng=tu(grid); ng[r][c]=pendingCol;
    if(r%2===1) ng[r][B-1]=null;
    if(!isConnectedTop(ng,r,c)){ ng[r][c]=null; shot++; shotsSinceAd++; checkAd(); updateUI(); grid=ng; drawBoard(); return; }
    let conn=vm(ng,r,c);
    if(conn.length>=3){
      // animacion del color principal
      addPopAnim(r,c,ng[r][c],conn.length,false);
      // si hay muchas flotantes, anim extra
      conn.forEach(([rr,cc])=> ng[rr][cc]=null );
      let floating=hm(ng); 
      if(floating.length>0){
        // anim de drop en el centro de flotantes
        let avgR = floating.reduce((s,[rr])=>s+rr,0)/floating.length;
        let avgC = floating.reduce((s,[,cc])=>s+cc,0)/floating.length;
        addPopAnim(Math.floor(avgR),Math.floor(avgC),ng[r][c],floating.length,true);
      }
      floating.forEach(([rr,cc])=> ng[rr][cc]=null );

      popped+=conn.length+floating.length; score+=conn.length*15+floating.length*8;
      grid=ng; shot++; shotsSinceAd++; checkAd(); updateUI(); drawBoard();
      if(popped>=target()||grid.flat().every(v=>v===null)){ win(); return; }
    } else { grid=ng; shot++; shotsSinceAd++; checkAd(); updateUI(); drawBoard(); }
    if(shot>=need()){ pushCeil(); ceilT=maxT(); shot=0; } cur=nxt; nxt=Math.floor(Math.random()*colors()); updateUI(); drawBoard(); if(grid[Q-1].some(v=>v!==null)) lose();
  }
  function win(){
    if(ceilIv) clearInterval(ceilIv); isShooting=false; shooting=null; if(rafId) cancelAnimationFrame(rafId);
    ui.innerHTML=`<div class="pb6-win"><div class="pb6-card"><div style="font-size:28px">✓</div><h2 style="font-size:18px;font-weight:900;margin-top:8px">¡NIVEL ${level}!</h2><div style="margin-top:12px;background:#0e0e14;border-radius:12px;padding:12px"><button id="bCl" style="width:100%;height:44px;border-radius:22px;background:#fff;color:#000;font-weight:900">RECLAMAR +0.01 WASA</button><button id="bX2" style="margin-top:8px;width:100%;height:44px;border-radius:22px;background:linear-gradient(90deg,#FF00D4,#00F0FF);color:#fff;font-weight:900">X2 ANUNCIO → 0.02</button></div></div></div>`;
    ui.querySelector('#bCl').onclick=async()=>{ let b=ui.querySelector('#bCl'); b.textContent='VALIDANDO...'; b.disabled=true; let r=await claim(false,false); if(r.ok){ level++; localStorage.setItem('pb_level',level); ui.innerHTML=`<div class="pb6-win"><div class="pb6-card"><div style="font-size:28px">✅</div><div style="font-weight:900;margin:8px 0">+0.01 ACREDITADO</div><button id="ok" style="width:100%;height:44px;border-radius:22px;background:#fff;color:#000;font-weight:900">LVL ${level}</button></div></div>`; ui.querySelector('#ok').onclick=()=>{ ui.innerHTML=''; initGrid(); }; } else { b.textContent='REINTENTAR'; b.disabled=false; } };
    ui.querySelector('#bX2').onclick=()=>{ openAd('double'); ui.querySelector('#bX2').textContent='CARGANDO AD...'; };
  }
  function lose(){ if(ceilIv) clearInterval(ceilIv); isShooting=false; shooting=null; if(rafId) cancelAnimationFrame(rafId); ui.innerHTML=`<div class="pb6-win"><div class="pb6-card" style="background:#1a1012"><div style="font-size:28px">✕</div><h2 style="margin-top:8px">TECHO ALCANZADO</h2><div style="display:flex;gap:8px;margin-top:12px"><button id="bAg" style="flex:1;height:40px;border-radius:20px;background:#fff;color:#000;font-weight:800">REINTENTAR</button><button id="bR" style="flex:1;height:40px;border-radius:20px;background:#222;color:#fff">RESET</button></div></div></div>`; ui.querySelector('#bAg').onclick=()=>{ ui.innerHTML=''; initGrid(); }; ui.querySelector('#bR').onclick=()=>{ level=1; localStorage.setItem('pb_level',1); ui.innerHTML=''; initGrid(); }; }

  function shoot(){ if(isShooting) return; let rad=angle*Math.PI/180; shooting={x:It,y:Dt,dirX:Math.cos(rad),dirY:Math.sin(rad),col:cur}; isShooting=true; if(rafId) cancelAnimationFrame(rafId); rafId=requestAnimationFrame(loop); }

  function getPos(e){ const rect=canvas.getBoundingClientRect(); const scaleX=RN/rect.width, scaleY=NU/rect.height; const clientX=e.touches?e.touches[0].clientX:e.clientX; const clientY=e.touches?e.touches[0].clientY:e.clientY; return {x:(clientX-rect.left)*scaleX, y:(clientY-rect.top)*scaleY}; }
  canvas.addEventListener('pointermove', e=>{ if(isShooting) return; let {x,y}=getPos(e); let ang=Math.atan2(y-Dt,x-It)*180/Math.PI; if(ang>-15) ang=-15; if(ang<-165) ang=-165; angle=ang; let g=ym(angle,grid,It,Dt); ghost=g?{x:g.x,y:g.y}:null; traj=gm(angle,grid,It,Dt); drawBoard(); }, {passive:true});
  canvas.addEventListener('pointerdown', e=>{ e.preventDefault(); let {x,y}=getPos(e); let ang=Math.atan2(y-Dt,x-It)*180/Math.PI; if(ang>-15) ang=-15; if(ang<-165) ang=-165; angle=ang; shoot(); }, {passive:false});
  window.addEventListener('keydown', e=>{ if(e.code==='ArrowLeft') angle=Math.max(-165,angle-4); if(e.code==='ArrowRight') angle=Math.min(-15,angle+4); if(e.code==='Space'||e.code==='ArrowUp'){ e.preventDefault(); shoot(); } let g=ym(angle,grid,It,Dt); ghost=g?{x:g.x,y:g.y}:null; traj=gm(angle,grid,It,Dt); drawBoard(); });

  let adIv=setInterval(async()=>{ if(window.vrAd===4 && pend){ let t=pend; pend=null; window.vrAd=0; window.vrAdType=null; window._gm_shown=false; if(t==='inter'){ shotsSinceAd=0; } else { let r=await claim(true,true); if(r.ok){ level++; localStorage.setItem('pb_level',level); ui.innerHTML=`<div class="pb6-win"><div class="pb6-card"><div style="font-size:28px">✅</div><div style="font-weight:900">X2 +0.02</div><button id="ok2" style="margin-top:10px;width:100%;height:44px;border-radius:22px;background:#fff;color:#000;font-weight:900">LVL ${level}</button></div></div>`; ui.querySelector('#ok2').onclick=()=>{ ui.innerHTML=''; initGrid(); }; } } } },500);

  initGrid();
  container._cleanup=()=>{ clearInterval(ceilIv); clearInterval(adIv); if(rafId) cancelAnimationFrame(rafId); window.vrAd=0; };
}
