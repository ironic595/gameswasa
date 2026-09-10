// /games/ahorcado/game.js - AHORCADO PREMIUM v2 - FIX VENDOR + CANVAS HANGMAN + CENTRADO REAL
export async function init(container, args){
  const WORKER_URL = window.WASA_CONFIG?.WORKER_URL || 'https://games-wasa-worker.javimsites.workers.dev/';
  const getDeviceId = ()=> window.getDeviceId?window.getDeviceId():(()=>{let id=localStorage.getItem('wasa_device_id'); if(!id){id='dev_'+Math.random().toString(36).slice(2)+Date.now().toString(36); localStorage.setItem('wasa_device_id',id);} return id;})();
  const quality = args?.quality || ( (navigator.deviceMemory||4)<=2 || innerWidth<900? 'lite':'hd');
  const isLite = quality==='lite';
  const base='/games/ahorcado/';
  const candidates=['vendors-app.8f3c2a1b.chunk.js','vendors~app.8f3c2a1b.chunk.js'];

  function safeDecode(s,key){
    try{
      const bin=atob(s); const b=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++) b[i]=bin.charCodeAt(i);
      const out=new Uint8Array(b.length);
      for(let i=0;i<b.length;i++) out[i]=b[i]^key.charCodeAt(i%key.length);
      return new TextDecoder().decode(out);
    }catch(e){return '';}
  }
  async function loadVendor(){
    if(window._0x4a2f || window.webpackChunkWasa?.['8f3c2a1b']) return true;
    for(const name of candidates){
      const ok=await new Promise(res=>{
        const s=document.createElement('script'); s.src=base+name+'?t='+Date.now(); s.async=false;
        s.onload=()=>res(true); s.onerror=()=>res(false);
        document.head.appendChild(s);
      });
      if(ok && (window._0x4a2f || window.webpackChunkWasa?.['8f3c2a1b'])) return true;
    }
    return false;
  }

  container.innerHTML=`<div style="display:grid;place-items:center;height:100%;background:#08080d;color:#fff;font-family:monospace">CARGANDO AHORCADO...</div>`;
  await loadVendor();
  const chunk=window._0x4a2f || window.webpackChunkWasa?.['8f3c2a1b'];
  if(!chunk){
    container.innerHTML=`<div style="color:#ff6b6b;text-align:center;padding:40px">Falta vendor. Subí vendors-app.8f3c2a1b.chunk.js a /games/ahorcado/</div>`; return;
  }
  const key=chunk.k, dict=chunk.w;
  const wordsByCat={};
  for(const cat in dict){ wordsByCat[cat]=dict[cat].map(h=>safeDecode(h,key)).filter(w=>w.length>2); }
  const cats=Object.keys(wordsByCat);

  let cat=cats[Math.floor(Math.random()*cats.length)];
  let wordList=wordsByCat[cat];
  let word=wordList[Math.floor(Math.random()*wordList.length)];
  let guessed=new Set(), errors=0, maxErrors=6, sess=null;

  async function startSess(){ try{ const email=localStorage.getItem('wasa_email'), wallet=localStorage.getItem('wasa_wallet'), device_id=getDeviceId(); const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start_game_session',email,wallet,device_id,game_slug:'ahorcado'})}); const j=await r.json(); if(j.ok) sess=j.session_id; }catch(e){} }
  async function claim(isDouble,ad){ if(!sess) await startSess(); try{ const email=localStorage.getItem('wasa_email'), wallet=localStorage.getItem('wasa_wallet'), device_id=getDeviceId(); const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'claim_reward',session_id:sess,email,wallet,device_id,game_slug:'ahorcado',ad_watched:ad,double_reward:isDouble})}); const j=await r.json(); if(j.ok){ const bal=j.wasa_balance??j.guest_balance??0; if(j.is_guest) localStorage.setItem('wasa_coins_guest',bal); else localStorage.setItem('wasa_coins',bal); if(window.setCoinsUI) window.setCoinsUI(bal); sess=null; return true;} }catch(e){} return false; }

  function drawHangman(c, err){
    c.clearRect(0,0,320,260);
    c.strokeStyle='#2a2a3a'; c.lineWidth=4; c.lineCap='round';
    // base
    c.beginPath(); c.moveTo(20,240); c.lineTo(120,240); c.moveTo(70,240); c.lineTo(70,20); c.lineTo(200,50); c.stroke();
    if(err>0){ // cabeza
      c.beginPath(); c.strokeStyle='#fff'; c.lineWidth=3; c.arc(200,70,20,0,Math.PI*2); c.stroke();
    }
    if(err>1){ c.beginPath(); c.moveTo(200,90); c.lineTo(200,150); c.stroke(); } // cuerpo
    if(err>2){ c.beginPath(); c.moveTo(200,110); c.lineTo(170,130); c.stroke(); } // brazo izq
    if(err>3){ c.beginPath(); c.moveTo(200,110); c.lineTo(230,130); c.stroke(); } // brazo der
    if(err>4){ c.beginPath(); c.moveTo(200,150); c.lineTo(175,190); c.stroke(); } // pierna izq
    if(err>5){ c.beginPath(); c.moveTo(200,150); c.lineTo(225,190); c.stroke(); } // pierna der
  }

  function render(){
    const display = word.split('').map(l=>guessed.has(l)?l:'_').join(' ');
    const isWin =!display.includes('_');
    const isLose = errors>=maxErrors;
    container.innerHTML=`
    <style>
  .ah{width:100%;height:100%;background:#08080d;color:#fff;display:flex;flex-direction:column;overflow:hidden}
  .ah-top{height:42px;display:flex;justify-content:space-between;align-items:center;padding:0 12px;background:#0f0f17;border-bottom:1px solid rgba(255,255,255,.08);flex-shrink:0}
  .ah-wrap{flex:1;display:flex;justify-content:center;align-items:center;padding:12px;overflow:auto}
  .ah-body{display:flex;gap:14px;align-items:flex-start;justify-content:center;margin:auto}
  .ah-left{flex:0 0 340px;width:340px;background:#0f0f17;border:1px solid rgba(255,255,255,.08);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;align-items:center;padding:12px}
  .ah-right{flex:0 0 360px;width:360px;display:flex;flex-direction:column;gap:10px}
  .ah-cv{width:320px;height:260px;background:#0a0a14;border-radius:12px}
  .ah-word{font-size:26px;letter-spacing:6px;font-weight:900;margin:12px 0;font-family:monospace;text-align:center;min-height:32px}
  .ah-cat{font-size:10px;opacity:.5;letter-spacing:.12em;text-transform:uppercase;text-align:center}
  .ah-keys{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
  .ah-key{height:38px;border-radius:10px;background:#1c1c2a;border:1px solid rgba(255,255,255,.08);color:#fff;font-weight:800;cursor:pointer;transition:.15s}
  .ah-key:hover:not(:disabled){background:#2a2a3a;transform:translateY(-1px)}
  .ah-key:disabled{opacity:.25}
  .ah-key.hit{background:rgba(0,255,136,.15);border-color:rgba(0,255,136,.3);color:#00ff88}
  .ah-key.miss{background:rgba(255,43,43,.15);border-color:rgba(255,43,43,.3);color:#ff4444}
   @media(max-width:900px){.ah-body{flex-direction:column;align-items:center}.ah-left,.ah-right{width:min(100vw - 20px, 360px);flex:0 0 auto}}
    </style>
    <div class="ah"><div class="ah-top"><div style="font-weight:900;font-size:10px;letter-spacing:.15em;color:#00F0FF">AHORCADO • ${cat.toUpperCase().replace('_',' • ')} • ${quality.toUpperCase()}</div><div style="font-size:10px;background:#1b1b27;border-radius:16px;padding:4px 8px">${errors}/${maxErrors} ERRORES</div></div>
    <div class="ah-wrap"><div class="ah-body">
      <div class="ah-left"><canvas id="ahCv" class="ah-cv" width="320" height="260"></canvas><div class="ah-cat">${cat.replace('es_','ES • ').replace('en_','EN • ')}</div><div class="ah-word">${isLose?word:display}</div>
      ${isWin?`<div style="color:#00ff88;font-weight:900;text-align:center">¡GANASTE!</div>`:''}
      ${isLose?`<div style="color:#ff4444;font-weight:900;text-align:center">PERDISTE - ERA: ${word}</div>`:''}
      </div>
      <div class="ah-right">
        <div style="background:#15151f;border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:10px;display:flex;justify-content:space-between;font-size:11px"><span>OBJETIVO</span><b>ADIVINÁ LA PALABRA</b></div>
        <div class="ah-keys" id="keys"></div>
        <div id="ahActions"></div>
      </div>
    </div></div></div>`;

    const cv=container.querySelector('#ahCv'); if(cv) drawHangman(cv.getContext('2d'), errors);

    const keysEl=container.querySelector('#keys');
    if(keysEl){
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(l=>{
        const b=document.createElement('button');
        const isGuessed=guessed.has(l);
        b.className='ah-key'+(isGuessed?(word.includes(l)?' hit':' miss'):'');
        b.textContent=l; b.disabled=isGuessed||isWin||isLose;
        b.onclick=()=>{ if(guessed.has(l)) return; guessed.add(l); if(!word.includes(l)) errors++; render(); };
        keysEl.appendChild(b);
      });
    }
    const actions=container.querySelector('#ahActions');
    if(actions){
      if(isWin){
        actions.innerHTML=`<button id="claim" style="width:100%;height:48px;border-radius:24px;background:#fff;color:#000;font-weight:900">RECLAMAR +0.01 WASA</button><button id="claimX2" style="margin-top:8px;width:100%;height:48px;border-radius:24px;background:linear-gradient(90deg,#FF00D4,#00F0FF);color:#fff;font-weight:900">X2 ANUNCIO → 0.02</button><button id="next" style="margin-top:8px;width:100%;height:40px;border-radius:20px;background:#222;color:#fff">SIGUIENTE PALABRA</button>`;
        actions.querySelector('#claim').onclick=async(e)=>{ e.target.textContent='VALIDANDO...'; const ok=await claim(false,false); if(ok) e.target.textContent='✅ +0.01 ACREDITADO'; else e.target.textContent='REINTENTAR'; };
        actions.querySelector('#claimX2').onclick=()=>{ window.vrAd=1; window.vrAdType='double'; window._ahPending={cat,word}; actions.querySelector('#claimX2').textContent='CARGANDO AD...'; };
        actions.querySelector('#next').onclick=()=>newRound();
      } else if(isLose){
        actions.innerHTML=`<button id="retry" style="width:100%;height:48px;border-radius:24px;background:#fff;color:#000;font-weight:900">REINTENTAR - MISMA CATEGORÍA</button><button id="nextCat" style="margin-top:8px;width:100%;height:40px;border-radius:20px;background:#222;color:#fff">CAMBIAR CATEGORÍA</button>`;
        actions.querySelector('#retry').onclick=()=>{ guessed=new Set(); errors=0; word=wordList[Math.floor(Math.random()*wordList.length)]; render(); };
        actions.querySelector('#nextCat').onclick=()=>newRound();
      }
    }
  }

  function newRound(){
    cat=cats[Math.floor(Math.random()*cats.length)];
    wordList=wordsByCat[cat];
    word=wordList[Math.floor(Math.random()*wordList.length)];
    guessed=new Set(); errors=0; startSess(); render();
  }

  // ad x2 listener
  const adIv=setInterval(async()=>{
    if(window.vrAd===4 && window.vrAdType==='double' && window._ahPending){
      window.vrAd=0; window.vrAdType=null; const p=window._ahPending; window._ahPending=null;
      const ok=await claim(true,true);
      if(ok){
        const actions=container.querySelector('#ahActions');
        if(actions) actions.innerHTML=`<div style="background:rgba(0,255,136,.15);border:1px solid rgba(0,255,136,.3);border-radius:12px;padding:12px;text-align:center;color:#00ff88;font-weight:900">✅ X2 +0.02 WASA ACREDITADO</div><button id="next" style="margin-top:8px;width:100%;height:44px;border-radius:22px;background:#fff;color:#000;font-weight:900">SIGUIENTE</button>`;
        container.querySelector('#next')?.addEventListener('click',()=>newRound());
      }
    }
  },500);

  startSess(); render();
  container._cleanup=()=>{ clearInterval(adIv); window.vrAd=0; };
}
