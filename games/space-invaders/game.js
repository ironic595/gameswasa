export function init(container, args){
  const quality = args.quality || 'hd';
  const getCoins = args.getCoins || (()=>0);
  const setCoins = args.setCoins || (()=>{});
  const showAd = args.showAd || (async ()=>{});
  
  container.innerHTML = '<div class="wg" style="width:100%;height:100%;position:relative;background:linear-gradient(180deg,#2046a3 0%,#315bd5 100%);overflow:hidden"><canvas id="c" style="width:100%;height:100%;display:block"></canvas><div id="ui" style="position:absolute;inset:0;pointer-events:none"></div></div>';
  const wrap = container.querySelector('.wg');
  const canvas = container.querySelector('#c');
  const ctx = canvas.getContext('2d');
  const ui = container.querySelector('#ui');
  let W=wrap.clientWidth,H=wrap.clientHeight;
  function resize(){W=wrap.clientWidth;H=wrap.clientHeight;const dpr=window.devicePixelRatio||1;canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0);}
  resize(); const ro=new ResizeObserver(resize); ro.observe(wrap);
  let maxLevel=parseInt(localStorage.getItem('wasa_max_level')||'1');
  let game={ships:[],cross:{x:W/2,y:H*0.62,dir:1,speed:420},power:{v:50,dir:1,speed:82,state:'moving',locked:50},bullets:[],stars:[],level:1,points:0,misses:0,levelStart:0};
  let state='menu', tempCoins=0,tempPoints=0,adUses=0;
  for(let i=0;i<(quality==='lite'?70:140);i++) game.stars.push({x:Math.random()*W,y:Math.random()*H*0.85,size:Math.random()*1.6+0.4,tw:Math.random()*2+0.5,off:Math.random()*6});
  function getCfg(lv){const tier=Math.min(Math.floor((lv-1)/10),9); const names=['SCOUT','RAIDER','DUO','ACORAZADO','FANTASMA','ZIGZAG','AVISPA','BOMBER','TELEPORT','BOSS TITAN']; return {name:names[tier],w:78+tier*8,h:26,hp:20+tier*8+lv*4,speed:90+tier*5,count:(tier===2||tier===6)?2:1,behavior:['normal','normal','duo','zigzag','ghost','zigzag_fast','tiny_fast','bomber','teleport','boss'][tier]};}
  function createShip(lv,i=0,tot=1){const cfg=getCfg(lv); return {x:Math.random()>0.5?-120:W+120,y:H*0.12+i*(H*0.22/tot)+Math.random()*H*0.1,w:cfg.w,h:cfg.h,hp:cfg.hp,maxHp:cfg.hp,dir:Math.random()>0.5?1:-1,speed:cfg.speed+lv*2,hitFlash:0,cfg,zigTimer:0,teleportTimer:0,originalY:0,ghostTimer:0};}
  function initShips(lv){const cfg=getCfg(lv); const cnt=cfg.count||1; game.ships=[]; for(let k=0;k<cnt;k++){const s=createShip(lv,k,cnt); s.originalY=s.y; game.ships.push(s);}}
  function startGame(lv=1){game.level=lv;game.points=lv>1?(lv-1)*100:0;game.misses=0;game.bullets=[];game.power={v:50,dir:1,speed:82,state:'moving',locked:50};game.cross={x:W/2,y:H*0.62,dir:1,speed:420};initShips(lv);game.levelStart=performance.now();state='playing';adUses=0;renderUI();}
  function drawShip(s){if(s.cfg.behavior==='ghost'){s.ghostTimer+=0.016; if(Math.sin(s.ghostTimer*2)>0.7) return;} ctx.save();ctx.translate(s.x,s.y);ctx.fillStyle=s.hitFlash>0?'#ffaaaa':'#cfe0ff';ctx.beginPath();ctx.ellipse(0,6,s.w*0.52,s.h*0.72,0,0,Math.PI*2);ctx.fill();ctx.restore();}
  function drawCross(x,y,locked){ctx.save();ctx.translate(x,y);ctx.strokeStyle=locked?'#ffde59':'#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,40,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(-60,0);ctx.lineTo(-20,0);ctx.moveTo(20,0);ctx.lineTo(60,0);ctx.moveTo(0,-60);ctx.lineTo(0,-20);ctx.moveTo(0,20);ctx.lineTo(0,60);ctx.stroke();ctx.restore();}
  function renderUI(){
    if(!ui) return; const cfg=getCfg(game.level); let h='';
    h+='<div style="position:absolute;top:0;left:0;right:0;padding:10px;display:flex;justify-content:space-between;pointer-events:auto"><div style="color:white;font-weight:900;font-size:10px">'+cfg.name+' • NIVEL '+game.level+'</div><div style="display:flex;gap:6px"><div style="background:rgba(0,0,0,0.3);padding:4px 8px;border-radius:999px;color:white;font-size:10px">TIROS '+(5-game.misses)+'/5</div><div style="background:#38bdf8;color:#0f172a;padding:4px 8px;border-radius:999px;font-size:10px;font-weight:800">💰 '+getCoins()+'</div></div></div>';
    if(state==='playing'){h+='<div style="position:absolute;bottom:0;left:0;right:0;padding:12px;display:flex;justify-content:space-between;pointer-events:none"><div style="pointer-events:auto;text-align:center"><div style="font-size:8px;color:white;margin-bottom:4px">POTENCIA '+Math.round(game.power.state==='locked'?game.power.locked:game.power.v)+'%</div><div style="width:40px;height:150px;background:rgba(0,0,0,0.4);border-radius:16px;padding:5px;display:flex;flex-direction:column;justify-content:end"><div style="width:100%;border-radius:10px;height:'+(game.power.state==='locked'?game.power.locked:game.power.v)+'%;background:linear-gradient(180deg,#fff,#ffde59 60%,#ff6a2a)"></div></div></div><button id="shootBtn" style="pointer-events:auto;padding:12px 24px;border-radius:999px;font-weight:900;background:'+(game.power.state==='locked'?'#ffde59':'rgba(255,255,255,0.2)')+';color:'+(game.power.state==='locked'?'black':'white')+';border:2px solid black">'+(game.power.state==='moving'?'FIJAR':'DISPARAR')+'</button></div>';}
    if(state==='menu'){h+='<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(5,8,20,0.5);backdrop-filter:blur(8px);pointer-events:auto"><div style="width:100%;max-width:460px;border-radius:24px;background:#0a0f24;border:1px solid rgba(56,189,248,0.2);padding:20px"><h1 style="color:white;font-weight:900;font-size:28px">STAR SHOOTER<br><span style="color:#38bdf8">WARS</span> • LVL '+maxLevel+'</h1><button id="btn-ckpt" style="margin-top:14px;width:100%;background:#38bdf8;color:#0f172a;font-weight:800;padding:12px;border-radius:999px">CONTINUAR NIVEL '+maxLevel+' '+(maxLevel>1?'• 100 💰 O ANUNCIO':'')+'</button><button id="btn-n1" style="margin-top:8px;width:100%;background:rgba(255,255,255,0.08);color:white;padding:10px;border-radius:999px">NIVEL 1</button></div></div>';}
    if(state==='levelup'){h+='<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(5,8,20,0.6);backdrop-filter:blur(8px);pointer-events:auto"><div style="background:#0a0f24;border:1px solid rgba(56,189,248,0.2);border-radius:20px;padding:18px;text-align:center;max-width:340px;width:100%"><div style="color:#38bdf8;font-weight:900">¡NIVEL '+game.level+' → '+(game.level+1)+'!</div><div style="margin-top:6px;color:white">+'+tempPoints+' PTS • +'+tempCoins+' 💰</div><button id="cont-nox2" style="margin-top:10px;width:100%;background:white;color:black;font-weight:800;padding:10px;border-radius:999px">CONTINUAR</button><button id="cont-x2" style="margin-top:8px;width:100%;background:#38bdf8;color:#0f172a;font-weight:800;padding:10px;border-radius:999px">🎬 X2 CON ANUNCIO</button></div></div>';}
    if(state==='gameover'){h+='<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(5,8,20,0.7);backdrop-filter:blur(8px);pointer-events:auto"><div style="background:#0a0f24;border:1px solid rgba(56,189,248,0.2);border-radius:20px;padding:18px;text-align:center;max-width:320px;width:100%"><div style="color:#fca5a5;font-weight:800">GAME OVER • NIVEL '+game.level+'</div><button id="ad-lives" '+(adUses>=3?'disabled':'')+' style="margin-top:10px;width:100%;background:'+(adUses>=3?'rgba(255,255,255,0.1)':'#38bdf8')+';color:'+(adUses>=3?'rgba(255,255,255,0.3)':'#0f172a')+';font-weight:800;padding:10px;border-radius:999px">🎬 +3 TIROS ('+adUses+'/3)</button><button id="restart" style="margin-top:8px;width:100%;background:rgba(255,255,255,0.08);color:white;padding:10px;border-radius:999px">REINICIAR</button></div></div>';}
    ui.innerHTML=h;
    ui.querySelector('#btn-ckpt')?.addEventListener('click', async ()=>{
      if(maxLevel<=1){startGame(1);return;}
      if(getCoins()>=100){if(confirm('Nivel '+maxLevel+' cuesta 100 monedas o anuncio. ¿Pagar 100?')){setCoins(getCoins()-100);startGame(maxLevel);return;}}
      await showAd('checkpoint'); startGame(maxLevel);
    });
    ui.querySelector('#btn-n1')?.addEventListener('click',()=>startGame(1));
    ui.querySelector('#shootBtn')?.addEventListener('click',()=>{
      if(state!=='playing') return;
      if(game.power.state==='moving'){game.power.state='locked';game.power.locked=Math.round(game.power.v||65);renderUI();return;}
      if(game.bullets.length>0) return;
      const vel=260+game.power.locked*5.2; const cx=W/2,cy=H-88,tx=game.cross.x,ty=game.cross.y,dy=cy-ty,time=Math.max(dy/vel,0.18),vx=(tx-cx)/time,vy=-vel;
      game.bullets.push({x:cx,y:cy,vx,vy});
    });
    ui.querySelector('#cont-nox2')?.addEventListener('click',()=>{
      setCoins(getCoins()+tempCoins); maxLevel=Math.max(maxLevel,game.level+1); localStorage.setItem('wasa_max_level',maxLevel);
      game.level+=1;game.misses=0;game.bullets=[];game.power.state='moving';initShips(game.level);game.levelStart=performance.now();state='playing';renderUI();
    });
    ui.querySelector('#cont-x2')?.addEventListener('click', async ()=>{
      await showAd('double'); setCoins(getCoins()+tempCoins*2); game.points+=tempPoints;
      maxLevel=Math.max(maxLevel,game.level+1); localStorage.setItem('wasa_max_level',maxLevel);
      game.level+=1;game.misses=0;game.bullets=[];game.power.state='moving';initShips(game.level);game.levelStart=performance.now();state='playing';renderUI();
    });
    ui.querySelector('#ad-lives')?.addEventListener('click', async ()=>{
      if(adUses>=3) return; await showAd('lives');
      game.misses=Math.max(0,game.misses-3); game.bullets=[]; game.power.state='moving'; game.power.v=50; adUses++; state='playing'; renderUI();
    });
    ui.querySelector('#restart')?.addEventListener('click',()=>startGame(1));
  }
  let raf,last=performance.now();
  function loop(now){
    if(window._wasaAd && window._wasaAd.playing){raf=requestAnimationFrame(loop);return;}
    const dt=Math.min((now-last)/1000,0.033); last=now;
    if(state==='playing'){
      for(let s of game.ships){if(s.cfg.behavior==='zigzag'||s.cfg.behavior==='zigzag_fast'){s.zigTimer+=dt*(s.cfg.behavior==='zigzag_fast'?4:2); s.y=s.originalY+Math.sin(s.zigTimer)*(s.cfg.behavior==='zigzag_fast'?80:40);} if(s.cfg.behavior==='teleport'){s.teleportTimer+=dt; if(s.teleportTimer>2.5){s.teleportTimer=0;s.x=Math.random()*(W-100)+50;s.y=H*0.1+Math.random()*H*0.35;}} s.x+=s.dir*s.speed*dt; if(s.dir===1&&s.x>W+140){s.x=-140;s.y=H*0.1+Math.random()*H*0.32;s.originalY=s.y;} else if(s.dir===-1&&s.x<-140){s.x=W+140;s.y=H*0.1+Math.random()*H*0.32;s.originalY=s.y;} if(s.hitFlash>0)s.hitFlash-=dt*4;}
      game.cross.x+=game.cross.dir*game.cross.speed*dt; if(game.cross.x>W-30){game.cross.x=W-30;game.cross.dir=-1;} if(game.cross.x<30){game.cross.x=30;game.cross.dir=1;}
      if(game.power.state==='moving'){game.power.v+=game.power.dir*game.power.speed*dt; if(game.power.v>=100){game.power.v=100;game.power.dir=-1;} if(game.power.v<=0){game.power.v=0;game.power.dir=1;}}else game.power.v=game.power.locked;
      for(let i=game.bullets.length-1;i>=0;i--){const b=game.bullets[i]; b.x+=b.vx*dt; b.y+=b.vy*dt; for(let sIdx=game.ships.length-1;sIdx>=0;sIdx--){const sh=game.ships[sIdx]; if(Math.abs(b.y-sh.y)<28&&Math.abs(b.x-sh.x)<sh.w*0.5){sh.hp-=50; sh.hitFlash=1; game.bullets.splice(i,1); game.power.state='moving'; if(sh.hp<=0){game.ships.splice(sIdx,1); if(game.ships.length===0){const elapsed=(performance.now()-game.levelStart)/1000; tempPoints=100*game.level; const base=(20+game.level*5)/15; let mult=elapsed<10?2:elapsed<20?1.75:elapsed<30?1.5:1; tempCoins=Math.round(base*mult); game.points+=tempPoints; state='levelup'; renderUI(); setTimeout(()=>{if(state==='levelup'){setCoins(getCoins()+tempCoins); maxLevel=Math.max(maxLevel,game.level+1); localStorage.setItem('wasa_max_level',maxLevel); game.level+=1;game.misses=0;game.bullets=[];game.power.state='moving';initShips(game.level);game.levelStart=performance.now();state='playing';renderUI();}},5000);}} break;}} if(game.bullets[i] && (b.y<-30||b.x<-30||b.x>W+30)){game.bullets.splice(i,1);game.misses++;game.power.state='moving';if(game.misses>=5){state='gameover';renderUI();}}}
    }
    const grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,'#2046a3');grad.addColorStop(1,'#315bd5');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
    for(const s of game.stars){const a=0.5+Math.sin(Date.now()*0.001*s.tw+s.off)*0.5;ctx.fillStyle='rgba(255,255,255,'+(0.3+a*0.6)+')';ctx.beginPath();ctx.arc(s.x,s.y,s.size,0,Math.PI*2);ctx.fill();}
    for(let sh of game.ships) drawShip(sh);
    if(state==='playing'){for(const b of game.bullets){ctx.fillStyle='#fffe8a';ctx.shadowColor='#ffde59';ctx.shadowBlur=10;ctx.beginPath();ctx.arc(b.x,b.y,5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;} drawCross(game.cross.x,game.cross.y,game.power.state==='locked');}
    raf=requestAnimationFrame(loop);
  }
  renderUI(); initShips(1); raf=requestAnimationFrame(loop);
  canvas.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return; if(state!=='playing')return; if(game.power.state==='moving'){game.power.state='locked';game.power.locked=Math.round(game.power.v||65);renderUI();}else if(game.bullets.length===0){const vel=260+game.power.locked*5.2;const cx=W/2,cy=H-88,tx=game.cross.x,ty=game.cross.y,dy=cy-ty,time=Math.max(dy/vel,0.18),vx=(tx-cx)/time,vy=-vel;game.bullets.push({x:cx,y:cy,vx,vy});}});
  container._cleanup=()=>{cancelAnimationFrame(raf);ro.disconnect(); if(window._wasaAd) window._wasaAd.playing=false;};
}
