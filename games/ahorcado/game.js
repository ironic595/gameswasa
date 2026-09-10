// /games/ahorcado/game.js - v16 MOSTAZA FINAL - SIN RECUADRO + 2 BOTONES
export async function init(container, args){
  const WORKER_URL = window.WASA_CONFIG?.WORKER_URL || 'https://games-wasa-worker.javimsites.workers.dev/';
  const getDeviceId = ()=> window.getDeviceId?window.getDeviceId():(()=>{let id=localStorage.getItem('wasa_device_id'); if(!id){id='dev_'+Math.random().toString(36).slice(2)+Date.now().toString(36); localStorage.setItem('wasa_device_id',id);} return id;})();
  const base='/games/ahorcado/';
  const candidates=['vendors-app.8f3c2a1b.chunk.js','vendors~app.8f3c2a1b.chunk.js'];
  const FROG_URL = base+'frog.png';

  function safeDecode(s,key){
    try{
      const bin=atob(s); const out=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++) out[i]=bin.charCodeAt(i)^key.charCodeAt(i%key.length);
      return new TextDecoder().decode(out);
    }catch{return '';}
  }
  async function loadVendor(){
    if(window._0x4a2f || window.webpackChunkWasa?.['8f3c2a1b']) return true;
    for(const n of candidates){
      const ok=await new Promise(r=>{ const s=document.createElement('script'); s.src=base+n+'?t='+Date.now(); s.async=true; s.onload=()=>r(true); s.onerror=()=>r(false); document.head.appendChild(s); });
      if(ok && (window._0x4a2f || window.webpackChunkWasa?.['8f3c2a1b'])) return true;
    }
    return false;
  }

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
.ah-win{position:absolute;inset:0;background:rgba(0,0,0,.78);backdrop-filter:blur(6px);display:grid;place-items:center;z-index:50;padding:16px}
.ah-win-card{background:#fffef6;border:3px solid #8a5a00;border-radius:22px;padding:20px;width:min(380px,92vw);text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.4)}
  @media(max-width:900px){.ah-body{flex-direction:column}.ah-tower,.ah-panel{width:min(100vw - 20px, 360px);flex:0 0 auto}.ah-tower{height:360px}}
  </style>
  <div class="ah"><div class="ah-top">
    <div style="font-weight:900;font-size:11px;letter-spacing:.12em">SAPO • AHORCADO MOSTAZA</div>
    <div class="ah-lang"><button id="langEs" class="active">ES 🇪🇸</button><button id="langEn">EN 🇺🇸</button></div>
    <select id="catSel" style="height:32px;border-radius:16px;border:2px solid #8a5a00;background:#fffef6;padding:0 8px;font-weight:700;font-size:11px;max-width:140px"></select>
  </div>
  <div class="ah-wrap"><div class="ah-body">
    <div class="ah-tower" id="tower"><div class="ah-water">💧 AGUA 💧</div></div>
    <div class="ah-panel">
      <div class="ah-card"><div id="ah-word" class="ah-word">CARGANDO...</div><div id="ah-hint" style="text-align:center;font-size:10px;opacity:.6"></div></div>
      <div class="ah-card"><div id="ah-keys" class="ah-keys"></div><div id="ah-action" style="margin-top:10px"></div></div>
    </div>
  </div></div>
  <div id="ah-win"></div></div>`;

  const tower = container.querySelector('#tower');
  const elWord = container.querySelector('#ah-word');
  const elKeys = container.querySelector('#ah-keys');
  const elAction = container.querySelector('#ah-action');
  const elHint = container.querySelector('#ah-hint');
  const elWin = container.querySelector('#ah-win');
  const catSel = container.querySelector('#catSel');
  const langEs = container.querySelector('#langEs');
  const langEn = container.querySelector('#langEn');

  const loaded = await loadVendor();
  if(!loaded){ elWord.textContent='Falta vendor - subí vendors-app.8f3c2a1b.chunk.js'; return; }

  const chunk = window._0x4a2f || window.webpackChunkWasa['8f3c2a1b'];
  const key = chunk.k; const dict = chunk.w;
  let currentLang='es';
  const CACHE_KEY='sapo_cache_mostaza_v16';
  let cache={}; try{ cache=JSON.parse(localStorage.getItem(CACHE_KEY)||'{}'); }catch{}
  async function getWords(cat){
    if(cache[cat]?.length>5) return cache[cat];
    const hashes=dict[cat]||[]; const out=[];
    for(let i=0;i<hashes.length;i+=40){
      for(let j=i;j<Math.min(i+40,hashes.length);j++){ const w=safeDecode(hashes[j],key); if(w.length>2) out.push(w); }
      if(i%120===0) await new Promise(r=>setTimeout(r,0));
    }
    cache[cat]=out; try{ localStorage.setItem(CACHE_KEY,JSON.stringify(cache)); }catch{} return out;
  }
  function getCatsByLang(lang){ return Object.keys(dict).filter(c=>c.startsWith(lang+'_')); }
  function refreshCatSelect(){ const cats=getCatsByLang(currentLang); catSel.innerHTML=''; cats.forEach(c=>{ const o=document.createElement('option'); o.value=c; o.textContent=c.replace(currentLang+'_','').toUpperCase(); catSel.appendChild(o); }); }

  const PLANK_POS=[10,70,130,190,250,310];
  let planks=[], frogEl, word, guessed, errors, maxErrors=6, sess=null, claiming=false;

  // --- LOGICA NEGOCIO ANUNCIOS ---
  const FORCED_KEY='sapo_games_without_ad';
  let gamesWithoutAd = parseInt(localStorage.getItem(FORCED_KEY)||'0');

  function resetForced(){ gamesWithoutAd=0; localStorage.setItem(FORCED_KEY,'0'); }
  function incForced(){ gamesWithoutAd++; localStorage.setItem(FORCED_KEY, String(gamesWithoutAd)); }

  async function startSess(){ try{ const email=localStorage.getItem('wasa_email'), wallet=localStorage.getItem('wasa_wallet'), device_id=getDeviceId(); const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start_game_session',email,wallet,device_id,game_slug:'ahorcado'})}); const j=await r.json(); if(j.ok) sess=j.session_id; }catch{} }
  async function claim(isDouble,ad){ if(claiming) return false; if(!sess) await startSess(); if(!sess) return false; claiming=true; try{ const email=localStorage.getItem('wasa_email'), wallet=localStorage.getItem('wasa_wallet'), device_id=getDeviceId(); const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'claim_reward',session_id:sess,email,wallet,device_id,game_slug:'ahorcado',ad_watched:ad,double_reward:isDouble})}); const j=await r.json(); if(j.ok){ const bal=j.wasa_balance??j.guest_balance??0; if(j.is_guest) localStorage.setItem('wasa_coins_guest',bal); else localStorage.setItem('wasa_coins',bal); if(window.setCoinsUI) window.setCoinsUI(bal); sess=null; claiming=false; return true;} }catch{} claiming=false; return false; }

  function showForcedAd(next){
    // FORZADO SIN AVISO - dispara el ad al instante
    elWin.innerHTML=`
    <div class="ah-win"><div class="ah-win-card">
      <div style="font-size:32px">📺</div>
      <h3 style="margin:8px 0;font-weight:900">CARGANDO...</h3>
      <div style="margin-top:12px;width:100%;height:6px;background:#ddd;border-radius:3px;overflow:hidden"><div style="width:100%;height:100%;background:#2b1a0a;animation:load 2s linear infinite"></div></div>
    </div></div>
    <style>@keyframes load{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}</style>`;
    
    // dispara directo, sin botón
    window.vrAd=1; 
    window.vrAdType='interstitial'; 
    window._sapoForcedPending=true;
    window._forcedNext = next;
  }

  function buildTower(){
    tower.querySelectorAll('.ah-plank,.ah-frog').forEach(e=>e.remove());
    planks=[];
    PLANK_POS.forEach((y,i)=>{
      const p=document.createElement('div'); p.className='ah-plank'; p.style.top=y+'px'; p.style.width=(260 - i*10)+'px'; p.style.left=(20 + i*5)+'px';
      tower.appendChild(p); planks.push(p);
    });
    frogEl=document.createElement('img'); frogEl.className='ah-frog'; frogEl.src=FROG_URL; frogEl.alt='🐸';
    frogEl.onerror=()=>{ frogEl.outerHTML=`<div class="ah-frog" style="font-size:64px;display:grid;place-items:center">🐸</div>`; frogEl=tower.querySelector('.ah-frog'); };
    frogEl.style.top=(PLANK_POS[0]-68)+'px';
    tower.appendChild(frogEl);
  }

  async function newRound(){
    const cat=catSel.value||getCatsByLang(currentLang)[0];
    const words=await getWords(cat);
    word=words[Math.floor(Math.random()*words.length)];
    guessed=new Set(); errors=0; elWin.innerHTML=''; sess=null; startSess();
    elHint.textContent=`${cat.toUpperCase()} • ${words.length} palabras • ${word.length} letras • SIN AD: ${gamesWithoutAd}/2`;
    buildTower(); buildKeys(); update();
  }

  function buildKeys(){
    elKeys.innerHTML=''; elAction.innerHTML='';
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(l=>{
      const b=document.createElement('button'); b.className='ah-key'; b.textContent=l;
      b.onclick=()=>{
        if(guessed.has(l)) return; guessed.add(l);
        if(!word.includes(l)){
          const plankToBreak=planks[errors];
          if(plankToBreak) plankToBreak.classList.add('broken');
          errors++; b.classList.add('miss');
          if(errors<maxErrors){ const nextTop=PLANK_POS[errors]; if(frogEl) frogEl.style.top=(nextTop-68)+'px'; }
          else{ if(frogEl) frogEl.classList.add('fall'); }
          if(navigator.vibrate) navigator.vibrate(30);
        }else b.classList.add('hit');
        b.classList.add('used'); update();
      };
      elKeys.appendChild(b);
    });
  }

  function update(){
    const display=word.split('').map(ch=>guessed.has(ch)?ch:'_').join(' ');
    elWord.textContent=display;
    const win=!display.includes('_'); const lose=errors>=maxErrors;
    if(win){
      elWin.innerHTML=`
      <div class="ah-win"><div class="ah-win-card">
        <div style="font-size:48px">🎉</div>
        <h2 style="margin:8px 0;font-weight:900;color:#2b1a0a">¡GANASTE!</h2>
        <div style="font-size:14px;margin:6px 0">Palabra: <b>${word}</b></div>
        <button id="btnClaim" style="width:100%;height:54px;border-radius:26px;background:#2b1a0a;color:#FFD86A;font-weight:900;border:0;cursor:pointer;font-size:15px;margin-top:12px">CONTINUAR +0.01 WASA</button>
        <button id="btnX2" style="width:100%;height:54px;margin-top:10px;border-radius:26px;background:linear-gradient(90deg,#FF00D4,#00F0FF);color:#fff;font-weight:900;border:0;cursor:pointer;font-size:15px">X2 ANUNCIO → 0.02 WASA</button>
      </div></div>`;
      elWin.querySelector('#btnClaim').onclick=async(e)=>{
        e.target.textContent='VALIDANDO...'; e.target.disabled=true;
        const ok=await claim(false,false);
        if(ok){
          incForced();
          e.target.textContent='✅ +0.01 ACREDITADO';
          setTimeout(()=>{
            if(gamesWithoutAd>=2){
              showForcedAd(()=>{ resetForced(); newRound(); });
            }else{
              newRound();
            }
          },700);
        }else{ e.target.textContent='ERROR - REINTENTAR'; e.target.disabled=false; }
      };
      elWin.querySelector('#btnX2').onclick=()=>{
        window.vrAd=1; window.vrAdType='double'; window._sapoPending=true;
        elWin.querySelector('#btnX2').textContent='CARGANDO ANUNCIO...';
      };
    }else if(lose){
      elWin.innerHTML=`
      <div class="ah-win"><div class="ah-win-card" style="background:#ffe0e0;border-color:#7a0000">
        <div style="font-size:48px">💦</div>
        <h2 style="margin:8px 0;font-weight:900;color:#7a0000">¡SE CAYÓ AL AGUA!</h2>
        <div style="font-size:14px;margin:6px 0">Era: <b>${word}</b></div>
        <button id="btnRetry" style="width:100%;height:50px;margin-top:12px;border-radius:24px;background:#2b1a0a;color:#fff;font-weight:900;border:0;cursor:pointer">REINTENTAR</button>
      </div></div>`;
      elWin.querySelector('#btnRetry').onclick=()=>{
        incForced();
        if(gamesWithoutAd>=2){
          showForcedAd(()=>{ resetForced(); newRound(); });
        }else{
          newRound();
        }
      };
    }
  }

  const adIv=setInterval(async()=>{
    // X2 recompensado
    if(window.vrAd===4 && window.vrAdType==='double' && window._sapoPending){
      window.vrAd=0; window.vrAdType=null; window._sapoPending=false;
      const ok=await claim(true,true);
      if(ok){
        resetForced(); // vió ad recompensado, resetea contador
        elWin.innerHTML=`<div class="ah-win"><div class="ah-win-card"><div style="font-size:48px">✅</div><h2>¡X2 ACREDITADO!</h2><div style="margin:10px 0;font-weight:900">+0.02 WASA</div><button id="btnNext" style="width:100%;height:44px;border-radius:22px;background:#2b1a0a;color:#FFD86A;font-weight:900;border:0">SIGUIENTE</button></div></div>`;
        elWin.querySelector('#btnNext').onclick=()=>newRound();
      }else{
        const b=elWin.querySelector('#btnX2'); if(b) b.textContent='ERROR - REINTENTAR';
      }
    }
    // Intersticial forzado cada 2 partidas
    if(window.vrAd===4 && window.vrAdType==='interstitial' && window._sapoForcedPending){
      window.vrAd=0; window.vrAdType=null; window._sapoForcedPending=false;
      resetForced();
      if(window._forcedNext){ const fn=window._forcedNext; window._forcedNext=null; fn(); }
      else newRound();
    }
  },500);

  langEs.onclick=()=>{ currentLang='es'; langEs.classList.add('active'); langEn.classList.remove('active'); refreshCatSelect(); newRound(); };
  langEn.onclick=()=>{ currentLang='en'; langEn.classList.add('active'); langEs.classList.remove('active'); refreshCatSelect(); newRound(); };
  catSel.onchange=()=>newRound();

  refreshCatSelect(); newRound();
  container._cleanup=()=>{ clearInterval(adIv); };
}
