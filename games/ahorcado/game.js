// /games/ahorcado/game.js - AHORCADO FIX VENDOR ~ + CENTRADO + LITE
export async function init(container, args){
  const WORKER_URL = window.WASA_CONFIG?.WORKER_URL || 'https://games-wasa-worker.javimsites.workers.dev/';
  const getDeviceId = ()=> window.getDeviceId?window.getDeviceId():(()=>{let id=localStorage.getItem('wasa_device_id'); if(!id){id='dev_'+Math.random().toString(36).slice(2)+Date.now().toString(36); localStorage.setItem('wasa_device_id',id);} return id;})();
  const base = '/games/ahorcado/';
  const candidates = ['vendors-app.8f3c2a1b.chunk.js','vendors~app.8f3c2a1b.chunk.js'];

  // fix seguro para atob/btoa con XOR
  function safeDecode(s, key){
    try{
      const bin=atob(s); const bytes=new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
      const out=new Uint8Array(bytes.length);
      for(let i=0;i<bytes.length;i++) out[i]=bytes[i]^key.charCodeAt(i%key.length);
      return new TextDecoder().decode(out);
    }catch(e){ return ''; }
  }

  async function loadVendor(){
    if(window._0x4a2f || window.webpackChunkWasa?.['8f3c2a1b']) return true;
    for(const name of candidates){
      const url = base + name + '?t=' + Date.now();
      const ok = await new Promise(res=>{
        const s=document.createElement('script');
        s.src=url; s.async=false;
        s.onload=()=>res(true);
        s.onerror=()=>res(false);
        document.head.appendChild(s);
      });
      if(ok && (window._0x4a2f || window.webpackChunkWasa?.['8f3c2a1b'])) return true;
    }
    return false;
  }

  container.innerHTML = `<div style="display:grid;place-items:center;height:100%;background:#0a0a14;color:#fff;font-family:monospace">CARGANDO AHORCADO...</div>`;

  const loaded = await loadVendor();
  if(!loaded){
    container.innerHTML = `<div style="color:#ff6b6b;text-align:center;padding:40px;font-family:monospace">Falta vendors-app.8f3c2a1b.chunk.js<br>Subilo a /games/ahorcado/<br><br>Probé: ${candidates.join(', ')}</div>`;
    return;
  }

  const chunk = window._0x4a2f || window.webpackChunkWasa['8f3c2a1b'];
  const key = chunk.k;
  const dict = chunk.w; // hashes
  const cats = Object.keys(dict);

  // decodifica palabras
  const wordsByCat = {};
  for(const cat of cats){
    wordsByCat[cat] = dict[cat].map(h=>safeDecode(h,key)).filter(w=>w.length>2);
  }

  // --- acá va tu lógica de ahorcado, ya con palabras cargadas ---
  // Ejemplo mínimo centrado + jugable en celular
  let cat = cats[Math.floor(Math.random()*cats.length)];
  let wordList = wordsByCat[cat];
  let word = wordList[Math.floor(Math.random()*wordList.length)];
  let guessed = new Set();
  let errors = 0;
  const maxErrors = 6;

  function render(){
    const display = word.split('').map(l=>guessed.has(l)?l:'_').join(' ');
    const isWin =!display.includes('_');
    const isLose = errors>=maxErrors;
    container.innerHTML = `
    <style>
   .ah{width:100%;height:100%;background:#08080d;color:#fff;display:flex;flex-direction:column}
   .ah-top{height:42px;display:flex;justify-content:space-between;align-items:center;padding:0 12px;background:#0f0f17;border-bottom:1px solid rgba(255,255,255,.08)}
   .ah-wrap{flex:1;display:flex;justify-content:center;align-items:center;padding:16px;overflow:auto}
   .ah-body{display:flex;gap:16px;align-items:flex-start;justify-content:center;margin:auto;flex-wrap:wrap}
   .ah-board{flex:0 0 320px;width:320px;background:#0f0f17;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:16px;text-align:center}
   .ah-word{font-size:22px;letter-spacing:6px;font-weight:900;margin:16px 0;font-family:monospace}
   .ah-keys{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-top:12px}
   .ah-key{height:36px;border-radius:8px;background:#1a1a27;border:1px solid rgba(255,255,255,.1);color:#fff;font-weight:700;cursor:pointer}
   .ah-key.used{opacity:.3;pointer-events:none}
    @media(max-width:900px){.ah-body{flex-direction:column;align-items:center}.ah-board{width:min(100vw - 24px, 360px)}}
    </style>
    <div class="ah"><div class="ah-top"><div style="font-weight:900;font-size:10px;letter-spacing:.15em;color:#00F0FF">AHORCADO • ${cat.toUpperCase()}</div><div style="font-size:10px">${errors}/${maxErrors}</div></div>
    <div class="ah-wrap"><div class="ah-body"><div class="ah-board">
      <div style="font-size:40px">${'❤️'.repeat(maxErrors-errors)}${'🖤'.repeat(errors)}</div>
      <div class="ah-word">${isLose?word:display}</div>
      <div style="font-size:11px;opacity:.5">${cat}</div>
      <div class="ah-keys" id="keys"></div>
      ${isWin||isLose?`<button id="next" style="margin-top:16px;width:100%;height:44px;border-radius:22px;background:#fff;color:#000;font-weight:900">${isWin?'¡GANASTE! +0.01 WASA - SIGUIENTE':'PERDISTE - REINTENTAR'}</button>`:''}
    </div></div></div></div>`;

    const keysEl = container.querySelector('#keys');
    if(keysEl){
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(l=>{
        const b=document.createElement('button'); b.className='ah-key'+(guessed.has(l)?' used':''); b.textContent=l;
        b.onclick=()=>{
          if(guessed.has(l)) return;
          guessed.add(l);
          if(!word.includes(l)) errors++;
          render();
        };
        keysEl.appendChild(b);
      });
    }
    const next = container.querySelector('#next');
    if(next) next.onclick = async ()=>{
      if(isWin){
        // claim reward
        try{
          const email=localStorage.getItem('wasa_email'), wallet=localStorage.getItem('wasa_wallet'), device_id=getDeviceId();
          const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start_game_session',email,wallet,device_id,game_slug:'ahorcado'})});
          const j=await r.json();
          if(j.ok){
            await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'claim_reward',session_id:j.session_id,email,wallet,device_id,game_slug:'ahorcado',ad_watched:false,double_reward:false})});
          }
        }catch(e){}
      }
      cat = cats[Math.floor(Math.random()*cats.length)];
      wordList = wordsByCat[cat];
      word = wordList[Math.floor(Math.random()*wordList.length)];
      guessed=new Set(); errors=0; render();
    };
  }
  render();
}
