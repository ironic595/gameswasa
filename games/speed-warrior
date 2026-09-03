export function init(container, args){
  const quality = args.quality||'hd';
  const getCoins = args.getCoins||(()=>parseInt(localStorage.getItem('wasa_coins')||'0'));
  const setCoins = args.setCoins||((n)=>localStorage.setItem('wasa_coins',n));
  const addCoins = args.addCoins||((n)=>setCoins(getCoins()+n));

  container.innerHTML = `
    <style>
      .bn{width:100%;height:100%;position:relative;background:#0a0e1e;overflow:hidden;font-family:Inter,system-ui,sans-serif;user-select:none}
      .bn canvas{width:100%;height:100%;display:block}
      .bn-ui{position:absolute;inset:0;pointer-events:none}
      .bn-ui button{pointer-events:auto}
      @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
    </style>
    <div class="bn"><canvas id="c"></canvas><div id="ui" class="bn-ui"></div></div>
  `;
  const wrap=container.querySelector('.bn');
  const canvas=wrap.querySelector('#c');
  const ctx=canvas.getContext('2d');
  const ui=wrap.querySelector('#ui');
  let W=wrap.clientWidth,H=wrap.clientHeight;
  function resize(){W=wrap.clientWidth;H=wrap.clientHeight;const dpr=devicePixelRatio||1;canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0);}
  resize(); const ro=new ResizeObserver(resize); ro.observe(wrap);

  let ups=JSON.parse(localStorage.getItem('wasa_upgrades_banatron')||'{"speed":0,"handling":0,"shield":0,"magnet":0}');
  let maxLevel=parseInt(localStorage.getItem('wasa_banatron_max')||'1');
  let coins=getCoins();

  let state='menu'; // menu, upgrades, playing, paused_ad, levelup, gameover
  let level=1, distance=0, distanceGoal=2000, score=0, tempCoins=0;
  let player={x:0,y:0,w:36,h:18,speed:0,maxSpeed:0,acc:0,handling:0,shield:0,invul:0};
  let rival={x:0,y:0,w:36,h:18,speed:0,baseSpeed:0,offset:0};
  let keys={left:false,right:false,up:false};
  let obstacles=[], collectibles=[], particles=[], trail=[];
  let last=performance.now(), gameTime=0;
  let _rewardPending=null, adUses=0, pauseBefore=null;
  let levelStartTime=0;

  function saveUps(){localStorage.setItem('wasa_upgrades_banatron',JSON.stringify(ups));}
  function saveMax(){if(level>maxLevel){maxLevel=level;localStorage.setItem('wasa_banatron_max',maxLevel);}}

  function getRivalSpeed(lvl){
    // aumento suave: base 140 + lvl*6 + sqrt(lvl)*8
    return 140 + lvl*6 + Math.pow(lvl,0.55)*8;
  }
  function getPlayerMaxSpeed(){
    return 165 + ups.speed*10 + level*1.2;
  }
  function getHandling(){
    return 0.14 + ups.handling*0.025;
  }
  function getShieldMax(){
    return ups.shield>0 ? 1 : 0;
  }

  function resetLevel(lvl){
    level=lvl;
    distance=0;
    distanceGoal=1800 + lvl*220 + Math.pow(lvl,1.1)*30;
    player.x=W*0.5;
    player.y=H*0.82;
    player.maxSpeed=getPlayerMaxSpeed();
    player.speed=0;
    player.acc=0.85 + ups.speed*0.04;
    player.handling=getHandling();
    player.shield=getShieldMax();
    player.invul=0;
    rival.x=W*0.5 + (Math.random()-0.5)*120;
    rival.y=H*0.18;
    rival.baseSpeed=getRivalSpeed(lvl);
    rival.speed=rival.baseSpeed;
    rival.offset=0;
    obstacles=[]; collectibles=[]; particles=[]; trail=[];
    gameTime=0; score=0; tempCoins=0;
    levelStartTime=performance.now();
    spawnInitial();
  }

  function spawnInitial(){
    for(let i=0;i<12;i++){
      const y = -i*180 - Math.random()*120;
      if(Math.random()<0.65){
        obstacles.push({x:W*0.15+Math.random()*W*0.7,y,w:24+Math.random()*30,h:14+Math.random()*10,type:Math.random()<0.3?'peel':'block',rot:Math.random()*6});
      }
      if(Math.random()<0.5){
        collectibles.push({x:W*0.2+Math.random()*W*0.6,y:y-60,r:10,type:'coin',taken:false});
      }
    }
  }
  function spawnMore(){
    const lastY = obstacles.length? Math.min(...obstacles.map(o=>o.y)) : -H;
    if(lastY > -H*1.5){
      for(let i=0;i<6;i++){
        const y = lastY - 140 - Math.random()*100 - i*90;
        if(Math.random()<0.7) obstacles.push({x:W*0.12+Math.random()*W*0.76,y,w:22+Math.random()*32,h:12+Math.random()*14,type:Math.random()<0.35?'peel':'block',rot:Math.random()*6});
        if(Math.random()<0.55) collectibles.push({x:W*0.18+Math.random()*W*0.64,y:y-40,r:10,type:Math.random()<0.1?'shield':'coin',taken:false});
      }
    }
  }

  function openAd(type){
    if(window.vrAd!==0) return;
    _rewardPending=type;
    window.vrAdType=type;
    window.vrAd=1;
    pauseBefore=state;
    state='paused_ad';
  }

  function claimReward(){
    if(!_rewardPending) return;
    const t=_rewardPending;
    _rewardPending=null;
    window.vrAd=0; window.vrAdType=null; window._gm_shown=false;
    if(t==='double'){
      tempCoins*=2;
      coins+=tempCoins; setCoins(coins);
      continueNext();
    }else if(t==='revive'){
      player.shield=1; player.invul=1.5; state='playing'; renderUI();
    }else if(t==='shield'){
      player.shield=1; state='playing'; renderUI();
    }
  }
  function continueNext(){
    saveMax();
    const next=level+1;
    resetLevel(next);
    state='playing'; renderUI();
  }
  function continueWithoutDouble(){
    coins+=tempCoins; setCoins(coins);
    continueNext();
  }

  function renderUI(){
    if(state==='menu'){
      ui.innerHTML=`
        <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.18), transparent 60%), linear-gradient(180deg,#0f172a 0%,#1e1b4b 50%,#0a0e1e 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;text-align:center">
          <div style="font-size:11px;letter-spacing:0.25em;color:#fbbf24;margin-bottom:8px">WASA GAMES • ARCADE</div>
          <div style="font-size:42px;line-height:0.9;font-weight:900;color:white;text-shadow:0 0 20px rgba(251,191,36,0.5)">BANATRON<br><span style="color:#fbbf24">REVELACIÓN</span></div>
          <div style="margin-top:10px;color:#94a3b8;font-size:11px;max-width:320px">Esquivá obstáculos, juntá $WASA y no dejes que el rival te pase. Cada nivel el rival es un poquito más rápido.</div>
          <div style="margin-top:18px;background:rgba(0,0,0,0.4);border:1px solid rgba(251,191,36,0.2);border-radius:16px;padding:12px 16px;display:flex;gap:16px;font-size:11px;color:#cbd5e1">
            <div>Nivel max: <b style="color:#fff">${maxLevel}</b></div><div>•</div><div>$WASA: <b style="color:#fbbf24">${coins}</b></div><div>•</div><div>Rival L${level} <b style="color:#fff">${Math.round(getRivalSpeed(maxLevel))} km/h</b></div>
          </div>
          <div style="margin-top:16px;display:flex;flex-direction:column;gap:8px;width:100%;max-width:280px">
            <button onclick="window._bn_start(1)" style="background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#000;font-weight:900;padding:12px;border-radius:999px;box-shadow:0 0 20px rgba(251,191,36,0.4)">JUGAR NIVEL ${maxLevel>1?maxLevel:1}</button>
            <div style="display:flex;gap:8px">
              <button onclick="window._bn_openUpgrades()" style="flex:1;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:white;padding:10px;border-radius:999px;font-weight:700;font-size:12px">🔧 Mejoras</button>
              <button onclick="window._bn_start(1)" style="flex:1;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);color:#94a3b8;padding:10px;border-radius:999px;font-size:12px">Nivel 1</button>
            </div>
          </div>
          <div style="margin-top:12px;font-size:10px;color:rgba(255,255,255,0.25)">A/D o ← → para moverte • Espacio turbo</div>
        </div>
      `;
      window._bn_start=(lvl)=>{ resetLevel(lvl||maxLevel); state='playing'; renderUI(); };
      window._bn_openUpgrades=()=>{ state='upgrades'; renderUI(); };
    }else if(state==='upgrades'){
      const costs={speed:100+ups.speed*80, handling:80+ups.handling*60, shield:150+ups.shield*120, magnet:120+ups.magnet*90};
      ui.innerHTML=`
        <div style="position:absolute;inset:0;background:#0a0e1e;display:flex;flex-direction:column;padding:16px;overflow:auto">
          <div style="display:flex;justify-content:space-between;align-items:center"><div style="color:white;font-weight:900;font-size:16px">MEJORAS BANATRON</div><div style="color:#fbbf24;font-size:12px">$WASA ${coins}</div></div>
          <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:10px">
            ${[
              {k:'speed',name:'MOTOR',desc:`+10 vel max • Nv ${ups.speed}`,icon:'🏎️'},
              {k:'handling',name:'MANEJO',desc:`+giro • Nv ${ups.handling}`,icon:'🎯'},
              {k:'shield',name:'CÁSCARA',desc:ups.shield?`Escudo 1 vez`:`Sin escudo`,icon:'🛡️'},
              {k:'magnet',name:'IMÁN',desc:`Rango monedas • Nv ${ups.magnet}`,icon:'🧲'},
            ].map(u=>`
              <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(251,191,36,0.15);border-radius:14px;padding:12px">
                <div style="font-size:18px">${u.icon}</div><div style="color:white;font-weight:800;font-size:12px;margin-top:4px">${u.name}</div>
                <div style="color:#94a3b8;font-size:10px;margin-top:2px">${u.desc}</div>
                <button onclick="window._bn_buy('${u.k}')" style="margin-top:8px;width:100%;background:${coins>=costs[u.k]?'#fbbf24':'rgba(255,255,255,0.08)'};color:${coins>=costs[u.k]?'black':'#64748b'};padding:6px;border-radius:999px;font-weight:800;font-size:11px">${costs[u.k]} $WASA</button>
              </div>
            `).join('')}
          </div>
          <div style="margin-top:12px;display:flex;gap:8px">
            <button onclick="window._bn_backMenu()" style="flex:1;background:white;color:black;padding:10px;border-radius:999px;font-weight:800">VOLVER</button>
            <button onclick="window._bn_start(${maxLevel})" style="flex:1;background:#fbbf24;color:black;padding:10px;border-radius:999px;font-weight:800">JUGAR Lvl ${maxLevel}</button>
          </div>
          <div style="margin-top:10px;font-size:10px;color:#64748b">El rival sube +6 km/h por nivel + curva suave. Mejora motor para no quedarte atrás.</div>
        </div>
      `;
      window._bn_buy=(k)=>{
        const c=costs[k];
        if(coins<c) return;
        coins-=c; setCoins(coins); ups[k]=(ups[k]||0)+1; saveUps(); renderUI();
      };
      window._bn_backMenu=()=>{ state='menu'; renderUI(); };
      window._bn_start=(lvl)=>{ resetLevel(lvl); state='playing'; renderUI(); };
    }else if(state==='playing'){
      const pct=Math.min(100, (distance/distanceGoal)*100);
      ui.innerHTML=`
        <div style="position:absolute;top:10px;left:10px;right:10px;display:flex;justify-content:space-between;align-items:center;gap:8px">
          <div style="display:flex;gap:8px;align-items:center">
            <div style="background:rgba(0,0,0,0.6);border:1px solid rgba(251,191,36,0.25);border-radius:999px;padding:4px 10px;font-size:11px;color:white">NIVEL <b>${level}</b> • ${Math.round(pct)}%</div>
            <div style="background:rgba(0,0,0,0.5);border-radius:999px;padding:4px 10px;font-size:10px;color:#fbbf24">RIVAL ${Math.round(rival.speed)} km/h</div>
          </div>
          <div style="background:rgba(0,0,0,0.6);border-radius:999px;padding:4px 10px;font-size:11px;color:white">$WASA <b style="color:#fbbf24">${tempCoins}</b></div>
        </div>
        <div style="position:absolute;bottom:12px;left:12px;right:12px;height:6px;background:rgba(0,0,0,0.5);border-radius:999px;overflow:hidden;border:1px solid rgba(255,255,255,0.1)">
          <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#fbbf24,#f59e0b);transition:width 0.2s"></div>
        </div>
        <div style="position:absolute;bottom:22px;left:12px;color:rgba(255,255,255,0.5);font-size:9px">A/D o ← → mover • Mantén W/↑ turbo • Rival +${(getRivalSpeed(level+1)-getRivalSpeed(level)).toFixed(1)} km/h por nivel</div>
      `;
    }else if(state==='levelup'){
      const elapsed=((performance.now()-levelStartTime)/1000).toFixed(1);
      ui.innerHTML=`
        <div style="position:absolute;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:16px">
          <div style="background:#0f172a;border:1px solid rgba(251,191,36,0.3);border-radius:20px;padding:18px;max-width:340px;width:100%;text-align:center;box-shadow:0 0 30px rgba(251,191,36,0.2)">
            <div style="font-size:10px;letter-spacing:0.2em;color:#fbbf24">NIVEL ${level} COMPLETADO</div>
            <div style="margin-top:6px;color:white;font-weight:900;font-size:20px">¡GANASTE LA CARRERA!</div>
            <div style="margin-top:6px;color:#94a3b8;font-size:11px">Tiempo ${elapsed}s • Rival ${Math.round(getRivalSpeed(level))}→${Math.round(getRivalSpeed(level+1))} km/h (+${(getRivalSpeed(level+1)-getRivalSpeed(level)).toFixed(1)})</div>
            <div style="margin-top:12px;background:rgba(251,191,36,0.1);border-radius:12px;padding:10px;display:flex;justify-content:space-between;font-size:12px;color:white"><span>Recompensa</span><b style="color:#fbbf24">${tempCoins} $WASA</b></div>
            <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px">
              <button id="dbl" style="background:linear-gradient(135deg,#fbbf24,#f59e0b);color:black;font-weight:900;padding:10px;border-radius:999px">📺 x2 CON ANUNCIO (${tempCoins*2})</button>
              <button id="cont" style="background:white;color:black;font-weight:800;padding:10px;border-radius:999px">CONTINUAR NIVEL ${level+1}</button>
            </div>
            <div style="margin-top:8px;font-size:9px;color:#64748b">El rival será un poquito más rápido cada nivel</div>
          </div>
        </div>
      `;
      ui.querySelector('#dbl').onclick=()=>openAd('double');
      ui.querySelector('#cont').onclick=()=>continueWithoutDouble();
    }else if(state==='gameover'){
      ui.innerHTML=`
        <div style="position:absolute;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;padding:16px">
          <div style="background:#0f172a;border:1px solid rgba(239,68,68,0.3);border-radius:20px;padding:18px;max-width:320px;width:100%;text-align:center">
            <div style="color:#ef4444;font-weight:900;font-size:18px">¡CHOQUE!</div>
            <div style="margin-top:6px;color:#94a3b8;font-size:11px">Nivel ${level} • ${Math.round(distance/distanceGoal*100)}% completado • Rival a ${Math.round(rival.speed)} km/h</div>
            <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px">
              <button id="rev" style="background:linear-gradient(135deg,#38bdf8,#818cf8);color:white;font-weight:900;padding:10px;border-radius:999px">📺 REVIVIR CON ANUNCIO</button>
              <button id="retry" style="background:rgba(255,255,255,0.08);color:white;padding:10px;border-radius:999px">Reintentar nivel ${level}</button>
              <button id="menu" style="background:transparent;color:#64748b;padding:8px;font-size:11px">Menú</button>
            </div>
          </div>
        </div>
      `;
      ui.querySelector('#rev').onclick=()=>openAd('revive');
      ui.querySelector('#retry').onclick=()=>{ resetLevel(level); state='playing'; renderUI(); };
      ui.querySelector('#menu').onclick=()=>{ state='menu'; renderUI(); };
    }else if(state==='paused_ad'){
      ui.innerHTML=`<div style="position:absolute;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;color:white;font-size:12px">Cargando recompensa...</div>`;
    }else if(state==='reward_modal'){
      ui.innerHTML=`
        <div style="position:absolute;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;padding:16px">
          <div style="background:#0f172a;border:1px solid #38bdf8;border-radius:16px;padding:16px;max-width:300px;width:100%;text-align:center">
            <div style="color:#38bdf8;font-weight:900">¡RECOMPENSA LISTA!</div>
            <div style="margin-top:8px;color:white;font-size:12px">${_rewardPending==='double'?`x2 ${tempCoins*2} $WASA` : _rewardPending==='revive' ? 'Vuelves con escudo' : 'Recompensa'}</div>
            <button id="claim" style="margin-top:12px;width:100%;background:#38bdf8;color:#0f172a;font-weight:900;padding:10px;border-radius:999px">RECLAMAR</button>
          </div>
        </div>
      `;
      ui.querySelector('#claim').onclick=claimReward;
    }
  }

  // Input
  addEventListener('keydown',e=>{
    if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A') keys.left=true;
    if(e.key==='ArrowRight'||e.key==='d'||e.key==='D') keys.right=true;
    if(e.key==='ArrowUp'||e.key==='w'||e.key==='W'||e.key===' ') keys.up=true;
  });
  addEventListener('keyup',e=>{
    if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A') keys.left=false;
    if(e.key==='ArrowRight'||e.key==='d'||e.key==='D') keys.right=false;
    if(e.key==='ArrowUp'||e.key==='w'||e.key==='W'||e.key===' ') keys.up=false;
  });
  canvas.addEventListener('pointerdown',e=>{
    const rect=canvas.getBoundingClientRect();
    const x=e.clientX-rect.left;
    if(x<W*0.33) keys.left=true;
    else if(x>W*0.66) keys.right=true;
    else keys.up=true;
  });
  canvas.addEventListener('pointerup',()=>{ keys.left=false; keys.right=false; keys.up=false; });

  let watcher=setInterval(()=>{ if(window.vrAd===4 && _rewardPending && state!=='reward_modal'){ state='reward_modal'; renderUI(); } },150);

  let raf;
  function loop(now){
    if(window.vrAd===1||window.vrAd===2||window.vrAd===3){ raf=requestAnimationFrame(loop); return; }
    const dt=Math.min((now-last)/1000,0.033); last=now;
    if(state==='playing'){
      gameTime+=dt;
      // player movement
      const steer = (keys.left?-1:0)+(keys.right?1:0);
      player.x += steer * (120 + player.handling*400 + (keys.up?80:0)) * dt;
      player.x = Math.max(W*0.12, Math.min(W*0.88, player.x));
      player.speed = Math.min(player.maxSpeed, player.speed + (keys.up? 90: 40)*dt);
      if(player.invul>0) player.invul-=dt;

      // rival AI slight wiggle
      rival.offset += dt*1.2;
      rival.x += Math.sin(rival.offset)*30*dt;
      rival.x = Math.max(W*0.15, Math.min(W*0.85, rival.x));
      rival.speed = rival.baseSpeed + Math.sin(gameTime*0.7)*8;

      const scroll = player.speed * dt * 0.9;
      distance += scroll;

      // move world down
      for(let o of obstacles){ o.y+=scroll; o.rot+=dt*2; }
      for(let c of collectibles){ c.y+=scroll; }
      obstacles=obstacles.filter(o=>o.y<H+100);
      collectibles=collectibles.filter(c=>!c.taken && c.y<H+120);

      spawnMore();

      // collisions
      for(let o of obstacles){
        if(Math.abs(o.y-player.y)<20 && Math.abs(o.x-player.x)< (o.w/2+player.w/2)-6){
          if(player.shield>0){
            player.shield=0; player.invul=1.2;
            for(let k=0;k<16;k++) particles.push({x:o.x,y:o.y,vx:(Math.random()-0.5)*200,vy:(Math.random()-0.5)*200,life:1,color:'#fbbf24'});
            o.y=H+200;
          }else if(player.invul<=0){
            // crash
            for(let k=0;k<24;k++) particles.push({x:player.x,y:player.y,vx:(Math.random()-0.5)*300,vy:(Math.random()-0.5)*300,life:1,color:'#ef4444'});
            state='gameover'; renderUI(); break;
          }
        }
      }
      // collect coins with magnet
      const magnetRange = 30 + ups.magnet*18;
      for(let c of collectibles){
        const dx=c.x-player.x, dy=c.y-player.y;
        const dist=Math.hypot(dx,dy);
        if(dist < magnetRange+20){
          c.x += (player.x-c.x)*dt*6;
          c.y += (player.y-c.y)*dt*6;
        }
        if(dist<22 && !c.taken){
          c.taken=true;
          if(c.type==='coin'){ tempCoins+=1; score+=10; }
          if(c.type==='shield'){ player.shield=1; }
          particles.push({x:c.x,y:c.y,vx:0,vy:-60,life:1,color:'#fbbf24',text:'+1'});
        }
      }

      if(distance>=distanceGoal){
        state='levelup'; renderUI();
      }
    }

    // particles
    for(let i=particles.length-1;i>=0;i--){ let p=particles[i]; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=80*dt; p.life-=dt*1.2; if(p.life<=0) particles.splice(i,1); }

    // draw
    // road
    const grad=ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0,"#1e1b4b"); grad.addColorStop(0.5,"#1e293b"); grad.addColorStop(1,"#0f172a");
    ctx.fillStyle=grad; ctx.fillRect(0,0,W,H);
    // track borders
    ctx.fillStyle="rgba(0,0,0,0.4)"; ctx.fillRect(0,0,W*0.1,H); ctx.fillRect(W*0.9,0,W*0.1,H);
    // dashed center lines moving
    ctx.strokeStyle="rgba(251,191,36,0.25)"; ctx.lineWidth=2; ctx.setLineDash([14,18]);
    const dashOffset=(gameTime*player.speed*0.3)%32;
    ctx.lineDashOffset=-dashOffset;
    ctx.beginPath(); ctx.moveTo(W*0.5,0); ctx.lineTo(W*0.5,H); ctx.stroke(); ctx.setLineDash([]);
    // side lines
    ctx.fillStyle="rgba(251,191,36,0.15)"; ctx.fillRect(W*0.1,0,2,H); ctx.fillRect(W*0.9-2,0,2,H);

    // obstacles
    for(let o of obstacles){
      ctx.save(); ctx.translate(o.x,o.y); ctx.rotate(o.rot*0.1);
      if(o.type==='peel'){ ctx.fillStyle="#facc15"; ctx.beginPath(); ctx.ellipse(0,0,o.w*0.5,o.h*0.5,0,0,Math.PI*2); ctx.fill(); ctx.fillStyle="#eab308"; ctx.beginPath(); ctx.ellipse(2,2,o.w*0.2,o.h*0.3,0,0,Math.PI*2); ctx.fill(); }
      else{ ctx.fillStyle="#334155"; ctx.fillRect(-o.w/2,-o.h/2,o.w,o.h); ctx.fillStyle="#475569"; ctx.fillRect(-o.w/2+2,-o.h/2+2,o.w-4,4); }
      ctx.restore();
    }
    // collectibles
    for(let c of collectibles){
      if(c.type==='coin'){ ctx.fillStyle="#fbbf24"; ctx.shadowColor="#fbbf24"; ctx.shadowBlur=10; ctx.beginPath(); ctx.arc(c.x,c.y,c.r,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0; ctx.fillStyle="#000"; ctx.font="bold 10px Inter"; ctx.fillText("$",c.x-3,c.y+3); }
      else if(c.type==='shield'){ ctx.fillStyle="#38bdf8"; ctx.beginPath(); ctx.arc(c.x,c.y,c.r,0,Math.PI*2); ctx.fill(); ctx.fillStyle="white"; ctx.fillText("S",c.x-4,c.y+3); }
    }
    // rival trail
    if(state==='playing'){
      ctx.save(); ctx.globalAlpha=0.6;
      ctx.fillStyle=rival.speed>player.speed ? "#ef4444" : "#22c55e";
      ctx.beginPath(); ctx.ellipse(rival.x,rival.y+8,18,6,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#1e293b"; ctx.beginPath(); ctx.roundRect(rival.x-16,rival.y-10,32,14,4); ctx.fill();
      ctx.fillStyle=rival.speed>player.speed ? "#fca5a5" : "#86efac"; ctx.fillRect(rival.x-12,rival.y-6,24,3);
      ctx.restore();
    }
    // player
    if(state==='playing' || state==='gameover'){
      const blink = player.invul>0 ? Math.sin(gameTime*20)>0 : true;
      if(blink){
        ctx.save(); ctx.translate(player.x,player.y);
        if(player.shield>0){ ctx.strokeStyle="#38bdf8"; ctx.lineWidth=3; ctx.shadowColor="#38bdf8"; ctx.shadowBlur=12; ctx.beginPath(); ctx.ellipse(0,0,26,16,0,0,Math.PI*2); ctx.stroke(); ctx.shadowBlur=0; }
        ctx.fillStyle="#fbbf24"; ctx.shadowColor="#fbbf24"; ctx.shadowBlur=14;
        ctx.beginPath(); ctx.roundRect(-18,-9,36,18,6); ctx.fill();
        ctx.fillStyle="#0f172a"; ctx.fillRect(-14,-4,10,3); ctx.fillRect(6,-4,10,3);
        ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(12,-2,3,0,Math.PI*2); ctx.fill();
        ctx.restore();
      }
    }
    // particles
    for(let p of particles){
      ctx.globalAlpha=p.life;
      if(p.text){ ctx.fillStyle=p.color; ctx.font="bold 12px Inter"; ctx.fillText(p.text,p.x,p.y); }
      else{ ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,3,0,Math.PI*2); ctx.fill(); }
    }
    ctx.globalAlpha=1;

    raf=requestAnimationFrame(loop);
  }

  renderUI(); resetLevel(maxLevel); state='menu'; renderUI();
  raf=requestAnimationFrame(loop);

  container._cleanup=()=>{ cancelAnimationFrame(raf); clearInterval(watcher); ro.disconnect(); window.vrAd=0; window.vrAdType=null; };
}
