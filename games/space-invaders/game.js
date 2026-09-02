export function init(container, args){
  const quality = args.quality || 'hd';
  const getCoins = args.getCoins || (()=>0);
  const setCoins = args.setCoins || (()=>{});
  const showAd = args.showAd || (async ()=>{});
  const slug = args.slug || 'space-invaders';

  container.innerHTML = `
    <style>
      .wg{width:100%;height:100%;position:relative;background:linear-gradient(180deg,#2046a3 0%,#315bd5 100%);overflow:hidden;font-family:Inter,system-ui,sans-serif}
      .wg canvas{width:100%;height:100%;display:block}
      .wg-ui{position:absolute;inset:0;pointer-events:none}
      .wg-ui button{pointer-events:auto;cursor:pointer;border:0;font:inherit}
    </style>
    <div class="wg"><canvas id="c"></canvas><div id="ui" class="wg-ui"></div></div>
  `;
  const wrap=container.querySelector('.wg');
  const canvas=container.querySelector('#c');
  const ctx=canvas.getContext('2d');
  const ui=container.querySelector('#ui');
  let W=wrap.clientWidth,H=wrap.clientHeight;
  function resize(){W=wrap.clientWidth;H=wrap.clientHeight;const dpr=devicePixelRatio||1;canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0);}
  resize(); const ro=new ResizeObserver(resize); ro.observe(wrap);

  let maxLevel=parseInt(localStorage.getItem('wasa_max_level')||'1');
  let game={ships:[],cross:{x:W/2,y:H*0.62,dir:1,speed:420},power:{v:50,dir:1,speed:82,state:'moving',locked:50},bullets:[],stars:[],level:1,points:0,misses:0,levelStart:0};
  let state='menu', tempCoins=0,tempPoints=0,adUses=0;
  for(let i=0;i<(quality==='lite'?60:140);i++) game.stars.push({x:Math.random()*W,y:Math.random()*H*0.8,size:Math.random()*1.6+0.4,tw:Math.random()*2+0.5,off:Math.random()*6});

  function getCfg(lv){
    const tier=Math.min(Math.floor((lv-1)/10),9);
    const names=['SCOUT','RAIDER','DUO','ACORAZADO','FANTASMA','ZIGZAG','AVISPA','BOMBER','TELEPORT','BOSS TITAN'];
    return {name:names[tier],w:78+tier*8,h:26,hp:20+tier*8+lv*4,speed:90+tier*5,count:(tier===2||tier===6)?2:1};
  }
  function createShip(lv,i=0,tot=1){const cfg=getCfg(lv);return {x:Math.random()>0.5?-120:W+120,y:H*0.12+i*(H*0.22/tot)+Math.random()*H*0.1,w:cfg.w,h:cfg.h,hp:cfg.hp,maxHp:cfg.hp,dir:Math.random()>0.5?1:-1,speed:cfg.speed+lv*2,hitFlash:0,cfg};}
  function initShips(lv){const cfg=getCfg(lv);const cnt=cfg.count||1;game.ships=[];for(let k=0;k<cnt;k++) game.ships.push(createShip(lv,k,cnt));}
  function startGame(lv=1){game.level=lv;game.points=lv>1?(lv-1)*100:0;game.misses=0;game.bullets=[];game.power={v:50,dir:1,speed:82,state:'moving',locked:50};game.cross={x:W/2,y:H*0.62,dir:1,speed:420};initShips(lv);game.levelStart=performance.now();state='playing';adUses=0;render();}

  function render(){
    let h='';
    if(state==='menu'){
      h=`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(5,8,20,0.5);backdrop-filter:blur(10px);pointer-events:auto"><div style="width:100%;max-width:460px;border-radius:28px;background:#0a0f24;border:1px solid rgba(56,189,248,0.2);padding:24px"><div style="color:#94a3b8;font-weight:700;font-size:10px;letter-spacing:0.15em">WASA ARCADE • ${quality.toUpperCase()}</div><h1 style="margin-top:10px;color:white;font-weight:900;font-size:34px;line-height:0.9">STAR<br><span style="color:#38bdf8">SHOOTER</span></h1><div style="margin-top:12px;background:rgba(15,23,42,0.8);border:1px solid rgba(56,189,248,0.15);border-radius:12px;padding:10px;color:#38bdf8;font-weight:700">MAX NIVEL ${maxLevel} • ${getCfg(maxLevel).name}</div><button id="b-ckpt" style="margin-top:16px;width:100%;background:linear-gradient(135deg,#38bdf8,#818cf8);color:#0f172a;font-weight:800;padding:14px;border-radius:999px">CONTINUAR NIVEL ${maxLevel} ${maxLevel>1?'• 100 💰 O ANUNCIO':''}</button><button id="b1" style="margin-top:8px;width:100%;background:rgba(15,23,42,0.8);color:white;padding:12px;border-radius:999px;border:1px solid rgba(56,189,248,0.15)">DESDE NIVEL 1</button></div></div>`;
    }else if(state==='playing'){
      h=`<div style="position:absolute;top:0;left:0;right:0;padding:12px;display:flex;justify-content:space-between;pointer-events:auto"><div style="display:flex;gap:8px"><div style="background:rgba(0,0,0,0.4);padding:6px 12px;border-radius:999px;color:white;font-size:11px;font-weight:800">NIVEL ${game.level}</div><div style="background:rgba(0,0,0,0.4);padding:6px 12px;border-radius:999px;color:white;font-size:11px;font-weight:800">${game.points} PTS</div><div style="background:linear-gradient(135deg,#38bdf8,#818cf8);color:#0f172a;padding:6px 12px;border-radius:999px;font-size:11px;font-weight:800">💰 ${getCoins()}</div></div><div style="display:flex;gap:6px">${Array.from({length:5}).map((_,i)=>`<div style="width:10px;height:10px;border-radius:50%;background:${i<5-game.misses?'#38bdf8':'rgba(255,255,255,0.15)'}"></div>`).join('')}</div></div><div style="position:absolute;bottom:0;left:0;right:0;padding:12px;display:flex;justify-content:space-between;align-items:end;pointer-events:none"><div style="pointer-events:auto"><div style="font-size:9px;color:white;margin-bottom:4px;font-weight:700">POTENCIA ${Math.round(game.power.state==='locked'?game.power.locked:game.power.v)}%</div><div style="width:40px;height:160px;background:rgba(0,0,0,0.45);border-radius:18px;padding:6px;display:flex;flex-direction:column;justify-content:end;border:1px solid rgba(56,189,248,0.15)"><div style="width:100%;border-radius:12px;height:${game.power.state==='locked'?game.power.locked:game.power.v}%;background:linear-gradient(180deg,#fff,#38bdf8 60%,#818cf8)"></div></div></div><button id="shoot" style="pointer-events:auto;padding:14px 28px;border-radius:999px;font-weight:900;background:${game.power.state==='locked'?'#38bdf8':'rgba(255,255,255,0.2)'};color:${game.power.state==='locked'?'#0f172a':'white'};border:2px solid black">${game.power.state==='moving'?'FIJAR':'DISPARAR'}</button></div>`;
    }else if(state==='levelup'){
      h=`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(5,8,20,0.6);backdrop-filter:blur(10px);pointer-events:auto"><div style="background:#0a0f24;border:1px solid rgba(56,189,248,0.2);border-radius:24px;padding:22px;text-align:center;max-width:360px;width:100%"><div style="color:#38bdf8;font-weight:900;letter-spacing:0.15em;font-size:11px">¡DESTRUIDA!</div><div style="color:white;font-weight:900;font-size:22px;margin-top:4px">NIVEL ${game.level} → ${game.level+1}</div><div style="margin-top:10px;display:flex;gap:8px;justify-content:center"><span style="background:rgba(255,255,255,0.08);padding:5px 10px;border-radius:999px;color:white;font-size:11px">+${tempPoints} PTS</span><span style="background:linear-gradient(135deg,#38bdf8,#818cf8);color:#0f172a;padding:5px 10px;border-radius:999px;font-size:11px;font-weight:800">+${tempCoins} 💰</span></div><button id="c1" style="margin-top:14px;width:100%;background:white;color:black;font-weight:800;padding:12px;border-radius:999px">CONTINUAR SIN X2</button><button id="c2" style="margin-top:8px;width:100%;background:linear-gradient(135deg,#38bdf8,#818cf8);color:#0f172a;font-weight:800;padding:12px;border-radius:999px">🎬 DUPLICAR X2 CON ANUNCIO</button></div></div>`;
    }else if(state==='gameover'){
      h=`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(5,8,20,0.7);backdrop-filter:blur(12px);pointer-events:auto"><div style="background:#0a0f24;border:1px solid rgba(56,189,248,0.2);border-radius:24px;padding:22px;text-align:center;max-width:340px;width:100%"><div style="color:#fca5a5;font-weight:800;font-size:11px">MISIÓN FALLIDA</div><h2 style="color:white;font-weight:900;font-size:26px;margin-top:4px">GAME OVER</h2><button id="ad-lives" ${adUses>=3?'disabled':''} style="margin-top:14px;width:100%;background:${adUses>=3?'rgba(255,255,255,0.1)':'linear-gradient(135deg,#38bdf8,#818cf8)'};color:${adUses>=3?'rgba(255,255,255,0.3)':'#0f172a'};font-weight:800;padding:12px;border-radius:999px">🎬 +3 TIROS (${adUses}/3)</button><button id="rest" style="margin-top:8px;width:100%;background:rgba(255,255,255,0.08);color:white;padding:12px;border-radius:999px;border:1px solid rgba(255,255,255,0.1)">REINICIAR</button></div></div>`;
    }else if(state==='reward'){
      h=`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);backdrop-filter:blur(12px);pointer-events:auto;z-index:10"><div style="background:#0a0f24;border:1px solid rgba(56,189,248,0.3);border-radius:24px;padding:22px;text-align:center;max-width:340px;width:100%"><div style="width:56px;height:56px;margin:0 auto;border-radius:50%;background:linear-gradient(135deg,#38bdf8,#818cf8);display:flex;align-items:center;justify-content:center;font-size:26px">🎁</div><div style="margin-top:10px;color:#38bdf8;font-weight:900">¡RECOMPENSA!</div><div style="margin-top:4px;color:white;font-size:13px" id="rw-text"></div><button id="rw-claim" style="margin-top:14px;width:100%;background:linear-gradient(135deg,#38bdf8,#818cf8);color:#0f172a;font-weight:800;padding:12px;border-radius:999px">CONTINUAR →</button></div></div>`;
    }
    ui.innerHTML=h;
    ui.querySelector('#b-ckpt')?.addEventListener('click',async()=>{
      if(maxLevel<=1){startGame(1);return;}
      if(getCoins()>=100){
        if(confirm(`Continuar desde nivel ${maxLevel} cuesta 100 monedas o ver anuncio. ¿Pagar 100?`)){ setCoins(getCoins()-100); startGame(maxLevel); }
        else { await showAd('checkpoint'); startGame(maxLevel); }
      }else{ await showAd('checkpoint'); startGame(maxLevel); }
    });
    ui.querySelector('#b1')?.addEventListener('click',()=>startGame(1));
    ui.querySelector('#shoot')?.addEventListener('click',doShoot);
    ui.querySelector('#c1')?.addEventListener('click',()=>{ setCoins(getCoins()+tempCoins); nextLevel(); });
    ui.querySelector('#c2')?.addEventListener('click',async()=>{ await showAd('double'); setCoins(getCoins()+tempCoins*2); game.points+=tempPoints; nextLevel(true); });
    ui.querySelector('#ad-lives')?.addEventListener('click',async()=>{ if(adUses>=3) return; await showAd('lives'); game.misses=Math.max(0,game.misses-3); game.bullets=[]; game.power.state='moving'; adUses++; state='playing'; render(); });
    ui.querySelector('#rest')?.addEventListener('click',()=>startGame(1));
  }
  function nextLevel(doubled=false){
    if(!doubled){ /* coins already added in c1 */ }
    maxLevel=Math.max(maxLevel,game.level+1); localStorage.setItem('wasa_max_level',maxLevel);
    game.level+=1; game.misses=0; game.bullets=[]; game.power.state='moving'; game.power.v=20; initShips(game.level); game.levelStart=performance.now(); state='playing'; render();
  }
  function doShoot(){
    if(state!=='playing') return;
    if(game.power.state==='moving'){game.power.state='locked';game.power.locked=Math.round(game.power.v||65);render();return;}
    if(game.bullets.length>0) return;
    const vel=260+game.power.locked*5.2+(game.level-1)*8;
    const cx=W/2,cy=H-88,tx=game.cross.x,ty=game.cross.y,dy=cy-ty,time=Math.max(dy/vel,0.18),vx=(tx-cx)/time,vy=-vel;
    game.bullets.push({x:cx,y:cy,vx,vy});
  }
  let raf,last=performance.now();
  function loop(now){
    const dt=Math.min((now-last)/1000,0.033); last=now;
    if(state==='playing'){
      for(let s of game.ships){s.x+=s.dir*s.speed*dt; if(s.dir===1&&s.x>W+140)s.x=-140; else if(s.dir===-1&&s.x<-140)s.x=W+140; if(s.hitFlash>0)s.hitFlash-=dt*4;}
      game.cross.x+=game.cross.dir*game.cross.speed*dt; if(game.cross.x>W-30){game.cross.x=W-30;game.cross.dir=-1;} if(game.cross.x<30){game.cross.x=30;game.cross.dir=1;}
      if(game.power.state==='moving'){game.power.v+=game.power.dir*game.power.speed*dt; if(game.power.v>=100){game.power.v=100;game.power.dir=-1;} if(game.power.v<=0){game.power.v=0;game.power.dir=1;}} else game.power.v=game.power.locked;
      for(let i=game.bullets.length-1;i>=0;i--){
        const b=game.bullets[i]; b.x+=b.vx*dt; b.y+=b.vy*dt;
        for(let si=game.ships.length-1;si>=0;si--){
          const sh=game.ships[si];
          if(Math.abs(b.y-sh.y)<26&&Math.abs(b.x-sh.x)<sh.w*0.5){
            sh.hp-=50; sh.hitFlash=1; game.bullets.splice(i,1); game.power.state='moving';
            if(sh.hp<=0){
              game.ships.splice(si,1);
              if(game.ships.length===0){
                const el=(performance.now()-game.levelStart)/1000;
                tempPoints=100*game.level; tempCoins=Math.round((20+game.level*5)/15 * (el<10?2:el<20?1.75:el<30?1.5:1));
                game.points+=tempPoints; state='levelup'; render(); setTimeout(()=>{if(state==='levelup'){setCoins(getCoins()+tempCoins); nextLevel();}},5000);
              }
            }
            break;
          }
        }
        if(game.bullets[i] && (b.y<-30||b.x<-30||b.x>W+30)){game.bullets.splice(i,1); game.misses++; game.power.state='moving'; if(game.misses>=5){state='gameover';render();}}
      }
    }
    const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,"#2046a3"); g.addColorStop(1,"#315bd5"); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    for(const s of game.stars){const a=0.5+Math.sin(Date.now()*0.001*s.tw+s.off)*0.5; ctx.fillStyle=`rgba(255,255,255,${0.3+a*0.6})`; ctx.beginPath(); ctx.arc(s.x,s.y,s.size,0,Math.PI*2); ctx.fill();}
    for(let sh of game.ships){ctx.save();ctx.translate(sh.x,sh.y);ctx.fillStyle=sh.hitFlash>0?"#ffaaaa":sh.cfg.body||"#cfe0ff";ctx.beginPath();ctx.ellipse(0,6,sh.w*0.52,sh.h*0.72,0,0,Math.PI*2);ctx.fill();ctx.restore();}
    if(state==='playing'){
      for(const b of game.bullets){ctx.fillStyle="#fff";ctx.shadowColor="#38bdf8";ctx.shadowBlur=12;ctx.beginPath();ctx.arc(b.x,b.y,5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
      ctx.save();ctx.translate(game.cross.x,game.cross.y);ctx.strokeStyle=game.power.state==='locked'?"#38bdf8":"#fff";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,38,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(-60,0);ctx.lineTo(-20,0);ctx.moveTo(20,0);ctx.lineTo(60,0);ctx.moveTo(0,-60);ctx.lineTo(0,-20);ctx.moveTo(0,20);ctx.lineTo(0,60);ctx.stroke();ctx.restore();
    }
    raf=requestAnimationFrame(loop);
  }
  render(); initShips(1); raf=requestAnimationFrame(loop);
  canvas.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;doShoot();});
  container._cleanup=()=>{cancelAnimationFrame(raf);ro.disconnect();};
}
