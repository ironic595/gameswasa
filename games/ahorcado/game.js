// /games/ahorcado/game.js - v19 - SONIDOS + SAPO IA CON PC
export async function init(container, args){
  const WORKER_URL = window.WASA_CONFIG?.WORKER_URL || 'https://games-wasa-worker.javimsites.workers.dev/';
  const getDeviceId = ()=> window.getDeviceId?window.getDeviceId():(()=>{let id=localStorage.getItem('wasa_device_id'); if(!id){id='dev_'+Math.random().toString(36).slice(2)+Date.now().toString(36); localStorage.setItem('wasa_device_id',id);} return id;})();
  const base='/games/ahorcado/';
  const candidates=['vendors-app.8f3c2a1b.chunk.js','vendors~app.8f3c2a1b.chunk.js'];
  const FROG_URL = base+'frog.png';
  const FROG_WIN = base+'frog-win.png';
  const FROG_LOSE = base+'frog-lose.png';

  let actx=null;
  function ctx(){ if(!actx) actx=new (window.AudioContext||window.webkitAudioContext)(); return actx; }
  function beep(f,d,type='sine',v=0.3){
    try{ const c=ctx(); const o=c.createOscillator(); const g=c.createGain(); o.type=type; o.frequency.value=f; g.gain.value=v; o.connect(g); g.connect(c.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+d); o.stop(c.currentTime+d); }catch{}
  }
  const S={
    hit(){ beep(880,0.12,'sine',0.4); setTimeout(()=>beep(1320,0.12,'sine',0.3),80); },
    miss(){ beep(180,0.35,'sawtooth',0.3); },
    key(){ beep(600,0.06,'square',0.15); },
    win(){ [523,659,784,1046].forEach((f,i)=>setTimeout(()=>beep(f,0.25,'sine',0.35),i*120)); },
    lose(){ [400,300,200,120].forEach((f,i)=>setTimeout(()=>beep(f,0.3,'sawtooth',0.35),i*150)); },
    coin(){ [1200,1600,2000].forEach((f,i)=>setTimeout(()=>beep(f,0.12,'sine',0.4),i*90)); }
  };

  function safeDecode(s,key){ try{ const bin=atob(s); const out=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) out[i]=bin.charCodeAt(i)^key.charCodeAt(i%key.length); return new TextDecoder().decode(out); }catch{return '';} }
  async function loadVendor(){ if(window._0x4a2f || window.webpackChunkWasa?.['8f3c2a1b']) return true; for(const n of candidates){ const ok=await new Promise(r=>{ const s=document.createElement('script'); s.src=base+n+'?t='+Date.now(); s.async=true; s.onload=()=>r(true); s.onerror=()=>r(false); document.head.appendChild(s); }); if(ok && (window._0x4a2f || window.webpackChunkWasa?.['8f3c2a1b'])) return true; } return false; }

  container.innerHTML=`
  <style>
.ah{background:#D4A12C;color:#2b1a0a;width:100%;height:100%;display:flex;flex-direction:column;font-family:'Space Grotesk',system-ui;overflow:hidden;position:relative}
.ah-top{height:48px;display:flex;justify-content:space-between;align-items:center;padding:0 12px;background:#B88518;border-bottom:2px solid rgba(0,0,0,.15);flex-shrink:0;gap:8px}
.ah-lang{display:flex;gap:6px;background:#fff3;border-radius:20px;padding:3px}
.ah-lang button{padding:5px 12px;border-radius:16px;border:0;font-weight:800;font-size:11px;cursor:pointer;background:transparent;color:#5a3a00}
.ah-lang button.active{background:#2b1a0a;color:#FFD86A}
.ah-wrap{flex:1;display:flex;justify-content:center;align-items:center;padding:12px;overflow:auto;background:radial-gradient(ellipse at 50% 0%, rgba(255,255,255,.25) 0%, transparent 60%), #D4A12C}
.ah-body{display:flex;gap:20px;align-items:flex-start;justify-content:center;margin:auto}
.ah-tower{flex:0 0 300px;width:300px;height:440px;position:relative;overflow:visible;background:transparent;border:0;box-shadow:none}
.ah-water{position:absolute;bottom:0;left:20px;right:20px;height:36px;background:#5DE0F5;border:3px solid #1aa3b8;border-radius:18px;display:flex;align-items:center;justify-content:center;font-weight:900;color:#0a4a55;z-index:2}
.ah-water-img-fallback{position:absolute;bottom:0;left:0;width:100%;height:80px;object-fit:cover;border-radius:0 0 24px 24px;z-index:2}
.ah-plank{position:absolute;left:20px;right:20px;height:20px;background:linear-gradient(180deg,#FF8C1A,#CC5A00);border:2px solid #7a2e00;border-radius:10px;box-shadow:0 3px 0 rgba(0,0,0,.25);transition:transform.6s cubic-bezier(.6,-0.28,.74,.05), opacity.4s;z-index:3}
.ah-plank.broken{transform:translateY(600px) rotate(35deg);opacity:0}
.ah-frog{position:absolute;width:88px;height:88px;left:50%;transform:translateX(-50%);transition:top.45s cubic-bezier(.34,1.56,.64,1), transform.5s ease;z-index:6;object-fit:contain;filter:drop-shadow(0 6px 8px rgba(0,0,0,.35))}
.ah-frog.fall{top:400px!important;transform:translateX(-50%) rotate(25deg) scale(.8)}
.ah-panel{flex:0 0 360px;width:360px;display:flex;flex-direction:column;gap:10px}
.ah-card{background:#fffef6;border:2px solid #8a5a00;border-radius:14px;padding:12px;box-shadow:0 6px 18px rgba(0,0,0,.15)}
.ah-word{font-size:26px;letter-spacing:5px;font-weight:900;text-align:center;font-family:monospace;min-height:34px;color:#2b1a0a}
.ah-keys{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.ah-key{height:38px;border-radius:8px;background:#fff;border:2px solid #8a5a00;color:#2b1a0a;font-weight:800;cursor:pointer;touch-action:manipulation}
.ah-key.used{opacity:.3;pointer-events:none}
.ah-key.hit{background:#2ECC71;border-color:#1a7a42;color:#fff}
.ah-key.miss{background:#FF3B30;border-color:#7a0000;color:#fff}
.ah-win{position:absolute;inset:0;background:rgba(0,0,0,.82);backdrop-filter:blur(8px);display:grid;place-items:center;z-index:50;padding:16px}
.ah-win-card{background:#fffef6;border:3px solid #8a5a00;border-radius:22px;padding:18px;width:min(420px,94vw);text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.45)}
.ah-sapo-img{width:300px;height:300px;object-fit:contain;margin:0 auto 12px;display:block;filter:drop-shadow(0 12px 18px rgba(0,0,0,.4))}
.ah-bubble{background:#2b1a0a;color:#FFD86A;border-radius:16px 16px 16px 4px;padding:10px 14px;font-size:13px;font-weight:700;line-height:1.3;margin:0 auto 12px;max-width:360px;position:relative}
.ah-bubble{position:relative;margin-bottom:14px}.ah-bubble:after{content:'';position:absolute;bottom:-8px;left:50%;margin-left:-8px;width:16px;height:16px;background:inherit;transform:rotate(45deg);border-radius:0 0 2px 0}
.ah-timer{height:10px;background:#2b1a0a22;border-radius:10px;overflow:hidden;border:1px solid #8a5a00;margin:6px 0}
.ah-timer-bar{height:100%;background:linear-gradient(90deg,#2ECC71,#00F0FF);transition:width 1s linear,width .3s ease}
.ah-timer-bar.warn{background:linear-gradient(90deg,#FF8C00,#FF3B30)}
.ah-timer-text{text-align:center;font-size:10px;font-weight:900;letter-spacing:.08em;margin-top:2px}
  @media(max-width:900px){.ah-body{flex-direction:column}.ah-tower,.ah-panel{width:min(100vw - 20px, 360px);flex:0 0 auto}.ah-tower{height:360px}}
  </style>
  <div class="ah"><div class="ah-top">
    <div style="font-weight:900;font-size:11px;letter-spacing:.12em">Guess the word: AI Expert Toad</div>
    <div class="ah-lang"><button id="langEs" class="active">ES 🇪🇸</button><button id="langEn">EN 🇺🇸</button></div>
    <select id="catSel" style="height:32px;border-radius:16px;border:2px solid #8a5a00;background:#fffef6;padding:0 8px;font-weight:700;font-size:11px;max-width:140px"></select>
  </div>
  <div class="ah-wrap"><div class="ah-body">
    <div class="ah-tower" id="tower">
      <img src="water.png" id="ah-water-img" style="position:absolute;bottom:0;left:0;width:100%;height:80px;object-fit:cover;border-radius:0 0 24px 24px;z-index:2;display:block" alt="AGUA" onerror="this.style.display='none'; document.getElementById('ah-water-fallback').style.display='flex'">
      <div id="ah-water-fallback" class="ah-water" style="display:none">💧 AGUA 💧</div>
    </div>
    <div class="ah-panel">
      <div class="ah-card"><div id="ah-word" class="ah-word">CARGANDO...</div><div id="ah-hint" style="text-align:center;font-size:10px;opacity:.6"></div><div class="ah-timer"><div id="ah-timer-bar" class="ah-timer-bar" style="width:100%"></div></div><div id="ah-timer-text" class="ah-timer-text">30s</div></div>
      <div class="ah-card"><div id="ah-keys" class="ah-keys"></div></div>
    </div>
  </div></div>
  <div id="ah-win"></div></div>`;

  const tower=container.querySelector('#tower'); const elWord=container.querySelector('#ah-word'); const elKeys=container.querySelector('#ah-keys'); const elHint=container.querySelector('#ah-hint'); const elWin=container.querySelector('#ah-win'); const catSel=container.querySelector('#catSel'); const langEs=container.querySelector('#langEs'); const langEn=container.querySelector('#langEn');
  const loaded=await loadVendor(); if(!loaded){ elWord.textContent='Falta vendor'; return; }
  const chunk=window._0x4a2f || window.webpackChunkWasa['8f3c2a1b']; const key=chunk.k; const dict=chunk.w;
  let currentLang='es'; const CACHE_KEY='sapo_cache_mostaza_v27_waterPNG'; let cache={}; try{ cache=JSON.parse(localStorage.getItem(CACHE_KEY)||'{}'); }catch{}
  async function getWords(cat){ if(cache[cat]?.length>5) return cache[cat]; const hashes=dict[cat]||[]; const out=[]; for(let i=0;i<hashes.length;i+=40){ for(let j=i;j<Math.min(i+40,hashes.length);j++){ const w=safeDecode(hashes[j],key); if(w.length>2) out.push(w); } if(i%120===0) await new Promise(r=>setTimeout(r,0)); } cache[cat]=out; try{ localStorage.setItem(CACHE_KEY,JSON.stringify(cache)); }catch{} return out; }
  function getCatsByLang(lang){ return Object.keys(dict).filter(c=>c.startsWith(lang+'_')); }
  function refreshCatSelect(){ const cats=getCatsByLang(currentLang); catSel.innerHTML=''; cats.forEach(c=>{ const o=document.createElement('option'); o.value=c; o.textContent=c.replace(currentLang+'_','').toUpperCase(); catSel.appendChild(o); }); }

  const PLANK_POS=[10,70,130,190,250,310];
  
  let timerIv=null, timeLeft=30, maxTime=30, isPaused=false;
  const timerBar=container.querySelector('#ah-timer-bar');
  const timerText=container.querySelector('#ah-timer-text');
  function startTimer(){
    clearInterval(timerIv);
    timeLeft=maxTime; maxTime=30;
    updateTimerUI();
    timerIv=setInterval(()=>{
      if(isPaused) return;
      timeLeft--;
      updateTimerUI();
      if(timeLeft<=0){
        clearInterval(timerIv);
        S.lose();
        showTimeOut();
      }
    },1000);
  }
  function updateTimerUI(){
    const pct=Math.max(0,(timeLeft/maxTime)*100);
    if(timerBar){ timerBar.style.width=pct+'%'; timerBar.classList.toggle('warn', timeLeft<=15); }
    if(timerText){ timerText.textContent=timeLeft+'s'; timerText.style.color=timeLeft<=10?'#FF3B30':'#2b1a0a'; }
  }
  function showTimeOut(){
    isPaused=true;
    const L=t();
    elWin.innerHTML=`<div class="ah-win"><div class="ah-win-card" style="background:#fff3cd;border-color:#8a5a00;min-width:380px">
      <h2 style="margin:0 0 12px;font-weight:900;color:#8a5a00;font-size:22px">${currentLang==='en'?'TIME IS UP!':'¡TIEMPO AGOTADO!'}</h2>
      <div class="ah-bubble" style="background:#8a5a00;color:#FFD86A">${currentLang==='en'?`As a certified AI expert, I must inform you that your time has expired. My model calculated ${maxTime}s and you failed. Watch a rewarded ad to get more time. ⏰`:`En mi carácter de experto certificado en IA, debo informarte que tu tiempo se ha agotado. Mi modelo había calculado ${maxTime}s y no lo lograste. Puedes mirar un anuncio para conseguir más tiempo ⏰`}</div>
      <img src="${FROG_LOSE}" class="ah-sapo-img" style="width:300px;height:300px;object-fit:contain;margin:8px auto 12px;display:block;filter:drop-shadow(0 12px 18px rgba(0,0,0,.4))" onerror="this.style.display='none'">
      <button id="btnTimeoutContinue" style="width:100%;height:50px;border-radius:24px;background:#2b1a0a;color:#fff;font-weight:900;border:0;cursor:pointer;margin-top:12px">${L.retryBtn}</button>
      <button id="btnTimeoutAd" style="width:100%;height:54px;margin-top:10px;border-radius:26px;background:linear-gradient(90deg,#FF8C00,#FF00D4);color:#fff;font-weight:900;border:0;cursor:pointer;font-size:14px">${currentLang==='en'?'+30s WATCH AD':' +30s VER ANUNCIO'}</button>
    </div></div>`;
    elWin.querySelector('#btnTimeoutContinue').onclick=()=>{ isPaused=false; incForced(); if(gamesWithoutAd>=2){ showForcedAd(()=>{ resetForced(); newRound(); }); } else { newRound(); } };
    elWin.querySelector('#btnTimeoutAd').onclick=()=>{ window.vrAd=1; window.vrAdType='extra_time'; window._sapoExtraTimePending=true; elWin.querySelector('#btnTimeoutAd').textContent=t().loadingAd; };
  }


  let planks=[], frogEl, word, guessed, errors, maxErrors=6, sess=null, claiming=false;
  const FORCED_KEY='sapo_games_without_ad'; let gamesWithoutAd=parseInt(localStorage.getItem(FORCED_KEY)||'0');
  function resetForced(){ gamesWithoutAd=0; localStorage.setItem(FORCED_KEY,'0'); }
  function incForced(){ gamesWithoutAd++; localStorage.setItem(FORCED_KEY,String(gamesWithoutAd)); }
  async function startSess(){ try{ const email=localStorage.getItem('wasa_email'), wallet=localStorage.getItem('wasa_wallet'), device_id=getDeviceId(); const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start_game_session',email,wallet,device_id,game_slug:'ahorcado'})}); const j=await r.json(); if(j.ok) sess=j.session_id; }catch{} }
  async function claim(isDouble,ad){ if(claiming) return false; if(!sess) await startSess(); if(!sess) return false; claiming=true; try{ const email=localStorage.getItem('wasa_email'), wallet=localStorage.getItem('wasa_wallet'), device_id=getDeviceId(); const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'claim_reward',session_id:sess,email,wallet,device_id,game_slug:'ahorcado',ad_watched:ad,double_reward:isDouble})}); const j=await r.json(); if(j.ok){ const bal=j.wasa_balance??j.guest_balance??0; if(j.is_guest) localStorage.setItem('wasa_coins_guest',bal); else localStorage.setItem('wasa_coins',bal); if(window.setCoinsUI) window.setCoinsUI(bal); sess=null; claiming=false; return true; } }catch{} claiming=false; return false; }
  function showForcedAd(next){ elWin.innerHTML=''; window._forcedNext=next; window._sapoForcedPending=true; window.vrAdType='interstitial'; window.vrAd=1; }
  function buildTower(){ tower.querySelectorAll('.ah-plank,.ah-frog').forEach(e=>e.remove()); planks=[]; PLANK_POS.forEach((y,i)=>{ const p=document.createElement('div'); p.className='ah-plank'; p.style.top=y+'px'; p.style.width=(260 - i*10)+'px'; p.style.left=(20 + i*5)+'px'; tower.appendChild(p); planks.push(p); }); frogEl=document.createElement('img'); frogEl.className='ah-frog'; frogEl.src=FROG_URL; frogEl.alt='🐸'; frogEl.onerror=()=>{ frogEl.outerHTML=`<div class="ah-frog" style="font-size:64px;display:grid;place-items:center">🐸</div>`; frogEl=tower.querySelector('.ah-frog'); }; frogEl.style.top=(PLANK_POS[0]-68)+'px'; tower.appendChild(frogEl); }
  async function newRound(){ const cat=catSel.value||getCatsByLang(currentLang)[0]; const words=await getWords(cat); word=words[Math.floor(Math.random()*words.length)]; guessed=new Set(); errors=0; elWin.innerHTML=''; sess=null; startSess(); elHint.textContent=`${cat.toUpperCase()} • ${words.length} palabras`; buildTower(); buildKeys(); update(); startTimer(); }
  function buildKeys(){
    elKeys.innerHTML='';
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(l=>{
      const b=document.createElement('button'); b.className='ah-key'; b.textContent=l;
      b.onclick=()=>{
        if(guessed.has(l)) return; try{ ctx().resume(); }catch{} S.key();
        guessed.add(l);
        if(!word.includes(l)){ const plankToBreak=planks[errors]; if(plankToBreak) plankToBreak.classList.add('broken'); errors++; b.classList.add('miss'); S.miss(); if(errors<maxErrors){ const nextTop=PLANK_POS[errors]; if(frogEl) frogEl.style.top=(nextTop-68)+'px'; } else{ if(frogEl) frogEl.classList.add('fall'); } if(navigator.vibrate) navigator.vibrate(30); }
        else{ b.classList.add('hit'); S.hit(); }
        b.classList.add('used'); update();
      };
      elKeys.appendChild(b);
    });
  }
  function t(){
    if(currentLang==='en'){
      return {
        winTitle:'YOU WON!',
        loseTitle:'FELL INTO WATER!',
        winBubble:(w)=>`As a certified AI expert with 10 years of experience, I can confirm my model correctly predicted the word was: <b>${w}</b> ✅`,
        loseBubble:(w)=>`In my capacity as a certified AI expert and industry reference, I must ratify that your answer is incorrect. The word was: <b>${w}</b>. Keep participating. 🤖❌`,
        continueBtn:'CONTINUE +0.01 $WASA',
        x2Btn:'X2 AD → +0.02 $WASA',
        retryBtn:'RETRY',
        x2credited:'X2 CREDITED!',
        x2bubble:'Validated by my certified AI model! +0.02 WASA credited. As an expert, I confirm. 🚀',
        validating:'VALIDATING...',
        accredited:'✅ +0.01 CREDITED',
        loadingAd:'LOADING AD...',
        errorRetry:'ERROR - RETRY'
      };
    }else{
      return {
        winTitle:'¡GANASTE!',
        loseTitle:'¡SE CAYÓ AL AGUA!',
        winBubble:(w)=>`Como experto certificado en IA con 10 años de experiencia, puedo confirmar que mi modelo predijo correctamente que la palabra era: <b>${w}</b> ✅`,
        loseBubble:(w)=>`En mi carácter de experto certificado en IA y referente del sector, debo ratificar que tu respuesta es incorrecta.<b>${w}</b>. Intentalo de nuevo. 🤖❌`,
        continueBtn:'CONTINUAR +0.01 $WASA',
        x2Btn:'VER ANUNCIO x2 → +0.02 $WASA',
        retryBtn:'REINTENTAR',
        x2credited:'¡X2 ACREDITADO!',
        x2bubble:'¡Validado por mi modelo certificado de IA! +0.02 WASA acreditados. Como experto, lo confirmo. 🚀',
        validating:'VALIDANDO...',
        accredited:'✅ +0.01 ACREDITADO',
        loadingAd:'CARGANDO...',
        errorRetry:'ERROR - REINTENTAR'
      };
    }
  }

  function update(){
    const display=word.split('').map(ch=>guessed.has(ch)?ch:'_').join(' ');
    elWord.textContent=display; const win=!display.includes('_'); const lose=errors>=maxErrors;
    const L=t();
    if(win){ clearInterval(timerIv);
      try{ ctx().resume(); }catch{} S.win();
      elWin.innerHTML=`<div class="ah-win"><div class="ah-win-card">
        <h2 style="margin:0 0 12px;font-weight:900;color:#2b1a0a;font-size:22px">${L.winTitle}</h2>
        <div class="ah-bubble">${L.winBubble(word)}</div>
        <img src="${FROG_WIN}" class="ah-sapo-img" style="width:260px;height:260px;object-fit:contain;margin:8px auto 12px;display:block;filter:drop-shadow(0 12px 18px rgba(0,0,0,.4))" onerror="this.style.display='none'">
        <button id="btnClaim" style="width:100%;height:54px;border-radius:26px;background:#2b1a0a;color:#FFD86A;font-weight:900;border:0;cursor:pointer;font-size:15px;margin-top:12px">${L.continueBtn}</button>
        <button id="btnX2" style="width:100%;height:54px;margin-top:10px;border-radius:26px;background:linear-gradient(90deg,#FF00D4,#00F0FF);color:#fff;font-weight:900;border:0;cursor:pointer;font-size:15px">${L.x2Btn}</button>
      </div></div>`;
      elWin.querySelector('#btnClaim').onclick=async(e)=>{ e.target.textContent=L.validating; e.target.disabled=true; const ok=await claim(false,false); if(ok){ S.coin(); incForced(); e.target.textContent=L.accredited; setTimeout(()=>{ if(gamesWithoutAd>=2){ showForcedAd(()=>{ resetForced(); newRound(); }); } else { newRound(); } },600); } else{ e.target.textContent=L.errorRetry; e.target.disabled=false; } };
      elWin.querySelector('#btnX2').onclick=()=>{ window.vrAd=1; window.vrAdType='double'; window._sapoPending=true; elWin.querySelector('#btnX2').textContent=L.loadingAd; };
    }else if(lose){ clearInterval(timerIv);
      try{ ctx().resume(); }catch{} S.lose();
      elWin.innerHTML=`<div class="ah-win"><div class="ah-win-card" style="background:#ffe9e9;border-color:#7a0000">
        <h2 style="margin:0 0 12px;font-weight:900;color:#7a0000;font-size:22px">${L.loseTitle}</h2>
        <div class="ah-bubble" style="background:#7a0000;color:#fff">${L.loseBubble(word)}</div>
        <img src="${FROG_LOSE}" class="ah-sapo-img" style="width:260px;height:260px;object-fit:contain;margin:8px auto 12px;display:block;filter:drop-shadow(0 12px 18px rgba(0,0,0,.4))" onerror="this.style.display='none'">
        <button id="btnRetry" style="width:100%;height:50px;margin-top:12px;border-radius:24px;background:#2b1a0a;color:#fff;font-weight:900;border:0;cursor:pointer">${L.retryBtn}</button>
      </div></div>`;
      elWin.querySelector('#btnRetry').onclick=()=>{ incForced(); if(gamesWithoutAd>=2){ showForcedAd(()=>{ resetForced(); newRound(); }); } else { newRound(); } };
    }
  }
  const adIv=setInterval(async()=>{
    if(window.vrAd===4 && window.vrAdType==='double' && window._sapoPending){
      window.vrAd=0; window.vrAdType=null; window._sapoPending=false;
      const ok=await claim(true,true);
      if(ok){ resetForced(); S.coin(); const L2=t(); elWin.innerHTML=`<div class="ah-win"><div class="ah-win-card"><h2 style="margin:0 0 12px;font-weight:900">${L2.x2credited}</h2><div class="ah-bubble">${L2.x2bubble}</div><img src="${FROG_WIN}" class="ah-sapo-img"><button id="btnNext" style="width:100%;height:44px;margin-top:12px;border-radius:22px;background:#2b1a0a;color:#FFD86A;font-weight:900;border:0">${L2.continueBtn.replace(' +0.01 WASA','').replace(' CONTINUE',' NEXT')}</button></div></div>`; elWin.querySelector('#btnNext').onclick=()=>newRound(); }
    }
    if(window.vrAd===4 && window.vrAdType==='extra_time' && window._sapoExtraTimePending){
      window.vrAd=0; window.vrAdType=null; window._sapoExtraTimePending=false;
      timeLeft=30; maxTime=30; isPaused=false;
      elWin.innerHTML='';
      updateTimerUI();
      timerIv=setInterval(()=>{
        if(isPaused) return;
        timeLeft--;
        updateTimerUI();
        if(timeLeft<=0){
          clearInterval(timerIv);
          S.lose();
          showTimeOut();
        }
      },1000);
      S.coin();
    }
    if(window.vrAd===4 && window.vrAdType==='interstitial' && window._sapoForcedPending){
      window.vrAd=0; window.vrAdType=null; window._sapoForcedPending=false; resetForced(); const fn=window._forcedNext; window._forcedNext=null; if(fn) fn(); else newRound();
    }
  },400);
  langEs.onclick=()=>{ currentLang='es'; langEs.classList.add('active'); langEn.classList.remove('active'); refreshCatSelect(); newRound(); };
  langEn.onclick=()=>{ currentLang='en'; langEn.classList.add('active'); langEs.classList.remove('active'); refreshCatSelect(); newRound(); };
  catSel.onchange=()=>newRound();
  refreshCatSelect(); newRound();
  container._cleanup=()=>{ clearInterval(adIv); clearInterval(timerIv); try{ actx&&actx.close(); }catch{} };
}
