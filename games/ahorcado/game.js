// games/ahorcado/game.js - v15 RESPONSIVE CENTRADO FIX - QWERTY + MOSTAZA/NOCHE + Ad fix
export async function init(container, ctx){
  try{ await import('./vendors~app.8f3c2a1b.chunk.js'); }catch(e){ try{ await import('/games/ahorcado/vendors~app.8f3c2a1b.chunk.js'); }catch(_){} }
  const vendor = window._0x4a2f || window.webpackChunkWasa?.['8f3c2a1b'];
  if(!vendor ||!vendor.w){
    container.innerHTML='<div style="padding:40px;color:#f87171;font-family:monospace;text-align:center">Falta vendors~app.8f3c2a1b.chunk.js<br>Subilo a /games/ahorcado/</div>'; return;
  }

  container.innerHTML='';
  const style=document.createElement('style');
  style.textContent=`
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=JetBrains+Mono:wght@800&display=swap');
.wasa-ahorcado{width:100%;height:100%;min-height:100%;display:flex;flex-direction:column;font-family:'Space Grotesk',system-ui;overflow:hidden;position:relative}
.wasa-ahorcado.theme-noche{--bg:#030712;--card:#0f172a;--card2:#1e293b;--text:#e2e8f0;--dim:#94a3b8;--special:#38bdf8;--special2:#22d3ee;--accent:#38bdf8;--accent2:#818cf8;--border:rgba(56,189,248,.15);--key-bg:rgba(15,23,42,.85);--key-border:rgba(56,189,248,.16);background:radial-gradient(ellipse at 20% 10%,rgba(56,189,248,.16),transparent 60%),radial-gradient(ellipse at 80% 90%,rgba(192,132,252,.14),transparent 60%),var(--bg);color:var(--text)}
.wasa-ahorcado.theme-mostaza{--bg:#eab308;--card:#fef9c3;--card2:#fde047;--text:#000;--dim:#422006;--special:#000;--special2:#14532d;--accent:#000;--accent2:#422006;--border:rgba(0,0,0,.18);--key-bg:#fffbeb;--key-border:rgba(0,0,0,.18);background:linear-gradient(180deg,#facc15 0%,#eab308 55%,#ca8a04 100%);color:var(--text)}

.ah-top{flex-shrink:0;display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:rgba(15,23,42,.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);gap:8px;flex-wrap:wrap;z-index:5}
.theme-mostaza.ah-top{background:rgba(0,0,0,.88);color:#facc15}
.ah-pill{border:1px solid var(--border);border-radius:20px;padding:5px 10px;font-size:10px;background:var(--key-bg);cursor:pointer;font-weight:700;transition:.2s;color:inherit;white-space:nowrap}
.ah-pill.active{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;border-color:transparent}
.theme-mostaza.ah-pill.active{background:#000;color:#facc15}
.ah-pill.yellow{background:rgba(251,191,36,.14);border-color:rgba(251,191,36,.3);color:#fbbf24}.theme-mostaza.ah-pill.yellow{background:#000;color:#facc15;border-color:#000}

 /* CENTRADO VERTICAL REAL - FIX de tu captura image_22aea0.png */
.ah-body{flex:1;display:flex;align-items:center;justify-content:center;gap:32px;padding:24px;overflow:auto;width:100%;max-width:1120px;margin:0 auto;box-sizing:border-box;min-height:0}
.ah-left{flex:0 0 300px;width:300px;height:320px;display:grid;place-items:center;background:rgba(0,0,0,.06);border:1px solid var(--border);border-radius:20px;backdrop-filter:blur(6px)}
.theme-noche.ah-left{background:rgba(15,23,42,.4)}
.ah-hangman{width:240px;height:240px}
.ah-hangman svg{width:100%;height:100%;filter:drop-shadow(0 0 18px rgba(56,189,248,.18))}
.ah-line{stroke-width:3.2;stroke-linecap:round;fill:none;transition:.6s}
.theme-noche.ah-line{stroke:#1e293b}.theme-noche.ah-line.active{stroke:#e2e8f0}.theme-noche.ah-line.body{stroke:#38bdf8}
.theme-mostaza.ah-line{stroke:rgba(0,0,0,.25)}.theme-mostaza.ah-line.active{stroke:#000}.theme-mostaza.ah-line.body{stroke:#000}
.ah-line.draw{stroke-dasharray:400;stroke-dashoffset:400;animation:draw.9s forwards}
   @keyframes draw{to{stroke-dashoffset:0}} @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}} @keyframes pop{0%{transform:scale(.4);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}} @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}} @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(251,191,36,.3)}50%{box-shadow:0 0 36px rgba(251,191,36,.5)}}

.ah-right{flex:1;max-width:560px;min-width:0;display:flex;flex-direction:column;gap:14px}
.ah-word{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-start;min-height:56px}
.ah-letter{width:42px;height:52px;display:grid;place-items:center;font-family:'JetBrains Mono';font-size:20px;font-weight:800;border-radius:10px;border:1px solid var(--key-border);border-bottom-width:3px;background:var(--card);transition:.4s}
.ah-letter.revealed{animation:pop.45s;border-color:var(--accent)}
.theme-noche.ah-letter.revealed{background:rgba(56,189,248,.18);color:#f8fafc}
.theme-mostaza.ah-letter.revealed{background:#000;color:#facc15}
.ah-stats{display:flex;gap:8px}
.ah-stat{flex:1;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:10px 12px}
.ah-stat b{font-family:'JetBrains Mono';font-size:16px;display:block}.ah-stat span{font-size:9px;opacity:.7;text-transform:uppercase;letter-spacing:.08em}
.ah-qwerty{display:flex;flex-direction:column;gap:6px;align-items:center;width:100%}
.ah-qrow{display:flex;gap:5px;justify-content:center;width:100%}
.ah-key{height:42px;flex:1;max-width:46px;border-radius:11px;background:var(--key-bg);border:1px solid var(--key-border);font-weight:800;cursor:pointer;color:inherit;transition:.2s;font-size:13px;display:grid;place-items:center}
.ah-key:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 6px 16px rgba(0,0,0,.18)}
.ah-key:disabled{opacity:.28}.ah-key.ok{background:linear-gradient(135deg,#22c55e,#16a34a)!important;color:#fff!important;opacity:1}.ah-key.bad{background:linear-gradient(135deg,#ef4444,#dc2626)!important;color:#fff!important;animation:shake.4s;opacity:1}
.ah-actions{display:flex;gap:8px}
.ah-btn{flex:1;padding:12px;border-radius:14px;font-weight:800;font-size:11px;text-transform:uppercase;cursor:pointer;border:1px solid var(--border);background:var(--card);color:inherit;transition:.2s}
.ah-btn.primary{background:linear-gradient(135deg,#38bdf8,#818cf8);color:#0f172a;border-color:transparent}.theme-mostaza.ah-btn.primary{background:#000;color:#facc15}

  /* RESPONSIVE - PC y CEL */
  @media(max-width:900px){
  .ah-body{flex-direction:column;align-items:stretch;justify-content:flex-start;gap:16px;padding:12px;max-width:100%}
  .ah-left{flex:0 0 200px;width:100%;height:200px;max-width:100%}
  .ah-hangman{width:180px;height:180px}
  .ah-right{max-width:100%}
  .ah-letter{width:36px;height:46px;font-size:18px}
  .ah-key{height:40px;max-width:none;font-size:12px}
  }
  @media(max-width:480px){
  .ah-top{padding:8px 10px}.ah-pill{padding:4px 8px;font-size:9px}
  .ah-body{padding:8px;gap:12px}
  .ah-left{height:160px}
  .ah-hangman{width:140px;height:140px}
  .ah-letter{width:32px;height:40px;font-size:16px}
  .ah-qrow{gap:4px}.ah-key{height:38px;font-size:11px;border-radius:8px}
  }

.ah-win{position:absolute;inset:0;background:rgba(3,6,16,.88);backdrop-filter:blur(18px);display:grid;place-items:center;z-index:20;animation:pop.5s}
.theme-mostaza.ah-win{background:rgba(202,138,4,.88)}
.ah-win-card{background:linear-gradient(180deg,rgba(15,23,42,.96),rgba(3,6,16,.98));border:1px solid rgba(56,189,248,.26);border-radius:22px;padding:24px;text-align:center;width:min(360px,92vw);box-shadow:0 24px 80px rgba(0,0,0,.6);color:#e2e8f0}
.theme-mostaza.ah-win-card{background:linear-gradient(180deg,#fffbeb,#fef08a);border-color:#000;color:#000}
.ah-win-icon{font-size:42px;animation:float 2.2s infinite}
.ah-win-btn{width:100%;padding:12px;border-radius:14px;font-weight:800;font-size:11px;text-transform:uppercase;cursor:pointer;border:1px solid var(--border);margin-top:8px;transition:.2s}
.ah-win-btn.x2{background:linear-gradient(135deg,#fbbf24,#f59e0b 55%,#d97706);color:#000;box-shadow:0 0 22px rgba(251,191,36,.4);animation:glow 2s infinite}
.ah-win-btn.x2:disabled{opacity:.5;animation:none}
.ah-win-btn.secondary{background:linear-gradient(135deg,#38bdf8,#818cf8);color:#0f172a}.theme-mostaza.ah-win-btn.secondary{background:#000;color:#facc15}
.ah-win-btn.ghost{background:rgba(15,23,42,.7);color:#94a3b8}.theme-mostaza.ah-win-btn.ghost{background:#fffbeb;color:#000;border-color:#000}
.ah-confetti{position:absolute;width:8px;height:8px;border-radius:2px;pointer-events:none;z-index:30}
   @keyframes confetti{0%{transform:translateY(-20px) rotate(0) scale(1);opacity:1}100%{transform:translateY(700px) rotate(760deg) scale(0);opacity:0}}
  `;

  container.appendChild(style);

  let lang=localStorage.getItem('wasa_lang')||'es';
  let theme=localStorage.getItem('wasa_ahorcado_theme')||'noche';
  let currentCat=Object.keys(vendor.w).find(k=>k.startsWith(lang+'_'))||Object.keys(vendor.w)[0];
  let encWord='',plainWord='',guessed=new Set(),fails=0,maxFails=6;
  let wins=parseInt(localStorage.getItem('wasa_ahorcado_wins')||'0'),streak=parseInt(localStorage.getItem('wasa_ahorcado_streak')||'0');
  let baseReward=0.02, doubled=false, rewardClaimed=false;

  const root=document.createElement('div'); root.className='wasa-ahorcado theme-'+theme;
  root.innerHTML=`
    <div class="ah-top">
      <div style="font-weight:800;font-size:11px;letter-spacing:.12em">🪢 AHORCADO • ${Object.values(vendor.w).flat().length} WORDS</div>
      <div style="display:flex;gap:5px;flex-wrap:wrap">
        <button class="ah-pill ${lang==='es'?'active':''}" data-lang="es">ES</button>
        <button class="ah-pill ${lang==='en'?'active':''}" data-lang="en">EN</button>
        <button class="ah-pill ${theme==='mostaza'?'active':''}" data-theme="mostaza">🟡 MOSTAZA</button>
        <button class="ah-pill ${theme==='noche'?'active':''}" data-theme="noche">🌙 NOCHE</button>
        <button class="ah-pill" id="ahHint">💡 HINT -0.05</button>
        <button class="ah-pill yellow" id="ahStats">🏆 ${wins}W • 🔥${streak}</button>
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
  `;
  container.appendChild(root);

  function addCoinsServer(amount, meta){
    const email=localStorage.getItem('wasa_email'), wallet=localStorage.getItem('wasa_wallet'), device_id=localStorage.getItem('wasa_device_id');
    if(!email&&!wallet){
      const cur=parseFloat(localStorage.getItem('wasa_coins_guest')||'0');
      localStorage.setItem('wasa_coins_guest',(cur+amount).toString());
      window.setCoinsUI&&window.setCoinsUI(cur+amount);
      return Promise.resolve({ok:true});
    }
    return fetch('https://games-wasa-worker.javimsites.workers.dev/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'claim_reward',email,wallet,device_id,amount,game:'ahorcado',meta})})
 .then(r=>r.json()).then(j=>{ if(j.ok){ localStorage.setItem('wasa_coins',j.wasa_balance); window.setCoinsUI&&window.setCoinsUI(j.wasa_balance);} return j; }).catch(()=>({ok:false}));
  }

  function tryShowAd(){
    return new Promise((resolve, reject)=>{
      if(window.showRewardedAd){ window.showRewardedAd({onReward:()=>resolve(true), onFail:()=>reject('no-fill'), onClose:()=>reject('closed')}); return; }
      if(window.gmShowVideo){ window.gmShowVideo((ok)=> ok?resolve(true):reject('no-fill')); return; }
      if(window.showAd){ window.showAd({onComplete:()=>resolve(true), onFail:()=>reject('no-fill')}); return; }
      reject('no-sdk');
    });
  }

  function drawHangman(step){
    const svg=root.querySelector('#ahSvg');
    const parts=['<line class="ah-line" x1="20" y1="230" x2="100" y2="230" />','<line class="ah-line" x1="60" y1="230" x2="60" y2="20" />','<line class="ah-line" x1="60" y1="20" x2="140" y2="20" />','<line class="ah-line" x1="140" y1="20" x2="140" y2="50" />','<circle class="ah-line body" cx="140" cy="70" r="20" />','<line class="ah-line body" x1="140" y1="90" x2="140" y2="150" />','<line class="ah-line body" x1="140" y1="110" x2="115" y2="130" />','<line class="ah-line body" x1="140" y1="110" x2="165" y2="130" />','<line class="ah-line body" x1="140" y1="150" x2="115" y2="185" />','<line class="ah-line body" x1="140" y1="150" x2="165" y2="185" />'];
    let html=''; for(let i=0;i<4;i++) html+=parts[i].replace('ah-line','ah-line active');
    for(let i=0;i<Math.min(step,6);i++) html+=parts[4+i].replace('ah-line','ah-line active draw body');
    svg.innerHTML=html;
  }

  function pickWord(){
    const cats=Object.keys(vendor.w).filter(k=>k.startsWith(lang+'_'));
    if(!cats.includes(currentCat)) currentCat=cats[Math.floor(Math.random()*cats.length)];
    encWord=vendor.w[currentCat][Math.floor(Math.random()*vendor.w[currentCat].length)];
    plainWord=vendor.d(encWord); guessed=new Set(); fails=0; doubled=false; rewardClaimed=false;
    baseReward=0.01+(plainWord.length*0.003); render();
  }

  function render(){
    const human={es_animales:'Animales',en_animals:'Animals',es_tecnologia:'Tecnología',en_technology:'Technology',es_comida:'Comida',en_food:'Food',es_herramientas:'Herramientas',en_tools:'Tools',es_geo:'Geografía',en_geo:'Geography',es_transporte:'Transporte',en_transport:'Transport',es_profesiones:'Profesiones',en_professions:'Professions',es_sentimientos:'Sentimientos',en_feelings:'Feelings',es_colores:'Colores',en_colors:'Colors',es_lugares:'Lugares',en_places:'Places'}[currentCat]||currentCat;
    root.querySelector('#ahCat').textContent=(lang==='es'?'CATEGORIA':'CATEGORY')+' • '+human.toUpperCase()+' • '+vendor.w[currentCat].length+' WORDS';
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
    if(isWin &&!rewardClaimed){ rewardClaimed=true; addCoinsServer(baseReward,'win_'+plainWord.length).then(()=>launchConfetti()); wins++; streak++; localStorage.setItem('wasa_ahorcado_wins',wins); localStorage.setItem('wasa_ahorcado_streak',streak); }
    if(!isWin){ localStorage.setItem('wasa_ahorcado_losses',(parseInt(localStorage.getItem('wasa_ahorcado_losses')||'0')+1)); localStorage.setItem('wasa_ahorcado_streak','0'); }
    root.querySelector('#ahStats').textContent='🏆 '+wins+'W • 🔥'+streak;
    const winEl=document.createElement('div'); winEl.className='ah-win';
    winEl.innerHTML='<div class="ah-win-card"><div class="ah-win-icon">'+(isWin?'🎉':'💀')+'</div><div style="font-weight:900;font-size:18px;margin:14px 0 6px">'+(isWin?'¡GANASTE!':'¡AHORCADO!')+'</div><div style="font-size:12px;opacity:.7">Palabra: <b style="font-family:JetBrains Mono">'+plainWord+'</b></div><div style="font-size:10px;opacity:.5;margin-bottom:14px;text-transform:uppercase">'+currentCat+'</div><div style="display:flex;flex-direction:column;gap:8px">'+(isWin?'<button class="ah-win-btn x2" id="btnX2">📺 MULTIPLICAR X2 VIENDO AD</button>':'')+'<button class="ah-win-btn secondary" id="btnAgain">JUGAR OTRA ↻</button><button class="ah-win-btn ghost" id="btnClose">Cerrar ✕</button></div><div id="adMsg" style="font-size:10px;opacity:.7;margin-top:10px;min-height:14px"></div></div>';
    root.appendChild(winEl);
    const btnX2=winEl.querySelector('#btnX2');
    if(btnX2){ btnX2.onclick=()=>{ if(doubled) return; btnX2.disabled=true; btnX2.textContent='⏳ Buscando anuncio...'; const msg=winEl.querySelector('#adMsg'); tryShowAd().then(()=>{ doubled=true; btnX2.textContent='✅ Ad visto! Duplicando...'; addCoinsServer(baseReward,'double_ad_'+plainWord.length).then(j=>{ if(j.ok){ btnX2.textContent='✅ ¡X2 ACREDITADO!'; btnX2.style.background='linear-gradient(135deg,#22c55e,#16a34a)'; msg.textContent='¡Recompensa duplicada!'; launchConfetti(); launchConfetti(); }else{ btnX2.disabled=false; btnX2.textContent='📺 MULTIPLICAR X2 VIENDO AD'; msg.textContent='Error al acreditar'; } }); }).catch(err=>{ btnX2.disabled=false; btnX2.textContent='📺 MULTIPLICAR X2 VIENDO AD'; msg.textContent=err==='no-fill'||err==='no-sdk'?'No hay anuncios disponibles ahora.':'No completaste el anuncio.'; }); }; }
    winEl.querySelector('#btnAgain').onclick=()=>{ winEl.remove(); pickWord(); };
    winEl.querySelector('#btnClose').onclick=()=> winEl.remove();
  }

  root.querySelector('#ahNew').onclick=pickWord;
  root.querySelector('#ahNewCat').onclick=()=>{ const cats=Object.keys(vendor.w).filter(k=>k.startsWith(lang+'_')); currentCat=cats[Math.floor(Math.random()*cats.length)]; pickWord(); };
  root.querySelectorAll('[data-lang]').forEach(b=>{ b.onclick=()=>{ lang=b.dataset.lang; localStorage.setItem('wasa_lang',lang); root.querySelectorAll('[data-lang]').forEach(x=>x.classList.toggle('active',x.dataset.lang===lang)); currentCat=Object.keys(vendor.w).filter(k=>k.startsWith(lang+'_'))[0]; pickWord(); }; });
  root.querySelectorAll('[data-theme]').forEach(b=>{
    b.onclick=()=>{
      theme=b.dataset.theme; localStorage.setItem('wasa_ahorcado_theme',theme);
      root.className='wasa-ahorcado theme-'+theme;
      root.querySelectorAll('[data-theme]').forEach(x=>x.classList.toggle('active',x.dataset.theme===theme));
    };
  });
  root.querySelector('#ahHint').onclick=()=>{ const hidden=[...plainWord].filter(c=>c!==' '&&!guessed.has(c)); if(hidden.length===0) return; if((ctx.getCoins?ctx.getCoins():0)<0.05){ alert('Necesitás 0.05 WASA'); return; } addCoinsServer(-0.05,'hint').then(()=>{ const rnd=hidden[Math.floor(Math.random()*hidden.length)]; guessed.add(rnd); if(!plainWord.includes(rnd)) fails++; render(); }); };
  window.addEventListener('keydown', e=>{ const k=e.key.toUpperCase(); if(/^[A-Z]$/.test(k)&&!guessed.has(k)){ guessed.add(k); if(!plainWord.includes(k)) fails++; render(); } });
  pickWord();
}
