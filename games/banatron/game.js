export function init(container, args){
  const getCoins = args.getCoins||(()=>parseInt(localStorage.getItem('wasa_coins')||'0'));
  const setCoins = args.setCoins||((n)=>localStorage.setItem('wasa_coins',n));
  container.innerHTML = `
    <style>
      .bt{width:100%;height:100%;position:relative;background:#020617;overflow:hidden;font-family:Inter,system-ui,sans-serif}
      .bt canvas{width:100%;height:100%;display:block}
      .bt-ui{position:absolute;inset:0;pointer-events:none}
      .bt-ui button{pointer-events:auto}
    </style>
    <div class="bt"><canvas id="c"></canvas><div id="ui" class="bt-ui"></div></div>
  `;
  const wrap=container.querySelector('.bt');
  const canvas=wrap.querySelector('#c');
  const ctx=canvas.getContext('2d');
  const ui=wrap.querySelector('#ui');
  let W=wrap.clientWidth,H=wrap.clientHeight;
  function resize(){W=wrap.clientWidth;H=wrap.clientHeight;const dpr=devicePixelRatio||1;canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0);}
  resize(); const ro=new ResizeObserver(resize); ro.observe(wrap);
  let ups=JSON.parse(localStorage.getItem('wasa_upgrades_bananatron')||'{"v":{"main":0,"sub":0}}');
  if(!ups.v) ups={v:{main:0,sub:0}};
  let maxRound=parseInt(localStorage.getItem('wasa_bananatron_max')||'1');
  let coins=getCoins();
  const COLS=64, ROWS=44;
  let cellW, cellH, offsetX, offsetY;
  function calcMetrics(){
    const border=12;
    const availW=W-border*2, availH=H*0.82-border*2;
    cellW=Math.floor(availW/COLS); cellH=Math.floor(availH/ROWS);
    const cs=Math.min(cellW,cellH); cellW=cs; cellH=cs;
    offsetX=Math.floor((W - COLS*cs)/2);
    offsetY=Math.floor((H*0.82 - ROWS*cs)/2)+border;
  }
  calcMetrics();
  let state='menu';
  let round=1, greenWins=0, redWins=0;
  let grid, p1, p2, tick=0, tempCoins=0;
  let _rewardPending=null;
  const DIRS=[{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
  function getTotalLevel(){ return ups.v.main*5 + ups.v.sub; }
  function getMaxLevel(){ return 100; }
  function saveUps(){localStorage.setItem('wasa_upgrades_bananatron',JSON.stringify(ups));}
  function saveMax(){if(round>maxRound){maxRound=round;localStorage.setItem('wasa_bananatron_max',maxRound);}}
  function getUpgradeCost(main, sub){ const total = main*5+sub; return Math.floor(60 + total*18 + Math.pow(total,1.35)*2); }
  function getRivalInterval(lvl){ return Math.max(22, 135 - lvl*3.2 - Math.pow(lvl,0.65)*4); }
  function getPlayerInterval(){ const total=getTotalLevel(); return Math.max(18, 115 - total*0.68 - ups.v.main*0.8); }
  function newGrid(){ const g=[]; for(let y=0;y<ROWS;y++){ g[y]=[]; for(let x=0;x<COLS;x++) g[y][x]=0; } return g; }
  function resetRound(r){
    round=r; grid=newGrid();
    p1={x:Math.floor(COLS*0.18), y:Math.floor(ROWS*0.5), dir:1, trail:[], alive:true};
    p2={x:Math.floor(COLS*0.82), y:Math.floor(ROWS*0.5), dir:3, trail:[], alive:true};
    grid[p1.y][p1.x]=1; grid[p2.y][p2.x]=2;
    p1.trail.push({x:p1.x,y:p1.y}); p2.trail.push({x:p2.x,y:p2.y});
    tick=0; tempCoins=0;
  }
  function canMove(x,y){ if(x<0||x>=COLS||y<0||y>=ROWS) return false; return grid[y][x]===0; }
  function floodFull(sx,sy){
    if(!canMove(sx,sy)) return {count:0};
    const visited=new Set();
    const q=[[sx,sy]];
    visited.add(sx+','+sy);
    let head=0;
    while(head<q.length){
      const [x,y]=q[head++];
      for(let d=0;d<4;d++){
        const nx=x+DIRS[d].x, ny=y+DIRS[d].y;
        const key=nx+','+ny;
        if(nx<0||nx>=COLS||ny<0||ny>=ROWS) continue;
        if(visited.has(key)) continue;
        if(grid[ny][nx]!==0) continue;
        visited.add(key);
        q.push([nx,ny]);
      }
    }
    return {count:visited.size, cells:visited};
  }
  function voronoiAfterMove(aiNx, aiNy, p1x, p1y){
    const aiVisited=new Set();
    const p1Visited=new Set();
    const aiQ=[[aiNx,aiNy]];
    const p1Q=[[p1x,p1y]];
    aiVisited.add(aiNx+','+aiNy);
    p1Visited.add(p1x+','+p1y);
    let aiHead=0, p1Head=0;
    while(aiHead<aiQ.length || p1Head<p1Q.length){
      const aiLevelSize=aiQ.length-aiHead;
      for(let i=0;i<aiLevelSize;i++){
        const [x,y]=aiQ[aiHead++];
        for(let d=0;d<4;d++){
          const nx=x+DIRS[d].x, ny=y+DIRS[d].y;
          const key=nx+','+ny;
          if(nx<0||nx>=COLS||ny<0||ny>=ROWS) continue;
          if(aiVisited.has(key)||p1Visited.has(key)) continue;
          if(grid[ny][nx]!==0) continue;
          if(nx===p1x && ny===p1y) continue;
          aiVisited.add(key);
          aiQ.push([nx,ny]);
        }
      }
      const p1LevelSize=p1Q.length-p1Head;
      for(let i=0;i<p1LevelSize;i++){
        const [x,y]=p1Q[p1Head++];
        for(let d=0;d<4;d++){
          const nx=x+DIRS[d].x, ny=y+DIRS[d].y;
          const key=nx+','+ny;
          if(nx<0||nx>=COLS||ny<0||ny>=ROWS) continue;
          if(aiVisited.has(key)||p1Visited.has(key)) continue;
          if(grid[ny][nx]!==0) continue;
          if(nx===aiNx && ny===aiNy) continue;
          p1Visited.add(key);
          p1Q.push([nx,ny]);
        }
      }
      if(aiQ.length>1000 || p1Q.length>1000) break;
    }
    return {ai: aiVisited.size, p1: p1Visited.size};
  }
  function aiChoose(){
    const curDir=p2.dir;
    const candidates=[];
    const order=[0,-1,1];
    for(let o of order){
      let nd=(curDir+o+4)%4;
      const nx=p2.x+DIRS[nd].x, ny=p2.y+DIRS[nd].y;
      if(!canMove(nx,ny)) continue;
      const myFlood = floodFull(nx,ny);
      const p1Flood = floodFull(p1.x,p1.y);
      const vor = voronoiAfterMove(nx,ny,p1.x,p1.y);
      let exits=0;
      for(let d=0;d<4;d++){
        if(d===(nd+2)%4) continue;
        const ex=nx+DIRS[d].x, ey=ny+DIRS[d].y;
        if(canMove(ex,ey)) exits++;
      }
      let score=0;
      if(myFlood.count===0) score -= 10000;
      else if(myFlood.count<5) score -= 5000;
      else if(myFlood.count<12) score -= 400;
      else score += myFlood.count*2.5;
      score += (vor.ai - vor.p1*1.8)*4;
      if(p1Flood.count<8) score += 600;
      if(p1Flood.count<15) score += 300;
      if(p1Flood.count<25) score += 100;
      if(vor.p1<8) score += 1000;
      if(vor.p1<15) score += 500;
      if(vor.p1<25) score += 200;
      const curDist = Math.abs(p2.x-p1.x)+Math.abs(p2.y-p1.y);
      const newDist = Math.abs(nx-p1.x)+Math.abs(ny-p1.y);
      if(curDist<20 && newDist<curDist) score+= 60;
      if(exits===0) score -= 2000;
      if(exits===1 && myFlood.count<30) score -= 300;
      if(o===0) score+=4;
      candidates.push({dir:nd, score, my:myFlood.count, p1:p1Flood.count, vor, exits});
    }
    if(candidates.length===0){
      const back=(curDir+2)%4;
      const bx=p2.x+DIRS[back].x, by=p2.y+DIRS[back].y;
      if(canMove(bx,by)) return back;
      return curDir;
    }
    candidates.sort((a,b)=>b.score-a.score);
    return candidates[0].dir;
  }
  function step(){
    if(p1.alive){
      const nx=p1.x+DIRS[p1.dir].x, ny=p1.y+DIRS[p1.dir].y;
      if(!canMove(nx,ny)) p1.alive=false;
      else{ p1.x=nx; p1.y=ny; grid[ny][nx]=1; p1.trail.push({x:nx,y:ny}); }
    }
    if(p2.alive){
      p2.dir=aiChoose();
      const nx=p2.x+DIRS[p2.dir].x, ny=p2.y+DIRS[p2.dir].y;
      if(!canMove(nx,ny)) p2.alive=false;
      else{ p2.x=nx; p2.y=ny; grid[ny][nx]=2; p2.trail.push({x:nx,y:ny}); }
    }
    if(p1.alive && p2.alive && p1.x===p2.x && p1.y===p2.y){ p1.alive=false; p2.alive=false; }
    tick++;
  }
  function openAd(type){ if(window.vrAd!==0) return; _rewardPending=type; window.vrAdType=type; window.vrAd=1; state='paused_ad'; }
  function claimReward(){
    const t=_rewardPending; _rewardPending=null; window.vrAd=0; window.vrAdType=null; window._gm_shown=false;
    if(t==='double'){ tempCoins*=2; coins+=tempCoins; setCoins(coins); state='roundover'; renderUI(); }
  }
  function renderUpgrades(){
    const total=getTotalLevel(); const pct=Math.round(total/100*100);
    const m=ups.v.main, s=ups.v.sub; const cost=getUpgradeCost(m,s);
    let nM=m, nS=s+1; if(nS>=5){ nM++; nS=0; }
    const nextTotal=nM*5+nS;
    const curMax=getPlayerInterval(), nextMax=Math.max(18,115-nextTotal*0.68-nM*0.8);
    const canBuy=coins>=cost && total<100;
    ui.innerHTML=`
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,#020617,#0f172a);padding:12px;overflow:auto">
        <div style="display:flex;justify-content:space-between"><div style="color:white;font-weight:900">MEJORAS • IA IMPOSIBLE</div><div style="color:#22c55e;font-size:12px">$WASA ${coins}</div></div>
        <div style="margin-top:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(239,68,68,0.35);border-radius:16px;padding:14px">
          <div style="display:flex;justify-content:space-between"><div style="color:white;font-weight:800">⚡ LÍNEA VERDE</div><div style="color:#22c55e;font-weight:800">${total}/100 • ${pct}%</div></div>
          <div style="margin-top:8px;height:10px;background:rgba(0,0,0,0.5);border-radius:999px;display:flex;gap:2px;padding:2px">
            ${Array.from({length:20}).map((_,mi)=>{ const f=mi<m?1:mi===m?s/5:0; return `<div style="flex:1;background:rgba(0,0,0,0.4);border-radius:999px;overflow:hidden"><div style="height:100%;width:${f*100}%;background:linear-gradient(90deg,#22c55e,#16a34a)"></div></div>`; }).join('')}
          </div>
          <div style="margin-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px">
            <div style="background:rgba(0,0,0,0.3);border-radius:10px;padding:8px"><div style="color:#94a3b8">Tu tick</div><div style="color:white;font-weight:800">${curMax.toFixed(0)}ms</div></div>
            <div style="background:rgba(239,68,68,0.12);border-radius:10px;padding:8px"><div style="color:#fca5a5">Rival R${round} IA VORONOI</div><div style="color:white;font-weight:800">${getRivalInterval(round).toFixed(0)}ms • 0% error</div></div>
          </div>
          <button id="buy" style="margin-top:12px;width:100%;background:${canBuy?'linear-gradient(135deg,#22c55e,#16a34a)':'#1e293b'};color:${canBuy?'black':'#475569'};padding:12px;border-radius:999px;font-weight:900">${total>=100?'MAX 100/100':`MEJORAR ${m}-${s} → ${nM}-${nS} • ${cost} $WASA`}</button>
          <div style="margin-top:6px;font-size:9px;color:#f87171;text-align:center">IA con Voronoi full + flood. Nunca se equivoca. Te encierra con &lt;15 celdas. Rival +3.2ms/lvl ahora (antes +1.6)</div>
        </div>
        <div style="margin-top:12px;display:flex;gap:8px"><button id="back" style="flex:1;background:white;color:black;padding:10px;border-radius:999px;font-weight:800">VOLVER</button><button id="play" style="flex:1;background:#ef4444;color:white;padding:10px;border-radius:999px;font-weight:800">JUGAR VS IMPOSIBLE</button></div>
      </div>
    `;
    ui.querySelector('#buy')?.addEventListener('click',()=>{ if(total>=100||coins<cost) return; coins-=cost; setCoins(coins); ups.v.sub++; if(ups.v.sub>=5){ ups.v.sub=0; ups.v.main++; } saveUps(); renderUpgrades(); });
    ui.querySelector('#back').onclick=()=>{ state='menu'; renderUI(); };
    ui.querySelector('#play').onclick=()=>{ resetRound(round); state='playing'; renderUI(); };
  }
  function renderUI(){
    if(state==='menu'){
      const total=getTotalLevel();
      ui.innerHTML=`
        <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.18), transparent 60%), linear-gradient(180deg,#020617,#0a0e1e);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14px;text-align:center">
          <div style="font-size:10px;letter-spacing:0.3em;color:#ef4444">IA IMPOSIBLE • NO SE EQUIVOCA • VORONOI</div>
          <div style="margin-top:6px;font-size:38px;font-weight:900;color:white;line-height:0.9">BANANA<span style="color:#22c55e">TRON</span></div>
          <div style="margin-top:6px;color:#64748b;font-size:10px">R${round} • GRE ${greenWins} RED ${redWins} • MAX ${maxRound} • VEL ${total}/100 • DIFICIL</div>
          <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px;width:100%;max-width:280px">
            <button id="play" style="background:linear-gradient(135deg,#ef4444,#dc2626);color:white;font-weight:900;padding:12px;border-radius:999px;box-shadow:0 0 20px rgba(239,68,68,0.4)">JUGAR VS IA IMPOSIBLE R${round}</button>
            <div style="display:flex;gap:8px"><button id="upg" style="flex:1;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.25);color:#22c55e;padding:10px;border-radius:999px;font-weight:800">⚡ ${total}/100</button><button id="reset" style="flex:1;background:rgba(255,255,255,0.06);color:#94a3b8;padding:10px;border-radius:999px">Reset</button></div>
          </div>
          <div style="margin-top:10px;font-size:9px;color:#fca5a5">Ahora el rojo no falla nunca y te corta a proposito. Si te gana facil, subi tu velocidad en mejoras.</div>
        </div>
      `;
      ui.querySelector('#play').onclick=()=>{ resetRound(round); state='playing'; renderUI(); };
      ui.querySelector('#upg').onclick=()=>{ state='upgrades'; renderUpgrades(); };
      ui.querySelector('#reset').onclick=()=>{ round=1; greenWins=0; redWins=0; renderUI(); };
    }else if(state==='upgrades'){ renderUpgrades(); }
    else if(state==='playing'){
      ui.innerHTML=`
        <div style="position:absolute;top:6px;left:8px;right:8px;display:flex;justify-content:space-between;font-size:10px;color:white;font-family:monospace">
          <div style="color:#f87171">R${round} IA IMPOSIBLE • VORONOI</div>
          <div style="color:#22c55e">${getTotalLevel()}/100</div>
        </div>
      `;
    }else if(state==='roundover'){
      const winGreen=p1.alive && !p2.alive;
      if(winGreen) greenWins++; else redWins++;
      if(winGreen) tempCoins=30+round*5; else tempCoins=10;
      saveMax();
      ui.innerHTML=`
        <div style="position:absolute;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;padding:10px">
          <div style="background:#0f172a;border:2px solid ${winGreen?'#22c55e':'#ef4444'};border-radius:14px;padding:14px;width:100%;max-width:320px;text-align:center">
            <div style="font-size:11px;letter-spacing:0.2em;color:${winGreen?'#22c55e':'#ef4444'}">${winGreen?'LE GANASTE A LA IA IMPOSIBLE!':'LA IA TE ENCERRO'}</div>
            <div style="color:white;font-weight:900;margin-top:6px">R${round} ${winGreen?'GANASTE':'PERDISTE'}</div>
            <div style="margin-top:8px;font-size:10px;color:#94a3b8">${winGreen?'Increible, esta IA no pierde casi nunca':'Te dejo sin espacio con Voronoi'}</div>
            <div style="margin-top:10px;display:flex;flex-direction:column;gap:8px"><button id="dbl" style="background:linear-gradient(135deg,#22c55e,#16a34a);color:black;font-weight:900;padding:10px;border-radius:999px">📺 x2 (${tempCoins*2})</button><button id="next" style="background:white;color:black;font-weight:800;padding:10px;border-radius:999px">SIGUIENTE R${round+1}</button></div>
          </div>
        </div>
      `;
      ui.querySelector('#dbl').onclick=()=>openAd('double');
      ui.querySelector('#next').onclick=()=>{ coins+=tempCoins; setCoins(coins); resetRound(round+1); state='playing'; renderUI(); };
    }else if(state==='paused_ad'){ ui.innerHTML=`<div style="position:absolute;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;color:white">Cargando...</div>`; }
    else if(state==='reward_modal'){ ui.innerHTML=`<div style="position:absolute;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;padding:10px"><div style="background:#0f172a;border:1px solid #22c55e;border-radius:12px;padding:12px;width:100%;max-width:260px;text-align:center"><div style="color:#22c55e;font-weight:900">¡RECOMPENSA!</div><button id="claim" style="margin-top:8px;width:100%;background:#22c55e;color:black;font-weight:900;padding:10px;border-radius:999px">RECLAMAR</button></div></div>`; ui.querySelector('#claim').onclick=claimReward; }
  }
  addEventListener('keydown',e=>{
    if(state!=='playing') return;
    if((e.key==='ArrowUp'||e.key==='w') && p1.dir!==2) p1.dir=0;
    if((e.key==='ArrowRight'||e.key==='d') && p1.dir!==3) p1.dir=1;
    if((e.key==='ArrowDown'||e.key==='s') && p1.dir!==0) p1.dir=2;
    if((e.key==='ArrowLeft'||e.key==='a') && p1.dir!==1) p1.dir=3;
  });
  let touchStart=null;
  canvas.addEventListener('pointerdown',e=>{ const r=canvas.getBoundingClientRect(); touchStart={x:e.clientX-r.left,y:e.clientY-r.top}; });
  canvas.addEventListener('pointerup',e=>{
    if(!touchStart||state!=='playing') return;
    const r=canvas.getBoundingClientRect(); const dx=(e.clientX-r.left)-touchStart.x, dy=(e.clientY-r.top)-touchStart.y;
    if(Math.abs(dx)>Math.abs(dy)){ if(dx>20 && p1.dir!==3) p1.dir=1; else if(dx<-20 && p1.dir!==1) p1.dir=3; }
    else{ if(dy>20 && p1.dir!==0) p1.dir=2; else if(dy<-20 && p1.dir!==2) p1.dir=0; }
    touchStart=null;
  });
  let watcher=setInterval(()=>{ if(window.vrAd===4 && _rewardPending && state!=='reward_modal'){ state='reward_modal'; renderUI(); } },150);
  let raf, acc=0, last=performance.now();
  function loop(now){
    if(window.vrAd===1||window.vrAd===2||window.vrAd===3){ raf=requestAnimationFrame(loop); return; }
    const dt=Math.min((now-last)/1000,0.033); last=now; acc+=dt*1000;
    if(state==='playing'){
      if(acc >= getPlayerInterval()){
        acc=0; step(); if(!p1.alive || !p2.alive){ state='roundover'; renderUI(); }
      }
    }
    calcMetrics();
    ctx.fillStyle='black'; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='#1e40af'; ctx.lineWidth=3; ctx.strokeRect(offsetX-2, offsetY-2, COLS*cellW+4, ROWS*cellH+4);
    for(let i=1;i<p1.trail.length;i++){
      const a=p1.trail[i-1], b=p1.trail[i];
      ctx.strokeStyle='#22c55e'; ctx.lineWidth=Math.max(2,cellW*0.5); ctx.setLineDash([cellW*0.9, cellW*0.5]);
      ctx.beginPath(); ctx.moveTo(offsetX+a.x*cellW+cellW/2, offsetY+a.y*cellH+cellH/2); ctx.lineTo(offsetX+b.x*cellW+cellW/2, offsetY+b.y*cellH+cellH/2); ctx.stroke();
    }
    for(let i=1;i<p2.trail.length;i++){
      const a=p2.trail[i-1], b=p2.trail[i];
      ctx.strokeStyle='#ef4444'; ctx.lineWidth=Math.max(2,cellW*0.5); ctx.setLineDash([cellW*0.9, cellW*0.5]);
      ctx.beginPath(); ctx.moveTo(offsetX+a.x*cellW+cellW/2, offsetY+a.y*cellH+cellH/2); ctx.lineTo(offsetX+b.x*cellW+cellW/2, offsetY+b.y*cellH+cellH/2); ctx.stroke();
    }
    ctx.setLineDash([]);
    if(p1.trail.length){ const h=p1.trail[p1.trail.length-1]; ctx.fillStyle=p1.alive?'#86efac':'#4ade80'; ctx.fillRect(offsetX+h.x*cellW+1, offsetY+h.y*cellH+1, cellW-2, cellH-2); }
    if(p2.trail.length){ const h=p2.trail[p2.trail.length-1]; ctx.fillStyle=p2.alive?'#fca5a5':'#f87171'; ctx.fillRect(offsetX+h.x*cellW+1, offsetY+h.y*cellH+1, cellW-2, cellH-2); }
    raf=requestAnimationFrame(loop);
  }
  renderUI(); resetRound(maxRound); state='menu'; renderUI();
  raf=requestAnimationFrame(loop);
  container._cleanup=()=>{ cancelAnimationFrame(raf); clearInterval(watcher); ro.disconnect(); window.vrAd=0; };
}
