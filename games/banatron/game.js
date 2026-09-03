export function init(container, args){
  const quality = args.quality||'hd';
  const getCoins = args.getCoins||(()=>parseInt(localStorage.getItem('wasa_coins')||'0'));
  const setCoins = args.setCoins||((n)=>localStorage.setItem('wasa_coins',n));
  const addCoins = args.addCoins||((n)=>setCoins(getCoins()+n));

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

  // 100 niveles subdivididos en 5 como Space Invaders: main 0-19, sub 0-4 => total 0-99
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

  function getTotalLevel(){ return ups.v.main*5 + ups.v.sub; } // 0-99
  function getMaxLevel(){ return 100; }

  function saveUps(){localStorage.setItem('wasa_upgrades_bananatron',JSON.stringify(ups));}
  function saveMax(){if(round>maxRound){maxRound=round;localStorage.setItem('wasa_bananatron_max',maxRound);}}

  function getUpgradeCost(main, sub){
    const total = main*5+sub;
    return Math.floor(60 + total*18 + Math.pow(total,1.35)*2);
  }

  function getRivalInterval(lvl){
    // Rival sube poquito cada nivel: base 135ms - lvl*1.6 - sqrt(lvl)*2.2
    return Math.max(38, 135 - lvl*1.6 - Math.pow(lvl,0.55)*2.2);
  }
  function getPlayerInterval(){
    // Tu linea: 115ms base - totalLevel*0.68 -> a nivel 100 llegas a ~47ms (muy rapida)
    const total=getTotalLevel();
    return Math.max(28, 115 - total*0.68 - ups.v.main*0.8);
  }

  function newGrid(){
    const g=[]; for(let y=0;y<ROWS;y++){ g[y]=[]; for(let x=0;x<COLS;x++) g[y][x]=0; } return g;
  }

  function resetRound(r){
    round=r; grid=newGrid();
    p1={x:Math.floor(COLS*0.18), y:Math.floor(ROWS*0.5), dir:1, trail:[], alive:true, shield:0};
    p2={x:Math.floor(COLS*0.82), y:Math.floor(ROWS*0.5), dir:3, trail:[], alive:true};
    grid[p1.y][p1.x]=1; grid[p2.y][p2.x]=2;
    p1.trail.push({x:p1.x,y:p1.y}); p2.trail.push({x:p2.x,y:p2.y});
    tick=0; tempCoins=0;
  }

  function canMove(x,y){ if(x<0||x>=COLS||y<0||y>=ROWS) return false; return grid[y][x]===0; }

  function aiChoose(){
    const curDir=p2.dir; const options=[];
    const order=[0,-1,1];
    for(let o of order){
      let nd=(curDir+o+4)%4;
      const nx=p2.x+DIRS[nd].x, ny=p2.y+DIRS[nd].y;
      if(canMove(nx,ny)){
        let score=0; let tx=nx, ty=ny;
        for(let s=0;s<9;s++){ if(!canMove(tx,ty)) break; score++; tx+=DIRS[nd].x; ty+=DIRS[nd].y; }
        const distToP1=Math.abs(nx-p1.x)+Math.abs(ny-p1.y);
        if(distToP1 < Math.abs(p2.x-p1.x)+Math.abs(p2.y-p1.y)) score+=0.6;
        options.push({dir:nd,score});
      }
    }
    if(options.length===0){ const back=(curDir+2)%4; return canMove(p2.x+DIRS[back].x,p2.y+DIRS[back].y)?back:curDir; }
    options.sort((a,b)=>b.score-a.score);
    if(options.length>1 && Math.random()<0.18) return options[1].dir;
    return options[0].dir;
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
    else if(t==='continue'){ p1.alive=true; for(let i=0;i<6;i++){ if(p1.trail.length>1){ const c=p1.trail.pop(); grid[c.y][c.x]=0; }} const last=p1.trail[p1.trail.length-1]; p1.x=last.x; p1.y=last.y; state='playing'; renderUI(); }
  }

  function renderUpgrades(){
    const total=getTotalLevel();
    const maxT=getMaxLevel();
    const pct=Math.round(total/maxT*100);
    const nextMain=ups.v.main, nextSub=ups.v.sub;
    const cost=getUpgradeCost(nextMain,nextSub);
    const playerMs=getPlayerInterval();
    const rivalMs=getRivalInterval(round);
    const canBuy=coins>=cost && total<100;

    // Calcular proximo nivel si compra
    let nMain=nextMain, nSub=nextSub+1;
    if(nSub>=5){ nMain++; nSub=0; }
    const nextTotal=nMain*5+nSub;
    const nextPlayerMs=Math.max(28, 115 - nextTotal*0.68 - nMain*0.8);

    ui.innerHTML=`
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,#020617,#0f172a);padding:12px;overflow:auto">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="color:white;font-weight:900;font-size:14px">MEJORAS • VELOCIDAD DE LÍNEA</div>
          <div style="color:#22c55e;font-size:12px;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2);border-radius:999px;padding:4px 10px">$WASA ${coins}</div>
        </div>

        <div style="margin-top:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(34,197,94,0.25);border-radius:16px;padding:14px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="color:white;font-weight:800;font-size:13px">⚡ LÍNEA VERDE • VELOCIDAD</div>
            <div style="color:#22c55e;font-size:11px;font-weight:800">${total}/100 • ${pct}%</div>
          </div>
          <div style="margin-top:8px;height:10px;background:rgba(0,0,0,0.5);border-radius:999px;overflow:hidden;display:flex;gap:2px;padding:2px">
            ${Array.from({length:20}).map((_,mi)=>{
              const filledMain = mi < ups.v.main ? 1 : mi===ups.v.main ? ups.v.sub/5 : 0;
              return `<div style="flex:1;background:rgba(0,0,0,0.4);border-radius:999px;overflow:hidden"><div style="height:100%;width:${filledMain*100}%;background:linear-gradient(90deg,#22c55e,#16a34a);transition:width 0.2s"></div></div>`;
            }).join('')}
          </div>
          <div style="margin-top:6px;display:flex;justify-content:space-between;font-size:9px;color:#64748b"><span>0</span><span>MAIN ${ups.v.main} • SUB ${ups.v.sub}/5</span><span>100</span></div>

          <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px">
            <div style="background:rgba(0,0,0,0.3);border-radius:10px;padding:8px"><div style="color:#94a3b8">Tu velocidad actual</div><div style="color:white;font-weight:800">${(1000/playerMs).toFixed(1)} bloques/s • ${playerMs.toFixed(0)}ms tick</div></div>
            <div style="background:rgba(239,68,68,0.08);border-radius:10px;padding:8px"><div style="color:#fca5a5">Rival Round ${round}</div><div style="color:white;font-weight:800">${(1000/rivalMs).toFixed(1)} bloques/s • ${rivalMs.toFixed(0)}ms</div></div>
          </div>

          <div style="margin-top:10px;background:rgba(34,197,94,0.08);border:1px dashed rgba(34,197,94,0.2);border-radius:10px;padding:8px;font-size:10px;color:#86efac">
            Cada nivel el rival sube <b>+1.6ms más rápido</b> (poquito). Tu mejora te da <b>-0.68ms</b> por sub-nivel y <b>-0.8ms</b> extra por main. A nivel 100 sos casi el doble de rápido que al inicio.
          </div>

          <div style="margin-top:12px;display:flex;gap:8px;align-items:center">
            <button id="buy" style="flex:1;background:${canBuy?'linear-gradient(135deg,#22c55e,#16a34a)':'#1e293b'};color:${canBuy?'black':'#475569'};padding:12px;border-radius:999px;font-weight:900;font-size:13px;opacity:${canBuy?1:0.6}">${total>=100?'MAX 100/100':`MEJORAR ${ups.v.main}-${ups.v.sub} → ${nMain}-${nSub} • ${cost} $WASA`}</button>
          </div>
          ${total<100?`<div style="margin-top:6px;font-size:10px;color:#94a3b8;text-align:center">Próximo: ${nextPlayerMs.toFixed(0)}ms (${(1000/nextPlayerMs).toFixed(1)} bl/s) • Ahorro -${(playerMs-nextPlayerMs).toFixed(1)}ms</div>`:''}
        </div>

        <div style="margin-top:12px;display:flex;gap:8px">
          <button id="back" style="flex:1;background:white;color:black;padding:10px;border-radius:999px;font-weight:800">VOLVER</button>
          <button id="play" style="flex:1;background:#22c55e;color:black;padding:10px;border-radius:999px;font-weight:800">JUGAR ROUND ${round}</button>
        </div>

        <div style="margin-top:10px;font-size:9px;color:#334155;text-align:center">Sistema igual que Space Invaders: 20 mains x 5 subs = 100 niveles. Guardado en wasa_upgrades_bananatron</div>
      </div>
    `;
    ui.querySelector('#buy')?.addEventListener('click',()=>{
      if(total>=100) return;
      if(coins < cost) return;
      coins-=cost; setCoins(coins);
      ups.v.sub++;
      if(ups.v.sub>=5){ ups.v.sub=0; ups.v.main++; }
      if(ups.v.main>=20){ ups.v.main=20; ups.v.sub=0; } // cap 100
      saveUps();
      renderUpgrades();
    });
    ui.querySelector('#back').onclick=()=>{ state='menu'; renderUI(); };
    ui.querySelector('#play').onclick=()=>{ resetRound(round); state='playing'; renderUI(); };
  }

  function renderUI(){
    if(state==='menu'){
      const total=getTotalLevel();
      ui.innerHTML=`
        <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.15), transparent 60%), linear-gradient(180deg,#020617,#0a0e1e);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14px;text-align:center">
          <div style="font-size:10px;letter-spacing:0.3em;color:#22c55e">1989 • REMAKE • 100 NIVELES</div>
          <div style="margin-top:6px;font-size:38px;font-weight:900;color:white;line-height:0.9">BANANA<span style="color:#22c55e">TRON</span></div>
          <div style="margin-top:6px;color:#64748b;font-size:10px">ROUND ${round} • GRE ${greenWins} RED ${redWins} • MAX ${maxRound} • VEL ${total}/100</div>
          <div style="margin-top:10px;width:280px;height:120px;background:black;border:2px solid #1e40af;position:relative">
            <canvas id="mini" width="280" height="120" style="width:100%;height:100%"></canvas>
          </div>
          <div style="margin-top:10px;background:rgba(0,0,0,0.4);border:1px solid rgba(34,197,94,0.2);border-radius:12px;padding:8px 12px;display:flex;gap:12px;font-size:10px;color:#cbd5e1">
            <span>Tu: ${(1000/getPlayerInterval()).toFixed(1)} bl/s</span><span>•</span><span>Rival: ${(1000/getRivalInterval(round)).toFixed(1)} bl/s</span><span>•</span><span style="color:#22c55e">${total}/100</span>
          </div>
          <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px;width:100%;max-width:280px">
            <button id="play" style="background:linear-gradient(135deg,#22c55e,#16a34a);color:black;font-weight:900;padding:12px;border-radius:999px">JUGAR ROUND ${round}</button>
            <div style="display:flex;gap:8px">
              <button id="upg" style="flex:1;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.25);color:#22c55e;padding:10px;border-radius:999px;font-weight:800;font-size:12px">⚡ MEJORAS ${total}/100</button>
              <button id="reset" style="flex:1;background:rgba(255,255,255,0.05);color:#64748b;padding:10px;border-radius:999px;font-size:12px">Reset</button>
            </div>
          </div>
          <div style="margin-top:8px;font-size:9px;color:rgba(255,255,255,0.25)">Rival +1.6ms por round (poquito) • Mejora tu linea en mejoras</div>
        </div>
      `;
      setTimeout(()=>{
        const mc=document.getElementById('mini'); if(!mc) return; const mctx=mc.getContext('2d');
        mctx.fillStyle='black'; mctx.fillRect(0,0,280,120);
        mctx.strokeStyle='#22c55e'; mctx.setLineDash([6,4]); mctx.lineWidth=2; mctx.beginPath(); mctx.moveTo(40,90); mctx.lineTo(40,30); mctx.lineTo(180,30); mctx.lineTo(180,90); mctx.stroke();
        mctx.strokeStyle='#ef4444'; mctx.beginPath(); mctx.moveTo(200,20); mctx.lineTo(200,100); mctx.lineTo(60,100); mctx.stroke(); mctx.setLineDash([]);
      },30);
      ui.querySelector('#play').onclick=()=>{ resetRound(round); state='playing'; renderUI(); };
      ui.querySelector('#upg').onclick=()=>{ state='upgrades'; renderUpgrades(); };
      ui.querySelector('#reset').onclick=()=>{ round=1; greenWins=0; redWins=0; renderUI(); };
    }else if(state==='upgrades'){
      renderUpgrades();
    }else if(state==='playing'){
      ui.innerHTML=`
        <div style="position:absolute;top:6px;left:8px;right:8px;display:flex;justify-content:space-between;font-size:10px;color:white;font-family:monospace">
          <div>ROUND ${round} GRE ${greenWins} RED ${redWins}</div>
          <div style="color:#22c55e">TU ${getTotalLevel()}/100 • ${getPlayerInterval().toFixed(0)}ms</div>
          <div style="color:#fca5a5">RIVAL ${getRivalInterval(round).toFixed(0)}ms (+1.6/lvl)</div>
        </div>
      `;
    }else if(state==='roundover'){
      const winGreen=p1.alive && !p2.alive;
      if(winGreen) greenWins++; else redWins++;
      if(winGreen) tempCoins=20+round*3; else tempCoins=6;
      saveMax();
      ui.innerHTML=`
        <div style="position:absolute;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;padding:10px">
          <div style="background:#0f172a;border:1px solid ${winGreen?'#22c55e':'#ef4444'};border-radius:14px;padding:12px;width:100%;max-width:300px;text-align:center">
            <div style="font-size:10px;letter-spacing:0.2em;color:${winGreen?'#22c55e':'#ef4444'}">${winGreen?'GREEN GANA':'RED GANA'}</div>
            <div style="color:white;font-weight:900;margin-top:4px">ROUND ${round} ${winGreen?'GANASTE':'PERDISTE'}</div>
            <div style="margin-top:6px;font-size:10px;color:#94a3b8">Tu vel ${getTotalLevel()}/100 • Rival próximo ${getRivalInterval(round+1).toFixed(0)}ms</div>
            <div style="margin-top:8px;background:rgba(34,197,94,0.1);border-radius:8px;padding:6px;display:flex;justify-content:space-between;font-size:11px;color:white"><span>Recompensa</span><b style="color:#22c55e">${tempCoins} $WASA</b></div>
            <div style="margin-top:8px;display:flex;flex-direction:column;gap:6px">
              <button id="dbl" style="background:linear-gradient(135deg,#22c55e,#16a34a);color:black;font-weight:900;padding:10px;border-radius:999px;font-size:12px">📺 x2 (${tempCoins*2}) ANUNCIO</button>
              <button id="next" style="background:white;color:black;font-weight:800;padding:10px;border-radius:999px;font-size:12px">SIGUIENTE ROUND ${round+1}</button>
            </div>
          </div>
        </div>
      `;
      ui.querySelector('#dbl').onclick=()=>openAd('double');
      ui.querySelector('#next').onclick=()=>{ coins+=tempCoins; setCoins(coins); resetRound(round+1); state='playing'; renderUI(); };
    }else if(state==='paused_ad'){
      ui.innerHTML=`<div style="position:absolute;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;color:white;font-size:11px">Cargando...</div>`;
    }else if(state==='reward_modal'){
      ui.innerHTML=`
        <div style="position:absolute;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;padding:10px">
          <div style="background:#0f172a;border:1px solid #22c55e;border-radius:12px;padding:12px;width:100%;max-width:260px;text-align:center">
            <div style="color:#22c55e;font-weight:900">¡RECOMPENSA!</div>
            <button id="claim" style="margin-top:8px;width:100%;background:#22c55e;color:black;font-weight:900;padding:10px;border-radius:999px">RECLAMAR x2</button>
          </div>
        </div>
      `;
      ui.querySelector('#claim').onclick=claimReward;
    }
  }

  addEventListener('keydown',e=>{
    if(state!=='playing') return;
    if((e.key==='ArrowUp'||e.key==='w'||e.key==='W') && p1.dir!==2) p1.dir=0;
    if((e.key==='ArrowRight'||e.key==='d'||e.key==='D') && p1.dir!==3) p1.dir=1;
    if((e.key==='ArrowDown'||e.key==='s'||e.key==='S') && p1.dir!==0) p1.dir=2;
    if((e.key==='ArrowLeft'||e.key==='a'||e.key==='A') && p1.dir!==1) p1.dir=3;
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
  container._cleanup=()=>{ cancelAnimationFrame(raf); clearInterval(watcher); ro.disconnect(); window.vrAd=0; window.vrAdType=null; };
}
