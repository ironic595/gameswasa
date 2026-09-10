// games/ahorcado/game.js - AHORCADO WASA v11 - Bilingue + x2 Ad + Animaciones
// Usa vendors~app.8f3c2a1b.chunk.js (2090 palabras ES+EN ofuscadas tipo 43yf35yt...)
export async function init(container, ctx){
  try{ await import('./vendors~app.8f3c2a1b.chunk.js'); }catch(e){ try{ await import('/games/ahorcado/vendors~app.8f3c2a1b.chunk.js'); }catch(_){ } }
  const vendor = window._0x4a2f || window.webpackChunkWasa?.['8f3c2a1b'];
  if(!vendor){ container.innerHTML='<div style="padding:40px;color:#f87171">Falta vendors~app.8f3c2a1b.chunk.js</div>'; return; }

  container.innerHTML='';
  const style=document.createElement('style');
  style.textContent=`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&family=JetBrains+Mono:wght@800&display=swap');
   .wasa-ahorcado{--bg:#030712;--accent:#38bdf8;--accent2:#818cf8;--yellow:#fbbf24; width:100%;height:100%;min-height:620px;background:radial-gradient(ellipse at 20% 10%,rgba(56,189,248,.16),transparent 60%),radial-gradient(ellipse at 80% 90%,rgba(192,132,252,.14),transparent 60%),var(--bg);display:flex;flex-direction:column;font-family:'Space Grotesk';color:#e2e8f0;overflow:hidden;position:relative}
   .ah-top{display:flex;justify-content:space-between;padding:12px 16px;background:rgba(15,23,42,.85);backdrop-filter:blur(12px);border-bottom:1px solid rgba(56,189,248,.15);gap:8px;flex-wrap:wrap}
   .ah-pill{border:1px solid rgba(56,189,248,.22);border-radius:20px;padding:5px 11px;font-size:10px;background:rgba(15,23,42,.8);cursor:pointer;transition:.25s;font-weight:700}
   .ah-pill.active{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#0f172a;box-shadow:0 0 18px rgba(56,189,248,.35)}
   .ah-pill.yellow{background:rgba(251,191,36,.14);border-color:rgba(251,191,36,.3);color:var(--yellow)}
   .ah-body{flex:1;display:grid;grid-template-columns:340px 1fr;min-height:0}
    @media(max-width:900px){.ah-body{grid-template-columns:1fr;grid-template-rows:300px 1fr}}
   .ah-left{background:rgba(15,23,42,.45);display:grid;place-items:center;position:relative}
   .ah-hangman{width:260px;height:260px;filter:drop-shadow(0 8px 24px rgba(0,0,0,.4))}
   .ah-hangman svg{width:100%;height:100%}
   .ah-line{stroke:#1e293b;stroke-width:3.2;stroke-linecap:round;fill:none;transition:.6s cubic-bezier(.34,1.56,.64,1)}
   .ah-line.active{stroke:#e2e8f0}
   .ah-line.body{stroke:var(--accent);stroke-width:4;filter:drop-shadow(0 0 10px rgba(56,189,248,.5))}
   .ah-line.draw{stroke-dasharray:400;stroke-dashoffset:400;animation:draw.9s forwards}
    @keyframes draw{to{stroke-dashoffset:0}} @keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}} @keyframes pop{0%{transform:scale(.4);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}} @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}} @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(251,191,36,.3)}50%{box-shadow:0 0 36px rgba(251,191,36,.5)}}
   .ah-right{padding:20px;display:flex;flex-direction:column;gap:16px;overflow:auto}
   .ah-word{display:flex;flex-wrap:wrap;gap:8px}
   .ah-letter{width:44px;height:54px;display:grid;place-items:center;font-family:'JetBrains Mono';font-size:22px;font-weight:800;background:rgba(15,23,42,.7);border-radius:10px;border:1px solid rgba(56,189,248,.12);border-bottom-width:3px;transition:.5s}
   .ah-letter.revealed{border-color:var(--accent);background:rgba(56,189,248,.18);color:#f8fafc;animation:pop.5s}
   .ah-keyboard{display:grid;grid-template-columns:repeat(auto-fill,minmax(38px,1fr));gap:7px}
   .ah-key{height:40px;border-radius:12px;background:rgba(15,23,42,.85);border:1px solid rgba(56,189,248,.16);font-weight:800;cursor:pointer;color:#cbd5e1}
   .ah-key.ok{background:linear-gradient(135deg,#22c55e,#16a34a);color:#052e16;box-shadow:0 0 18px rgba(34,197,94,.45);opacity:1}
   .ah-key.bad{background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;animation:shake.45s;opacity:1}
   .ah-win{position:absolute;inset:0;background:rgba(3,6,16,.88);backdrop-filter:blur(18px);display:grid;place-items:center;z-index:20;animation:pop.6s}
   .ah-win-card{background:linear-gradient(180deg,rgba(15,23,42,.96),rgba(3,6,16,.98));border:1px solid rgba(56,189,248,.26);border-radius:22px;padding:26px 24px;text-align:center;width:min(360px,92vw);box-shadow:0 24px 80px rgba(0,0,0,.6)}
   .ah-win-icon{font-size:44px;animation:float 2.2s infinite}
   .ah-win-reward{display:flex;align-items:center;justify-content:center;gap:8px;background:rgba(251,191,36,.12);border:1px solid rgba(251,191,36,.22);border-radius:12px;padding:10px;margin:14px 0;font-weight:700;color:#fbbf24}
   .ah-win-btn{width:100%;padding:13px;border-radius:14px;font-weight:800;font-size:11px;text-transform:uppercase;cursor:pointer;border:1px solid rgba(56,189,248,.2);transition:.25s}
   .ah-win-btn.x2{background:linear-gradient(135deg,#fbbf24,#f59e0b 55%,#d97706);color:#000;box-shadow:0 0 22px rgba(251,191,36,.4);animation:glow 2s infinite}
   .ah-win-btn.secondary{background:linear-gradient(135deg,#38bdf8,#818cf8);color:#0f172a}
   .ah-win-btn.ghost{background:rgba(15,23,42,.7);color:#94a3b8}
   .ah-confetti{position:absolute;width:8px;height:8px;border-radius:2px;pointer-events:none;z-index:30}
    @keyframes confetti{0%{transform:translateY(-20px) rotate(0) scale(1);opacity:1}100%{transform:translateY(700px) rotate(760deg) scale(0);opacity:0}}
   .ah-ad-overlay{position:absolute;inset:0;background:rgba(3,6,16,.92);backdrop-filter:blur(12px);z-index:25;display:grid;place-items:center}
  `;
  container.appendChild(style);

  let lang=localStorage.getItem('wasa_lang')||'es';
  let currentCat=Object.keys(vendor.w).find(k=>k.startsWith(lang+'_'))||Object.keys(vendor.w)[0];
  let encWord='',plainWord='',guessed=new Set(),fails=0,maxFails=6;
  let wins=parseInt(localStorage.getItem('wasa_ahorcado_wins')||'0'),streak=parseInt(localStorage.getItem('wasa_ahorcado_streak')||'0');
  let baseReward=0.02, doubled=false, rewardClaimed=false;

  const root=document.createElement('div'); root.className='wasa-ahorcado';
  root.innerHTML=`
    <div class="ah-top">
      <div style="font-weight:800;font-size:11px;letter-spacing:.12em">🪢 AHORCADO • ${Object.values(vendor.w).flat().length} WORDS</div>
      <div style="display:flex;gap:6px">
        <button class="ah-pill ${lang==='es'?'active':''}" data-lang="es">ES</button>
        <button class="ah-pill ${lang==='en'?'active':''}" data-lang="en">EN</button>
        <button class="ah-pill" id="ahHint">💡 HINT -0.05</button>
        <button class="ah-pill yellow" id="ahStats">🏆 ${wins}W • 🔥${streak}</button>
        <div class="ah-pill yellow" style="cursor:default">${(ctx.getCoins?ctx.getCoins().toFixed(3):'0')} WASA</div>
      </div>
    </div>
    <div class="ah-body">
      <div class="ah-left"><div class="ah-hangman"><svg viewBox="0 0 200 240" id="ahSvg"></svg></div></div>
      <div class="ah-right">
        <div style="font-size:10px;letter-spacing:.16em;color:#38bdf8;font-weight:800" id="ahCat"></div>
        <div class="ah-word" id="ahWord"></div>
        <div style="display:flex;gap:8px"><div style="flex:1;background:rgba(15,23,42,.6);border-radius:12px;padding:10px"><b id="ahFails" style="font-family:JetBrains Mono">0 / 6</b><div style="font-size:9px;color:#94a3b8">FALLOS</div></div><div style="flex:1;background:rgba(15,23,42,.6);border-radius:12px;padding:10px"><b id="ahReward">+0.020</b><div style="font-size:9px;color:#94a3b8">REWARD</div></div></div>
        <div class="ah-keyboard" id="ahKb"></div>
        <div style="display:flex;gap:8px"><button class="ah-win-btn ghost" id="ahNewCat" style="flex:1">🎲 Categoria</button><button class="ah-win-btn secondary" id="ahNew" style="flex:1">↻ Nueva</button></div>
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

  function drawHangman(step){
    const svg=root.querySelector('#ahSvg');
    const parts=['<line class="ah-line" x1="20" y1="230" x2="100" y2="230" />','<line class="ah-line" x1="60" y1="230" x2="60" y2="20" />','<line class="ah-line" x1="60" y1="20" x2="140" y2="20" />','<line class="ah-line" x1="140" y1="20" x2="140" y2="50" />','<circle class="ah-line body" cx="140" cy="70" r="20" />','<line class="ah-line body" x1="140" y1="90" x2="140" y2="150" />','<line class="ah-line body" x1="140" y1="110" x2="115" y2="130" />','<line class="ah-line body" x1="140" y1="110" x2="165" y2="130" />','<line class="ah-line body" x1="140" y1="150" x2="115" y2="185" />','<line class="ah-line body" x1="140" y1="150" x2="165" y2="185" />'];
    let html=''; for(let i=0;i<4;i++) html+=parts[i].replace('ah-line','ah-line active');
    for(let i=0;i<Math.min(step,6);i++) html+=parts[4+i].replace('ah-line','ah-line active draw body');
    svg.innerHTML=html; if(step>0){ svg.style.animation='none'; svg.offsetHeight; svg.style.animation='shake.4s ease'; }
  }

  function pickWord(){
    const cats=Object.keys(vendor.w).filter(k=>k.startsWith(lang+'_'));
    if(!cats.includes(currentCat)) currentCat=cats[Math.floor(Math.random()*cats.length)];
    encWord=vendor.w[currentCat][Math.floor(Math.random()*vendor.w[currentCat].length)];
    plainWord=vendor.d(encWord); guessed=new Set(); fails=0; doubled=false; rewardClaimed=false;
    baseReward=0.01+(plainWord.length*0.003); root.querySelector('#ahReward').textContent='+'+baseReward.toFixed(3); render();
  }

  function render(){
    root.querySelector('#ahCat').textContent=(lang==='es'?'CATEGORIA':'CATEGORY')+' • '+(currentCat.replace(lang+'_','').toUpperCase())+' • '+vendor.w[currentCat].length+' WORDS';
    const wordEl=root.querySelector('#ahWord'); wordEl.innerHTML='';
    [...plainWord].forEach((ch,i)=>{ const d=document.createElement('div'); if(ch===' '){d.className='ah-letter space';}else{d.className='ah-letter'+(guessed.has(ch)?' revealed':''); d.textContent=guessed.has(ch)?ch:''; d.style.animationDelay=(i*0.045)+'s';} wordEl.appendChild(d); });
    root.querySelector('#ahFails').textContent=fails+' / 6'; drawHangman(fails);
    const kb=root.querySelector('#ahKb'); kb.innerHTML='';
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(l=>{ const b=document.createElement('button'); b.className='ah-key'; b.textContent=l; if(guessed.has(l)){ b.disabled=true; b.classList.add(plainWord.includes(l)?'ok':'bad'); } b.onclick=()=>{ if(!guessed.has(l)){ guessed.add(l); if(!plainWord.includes(l)) fails++; render(); } }; kb.appendChild(b); });
    const won=[...plainWord].every(c=>c===' '||guessed.has(c)), lost=fails>=6;
    if(won||lost) setTimeout(()=>showWin(won),420);
  }

  function launchConfetti(){ for(let i=0;i<48;i++){ const c=document.createElement('div'); c.className='ah-confetti'; c.style.left=Math.random()*100+'%'; c.style.top='-10px'; c.style.background='hsl('+(190+Math.random()*140)+',100%,62%)'; c.style.animation='confetti '+(1.1+Math.random()*1.3)+'s ease '+(Math.random()*.25)+'s forwards'; root.appendChild(c); setTimeout(()=>c.remove(),2300); } }

  function showAd(onDone){
    const ad=document.createElement('div'); ad.className='ah-ad-overlay';
    ad.innerHTML='<div style="background:rgba(15,23,42,.95);border:1px solid rgba(56,189,248,.25);border-radius:16px;padding:20px;width:min(320px,90vw);text-align:center"><div style="font-size:28px">📺</div><div style="font-weight:800;margin:8px 0">Viendo Ad para x2...</div><div style="height:4px;background:rgba(56,189,248,.15);border-radius:4px;overflow:hidden"><div id="adP" style="height:100%;width:0%;background:linear-gradient(90deg,#38bdf8,#818cf8);transition:width.1s linear"></div></div><div style="font-size:10px;color:#64748b;margin-top:8px" id="adT">5s</div></div>';
    root.appendChild(ad); let p=0; const iv=setInterval(()=>{ p+=3; ad.querySelector('#adP').style.width=p+'%'; ad.querySelector('#adT').textContent=Math.max(0,5-Math.floor(p/20))+'s'; if(p>=100){ clearInterval(iv); ad.remove(); onDone(); } },70);
    // Aca conecta tu ad real: if(window.showRewardedAd) window.showRewardedAd({onComplete: onDone})
  }

  function showWin(isWin){
    if(isWin &&!rewardClaimed){ rewardClaimed=true; addCoinsServer(baseReward,'win_'+plainWord.length).then(()=>launchConfetti()); wins++; streak++; localStorage.setItem('wasa_ahorcado_wins',wins); localStorage.setItem('wasa_ahorcado_streak',streak); }
    if(!isWin){ let l=parseInt(localStorage.getItem('wasa_ahorcado_losses')||'0')+1; localStorage.setItem('wasa_ahorcado_losses',l); localStorage.setItem('wasa_ahorcado_streak','0'); }
    root.querySelector('#ahStats').textContent='🏆 '+wins+'W • 🔥'+streak;

    const winEl=document.createElement('div'); winEl.className='ah-win';
    const rewardText='+'+baseReward.toFixed(3)+' WASA', doubleText='+'+(baseReward*2).toFixed(3)+' WASA';
    winEl.innerHTML='<div class="ah-win-card"><div class="ah-win-icon">'+(isWin?'🎉':'💀')+'</div><div style="font-weight:900;font-size:18px;margin:14px 0 6px">'+(isWin?(lang==='es'?'¡GANASTE!':'YOU WIN!'):(lang==='es'?'¡AHORCADO!':'HANGED!'))+'</div><div style="font-size:12px;color:#94a3b8">Palabra: <b style="color:#f8fafc;font-family:JetBrains Mono">'+plainWord+'</b></div><div style="font-size:10px;color:#64748b;margin-bottom:14px;text-transform:uppercase">'+currentCat+'</div>'+(isWin?'<div class="ah-win-reward">💰 <span>Ganaste</span> <b>'+rewardText+'</b></div>':'')+'<div style="display:flex;flex-direction:column;gap:8px">'+(isWin?'<button class="ah-win-btn x2" id="btnX2">📺 Multiplicar x2 viendo Ad • '+doubleText+'</button>':'')+'<button class="ah-win-btn secondary" id="btnAgain">JUGAR OTRA ↻</button><button class="ah-win-btn ghost" id="btnClose">Cerrar ✕</button></div></div>';
    root.appendChild(winEl);

    const btnX2=winEl.querySelector('#btnX2');
    if(btnX2){ btnX2.onclick=()=>{ if(doubled) return; btnX2.disabled=true; btnX2.textContent='⏳ Cargando Ad...'; showAd(()=>{ doubled=true; addCoinsServer(baseReward,'double_ad_'+plainWord.length).then(()=>{ btnX2.textContent='✅ '+doubleText+' acreditado!'; btnX2.style.background='linear-gradient(135deg,#22c55e,#16a34a)'; winEl.querySelector('.ah-win-reward').innerHTML='<b style="color:#22c55e">'+doubleText+' TOTAL</b> • x2 activado'; launchConfetti(); launchConfetti(); }); }); }; }

    winEl.querySelector('#btnAgain').onclick=()=>{ winEl.remove(); pickWord(); };
    winEl.querySelector('#btnClose').onclick=()=> winEl.remove();
  }

  root.querySelector('#ahNew').onclick=pickWord;
  root.querySelector('#ahNewCat').onclick=()=>{ const cats=Object.keys(vendor.w).filter(k=>k.startsWith(lang+'_')); currentCat=cats[Math.floor(Math.random()*cats.length)]; pickWord(); };
  root.querySelectorAll('[data-lang]').forEach(b=>{ b.onclick=()=>{ lang=b.dataset.lang; localStorage.setItem('wasa_lang',lang); root.querySelectorAll('[data-lang]').forEach(x=>x.classList.toggle('active',x.dataset.lang===lang)); currentCat=Object.keys(vendor.w).filter(k=>k.startsWith(lang+'_'))[0]; pickWord(); }; });
  root.querySelector('#ahHint').onclick=()=>{ const hidden=[...plainWord].filter(c=>c!==' '&&!guessed.has(c)); if(hidden.length===0) return; if((ctx.getCoins?ctx.getCoins():0)<0.05){ alert('Necesitás 0.05 WASA'); return; } addCoinsServer(-0.05,'hint').then(()=>{ const rnd=hidden[Math.floor(Math.random()*hidden.length)]; if(!guessed.has(rnd)){ guessed.add(rnd); if(!plainWord.includes(rnd)) fails++; render(); } }); };

  window.addEventListener('keydown', e=>{ const k=e.key.toUpperCase(); if(/^[A-Z]$/.test(k)&&!guessed.has(k)){ guessed.add(k); if(!plainWord.includes(k)) fails++; render(); } });
  pickWord();
}
