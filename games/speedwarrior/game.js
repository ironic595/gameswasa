export function init(container, args){
  const quality = args.quality||'hd';
  const getCoins = args.getCoins||(()=>parseFloat(localStorage.getItem('wasa_coins')||'0'));
  const setCoins = args.setCoins||((n)=>localStorage.setItem('wasa_coins',n));

  container.innerHTML = `
    <style>
      .rf{width:100%;height:100%;position:relative;background:#0f172a;overflow:hidden;font-family:monospace;user-select:none}
      .rf canvas{width:100%;height:100%;display:block}
      .rf-ui{position:absolute;inset:0;pointer-events:none}
      .rf-ui button{pointer-events:auto}
    </style>
    <div class="rf"><canvas id="c"></canvas><div id="ui" class="rf-ui"></div></div>
  `;
  const wrap=container.querySelector('.rf');
  const canvas=wrap.querySelector('#c');
  const ctx=canvas.getContext('2d');
  const ui=wrap.querySelector('#ui');
  let W=wrap.clientWidth,H=wrap.clientHeight;
  function resize(){W=wrap.clientWidth;H=wrap.clientHeight;const dpr=window.devicePixelRatio||1;canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0);}
  resize(); const ro=new ResizeObserver(resize); ro.observe(wrap);

  let ups=JSON.parse(localStorage.getItem('wasa_upgrades_speedwarrior')||'{"v":{"main":0,"sub":0}}');
  let maxLevel=parseInt(localStorage.getItem('wasa_speedwarrior_max')||'1');
  let coins=getCoins();

  function getTotal(){ return ups.v.main*5 + ups.v.sub; }
  function saveUps(){localStorage.setItem('wasa_upgrades_speedwarrior',JSON.stringify(ups));}
  function saveMax(){ if(level>maxLevel){ maxLevel=level; localStorage.setItem('wasa_speedwarrior_max',maxLevel);} }
  function getCost(m,s){ const t=m*5+s; return 0.025 + t*0.01 + Math.pow(t,1.15)*0.001; }
  function getBaseWASA(lvl){ const tier=Math.floor((lvl-1)/10); return 0.005 + tier*0.0025; }
  function getTimeMult(elapsed){ if(elapsed<10) return 3; if(elapsed<20) return 2; return 1; }
  function fmtWASA(n){ const v=parseFloat(n)||0; if(v===0) return '0'; return (Math.round(v*1000000)/1000000).toString(); }
  function getPlayerMax(){ return 220 + getTotal()*1.8 + ups.v.main*2.2; }

  let state='menu', level=1, distance=0, goal=3500, tempCoins=0, score=0, fuel=100;
  let player={x:0,y:0,w:22,h:38,speed:0,crash:0,invul:0,angle:0};
  let enemies=[], roadOffset=0, particles=[], roadCurve=0, curveTarget=0;
  let keys={l:false,r:false,up:false,down:false}, last=performance.now(), levelStart=0;
  let _rewardPending=null, adClaimedThisLevel=false;

  function resetLevel(lvl){
    level=lvl; distance=0; goal=3000+lvl*600+Math.pow(lvl,1.2)*120;
    player.x=W*0.5; player.y=H*0.82; player.speed=0; player.crash=0; player.invul=0; player.angle=0;
    enemies=[]; particles=[]; roadOffset=0; roadCurve=0; curveTarget=0;
    fuel=100; score=0; tempCoins=0; levelStart=performance.now(); adClaimedThisLevel=false;
    for(let i=0;i<8;i++) spawnEnemy(-i*180 - Math.random()*400, true);
  }

  function spawnEnemy(y, initial){
    const roadW = W*0.42;
    const left = W*0.5 - roadW/2;
    const laneW = roadW/3;
    const lane = Math.floor(Math.random()*3);
    const x = left + laneW*0.5 + lane*laneW + (Math.random()-0.5)*laneW*0.3;
    const types = [
      {w:20,h:36,color:'#ef4444',speed:0.65,score:100},
      {w:20,h:36,color:'#facc15',speed:0.72,score:100},
      {w:20,h:36,color:'#22c55e',speed:0.68,score:100},
      {w:20,h:36,color:'#38bdf8',speed:0.75,score:200},
      {w:26,h:48,color:'#e5e7eb',speed:0.55,score:150},
    ];
    const t = types[Math.floor(Math.random()*types.length)];
    const baseSpeed = 120 + level*8 + Math.random()*40;
    enemies.push({x,y,w:t.w,h:t.h,color:t.color,base:baseSpeed,rel:t.speed,score:t.score,crashed:0});
    if(!initial && Math.random()<0.15){
      if(Math.random()<0.3) enemies.push({x:left+Math.random()*roadW,y:y-80,w:18,h:18,color:'#fbbf24',base:baseSpeed*0.6,rel:0.5,score:500,isFuel:true,crashed:0});
    }
  }

  function openAd(type){ if(window.vrAd!==0) return; if(adClaimedThisLevel && type==='double') return; _rewardPending=type; window.vrAdType=type; window.vrAd=1; }
  function claimReward(){
    const t=_rewardPending; _rewardPending=null; window.vrAd=0; window.vrAdType=null; window._gm_shown=false;
    if(t==='double' && !adClaimedThisLevel){
      adClaimedThisLevel=true;
      const dbl=tempCoins*2;
      coins+=dbl; setCoins(coins);
      level++; saveMax(); resetLevel(level); state='playing'; renderUI();
    } else if(t==='revive'){
      fuel=Math.min(100,fuel+40); player.invul=2; player.crash=0; state='playing'; renderUI();
    }
  }

  function renderUI(){
    const progress = Math.min(100, distance/goal*100);
    let h='';
    h+=`<div style="position:absolute;top:0;left:0;right:0;padding:8px 12px;display:flex;justify-content:space-between;pointer-events:auto">
      <div style="background:rgba(0,0,0,0.7);padding:6px 10px;border-radius:6px;border:2px solid #fff;font-family:monospace">
        <div style="color:#22c55e;font-size:10px">1P</div><div style="color:white;font-weight:900;font-size:14px">${String(score).padStart(6,'0')}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:start">
        <div style="background:#000;border:2px solid #fff;padding:4px 8px;border-radius:4px;text-align:center">
          <div style="color:white;font-size:8px;font-family:monospace">${fmtWASA(coins)} $WASA</div>
          <div style="color:#fbbf24;font-size:10px;font-weight:900;margin-top:2px">NIVEL ${level}</div>
        </div>
        ${state==='playing'?`<button id="pause" style="width:28px;height:28px;background:rgba(0,0,0,0.6);border:1px solid #fff;color:white;border-radius:4px">II</button>`:''}
      </div>
    </div>`;

    if(state==='playing'){
      h+=`<div style="position:absolute;right:6px;top:80px;bottom:60px;width:56px;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:4px">
        <div style="color:white;font-family:monospace;font-size:10px;font-weight:900">${Math.round(player.speed)} km/h</div>
        <div style="flex:1;width:16px;background:#111;border:2px solid #fff;display:flex;flex-direction:column-reverse;overflow:hidden">
          <div style="height:${progress}%;background:#22c55e;width:100%"></div>
        </div>
        <div style="margin-top:8px;width:40px;background:#000;border:2px solid #fff;padding:2px">
          <div style="color:#ef4444;font-family:monospace;font-size:9px;font-weight:900;text-align:center;border:1px solid #ef4444;margin-bottom:2px">FUEL</div>
          <div style="height:80px;background:#111;position:relative;overflow:hidden">
            <div style="position:absolute;bottom:0;left:0;right:0;height:${fuel}%;background:${fuel<20?'#ef4444':fuel<40?'#facc15':'#22c55e'}"></div>
          </div>
          <div style="color:white;font-family:monospace;font-size:10px;text-align:center">${Math.round(fuel).toString().padStart(3,'0')}</div>
        </div>
      </div>`;
    }

    if(state==='menu'){
      h+=`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.75);pointer-events:auto;padding:12px">
        <div style="width:100%;max-width:420px;background:#0f172a;border:3px solid #22c55e;border-radius:12px;padding:16px;font-family:monospace">
          <div style="text-align:center;color:#22c55e;font-weight:900;font-size:20px;letter-spacing:0.1em">ROAD FIGHTER</div>
          <div style="text-align:center;color:white;font-size:10px;margin-top:4px">WASA EDITION - ${maxLevel} NIVELES</div>
          <div style="margin-top:12px;background:black;border:2px solid #fff;padding:8px;display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:10px;color:white">
            <div>1P SCORE<br><span style="color:#22c55e">${String(score).padStart(6,'0')}</span></div>
            <div style="text-align:right">MAX ${maxLevel}<br><span style="color:#fbbf24">${fmtWASA(coins)} $WASA</span></div>
          </div>
          <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px">
            <button id="start" style="background:#22c55e;color:black;font-weight:900;padding:12px;border-radius:6px;border:2px solid white;font-family:monospace">START - NIVEL ${maxLevel}</button>
            <button id="start1" style="background:#111;color:white;padding:8px;border-radius:6px;border:1px solid #555;font-size:11px">JUGAR DESDE NIVEL 1</button>
          </div>
          <div style="margin-top:12px;font-size:8px;color:#64748b;text-align:center">Usa izq/der para mover, arriba para acelerar. Road Fighter clasico.</div>
        </div>
      </div>`;
    }

    if(state==='levelup'){
      const elapsed=(performance.now()-levelStart)/1000;
      const base=getBaseWASA(level-1);
      const mult=getTimeMult(elapsed);
      h+=`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.8);pointer-events:auto;padding:12px">
        <div style="background:#0f172a;border:3px solid #22c55e;border-radius:12px;padding:16px;max-width:340px;width:100%;text-align:center;font-family:monospace">
          <div style="color:#22c55e;font-weight:900">META ALCANZADA!</div>
          <div style="color:white;font-size:18px;margin-top:6px">NIVEL ${level-1} -> ${level}</div>
          <div style="margin-top:10px;background:black;border:1px solid #333;padding:8px;font-size:10px;color:#cbd5e1;text-align:left">
            <div style="display:flex;justify-content:space-between"><span>Base R${level-1}</span><span>${base.toFixed(6)} $WASA</span></div>
            <div style="display:flex;justify-content:space-between"><span>Tiempo ${elapsed.toFixed(1)}s</span><span>x${mult}</span></div>
            <div style="display:flex;justify-content:space-between;font-weight:900;color:#22c55e;margin-top:4px"><span>Total</span><span>${fmtWASA(tempCoins)} $WASA</span></div>
          </div>
          <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px">
            <button id="next" style="background:white;color:black;font-weight:900;padding:10px;border-radius:6px">SIGUIENTE R${level}</button>
            ${!adClaimedThisLevel?`<button id="dbl" style="background:#22c55e;color:black;font-weight:900;padding:10px;border-radius:6px">x2 (${fmtWASA(tempCoins*2)} $WASA)</button>`:''}
          </div>
        </div>
      </div>`;
    }

    if(state==='gameover'){
      h+=`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);pointer-events:auto;padding:12px">
        <div style="background:#0f172a;border:3px solid #ef4444;border-radius:12px;padding:16px;max-width:320px;width:100%;text-align:center;font-family:monospace">
          <div style="color:#ef4444;font-weight:900">SIN COMBUSTIBLE!</div>
          <div style="color:white;margin-top:8px">SCORE ${score}</div>
          <div style="color:#ef4444;margin-top:4px;font-size:11px">0 $WASA - Sin recompensa</div>
          <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px">
            <button id="rev" style="background:#38bdf8;color:white;font-weight:900;padding:10px;border-radius:6px">REVIVIR +40 FUEL</button>
            <button id="retry" style="background:rgba(255,255,255,0.1);color:white;padding:10px;border-radius:6px">REINTENTAR R${level}</button>
            <button id="menu" style="color:#64748b;font-size:10px">MENU</button>
          </div>
        </div>
      </div>`;
    }

    if(state==='reward_modal' && _rewardPending){
      h+=`<div style="position:absolute;inset:0;z-index:10;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;pointer-events:auto;padding:12px">
        <div style="background:#0f172a;border:2px solid #22c55e;border-radius:12px;padding:16px;max-width:300px;width:100%;text-align:center">
          <div style="color:#22c55e;font-weight:900">${_rewardPending==='double'?'RECOMPENSA x2!':'REVIVISTE!'}</div>
          <div style="color:white;margin-top:6px">${_rewardPending==='double'?fmtWASA(tempCoins*2)+' $WASA':'40 FUEL'}</div>
          <button id="claim" style="margin-top:10px;width:100%;background:#22c55e;color:black;font-weight:900;padding:10px;border-radius:6px">RECLAMAR</button>
        </div>
      </div>`;
    }

    ui.innerHTML=h;
    ui.querySelector('#pause')?.addEventListener('click',()=>{ state='menu'; renderUI(); });
    ui.querySelector('#start')?.addEventListener('click',()=>{ resetLevel(maxLevel); state='playing'; renderUI(); });
    ui.querySelector('#start1')?.addEventListener('click',()=>{ resetLevel(1); state='playing'; renderUI(); });
    ui.querySelector('#next')?.addEventListener('click',()=>{ coins+=tempCoins; setCoins(coins); level++; saveMax(); resetLevel(level); state='playing'; renderUI(); });
    ui.querySelector('#dbl')?.addEventListener('click',()=>openAd('double'));
    ui.querySelector('#rev')?.addEventListener('click',()=>openAd('revive'));
    ui.querySelector('#retry')?.addEventListener('click',()=>{ resetLevel(level); state='playing'; renderUI(); });
    ui.querySelector('#menu')?.addEventListener('click',()=>{ state='menu'; renderUI(); });
    ui.querySelector('#claim')?.addEventListener('click',claimReward);
  }

  addEventListener('keydown',e=>{
    if(e.key==='ArrowLeft'||e.key==='a') keys.l=true;
    if(e.key==='ArrowRight'||e.key==='d') keys.r=true;
    if(e.key==='ArrowUp'||e.key==='w'||e.key===' ') keys.up=true;
    if(e.key==='ArrowDown'||e.key==='s') keys.down=true;
  });
  addEventListener('keyup',e=>{
    if(e.key==='ArrowLeft'||e.key==='a') keys.l=false;
    if(e.key==='ArrowRight'||e.key==='d') keys.r=false;
    if(e.key==='ArrowUp'||e.key==='w'||e.key===' ') keys.up=false;
    if(e.key==='ArrowDown'||e.key==='s') keys.down=false;
  });
  canvas.addEventListener('pointerdown',e=>{
    const x=e.clientX-canvas.getBoundingClientRect().left;
    if(x<W*0.33) keys.l=true; else if(x>W*0.66) keys.r=true; else keys.up=true;
  });
  canvas.addEventListener('pointerup',()=>{ keys.l=false; keys.r=false; keys.up=false; keys.down=false; });

  let watcher=setInterval(()=>{ if(window.vrAd===4 && _rewardPending){ state='reward_modal'; renderUI(); } },150);

  let raf;
  function loop(now){
    if(window.vrAd===1||window.vrAd===2||window.vrAd===3){ raf=requestAnimationFrame(loop); return; }
    const dt=Math.min((now-last)/1000,0.033); last=now;
    if(state==='playing'){
      if(Math.random()<0.008) curveTarget=(Math.random()-0.5)*0.8;
      roadCurve += (curveTarget-roadCurve)*dt*1.2;
      roadCurve*=0.998;

      const steer = (keys.l?-1:0)+(keys.r?1:0);
      player.angle = steer*0.15;
      const maxSpd = getPlayerMax();
      if(keys.up) player.speed = Math.min(maxSpd, player.speed + 180*dt);
      else if(keys.down) player.speed = Math.max(0, player.speed - 220*dt);
      else player.speed = Math.max(0, player.speed - 60*dt);

      const scroll = player.speed*dt*0.6;
      roadOffset = (roadOffset + scroll)%40;
      distance += scroll*0.7;
      fuel -= scroll*0.015 + (player.speed>180?0.02:0);
      if(fuel<=0){ fuel=0; tempCoins=0; state='gameover'; renderUI(); }

      const roadW = W*0.42;
      const left = W*0.5 - roadW/2 + 10;
      const right = W*0.5 + roadW/2 - 10 - player.w;
      player.x += (steer* (140 + player.speed*0.25) + roadCurve*player.speed*0.5)*dt;
      player.x = Math.max(left, Math.min(right, player.x));

      for(let e of enemies){
        const relSpeed = player.speed - e.base*e.rel;
        e.y += relSpeed*dt*0.6 + scroll*0.3;
        if(Math.abs(e.y-player.y)<120 && Math.abs(e.x-player.x)<60){
          e.x += (e.x<player.x? -1:1)*40*dt;
        }
      }
      enemies = enemies.filter(e=>e.y < H+100 && e.y>-200);

      if(enemies.length<12 && Math.random()<0.04 + level*0.002) spawnEnemy(-80-Math.random()*120);

      if(player.invul<=0 && player.crash<=0){
        for(let i=enemies.length-1;i>=0;i--){
          const e=enemies[i];
          if(e.isFuel){
            if(Math.abs(e.x-player.x)<18 && Math.abs(e.y-player.y)<20){
              fuel=Math.min(100,fuel+20); score+=e.score; enemies.splice(i,1);
              for(let k=0;k<10;k++) particles.push({x:e.x,y:e.y,vx:(Math.random()-0.5)*120,vy:(Math.random()-0.5)*120,life:1,color:'#fbbf24'});
            }
            continue;
          }
          if(Math.abs(e.x-player.x)< (player.w+e.w)*0.48 && Math.abs(e.y-player.y)< (player.h+e.h)*0.48){
            e.crashed=1;
            player.crash=1.2;
            player.speed*=0.4;
            fuel=Math.max(0,fuel-12);
            score=Math.max(0,score-50);
            for(let k=0;k<16;k++) particles.push({x:player.x+player.w/2,y:player.y+player.h/2,vx:(Math.random()-0.5)*200,vy:(Math.random()-0.5)*200,life:1,color:k%2?e.color:'#fff'});
            if(fuel<=0){ tempCoins=0; state='gameover'; renderUI(); break; }
            player.invul=1.5;
            break;
          }
        }
      }
      if(player.invul>0) player.invul-=dt;
      if(player.crash>0) player.crash-=dt;

      if(distance>=goal){
        const elapsed=(performance.now()-levelStart)/1000;
        const base=getBaseWASA(level);
        const mult=getTimeMult(elapsed);
        tempCoins=base*mult;
        score+=Math.round(1000 - elapsed*5 + fuel*10);
        state='levelup'; renderUI();
      }
    }

    ctx.fillStyle='#1a8c2a'; ctx.fillRect(0,0,W,H);
    const roadW = W*0.42;
    const roadLeft = W*0.5 - roadW/2 + roadCurve*40;
    ctx.fillStyle='#3a3a3a'; ctx.fillRect(roadLeft,0,roadW,H);
    ctx.fillStyle='white'; ctx.fillRect(roadLeft,0,4,H); ctx.fillRect(roadLeft+roadW-4,0,4,H);
    ctx.fillStyle='white';
    for(let y=-40+roadOffset; y<H; y+=40){
      ctx.fillRect(roadLeft+roadW/2-2, y, 4, 20);
    }
    ctx.fillStyle='#facc15'; ctx.fillRect(roadLeft-6,0,6,H); ctx.fillRect(roadLeft+roadW,0,6,H);

    for(let e of enemies){
      if(e.isFuel){
        ctx.fillStyle=e.color; ctx.fillRect(e.x-e.w/2, e.y-e.h/2, e.w, e.h);
        ctx.fillStyle='black'; ctx.font='bold 10px monospace'; ctx.textAlign='center'; ctx.fillText('F', e.x, e.y+3);
        continue;
      }
      ctx.save(); ctx.translate(e.x, e.y);
      if(e.crashed) ctx.rotate(Math.sin(Date.now()*0.02)*0.5);
      ctx.fillStyle=e.color; ctx.fillRect(-e.w/2, -e.h/2, e.w, e.h);
      ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.fillRect(-e.w*0.3, -e.h*0.3, e.w*0.6, e.h*0.25);
      ctx.fillStyle='white'; ctx.fillRect(-e.w*0.35, e.h*0.35, 4,3); ctx.fillRect(e.w*0.15, e.h*0.35, 4,3);
      ctx.restore();
    }

    ctx.save(); ctx.translate(player.x+player.w/2, player.y+player.h/2); ctx.rotate(player.angle);
    const blink = player.invul>0 ? Math.sin(Date.now()*0.02)>0 : true;
    if(blink){
      ctx.fillStyle=player.crash>0?'#fca5a5':'#ef4444';
      ctx.fillRect(-player.w/2, -player.h/2, player.w, player.h);
      ctx.fillStyle='#111'; ctx.fillRect(-player.w*0.3, -player.h*0.25, player.w*0.6, player.h*0.2);
      ctx.fillStyle='white'; ctx.fillRect(-player.w*0.3, player.h*0.3, 4,3); ctx.fillRect(player.w*0.15, player.h*0.3, 4,3);
    }
    ctx.restore();

    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i]; p.x+=p.vx*dt; p.y+=p.vy*dt; p.life-=dt*1.5;
      if(p.life<=0){ particles.splice(i,1); continue; }
      ctx.globalAlpha=p.life; ctx.fillStyle=p.color; ctx.fillRect(p.x,p.y,3,3); ctx.globalAlpha=1;
    }

    raf=requestAnimationFrame(loop);
  }

  renderUI(); resetLevel(maxLevel); state='menu'; renderUI();
  raf=requestAnimationFrame(loop);
  container._cleanup=()=>{ cancelAnimationFrame(raf); clearInterval(watcher); ro.disconnect(); window.vrAd=0; };
}
