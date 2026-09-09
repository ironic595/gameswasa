// /games/ahorcado/game.js - AHORCADO BILINGUE + WASA SECURE (como Banatron)
export function init(container, args){
  const WORKER_URL = window.WASA_CONFIG?.WORKER_URL || 'https://games-wasa-worker.javimsites.workers.dev/';
  const getDeviceId = () => window.getDeviceId? window.getDeviceId() : localStorage.getItem('wasa_device_id');
  const getCoins = args.getCoins || (()=>parseFloat(localStorage.getItem('wasa_coins')||'0'));

  const DICT = {
    es: {
      animales: ['PERRO','GATO','ELEFANTE','JIRAFA','TIGRE','DELFIN','AGUILA','COCODRILO','PINGUINO','CANGURO','LEOPARDO','ZORRO','LOBO','OSO','MONO','SERPIENTE'],
      comida: ['PIZZA','HAMBURGUESA','PAELLA','TACOS','SUSHI','EMPANADA','ASADO','CEVICHE','AREPA','PASTEL','HELADO','CHOCOLATE','PANQUEQUE','TORTILLA','QUESO'],
      tecnologia: ['COMPUTADORA','TELEFONO','INTERNET','SOFTWARE','ALGORITMO','SERVIDOR','CRIPTO','BLOCKCHAIN','TECLADO','PANTALLA','BATERIA','SATELITE','ROUTER'],
      facil: ['CASA','ARBOL','SOL','LUNA','AGUA','FUEGO','LIBRO','MESA','SILLA','PUERTA','VENTANA','CALLE','CIUDAD','MUNDO','TIEMPO','AMIGO']
    },
    en: {
      animals: ['DOG','CAT','ELEPHANT','GIRAFFE','TIGER','DOLPHIN','EAGLE','CROCODILE','PENGUIN','KANGAROO','LEOPARD','FOX','WOLF','BEAR','MONKEY','SNAKE'],
      food: ['PIZZA','BURGER','PAELLA','TACOS','SUSHI','STEAK','SALAD','CHOCOLATE','PANCAKE','COOKIE','SANDWICH','NOODLES','CHEESE','BREAD','APPLE'],
      tech: ['COMPUTER','PHONE','INTERNET','SOFTWARE','ALGORITHM','SERVER','CRYPTO','BLOCKCHAIN','KEYBOARD','SCREEN','BATTERY','SATELLITE','ROUTER'],
      easy: ['HOUSE','TREE','SUN','MOON','WATER','FIRE','BOOK','TABLE','CHAIR','DOOR','WINDOW','STREET','CITY','WORLD','TIME','FRIEND']
    }
  };

  const I18N = {
    es: { title:'AHORCADO', subtitle:'ADIVINA LA PALABRA', lives:'Vidas', win:'¡GANASTE!', lose:'PERDISTE', wordWas:'La palabra era', play:'JUGAR', claim:'COBRAR', double:'x2 CON AD', hint:'PISTA -5s', extra:'+ VIDA CON AD', secure:'SECURE', time:'Tiempo', reward:'Recompensa' },
    en: { title:'HANGMAN', subtitle:'GUESS THE WORD', lives:'Lives', win:'YOU WIN!', lose:'GAME OVER', wordWas:'The word was', play:'PLAY', claim:'CLAIM', double:'x2 WITH AD', hint:'HINT -5s', extra:'+ LIFE WITH AD', secure:'SECURE', time:'Time', reward:'Reward' }
  };

  let lang = localStorage.getItem('wasa_ahorcado_lang') || 'es';
  let category = lang==='es'?'facil':'easy';
  let t = I18N[lang];

  container.innerHTML = `
  <style>
   .ah{width:100%;height:100%;background:radial-gradient(ellipse at 50% 0%, rgba(99,102,241,.2), transparent 60%), #020617;color:#e2e8f0;font-family:Inter,system-ui,sans-serif;display:flex;flex-direction:column;position:relative;overflow:hidden}
   .ah-top{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-bottom:1px solid rgba(99,102,241,.2);background:rgba(15,23,42,.8)}
   .ah-lang{display:flex;gap:6px}.ah-lang button{padding:6px 12px;border-radius:999px;font-size:11px;font-weight:800;border:1px solid rgba(99,102,241,.3);background:rgba(255,255,255,.05);color:#94a3b8}
   .ah-lang button.active{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border-color:transparent}
   .ah-main{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px;gap:12px;overflow:auto}
   .ah-word{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;min-height:42px}
   .ah-letter{width:36px;height:42px;border-bottom:3px solid #334155;display:grid;place-items:center;font-weight:900;font-size:22px;color:white;background:rgba(255,255,255,.04);border-radius:6px 6px 0 0}
   .ah-letter.revealed{border-color:#22c55e;color:#86efac;background:rgba(34,197,94,.15)}
   .ah-hang{width:160px;height:160px;position:relative}
   .ah-kb{display:grid;grid-template-columns:repeat(9,1fr);gap:5px;max-width:520px;width:100%;padding:8px}
   .ah-kb button{height:40px;border-radius:8px;background:#1e293b;border:1px solid rgba(255,255,255,.08);color:white;font-weight:800;font-size:14px}
   .ah-kb button.used{opacity:.3;pointer-events:none}
   .ah-kb button.ok{background:rgba(34,197,94,.2);border-color:#22c55e;color:#86efac}
   .ah-kb button.bad{background:rgba(239,68,68,.2);border-color:#ef4444;color:#fca5a5}
   .ah-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
   .ah-btn{padding:10px 18px;border-radius:999px;font-weight:900;font-size:12px;cursor:pointer}
   .ah-btn.primary{background:linear-gradient(135deg,#22c55e,#16a34a);color:black}
   .ah-btn.ghost{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#cbd5e1}
   .ah-btn.ad{background:linear-gradient(135deg,#fbbf24,#f59e0b);color:black}
   .ah-modal{position:absolute;inset:0;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;padding:16px;z-index:10}
   .ah-card{background:#0f172a;border:2px solid #334155;border-radius:16px;padding:16px;max-width:340px;width:100%;text-align:center}
   .ah-card.win{border-color:#22c55e}.ah-card.lose{border-color:#ef4444}
  </style>
  <div class="ah">
    <div class="ah-top">
      <div style="font-size:11px;letter-spacing:.2em;color:#6366f1" id="ah-secure">SECURE</div>
      <div style="display:flex;gap:8px;align-items:center">
        <div id="ah-coins" style="font-size:11px;color:#22c55e;font-weight:800">0 $WASA</div>
        <div class="ah-lang"><button data-lang="es" class="${lang==='es'?'active':''}">ES</button><button data-lang="en" class="${lang==='en'?'active':''}">EN</button></div>
      </div>
    </div>
    <div class="ah-main" id="ah-main"></div>
  </div>`;

  const main=container.querySelector('#ah-main');
  const coinsEl=container.querySelector('#ah-coins');
  const secureEl=container.querySelector('#ah-secure');

  function fmtWASA(n){ const v=parseFloat(n)||0; if(v===0) return '0'; return (Math.round(v*1000000)/1000000).toFixed(6).replace(/0+$/,'').replace(/\.$/,''); }
  function updateCoins(){ coinsEl.textContent=fmtWASA(getCoins())+' $WASA'; }

  let word='', guessed=new Set(), wrong=0, maxWrong=6, round=parseInt(localStorage.getItem('wasa_ahorcado_max')||'1'), roundStart=0, lastElapsed=0, tempCoins=0, currentSessionId=null, isClaiming=false, _rewardPending=null, adClaimedThisRound=false;

  function getCategories(){ return Object.keys(DICT[lang]); }
  function getRandomWord(cat){ const list=DICT[lang][cat]; return list[Math.floor(Math.random()*list.length)]; }
  function getBaseWASA(lvl){ const tier=Math.floor((lvl-1)/10); return 0.005+tier*0.0025; }
  function getTimeMult(e){ if(e<8) return 3; if(e<15) return 2; return 1; }

  async function startSession(lvl){
    currentSessionId=null;
    try{
      const email=localStorage.getItem('wasa_email'), wallet=localStorage.getItem('wasa_wallet'), device_id=getDeviceId();
      const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start_game_session', email, wallet, device_id, game_slug:'ahorcado', level:lvl, lang})});
      const j=await r.json(); if(j.ok) currentSessionId=j.session_id;
    }catch(e){}
  }
  async function claimSession(isDouble, adWatched){
    if(isClaiming) return {ok:false};
    if(!currentSessionId) await startSession(round);
    if(!currentSessionId) return {ok:false};
    isClaiming=true;
    try{
      const email=localStorage.getItem('wasa_email'), wallet=localStorage.getItem('wasa_wallet'), device_id=getDeviceId();
      const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'claim_reward', session_id:currentSessionId, email, wallet, device_id, game_slug:'ahorcado', level:round, ad_watched:adWatched, double_reward:isDouble, time_taken:lastElapsed, lang, word})});
      const j=await r.json();
      if(j.ok){
        const bal=j.wasa_balance??j.guest_balance??0;
        if(j.is_guest) localStorage.setItem('wasa_coins_guest',bal); else localStorage.setItem('wasa_coins',bal);
        if(window.setCoinsUI) window.setCoinsUI(bal);
        updateCoins(); currentSessionId=null; isClaiming=false; return j;
      } else { isClaiming=false; return {ok:false}; }
    }catch(e){ isClaiming=false; return {ok:false}; }
  }

  function openAd(type){ if(window.vrAd!==0) return; _rewardPending=type; window.vrAdType=type; window.vrAd=1; }

  function drawHangman(){
    const parts=[
      wrong>=1?`<line x1="20" y1="140" x2="140" y2="140" stroke="#475569" stroke-width="4"/>`:'',
      wrong>=1?`<line x1="40" y1="140" x2="40" y2="20" stroke="#475569" stroke-width="4"/>`:'',
      wrong>=1?`<line x1="40" y1="20" x2="100" y2="20" stroke="#475569" stroke-width="4"/>`:'',
      wrong>=1?`<line x1="100" y1="20" x2="100" y2="35" stroke="#475569" stroke-width="3"/>`:'',
      wrong>=2?`<circle cx="100" cy="45" r="15" stroke="#f8fafc" stroke-width="3" fill="none"/>`:'',
      wrong>=3?`<line x1="100" y1="60" x2="100" y2="100" stroke="#f8fafc" stroke-width="3"/>`:'',
      wrong>=4?`<line x1="100" y1="70" x2="80" y2="85" stroke="#f8fafc" stroke-width="3"/>`:'',
      wrong>=5?`<line x1="100" y1="70" x2="120" y2="85" stroke="#f8fafc" stroke-width="3"/>`:'',
      wrong>=6?`<line x1="100" y1="100" x2="80" y2="125" stroke="#f8fafc" stroke-width="3"/><line x1="100" y1="100" x2="120" y2="125" stroke="#f8fafc" stroke-width="3"/>`:''
    ].join('');
    return `<div class="ah-hang"><svg viewBox="0 0 160 150">${parts}</svg><div style="position:absolute;bottom:0;left:0;right:0;text-align:center;font-size:10px;color:#94a3b8">${t.lives}: ${maxWrong-wrong}/${maxWrong}</div></div>`;
  }

  function renderMenu(){
    t=I18N[lang];
    main.innerHTML=`<div style="text-align:center"><div style="font-size:10px;letter-spacing:.3em;color:#6366f1">${t.secure} • ${fmtWASA(getBaseWASA(round))} $WASA</div><div style="font-size:42px;font-weight:900;color:white;line-height:.9;margin-top:8px">${t.title}</div><div style="color:#64748b;font-size:12px;margin-top:6px">${category.toUpperCase()} • R${round} • ${fmtWASA(getCoins())} $WASA</div><div style="margin-top:16px;display:flex;flex-direction:column;gap:8px;width:280px"><div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center">${getCategories().map(c=>`<button data-cat="${c}" style="padding:6px 10px;border-radius:999px;background:${c===category?'#6366f1':'rgba(255,255,255,.06)'};color:${c===category?'white':'#94a3b8'};font-size:11px;font-weight:800;text-transform:uppercase">${c}</button>`).join('')}</div><button id="play" class="ah-btn primary" style="margin-top:8px">${t.play} R${round}</button></div></div>`;
    main.querySelector('#play').onclick=()=>startRound();
    main.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{category=b.dataset.cat; renderMenu();});
  }

  function startRound(){ word=getRandomWord(category); guessed=new Set(); wrong=0; roundStart=performance.now(); adClaimedThisRound=false; startSession(round); renderGame(); }

  function renderGame(){
    const display=word.split('').map(l=>{ const ok=guessed.has(l); return `<div class="ah-letter ${ok?'revealed':''}">${ok?l:''}</div>`; }).join('');
    const elapsed=(performance.now()-roundStart)/1000; const mult=getTimeMult(elapsed); const base=getBaseWASA(round);
    main.innerHTML=`<div style="display:flex;justify-content:space-between;width:100%;max-width:520px;font-size:11px;color:#94a3b8;font-family:monospace"><div>R${round} • ${category.toUpperCase()} • ${elapsed.toFixed(1)}s • x${mult}</div><div style="color:#22c55e">${fmtWASA(base)} $WASA</div></div>${drawHangman()}<div class="ah-word">${display}</div><div class="ah-kb" id="kb"></div><div class="ah-actions"><button id="hint" class="ah-btn ghost">${t.hint}</button><button id="life" class="ah-btn ghost">${t.extra}</button></div>`;
    const kb=main.querySelector('#kb');
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(l=>{
      const btn=document.createElement('button'); btn.textContent=l;
      if(guessed.has(l)) btn.classList.add('used');
      if(word.includes(l)&&guessed.has(l)) btn.classList.add('ok');
      if(!word.includes(l)&&guessed.has(l)) btn.classList.add('bad');
      btn.onclick=()=>{ if(guessed.has(l)) return; guessed.add(l); if(!word.includes(l)) wrong++; checkEnd(); renderGame(); };
      kb.appendChild(btn);
    });
    main.querySelector('#hint').onclick=()=>{ const hidden=word.split('').filter(l=>!guessed.has(l)); if(hidden.length>0){ const r=hidden[Math.floor(Math.random()*hidden.length)]; guessed.add(r); roundStart-=5000; checkEnd(); renderGame(); } };
    main.querySelector('#life').onclick=()=>openAd('extra_life');
    secureEl.textContent=t.secure+' • '+fmtWASA(base)+' $WASA';
  }

  function checkEnd(){
    const won=word.split('').every(l=>guessed.has(l));
    if(won){
      lastElapsed=(performance.now()-roundStart)/1000;
      tempCoins=getBaseWASA(round)*getTimeMult(lastElapsed);
      localStorage.setItem('wasa_ahorcado_max', Math.max(round, parseInt(localStorage.getItem('wasa_ahorcado_max')||'1')));
      renderEnd(true);
    } else if(wrong>=maxWrong){ renderEnd(false); }
  }

  function renderEnd(won){
    main.innerHTML+=`<div class="ah-modal"><div class="ah-card ${won?'win':'lose'}"><div style="font-size:12px;letter-spacing:.2em;color:${won?'#22c55e':'#ef4444'}">${won?t.win:t.lose}</div><div style="font-size:20px;font-weight:900;color:white;margin-top:6px">${won?word:''}</div>${!won?`<div style="color:#94a3b8;font-size:11px;margin-top:4px">${t.wordWas}: <b style="color:white">${word}</b></div>`:''}${won?`<div style="margin-top:10px;background:rgba(0,0,0,.3);border-radius:10px;padding:8px;font-size:11px;color:#cbd5e1"><div style="display:flex;justify-content:space-between"><span>Base</span><span>${getBaseWASA(round).toFixed(6)}</span></div><div style="display:flex;justify-content:space-between"><span>${t.time} ${lastElapsed.toFixed(1)}s</span><span>x${getTimeMult(lastElapsed)}</span></div><div style="display:flex;justify-content:space-between;font-weight:800;color:#22c55e;margin-top:4px"><span>${t.reward}</span><span>${fmtWASA(tempCoins)} → ${fmtWASA(tempCoins*2)}</span></div></div><div style="margin-top:12px;display:flex;flex-direction:column;gap:8px">${!adClaimedThisRound?`<button id="dbl" class="ah-btn ad">${t.double} (${fmtWASA(tempCoins*2)})</button>`:''}<button id="next" class="ah-btn primary">${t.claim} ${fmtWASA(tempCoins)}</button></div>`:`<div style="margin-top:12px;display:flex;gap:8px"><button id="retry" class="ah-btn ghost" style="flex:1">REINTENTAR</button><button id="menu" class="ah-btn primary" style="flex:1">MENU</button></div>`}</div></div>`;
    if(won){
      main.querySelector('#dbl')?.addEventListener('click',()=>openAd('double'));
      main.querySelector('#next').onclick=async()=>{ const btn=main.querySelector('#next'); btn.textContent='⏳ VALIDANDO...'; btn.disabled=true; const res=await claimSession(false,false); if(res.ok){ round++; renderMenu(); startRound(); } else { btn.textContent='REINTENTAR'; btn.disabled=false; } };
    } else {
      main.querySelector('#retry').onclick=()=>startRound();
      main.querySelector('#menu').onclick=()=>renderMenu();
    }
  }

  container.querySelectorAll('[data-lang]').forEach(b=>{
    b.onclick=()=>{ lang=b.dataset.lang; localStorage.setItem('wasa_ahorcado_lang',lang); category=lang==='es'?'facil':'easy'; container.querySelectorAll('[data-lang]').forEach(x=>x.classList.toggle('active',x.dataset.lang===lang)); renderMenu(); };
  });

  let watcher=setInterval(()=>{ if(window.vrAd===4 && _rewardPending){ const tp=_rewardPending; _rewardPending=null; window.vrAd=0; window.vrAdType=null; if(tp==='double'){ adClaimedThisRound=true; claimSession(true,true).then(res=>{ if(res.ok){ round++; renderMenu(); startRound(); } }); } if(tp==='extra_life'){ if(wrong>0) wrong--; renderGame(); } } },150);

  updateCoins(); renderMenu();
  container._cleanup=()=>{ clearInterval(watcher); window.vrAd=0; };
}
