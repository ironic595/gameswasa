// /games/ahorcado/game.js - FIX: sin marco doble + fix modal ganaste
export function init(container, args){
  const WORKER_URL = window.WASA_CONFIG?.WORKER_URL || 'https://games-wasa-worker.javimsites.workers.dev/';
  const getDeviceId = () => window.getDeviceId? window.getDeviceId() : localStorage.getItem('wasa_device_id');
  const getCoins = args.getCoins || (()=>parseFloat(localStorage.getItem('wasa_coins')||'0'));

  const DICT = {
    es: {
      animales: ['PERRO','GATO','ELEFANTE','JIRAFA','TIGRE','DELFIN','AGUILA','COCODRILO','PINGUINO','CANGURO','LEOPARDO','ZORRO','LOBO','OSO','MONO'],
      comida: ['PIZZA','HAMBURGUESA','PAELLA','TACOS','SUSHI','EMPANADA','ASADO','CEVICHE','AREPA','PASTEL','HELADO','CHOCOLATE','PANQUEQUE','TORTILLA'],
      tecnologia: ['COMPUTADORA','TELEFONO','INTERNET','SOFTWARE','ALGORITMO','SERVIDOR','CRIPTO','BLOCKCHAIN','TECLADO','PANTALLA','BATERIA','SATELITE'],
      facil: ['CASA','ARBOL','SOL','LUNA','AGUA','FUEGO','LIBRO','MESA','SILLA','PUERTA','VENTANA','CALLE','CIUDAD','MUNDO','TIEMPO']
    },
    en: {
      animals: ['DOG','CAT','ELEPHANT','GIRAFFE','TIGER','DOLPHIN','EAGLE','CROCODILE','PENGUIN','KANGAROO','LEOPARD','FOX','WOLF','BEAR','MONKEY'],
      food: ['PIZZA','BURGER','PAELLA','TACOS','SUSHI','STEAK','SALAD','CHOCOLATE','PANCAKE','COOKIE','SANDWICH','NOODLES','CHEESE','BREAD'],
      tech: ['COMPUTER','PHONE','INTERNET','SOFTWARE','ALGORITHM','SERVER','CRYPTO','BLOCKCHAIN','KEYBOARD','SCREEN','BATTERY','SATELLITE'],
      easy: ['HOUSE','TREE','SUN','MOON','WATER','FIRE','BOOK','TABLE','CHAIR','DOOR','WINDOW','STREET','CITY','WORLD','TIME']
    }
  };

  const I18N = {
    es: { win:'¡GANASTE!', lose:'PERDISTE', wordWas:'La palabra era', claim:'COBRAR', double:'x2 CON AD', hint:'PISTA -5s', extra:'+ VIDA CON AD', lives:'Vidas', time:'Tiempo', reward:'Recompensa', next:'SIGUIENTE' },
    en: { win:'YOU WIN!', lose:'GAME OVER', wordWas:'The word was', claim:'CLAIM', double:'x2 WITH AD', hint:'HINT -5s', extra:'+ LIFE WITH AD', lives:'Lives', time:'Time', reward:'Reward', next:'NEXT' }
  };

  let lang = localStorage.getItem('wasa_ahorcado_lang') || 'es';
  let category = lang==='es'?'facil':'easy';
  let t = I18N[lang];

  // FIX 1: Sin .ah-top, usamos el modal de afuera
  container.innerHTML = `
  <style>
   .ah{width:100%;height:100%;background:#020617;color:#e2e8f0;font-family:Inter,system-ui,sans-serif;display:flex;flex-direction:column;position:relative;overflow:hidden;align-items:center;justify-content:center;padding:12px;gap:12px}
   .ah-word{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;min-height:42px}
   .ah-letter{width:36px;height:42px;border-bottom:3px solid #334155;display:grid;place-items:center;font-weight:900;font-size:22px;color:white;background:rgba(255,255,255,.04);border-radius:6px 6px 0 0}
   .ah-letter.revealed{border-color:#22c55e;color:#86efac;background:rgba(34,197,94,.15)}
   .ah-hang{width:160px;height:160px;position:relative}
   .ah-kb{display:grid;grid-template-columns:repeat(9,1fr);gap:5px;max-width:520px;width:100%;padding:8px}
   .ah-kb button{height:40px;border-radius:8px;background:#1e293b;border:1px solid rgba(255,255,255,.08);color:white;font-weight:800;font-size:14px;cursor:pointer}
   .ah-kb button.used{opacity:.3;pointer-events:none}
   .ah-kb button.ok{background:rgba(34,197,94,.2);border-color:#22c55e;color:#86efac}
   .ah-kb button.bad{background:rgba(239,68,68,.2);border-color:#ef4444;color:#fca5a5}
   .ah-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
   .ah-btn{padding:10px 18px;border-radius:999px;font-weight:900;font-size:12px;cursor:pointer}
   .ah-btn.primary{background:linear-gradient(135deg,#22c55e,#16a34a);color:black}
   .ah-btn.ghost{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#cbd5e1}
   .ah-btn.ad{background:linear-gradient(135deg,#fbbf24,#f59e0b);color:black}
   .ah-modal{position:absolute;inset:0;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;padding:16px;z-index:10}
   .ah-card{background:#0f172a;border:2px solid #334155;border-radius:16px;padding:16px;max-width:360px;width:100%;text-align:center}
   .ah-card.win{border-color:#22c55e}.ah-card.lose{border-color:#ef4444}
   .ah-lang-mini{display:flex;gap:6px;margin-bottom:8px}
   .ah-lang-mini button{padding:4px 10px;border-radius:999px;font-size:10px;font-weight:800;background:rgba(255,255,255,.06);color:#94a3b8}
   .ah-lang-mini button.active{background:#6366f1;color:white}
  </style>
  <div class="ah" id="ah-root"></div>`;

  const root = container.querySelector('#ah-root');

  function fmtWASA(n){ const v=parseFloat(n)||0; if(v===0) return '0'; return (Math.round(v*1000000)/1000000).toFixed(6).replace(/0+$/,'').replace(/\.$/,''); }
  let word='', guessed=new Set(), wrong=0, maxWrong=6, round=parseInt(localStorage.getItem('wasa_ahorcado_max')||'1'), roundStart=0, lastElapsed=0, tempCoins=0, currentSessionId=null, isClaiming=false, _rewardPending=null, state='menu';

  function getCategories(){ return Object.keys(DICT[lang]); }
  function getRandomWord(cat){ return DICT[lang][cat][Math.floor(Math.random()*DICT[lang][cat].length)]; }
  function getBaseWASA(lvl){ const tier=Math.floor((lvl-1)/10); return 0.005+tier*0.0025; }
  function getTimeMult(e){ if(e<8) return 3; if(e<15) return 2; return 1; }

  async function startSession(lvl){
    try{
      const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start_game_session', email:localStorage.getItem('wasa_email'), wallet:localStorage.getItem('wasa_wallet'), device_id:getDeviceId(), game_slug:'ahorcado', level:lvl, lang})});
      const j=await r.json(); if(j.ok) currentSessionId=j.session_id;
    }catch(e){}
  }
  async function claimSession(isDouble, adWatched){
    if(isClaiming) return; if(!currentSessionId) await startSession(round); isClaiming=true;
    try{
      const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'claim_reward', session_id:currentSessionId, email:localStorage.getItem('wasa_email'), wallet:localStorage.getItem('wasa_wallet'), device_id:getDeviceId(), game_slug:'ahorcado', level:round, ad_watched:adWatched, double_reward:isDouble, time_taken:lastElapsed})});
      const j=await r.json(); if(j.ok){ const bal=j.wasa_balance??j.guest_balance??0; if(j.is_guest) localStorage.setItem('wasa_coins_guest',bal); else localStorage.setItem('wasa_coins',bal); if(window.setCoinsUI) window.setCoinsUI(bal); } 
    }catch(e){} finally{ isClaiming=false; }
  }
  function openAd(type){ if(window.vrAd!==0) return; _rewardPending=type; window.vrAdType=type; window.vrAd=1; }

  function drawHangman(){
    const p=[wrong>=1?`<line x1="20" y1="140" x2="140" y2="140" stroke="#475569" stroke-width="4"/>`:'',wrong>=1?`<line x1="40" y1="140" x2="40" y2="20" stroke="#475569" stroke-width="4"/>`:'',wrong>=1?`<line x1="40" y1="20" x2="100" y2="20" stroke="#475569" stroke-width="4"/>`:'',wrong>=1?`<line x1="100" y1="20" x2="100" y2="35" stroke="#475569" stroke-width="3"/>`:'',wrong>=2?`<circle cx="100" cy="45" r="15" stroke="#f8fafc" stroke-width="3" fill="none"/>`:'',wrong>=3?`<line x1="100" y1="60" x2="100" y2="100" stroke="#f8fafc" stroke-width="3"/>`:'',wrong>=4?`<line x1="100" y1="70" x2="80" y2="85" stroke="#f8fafc" stroke-width="3"/>`:'',wrong>=5?`<line x1="100" y1="70" x2="120" y2="85" stroke="#f8fafc" stroke-width="3"/>`:'',wrong>=6?`<line x1="100" y1="100" x2="80" y2="125" stroke="#f8fafc" stroke-width="3"/><line x1="100" y1="100" x2="120" y2="125" stroke="#f8fafc" stroke-width="3"/>`:''].join('');
    return `<div class="ah-hang"><svg viewBox="0 0 160 150">${p}</svg><div style="text-align:center;font-size:10px;color:#94a3b8">${t.lives}: ${maxWrong-wrong}/${maxWrong}</div></div>`;
  }

  function renderMenu(){
    t=I18N[lang]; root.innerHTML=`<div style="text-align:center"><div style="font-size:42px;font-weight:900;color:white">${t.win==='¡GANASTE!'?'AHORCADO':'HANGMAN'}</div><div style="color:#64748b;font-size:12px">R${round} • ${category.toUpperCase()}</div><div class="ah-lang-mini" style="justify-content:center;margin-top:12px"><button data-lang="es" class="${lang==='es'?'active':''}">ES</button><button data-lang="en" class="${lang==='en'?'active':''}">EN</button></div><div style="margin-top:12px;display:flex;gap:6px;flex-wrap:wrap;justify-content:center;max-width:320px">${getCategories().map(c=>`<button data-cat="${c}" style="padding:6px 10px;border-radius:999px;background:${c===category?'#6366f1':'rgba(255,255,255,.06)'};color:${c===category?'white':'#94a3b8'};font-size:11px;font-weight:800;text-transform:uppercase">${c}</button>`).join('')}</div><button id="play" class="ah-btn primary" style="margin-top:16px">JUGAR R${round} - ${fmtWASA(getBaseWASA(round))} $WASA</button></div>`;
    root.querySelector('#play').onclick=()=>startRound();
    root.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{category=b.dataset.cat; renderMenu();});
    root.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>{lang=b.dataset.lang; localStorage.setItem('wasa_ahorcado_lang',lang); category=lang==='es'?'facil':'easy'; renderMenu();});
  }

  function startRound(){ word=getRandomWord(category); guessed=new Set(); wrong=0; roundStart=performance.now(); state='playing'; startSession(round); renderGame(); }

  function renderGame(){
    if(state!=='playing') return;
    const display=word.split('').map(l=>`<div class="ah-letter ${guessed.has(l)?'revealed':''}">${guessed.has(l)?l:''}</div>`).join('');
    const elapsed=(performance.now()-roundStart)/1000; const base=getBaseWASA(round);
    root.innerHTML=`<div style="font-size:11px;color:#94a3b8;font-family:monospace">R${round} • ${category.toUpperCase()} • ${elapsed.toFixed(1)}s • x${getTimeMult(elapsed)} • ${fmtWASA(base)} $WASA</div>${drawHangman()}<div class="ah-word">${display}</div><div class="ah-kb" id="kb"></div><div class="ah-actions"><button id="hint" class="ah-btn ghost">${t.hint}</button><button id="life" class="ah-btn ghost">${t.extra}</button></div>`;
    const kb=root.querySelector('#kb');
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(l=>{
      const btn=document.createElement('button'); btn.textContent=l;
      if(guessed.has(l)) btn.classList.add('used');
      if(word.includes(l)&&guessed.has(l)) btn.classList.add('ok');
      if(!word.includes(l)&&guessed.has(l)) btn.classList.add('bad');
      btn.onclick=()=>{
        if(state!=='playing' || guessed.has(l)) return;
        guessed.add(l); if(!word.includes(l)) wrong++;
        if(checkEnd()) return; // FIX 2: si terminó, no re-renderizar
        renderGame();
      };
      kb.appendChild(btn);
    });
    root.querySelector('#hint').onclick=()=>{ const h=word.split('').filter(l=>!guessed.has(l)); if(h.length){ guessed.add(h[Math.floor(Math.random()*h.length)]); roundStart-=5000; if(!checkEnd()) renderGame(); } };
    root.querySelector('#life').onclick=()=>openAd('extra_life');
  }

  function checkEnd(){
    const won=word.split('').every(l=>guessed.has(l));
    if(won){ lastElapsed=(performance.now()-roundStart)/1000; tempCoins=getBaseWASA(round)*getTimeMult(lastElapsed); state='won'; renderEnd(true); return true; }
    if(wrong>=maxWrong){ state='lost'; renderEnd(false); return true; }
    return false;
  }

  function renderEnd(won){
    const overlay=document.createElement('div'); overlay.className='ah-modal';
    overlay.innerHTML=`<div class="ah-card ${won?'win':'lose'}"><div style="font-size:12px;letter-spacing:.2em;color:${won?'#22c55e':'#ef4444'}">${won?t.win:t.lose}</div><div style="font-size:20px;font-weight:900;color:white;margin-top:6px">${won?word:''}</div>${!won?`<div style="color:#94a3b8;font-size:11px;margin-top:4px">${t.wordWas}: <b style="color:white">${word}</b></div>`:''}${won?`<div style="margin-top:10px;background:rgba(0,0,0,.3);border-radius:10px;padding:8px;font-size:11px"><div style="display:flex;justify-content:space-between"><span>${t.time} ${lastElapsed.toFixed(1)}s</span><span>x${getTimeMult(lastElapsed)}</span></div><div style="display:flex;justify-content:space-between;font-weight:800;color:#22c55e;margin-top:4px"><span>${t.reward}</span><span>${fmtWASA(tempCoins)} → ${fmtWASA(tempCoins*2)}</span></div></div><div style="margin-top:12px;display:flex;flex-direction:column;gap:8px"><button id="dbl" class="ah-btn ad">${t.double} (${fmtWASA(tempCoins*2)})</button><button id="next" class="ah-btn primary">${t.claim} ${fmtWASA(tempCoins)} + ${t.next}</button></div>`:`<div style="margin-top:12px;display:flex;gap:8px"><button id="retry" class="ah-btn ghost" style="flex:1">REINTENTAR</button><button id="menu" class="ah-btn primary" style="flex:1">MENU</button></div>`}</div></div>`;
    root.appendChild(overlay);
    if(won){
      overlay.querySelector('#dbl').onclick=()=>openAd('double');
      overlay.querySelector('#next').onclick=async(e)=>{ const b=e.target; b.textContent='⏳ VALIDANDO...'; b.disabled=true; await claimSession(false,false); round++; renderMenu(); startRound(); };
    } else {
      overlay.querySelector('#retry').onclick=()=>{ startRound(); };
      overlay.querySelector('#menu').onclick=()=>{ renderMenu(); };
    }
  }

  let watcher=setInterval(()=>{ if(window.vrAd===4 && _rewardPending){ const tp=_rewardPending; _rewardPending=null; window.vrAd=0; if(tp==='double'){ claimSession(true,true).then(()=>{ round++; renderMenu(); startRound(); }); } if(tp==='extra_life'){ if(wrong>0) wrong--; if(state!=='playing') state='playing'; renderGame(); } } },150);

  renderMenu();
  container._cleanup=()=>{ clearInterval(watcher); window.vrAd=0; };
}
