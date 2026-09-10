// games/ahorcado/game.js - v18 ECONOMY 0,001 por palabra + X2 ad = 0,002 - SECURE like banatron - QWERTY + MOSTAZA/NOCHE + centrado
export function init(container, args){
  const WORKER_URL = window.WASA_CONFIG?.WORKER_URL || 'https://games-wasa-worker.javimsites.workers.dev/';
  function getDeviceId(){ if(window.getDeviceId) return window.getDeviceId(); let id=localStorage.getItem('wasa_device_id'); if(!id){ id='dev_'+Math.random().toString(36).slice(2)+Date.now().toString(36); localStorage.setItem('wasa_device_id',id);} return id; }
  function fmt(n){ const v=parseFloat(n)||0; if(v===0) return '0'; return (Math.round(v*1000000)/1000000).toFixed(6).replace(/0+$/,'').replace(/\.$/,''); }
  function getCoins(){ return window.getCoins? window.getCoins() : parseFloat(localStorage.getItem('wasa_coins')||'0'); }

  const getW = ()=> window._0x4a2f?.w || window.webpackChunkWasa?.['8f3c2a1b']?.w;
  let vendorW = getW();
  if(!vendorW){
    container.innerHTML='<div style="padding:40px;color:#f87171;text-align:center;font-family:monospace">Falta vendors~app.8f3c2a1b.chunk.js<br>Subilo a /games/ahorcado/</div>'; return;
  }

  container.innerHTML='';
  const style=document.createElement('style');
  style.textContent=`
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=JetBrains+Mono:wght@800&display=swap');
.wasa-ahorcado{width:100%;height:100%;min-height:100%;display:flex;flex-direction:column;font-family:'Space Grotesk';overflow:hidden;position:relative}
.wasa-ahorcado.theme-noche{--bg:#030712;--card:#0f172a;--text:#e2e8f0;--dim:#94a3b8;--special:#38bdf8;--accent:#38bdf8;--accent2:#818cf8;--border:rgba(56,189,248,.15);--key-bg:rgba(15,23,42,.85);--key-border:rgba(56,189,248,.16);background:radial-gradient(ellipse at 20% 10%,rgba(56,189,248,.16),transparent 60%),var(--bg);color:var(--text)}
.wasa-ahorcado.theme-mostaza{--bg:#eab308;--card:#fef9c3;--text:#000;--dim:#422006;--special:#000;--accent:#000;--accent2:#422006;--border:rgba(0,0,0,.18);--key-bg:#fffbeb;--key-border:rgba(0,0,0,.18);background:linear-gradient(180deg,#facc15 0%,#eab308 55%,#ca8a04 100%);color:var(--text)}
.ah-top{flex-shrink:0;display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:rgba(15,23,42,.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);gap:8px;flex-wrap:wrap;z-index:5}
.theme-mostaza.ah-top{background:rgba(0,0,0,.88);color:#facc15}
.ah-pill{border:1px solid var(--border);border-radius:20px;padding:5px 10px;font-size:10px;background:var(--key-bg);cursor:pointer;font-weight:700;color:inherit;white-space:nowrap}
.ah-pill.active{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;border-color:transparent}.theme-mostaza.ah-pill.active{background:#000;color:#facc15}
.ah-pill.yellow{background:rgba(251,191,36,.14);border-color:rgba(251,191,36,.3);color:#fbbf24}.theme-mostaza.ah-pill.yellow{background:#000;color:#facc15;border-color:#000}
.ah-body{flex:1;display:flex;align-items:center;justify-content:center;gap:32px;padding:24px;overflow:auto;width:100%;max-width:1120px;margin:0 auto;box-sizing:border-box;min-height:0}
.ah-left{flex:0 0 300px;width:300px;height:320px;display:grid;place-items:center;background:rgba(0,0,0,.06);border:1px solid var(--border);border-radius:20px}
.theme-noche.ah-left{background:rgba(15,23,42,.4)}
.ah-hangman{width:240px;height:240px}.ah-hangman svg{width:100%;height:100%}
.ah-line{stroke-width:3.2;stroke-linecap:round;fill:none;transition:.6s}.theme-noche.ah-line{stroke:#1e293b}.theme-noche.ah-line.active{stroke:#e2e8f0}.theme-noche.ah-line.body{stroke:#38bdf8}.theme-mostaza.ah-line{stroke:rgba(0,0,0,.25)}.theme-mostaza.ah-line.active{stroke:#000}.theme-mostaza.ah-line.body{stroke:#000}
.ah-line.draw{stroke-dasharray:400;stroke-dashoffset:400;animation:draw.9s forwards}@keyframes draw{to{stroke-dashoffset:0}}@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}@keyframes pop{0%{transform:scale(.4);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}@keyframes glow{0%,100%{box-shadow:0 0 20px rgba(251,191,36,.3)}50%{box-shadow:0 0 36px rgba(251,191,36,.5)}}
.ah-right{flex:1;max-width:560px;min-width:0;display:flex;flex-direction:column;gap:14px}
.ah-word{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-start;min-height:56px}
.ah-letter{width:42px;height:52px;display:grid;place-items:center;font-family:'JetBrains Mono';font-size:20px;font-weight:800;border-radius:10px;border:1px solid var(--key-border);border-bottom-width:3px;background:var(--card);transition:.4s}
.ah-letter.revealed{animation:pop.45s;border-color:var(--accent)}.theme-noche.ah-letter.revealed{background:rgba(56,189,248,.18);color:#f8fafc}.theme-mostaza.ah-letter.revealed{background:#000;color:#facc15}
.ah-stats{display:flex;gap:8px}.ah-stat{flex:1;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:10px 12px}.ah-stat b{font-family:'JetBrains Mono';font-size:16px;display:block}.ah-stat span{font-size:9px;opacity:.7;text-transform:uppercase}
.ah-qwerty{display:flex;flex-direction:column;gap:6px;align-items:center;width:100%}.ah-qrow{display:flex;gap:5px;justify-content:center;width:100%}
.ah-key{height:42px;flex:1;max-width:46px;border-radius:11px;background:var(--key-bg);border:1px solid var(--key-border);font-weight:800;cursor:pointer;color:inherit;transition:.2s;font-size:13px;display:grid;place-items:center}
.ah-key:hover:not(:disabled){transform:translateY(-2px)}.ah-key:disabled{opacity:.28}.ah-key.ok{background:linear-gradient(135deg,#22c55e,#16a34a)!important;color:#fff!important;opacity:1}.ah-key.bad{background:linear-gradient(135deg,#ef4444,#dc2626)!important;color:#fff!important;animation:shake.4s;opacity:1}
.ah-actions{display:flex;gap:8px}.ah-btn{flex:1;padding:12px;border-radius:14px;font-weight:800;font-size:11px;text-transform:uppercase;cursor:pointer;border:1px solid var(--border);background:var(--card);color:inherit}.ah-btn.primary{background:linear-gradient(135deg,#38bdf8,#818cf8);color:#0f172a;border-color:transparent}.theme-mostaza.ah-btn.primary{background:#000;color:#facc15}
@media(max-width:900px){.ah-body{flex-direction:column;align-items:stretch;justify-content:flex-start;gap:16px;padding:12px;max-width:100%}.ah-left{flex:0 0 200px;width:100%;height:200px;max-width:100%}.ah-hangman{width:180px;height:180px}.ah-right{max-width:100%}.ah-letter{width:36px;height:46px;font-size:18px}.ah-key{height:40px;max-width:none;font-size:12px}}
.ah-win{position:absolute;inset:0;background:rgba(3,6,16,.88);backdrop-filter:blur(18px);display:grid;place-items:center;z-index:20;animation:pop.5s}.theme-mostaza.ah-win{background:rgba(202,138,4,.88)}
.ah-win-card{background:linear-gradient(180deg,rgba(15,23,42,.96),rgba(3,6,16,.98));border:1px solid rgba(56,189,248,.26);border-radius:22px;padding:24px;text-align:center;width:min(360px,92vw);box-shadow:0 24px 80px rgba(0,0,0,.6);color:#e2e8f0}
.theme-mostaza.ah-win-card{background:linear-gradient(180deg,#fffbeb,#fef08a);border-color:#000;color:#000}
.ah-win-icon{font-size:42px;animation:float 2.2s infinite}
.ah-win-amount{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;background:linear-gradient(135deg,rgba(34,197,94,.15),rgba(34,197,94,.08));border:1px solid rgba(34,197,94,.3);border-radius:14px;padding:12px 14px;margin:12px 0;font-weight:800;font-size:14px;color:#22c55e}
.theme-mostaza.ah-win-amount{background:rgba(0,0,0,.08);border-color:#000;color:#000}
.ah-win-btn{width:100%;padding:12px;border-radius:14px;font-weight:800;font-size:11px;text-transform:uppercase;cursor:pointer;border:1px solid var(--border);margin-top:8px;transition:.2s}
.ah-win-btn.x2{background:linear-gradient(135deg,#fbbf24,#f59e0b 55%,#d97706);color:#000;box-shadow:0 0 22px rgba(251,191,36,.4);animation:glow 2s infinite}
.ah-win-btn.x2:disabled{opacity:.5;animation:none}
.ah-win-btn.secondary{background:linear-gradient(135deg,#38bdf8,#818cf8);color:#0f172a}.theme-mostaza.ah-win-btn.secondary{background:#000;color:#facc15}
.ah-win-btn.ghost{background:rgba(15,23,42,.7);color:#94a3b8}.theme-mostaza.ah-win-btn.ghost{background:#fffbeb;color:#000;border-color:#000}
.ah-confetti{position:absolute;width:8px;height:8px;border-radius:2px;pointer-events:none;z-index:30}@keyframes confetti{0%{transform:translateY(-20px) rotate(0) scale(1);opacity:1}100%{transform:translateY(700px) rotate(760deg) scale(0);opacity:0}}
  `;
  container.appendChild(style);

  let lang=localStorage.getItem('wasa_lang')||'es';
  let theme=localStorage.getItem('wasa_ahorcado_theme')||'noche';
  let currentCat=Object.keys(vendorW.w).find(k=>k.startsWith(lang+'_'))||Object.keys(vendorW.w)[0];
  let encWord='',plainWord='',guessed=new Set(),fails=0;
  let wins=parseInt(localStorage.getItem('wasa_ahorcado_wins')||'0'),streak=parseInt(localStorage.getItem('wasa_ahorcado_streak')||'0');
  const BASE_REWARD=0.001; // 0,001 por palabra como pediste
  let currentSessionId=null, isClaiming=false, _rewardPending=null, lastBase=BASE_REWARD;

  async function startSession(){ currentSessionId=null; try{ const email=localStorage.getItem('wasa_email'); const wallet=localStorage.getItem('wasa_wallet'); const device_id=getDeviceId(); const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start_game_session', email, wallet, device_id, game_slug:'ahorcado', level:plainWord.length})}); const j=await r.json(); if(j.ok){ currentSessionId=j.session_id; return j.session_id; } }catch(e){} return null; }
  async function claimSession(isDouble,adWatched){
    if(isClaiming) return {ok:false}; if(!currentSessionId) await startSession();
    if(!currentSessionId) return {ok:false, error:'sin sesion'}; isClaiming=true;
    try{ const email=localStorage.getItem('wasa_email'); const wallet=localStorage.getItem('wasa_wallet'); const device_id=getDeviceId();
      const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'claim_reward', session_id:currentSessionId, email, wallet, device_id, game_slug:'ahorcado', level:plainWord.length, ad_watched:adWatched, double_reward:isDouble, time_taken:10})});
      const j=await r.json(); if(j.ok){ const bal=j.wasa_balance??j.guest_balance??0; if(j.is_guest){ localStorage.setItem('wasa_coins_guest',bal); localStorage.setItem('wasa_coins','0'); } else{ localStorage.setItem('wasa_coins',bal);} if(typeof window.setCoinsUI==='function') window.setCoinsUI(bal); currentSessionId=null; isClaiming=false; return j; } else{ isClaiming=false; return {ok:false, error:j.error}; }
    }catch(e){ isClaiming=false; return {ok:false}; }
  }
  function openAd(type){ if(window.vrAd!==0) return; _rewardPending=type; window.vrAdType=type; window.vrAd=1; }

  const root=document.createElement('div'); root.className='wasa-ahorcado theme-'+theme;
  root.innerHTML=`
    <div class="ah-top">
      <div style="font-weight:800;font-size:11px;letter-spacing:.12em">🪢 AHORCADO • 0,001 por palabra + X2 AD • SECURE</div>
      <div style="display:flex;gap:5px;flex-wrap:wrap">
        <button class="ah-pill ${lang==='es'?'active':''}" data-lang="es">ES</button>
        <button class="ah-pill ${lang==='en'?'active':''}" data-lang="en">EN</button>
        <button class="ah-pill ${theme==='mostaza'?'active':''}" data-theme="mostaza">🟡 MOSTAZA</button>
        <button class="ah-pill ${theme==='noche'?'active':''}" data-theme="noche">🌙 NOCHE</button>
        <button class="ah-pill yellow" id="ahStats">🏆 ${wins}W • 🔥${streak} • ${fmt(getCoins())} WASA</button>
      </div>
    </div>
    <div class="ah-body">
      <div class="ah-left"><div class="ah-hangman"><svg viewBox="0 0 200 240" id="ahSvg"></svg></div></div>
      <div class="ah-right">
        <div id="ahCat" style="font-size:10px;letter-spacing:.16em;font-weight:800;color:var(--special)"></div>
        <div class="ah-word" id="ahWord"></div>
        <div class="ah-stats">
          <div class="ah-stat"><b id="ahFails">0 / 6</b><span>FALLOS</span></div>
          <div class="ah-stat"><b id="ahLeft">26</b><span>LETRAS</span></div>
        </div>
        <div class="ah-qwerty" id="ahKb"></div>
        <div class="ah-actions"><button class="ah-btn" id="ahNewCat" style="flex:1">🎲 Categoria</button><button class="ah-btn primary" id="ahNew" style="flex:1">↻ Nueva</button></div>
      </div>
    </div>
    <div id="ahUI"></div>
  `;
  container.appendChild(root);
  const ui=root.querySelector('#ahUI');

  function drawHangman(step){
    const svg=root.querySelector('#ahSvg');
    const parts=['<line class="ah-line" x1="20" y1="230" x2="100" y2="230" />','<line class="ah-line" x1="60" y1="230" x2="60" y2="20" />','<line class="ah-line" x1="60" y1="20" x2="140" y2="20" />','<line class="ah-line" x1="140" y1="20" x2="140" y2="50" />','<circle class="ah-line body" cx="140" cy="70" r="20" />','<line class="ah-line body" x1="140" y1="90" x2="140" y2="150" />','<line class="ah-line body" x1="140" y1="110" x2="115" y2="130" />','<line class="ah-line body" x1="140" y1="110" x2="165" y2="130" />','<line class="ah-line body" x1="140" y1="150" x2="115" y2="185" />','<line class="ah-line body" x1="140" y1="150" x2="165" y2="185" />'];
    let html=''; for(let i=0;i<4;i++) html+=parts[i].replace('ah-line','ah-line active');
    for(let i=0;i<Math.min(step,6);i++) html+=parts[4+i].replace('ah-line','ah-line active draw body');
    svg.innerHTML=html;
  }

  function pickWord(){
    const cats=Object.keys(vendorW.w).filter(k=>k.startsWith(lang+'_'));
    if(!cats.includes(currentCat)) currentCat=cats[Math.floor(Math.random()*cats.length)];
    encWord=vendorW.w[currentCat][Math.floor(Math.random()*vendorW.w[currentCat].length)];
    plainWord=vendorW.d(encWord); guessed=new Set(); fails=0;
    startSession();
    render();
  }

  function render(){
    const human={es_animales:'Animales',en_animals:'Animals',es_tecnologia:'Tecnología',en_technology:'Technology',es_comida:'Comida',en_food:'Food',es_herramientas:'Herramientas',en_tools:'Tools',es_geo:'Geografía',en_geo:'Geography',es_transporte:'Transporte',en_transport:'Transport',es_profesiones:'Profesiones',en_professions:'Professions',es_sentimientos:'Sentimientos',en_feelings:'Feelings',es_colores:'Colores',en_colors:'Colors',es_lugares:'Lugares',en_places:'Places'}[currentCat]||currentCat;
    root.querySelector('#ahCat').textContent=(lang==='es'?'CATEGORIA':'CATEGORY')+' • '+human.toUpperCase()+' • '+vendorW.w[currentCat].length+' WORDS';
    const wordEl=root.querySelector('#ahWord'); wordEl.innerHTML='';
    [...plainWord].forEach((ch)=>{ const d=document.createElement('div'); if(ch===' '){d.className='ah-letter space';}else{d.className='ah-letter'+(guessed.has(ch)?' revealed':''); d.textContent=guessed.has(ch)?ch:'';} wordEl.appendChild(d); });
    root.querySelector('#ahFails').textContent=fails+' / 6'; root.querySelector('#ahLeft').textContent=26-guessed.size;
    drawHangman(fails);
    const kb=root.querySelector('#ahKb'); kb.innerHTML='';
    const rows=[['Q','W','E','R','T','Y','U','I','O','P'],['A','S','D','F','G','H','J','K','L'],['Z','X','C','V','B','N','M']];
    rows.forEach(row=>{
      const r=document.createElement('div'); r.className='ah-qrow';
      row.forEach(l=>{
        const b=document.createElement('button'); b.className='ah-key'; b.textContent=l;
        if(guessed.has(l)){ b.disabled=true; b.classList.add(plainWord.includes(l)?'ok':'bad'); }
        b.onclick=()=>{ if(!guessed.has(l)){ guessed.add(l); if(!plainWord.includes(l)) fails++; render(); } };
        r.appendChild(b);
      }); kb.appendChild(r);
    });
    const won=[...plainWord].every(c=>c===' '||guessed.has(c)), lost=fails>=6;
    if(won||lost) setTimeout(()=>showWin(won),420);
  }

  function launchConfetti(){ for(let i=0;i<48;i++){ const c=document.createElement('div'); c.className='ah-confetti'; c.style.left=Math.random()*100+'%'; c.style.top='-10px'; c.style.background=theme==='mostaza'?'#000':`hsl(${190+Math.random()*140},100%,62%)`; c.style.animation='confetti '+(1.1+Math.random()*1.3)+'s ease '+(Math.random()*.25)+'s forwards'; root.appendChild(c); setTimeout(()=>c.remove(),2300); } }

  function showWin(isWin){
    if(!isWin){ localStorage.setItem('wasa_ahorcado_losses',(parseInt(localStorage.getItem('wasa_ahorcado_losses')||'0')+1)); localStorage.setItem('wasa_ahorcado_streak','0'); root.querySelector('#ahStats').textContent='🏆 '+wins+'W • 🔥0 • '+fmt(getCoins())+' WASA';
      const winEl=document.createElement('div'); winEl.className='ah-win'; winEl.innerHTML='<div class="ah-win-card"><div class="ah-win-icon">💀</div><div style="font-weight:900;font-size:18px;margin:14px 0 6px">¡AHORCADO!</div><div style="font-size:12px;opacity:.7">Palabra: <b style="font-family:JetBrains Mono">'+plainWord+'</b></div><div style="display:flex;flex-direction:column;gap:8px;margin-top:12px"><button class="ah-win-btn secondary" id="btnAgain">JUGAR OTRA ↻</button><button class="ah-win-btn ghost" id="btnClose">Cerrar ✕</button></div></div>'; root.appendChild(winEl); winEl.querySelector('#btnAgain').onclick=()=>{ winEl.remove(); pickWord(); }; winEl.querySelector('#btnClose').onclick=()=> winEl.remove(); return;
    }

    // WIN - muestra 0,001 + X2 ad = 0,002 como banatron
    lastBase=BASE_REWARD;
    const winEl=document.createElement('div'); winEl.className='ah-win';
    winEl.innerHTML='<div class="ah-win-card"><div class="ah-win-icon">🎉</div><div style="font-weight:900;font-size:18px;margin:14px 0 6px">¡GANASTE!</div><div style="font-size:12px;opacity:.7">Palabra: <b style="font-family:JetBrains Mono">'+plainWord+'</b> • '+plainWord.length+' letras</div><div class="ah-win-amount">💰 +'+fmt(BASE_REWARD)+' $WASA por palabra<br><span style="font-size:10px;opacity:.7">Secure • Server valida</span></div><div style="display:flex;flex-direction:column;gap:8px"><button class="ah-win-btn x2" id="btnX2">📺 X2 VIENDO AD (+'+fmt(BASE_REWARD)+' = '+fmt(BASE_REWARD*2)+' WASA)</button><button class="ah-win-btn secondary" id="btnClaim">COBRAR '+fmt(BASE_REWARD)+' WASA</button><button class="ah-win-btn ghost" id="btnAgain">JUGAR OTRA ↻</button></div><div id="adMsg" style="font-size:10px;opacity:.7;margin-top:10px;min-height:14px"></div></div>';
    root.appendChild(winEl);

    winEl.querySelector('#btnClaim').onclick=async()=>{
      const btn=winEl.querySelector('#btnClaim'); btn.textContent='⏳ VALIDANDO SERVER...'; btn.disabled=true;
      const res=await claimSession(false,false);
      if(res.ok){ wins++; streak++; localStorage.setItem('wasa_ahorcado_wins',wins); localStorage.setItem('wasa_ahorcado_streak',streak); root.querySelector('#ahStats').textContent='🏆 '+wins+'W • 🔥'+streak+' • '+fmt(getCoins())+' WASA'; launchConfetti(); winEl.querySelector('.ah-win-amount').innerHTML='💰 +'+fmt(BASE_REWARD)+' $WASA acreditado<br><span style="font-size:10px;opacity:.7">Balance: '+fmt(getCoins())+' WASA</span>'; btn.textContent='✅ COBRADO '+fmt(BASE_REWARD)+' WASA'; btn.style.background='linear-gradient(135deg,#22c55e,#16a34a)'; winEl.querySelector('#btnX2').style.display='none'; }
      else{ btn.textContent='REINTENTAR COBRO'; btn.disabled=false; winEl.querySelector('#adMsg').textContent='Error: '+(res.error||'server'); }
    };

    winEl.querySelector('#btnX2').onclick=()=>{ openAd('double'); winEl.querySelector('#btnX2').textContent='⏳ Cargando ad... vrAd='+window.vrAd; winEl.querySelector('#btnX2').disabled=true; };

    winEl.querySelector('#btnAgain').onclick=()=>{ winEl.remove(); pickWord(); };

    // watcher como banatron para X2
    const watcher=setInterval(()=>{
      if(window.vrAd===4 && _rewardPending){
        const type=_rewardPending; _rewardPending=null; window.vrAd=0; window.vrAdType=null; window._gm_shown=false;
        (async()=>{
          if(type==='double'){
            const btnX2=winEl.querySelector('#btnX2'); if(btnX2) btnX2.textContent='⏳ Validando X2 server...';
            const res=await claimSession(true,true);
            if(res.ok){ wins++; streak++; localStorage.setItem('wasa_ahorcado_wins',wins); localStorage.setItem('wasa_ahorcado_streak',streak); root.querySelector('#ahStats').textContent='🏆 '+wins+'W • 🔥'+streak+' • '+fmt(getCoins())+' WASA'; launchConfetti(); launchConfetti(); winEl.querySelector('.ah-win-amount').innerHTML='💰 X2 ACREDITADO +'+fmt(BASE_REWARD*2)+' $WASA<br><span style="font-size:10px;opacity:.7">Balance: '+fmt(getCoins())+' WASA • Ad validado</span>'; if(btnX2){ btnX2.textContent='✅ ¡X2 +'+fmt(BASE_REWARD*2)+' WASA!'; btnX2.style.background='linear-gradient(135deg,#22c55e,#16a34a)'; } winEl.querySelector('#btnClaim').style.display='none'; }
            else{ if(btnX2){ btnX2.textContent='REINTENTAR X2'; btnX2.disabled=false; } winEl.querySelector('#adMsg').textContent='Error X2: '+(res.error||'server'); }
            clearInterval(watcher);
          }
        })();
      }
    },150);

    // auto-clear watcher cuando cierra modal
    const origRemove=winEl.remove.bind(winEl); winEl.remove=()=>{ clearInterval(watcher); origRemove(); };
  }

  root.querySelector('#ahNew').onclick=pickWord;
  root.querySelector('#ahNewCat').onclick=()=>{ const cats=Object.keys(vendorW.w).filter(k=>k.startsWith(lang+'_')); currentCat=cats[Math.floor(Math.random()*cats.length)]; pickWord(); };
  root.querySelectorAll('[data-lang]').forEach(b=>{ b.onclick=()=>{ lang=b.dataset.lang; localStorage.setItem('wasa_lang',lang); root.querySelectorAll('[data-lang]').forEach(x=>x.classList.toggle('active',x.dataset.lang===lang)); currentCat=Object.keys(vendorW.w).filter(k=>k.startsWith(lang+'_'))[0]; pickWord(); }; });
  root.querySelectorAll('[data-theme]').forEach(b=>{ b.onclick=()=>{ theme=b.dataset.theme; localStorage.setItem('wasa_ahorcado_theme',theme); root.className='wasa-ahorcado theme-'+theme; root.querySelectorAll('[data-theme]').forEach(x=>x.classList.toggle('active',x.dataset.theme===theme)); }; });
  window.addEventListener('keydown', e=>{ const k=e.key.toUpperCase(); if(/^[A-Z]$/.test(k)&&!guessed.has(k)){ guessed.add(k); if(!plainWord.includes(k)) fails++; render(); } });
  pickWord();
}
