export function init(container, args){
  const getCoins = args.getCoins||(()=>parseFloat(localStorage.getItem('wasa_coins')||'0'));
  const setCoins = args.setCoins||((n)=>localStorage.setItem('wasa_coins',n));
  container.innerHTML = `<style>.rf{width:100%;height:100%;position:relative;background:#0a0e1a;overflow:hidden;font-family:monospace;user-select:none}.rf canvas{width:100%;height:100%;display:block}.rf-ui{position:absolute;inset:0;pointer-events:none}.rf-ui button{pointer-events:auto;touch-action:manipulation}</style><div class="rf"><canvas id="c"></canvas><div id="ui" class="rf-ui"></div></div>`;
  const wrap=container.querySelector('.rf'); const canvas=wrap.querySelector('#c'); const ctx=canvas.getContext('2d'); const ui=wrap.querySelector('#ui');
  let W=wrap.clientWidth,H=wrap.clientHeight; function resize(){W=wrap.clientWidth;H=wrap.clientHeight;const dpr=window.devicePixelRatio||1;canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0);} resize(); const ro=new ResizeObserver(resize); ro.observe(wrap);
  let maxLevel=parseInt(localStorage.getItem('wasa_roadfighter_max')||localStorage.getItem('wasa_speedwarrior_max')||'1'); let coins=getCoins();
  function saveMax(lvl){ if(lvl>maxLevel){ maxLevel=lvl; localStorage.setItem('wasa_roadfighter_max',maxLevel); localStorage.setItem('wasa_speedwarrior_max',maxLevel);} }
  function getBaseWASA(lvl){ const tier=Math.floor((lvl-1)/10); return 0.005 + tier*0.0025; }
  function getTimeMult(e){ if(e<10) return 3; if(e<20) return 2; return 1; }
  function fmtWASA(n){ const v=parseFloat(n)||0; if(v===0) return '0'; return (Math.round(v*1000000)/1000000).toString(); }
  let state='menu', level=1, distance=0, goal=2000, tempCoins=0, score=0, fuel=100;
  let player={x:0,y:0,w:22,h:38,vx:0,speed:90,invul:0,flash:0};
  let enemies=[], roadOffset=0, keys={l:false,r:false,up:false}, last=performance.now(), levelStart=0;
  let _rewardPending=null, adClaimedThisLevel=false, spawnTimer=0;

  function resetLevel(lvl){
    level=lvl; distance=0; goal=1800 + lvl*280 + Math.pow(lvl,1.1)*50;
    player.x=W*0.5; player.y=H*0.82; player.vx=0; player.speed=95; player.invul=0; player.flash=0;
    enemies=[]; roadOffset=0; spawnTimer=0;
    fuel=100; score=0; tempCoins=0; levelStart=performance.now(); adClaimedThisLevel=false;
    for(let i=0;i<3;i++) spawnEnemy(-i*320 - Math.random()*200, true);
  }
  function spawnEnemy(y, initial){
    const roadW = Math.min(W*0.55, 380);
    const left = W*0.5 - roadW/2;
    const laneW = roadW/3;
    const lane = Math.floor(Math.random()*3);
    const x = left + laneW/2 + lane*laneW + (Math.random()-0.5)*laneW*0.2;
    const types=[{w:20,h:34,color:'#ef4444',speed:72},{w:20,h:34,color:'#facc15',speed:80},{w:20,h:34,color:'#22c55e',speed:76},{w:22,h:38,color:'#38bdf8',speed:88},{w:28,h:46,color:'#e5e7eb',speed:68}];
    const t=types[Math.floor(Math.random()*types.length)];
    enemies.push({x,y,w:t.w,h:t.h,color:t.color,spd:t.speed});
    if(!initial && Math.random()<0.22){
      enemies.push({x:left+24+Math.random()*(roadW-48),y:y-110,w:16,h:16,color:'#fbbf24',spd:62,isFuel:true});
    }
  }
  function openAd(type){
    console.log('[RF] openAd', type, 'current vrAd', window.vrAd);
    if(window.vrAd!==0 && window.vrAd!==4){
      // si ya hay ad, no hacer nada
      return;
    }
    // si venimos de un ad anterior en 4, resetear
    if(window.vrAd===4) window.vrAd=0;
    if(adClaimedThisLevel && type==='double') return;
    _rewardPending=type;
    window.vrAdType=type;
    window.vrAd=1;
    // Fallback: si el SDK de GameMonetize no responde (por adblock o error), forzamos a 4 en 3.5s para no trabar
    setTimeout(()=>{
      if(window.vrAd===1 && _rewardPending===type){
        console.log('[RF] fallback ad timeout -> force vrAd=4');
        window.vrAd=4;
      }
    }, 3500);
  }
  function claimReward(){
    const t = _rewardPending || window.vrAdType || 'double';
    console.log('[RF] claimReward', t);
    // Resetear todo lo de ads SIEMPRE
    _rewardPending=null;
    window.vrAd=0;
    window.vrAdType=null;
    window._gm_shown=false;
    try{
      if(t==='double'){
        if(!adClaimedThisLevel){
          adClaimedThisLevel=true;
          const dbl=tempCoins*2;
          coins+=dbl;
          setCoins(coins);
          level++;
          saveMax(level);
          resetLevel(level);
          state='playing';
        } else {
          // ya reclamado, igual avanzar
          coins+=tempCoins;
          setCoins(coins);
          level++;
          saveMax(level);
          resetLevel(level);
          state='playing';
        }
      } else if(t==='revive'){
        fuel=Math.min(100,fuel+50);
        player.invul=1.6;
        player.flash=0;
        state='playing';
      } else {
        state='playing';
      }
    }catch(e){
      console.error('[RF] claim error', e);
      state='playing';
    }
    renderUI();
  }

  function renderUI(){
    const prog=Math.min(100,distance/goal*100);
    let h=`<div style="position:absolute;top:0;left:0;right:0;padding:8px 10px;display:flex;justify-content:space-between;pointer-events:auto"><div style="background:rgba(0,0,0,0.85);padding:5px 10px;border-radius:6px;border:2px solid #fff"><div style="color:#22c55e;font-size:9px">1P</div><div style="color:white;font-weight:900;font-size:14px">${String(score).padStart(6,'0')}</div></div><div style="background:#000;border:2px solid #fff;padding:4px 8px;border-radius:4px;text-align:center;min-width:76px"><div style="color:white;font-size:8px">${fmtWASA(coins)} $WASA</div><div style="color:#fbbf24;font-size:10px;font-weight:900">R${level}</div></div></div>`;
    if(state==='playing'){
      h+=`<div style="position:absolute;right:8px;top:72px;bottom:16px;width:52px;display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none"><div style="background:#000;border:2px solid #fff;padding:3px 4px;border-radius:4px;width:100%;text-align:center"><div style="color:#fbbf24;font-size:10px;font-weight:900">${Math.round(player.speed)}</div><div style="color:white;font-size:7px">km/h</div></div><div style="flex:1;width:18px;background:#111;border:2px solid #fff;display:flex;flex-direction:column-reverse"><div style="height:${prog}%;background:#22c55e"></div></div><div style="background:#000;border:2px solid #fff;padding:2px;width:44px;text-align:center"><div style="color:#ef4444;font-size:8px;font-weight:900;border:1px solid #ef4444">FUEL</div><div style="height:70px;background:#111;margin:2px 0;position:relative"><div style="position:absolute;bottom:0;left:0;right:0;height:${fuel}%;background:${fuel<20?'#ef4444':fuel<40?'#facc15':'#22c55e'}"></div></div><div style="color:white;font-size:9px">${String(Math.round(fuel)).padStart(3,'0')}</div></div><div style="color:rgba(255,255,255,0.7);font-size:7px">${Math.round(goal-distance)}m</div></div>`;
    }
    if(state==='menu'){
      h+=`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.82);pointer-events:auto;padding:12px"><div style="width:100%;max-width:400px;background:#101a2e;border:3px solid #22c55e;border-radius:12px;padding:16px"><div style="text-align:center;color:#22c55e;font-weight:900;font-size:22px">ROAD FIGHTER</div><div style="text-align:center;color:white;font-size:9px;margin-top:2px">WASA EDITION - FIXED V3</div><div style="margin-top:12px;background:black;border:2px solid #333;padding:8px;display:flex;justify-content:space-between;font-size:10px;color:white"><span>SCORE ${String(score).padStart(6,'0')}</span><span style="color:#fbbf24">${fmtWASA(coins)} $WASA | MAX R${maxLevel}</span></div><div style="margin-top:12px;display:flex;flex-direction:column;gap:8px"><button id="start" style="background:#22c55e;color:black;font-weight:900;padding:14px;border-radius:8px;border:2px solid white;font-size:14px">START R${maxLevel}</button><button id="start1" style="background:#1f2937;color:white;padding:9px;border-radius:8px;font-size:11px">NIVEL 1 FACIL - 1800m</button></div><div style="margin-top:10px;font-size:8px;color:#6b7280;text-align:center">FIX V3: boton RECLAMAR arreglado + fallback anti-trabado</div></div></div>`;
    }
    if(state==='levelup'){ const elapsed=(performance.now()-levelStart)/1000; const base=getBaseWASA(level); const mult=getTimeMult(elapsed); h+=`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);pointer-events:auto;padding:12px"><div style="background:#101a2e;border:3px solid #22c55e;border-radius:12px;padding:16px;max-width:340px;width:100%;text-align:center"><div style="color:#22c55e;font-weight:900">GOAL!</div><div style="color:white;font-size:18px;margin-top:4px">R${level} -> R${level+1}</div><div style="margin-top:10px;background:black;padding:8px;font-size:10px;text-align:left;color:#cbd5e1"><div style="display:flex;justify-content:space-between"><span>Base</span><span>${base.toFixed(6)} $WASA</span></div><div style="display:flex;justify-content:space-between"><span>Tiempo ${elapsed.toFixed(1)}s</span><span>x${mult}</span></div><div style="display:flex;justify-content:space-between;color:#22c55e;font-weight:900;margin-top:4px"><span>TOTAL</span><span>${fmtWASA(tempCoins)} $WASA</span></div></div><div style="margin-top:12px;display:flex;flex-direction:column;gap:8px"><button id="next" style="background:white;color:black;font-weight:900;padding:11px;border-radius:8px">SIGUIENTE</button>${!adClaimedThisLevel?`<button id="dbl" style="background:#22c55e;color:black;font-weight:900;padding:11px;border-radius:8px">x2 ANUNCIO (${fmtWASA(tempCoins*2)})</button>`:''}</div></div></div>`; }
    if(state==='gameover'){ h+=`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.9);pointer-events:auto;padding:12px"><div style="background:#101a2e;border:3px solid #ef4444;border-radius:12px;padding:16px;max-width:320px;width:100%;text-align:center"><div style="color:#ef4444;font-weight:900">SIN FUEL</div><div style="color:white;margin-top:6px">SCORE ${score}</div><div style="color:#ef4444;font-size:11px;margin-top:4px">0 $WASA - Perdes todo</div><div style="margin-top:12px;display:flex;flex-direction:column;gap:8px"><button id="rev" style="background:#38bdf8;color:white;font-weight:900;padding:11px;border-radius:8px">REVIVIR +50 FUEL (AD)</button><button id="retry" style="background:#1f2937;color:white;padding:10px;border-radius:8px">REINTENTAR R${level}</button><button id="menu" style="color:#6b7280;font-size:10px">MENU</button></div></div></div>`; }
    if(state==='reward_modal'){
      const pendingType = _rewardPending || window.vrAdType || 'double';
      const isDouble = pendingType==='double';
      h+=`<div style="position:absolute;inset:0;z-index:9999;background:rgba(0,0,0,0.92);display:flex;align-items:center;justify-content:center;pointer-events:auto;padding:12px"><div style="background:#101a2e;border:2px solid #22c55e;border-radius:12px;padding:16px;max-width:320px;width:100%;text-align:center;pointer-events:auto"><div style="color:#22c55e;font-weight:900;font-size:16px">${isDouble?'x2 RECOMPENSA!':'REVIVISTE!'}</div><div style="color:white;margin-top:8px;font-size:14px">${isDouble?fmtWASA(tempCoins*2)+' $WASA':'50 FUEL'}</div><div style="color:#6b7280;font-size:8px;margin-top:6px">Si no anda el ad, espera 3.5s y aparece igual</div><button id="claim" style="margin-top:12px;width:100%;background:#22c55e;color:black;font-weight:900;padding:14px;border-radius:8px;font-size:14px;pointer-events:auto;touch-action:manipulation">RECLAMAR</button><button id="claimClose" style="margin-top:8px;width:100%;background:transparent;color:#6b7280;padding:8px;font-size:10px">CERRAR SIN RECOMPENSA</button></div></div>`;
    }
    ui.innerHTML=h;
    const bind = (id, fn)=>{ const el=ui.querySelector(id); if(el){ el.onclick=fn; el.ontouchend=(e)=>{ e.preventDefault(); fn(); }; } };
    bind('#start', ()=>{ resetLevel(maxLevel); state='playing'; renderUI(); });
    bind('#start1', ()=>{ resetLevel(1); state='playing'; renderUI(); });
    bind('#next', ()=>{ coins+=tempCoins; setCoins(coins); level++; saveMax(level); resetLevel(level); state='playing'; renderUI(); });
    bind('#dbl', ()=>openAd('double'));
    bind('#rev', ()=>openAd('revive'));
    bind('#retry', ()=>{ resetLevel(level); state='playing'; renderUI(); });
    bind('#menu', ()=>{ state='menu'; renderUI(); });
    bind('#claim', claimReward);
    bind('#claimClose', ()=>{ _rewardPending=null; window.vrAd=0; window.vrAdType=null; window._gm_shown=false; if(state==='reward_modal'){ if(fuel<=0){ state='gameover'; } else { state='playing'; } renderUI(); } });
  }

  addEventListener('keydown',e=>{ if(e.key==='ArrowLeft'||e.key==='a') keys.l=true; if(e.key==='ArrowRight'||e.key==='d') keys.r=true; if(e.key==='ArrowUp'||e.key==='w') keys.up=true; });
  addEventListener('keyup',e=>{ if(e.key==='ArrowLeft'||e.key==='a') keys.l=false; if(e.key==='ArrowRight'||e.key==='d') keys.r=false; if(e.key==='ArrowUp'||e.key==='w') keys.up=false; });
  canvas.addEventListener('pointerdown',e=>{ const x=e.clientX-canvas.getBoundingClientRect().left; if(x<W*0.33) keys.l=true; else if(x>W*0.66) keys.r=true; else keys.up=true; });
  canvas.addEventListener('pointerup',()=>{ keys.l=false; keys.r=false; keys.up=false; });
  canvas.addEventListener('touchstart',e=>{ e.preventDefault(); const x=e.touches[0].clientX-canvas.getBoundingClientRect().left; if(x<W*0.33) keys.l=true; else if(x>W*0.66) keys.r=true; else keys.up=true; },{passive:false});
  canvas.addEventListener('touchend',()=>{ keys.l=false; keys.r=false; keys.up=false; });

  let watcher=setInterval(()=>{
    if(window.vrAd===4 && _rewardPending && state!=='reward_modal'){
      console.log('[RF] watcher -> reward_modal');
      state='reward_modal';
      renderUI();
    }
  },120);

  let raf, last=performance.now();
  function loop(now){
    if(window.vrAd===1||window.vrAd===2||window.vrAd===3){
      // Pausado por ad
      raf=requestAnimationFrame(loop);
      return;
    }
    const dt=Math.min((now-last)/1000,0.033); last=now;
    if(state==='playing'){
      const roadW=Math.min(W*0.55, 380); const left=W*0.5-roadW/2; const right=W*0.5+roadW/2;
      const steer=(keys.r?1:0)-(keys.l?1:0);
      const targetVx=steer*280;
      player.vx+=(targetVx-player.vx)*dt*9;
      if(Math.abs(steer)<0.1) player.vx*=Math.pow(0.12, dt);
      player.x+=player.vx*dt;
      player.x=Math.max(left+16, Math.min(right-16, player.x));
      if(keys.up) player.speed=Math.min(260, player.speed+150*dt); else player.speed=Math.max(92, player.speed-70*dt);
      const scroll=player.speed*dt*0.58;
      roadOffset=(roadOffset+scroll)%40;
      distance+=scroll*0.88;
      fuel-=scroll*0.0062;
      if(fuel<=0){ fuel=0; tempCoins=0; state='gameover'; renderUI(); }
      spawnTimer-=dt;
      if(spawnTimer<=0 && enemies.length<9){ spawnEnemy(-90-Math.random()*80,false); spawnTimer=1.0+Math.random()*0.7 - level*0.015; }
      for(let e of enemies){ const rel=player.speed-e.spd; e.y+=rel*dt*0.58 + scroll*0.18; }
      enemies=enemies.filter(e=>e.y<H+90 && e.y>-200);
      if(player.invul<=0){
        for(let i=enemies.length-1;i>=0;i--){
          const e=enemies[i];
          if(e.isFuel){ if(Math.abs(e.x-player.x)<18 && Math.abs(e.y-player.y)<18){ fuel=Math.min(100,fuel+18); score+=300; enemies.splice(i,1); } continue; }
          if(Math.abs(e.x-player.x)<(player.w+e.w)*0.42 && Math.abs(e.y-player.y)<(player.h+e.h)*0.42){ fuel=Math.max(0,fuel-6); player.speed=Math.max(92,player.speed*0.78); player.invul=1.1; player.flash=0.7; score=Math.max(0,score-15); enemies.splice(i,1); if(fuel<=0){ tempCoins=0; state='gameover'; renderUI(); break; } }
        }
      }
      if(player.invul>0){ player.invul-=dt; player.flash-=dt; }
      if(distance>=goal){ const elapsed=(performance.now()-levelStart)/1000; tempCoins=getBaseWASA(level)*getTimeMult(elapsed); score+=Math.round(500+fuel*8); state='levelup'; renderUI(); }
    }
    ctx.fillStyle='#1a5c27'; ctx.fillRect(0,0,W,H);
    const roadW=Math.min(W*0.55, 380); const roadLeft=W*0.5-roadW/2;
    ctx.fillStyle='#3a3d42'; ctx.fillRect(roadLeft,0,roadW,H);
    ctx.fillStyle='#facc15'; ctx.fillRect(roadLeft-7,0,7,H); ctx.fillRect(roadLeft+roadW,0,7,H);
    ctx.fillStyle='white'; ctx.fillRect(roadLeft,0,3,H); ctx.fillRect(roadLeft+roadW-3,0,3,H);
    ctx.fillStyle='white'; for(let y=-40+roadOffset;y<H;y+=40){ ctx.fillRect(W*0.5-2,y,4,22); }
    ctx.fillStyle='rgba(255,255,255,0.22)'; for(let y=-40+roadOffset;y<H;y+=40){ ctx.fillRect(roadLeft+roadW/3-1,y,1,14); ctx.fillRect(roadLeft+roadW*2/3-1,y,1,14); }
    for(let e of enemies){
      if(e.isFuel){ ctx.fillStyle=e.color; ctx.fillRect(e.x-e.w/2,e.y-e.h/2,e.w,e.h); ctx.fillStyle='black'; ctx.font='bold 10px monospace'; ctx.textAlign='center'; ctx.fillText('F',e.x,e.y+3); continue; }
      ctx.save(); ctx.translate(e.x,e.y); ctx.fillStyle=e.color; ctx.fillRect(-e.w/2,-e.h/2,e.w,e.h); ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(-e.w*0.28,-e.h*0.25,e.w*0.56,e.h*0.22); ctx.fillStyle='#d1d5db'; ctx.fillRect(-e.w*0.36,e.h*0.30,5,3); ctx.fillRect(e.w*0.18,e.h*0.30,5,3); ctx.restore();
    }
    ctx.save(); ctx.translate(player.x,player.y); const skew=player.vx*0.0011; ctx.transform(1,0,skew,1,0,0); const visible=player.flash<=0 || Math.floor(Date.now()*0.018)%2===0; if(visible){ ctx.fillStyle='#ef4444'; ctx.fillRect(-player.w/2,-player.h/2,player.w,player.h); ctx.fillStyle='#111827'; ctx.fillRect(-player.w*0.32,-player.h*0.22,player.w*0.64,player.h*0.24); ctx.fillStyle='#e5e7eb'; ctx.fillRect(-player.w*0.34,player.h*0.28,6,4); ctx.fillRect(player.w*0.14,player.h*0.28,6,4); } ctx.restore();
    raf=requestAnimationFrame(loop);
  }
  renderUI(); resetLevel(maxLevel); state='menu'; renderUI(); raf=requestAnimationFrame(loop);
  container._cleanup=()=>{ cancelAnimationFrame(raf); clearInterval(watcher); ro.disconnect(); window.vrAd=0; };
}
