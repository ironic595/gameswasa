// games/ahorcado/game.js - AHORCADO WASA v10 - Bilingüe + Animaciones Pro
import './vendors~app.8f3c2a1b.chunk.js';

export function init(container, ctx) {
  container.innerHTML = '';
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@700&display=swap');
   .wasa-ahorcado{--bg:#030712;--card:#0f172a;--accent:#38bdf8;--accent2:#818cf8;--accent3:#c084fc;--ok:#22c55e;--bad:#ef4444;--yellow:#fbbf24; width:100%; height:100%; min-height:600px; background: radial-gradient(ellipse at 20% 10%, rgba(56,189,248,.15), transparent 60%), radial-gradient(ellipse at 80% 90%, rgba(192,132,252,.12), transparent 60%), var(--bg); display:flex; flex-direction:column; font-family:'Space Grotesk',system-ui; color:#e2e8f0; overflow:hidden; position:relative}
   .ah-top{display:flex; align-items:center; justify-content:space-between; padding:14px 20px; background:rgba(15,23,42,.8); backdrop-filter:blur(12px); border-bottom:1px solid rgba(56,189,248,.15); z-index:5}
   .ah-logo{font-weight:800; letter-spacing:.1em; font-size:13px; background:linear-gradient(135deg,var(--accent),var(--accent3)); -webkit-background-clip:text; -webkit-text-fill-color:transparent}
   .ah-controls{display:flex; gap:8px; align-items:center}
   .ah-pill{border:1px solid rgba(56,189,248,.25); border-radius:20px; padding:5px 12px; font-size:11px; background:rgba(15,23,42,.8); cursor:pointer; transition:.2s; backdrop-filter:blur(8px)}
   .ah-pill:hover{border-color:var(--accent); transform:translateY(-1px); box-shadow:0 4px 12px rgba(56,189,248,.2)}
   .ah-pill.active{background:linear-gradient(135deg,var(--accent),var(--accent2)); color:#0f172a; border-color:transparent; font-weight:700}
   .ah-body{flex:1; display:grid; grid-template-columns:320px 1fr; gap:0; min-height:0}
    @media(max-width:900px){.ah-body{grid-template-columns:1fr; grid-template-rows: 320px 1fr}}
   .ah-left{background:rgba(15,23,42,.4); border-right:1px solid rgba(56,189,248,.1); display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; position:relative; overflow:hidden}
   .ah-left::before{content:''; position:absolute; inset:0; background:radial-gradient(ellipse at center, rgba(56,189,248,.08), transparent 70%); pointer-events:none}
   .ah-hangman{width:260px; height:260px; position:relative; z-index:2}
   .ah-hangman svg{width:100%; height:100%; filter: drop-shadow(0 0 20px rgba(56,189,248,.2))}
   .ah-hangman.line{stroke:#334155; stroke-width:3; stroke-linecap:round; fill:none; transition: all.6s cubic-bezier(.34,1.56,.64,1)}
   .ah-hangman.line.active{stroke:#e2e8f0; stroke-width:3.5; filter: drop-shadow(0 0 8px rgba(56,189,248,.6))}
   .ah-hangman.line.body{stroke:var(--accent); stroke-width:4}
   .ah-hangman.line.draw{stroke-dasharray:300; stroke-dashoffset:300; animation:draw.8s ease forwards}
    @keyframes draw{to{stroke-dashoffset:0}}
    @keyframes shake{0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)}}
    @keyframes pop{0%{transform:scale(.5); opacity:0} 60%{transform:scale(1.2)} 100%{transform:scale(1); opacity:1}}
    @keyframes float{0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)}}
   .ah-right{padding:22px; display:flex; flex-direction:column; gap:18px; overflow:auto}
   .ah-category{font-size:10px; letter-spacing:.15em; color:var(--accent); text-transform:uppercase; font-weight:700; display:flex; align-items:center; gap:8px}
   .ah-category::before{content:''; width:24px; height:2px; background:linear-gradient(90deg,var(--accent),transparent); border-radius:2px}
   .ah-word{display:flex; flex-wrap:wrap; gap:8px; min-height:52px}
   .ah-letter{width:42px; height:52px; border-bottom:3px solid rgba(56,189,248,.2); display:grid; place-items:center; font-family:'JetBrains Mono',monospace; font-size:22px; font-weight:800; background:rgba(15,23,42,.6); border-radius:8px 8px 0 0; backdrop-filter:blur(8px); transition:.4s cubic-bezier(.34,1.56,.64,1); position:relative; overflow:hidden}
   .ah-letter.revealed{border-color:var(--accent); background:rgba(56,189,248,.12); color:#f8fafc; animation:pop.5s cubic-bezier(.34,1.56,.64,1)}
   .ah-letter.revealed::after{content:''; position:absolute; inset:0; background:linear-gradient(180deg, rgba(56,189,248,.1), transparent); pointer-events:none}
   .ah-letter.space{width:18px; border:none; background:transparent}
   .ah-keyboard{display:grid; grid-template-columns:repeat(auto-fill, minmax(36px,1fr)); gap:6px; margin-top:8px}
   .ah-key{height:38px; border-radius:10px; background:rgba(15,23,42,.8); border:1px solid rgba(56,189,248,.15); font-weight:700; font-size:13px; cursor:pointer; transition:.2s; backdrop-filter:blur(8px); position:relative; overflow:hidden}
   .ah-key:hover:not(:disabled){border-color:var(--accent); transform:translateY(-2px); box-shadow:0 6px 16px rgba(56,189,248,.2); background:rgba(56,189,248,.12)}
   .ah-key:disabled{opacity:.35; cursor:not-allowed; transform:none}
   .ah-key.ok{background:linear-gradient(135deg,var(--ok),#16a34a); color:#052e16; border-color:transparent; box-shadow:0 0 16px rgba(34,197,94,.4); animation:pop.4s ease}
   .ah-key.bad{background:linear-gradient(135deg,var(--bad),#dc2626); color:#fff; border-color:transparent; box-shadow:0 0 16px rgba(239,68,68,.4); animation:shake.4s ease}
   .ah-stats{display:flex; gap:12px; flex-wrap:wrap}
   .ah-stat{flex:1; min-width:90px; background:rgba(15,23,42,.6); border:1px solid rgba(56,189,248,.12); border-radius:12px; padding:10px 12px; backdrop-filter:blur(8px)}
   .ah-stat b{display:block; font-size:18px; font-weight:800; color:#f8fafc}
   .ah-stat span{font-size:10px; color:#94a3b8; letter-spacing:.08em; text-transform:uppercase}
   .ah-actions{display:flex; gap:8px}
   .ah-btn{flex:1; padding:12px; border-radius:12px; font-weight:700; font-size:12px; letter-spacing:.05em; text-transform:uppercase; cursor:pointer; transition:.2s; border:1px solid rgba(56,189,248,.25); background:rgba(15,23,42,.8); backdrop-filter:blur(8px)}
   .ah-btn.primary{background:linear-gradient(135deg,var(--accent),var(--accent2)); color:#0f172a; border-color:transparent; box-shadow:0 0 20px rgba(56,189,248,.3)}
   .ah-btn.primary:hover{transform:translateY(-2px); box-shadow:0 8px 24px rgba(56,189,248,.4)}
   .ah-win{position:absolute; inset:0; background:rgba(3,6,16,.92); backdrop-filter:blur(16px); display:grid; place-items:center; z-index:10; animation:pop.6s cubic-bezier(.34,1.56,.64,1)}
   .ah-win-card{background:linear-gradient(180deg, rgba(15,23,42,.9), rgba(3,6,16,.9)); border:1px solid rgba(56,189,248,.25); border-radius:20px; padding:28px; text-align:center; max-width:340px; box-shadow:0 20px 60px rgba(0,0,0,.5), 0 0 40px rgba(56,189,248,.15)}
   .ah-confetti{position:absolute; width:8px; height:8px; border-radius:2px; pointer-events:none}
    @keyframes confetti{0%{transform:translateY(-20px) rotate(0) scale(1); opacity:1} 100%{transform:translateY(600px) rotate(720deg) scale(0); opacity:0}}
  `;
  container.appendChild(style);

  const vendor = window._0x4a2f;
  if(!vendor){ container.innerHTML='<div style="padding:40px;color:#f87171">Falta vendors~app.8f3c2a1b.chunk.js</div>'; return; }

  let lang = localStorage.getItem('wasa_lang')||'es';
  let categories = Object.keys(vendor.w).filter(k=>k.startsWith(lang+'_'));
  let currentCat = categories[0];
  let encWord = '';
  let plainWord = '';
  let guessed = new Set();
  let fails = 0;
  let maxFails = 6;
  let wins = parseInt(localStorage.getItem('wasa_ahorcado_wins')||'0');
  let losses = parseInt(localStorage.getItem('wasa_ahorcado_losses')||'0');
  let streak = parseInt(localStorage.getItem('wasa_ahorcado_streak')||'0');

  const root = document.createElement('div');
  root.className='wasa-ahorcado';
  root.innerHTML=`
    <div class="ah-top">
      <div class="ah-logo">AHORCADO • WASA • ${Object.values(vendor.w).flat().length} WORDS</div>
      <div class="ah-controls">
        <button class="ah-pill ${lang==='es'?'active':''}" data-lang="es">ES</button>
        <button class="ah-pill ${lang==='en'?'active':''}" data-lang="en">EN</button>
        <button class="ah-pill" id="ahHint">💡 HINT -0.05 WASA</button>
        <div class="ah-pill" style="background:rgba(251,191,36,.15); border-color:rgba(251,191,36,.3); color:#fbbf24">🏆 ${wins}W / ${losses}L • 🔥${streak}</div>
      </div>
    </div>
    <div class="ah-body">
      <div class="ah-left">
        <div class="ah-hangman"><svg viewBox="0 0 200 240" id="ahSvg"></svg></div>
      </div>
      <div class="ah-right">
        <div class="ah-category" id="ahCat">CATEGORIA</div>
        <div class="ah-word" id="ahWord"></div>
        <div class="ah-stats">
          <div class="ah-stat"><b id="ahFails">0 / 6</b><span>Fallos</span></div>
          <div class="ah-stat"><b id="ahLeft">26</b><span>Letras restantes</span></div>
          <div class="ah-stat"><b id="ahCoins">${(ctx.getCoins?ctx.getCoins().toFixed(3):'0')}</b><span>$WASA</span></div>
        </div>
        <div class="ah-keyboard" id="ahKb"></div>
        <div class="ah-actions">
          <button class="ah-btn" id="ahNewCat">🎲 Nueva categoria</button>
          <button class="ah-btn primary" id="ahNew">↻ Nueva palabra</button>
        </div>
      </div>
    </div>
  `;
  container.appendChild(root);

  function drawHangman(step){
    const svg = root.querySelector('#ahSvg');
    const parts = [
      '<line class="line" x1="20" y1="230" x2="100" y2="230" />', // base
      '<line class="line" x1="60" y1="230" x2="60" y2="20" />', // palo
      '<line class="line" x1="60" y1="20" x2="140" y2="20" />', // techo
      '<line class="line" x1="140" y1="20" x2="140" y2="50" />', // cuerda
      '<circle class="line body" cx="140" cy="70" r="20" />', // cabeza
      '<line class="line body" x1="140" y1="90" x2="140" y2="150" />', // cuerpo
      '<line class="line body" x1="140" y1="110" x2="115" y2="130" />', // brazo izq
      '<line class="line body" x1="140" y1="110" x2="165" y2="130" />', // brazo der
      '<line class="line body" x1="140" y1="150" x2="115" y2="185" />', // pierna izq
      '<line class="line body" x1="140" y1="150" x2="165" y2="185" />', // pierna der
    ];
    let html = '';
    // poste siempre visible
    for(let i=0;i<4;i++) html+=parts[i].replace('class="line"','class="line active"');
    // cuerpo según fails
    for(let i=0;i<Math.min(step,6);i++){
      const idx = 4+i;
      html+=parts[idx].replace('class="line','class="line active draw body');
    }
    svg.innerHTML = html;
    // animación shake en fallo
    if(step>0){
      svg.style.animation='none';
      svg.offsetHeight;
      svg.style.animation='shake.4s ease';
    }
  }

  function pickWord(){
    categories = Object.keys(vendor.w).filter(k=>k.startsWith(lang+'_'));
    if(!categories.includes(currentCat)) currentCat = categories[Math.floor(Math.random()*categories.length)];
    const pool = vendor.w[currentCat];
    encWord = pool[Math.floor(Math.random()*pool.length)];
    plainWord = vendor.d(encWord); // decodifica 43yf... -> PALABRA LIMPIA
    guessed = new Set();
    fails = 0;
    render();
  }

  function render(){
    // categoria linda
    const catName = currentCat.replace(lang+'_','').toUpperCase();
    root.querySelector('#ahCat').textContent = `${lang==='es'?'CATEGORIA':'CATEGORY'} • ${catName} • ${vendor.w[currentCat].length} WORDS`;
    // palabra
    const wordEl = root.querySelector('#ahWord');
    wordEl.innerHTML='';
    [...plainWord].forEach((ch,i)=>{
      if(ch===' '){
        const s=document.createElement('div'); s.className='ah-letter space'; wordEl.appendChild(s);
      } else {
        const d=document.createElement('div');
        d.className='ah-letter'+(guessed.has(ch)?' revealed':'');
        d.textContent=guessed.has(ch)?ch:'';
        d.style.animationDelay=(i*0.05)+'s';
        wordEl.appendChild(d);
      }
    });
    // stats
    root.querySelector('#ahFails').textContent=`${fails} / ${maxFails}`;
    root.querySelector('#ahLeft').textContent=26-guessed.size;
    drawHangman(fails);
    renderKb();
    checkEnd();
  }

  function renderKb(){
    const kb = root.querySelector('#ahKb');
    kb.innerHTML='';
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(l=>{
      const b=document.createElement('button');
      b.className='ah-key';
      b.textContent=l;
      if(guessed.has(l)){
        b.disabled=true;
        b.classList.add(plainWord.includes(l)?'ok':'bad');
      }
      b.onclick=()=>guess(l);
      kb.appendChild(b);
    });
  }

  function guess(letter){
    if(guessed.has(letter)||fails>=maxFails) return;
    guessed.add(letter);
    if(!plainWord.includes(letter)){
      fails++;
      // sonido visual
      root.querySelector('.ah-left').style.animation='shake.3s ease';
      setTimeout(()=>root.querySelector('.ah-left').style.animation='',300);
    } else {
      // pop en letras
      const wordEl = root.querySelector('#ahWord');
      [...plainWord].forEach((ch,i)=>{
        if(ch===letter){
          const el = wordEl.children[i];
          if(el){ el.classList.add('revealed'); el.textContent=letter; }
        }
      });
    }
    render();
  }

  function checkEnd(){
    const won = [...plainWord].every(c=>c===' '||guessed.has(c));
    const lost = fails>=maxFails;
    if(!won&&!lost) return;
    setTimeout(()=>{
      const isWin = won;
      if(isWin){
        wins++; streak++;
        localStorage.setItem('wasa_ahorcado_wins',wins);
        localStorage.setItem('wasa_ahorcado_streak',streak);
        if(ctx.addCoins){ /* premio chico validado por server en tu worker */ }
        launchConfetti();
      } else {
        losses++; streak=0;
        localStorage.setItem('wasa_ahorcado_losses',losses);
        localStorage.setItem('wasa_ahorcado_streak','0');
      }
      const winEl = document.createElement('div');
      winEl.className='ah-win';
      winEl.innerHTML=`<div class="ah-win-card">
        <div style="font-size:42px; animation:float 2s ease infinite">${isWin?'🎉':'💀'}</div>
        <div style="font-weight:800; font-size:18px; margin:12px 0">${isWin?(lang==='es'?'¡GANASTE!':'YOU WIN!'):(lang==='es'?'AHORCADO':'HANGED')}</div>
        <div style="font-size:12px; color:#94a3b8; margin-bottom:6px">${lang==='es'?'Palabra':'Word'}: <b style="color:#f8fafc; letter-spacing:.1em">${plainWord}</b></div>
        <div style="font-size:11px; color:#64748b; margin-bottom:16px">${catNameToHuman(currentCat)}</div>
        <button class="ah-btn primary" style="width:100%" onclick="this.closest('.ah-win').remove()"> ${lang==='es'?'Jugar otra':'Play again'} ↻</button>
      </div>`;
      root.appendChild(winEl);
      winEl.querySelector('button').onclick=()=>{ winEl.remove(); pickWord(); };
    },400);
  }

  function catNameToHuman(k){
    const map={
      es_animales:'Animales',en_animals:'Animals',
      es_tecnologia:'Tecnología',en_technology:'Technology',
      es_comida:'Comida',en_food:'Food',
      es_herramientas:'Herramientas',en_tools:'Tools',
      es_geo:'Geografía',en_geo:'Geography',
      es_transporte:'Transporte',en_transport:'Transport',
      es_profesiones:'Profesiones',en_professions:'Professions',
      es_sentimientos:'Sentimientos',en_feelings:'Feelings',
      es_colores:'Colores',en_colors:'Colors',
      es_lugares:'Lugares',en_places:'Places'
    };
    return map[k]||k;
  }

  function launchConfetti(){
    for(let i=0;i<40;i++){
      const c=document.createElement('div');
      c.className='ah-confetti';
      c.style.left=Math.random()*100+'%';
      c.style.top='-10px';
      c.style.background=`hsl(${180+Math.random()*120},100%,60%)`;
      c.style.animation=`confetti ${1.2+Math.random()*1.2}s ease ${Math.random()*0.3}s forwards`;
      c.style.transform=`rotate(${Math.random()*360}deg)`;
      root.appendChild(c);
      setTimeout(()=>c.remove(),2000);
    }
  }

  // eventos
  root.querySelector('#ahNew').onclick=()=>pickWord();
  root.querySelector('#ahNewCat').onclick=()=>{
    const cats = Object.keys(vendor.w).filter(k=>k.startsWith(lang+'_'));
    currentCat=cats[Math.floor(Math.random()*cats.length)];
    pickWord();
  };
  root.querySelectorAll('[data-lang]').forEach(b=>{
    b.onclick=()=>{
      lang=b.dataset.lang;
      localStorage.setItem('wasa_lang',lang);
      root.querySelectorAll('[data-lang]').forEach(x=>x.classList.toggle('active',x.dataset.lang===lang));
      categories=Object.keys(vendor.w).filter(k=>k.startsWith(lang+'_'));
      currentCat=categories[Math.floor(Math.random()*categories.length)];
      pickWord();
    };
  });
  root.querySelector('#ahHint').onclick=()=>{
    const hidden = [...plainWord].filter(c=>c!==' '&&!guessed.has(c));
    if(hidden.length===0) return;
    const coin = ctx.getCoins?ctx.getCoins():0;
    if(coin<0.05){ alert(lang==='es'?'Necesitás 0.05 WASA para hint':'Need 0.05 WASA for hint'); return; }
    if(ctx.setCoins) ctx.setCoins(coin-0.05);
    const rnd = hidden[Math.floor(Math.random()*hidden.length)];
    guess(rnd);
  };

  // teclado físico
  window.addEventListener('keydown', (e)=>{
    const k=e.key.toUpperCase();
    if(/^[A-Z]$/.test(k)) guess(k);
  });

  // init
  pickWord();
  // animación entrada
  root.animate([{opacity:0, transform:'translateY(12px)'},{opacity:1, transform:'translateY(0)'}],{duration:600, easing:'cubic-bezier(.34,1.56,.64,1)'});
}
