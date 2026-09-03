export function init(container, args){
  const getCoins = args.getCoins||(()=>parseFloat(localStorage.getItem('wasa_coins')||'0'));
  const setCoins = args.setCoins||((n)=>localStorage.setItem('wasa_coins',n));
  container.innerHTML = `
    <style>
      .sw{width:100%;height:100%;position:relative;background:#0a0e1e;overflow:hidden;font-family:Inter,system-ui,sans-serif;user-select:none}
      .sw canvas{width:100%;height:100%;display:block}
      .sw-ui{position:absolute;inset:0;pointer-events:none}
      .sw-ui button{pointer-events:auto}
    </style>
    <div class="sw"><canvas id="c"></canvas><div id="ui" class="sw-ui"></div></div>
  `;
  const wrap=container.querySelector('.sw');
  const canvas=wrap.querySelector('#c');
  const ctx=canvas.getContext('2d');
  const ui=wrap.querySelector('#ui');
  let W=wrap.clientWidth,H=wrap.clientHeight;
  function resize(){W=wrap.clientWidth;H=wrap.clientHeight;const dpr=devicePixelRatio||1;canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0);}
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
  function fmtWASA(n){ return (Math.round(n*1000000)/1000000).toFixed(6).replace(/0+$/,'').replace(/\.$/,''); }
  function getPlayerMax(){ return 165 + getTotal()*1.1 + ups.v.main*1.2; }
  function getRivalBase(lvl){ return 140 + lvl*4.5 + Math.pow(lvl,0.55)*5; }

  let state='menu', level=1, distance=0, goal=2200, tempCoins=0, score=0;
  let player={x:0,y:0,w:28,h:52,speed:0,shield:0,invul:0};
  let rivals=[], obstacles=[], coinsArr=[], particles=[];
  let keys={l:false,r:false,up:false}, gameTime=0, last=performance.now();
  let _rewardPending=null;
  let levelStart=0;

  function resetLevel(lvl){
    level=lvl; distance=0; levelStart=performance.now(); goal=2000+lvl*240+Math.pow(lvl,1.15)*25;
    player.x=W*0.5; player.y=H*0.78; player.speed=0; player.shield=ups.v.main>=3?1:0; player.invul=0;
    rivals=[]; obstacles=[]; coinsArr=[]; particles=[]; gameTime=0; tempCoins=0; score=0; levelStart=performance.now();
    for(let i=0;i<10;i++){ spawnBatch(-i*220); }
  }

  function spawnBatch(baseY){
    const y = baseY - Math.random()*180;
    if(Math.random()<0.75){
      rivals.push({x:W*0.18+Math.random()*W*0.64, y:y, w:26+Math.random()*8, h:44+Math.random()*10, speed:getRivalBase(level)*0.85+Math.random()*20, color:Math.random()<0.5?'#ef4444':'#3b82f6'});
    }
    if(Math.random()<0.7){
      obstacles.push({x:W*0.15+Math.random()*W*0.7, y:y-90, w:18+Math.random()*28, h:14+Math.random()*10, type:Math.random()<0.4?'cone':'rock'});
    }
    if(Math.random()<0.6){
      coinsArr.push({x:W*0.2+Math.random()*W*0.6, y:y-50, r:9, taken:false});
    }
  }

  function openAd(t){ if(window.vrAd!==0) return; _rewardPending=t; window.vrAdType=t; window.vrAd=1; state='paused_ad'; }
  function claimReward(){
    const t=_rewardPending; _rewardPending=null; window.vrAd=0; window.vrAdType=null; window._gm_shown=false;
    if(t==='double'){ tempCoins*=2; if(tempCoins>0){ coins+=tempCoins; setCoins(coins); }; setCoins(coins); level++; saveMax(); resetLevel(level); state='playing'; renderUI(); }
    else if(t==='revive'){ player.shield=1; player.invul=1.5; state='playing'; renderUI(); }
  }

  function renderUpgrades(){
    const total=getTotal(), pct=Math.round(total/100*100), m=ups.v.main, s=ups.v.sub;
    const cost=getCost(m,s);
    let nM=m, nS=s+1; if(nS>=5){ nM++; nS=0; }
    const nextTotal=nM*5+nS;
    const curMax=getPlayerMax(), nextMax=165+nextTotal*1.1+nM*1.2;
    const canBuy=coins>=cost && total<100;
    ui.innerHTML=`
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,#0a0e1e,#1e1b4b);padding:12px;overflow:auto">
        <div style="display:flex;justify-content:space-between;align-items:center"><div style="color:white;font-weight:900">MEJORAS SPEED WARRIOR</div><div style="color:#fbbf24;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.2);border-radius:999px;padding:4px 10px;font-size:12px">$WASA ${coins}</div></div>
        <div style="margin-top:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(251,191,36,0.25);border-radius:16px;padding:14px">
          <div style="display:flex;justify-content:space-between"><div style="color:white;font-weight:800">🏎️ MOTOR • VELOCIDAD</div><div style="color:#fbbf24;font-weight:800">${total}/100 • ${pct}%</div></div>
          <div style="margin-top:8px;height:10px;background:rgba(0,0,0,0.5);border-radius:999px;display:flex;gap:2px;padding:2px">
            ${Array.from({length:20}).map((_,mi)=>{
              const f=mi<m?1:mi===m?s/5:0;
              return `<div style="flex:1;background:rgba(0,0,0,0.4);border-radius:999px;overflow:hidden"><div style="height:100%;width:${f*100}%;background:linear-gradient(90deg,#fbbf24,#f59e0b)"></div></div>`;
            }).join('')}
          </div>
          <div style="margin-top:6px;display:flex;justify-content:space-between;font-size:9px;color:#64748b"><span>0</span><span>MAIN ${m} • SUB ${s}/5</span><span>100</span></div>
          <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px">
            <div style="background:rgba(0,0,0,0.3);border-radius:10px;padding:8px"><div style="color:#94a3b8">Tu max actual</div><div style="color:white;font-weight:800">${curMax.toFixed(1)} km/h</div></div>
            <div style="background:rgba(239,68,68,0.08);border-radius:10px;padding:8px"><div style="color:#fca5a5">Rival Round ${level}</div><div style="color:white;font-weight:800">${getRivalBase(level).toFixed(1)} km/h (+4.5/lvl)</div></div>
          </div>
          <button id="buy" style="margin-top:12px;width:100%;background:${canBuy?'linear-gradient(135deg,#fbbf24,#f59e0b)':'#1e293b'};color:${canBuy?'black':'#475569'};padding:12px;border-radius:999px;font-weight:900">${total>=100?'MAX 100/100':`MEJORAR ${m}-${s} → ${nM}-${nS} • ${fmtWASA(cost)} $WASA • +${(nextMax-curMax).toFixed(1)} km/h`}</button>
          <div style="margin-top:6px;font-size:9px;color:#64748b;text-align:center">Rival sube +4.5 km/h por nivel (poquito) • 20 main x 5 sub = 100 niveles</div>
        </div>
        <div style="margin-top:12px;display:flex;gap:8px"><button id="back" style="flex:1;background:white;color:black;padding:10px;border-radius:999px;font-weight:800">VOLVER</button><button id="play" style="flex:1;background:#fbbf24;color:black;padding:10px;border-radius:999px;font-weight:800">JUGAR LVL ${level}</button></div>
      </div>
    `;
    ui.querySelector('#buy')?.addEventListener('click',()=>{
      if(total>=100||coins<cost) return;
      coins-=cost; setCoins(coins);
      ups.v.sub++; if(ups.v.sub>=5){ ups.v.sub=0; ups.v.main++; }
      saveUps(); renderUpgrades();
    });
    ui.querySelector('#back').onclick=()=>{ state='menu'; renderUI(); };
    ui.querySelector('#play').onclick=()=>{ resetLevel(level); state='playing'; renderUI(); };
  }

  function renderUI(){
    if(state==='menu'){
      const total=getTotal();
      ui.innerHTML=`
        <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.18), transparent 60%), linear-gradient(180deg,#0f172a,#1e1b4b);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14px;text-align:center">
          <div style="font-size:10px;letter-spacing:0.25em;color:#fbbf24">ROAD FIGHTER STYLE • 100 NIVELES</div>
          <div style="margin-top:6px;font-size:36px;font-weight:900;color:white;line-height:0.9">SPEED<br><span style="color:#fbbf24">WARRIOR</span></div>
          <div style="margin-top:8px;color:#64748b;font-size:10px">LVL ${level} • MAX ${maxLevel} • VEL ${total}/100 • TU ${getPlayerMax().toFixed(0)} km/h • RIVAL ${getRivalBase(level).toFixed(0)}</div>
          <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px;width:100%;max-width:280px">
            <button id="play" style="background:linear-gradient(135deg,#fbbf24,#f59e0b);color:black;font-weight:900;padding:12px;border-radius:999px">JUGAR NIVEL ${level}</button>
            <div style="display:flex;gap:8px"><button id="upg" style="flex:1;background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.25);color:#fbbf24;padding:10px;border-radius:999px;font-weight:800">⚡ MEJORAS ${total}/100</button><button id="reset" style="flex:1;background:rgba(255,255,255,0.06);color:#94a3b8;padding:10px;border-radius:999px;font-size:12px">Reset</button></div>
          </div>
          <div style="margin-top:10px;font-size:9px;color:rgba(255,255,255,0.3)">A/D o ← → mover • W turbo • Rival +4.5 km/h por nivel</div>
        </div>
      `;
      ui.querySelector('#play').onclick=()=>{ resetLevel(level); state='playing'; renderUI(); };
      ui.querySelector('#upg').onclick=()=>{ state='upgrades'; renderUpgrades(); };
      ui.querySelector('#reset').onclick=()=>{ level=1; renderUI(); };
    }else if(state==='upgrades'){ renderUpgrades(); }
    else if(state==='playing'){
      const pct=Math.min(100,distance/goal*100);
      ui.innerHTML=`
        <div style="position:absolute;top:8px;left:8px;right:8px;display:flex;justify-content:space-between;font-size:10px;color:white">
          <div style="background:rgba(0,0,0,0.6);border-radius:999px;padding:4px 10px">LVL ${level} • ${pct.toFixed(0)}% • ${getTotal()}/100</div>
          <div style="background:rgba(0,0,0,0.6);border-radius:999px;padding:4px 10px;color:#fbbf24">$WASA ${tempCoins}</div>
        </div>
        <div style="position:absolute;bottom:10px;left:10px;right:10px;height:5px;background:rgba(0,0,0,0.5);border-radius:999px;overflow:hidden"><div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#fbbf24,#f59e0b)"></div></div>
      `;
    }else if(state==='levelup'){
      ui.innerHTML=`
        <div style="position:absolute;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;padding:12px">
          <div style="background:#0f172a;border:1px solid #fbbf24;border-radius:16px;padding:14px;max-width:300px;width:100%;text-align:center">
            <div style="font-size:10px;letter-spacing:0.2em;color:#fbbf24">NIVEL ${level} COMPLETADO</div>
            <div style="color:white;font-weight:900;margin-top:6px">¡META ALCANZADA!</div>
            <div style="margin-top:8px;background:rgba(251,191,36,0.1);border-radius:10px;padding:8px;display:flex;justify-content:space-between;color:white;font-size:12px"><span>Recompensa</span><b style="color:#fbbf24">${tempCoins} $WASA</b></div>
            <div style="margin-top:10px;display:flex;flex-direction:column;gap:8px"><button id="dbl" style="background:linear-gradient(135deg,#fbbf24,#f59e0b);color:black;font-weight:900;padding:10px;border-radius:999px">📺 x2 (${tempCoins*2})</button><button id="next" style="background:white;color:black;font-weight:800;padding:10px;border-radius:999px">SIGUIENTE ${level+1}</button></div>
          </div>
        </div>
      `;
      ui.querySelector('#dbl').onclick=()=>openAd('double');
      ui.querySelector('#next').onclick=()=>{ if(tempCoins>0){ coins+=tempCoins; setCoins(coins); }; setCoins(coins); level++; saveMax(); resetLevel(level); state='playing'; renderUI(); };
    }else if(state==='gameover'){
      tempCoins=0;
      ui.innerHTML=`
        <div style="position:absolute;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;padding:12px">
          <div style="background:#0f172a;border:1px solid #ef4444;border-radius:16px;padding:14px;max-width:300px;width:100%;text-align:center">
            <div style="color:#ef4444;font-weight:900">¡CHOQUE!</div><div style="margin-top:6px;font-size:10px;color:#ef4444">0 $WASA • Sin recompensa por perder</div>
            <div style="margin-top:8px;display:flex;flex-direction:column;gap:8px"><button id="rev" style="background:#38bdf8;color:white;font-weight:900;padding:10px;border-radius:999px">📺 REVIVIR</button><button id="retry" style="background:rgba(255,255,255,0.08);color:white;padding:10px;border-radius:999px">Reintentar</button><button id="menu" style="color:#64748b;padding:8px;font-size:11px">Menú</button></div>
          </div>
        </div>
      `;
      ui.querySelector('#rev').onclick=()=>openAd('revive');
      ui.querySelector('#retry').onclick=()=>{ resetLevel(level); state='playing'; renderUI(); };
      ui.querySelector('#menu').onclick=()=>{ state='menu'; renderUI(); };
    }else if(state==='paused_ad'){ ui.innerHTML=`<div style="position:absolute;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;color:white">Cargando...</div>`; }
    else if(state==='reward_modal'){ ui.innerHTML=`<div style="position:absolute;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;padding:12px"><div style="background:#0f172a;border:1px solid #fbbf24;border-radius:12px;padding:12px;width:100%;max-width:260px;text-align:center"><div style="color:#fbbf24;font-weight:900">¡RECOMPENSA!</div><button id="claim" style="margin-top:8px;width:100%;background:#fbbf24;color:black;font-weight:900;padding:10px;border-radius:999px">RECLAMAR</button></div></div>`; ui.querySelector('#claim').onclick=claimReward; }
  }

  addEventListener('keydown',e=>{ if(e.key==='ArrowLeft'||e.key==='a') keys.l=true; if(e.key==='ArrowRight'||e.key==='d') keys.r=true; if(e.key==='ArrowUp'||e.key==='w'||e.key===' ') keys.up=true; });
  addEventListener('keyup',e=>{ if(e.key==='ArrowLeft'||e.key==='a') keys.l=false; if(e.key==='ArrowRight'||e.key==='d') keys.r=false; if(e.key==='ArrowUp'||e.key==='w'||e.key===' ') keys.up=false; });
  canvas.addEventListener('pointerdown',e=>{ const x=e.clientX-canvas.getBoundingClientRect().left; if(x<W*0.33) keys.l=true; else if(x>W*0.66) keys.r=true; else keys.up=true; });
  canvas.addEventListener('pointerup',()=>{ keys.l=false; keys.r=false; keys.up=false; });

  let watcher=setInterval(()=>{ if(window.vrAd===4 && _rewardPending && state!=='reward_modal'){ state='reward_modal'; renderUI(); } },150);
  let raf;
  function loop(now){
    if(window.vrAd===1||window.vrAd===2||window.vrAd===3){ raf=requestAnimationFrame(loop); return; }
    const dt=Math.min((now-last)/1000,0.033); last=now;
    if(state==='playing'){
      gameTime+=dt;
      const steer=(keys.l?-1:0)+(keys.r?1:0);
      player.x+=steer*(160+getTotal()*1.5 + (keys.up?90:0))*dt;
      player.x=Math.max(W*0.14, Math.min(W*0.86, player.x));
      player.speed=Math.min(getPlayerMax(), player.speed + (keys.up?110:55)*dt);
      if(player.invul>0) player.invul-=dt;
      const scroll=player.speed*dt*0.9;
      distance+=scroll;
      for(let o of rivals){ o.y+=scroll; }
      for(let o of obstacles){ o.y+=scroll; }
      for(let o of coinsArr){ o.y+=scroll; }
      rivals=rivals.filter(o=>o.y<H+120);
      obstacles=obstacles.filter(o=>o.y<H+120);
      coinsArr=coinsArr.filter(c=>!c.taken && c.y<H+120);
      if(rivals.length<8) spawnBatch(-H*1.2);
      // collisions
      for(let o of rivals){
        if(Math.abs(o.y-player.y)<28 && Math.abs(o.x-player.x)<22){
          if(player.shield>0){ player.shield=0; player.invul=1.2; o.y=H+200; for(let k=0;k<12;k++) particles.push({x:o.x,y:o.y,vx:(Math.random()-0.5)*200,vy:(Math.random()-0.5)*200,life:1,color:'#fbbf24'}); }
          else if(player.invul<=0){ state='gameover'; renderUI(); break; }
        }
      }
      for(let o of obstacles){
        if(Math.abs(o.y-player.y)<22 && Math.abs(o.x-player.x)<18){
          if(player.shield>0){ player.shield=0; player.invul=1.2; o.y=H+200; }
          else if(player.invul<=0){ state='gameover'; renderUI(); break; }
        }
      }
      for(let c of coinsArr){
        if(!c.taken && Math.hypot(c.x-player.x,c.y-player.y)<22){ c.taken=true; score+=10; particles.push({x:c.x,y:c.y,vx:0,vy:-60,life:1,color:'#fbbf24',text:'+1'}); }
      }
      if(distance>=goal){ const elapsed=(performance.now()-levelStart)/1000; const base=getBaseWASA(level); const mult=getTimeMult(elapsed); tempCoins=base*mult; state='levelup'; renderUI(); }
    }
    for(let i=particles.length-1;i>=0;i--){ let p=particles[i]; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=80*dt; p.life-=dt*1.2; if(p.life<=0) particles.splice(i,1); }
    // draw
    const grad=ctx.createLinearGradient(0,0,0,H); grad.addColorStop(0,"#1e1b4b"); grad.addColorStop(1,"#0f172a"); ctx.fillStyle=grad; ctx.fillRect(0,0,W,H);
    ctx.fillStyle="rgba(0,0,0,0.4)"; ctx.fillRect(0,0,W*0.1,H); ctx.fillRect(W*0.9,0,W*0.1,H);
    ctx.strokeStyle="rgba(251,191,36,0.2)"; ctx.setLineDash([16,20]); ctx.lineDashOffset=-(gameTime*player.speed*0.3)%36; ctx.beginPath(); ctx.moveTo(W*0.5,0); ctx.lineTo(W*0.5,H); ctx.stroke(); ctx.setLineDash([]);
    for(let o of obstacles){ ctx.fillStyle=o.type==='cone'?'#fbbf24':'#475569'; ctx.fillRect(o.x-o.w/2,o.y-o.h/2,o.w,o.h); }
    for(let c of coinsArr){ if(c.taken) continue; ctx.fillStyle="#fbbf24"; ctx.shadowColor="#fbbf24"; ctx.shadowBlur=8; ctx.beginPath(); ctx.arc(c.x,c.y,c.r,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0; }
    for(let o of rivals){ ctx.fillStyle=o.color; ctx.fillRect(o.x-o.w/2,o.y-o.h/2,o.w,o.h); ctx.fillStyle="rgba(0,0,0,0.4)"; ctx.fillRect(o.x-o.w/2+2,o.y-o.h/2+2,o.w-4,6); }
    const blink=player.invul>0?Math.sin(gameTime*20)>0:true;
    if(blink){ ctx.save(); ctx.translate(player.x,player.y); if(player.shield>0){ ctx.strokeStyle="#38bdf8"; ctx.lineWidth=3; ctx.shadowColor="#38bdf8"; ctx.shadowBlur=10; ctx.beginPath(); ctx.ellipse(0,0,20,30,0,0,Math.PI*2); ctx.stroke(); ctx.shadowBlur=0; } ctx.fillStyle="#fbbf24"; ctx.shadowColor="#fbbf24"; ctx.shadowBlur=12; ctx.fillRect(-14,-26,28,52); ctx.fillStyle="#0f172a"; ctx.fillRect(-10,-18,20,8); ctx.restore(); }
    for(let p of particles){ ctx.globalAlpha=p.life; if(p.text){ ctx.fillStyle=p.color; ctx.font="bold 12px Inter"; ctx.fillText(p.text,p.x,p.y); } else{ ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,3,0,Math.PI*2); ctx.fill(); } } ctx.globalAlpha=1;
    raf=requestAnimationFrame(loop);
  }
  renderUI(); resetLevel(maxLevel); state='menu'; renderUI();
  raf=requestAnimationFrame(loop);
  container._cleanup=()=>{ cancelAnimationFrame(raf); clearInterval(watcher); ro.disconnect(); window.vrAd=0; };
}
