export function init(container, args){
  const quality = args.quality||'hd';
  const getCoins = args.getCoins||(()=>parseFloat(localStorage.getItem('wasa_coins')||'0'));
  const setCoins = args.setCoins||((n)=>localStorage.setItem('wasa_coins',n));

  container.innerHTML = `
    <style>
      .wg{width:100%;height:100%;position:relative;background:#21418f;overflow:hidden;font-family:Inter,system-ui,sans-serif}
      .wg canvas{width:100%;height:100%;display:block}
      .wg-ui{position:absolute;inset:0;pointer-events:none}
      .wg-ui button{pointer-events:auto}
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

  let ups=JSON.parse(localStorage.getItem('wasa_upgrades_final')||'{"d":{"main":0,"sub":0},"c":{"main":0,"sub":0},"p":{"main":0,"sub":0}}');
  let coins=getCoins();
  let ranking=JSON.parse(localStorage.getItem('wasa_ranking_final')||'[]');
  let maxLevel=parseInt(localStorage.getItem('wasa_max_level')||'1');

  let game={ships:[],cross:{x:W/2,y:H*0.62,dir:1,speed:420},power:{v:0,dir:1,speed:82,state:'moving',locked:50},bullets:[],parts:[],stars:[],level:1,points:0,misses:0,levelStart:0,lastTime:0,lastMult:1,lastBase:0};
  let state='menu';
  let tempCoins=0,tempPoints=0,last=performance.now();
  let levelUpInfo={level:2,points:0};
  let pauseBefore=null;
  let adUses=0;
  let _rewardPending=null;

  for(let i=0;i<(quality==='lite'?80:140);i++) game.stars.push({x:Math.random()*W,y:Math.random()*H*0.85,size:Math.random()*1.8+0.3,tw:Math.random()*2+0.5,off:Math.random()*6});

  function getBaseWASA(lvl){ const tier=Math.floor((lvl-1)/10); return 0.005 + tier*0.0025; }
  function getTimeMult(elapsed){ if(elapsed<10) return 3; if(elapsed<20) return 2; return 1; }
  function fmtWASA(n){ return (Math.round(n*1000000)/1000000).toFixed(6).replace(/0+$/,'').replace(/\.$/,''); }
  function getShipConfig(level){
    const tier=Math.min(Math.floor((level-1)/10),9);
    const configs=[
      {name:'SCOUT', colors:{body:'#cfe0ff', belly:'#5a7bd6', cockpit:['#ffffff','#9ef0ff','#3a6bff'], lights:['#ffde59','#ff6b6b']}, w:78, h:26, hp:20, speed:90, behavior:'normal'},
      {name:'RAIDER ROJO', colors:{body:'#ffcfe0', belly:'#d65a7b', cockpit:['#ffffff','#ff9eb0','#ff3a5a'], lights:['#ffde59','#ff4444']}, w:82, h:28, hp:28, speed:110, behavior:'normal'},
      {name:'DUO', colors:{body:'#cfe0ff', belly:'#5a7bd6', cockpit:['#ffffff','#9ef0ff','#3a6bff'], lights:['#ffde59','#ff6b6b']}, w:78, h:26, hp:22, speed:100, behavior:'duo', count:2},
      {name:'ACORAZADO', colors:{body:'#e0cfff', belly:'#7b5ad6', cockpit:['#ffffff','#c99eff','#7b3aff'], lights:['#a0ff59','#ff6bff']}, w:120, h:34, hp:45, speed:70, behavior:'zigzag'},
      {name:'FANTASMA', colors:{body:'#cffff0', belly:'#5ad6b0', cockpit:['#ffffff','#9effdd','#3affaa'], lights:['#59ffde','#6bff8a']}, w:75, h:24, hp:30, speed:130, behavior:'ghost'},
      {name:'ZIGZAG', colors:{body:'#ffefcf', belly:'#d6a05a', cockpit:['#ffffff','#ffe09e','#ffaa3a'], lights:['#ffde59','#ff8a2a']}, w:80, h:26, hp:35, speed:95, behavior:'zigzag_fast'},
      {name:'AVISPA', colors:{body:'#d0ffc0', belly:'#6bd65a', cockpit:['#ffffff','#b0ff9e','#5aff3a'], lights:['#ffde59','#a0ff00']}, w:48, h:18, hp:18, speed:180, behavior:'tiny_fast', count:2},
      {name:'BOMBER', colors:{body:'#ffcfa0', belly:'#d67b5a', cockpit:['#ffffff','#ffc99e','#ff7b3a'], lights:['#ff9e59','#ff4444']}, w:100, h:30, hp:55, speed:60, behavior:'bomber'},
      {name:'TELEPORT', colors:{body:'#c0f0ff', belly:'#5ab4d6', cockpit:['#ffffff','#9ed9ff','#3ab4ff'], lights:['#59deff','#59a0ff']}, w:85, h:28, hp:40, speed:120, behavior:'teleport'},
      {name:'BOSS TITAN', colors:{body:'#ffd700', belly:'#b89600', cockpit:['#ffffff','#ffec8a','#ffcc00'], lights:['#ff0000','#ffff00']}, w:160, h:48, hp:120, speed:45, behavior:'boss'},
    ];
    return configs[tier];
  }
  function createShip(level, index=0, total=1){
    const cfg=getShipConfig(level);
    const hpBase=cfg.hp+(level-1)*(cfg.behavior==='boss'?12:5);
    const dir=Math.random()>0.5?1:-1;
    const yBase=H*0.12+(index*(H*0.25/total))+Math.random()*H*0.15;
    return {x:dir===1?-120-index*150:W+120+index*150,y:yBase,w:cfg.w,h:cfg.h,hp:hpBase,maxHp:hpBase,dir,speed:cfg.speed+(level-1)*0.75,hitFlash:0,cfg,ghostTimer:0,zigTimer:0,teleportTimer:0,originalY:yBase};
  }
  function initShips(lvl){
    const cfg=getShipConfig(lvl);
    const count=cfg.count||1;
    game.ships=[];
    for(let i=0;i<count;i++) game.ships.push(createShip(lvl,i,count));
    const lvlP = lvl-1;
    const crossBase = 280 + Math.min(340, lvlP*5.5 + Math.pow(lvlP,0.72)*12);
    const powerBase = 62 + Math.min(75, lvlP*1.1 + Math.pow(lvlP,0.62)*6);
    game.cross.speed=Math.max(80, crossBase * (1-ups.c.main*0.012));
    game.power.speed=Math.max(22, powerBase * (1-ups.p.main*0.015));
  }
  function startGame(fromLevel=1){
    game.level=fromLevel;game.points=fromLevel>1?(fromLevel-1)*100:0;game.misses=0;game.bullets=[];game.parts=[];
    game.power={v:50,dir:1,speed:62*(1-ups.p.main*0.015),state:'moving',locked:50};
    game.cross={x:W/2,y:H*0.62,dir:1,speed:280*(1-ups.c.main*0.012)};
    initShips(fromLevel);game.levelStart=performance.now();state='playing';adUses=0;renderUI();
  }
  function drawShip(s){
    if(s.cfg.behavior==='ghost'){s.ghostTimer+=0.016; if(Math.sin(s.ghostTimer*2)>0.7) return;}
    ctx.save();ctx.translate(s.x,s.y);const alpha=s.cfg.behavior==='ghost'?0.6+Math.sin(s.ghostTimer*5)*0.4:1;ctx.globalAlpha=alpha;
    if(s.hitFlash>0){ctx.shadowColor="#ff4444";ctx.shadowBlur=30;}else{ctx.shadowColor=s.cfg.colors.body;ctx.shadowBlur=s.type>=3?22:18;}
    ctx.fillStyle=s.hitFlash>0?"#ffaaaa":s.cfg.colors.body;ctx.beginPath();ctx.ellipse(0,6,s.w*0.52,s.h*0.72,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=s.hitFlash>0?"#ff5555":s.cfg.colors.belly;ctx.beginPath();ctx.ellipse(0,10,s.w*0.48,s.h*0.5,0,0,Math.PI);ctx.fill();ctx.shadowBlur=0;
    const g=ctx.createRadialGradient(-4,-6,2,0,-2,18);g.addColorStop(0,s.cfg.colors.cockpit[0]);g.addColorStop(0.3,s.cfg.colors.cockpit[1]);g.addColorStop(1,s.cfg.colors.cockpit[2]);
    ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,-4,s.w*0.28,s.h*0.85,0,Math.PI,Math.PI*2);ctx.fill();
    for(let i=-2;i<=2;i++){ctx.fillStyle=i%2===0?s.cfg.colors.lights[0]:s.cfg.colors.lights[1];ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=8;ctx.beginPath();ctx.arc(i*(s.w/5.5),10,s.type===9?4.5:3.2,0,Math.PI*2);ctx.fill();}
    if(s.type===9){ctx.fillStyle="#ff0000";ctx.shadowColor="#ff0000";ctx.shadowBlur=12;ctx.fillRect(-s.w*0.4,-s.h*0.5,s.w*0.8,4);}
    ctx.restore();ctx.globalAlpha=1;
  }
  function drawCross(x,y,locked,t){ctx.save();ctx.translate(x,y);const sc=1+Math.sin(t*0.01)*0.12;ctx.scale(sc,sc);ctx.strokeStyle=locked?"rgba(255,222,89,0.95)":"rgba(255,255,255,0.92)";ctx.lineWidth=locked?2.2:1.8;ctx.shadowColor=locked?"#ffde59":"#ffffff";ctx.shadowBlur=locked?18:14;ctx.beginPath();ctx.arc(0,0,40,0,Math.PI*2);ctx.stroke();ctx.lineWidth=1.8;ctx.beginPath();ctx.arc(0,0,14,0,Math.PI*2);ctx.stroke();ctx.lineWidth=locked?2.2:1.6;ctx.beginPath();ctx.moveTo(-62,0);ctx.lineTo(-22,0);ctx.moveTo(22,0);ctx.lineTo(62,0);ctx.moveTo(0,-62);ctx.lineTo(0,-22);ctx.moveTo(0,22);ctx.lineTo(0,62);ctx.stroke();ctx.fillStyle=locked?"#ffde59":"#ffffff";ctx.shadowColor="#ffde59";ctx.shadowBlur=16;ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.fill();ctx.restore();}

  function renderUI(){
    const cfg=getShipConfig(game.level);
    let h='';
    h+=`<div style="position:absolute;top:0;left:0;right:0;padding:10px;display:flex;justify-content:space-between;pointer-events:auto"><div><div style="display:flex;align-items:center;gap:6px"><div style="width:22px;height:22px;border-radius:50%;background:white;color:#21418f;font-weight:900;font-size:10px;display:flex;align-items:center;justify-content:center">W</div><span style="color:white;font-weight:900;font-size:10px;letter-spacing:0.15em">wasa.chat</span><span style="margin-left:6px;font-size:8px;padding:2px 6px;border-radius:999px;background:rgba(255,255,255,0.12);color:rgba(255,255,255,0.6)">${cfg.name} • NIVEL ${game.level}/100</span>${state==='playing'?`<button id="pauseBtn" style="margin-left:8px;width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);color:white;font-size:10px">⏸</button>`:''}</div><div style="display:flex;gap:6px;margin-top:8px"><div style="background:rgba(0,0,0,0.35);padding:5px 10px;border-radius:999px;color:white;font-size:10px;font-weight:800">NIVEL ${game.level}</div><div style="background:rgba(0,0,0,0.35);padding:5px 10px;border-radius:999px;color:white;font-size:10px;font-weight:800">${game.points} PTS</div><div style="background:#ffde59;color:black;padding:5px 10px;border-radius:999px;font-size:10px;font-weight:800">💰 ${getCoins()}</div></div></div><div style="display:flex;flex-direction:column;gap:6px;align-items:end"><div style="display:flex;align-items:center;gap:4px;background:rgba(0,0,0,0.3);padding:4px 8px;border-radius:999px;border:1px solid rgba(255,255,255,0.1)"><span style="font-size:8px;color:rgba(255,255,255,0.5);font-weight:700">TIROS</span><div style="display:flex;gap:3px">${Array.from({length:5}).map((_,i)=>`<div style="width:8px;height:8px;border-radius:50%;background:${i<5-game.misses?'#ffde59':'rgba(255,255,255,0.15)'}"></div>`).join('')}</div></div></div></div>`;

    if(state==='playing'){
      h+=`<div style="position:absolute;top:82px;left:50%;transform:translateX(-50%);pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:4px">${game.power.state==='moving'?`<div style="background:#ffde59;color:black;font-weight:900;font-size:9px;letter-spacing:0.1em;padding:6px 12px;border-radius:999px;border:2px solid black">1° CLICK: FIJAR POTENCIA → 2° CLICK: DISPARAR</div>`:`<div style="background:white;color:black;font-weight:900;font-size:10px;padding:6px 14px;border-radius:999px;border:2px solid black">POTENCIA ${Math.round(game.power.locked)}% FIJADA • ¡DISPARA! 🎯</div>`}</div>`;
      h+=`<div style="position:absolute;bottom:0;left:0;right:0;padding:8px 12px;display:flex;justify-content:space-between;align-items:end;pointer-events:none;gap:8px"><div style="pointer-events:auto;display:flex;flex-direction:column;gap:6px;align-items:center;width:90px"><div style="font-size:8px;font-weight:900;letter-spacing:0.15em;color:rgba(255,255,255,0.8);width:90px;text-align:center">POTENCIA ${Math.round(game.power.state==='locked'?game.power.locked:game.power.v)}%</div><div style="width:40px;height:160px;background:rgba(0,0,0,0.45);border:1px solid rgba(255,255,255,0.15);border-radius:18px;padding:6px;display:flex;flex-direction:column;justify-content:end;position:relative"><div style="width:100%;border-radius:12px;height:${game.power.state==='locked'?game.power.locked:game.power.v}%;background:linear-gradient(180deg,#fff7a0,#ffde59 60%,#ff6a2a)"></div><div style="position:absolute;left:0;right:0;height:3px;background:white;box-shadow:0 0 12px white;bottom:${game.power.state==='locked'?game.power.locked:game.power.v}%"></div></div><button id="powBtn" style="width:90px;padding:7px;border-radius:999px;font-weight:900;font-size:9px;background:${game.power.state==='locked'?'#ffde59':'rgba(255,255,255,0.1)'};color:${game.power.state==='locked'?'black':'white'};border:1px solid rgba(255,255,255,0.2)">${game.power.state==='locked'?Math.round(game.power.locked)+'% DESBLOQ':'FIJAR'}</button></div><div style="pointer-events:auto;flex:1;display:flex;justify-content:center;margin:0 8px"><div style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.15);border-radius:999px;padding:6px 12px;display:flex;gap:10px;align-items:center"><div style="display:flex;gap:4px;align-items:center"><span style="font-size:7px;color:rgba(255,255,255,0.4);font-weight:800">DMG</span><span style="font-size:11px;font-weight:900;color:#ffde59">${50+ups.d.main}</span></div><div style="width:1px;height:12px;background:rgba(255,255,255,0.15)"></div><div style="display:flex;gap:4px;align-items:center"><span style="font-size:7px;color:rgba(255,255,255,0.4)">POT</span><span style="font-size:11px;font-weight:900;color:white">${Math.round(game.power.state==='locked'?game.power.locked:game.power.v)}%</span></div><div style="width:1px;height:12px;background:rgba(255,255,255,0.15)"></div><div style="display:flex;gap:4px;align-items:center"><span style="font-size:7px;color:rgba(255,255,255,0.4)">HP</span><span style="font-size:11px;font-weight:900;color:white">${game.ships[0]?game.ships[0].hp:0}/${game.ships[0]?game.ships[0].maxHp:0}</span></div></div></div><div style="pointer-events:auto"><button id="shootBtn" style="padding:12px 24px;border-radius:999px;font-weight:900;font-size:13px;background:${game.power.state==='locked'?'#ffde59':'rgba(255,255,255,0.2)'};color:${game.power.state==='locked'?'black':'rgba(255,255,255,0.7)'};border:2.5px solid black">${game.power.state==='moving'?'FIJAR POTENCIA':'DISPARAR ↗'}</button></div></div>`;
    }
    if(state==='menu'){
      h+=`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(33,65,143,0.55);backdrop-filter:blur(10px);pointer-events:auto"><div style="width:100%;max-width:520px;border-radius:28px;background:rgba(15,27,62,0.92);border:1px solid rgba(255,255,255,0.15);padding:24px"><div style="display:flex;justify-content:space-between"><span style="color:white;font-weight:900;font-size:11px;letter-spacing:0.2em">wasa.chat</span><span style="font-size:8px;padding:3px 8px;border-radius:999px;background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.5)">100 NIVELES • 10 NAVES</span></div><h1 style="margin-top:14px;color:white;font-weight:900;font-size:34px;line-height:0.9">STAR<br><span style="color:#ffde59">SHOOTER WARS</span></h1><div style="margin-top:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:10px;display:flex;justify-content:space-between"><div><div style="font-size:9px;color:rgba(255,255,255,0.4);font-weight:700">MAX NIVEL</div><div style="color:#ffde59;font-weight:900">NIVEL ${maxLevel} • ${getShipConfig(maxLevel).name}</div></div><div style="font-size:18px">🚀</div></div><div style="margin-top:14px;display:flex;flex-direction:column;gap:8px"><button id="btn-ckpt" style="width:100%;background:#ffde59;color:black;font-weight:900;padding:14px;border-radius:999px;border:2.5px solid black">CONTINUAR DESDE NIVEL ${maxLevel} ${maxLevel>1?'• 100 💰 O ANUNCIO':''}</button><button id="btn-n1" style="width:100%;background:rgba(255,255,255,0.08);color:white;font-weight:900;padding:12px;border-radius:999px;border:1px solid rgba(255,255,255,0.15)">JUGAR DESDE NIVEL 1 • FARMEAR</button></div></div></div>`;
    }
    if(state==='levelup'){
      h+=`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(10,20,48,0.6);backdrop-filter:blur(10px);pointer-events:auto"><div style="background:rgba(15,27,62,0.95);border:1px solid rgba(255,255,255,0.15);border-radius:28px;padding:22px;text-align:center;max-width:380px;width:100%"><div style="color:#ffde59;font-weight:900;font-size:11px;letter-spacing:0.2em">¡DESTRUIDA! • ${getShipConfig(game.level).name}</div><div style="color:white;font-weight:900;font-size:22px;margin-top:4px">NIVEL ${game.level} → ${game.level+1}</div><div style="margin-top:8px;display:inline-flex;gap:6px"><span style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1);padding:4px 10px;border-radius:999px;color:white;font-size:11px">+${tempPoints} PTS</span><span style="background:#ffde59;color:black;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:900">+${tempCoins} 💰</span></div><div style="margin-top:6px;font-size:8px;color:rgba(255,255,255,0.4)">${game.lastTime.toFixed(1)}s • x${game.lastMult} = ${tempCoins} 💰 ${game.lastTime<10?'⚡ RAPIDO x2':game.lastTime<20?'🔥 x1.75':game.lastTime<30?'⏱ x1.5':'🐢 x1'}</div>${(game.level+1)%10===1?`<div style="margin-top:8px;background:rgba(255,222,89,0.15);border:1px solid rgba(255,222,89,0.3);border-radius:999px;padding:4px 8px;font-size:10px;color:#ffde59;font-weight:800">🚀 CHECKPOINT • NUEVA NAVE: ${getShipConfig(game.level+1).name}</div>`:''}<div style="margin-top:14px;display:flex;flex-direction:column;gap:8px"><button id="cont-nox2" style="width:100%;background:white;color:black;font-weight:900;padding:12px;border-radius:999px">CONTINUAR SIN DUPLICAR</button><button id="cont-x2" style="width:100%;background:#ffde59;color:black;font-weight:900;padding:12px;border-radius:999px;border:2px solid black;box-shadow:0 0 20px rgba(255,222,89,0.3)">🎬 DUPLICAR x2 VIENDO ANUNCIO</button></div></div></div>`;
    }
    if(state==='gameover'){
      h+=`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(10,20,48,0.7);backdrop-filter:blur(12px);pointer-events:auto"><div style="width:100%;max-width:380px;border-radius:28px;background:rgba(15,27,62,0.95);border:1px solid rgba(255,255,255,0.15);padding:22px;text-align:center"><div style="width:48px;height:48px;margin:0 auto;border-radius:50%;background:rgba(239,68,68,0.2);border:1px solid rgba(239,68,68,0.3);display:flex;align-items:center;justify-content:center"><div style="width:24px;height:24px;border-radius:50%;background:#ef4444"></div></div><div style="margin-top:10px;color:#fca5a5;font-weight:900;font-size:10px;letter-spacing:0.2em">MISIÓN FALLIDA • ${getShipConfig(game.level).name}</div><h2 style="margin-top:4px;color:white;font-weight:900;font-size:26px">GAME OVER</h2><div style="margin-top:8px;display:inline-flex;gap:6px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:999px;padding:6px 10px;font-size:10px"><span style="color:rgba(255,255,255,0.5)">PUNTOS</span><span style="color:white;font-weight:800">${game.points}</span><span style="color:rgba(255,255,255,0.15)">|</span><span style="color:rgba(255,255,255,0.5)">NIVEL</span><span style="color:#ffde59;font-weight:800">${game.level}</span></div><div style="margin-top:14px;display:flex;flex-direction:column;gap:8px"><button id="ad-lives" ${adUses>=3?'disabled':''} style="width:100%;font-weight:900;padding:13px;border-radius:999px;border:2.5px solid black;background:${adUses>=3?'rgba(255,255,255,0.1)':'#ffde59'};color:${adUses>=3?'rgba(255,255,255,0.3)':'black'}">🎬 VER ANUNCIO +3 TIROS (${adUses}/3)</button><button id="restart" style="width:100%;background:rgba(255,255,255,0.08);color:white;font-weight:800;padding:12px;border-radius:999px;border:1px solid rgba(255,255,255,0.15)">REINICIAR DESDE NIVEL 1</button><button id="go-menu" style="width:100%;background:transparent;color:rgba(255,255,255,0.5);font-size:11px;padding:8px">MENU • CHECKPOINT NIVEL ${maxLevel}</button></div></div></div>`;
    }
    if(state==='reward_modal'){
      const titles={
        lives:{t:'¡+3 TIROS EXTRA!',d:'Viste el anuncio completo. Tenés 3 intentos más.',icon:'🎯',btn:'CONTINUAR CON +3 TIROS',rw:'+3 TIROS'},
        double:{t:'¡RECOMPENSA DUPLICADA!',d:`Duplicaste ${tempPoints} PTS y ${tempCoins} 💰 x2 del nivel ${game.level}`,icon:'💰',btn:'RECLAMAR x2 Y SEGUIR',rw:`+${tempPoints} PTS +${tempCoins} 💰`},
        checkpoint:{t:'¡CONTINUAS JUGANDO!',d:`Continuás desde el nivel ${maxLevel} desbloqueado`,icon:'🚀',btn:'CONTINUAR JUGANDO',rw:'NIVEL '+maxLevel}
      };
      const ct=titles[_rewardPending]||titles.lives;
      h+=`<div style="position:absolute;inset:0;z-index:70;background:rgba(0,0,0,0.9);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:16px;pointer-events:auto"><div style="background:linear-gradient(180deg,#1e1e1e,#0f0f0f);border:1px solid rgba(255,222,89,0.3);border-radius:24px;padding:22px;text-align:center;max-width:340px;width:100%"><div style="width:64px;height:64px;margin:0 auto;border-radius:50%;background:linear-gradient(135deg,#ffde59,#ff8a2a);display:flex;align-items:center;justify-content:center;font-size:28px">${ct.icon}</div><div style="margin-top:10px;color:#ffde59;font-weight:900;font-size:16px">${ct.t}</div><div style="margin-top:6px;color:rgba(255,255,255,0.7);font-size:13px">${ct.d}</div><div style="margin-top:12px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:10px;display:flex;justify-content:center;gap:6px"><span style="font-size:10px;color:rgba(255,255,255,0.4)">RECOMPENSA</span><span style="color:#ffde59;font-weight:900">${ct.rw}</span></div><button id="rw-claim" style="margin-top:14px;width:100%;background:#ffde59;color:black;font-weight:900;padding:12px;border-radius:999px;border:2.5px solid black">${ct.btn} →</button></div></div>`;
    }
    if(state==='paused'){
      h+=`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(10,20,48,0.7);backdrop-filter:blur(12px);pointer-events:auto"><div style="background:rgba(15,27,62,0.95);border:1px solid rgba(255,255,255,0.15);border-radius:28px;padding:22px;text-align:center;max-width:320px;width:100%"><div style="color:rgba(255,255,255,0.4);font-weight:800;font-size:9px;letter-spacing:0.15em">PAUSA • ${getShipConfig(game.level).name}</div><h2 style="color:white;font-weight:900;font-size:18px;margin-top:4px">NIVEL ${game.level} • ${game.points} PTS</h2><button id="resume" style="margin-top:14px;width:100%;background:#ffde59;color:black;font-weight:900;padding:12px;border-radius:999px;border:2.5px solid black">CONTINUAR</button><button id="to-menu" style="margin-top:8px;width:100%;background:rgba(255,255,255,0.08);color:white;padding:11px;border-radius:999px;border:1px solid rgba(255,255,255,0.1)">IR AL MENU</button></div></div>`;
    }
    ui.innerHTML=h;
    ui.querySelector('#pauseBtn')?.addEventListener('click',()=>{pauseBefore=state;state='paused';renderUI();});
    ui.querySelector('#resume')?.addEventListener('click',()=>{state=pauseBefore||'playing';pauseBefore=null;renderUI();});
    ui.querySelector('#to-menu')?.addEventListener('click',()=>{state='menu';pauseBefore=null;renderUI();});
    ui.querySelector('#btn-ckpt')?.addEventListener('click',()=>{ if(maxLevel<=1){startGame(1);return;} if(getCoins()>=100){ if(confirm(`Continuar desde nivel ${maxLevel} cuesta 100 monedas o ver anuncio. ¿Pagar 100?`)){setCoins(getCoins()-100);startGame(maxLevel); return;} } openAd('checkpoint'); });
    ui.querySelector('#btn-n1')?.addEventListener('click',()=>startGame(1));
    ui.querySelector('#powBtn')?.addEventListener('click',()=>{if(state!=='playing')return;if(game.power.state==='moving'){game.power.state='locked';game.power.locked=Math.round(game.power.v);}else{game.power.state='moving'; game.power.dir = game.power.locked>=50 ? -1 : 1;}renderUI();});
    ui.querySelector('#shootBtn')?.addEventListener('click',()=>{if(state!=='playing')return;if(game.power.state==='moving'){game.power.state='locked';game.power.locked=Math.round(game.power.v);renderUI();return;} // ya lockeada -> disparar
      if(game.bullets.length>0) return;
      const vel=260+game.power.locked*5.2+(game.level-1)*8; const cx=W/2,cy=H-88,tx=game.cross.x,ty=game.cross.y,dy=cy-ty,time=Math.max(dy/vel,0.18),vx=(tx-cx)/time,vy=-vel;
      game.bullets.push({x:cx,y:cy,vx,vy,trail:[]});
      // despues de disparar, la barra vuelve a moverse automaticamente
      game.power.state='moving';
      game.power.dir = game.power.locked>=50 ? -1 : 1;
      renderUI();
    });
    ui.querySelector('#cont-nox2')?.addEventListener('click',continueWithoutDouble);
    ui.querySelector('#cont-x2')?.addEventListener('click',()=>openAd('double'));
    ui.querySelector('#ad-lives')?.addEventListener('click',()=>{if(adUses>=3)return; openAd('lives');});
    ui.querySelector('#restart')?.addEventListener('click',()=>startGame(1));
    ui.querySelector('#go-menu')?.addEventListener('click',()=>{state='menu';renderUI();});
    ui.querySelector('#rw-claim')?.addEventListener('click',claimReward);
  }

  // === SISTEMA vrAd ===
  function openAd(type){
    console.log('[GAME] pide ad',type,'-> vrAd=1');
    _rewardPending=type;
    window.vrAdType=type;
    window.vrAd=1; // 1 = juego pide ad
    pauseBefore=state;
    state='paused'; // pausa logica, la consola detecta vrAd=1 y pasa a 2 y muestra ad
    renderUI();
  }

  function claimReward(){
    const type=_rewardPending;
    _rewardPending=null;
    window.vrAd=0;
    window.vrAdType=null;
    window._gm_shown=false;
    var gv=document.getElementById('gmVideo'); if(gv){gv.classList.remove('active'); gv.style.display='none'; gv.innerHTML='';}
    if(type==='lives'){
      game.misses=Math.max(0,game.misses-3);game.bullets=[];game.power.state='moving';game.power.v=50;adUses++;state='playing';
    }else if(type==='double'){
      setCoins(getCoins()+tempCoins);
      game.points+=tempPoints;
      maxLevel=Math.max(maxLevel,game.level+1);localStorage.setItem('wasa_max_level',maxLevel);
      game.level+=1;game.misses=0;game.bullets=[];game.power.state='moving';game.power.v=20;initShips(game.level);game.levelStart=performance.now();state='playing';
    }else if(type==='checkpoint'){
      startGame(maxLevel);state='playing';
    }
    renderUI();
  }

  function continueWithoutDouble(){
    setCoins(getCoins()+tempCoins);maxLevel=Math.max(maxLevel,game.level+1);localStorage.setItem('wasa_max_level',maxLevel);
    game.level+=1;game.misses=0;game.bullets=[];game.power.state='moving';game.power.v=20;initShips(game.level);game.levelStart=performance.now();state='playing';renderUI();
  }

  // Watcher vrAd=4 -> muestra modal 1 sola vez, sin re-render cada 200ms que rompe el click
  setInterval(()=>{
    if(window.vrAd===4 && _rewardPending && state!=='reward_modal'){
      console.log('[GAME] vrAd=4 -> recompensa',_rewardPending);
      // ocultar cualquier overlay de la consola que tape el click
      const gv=document.getElementById('gmVideo'); if(gv){gv.classList.remove('active'); gv.style.display='none'; gv.innerHTML='';}
      state='reward_modal';
      renderUI();
    }
  },200);

  let raf;
  function loop(now){
    if(window.vrAd===1 || window.vrAd===2 || window.vrAd===3){
      // mientras hay ad en curso (1,2,3) el juego esta congelado
      raf=requestAnimationFrame(loop);
      return;
    }
    const dt=Math.min((now-last)/1000,0.033);last=now;
    if(state==='playing'){
      for(let s of game.ships){
        if(s.cfg.behavior==='zigzag'||s.cfg.behavior==='zigzag_fast'){s.zigTimer+=dt*(s.cfg.behavior==='zigzag_fast'?4:2); s.y=s.originalY+Math.sin(s.zigTimer)*(s.cfg.behavior==='zigzag_fast'?80:40);}
        if(s.cfg.behavior==='teleport'){s.teleportTimer+=dt; if(s.teleportTimer>2.5){s.teleportTimer=0;s.x=Math.random()*(W-100)+50;s.y=H*0.1+Math.random()*H*0.35;}}
        s.x+=s.dir*s.speed*dt;
        if(s.dir===1&&s.x>W+140){s.x=-140;s.y=H*0.1+Math.random()*H*0.32;s.originalY=s.y;s.dir=Math.random()>0.5?1:-1;if(s.dir===-1)s.x=W+140;}
        else if(s.dir===-1&&s.x<-140){s.x=W+140;s.y=H*0.1+Math.random()*H*0.32;s.originalY=s.y;s.dir=Math.random()>0.5?1:-1;if(s.dir===1)s.x=-140;}
        if(s.hitFlash>0)s.hitFlash-=dt*4;
      }
      game.cross.x+=game.cross.dir*game.cross.speed*dt; if(game.cross.x>W-30){game.cross.x=W-30;game.cross.dir=-1;} if(game.cross.x<30){game.cross.x=30;game.cross.dir=1;}
      // POWER BAR - robusta, no se traba
      if(state==='playing'){
        if(game.power.state==='moving'){
          game.power.v += game.power.dir * game.power.speed * dt;
          if(game.power.v >= 100){ game.power.v=100; game.power.dir=-1; }
          if(game.power.v <= 0){ game.power.v=0; game.power.dir=1; }
        } else {
          // lockeada en 99% etc, mantiene valor
          game.power.v = game.power.locked;
        }
      }
      for(let i=game.bullets.length-1;i>=0;i--){
        const b=game.bullets[i];b.trail.push({x:b.x,y:b.y});if(b.trail.length>8)b.trail.shift();b.x+=b.vx*dt;b.y+=b.vy*dt;
        let hit=false;
        for(let sIdx=game.ships.length-1;sIdx>=0;sIdx--){
          const sh=game.ships[sIdx];
          if(Math.abs(b.y-sh.y)<28&&Math.abs(b.x-sh.x)<sh.w*0.5){
            const dmg=50+ups.d.main;sh.hp-=dmg;sh.hitFlash=1;
            for(let k=0;k<12;k++){const ang=Math.random()*Math.PI*2,sp=Math.random()*120+40;game.parts.push({x:sh.x,y:sh.y,vx:Math.cos(ang)*sp+sh.dir*20,vy:Math.sin(ang)*sp,life:1,size:Math.random()*2+1,color:Math.random()>0.5?"#ffde59":"#ff8a4d"});}
            game.bullets.splice(i,1);game.power.state='moving';hit=true;
            if(sh.hp<=0){
              game.ships.splice(sIdx,1);
              for(let k=0;k<24;k++){const ang=Math.random()*Math.PI*2,sp=Math.random()*260+40;game.parts.push({x:sh.x,y:sh.y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,life:1,size:Math.random()*4+2,color:`hsl(${40+Math.random()*30},100%,60%)`});}
              if(game.ships.length===0){
                const elapsed=(performance.now()-game.levelStart)/1000;
                tempPoints=100*game.level;
                const baseWASA=getBaseWASA(game.level);
                let mult=getTimeMult(elapsed);
                const raw=baseWASA*mult;
                tempCoins=raw;
                game.lastTime=elapsed;game.lastMult=mult;game.lastBase=baseWASA;
                game.lastRaw=raw;
                game.points+=tempPoints; state='levelup'; renderUI();
                setTimeout(()=>{if(state==='levelup') continueWithoutDouble();},5000);
              }
            }
            break;
          }
        }
        if(hit) continue;
        if(b.y<-30||b.x<-30||b.x>W+30){game.bullets.splice(i,1);game.misses+=1;game.power.state='moving'; game.power.dir = game.power.locked>=50 ? -1 : 1; if(game.misses>=5){tempCoins=0;state='gameover';renderUI();}}
      }
    }
    for(let i=game.parts.length-1;i>=0;i--){const p=game.parts[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=0.98;p.vy+=80*dt;p.life-=dt*0.9;if(p.life<=0)game.parts.splice(i,1);}

    const grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,"#21418f");grad.addColorStop(1,"#5e80e1");ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
    for(const s of game.stars){const a=0.5+Math.sin(Date.now()*0.001*s.tw+s.off)*0.5;ctx.fillStyle=`rgba(255,255,255,${0.3+a*0.7})`;ctx.beginPath();ctx.arc(s.x,s.y,s.size*(0.7+a*0.6),0,Math.PI*2);ctx.fill();}
    for(let sh of game.ships) drawShip(sh);
    if(state==='playing'||state==='levelup'){
      for(const b of game.bullets){for(let j=0;j<b.trail.length;j++){const t=b.trail[j],a=j/b.trail.length;ctx.fillStyle=`rgba(255,222,89,${a*0.6})`;ctx.beginPath();ctx.arc(t.x,t.y,2+a*2,0,Math.PI*2);ctx.fill();}ctx.shadowColor="#ffde59";ctx.shadowBlur=12;ctx.fillStyle="#fffe8a";ctx.beginPath();ctx.arc(b.x,b.y,5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
      for(const p of game.parts){ctx.globalAlpha=p.life;ctx.fillStyle=p.color;ctx.shadowColor=p.color;ctx.shadowBlur=6;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.globalAlpha=1;}
      if(state==='playing') drawCross(game.cross.x,game.cross.y,game.power.state==='locked',Date.now());
      const cx=W/2,cy=H-100;ctx.save();ctx.translate(cx,cy);ctx.shadowColor="#ffde59";ctx.shadowBlur=16;ctx.fillStyle="#1a2a5a";ctx.beginPath();ctx.ellipse(0,0,26,10,0,0,Math.PI*2);ctx.fill();if(state==='playing'){const ang=Math.atan2(game.cross.y-cy,game.cross.x-cx);ctx.rotate(ang);ctx.fillStyle="#e6e8ff";ctx.fillRect(0,-5,36,10);ctx.fillStyle="#ffde59";ctx.fillRect(32,-3,10,6);}ctx.restore();
    }
    raf=requestAnimationFrame(loop);
  }
  renderUI(); initShips(1); raf=requestAnimationFrame(loop);
  canvas.addEventListener('pointerdown',e=>{if(e.target.closest('button')) return; if(state!=='playing') return; if(game.power.state==='moving'){game.power.state='locked';game.power.locked=Math.round(game.power.v);renderUI();}else if(game.bullets.length===0){const vel=260+game.power.locked*5.2+(game.level-1)*8;const cx=W/2,cy=H-88,tx=game.cross.x,ty=game.cross.y,dy=cy-ty,time=Math.max(dy/vel,0.18),vx=(tx-cx)/time,vy=-vel;game.bullets.push({x:cx,y:cy,vx,vy,trail:[]}); game.power.state='moving'; game.power.dir = game.power.locked>=50 ? -1 : 1; renderUI();}});
  container._cleanup=()=>{cancelAnimationFrame(raf);ro.disconnect(); window.vrAd=0; window.vrAdType=null;};
}
