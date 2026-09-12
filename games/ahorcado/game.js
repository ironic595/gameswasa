// /games/ahorcado/game.js - v24 - BUBBLE GRANDE + RANDOM CAT + MENU NORMAL/RALLY
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
  function beep(f,d,type='sine',v=0.3){ try{ const c=ctx(); const o=c.createOscillator(); const g=c.createGain(); o.type=type; o.frequency.value=f; g.gain.value=v; o.connect(g); g.connect(c.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+d); o.stop(c.currentTime+d); }catch{} }
  const S={ hit(){ beep(880,0.12,'sine',0.4); setTimeout(()=>beep(1320,0.12,'sine',0.3),80); }, miss(){ beep(180,0.35,'sawtooth',0.3); }, key(){ beep(600,0.06,'square',0.15); }, win(){ [523,659,784,1046].forEach((f,i)=>setTimeout(()=>beep(f,0.25,'sine',0.35),i*120)); }, lose(){ [400,300,200,120].forEach((f,i)=>setTimeout(()=>beep(f,0.3,'sawtooth',0.35),i*150)); }, coin(){ [1200,1600,2000].forEach((f,i)=>setTimeout(()=>beep(f,0.12,'sine',0.4),i*90)); } };

  function safeDecode(s,key){ try{ const bin=atob(s); const out=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) out[i]=bin.charCodeAt(i)^key.charCodeAt(i%key.length); return new TextDecoder().decode(out); }catch{return '';} }
  async function loadVendor(){ if(window._0x4a2f || window.webpackChunkWasa?.['8f3c2a1b']) return true; for(const n of candidates){ const ok=await new Promise(r=>{ const s=document.createElement('script'); s.src=base+n+'?t='+Date.now(); s.async=true; s.onload=()=>r(true); s.onerror=()=>r(false); document.head.appendChild(s); }); if(ok && (window._0x4a2f || window.webpackChunkWasa?.['8f3c2a1b'])) return true; } return false; }

  container.innerHTML=`
  <style>
.ah{background:#D4A12C;color:#2b1a0a;width:100%;height:100%;display:flex;flex-direction:column;font-family:'Space Grotesk',system-ui;overflow:hidden;position:relative}
.ah-controls{position:absolute;top:8px;right:8px;z-index:20;display:flex;gap:8px}
.ah-lang{display:flex;gap:4px;background:rgba(0,0,0,.25);border-radius:20px;padding:3px;backdrop-filter:blur(4px)}
.ah-lang button{padding:5px 12px;border-radius:16px;border:0;font-weight:800;font-size:11px;cursor:pointer;background:transparent;color:#fff}
.ah-lang button.active{background:#2b1a0a;color:#FFD86A}
.ah-wrap{flex:1;display:flex;justify-content:center;align-items:center;padding:52px 10px 10px 10px;overflow:hidden;background:radial-gradient(ellipse at 50% 0%, rgba(255,255,255,.25) 0%, transparent 60%), #D4A12C;min-height:0}
.ah-body{display:flex;gap:20px;align-items:stretch;justify-content:center;width:100%;max-width:800px;height:100%;max-height:520px;margin:auto;min-height:0}
.ah-tower{flex:0 0 300px;width:300px;height:440px;position:relative;overflow:visible;background:rgba(0,0,0,.06);border-radius:18px;border:1px solid rgba(0,0,0,.08);flex-shrink:0;padding-top:30px;box-sizing:border-box}
.ah-water-img{position:absolute;bottom:0;left:0;width:100%;height:80px;object-fit:cover;border-radius:0 0 18px 18px;z-index:2;display:block}
.ah-water{position:absolute;bottom:0;left:8px;right:8px;height:32px;background:#5DE0F5;border:2px solid #1aa3b8;border-radius:16px;display:flex;align-items:center;justify-content:center;font-weight:900;color:#0a4a55;z-index:2}
.ah-plank{position:absolute;left:12px;right:12px;height:22px;background:linear-gradient(180deg,#FF8C1A,#CC5A00);border:2px solid #7a2e00;border-radius:10px;box-shadow:0 3px 0 rgba(0,0,0,.25);transition:transform.6s cubic-bezier(.6,-0.28,.74,.05), opacity.4s;z-index:3}
.ah-plank.broken{transform:translateY(600px) rotate(35deg);opacity:0}
.ah-frog{position:absolute;width:88px;height:88px;left:50%;transform:translateX(-50%);transition:top.45s cubic-bezier(.34,1.56,.64,1), transform.5s ease;z-index:6;object-fit:contain;filter:drop-shadow(0 6px 8px rgba(0,0,0,.35))}
.ah-frog.fall{top:400px!important;transform:translateX(-50%) rotate(25deg) scale(.8)}
.ah-panel{flex:1;min-width:0;display:flex;flex-direction:column;gap:10px;min-height:0;max-width:400px;justify-content:center}
.ah-word-card{background:#fffef6;border:2px solid #8a5a00;border-radius:14px;padding:10px;box-shadow:0 6px 18px rgba(0,0,0,.15);flex-shrink:0}
.ah-word{font-size:26px;letter-spacing:5px;font-weight:900;text-align:center;font-family:monospace;min-height:34px;color:#2b1a0a;word-break:break-all}
.ah-hint{text-align:center;font-size:11px;opacity:.7;margin-top:4px;font-weight:700}
.ah-timer{height:10px;background:#2b1a0a22;border-radius:10px;overflow:hidden;border:1px solid #8a5a00;margin-top:6px}
.ah-timer-bar{height:100%;background:linear-gradient(90deg,#2ECC71,#00F0FF);transition:width 1s linear}
.ah-timer-bar.warn{background:linear-gradient(90deg,#FF8C00,#FF3B30)}
.ah-timer-text{text-align:center;font-size:10px;font-weight:900;margin-top:2px}
.ah-keys-wrap{background:#fffef6;border:2px solid #8a5a00;border-radius:14px;padding:10px 8px;box-shadow:0 6px 18px rgba(0,0,0,.15)}
.ah-keys-qwerty{display:flex;flex-direction:column;gap:6px;align-items:center;width:100%}
.qrow{display:flex;gap:5px;justify-content:center;width:100%}
.ah-key{flex:1;max-width:48px;height:42px;border-radius:8px;background:#fff;border:2px solid #8a5a00;color:#2b1a0a;font-weight:800;cursor:pointer;touch-action:manipulation;font-size:14px;display:grid;place-items:center}
.ah-key.used{opacity:.3;pointer-events:none}
.ah-key.hit{background:#2ECC71;border-color:#1a7a42;color:#fff}
.ah-key.miss{background:#FF3B30;border-color:#7a0000;color:#fff}
.ah-win{position:absolute;inset:0;background:rgba(0,0,0,.82);backdrop-filter:blur(8px);display:grid;place-items:center;z-index:50;padding:16px}
.ah-win-card{background:#fffef6;border:3px solid #8a5a00;border-radius:22px;padding:18px;width:min(440px,94vw);text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.45)}
.ah-sapo-img{width:240px;height:240px;object-fit:contain;margin:0 auto 12px;display:block;filter:drop-shadow(0 12px 18px rgba(0,0,0,.4))}
/* GLOBO MAS GRANDE */
.ah-bubble{background:#2b1a0a;color:#FFD86A;border-radius:18px 18px 18px 4px;padding:14px 18px;font-size:15px;font-weight:700;line-height:1.35;margin:0 auto 14px;max-width:400px;position:relative;letter-spacing:.2px}
.ah-bubble b{color:#fff}
.ah-bubble:after{content:'';position:absolute;bottom:-10px;left:50%;margin-left:-10px;width:20px;height:20px;background:inherit;transform:rotate(45deg)}
.ah-menu{position:absolute;inset:0;background:rgba(0,0,0,.85);backdrop-filter:blur(10px);display:grid;place-items:center;z-index:60;padding:20px}
.ah-menu-card{background:#fffef6;border:3px solid #8a5a00;border-radius:24px;padding:22px;width:min(420px,92vw);text-align:center}
.ah-mode-btn{width:100%;height:56px;border-radius:18px;border:0;font-weight:900;font-size:14px;cursor:pointer;margin-top:10px;display:flex;align-items:center;justify-content:center;gap:8px}
@media(max-width:700px){
.ah-wrap{padding:44px 5px 5px 5px;align-items:stretch}
.ah-body{flex-direction:column;gap:6px;align-items:center;justify-content:flex-start;max-width:380px;height:100%;max-height:calc(100dvh - 10px)}
.ah-tower{flex:0 0 44%;width:100%;max-width:340px;height:auto;min-height:170px;max-height:260px;aspect-ratio:340/260}
.ah-plank{height:16px;left:8px;right:8px}
.ah-frog{width:68px;height:68px}
.ah-panel{flex:1;width:100%;max-width:360px;gap:6px;min-height:0;justify-content:flex-start}
.ah-word{font-size:20px;letter-spacing:3px;min-height:26px}
.ah-word-card{padding:6px 8px}
.ah-keys-wrap{padding:6px;flex:1;display:flex;flex-direction:column;justify-content:center}
.ah-key{height:36px;font-size:13px;max-width:none}
.qrow{gap:4px}
.ah-bubble{font-size:14px;padding:12px 14px}
}
  </style>

  <div class="ah">
    <div class="ah-controls">
      <div class="ah-lang"><button id="langEs" class="active">ES</button><button id="langEn">EN</button></div>
    </div>
    <div class="ah-wrap"><div class="ah-body">
      <div class="ah-tower" id="tower">
        <img src="water.png" id="ah-water-img" class="ah-water-img" alt="AGUA" onerror="this.style.display='none'; document.getElementById('ah-water-fallback').style.display='flex'">
        <div id="ah-water-fallback" class="ah-water" style="display:none">💧 AGUA 💧</div>
      </div>
      <div class="ah-panel">
        <div class="ah-word-card">
          <div id="ah-word" class="ah-word">CARGANDO...</div>
          <div id="ah-hint" class="ah-hint"></div>
          <div class="ah-timer"><div id="ah-timer-bar" class="ah-timer-bar" style="width:100%"></div></div>
          <div id="ah-timer-text" class="ah-timer-text">30s</div>
          <div id="ah-rally-info" style="text-align:center;font-size:11px;font-weight:900;margin-top:4px;display:none">RALLY: 0 palabras</div>
        </div>
        <div class="ah-keys-wrap"><div id="ah-keys" class="ah-keys-qwerty"></div></div>
      </div>
    </div></div>
    <div id="ah-win"></div>
    <div id="ah-menu"></div>
  </div>`;

  const tower=container.querySelector('#tower'); const elWord=container.querySelector('#ah-word'); const elKeys=container.querySelector('#ah-keys'); const elHint=container.querySelector('#ah-hint'); const elWin=container.querySelector('#ah-win'); const elMenu=container.querySelector('#ah-menu'); const elRallyInfo=container.querySelector('#ah-rally-info'); const langEs=container.querySelector('#langEs'); const langEn=container.querySelector('#langEn');
  const loaded=await loadVendor(); if(!loaded){ elWord.textContent='Falta vendor'; return; }
  const chunk=window._0x4a2f || window.webpackChunkWasa['8f3c2a1b']; const key=chunk.k; const dict=chunk.w;
  let currentLang='es'; const CACHE_KEY='sapo_cache_mostaza_v27_waterPNG'; let cache={}; try{ cache=JSON.parse(localStorage.getItem(CACHE_KEY)||'{}'); }catch{}
  async function getWords(cat){ if(cache[cat]?.length>5) return cache[cat]; const hashes=dict[cat]||[]; const out=[]; for(let i=0;i<hashes.length;i+=40){ for(let j=i;j<Math.min(i+40,hashes.length);j++){ const w=safeDecode(hashes[j],key); if(w.length>2) out.push(w); } if(i%120===0) await new Promise(r=>setTimeout(r,0)); } cache[cat]=out; try{ localStorage.setItem(CACHE_KEY,JSON.stringify(cache)); }catch{} return out; }
  function getCatsByLang(lang){ return Object.keys(dict).filter(c=>c.startsWith(lang+'_')); }
  function getRandomCat(){ const cats=getCatsByLang(currentLang); return cats[Math.floor(Math.random()*cats.length)]; }

  const PLANK_PCT=[70,135,200,265,330,395];
  let timerIv=null, timeLeft=30, maxTime=30, isPaused=false;
  const timerBar=container.querySelector('#ah-timer-bar'); const timerText=container.querySelector('#ah-timer-text');
  function startTimer(){ clearInterval(timerIv); timeLeft=maxTime=30; updateTimerUI(); timerIv=setInterval(()=>{ if(isPaused) return; timeLeft--; updateTimerUI(); if(timeLeft<=0){ clearInterval(timerIv); S.lose(); showTimeOut(); } },1000); }
  function updateTimerUI(){ const pct=Math.max(0,(timeLeft/maxTime)*100); if(timerBar){ timerBar.style.width=pct+'%'; timerBar.classList.toggle('warn', timeLeft<=15); } if(timerText){ timerText.textContent=timeLeft+'s'; timerText.style.color=timeLeft<=10?'#FF3B30':'#2b1a0a'; } }
  function showTimeOut(){
    isPaused=true; const L=t();
    elWin.innerHTML=`<div class="ah-win"><div class="ah-win-card" style="background:#fff3cd;border-color:#8a5a00">
      <h2 style="margin:0 0 8px;font-weight:900;color:#8a5a00;font-size:18px">${currentLang==='en'?'TIME IS UP!':'¡TIEMPO AGOTADO!'}</h2>
      <div class="ah-bubble">${currentLang==='en'?`Time is up! Watch ad for +30s ⏰`:`¡Tiempo agotado! Mirá anuncio para +30s ⏰`}</div>
      <img src="${FROG_LOSE}" class="ah-sapo-img" onerror="this.style.display='none'">
      <button id="btnTimeoutContinue" style="width:100%;height:46px;border-radius:22px;background:#2b1a0a;color:#fff;font-weight:900;border:0;cursor:pointer;margin-top:8px;font-size:13px">${L.retryBtn}</button>
      <button id="btnTimeoutAd" style="width:100%;height:48px;margin-top:8px;border-radius:22px;background:linear-gradient(90deg,#FF8C00,#FF00D4);color:#fff;font-weight:900;border:0;cursor:pointer;font-size:13px">${currentLang==='en'?'+30s WATCH AD':'+30s VER ANUNCIO'}</button>
    </div></div>`;
    elWin.querySelector('#btnTimeoutContinue').onclick=()=>{ isPaused=false; if(gameMode==='rally'){ endRally(); } else { incForced(); if(gamesWithoutAd>=2){ showForcedAd(()=>{ resetForced(); newRound(false); }); } else { newRound(false); } } };
    elWin.querySelector('#btnTimeoutAd').onclick=()=>{ window.vrAd=1; window.vrAdType='extra_time'; window._sapoExtraTimePending=true; elWin.querySelector('#btnTimeoutAd').textContent=t().loadingAd; };
  }

  let planks=[], frogEl, word, guessed, errors, maxErrors=6, sess=null, claiming=false, gameMode='normal', rallyScore=0, currentCat='';
  const FORCED_KEY='sapo_games_without_ad'; let gamesWithoutAd=parseInt(localStorage.getItem(FORCED_KEY)||'0');
  function resetForced(){ gamesWithoutAd=0; localStorage.setItem(FORCED_KEY,'0'); }
  function incForced(){ gamesWithoutAd++; localStorage.setItem(FORCED_KEY,String(gamesWithoutAd)); }
  async function startSess(){ try{ const email=localStorage.getItem('wasa_email'), wallet=localStorage.getItem('wasa_wallet'), device_id=getDeviceId(); const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start_game_session',email,wallet,device_id,game_slug:'ahorcado', level:1})}); const j=await r.json(); if(j.ok) sess=j.session_id; }catch{} }
  async function claim(isDouble,ad,customReward){ if(claiming) return false; if(!sess && gameMode!=='rally') await startSess(); if(!sess && gameMode!=='rally') return false; claiming=true; try{ const email=localStorage.getItem('wasa_email'), wallet=localStorage.getItem('wasa_wallet'), device_id=getDeviceId(); const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'claim_reward',session_id:sess,email,wallet,device_id,game_slug:'ahorcado',ad_watched:ad,double_reward:isDouble, time_taken: 10, rally_score: rallyScore, custom_reward: customReward})}); const j=await r.json(); if(j.ok){ const bal=j.wasa_balance??j.guest_balance??0; if(j.is_guest) localStorage.setItem('wasa_coins_guest',bal); else localStorage.setItem('wasa_coins',bal); if(window.setCoinsUI) window.setCoinsUI(bal); sess=null; claiming=false; return j; } }catch{} claiming=false; return false; }
  function showForcedAd(next){ elWin.innerHTML=''; window._forcedNext=next; window._sapoForcedPending=true; window.vrAdType='interstitial'; window.vrAd=1; }

  function buildTower(reset=true){
    if(reset){
      tower.querySelectorAll('.ah-plank,.ah-frog').forEach(e=>e.remove());
      planks=[];
      const isMobile = window.innerWidth <= 700 || tower.clientHeight < 320;
      PLANK_PCT.forEach((y,i)=>{
        const p=document.createElement('div'); p.className='ah-plank';
        if(isMobile){ const pct=[6,21,36,51,66,81][i]; p.style.top=pct+'%'; p.style.width=(92-i*3)+'%'; p.style.left=(4+i*1.5)+'%'; } else { p.style.top=y+'px'; p.style.width=(276-i*12)+'px'; p.style.left=(12+i*6)+'px'; }
        tower.appendChild(p); planks.push(p);
      });
      frogEl=document.createElement('img'); frogEl.className='ah-frog'; frogEl.src=FROG_URL; frogEl.alt='🐸';
      frogEl.onerror=()=>{ frogEl.outerHTML=`<div class="ah-frog" style="font-size:48px;display:grid;place-items:center">🐸</div>`; frogEl=tower.querySelector('.ah-frog'); };
      frogEl.style.top=(PLANK_PCT[0]-68)+'px'; if(isMobile) frogEl.style.top='0%';
      tower.appendChild(frogEl);
    } else {
      // rally: mantener tablas rotas, solo reposicionar sapo según errors actuales
      if(frogEl){
        const isMobile = window.innerWidth <= 700 || tower.clientHeight < 320;
        if(isMobile){ const pct=[6,21,36,51,66,81][errors]; frogEl.style.top=(pct-1)+'%'; } else { frogEl.style.top=(PLANK_PCT[errors]-68)+'px'; }
      }
    }
  }

  async function newRound(isRallyContinue=false){
    if(!isRallyContinue){
      rallyScore=0;
      errors=0;
      currentCat=getRandomCat();
      buildTower(true);
    } else {
      // rally continúa: misma torre, no resetea errors
      buildTower(false);
    }
    const words=await getWords(currentCat);
    // evitar repetir la misma palabra en rally
    let newWord;
    do{ newWord=words[Math.floor(Math.random()*words.length)].toUpperCase(); } while(newWord===word && words.length>1);
    word=newWord;
    guessed=new Set();
    if(!isRallyContinue) elWin.innerHTML='';
    if(!isRallyContinue) sess=null;
    if(!isRallyContinue) startSess();
    elHint.textContent=`${currentCat.replace(currentLang+'_','').toUpperCase()} • ${words.length} palabras`;
    if(gameMode==='rally'){
      elRallyInfo.style.display='block';
      elRallyInfo.textContent=`RALLY: ${rallyScore} palabras • Vidas: ${maxErrors-errors}/${maxErrors}`;
    } else {
      elRallyInfo.style.display='none';
    }
    buildKeys(); update(); startTimer();
  }

  function buildKeys(){
    elKeys.innerHTML=''; const rows=['QWERTYUIOP','ASDFGHJKL','ZXCVBNM'];
    rows.forEach(rowStr=>{
      const row=document.createElement('div'); row.className='qrow';
      rowStr.split('').forEach(l=>{
        const b=document.createElement('button'); b.className='ah-key'; b.textContent=l;
        if(guessed.has(l)){
          b.classList.add('used');
          if(word.includes(l)) b.classList.add('hit'); else b.classList.add('miss');
        }
        b.onclick=()=>{
          if(guessed.has(l)) return; try{ ctx().resume(); }catch{} S.key();
          guessed.add(l);
          if(!word.includes(l)){
            const plankToBreak=planks[errors]; if(plankToBreak) plankToBreak.classList.add('broken');
            errors++; b.classList.add('miss'); S.miss();
            if(errors<maxErrors){
              const isMob=window.innerWidth<=700 || tower.clientHeight < 320;
              if(isMob){ const pct=[6,21,36,51,66,81][errors]; frogEl.style.top=(pct-1)+'%'; } else { frogEl.style.top=(PLANK_PCT[errors]-68)+'px'; }
              if(gameMode==='rally'){ elRallyInfo.textContent=`RALLY: ${rallyScore} palabras • Vidas: ${maxErrors-errors}/${maxErrors}`; }
            } else{ if(frogEl) frogEl.classList.add('fall'); }
            if(navigator.vibrate) navigator.vibrate(30);
          } else{ b.classList.add('hit'); S.hit(); }
          b.classList.add('used'); update();
        }; row.appendChild(b);
      }); elKeys.appendChild(row);
    });
  }

  function t(){
    if(currentLang==='en'){
      return {
        winTitle:'YOU WON!', loseTitle:'FELL INTO WATER!',
        winBubble:(w)=>`As a certified AI expert, I can confirm my model correctly predicted the word was: <b>${w}</b> ✅`,
        loseBubble:(w)=>`Wrong. The word was: <b>${w}</b>. 🤖❌`,
        continueBtn:'CONTINUE +0.0001 $WASA', x2Btn:'X2 AD → +0.0002 $WASA',
        retryBtn:'RETRY', nextRally:'NEXT WORD', endRallyBtn:'FINISH RALLY',
        x2credited:'X2 CREDITED!', x2bubble:'+0.0002 WASA credited! 🚀',
        validating:'VALIDATING...', accredited:'✅ +0.0001 CREDITED', loadingAd:'LOADING AD...', errorRetry:'ERROR - RETRY'
      };
    }else{
      return {
        winTitle:'¡GANASTE!', loseTitle:'¡SE CAYÓ AL AGUA!',
        winBubble:(w)=>`Mi modelo predijo correctamente que la palabra era: <b>${w}</b> ✅`,
        loseBubble:(w)=>`Incorrecto. Era: <b>${w}</b>. 🤖❌`,
        continueBtn:'CONTINUAR +0.0001 $WASA', x2Btn:'VER ANUNCIO x2 → +0.0002 $WASA',
        retryBtn:'REINTENTAR', nextRally:'SIGUIENTE PALABRA', endRallyBtn:'TERMINAR RALLY',
        x2credited:'¡X2 ACREDITADO!', x2bubble:'+0.0002 WASA acreditados. 🚀',
        validating:'VALIDANDO...', accredited:'✅ +0.0001 ACREDITADO', loadingAd:'CARGANDO...', errorRetry:'ERROR - REINTENTAR'
      };
    }
  }

  function update(){
    const display=word.split('').map(ch=>guessed.has(ch)?ch:'_').join(' ');
    elWord.textContent=display; const win=!display.includes('_'); const lose=errors>=maxErrors; const L=t();
    if(win){
      clearInterval(timerIv); try{ ctx().resume(); }catch{} S.win();
      if(gameMode==='rally'){
        rallyScore++;
        elWin.innerHTML=`<div class="ah-win"><div class="ah-win-card">
          <h2 style="margin:0 0 8px;font-weight:900;color:#2b1a0a;font-size:18px">¡${rallyScore} PALABRA${rallyScore>1?'S':''}!</h2>
          <div class="ah-bubble">${L.winBubble(word)}<br><br>🔥 RALLY: ${rallyScore} • Vidas: ${maxErrors-errors}/${maxErrors}</div>
          <img src="${FROG_WIN}" class="ah-sapo-img" onerror="this.style.display='none'">
          <button id="btnNextRally" style="width:100%;height:48px;border-radius:22px;background:#2b1a0a;color:#FFD86A;font-weight:900;border:0;cursor:pointer;font-size:13px;margin-top:8px">${L.nextRally} →</button>
          <button id="btnEndRally" style="width:100%;height:42px;margin-top:8px;border-radius:18px;background:#fff;border:2px solid #8a5a00;color:#2b1a0a;font-weight:900;cursor:pointer;font-size:12px">${L.endRallyBtn} +${(rallyScore*0.0001).toFixed(4)} WASA</button>
        </div></div>`;
        elWin.querySelector('#btnNextRally').onclick=()=>{ elWin.innerHTML=''; newRound(true); };
        elWin.querySelector('#btnEndRally').onclick=async(e)=>{ e.target.textContent=L.validating; e.target.disabled=true; const total=rallyScore*0.0001; const res=await claim(false,false,total); if(res){ S.coin(); endRally(true); } else { e.target.textContent=L.errorRetry; e.target.disabled=false; } };
      } else {
        elWin.innerHTML=`<div class="ah-win"><div class="ah-win-card">
          <h2 style="margin:0 0 8px;font-weight:900;color:#2b1a0a;font-size:18px">${L.winTitle}</h2>
          <div class="ah-bubble">${L.winBubble(word)}</div>
          <img src="${FROG_WIN}" class="ah-sapo-img" onerror="this.style.display='none'">
          <button id="btnClaim" style="width:100%;height:48px;border-radius:22px;background:#2b1a0a;color:#FFD86A;font-weight:900;border:0;cursor:pointer;font-size:13px;margin-top:8px">${L.continueBtn}</button>
          <button id="btnX2" style="width:100%;height:48px;margin-top:8px;border-radius:22px;background:linear-gradient(90deg,#FF00D4,#00F0FF);color:#fff;font-weight:900;border:0;cursor:pointer;font-size:13px">${L.x2Btn}</button>
        </div></div>`;
        elWin.querySelector('#btnClaim').onclick=async(e)=>{ e.target.textContent=L.validating; e.target.disabled=true; const ok=await claim(false,false); if(ok){ S.coin(); incForced(); e.target.textContent=L.accredited; setTimeout(()=>{ if(gamesWithoutAd>=2){ showForcedAd(()=>{ resetForced(); newRound(false); }); } else { newRound(false); } },600); } else{ e.target.textContent=L.errorRetry; e.target.disabled=false; } };
        elWin.querySelector('#btnX2').onclick=()=>{ window.vrAd=1; window.vrAdType='double'; window._sapoPending=true; elWin.querySelector('#btnX2').textContent=L.loadingAd; };
      }
    }else if(lose){
      clearInterval(timerIv); try{ ctx().resume(); }catch{} S.lose();
      if(gameMode==='rally'){
        elWin.innerHTML=`<div class="ah-win"><div class="ah-win-card" style="background:#ffe9e9;border-color:#7a0000">
          <h2 style="margin:0 0 8px;font-weight:900;color:#7a0000;font-size:18px">¡RALLY TERMINADO!</h2>
          <div class="ah-bubble" style="background:#7a0000;color:#fff">Caíste al agua.<br>Palabra era: <b>${word}</b><br><br>🏆 Total: <b>${rallyScore} palabra${rallyScore!==1?'s':''}</b><br>💧 Ganancia: ${(rallyScore*0.0001).toFixed(4)} WASA</div>
          <img src="${FROG_LOSE}" class="ah-sapo-img" onerror="this.style.display='none'">
          <button id="btnClaimRally" style="width:100%;height:48px;margin-top:8px;border-radius:22px;background:#2b1a0a;color:#FFD86A;font-weight:900;border:0;cursor:pointer;font-size:13px">COBRAR ${(rallyScore*0.0001).toFixed(4)} WASA</button>
          <button id="btnRetryRally" style="width:100%;height:42px;margin-top:8px;border-radius:18px;background:#fff;border:2px solid #8a5a00;color:#2b1a0a;font-weight:900;cursor:pointer;font-size:12px">JUGAR DE NUEVO</button>
        </div></div>`;
        elWin.querySelector('#btnClaimRally').onclick=async(e)=>{ if(rallyScore===0){ showMenu(); return; } e.target.textContent=t().validating; e.target.disabled=true; const res=await claim(false,false,rallyScore*0.0001); if(res){ S.coin(); showMenu(); } else { e.target.textContent=t().errorRetry; e.target.disabled=false; } };
        elWin.querySelector('#btnRetryRally').onclick=()=>{ showMenu(); };
      } else {
        elWin.innerHTML=`<div class="ah-win"><div class="ah-win-card" style="background:#ffe9e9;border-color:#7a0000">
          <h2 style="margin:0 0 8px;font-weight:900;color:#7a0000;font-size:18px">${L.loseTitle}</h2>
          <div class="ah-bubble" style="background:#7a0000;color:#fff">${L.loseBubble(word)}</div>
          <img src="${FROG_LOSE}" class="ah-sapo-img" onerror="this.style.display='none'">
          <button id="btnRetry" style="width:100%;height:44px;margin-top:8px;border-radius:20px;background:#2b1a0a;color:#fff;font-weight:900;border:0;cursor:pointer;font-size:13px">${L.retryBtn}</button>
        </div></div>`;
        elWin.querySelector('#btnRetry').onclick=()=>{ incForced(); if(gamesWithoutAd>=2){ showForcedAd(()=>{ resetForced(); newRound(false); }); } else { newRound(false); } };
      }
    }
  }

  function endRally(claimed=false){
    elWin.innerHTML='';
    if(!claimed && rallyScore>0){
      // si no cobró, no hace nada
    }
    showMenu();
  }

  function showMenu(){
    elWin.innerHTML='';
    clearInterval(timerIv);
    elMenu.innerHTML=`<div class="ah-menu"><div class="ah-menu-card">
      <img src="${FROG_URL}" style="width:90px;height:90px;margin:0 auto 10px;display:block" onerror="this.style.display='none'">
      <h2 style="margin:0;font-weight:900;font-size:20px">AHORCADO SAPO</h2>
      <p style="font-size:13px;opacity:.7;margin:6px 0 12px">Elige un modo</p>
      <button id="btnNormal" class="ah-mode-btn" style="background:#2b1a0a;color:#FFD86A">🎯 MODO NORMAL<br><span style="font-size:11px;opacity:.8;font-weight:600">1 palabra = 1 vida • 0.0001 WASA</span></button>
      <button id="btnRally" class="ah-mode-btn" style="background:linear-gradient(90deg,#FF8C00,#FF00D4);color:#fff">🔥 MODO RALLY<br><span style="font-size:11px;opacity:.9;font-weight:600">¡Cuántas palabras aguantas con 6 vidas!</span></button>
      <div style="margin-top:12px;display:flex;gap:6px;justify-content:center">
        <button id="langEsM" class="${currentLang==='es'?'active':''}" style="padding:6px 14px;border-radius:16px;border:2px solid #8a5a00;font-weight:800;cursor:pointer;background:${currentLang==='es'?'#2b1a0a;color:#FFD86A':'#fff'}">ES</button>
        <button id="langEnM" class="${currentLang==='en'?'active':''}" style="padding:6px 14px;border-radius:16px;border:2px solid #8a5a00;font-weight:800;cursor:pointer;background:${currentLang==='en'?'#2b1a0a;color:#FFD86A':'#fff'}">EN</button>
      </div>
    </div></div>`;
    elMenu.querySelector('#btnNormal').onclick=()=>{ gameMode='normal'; elMenu.innerHTML=''; rallyScore=0; elRallyInfo.style.display='none'; newRound(false); };
    elMenu.querySelector('#btnRally').onclick=()=>{ gameMode='rally'; elMenu.innerHTML=''; rallyScore=0; newRound(false); };
    elMenu.querySelector('#langEsM').onclick=()=>{ currentLang='es'; langEs.classList.add('active'); langEn.classList.remove('active'); showMenu(); };
    elMenu.querySelector('#langEnM').onclick=()=>{ currentLang='en'; langEn.classList.add('active'); langEs.classList.remove('active'); showMenu(); };
  }

  const adIv=setInterval(async()=>{
    if(window.vrAd===4 && window.vrAdType==='double' && window._sapoPending){
      window.vrAd=0; window.vrAdType=null; window._sapoPending=false;
      const ok=await claim(true,true);
      if(ok){ resetForced(); S.coin(); const L2=t(); elWin.innerHTML=`<div class="ah-win"><div class="ah-win-card"><h2 style="margin:0 0 8px;font-weight:900;font-size:16px">${L2.x2credited}</h2><div class="ah-bubble">${L2.x2bubble}</div><img src="${FROG_WIN}" class="ah-sapo-img"><button id="btnNext" style="width:100%;height:42px;margin-top:8px;border-radius:20px;background:#2b1a0a;color:#FFD86A;font-weight:900;border:0;font-size:13px">SIGUIENTE</button></div></div>`; elWin.querySelector('#btnNext').onclick=()=>{ if(gameMode==='rally'){ showMenu(); } else { newRound(false); } }; }
    }
    if(window.vrAd===4 && window.vrAdType==='extra_time' && window._sapoExtraTimePending){
      window.vrAd=0; window.vrAdType=null; window._sapoExtraTimePending=false; timeLeft=30; maxTime=30; isPaused=false; elWin.innerHTML=''; updateTimerUI();
      timerIv=setInterval(()=>{ if(isPaused) return; timeLeft--; updateTimerUI(); if(timeLeft<=0){ clearInterval(timerIv); S.lose(); showTimeOut(); } },1000); S.coin();
    }
    if(window.vrAd===4 && window.vrAdType==='interstitial' && window._sapoForcedPending){
      window.vrAd=0; window.vrAdType=null; window._sapoForcedPending=false; resetForced(); const fn=window._forcedNext; window._forcedNext=null; if(fn) fn(); else newRound(false);
    }
  },400);
  langEs.onclick=()=>{ currentLang='es'; langEs.classList.add('active'); langEn.classList.remove('active'); if(elMenu.innerHTML) showMenu(); else { currentCat=getRandomCat(); newRound(false); } };
  langEn.onclick=()=>{ currentLang='en'; langEn.classList.add('active'); langEs.classList.remove('active'); if(elMenu.innerHTML) showMenu(); else { currentCat=getRandomCat(); newRound(false); } };
  showMenu();
  container._cleanup=()=>{ clearInterval(adIv); clearInterval(timerIv); try{ actx&&actx.close(); }catch{} };
}
