export function init(container, args){
  const quality = args.quality||'hd';
  const getCoins = args.getCoins||(()=>parseInt(localStorage.getItem('wasa_coins')||'0'));
  const setCoins = args.setCoins||((n)=>localStorage.setItem('wasa_coins',n));
  const addCoins = args.addCoins||((n)=>setCoins(getCoins()+n));

  container.innerHTML = `
    <style>
      .wg{width:100%;height:100%;position:relative;background:#21418f;overflow:hidden;font-family:Inter,system-ui,sans-serif}
      .wg canvas{width:100%;height:100%;display:block}
      .wg-ui{position:absolute;inset:0;pointer-events:none}
      .wg-ui button{pointer-events:auto}
      @keyframes load{0%{width:0%}100%{width:100%}}
      @keyframes spin{to{transform:rotate(360deg)}}
    </style>
    <div class="wg"><canvas id="c"></canvas><div id="ui" class="wg-ui"></div></div>
  `;
  const wrap=container.querySelector('.wg');
  const canvas=wrap.querySelector('#c');
  const ctx=canvas.getContext('2d');
  const ui=wrap.querySelector('#ui');
  let W=wrap.clientWidth,H=wrap.clientHeight;
  function resize(){W=wrap.clientWidth;H=wrap.clientHeight;const dpr=devicePixelRatio||1;canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0);}
  resize(); const ro=new ResizeObserver(resize); ro.observe(wrap);

  let ups=JSON.parse(localStorage.getItem('wasa_upgrades_final')||'{"d":{"main":0,"sub":0},"c":{"main":0,"sub":0},"p":{"main":0,"sub":0}}');
  let coins=getCoins();
  let ranking=JSON.parse(localStorage.getItem('wasa_ranking_final')||'[]');
  let maxLevel=parseInt(localStorage.getItem('wasa_max_level')||'1');

  let game={ships:[],cross:{x:W/2,y:H*0.62,dir:1,speed:420},power:{v:0,dir:1,speed:82,state:'moving',locked:50},bullets:[],parts:[],stars:[],level:1,points:0,misses:0,levelStart:0,lastTime:0,lastMult:1,lastBase:0};
  let state='menu';
  let ad={type:null};
  let adUses=0, tempCoins=0, tempPoints=0, last=performance.now();
  let levelUpInfo={level:2,points:0};
  let pauseBeforeState=null;
  let _pendingAdType=null;
  let _rewardPending=null;

  for(let i=0;i<(quality==='lite'?80:140);i++) game.stars.push({x:Math.random()*W,y:Math.random()*H*0.85,size:Math.random()*1.8+0.3,tw:Math.random()*2+0.5,off:Math.random()*6});

  function getShipConfig(level){
    const tier = Math.min(Math.floor((level-1)/10),9);
    const configs = [
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
    const hpBase = cfg.hp + (level-1)* (cfg.behavior==='boss'?12:5);
    const dir=Math.random()>0.5?1:-1;
    const yBase = H*0.12 + (index*(H*0.25/total)) + Math.random()*H*0.15;
    return {x:dir===1?-120-index*150:W+120+index*150,y:yBase,w:cfg.w,h:cfg.h,hp:hpBase,maxHp:hpBase,dir,speed:cfg.speed+(level-1)*0.75,hitFlash:0,type:Math.floor((level-1)/10),cfg,ghostTimer:0,zigTimer:0,teleportTimer:0,originalY:yBase};
  }
  function initShips(lvl){
    const cfg=getShipConfig(lvl);
    const count = cfg.count || (cfg.behavior==='duo' ? 2 : 1);
    game.ships=[];
    for(let i=0;i<count;i++) game.ships.push(createShip(lvl,i,count));
    const lp=lvl-1;
    const crossBase=420+Math.min(180,lp*7+Math.pow(lp,0.65)*8);
    const powerBase=82+Math.min(55,lp*1.2+Math.pow(lp,0.6)*4);
    game.cross.speed=Math.max(80,crossBase*(1-ups.c.main*0.012));
    game.power.speed=Math.max(20,powerBase*(1-ups.p.main*0.015));
  }
  function startGame(fromLevel=1){
    game.level=fromLevel;game.points=fromLevel>1?(fromLevel-1)*100:0;game.misses=0;game.bullets=[];game.parts=[];
    game.power={v:50,dir:1,speed:82*(1-ups.p.main*0.015),state:'moving',locked:50};
    game.cross={x:W/2,y:H*0.62,dir:1,speed:420*(1-ups.c.main*0.012)};
    initShips(fromLevel);game.levelStart=performance.now();state='playing';adUses=0;renderUI();
  }
  function drawShip(s){
    if(s.cfg.behavior==='ghost'){s.ghostTimer+=0.016; if(Math.sin(s.ghostTimer*2)>0.7) return;}
    ctx.save();ctx.translate(s.x,s.y); const alpha=s.cfg.behavior==='ghost'?0.6+Math.sin(s.ghostTimer*5)*0.4:1; ctx.globalAlpha=alpha;
    if(s.hitFlash>0){ctx.shadowColor="#ff4444";ctx.shadowBlur=30;}else{ctx.shadowColor=s.cfg.colors.body;ctx.shadowBlur=s.type>=3?22:18;}
    ctx.fillStyle=s.hitFlash>0?"#ffaaaa":s.cfg.colors.body;ctx.beginPath();ctx.ellipse(0,6,s.w*0.52,s.h*0.72,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=s.hitFlash>0?"#ff5555":s.cfg.colors.belly;ctx.beginPath();ctx.ellipse(0,10,s.w*0.48,s.h*0.5,0,0,Math.PI);ctx.fill();ctx.shadowBlur=0;
    const g=ctx.createRadialGradient(-4,-6,2,0,-2,18);g.addColorStop(0,s.cfg.colors.cockpit[0]);g.addColorStop(0.3,s.cfg.colors.cockpit[1]);g.addColorStop(1,s.cfg.colors.cockpit[2]);
    ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,-4,s.w*0.28,s.h*0.85,0,Math.PI,Math.PI*2);ctx.fill();
    for(let i=-2;i<=2;i++){ctx.fillStyle=i%2===0?s.cfg.colors.lights[0]:s.cfg.colors.lights[1];ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=8;ctx.beginPath();ctx.arc(i*(s.w/5.5),10,s.type===9?4.5:3.2,0,Math.PI*2);ctx.fill();}
    if(s.type===9){ctx.fillStyle="#ff0000";ctx.shadowColor="#ff0000";ctx.shadowBlur=12;ctx.fillRect(-s.w*0.4,-s.h*0.5,s.w*0.8,4);}
    ctx.restore();ctx.globalAlpha=1;
  }
  function drawCross(x,y,locked,t){
    ctx.save();ctx.translate(x,y);const sc=1+Math.sin(t*0.01)*0.12;ctx.scale(sc,sc);
    ctx.strokeStyle=locked?"rgba(255,222,89,0.95)":"rgba(255,255,255,0.92)";ctx.lineWidth=locked?2.2:1.8;ctx.shadowColor=locked?"#ffde59":"#ffffff";ctx.shadowBlur=locked?18:14;
    ctx.beginPath();ctx.arc(0,0,40,0,Math.PI*2);ctx.stroke();ctx.lineWidth=1.8;ctx.beginPath();ctx.arc(0,0,14,0,Math.PI*2);ctx.stroke();ctx.lineWidth=locked?2.2:1.6;ctx.beginPath();ctx.moveTo(-62,0);ctx.lineTo(-22,0);ctx.moveTo(22,0);ctx.lineTo(62,0);ctx.moveTo(0,-62);ctx.lineTo(0,-22);ctx.moveTo(0,22);ctx.lineTo(0,62);ctx.stroke();ctx.fillStyle=locked?"#ffde59":"#ffffff";ctx.shadowColor="#ffde59";ctx.shadowBlur=16;ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.fill();if(locked){ctx.shadowBlur=0;ctx.fillStyle="rgba(255,222,89,0.9)";ctx.font="900 10px monospace";ctx.textAlign="center";ctx.fillText("LOCK",0,-52);}ctx.restore();
  }
  function renderUI(){
    const cfg=getShipConfig(game.level);
    let h='';
    h+=`<div style="position:absolute;top:0;left:0;right:0;padding:12px 16px;display:flex;justify-content:space-between;align-items:start;pointer-events:auto"><div><div style="display:flex;align-items:center;gap:8px"><div style="width:28px;height:28px;border-radius:50%;background:white;color:#21418f;font-weight:900;display:flex;align-items:center;justify-content:center">W</div><span style="color:white;font-weight:900;letter-spacing:0.18em;font-size:11px">wasa.chat</span><span style="margin-left:8px;font-size:8px;padding:2px 6px;border-radius:999px;background:rgba(255,255,255,0.15);color:rgba(255,255,255,0.7)">${cfg.name} • NIVEL ${game.level}/100</span>${state==='playing'?`<button id="pauseBtn" style="margin-left:12px;width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:white">⏸</button>`:''}</div><div style="display:flex;gap:8px;margin-top:12px"><div style="background:rgba(0,0,0,0.35);padding:6px 14px;border-radius:999px;color:white;font-size:11px;font-weight:900;border:1px solid rgba(255,255,255,0.1)">NIVEL ${game.level}</div><div style="background:rgba(0,0,0,0.35);padding:6px 14px;border-radius:999px;color:white;font-size:11px;font-weight:900;border:1px solid rgba(255,255,255,0.1)">${game.points} PTS</div><div style="background:#ffde59;color:black;padding:6px 12px;border-radius:999px;font-size:11px;font-weight:900;border:2px solid black">💰 ${getCoins()}</div></div></div><div style="display:flex;flex-direction:column;gap:6px;align-items:end"><div style="display:flex;align-items:center;gap:8px;background:rgba(0,0,0,0.3);padding:6px 12px;border-radius:999px;border:1px solid rgba(255,255,255,0.1)"><span style="font-size:9px;color:rgba(255,255,255,0.6);font-weight:700">TIROS</span><div style="display:flex;gap:6px">${Array.from({length:5}).map((_,i)=>`<div style="width:10px;height:10px;border-radius:50%;background:${i<5-game.misses?'#ffde59':'rgba(255,255,255,0.15)'};box-shadow:${i<5-game.misses?'0 0 10px #ffde59':''}"></div>`).join('')}</div></div><div style="display:flex;flex-direction:column;gap:4px;align-items:end">${game.ships.map(s=>`<div style="background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.15);border-radius:999px;padding:2px 10px 2px 2px;display:flex;align-items:center;gap:6px"><div style="width:56px;height:6px;background:rgba(0,0,0,0.4);border-radius:999px;padding:1px"><div style="height:100%;border-radius:999px;width:${Math.max(0,s.hp/s.maxHp*100)}%;background:${s.hp/s.maxHp>0.5?'linear-gradient(90deg,#4ade80,#22c55e)':'linear-gradient(90deg,#facc15,#f59e0b)'}"></div></div><span style="font-size:11px;font-weight:900;color:${s.hp/s.maxHp<0.3?'#fca5a5':'white'}">${s.hp}</span><span style="font-size:8px;color:rgba(255,255,255,0.4)">/ ${s.maxHp}</span></div>`).join('')}</div></div></div>`;

    if(state==='playing'){
      h+=`<div style="position:absolute;top:92px;left:50%;transform:translateX(-50%);pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:4px">${game.power.state==='moving'?`<div style="background:#ffde59;color:black;font-weight:900;font-size:10px;letter-spacing:0.14em;padding:8px 16px;border-radius:999px;border:2px solid black">1° CLICK: FIJAR POTENCIA → 2° CLICK: DISPARAR</div>`:`<div style="background:white;color:black;font-weight:900;font-size:11px;padding:8px 20px;border-radius:999px;border:2px solid black">POTENCIA ${Math.round(game.power.locked)}% FIJADA • ¡DISPARA! 🎯</div>`}<div style="font-size:8px;color:rgba(255,255,255,0.5);background:rgba(0,0,0,0.2);padding:2px 8px;border-radius:999px;margin-top:4px">${cfg.name} • ${game.ships.length} nave(s)</div></div>`;
      h+=`<div style="position:absolute;bottom:0;left:0;right:0;padding:8px 16px;display:flex;justify-content:space-between;align-items:end;pointer-events:none;gap:8px"><div style="pointer-events:auto;display:flex;flex-direction:column;align-items:center;gap:6px;width:90px"><div id="power-label" style="font-size:9px;font-weight:900;letter-spacing:0.22em;color:rgba(255,255,255,0.8);width:90px;text-align:center">POTENCIA ${Math.round(game.power.v)}%</div><div style="position:relative;width:40px;height:160px;background:rgba(0,0,0,0.45);border:1px solid rgba(255,255,255,0.15);border-radius:18px;padding:6px;display:flex;flex-direction:column;justify-content:end;overflow:hidden"><div id="power-fill" style="width:100%;border-radius:12px;height:${game.power.state==='locked'?game.power.locked:game.power.v}%;background:linear-gradient(180deg,#fff7a0,#ffde59 60%,#ff6a2a)"></div><div id="power-line" style="position:absolute;left:0;right:0;height:3px;background:white;box-shadow:0 0 12px white;bottom:${game.power.state==='locked'?game.power.locked:game.power.v}%"></div></div><button id="power-btn" style="width:90px;padding:6px;border-radius:999px;font-size:9px;font-weight:900;background:${game.power.state==='locked'?'#ffde59':'rgba(255,255,255,0.1)'};color:${game.power.state==='locked'?'black':'white'}">${game.power.state==='locked'?Math.round(game.power.locked)+'% DESBLOQ':'FIJAR'}</button></div><div style="pointer-events:auto;flex:1;display:flex;justify-content:center;margin-bottom:4px"><div style="background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.15);border-radius:999px;padding:8px 14px;display:flex;gap:12px;align-items:center"><span style="font-size:7px;color:rgba(255,255,255,0.4)">DMG</span><span id="dmg-val" style="font-size:11px;font-weight:900;color:#ffde59">${50+ups.d.main}</span><div style="width:1px;height:12px;background:rgba(255,255,255,0.15)"></div><span style="font-size:7px;color:rgba(255,255,255,0.4)">POT</span><span id="pot-val" style="font-size:11px;font-weight:900;color:white">${Math.round(game.power.state==='locked'?game.power.locked:game.power.v)}%</span><div style="width:1px;height:12px;background:rgba(255,255,255,0.15)"></div><span style="font-size:7px;color:rgba(255,255,255,0.4)">HP</span><span id="enemy-hp-val" style="font-size:11px;font-weight:900;color:white">${game.ships[0]?game.ships[0].hp:0}/${game.ships[0]?game.ships[0].maxHp:0}</span></div></div><div style="pointer-events:auto"><button id="shoot-btn" style="padding:14px 28px;border-radius:999px;font-weight:900;border:2.5px solid black;background:${game.power.state==='locked'?'#ffde59':'rgba(255,255,255,0.2)'};color:${game.power.state==='locked'?'black':'white'}">${game.power.state==='moving'?'FIJAR POTENCIA':'DISPARAR ↗'}</button></div></div>`;
    }
    if(state==='menu'){
      h+=`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(33,65,143,0.55);backdrop-filter:blur(10px);pointer-events:auto"><div style="width:100%;max-width:560px;border-radius:28px;background:rgba(15,27,62,0.92);border:1px solid rgba(255,255,255,0.15);padding:24px;overflow:hidden"><div style="display:flex;justify-content:space-between"><div style="display:flex;align-items:center;gap:8px"><div style="width:36px;height:36px;border-radius:50%;background:white;color:#21418f;font-weight:900;display:flex;align-items:center;justify-content:center">W</div><span style="color:white;font-weight:900;letter-spacing:0.2em;font-size:12px">wasa.chat</span></div><div style="font-size:9px;letter-spacing:0.2em;color:rgba(255,255,255,0.5);border:1px solid rgba(255,255,255,0.1);border-radius:999px;padding:4px 10px">100 NIVELES • 10 NAVES</div></div><h1 style="margin-top:24px;color:white;font-weight:900;font-size:34px;line-height:0.9">STAR<br><span style="color:#ffde59">SHOOTER WARS</span></h1><div style="margin-top:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:12px;display:flex;justify-content:space-between"><div><div style="font-size:10px;color:rgba(255,255,255,0.4);font-weight:700">MAX NIVEL DESBLOQUEADO</div><div style="color:#ffde59;font-weight:900;font-size:18px">NIVEL ${maxLevel} • ${getShipConfig(maxLevel).name}</div></div><div style="font-size:20px">🚀</div></div><div style="margin-top:16px;display:flex;flex-direction:column;gap:10px"><button id="btn-n1" style="width:100%;background:rgba(255,255,255,0.1);color:white;font-weight:900;padding:12px;border-radius:999px">JUGAR DESDE NIVEL 1 • FARMEAR MONEDAS</button><button id="btn-ckpt" style="width:100%;background:#ffde59;color:black;font-weight:900;padding:14px;border-radius:999px;border:2.5px solid black">CONTINUAR DESDE NIVEL ${maxLevel} ${maxLevel>1?'• 100 💰 O ANUNCIO':''}</button><div style="display:flex;gap:10px"><button id="btn-shop" style="flex:1;background:rgba(255,255,255,0.08);color:white;font-weight:900;padding:12px;border-radius:999px">MEJORAS • ${ups.d.main+ups.c.main+ups.p.main}/150</button><button id="btn-rank" style="flex:1;background:rgba(255,255,255,0.08);color:white;font-weight:900;padding:12px;border-radius:999px">RANKING TOP 10</button></div></div><div style="margin-top:16px;display:grid;grid-template-columns:repeat(5,1fr);gap:6px">${Array.from({length:10}).map((_,i)=>{const lvl=i*10+1;const unlocked=maxLevel>=lvl;const cfg2=getShipConfig(lvl);return `<div style="border-radius:12px;border:1px solid ${unlocked?'rgba(255,222,89,0.4)':'rgba(255,255,255,0.1)'};background:${unlocked?'rgba(255,222,89,0.2)':'rgba(255,255,255,0.05)'};padding:6px;text-align:center;opacity:${unlocked?1:0.4}"><div style="font-size:7px;color:rgba(255,255,255,0.4)">NVL ${lvl}</div><div style="font-size:8px;font-weight:900;color:${unlocked?'#ffde59':'rgba(255,255,255,0.3)'}">${cfg2.name.split(' ')[0]}</div></div>`}).join('')}</div></div></div>`;
    }
    if(state==='shop'){
      h+=`<div style="position:absolute;inset:0;display:flex;justify-content:center;padding:12px;background:rgba(10,20,48,0.8);backdrop-filter:blur(12px);overflow-y:auto;pointer-events:auto"><div style="width:100%;max-width:560px;background:rgba(15,27,62,0.95);border:1px solid rgba(255,255,255,0.15);border-radius:28px;padding:20px;margin:16px 0;height:fit-content"><div style="display:flex;justify-content:space-between;align-items:center"><h2 style="color:white;font-weight:900;font-size:18px">MEJORAS • 50 NIVELES / 250 SUBNIVELES</h2><button id="shop-close" style="width:32px;height:32px;background:rgba(255,255,255,0.1);color:white;border-radius:50%">✕</button></div><div style="margin-top:8px;display:flex;gap:8px;align-items:center"><div style="background:#ffde59;color:black;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:900;border:2px solid black">💰 ${getCoins()}</div><div style="color:rgba(255,255,255,0.5);font-size:11px">5 sub = 1 nivel. No rompe nada.</div></div>${[{id:'d',name:'DAÑO BALA',desc:`Base 50 + ${ups.d.main} daño`},{id:'c',name:'MIRA LENTA',desc:`-${(ups.c.main*1.2).toFixed(1)}% vel mira`},{id:'p',name:'POTENCIA LENTA',desc:`-${(ups.p.main*1.5).toFixed(1)}% vel barra`}].map(u=>{const cur=ups[u.id];const cost=cur.main+1;const can=getCoins()>=cost&&cur.main<50;return `<div style="margin-top:16px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:14px"><div style="display:flex;justify-content:space-between"><div><div style="color:white;font-weight:900;font-size:13px">${u.name} <span style="color:#ffde59">NIVEL ${cur.main}/50</span></div><div style="color:rgba(255,255,255,0.6);font-size:11px">${u.desc}</div></div><div style="font-size:10px;color:rgba(255,255,255,0.4)">${cost} 💰</div></div><div style="margin-top:12px;display:flex;gap:6px">${Array.from({length:5}).map((_,i)=>`<div style="flex:1;height:8px;border-radius:999px;background:${i<cur.sub?'#ffde59':'rgba(255,255,255,0.1)'}"></div>`).join('')}</div><div style="margin-top:8px;display:flex;justify-content:space-between;align-items:center"><span style="font-size:10px;color:rgba(255,255,255,0.5)">${cur.sub}/5 → nivel ${cur.main+1}</span><button data-buy="${u.id}" style="padding:6px 14px;border-radius:999px;font-size:11px;font-weight:900;border:2px solid black;background:${can?'#ffde59':'rgba(255,255,255,0.1)'};color:${can?'black':'rgba(255,255,255,0.3)'}">${cur.main>=50?'MAX':'COMPRAR SUB'}</button></div></div>`}).join('')}</div></div>`;
    }
    if(state==='ranking'){
      h+=`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,0.6);backdrop-filter:blur(12px);pointer-events:auto"><div style="width:100%;max-width:420px;background:rgba(15,27,62,0.95);border:1px solid rgba(255,255,255,0.15);border-radius:28px;padding:20px"><div style="display:flex;justify-content:space-between;align-items:center"><h2 style="color:white;font-weight:900;font-size:18px">RANKING TOP 10</h2><button id="rank-close" style="width:32px;height:32px;background:rgba(255,255,255,0.1);color:white;border-radius:50%">✕</button></div><div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:4px">MAX NIVEL: ${maxLevel}</div><div style="margin-top:16px;display:flex;flex-direction:column;gap:8px">${ranking.length===0?`<div style="text-align:center;color:rgba(255,255,255,0.3);padding:24px;font-size:12px">Sin puntajes aún</div>`:ranking.map((r,i)=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 14px;border-radius:999px;border:1px solid ${i===0?'rgba(255,222,89,0.4)':'rgba(255,255,255,0.1)'};background:${i===0?'rgba(255,222,89,0.2)':'rgba(255,255,255,0.05)'};color:${i===0?'#ffde59':'rgba(255,255,255,0.7)'}"><span style="font-weight:900;font-size:12px">#${i+1} ${r.name} • ${getShipConfig(r.level).name}</span><span style="font-size:11px">${r.score} pts</span></div>`).join('')}</div></div></div>`;
    }
    if(state==='paused'){
      h+=`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(10,20,48,0.8);backdrop-filter:blur(12px);pointer-events:auto"><div style="width:100%;max-width:360px;background:rgba(15,27,62,0.95);border:1px solid rgba(255,255,255,0.15);border-radius:28px;padding:24px;text-align:center"><div style="color:rgba(255,255,255,0.4);font-weight:900;letter-spacing:0.2em;font-size:10px">PAUSA • ${getShipConfig(game.level).name}</div><h2 style="color:white;font-weight:900;font-size:22px;margin-top:4px">NIVEL ${game.level} • ${game.points} PTS</h2><div style="margin-top:20px;display:flex;flex-direction:column;gap:10px"><button id="resume" style="width:100%;background:#ffde59;color:black;font-weight:900;padding:12px;border-radius:999px;border:2px solid black">CONTINUAR</button><button id="to-menu" style="width:100%;background:rgba(255,255,255,0.1);color:white;font-weight:900;padding:12px;border-radius:999px">IR AL MENU • GUARDAR PROGRESO</button></div></div></div>`;
    }
    if(state==='levelup'){
      h+=`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(10,20,48,0.6);backdrop-filter:blur(10px);pointer-events:auto"><div style="background:rgba(15,27,62,0.95);border:1px solid rgba(255,255,255,0.15);border-radius:28px;padding:20px;text-align:center;max-width:400px;width:100%"><div style="color:#ffde59;font-weight:900;letter-spacing:0.25em;font-size:12px">¡DESTRUIDA! • ${getShipConfig(game.level).name}</div><div style="color:white;font-weight:900;font-size:28px;margin-top:4px">NIVEL ${levelUpInfo.level-1} → ${levelUpInfo.level}</div><div style="margin-top:8px;display:inline-flex;gap:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:999px;padding:6px 12px;font-size:11px"><span style="color:rgba(255,255,255,0.6)">+${tempPoints} PTS</span><span style="color:#ffde59;font-weight:900">+${tempCoins} 💰</span></div>${levelUpInfo.level % 10 === 1 ? `<div style="margin-top:10px;background:rgba(255,222,89,0.2);border:1px solid rgba(255,222,89,0.3);border-radius:999px;padding:6px;font-size:10px;color:#ffde59;font-weight:900">🚀 CHECKPOINT • NUEVA NAVE: ${getShipConfig(levelUpInfo.level).name}</div>` : ''}<div style="margin-top:16px;display:flex;flex-direction:column;gap:8px"><button id="cont-nox2" style="width:100%;background:white;color:black;font-weight:900;padding:10px;border-radius:999px">CONTINUAR SIN DUPLICAR</button><button id="cont-x2" style="width:100%;background:#ffde59;color:black;font-weight:900;padding:10px;border-radius:999px">🎬 DUPLICAR x2 VIENDO ANUNCIO</button><button id="to-menu2" style="width:100%;background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.7);font-weight:900;padding:8px;border-radius:999px;font-size:11px">IR AL MENU • USAR MONEDAS</button></div></div></div>`;
    }
    if(state==='gameover'){
      h+=`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(10,20,48,0.7);backdrop-filter:blur(12px);pointer-events:auto"><div style="width:100%;max-width:440px;border-radius:28px;background:rgba(15,27,62,0.95);border:1px solid rgba(255,255,255,0.15);padding:20px;text-align:center"><div style="width:56px;height:56px;margin:0 auto;border-radius:50%;background:rgba(239,68,68,0.2);border:1px solid rgba(239,68,68,0.3);display:flex;align-items:center;justify-content:center"><div style="width:32px;height:32px;border-radius:50%;background:#ef4444"></div></div><div style="margin-top:16px;color:#fca5a5;font-weight:900;letter-spacing:0.28em;font-size:11px">MISIÓN FALLIDA • ${getShipConfig(game.level).name}</div><h2 style="margin-top:8px;color:white;font-weight:900;font-size:30px">GAME OVER</h2><div style="margin-top:12px;display:inline-flex;gap:8px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:999px;padding:6px 12px"><span style="color:rgba(255,255,255,0.5);font-size:10px">PUNTOS</span><span style="color:white;font-weight:900;font-size:12px">${game.points}</span><span style="width:1px;background:rgba(255,255,255,0.1);margin:0 4px"></span><span style="color:rgba(255,255,255,0.5);font-size:10px">NIVEL</span><span style="color:#ffde59;font-weight:900;font-size:12px">${game.level}</span><span style="width:1px;background:rgba(255,255,255,0.1);margin:0 4px"></span><span style="color:rgba(255,255,255,0.5);font-size:10px">MAX</span><span style="color:white;font-weight:900;font-size:12px">${maxLevel}</span></div><div style="margin-top:16px;display:flex;flex-direction:column;gap:10px"><button id="ad-lives" ${adUses>=3?'disabled':''} style="width:100%;font-weight:900;padding:12px;border-radius:999px;border:2.5px solid black;background:${adUses>=3?'rgba(255,255,255,0.1)':'#ffde59'};color:${adUses>=3?'rgba(255,255,255,0.3)':'black'}">🎬 VER ANUNCIO +3 TIROS (${adUses}/3)</button><button id="restart" style="width:100%;background:rgba(255,255,255,0.08);color:white;font-weight:900;padding:12px;border-radius:999px">REINICIAR DESDE NIVEL 1</button><button id="to-menu3" style="width:100%;color:rgba(255,255,255,0.5);font-size:11px;padding:6px">MENU • CHECKPOINT NIVEL ${maxLevel}</button></div></div></div>`;
    }
    if(state==='reward_modal' && _rewardPending){
      const cfg = {lives:{title:'¡+3 TIROS EXTRA!',desc:'Viste el anuncio completo. Tenés 3 intentos más.',btn:'CONTINUAR CON +3 TIROS',reward:'+3 TIROS'},double:{title:'¡RECOMPENSA DUPLICADA!',desc:`Duplicaste ${tempPoints} PTS y ${tempCoins} 💰 x2 del nivel ${game.level}`,btn:'RECLAMAR x2 Y SEGUIR',reward:`+${tempPoints} PTS +${tempCoins} 💰`},checkpoint:{title:'¡CONTINUAS JUGANDO!',desc:`Continuás desde el nivel ${maxLevel} desbloqueado`,btn:'CONTINUAR JUGANDO',reward:'NIVEL '+maxLevel}};
      const c=cfg[_rewardPending]||cfg.lives;
      h+=`<div style="position:absolute;inset:0;z-index:100;background:rgba(0,0,0,0.9);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:16px;pointer-events:auto"><div style="width:100%;max-width:380px;background:linear-gradient(135deg,#1e1e1e,#0f0f0f);border:1px solid rgba(255,222,89,0.3);border-radius:24px;padding:20px;text-align:center"><div style="width:64px;height:64px;margin:0 auto;border-radius:50%;background:linear-gradient(135deg,#ffde59,#ff8a2a);display:flex;align-items:center;justify-content:center;font-size:32px">🎯</div><div style="margin-top:12px;color:#ffde59;font-weight:900;font-size:18px">${c.title}</div><div style="margin-top:6px;color:rgba(255,255,255,0.7);font-size:13px">${c.desc}</div><div style="margin-top:12px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:8px"><span style="font-size:10px;color:rgba(255,255,255,0.4)">RECOMPENSA</span> <span style="color:#ffde59;font-weight:900;font-size:14px">${c.reward}</span></div><button id="rw-claim" style="margin-top:12px;width:100%;padding:12px;border-radius:999px;background:#ffde59;color:black;font-weight:900;border:2.5px solid black">${c.btn} →</button></div></div>`;
    }
    ui.innerHTML=h;
    ui.querySelector('#pauseBtn')?.addEventListener('click',()=>{pauseBeforeState='playing';state='paused';renderUI();});
    ui.querySelector('#resume')?.addEventListener('click',()=>{state=pauseBeforeState||'playing';pauseBeforeState=null;renderUI();});
    ui.querySelector('#to-menu')?.addEventListener('click',()=>{state='menu';pauseBeforeState=null;ad.type=null;renderUI();});
    ui.querySelector('#to-menu2')?.addEventListener('click',()=>{state='menu';pauseBeforeState=null;ad.type=null;renderUI();});
    ui.querySelector('#to-menu3')?.addEventListener('click',()=>{state='menu';renderUI();});
    ui.querySelector('#btn-n1')?.addEventListener('click',()=>startGame(1));
    ui.querySelector('#btn-ckpt')?.addEventListener('click',continueFromCheckpoint);
    ui.querySelector('#btn-shop')?.addEventListener('click',()=>{state='shop';renderUI();});
    ui.querySelector('#btn-rank')?.addEventListener('click',()=>{state='ranking';renderUI();});
    ui.querySelector('#shop-close')?.addEventListener('click',()=>{state='menu';renderUI();});
    ui.querySelector('#rank-close')?.addEventListener('click',()=>{state='menu';renderUI();});
    ui.querySelector('#power-btn')?.addEventListener('click',togglePower);
    ui.querySelector('#shoot-btn')?.addEventListener('click',handleShoot);
    ui.querySelector('#cont-nox2')?.addEventListener('click',continueWithoutDouble);
    ui.querySelector('#cont-x2')?.addEventListener('click',()=>openAd('double'));
    ui.querySelector('#ad-lives')?.addEventListener('click',()=>{ if(adUses>=3) return; openAd('lives');});
    ui.querySelector('#restart')?.addEventListener('click',()=>startGame(1));
    ui.querySelector('#rw-claim')?.addEventListener('click',claimReward);
    ui.querySelectorAll('[data-buy]')?.forEach(b=>b.addEventListener('click',()=>buySub(b.getAttribute('data-buy'))));
  }

  function openPause(){if(state!=='playing')return;pauseBeforeState='playing';state='paused';renderUI();}
  function closePause(){if(state==='paused'){state=pauseBeforeState||'playing';pauseBeforeState=null;renderUI();}}
  function goToMenu(){state='menu';pauseBeforeState=null;ad.type=null;renderUI();}
  function continueWithoutDouble(){
    if(state!=='levelup') return;
    setCoins(getCoins()+tempCoins);
    maxLevel=Math.max(maxLevel,game.level+1);localStorage.setItem('wasa_max_level',maxLevel);
    ranking.push({name:'Jugador',score:game.points,level:game.level});ranking.sort((a,b)=>b.score-a.score);ranking=ranking.slice(0,10);localStorage.setItem('wasa_ranking_final',JSON.stringify(ranking));
    game.level+=1;game.misses=0;game.bullets=[];game.power.state='moving';game.power.v=20;initShips(game.level);game.levelStart=performance.now();state='playing';renderUI();
  }
  function continueFromCheckpoint(){
    if(maxLevel<=1){startGame(1);return;}
    if(getCoins()>=100){
      if(confirm(`Continuar desde nivel ${maxLevel} cuesta 100 monedas o ver anuncio. ¿Pagar 100 monedas?`)){
        setCoins(getCoins()-100);
        startGame(maxLevel);renderUI();
      }else{openAd('checkpoint');}
    }else{openAd('checkpoint');}
  }
  let buyingLock=false;
  function buySub(id){
    if(buyingLock) return;
    const cur=ups[id];if(cur.main>=50)return;const cost=cur.main+1;if(getCoins()<cost)return;
    buyingLock=true;
    setCoins(getCoins()-cost);
    cur.sub+=1;
    ups[id]=cur;
    localStorage.setItem('wasa_upgrades_final',JSON.stringify(ups));
    renderUI();
    if(cur.sub>=5){
      setTimeout(()=>{
        cur.main+=1;cur.sub=0;
        ups[id]=cur;
        localStorage.setItem('wasa_upgrades_final',JSON.stringify(ups));
        buyingLock=false;
        renderUI();
      },550);
    }else{buyingLock=false;}
  }
  function openAd(type){
    if(window.vrAd!==0) return;
    console.log('[GAME] vrAd=1 pedido',type);
    _pendingAdType=type;
    _rewardPending=type;
    window.vrAdType=type;
    window.vrAd=1;
    pauseBeforeState=state;
    state='paused';
    renderUI();
  }
  function claimReward(){
    const type=_rewardPending;
    console.log('[GAME] CLAIM 1 CLICK',type);
    _rewardPending=null; _pendingAdType=null;
    window.vrAd=0; window.vrAdType=null; window._gm_shown=false;
    var gv=document.getElementById('gmVideo'); if(gv){gv.classList.remove('active');gv.style.display='none';gv.innerHTML='';}
    if(type==='lives'){game.misses=Math.max(0,game.misses-3);game.bullets=[];game.power.state='moving';game.power.v=50;game.power.dir=1;adUses++;state='playing';}
    else if(type==='double'){setCoins(getCoins()+tempCoins); game.points+=tempPoints; maxLevel=Math.max(maxLevel,game.level+1); localStorage.setItem('wasa_max_level',maxLevel); ranking.push({name:'Jugador',score:game.points,level:game.level});ranking.sort((a,b)=>b.score-a.score);ranking=ranking.slice(0,10);localStorage.setItem('wasa_ranking_final',JSON.stringify(ranking)); game.level+=1;game.misses=0;game.bullets=[];game.power.state='moving';game.power.v=20;initShips(game.level);game.levelStart=performance.now();state='playing';}
    else if(type==='checkpoint'){startGame(maxLevel);}
    renderUI();
  }
  function togglePower(){if(state!=='playing')return;if(game.power.state==='moving'){game.power.state='locked';game.power.locked=Math.round(game.power.v);}else{game.power.state='moving';game.power.dir=game.power.locked>=50?-1:1;}renderUI();}
  function handleShoot(){
    if(state!=='playing')return;
    if(game.power.state==='moving'){game.power.state='locked';game.power.locked=Math.round(game.power.v);renderUI();return;}
    if(game.bullets.length>0)return;
    const vel=260+game.power.locked*5.2+(game.level-1)*2;
    const cx=W/2,cy=H-88,tx=game.cross.x,ty=game.cross.y,dy=cy-ty,time=Math.max(dy/vel,0.18),vx=(tx-cx)/time,vy=-vel;
    game.bullets.push({x:cx,y:cy,vx,vy,trail:[]});
    game.power.state='moving'; game.power.dir=game.power.locked>=50?-1:1; renderUI();
  }

  let watcher=setInterval(()=>{ if(window.vrAd===4 && _rewardPending && state!=='reward_modal'){ var gv=document.getElementById('gmVideo'); if(gv){gv.classList.remove('active');gv.style.display='none';gv.innerHTML='';} state='reward_modal'; renderUI(); } },150);

  let raf; function loop(now){
    if(window.vrAd===1||window.vrAd===2||window.vrAd===3){ raf=requestAnimationFrame(loop); return; }
    const dt=Math.min((now-last)/1000,0.033); last=now;
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
      if(game.power.state==='moving'){game.power.v+=game.power.dir*game.power.speed*dt; if(game.power.v>=100){game.power.v=100;game.power.dir=-1;} if(game.power.v<=0){game.power.v=0;game.power.dir=1;}} else {game.power.v=game.power.locked;}
      for(let i=game.bullets.length-1;i>=0;i--){
        const b=game.bullets[i]; b.trail.push({x:b.x,y:b.y}); if(b.trail.length>8)b.trail.shift(); b.x+=b.vx*dt; b.y+=b.vy*dt;
        let hit=false;
        for(let sIdx=game.ships.length-1;sIdx>=0;sIdx--){
          const sh=game.ships[sIdx];
          if(Math.abs(b.y-sh.y)<28&&Math.abs(b.x-sh.x)<sh.w*0.5){
            const dmg=50+ups.d.main; sh.hp-=dmg; sh.hitFlash=1;
            for(let k=0;k<12;k++){const ang=Math.random()*Math.PI*2,sp=Math.random()*120+40;game.parts.push({x:sh.x,y:sh.y,vx:Math.cos(ang)*sp+sh.dir*20,vy:Math.sin(ang)*sp,life:1,size:Math.random()*2+1,color:Math.random()>0.5?"#ffde59":"#ff8a4d"});}
            game.bullets.splice(i,1); game.power.state='moving'; game.power.dir=game.power.locked>=50?-1:1; hit=true;
            if(sh.hp<=0){
              game.ships.splice(sIdx,1);
              for(let k=0;k<24;k++){const ang=Math.random()*Math.PI*2,sp=Math.random()*260+40;game.parts.push({x:sh.x,y:sh.y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,life:1,size:Math.random()*4+2,color:`hsl(${40+Math.random()*30},100%,60%)`});}
              if(game.ships.length===0){
                const elapsed=(performance.now()-game.levelStart)/1000;
                tempPoints=100*game.level; const base=(20+game.level*5)/15; let mult=elapsed<10?2:elapsed<20?1.75:elapsed<30?1.5:1; tempCoins=Math.round(base*mult);
                game.lastTime=elapsed; game.lastMult=mult;
                game.points+=tempPoints; levelUpInfo={level:game.level+1,points:game.points}; state='levelup'; renderUI();
                setTimeout(()=>{if(state==='levelup'){continueWithoutDouble();}},5000);
              }
            }
            break;
          }
        }
        if(hit) continue;
        if(b.y<-30||b.x<-30||b.x>W+30){game.bullets.splice(i,1);game.misses++;game.power.state='moving'; game.power.dir=game.power.locked>=50?-1:1; if(game.misses>=5){state='gameover';renderUI();}}
      }
    }
    for(let i=game.parts.length-1;i>=0;i--){const p=game.parts[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=0.98;p.vy+=80*dt;p.life-=dt*0.9;if(p.life<=0)game.parts.splice(i,1);}
    const grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,"#21418f");grad.addColorStop(1,"#5e80e1");ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
    for(const s of game.stars){const a=0.5+Math.sin(Date.now()*0.001*s.tw+s.off)*0.5;ctx.fillStyle=`rgba(255,255,255,${0.3+a*0.7})`;ctx.beginPath();ctx.arc(s.x,s.y,s.size*(0.7+a*0.6),0,Math.PI*2);ctx.fill();}
    const vign=ctx.createRadialGradient(W/2,H*0.35,H*0.2,W/2,H*0.35,H);vign.addColorStop(0,"rgba(0,0,0,0)");vign.addColorStop(1,"rgba(0,0,0,0.35)");ctx.fillStyle=vign;ctx.fillRect(0,0,W,H);
    for(let sh of game.ships) drawShip(sh);
    if(state==='playing'||state==='levelup'){
      for(const b of game.bullets){for(let j=0;j<b.trail.length;j++){const t=b.trail[j],a=j/b.trail.length;ctx.fillStyle=`rgba(255,222,89,${a*0.6})`;ctx.beginPath();ctx.arc(t.x,t.y,2+a*2,0,Math.PI*2);ctx.fill();}ctx.shadowColor="#ffde59";ctx.shadowBlur=12;ctx.fillStyle="#fffe8a";ctx.beginPath();ctx.arc(b.x,b.y,5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
      for(const p of game.parts){ctx.globalAlpha=p.life;ctx.fillStyle=p.color;ctx.shadowColor=p.color;ctx.shadowBlur=6;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.globalAlpha=1;}
      if(state==='playing') drawCross(game.cross.x,game.cross.y,game.power.state==='locked',Date.now());
      const cx=W/2,cy=H-100;ctx.save();ctx.translate(cx,cy);ctx.shadowColor="#ffde59";ctx.shadowBlur=16;ctx.fillStyle="#1a2a5a";ctx.beginPath();ctx.ellipse(0,0,26,10,0,0,Math.PI*2);ctx.fill();if(state==='playing'){const ang=Math.atan2(game.cross.y-cy,game.cross.x-cx);ctx.rotate(ang);ctx.fillStyle="#e6e8ff";ctx.fillRect(0,-5,36,10);ctx.fillStyle="#ffde59";ctx.fillRect(32,-3,10,6);}ctx.restore();
    }
    if(state==='playing'){
      const pl=document.getElementById('power-label'); const pf=document.getElementById('power-fill'); const pln=document.getElementById('power-line'); const potVal=document.getElementById('pot-val'); const dmgVal=document.getElementById('dmg-val'); const ehVal=document.getElementById('enemy-hp-val');
      if(pl) pl.textContent=game.power.state==='locked'?`POTENCIA • BLOQ ${Math.round(game.power.locked)}%`:`POTENCIA ${Math.round(game.power.v)}%`;
      if(pf) pf.style.height=(game.power.state==='locked'?game.power.locked:game.power.v)+'%';
      if(pln) pln.style.bottom=(game.power.state==='locked'?game.power.locked:game.power.v)+'%';
      if(potVal) potVal.textContent=Math.round(game.power.state==='locked'?game.power.locked:game.power.v)+'%';
      if(dmgVal) dmgVal.textContent=(50+ups.d.main)+' DMG';
      if(ehVal && game.ships.length>0) ehVal.textContent=game.ships[0].hp+'/'+game.ships[0].maxHp;
    }
    raf=requestAnimationFrame(loop);
  }
  renderUI(); initShips(1); raf=requestAnimationFrame(loop);
  canvas.addEventListener('pointerdown',e=>{if(e.target.closest('button')) return; if(state==='playing') handleShoot();});
  container._cleanup=()=>{cancelAnimationFrame(raf);clearInterval(watcher);ro.disconnect(); window.vrAd=0; window.vrAdType=null;};
}
