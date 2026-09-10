// /games/ahorcado/game.js - SAPO MOSTAZA v13 - TABLAS + IDIOMA + TODAS LAS PALABRAS + NO SE TRABA
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

  // UI MOSTAZA - se crea una vez
  container.innerHTML=`
  <style>
.ah{background:#D4A12C;color:#2b1a0a;width:100%;height:100%;display:flex;flex-direction:column;font-family:'Space Grotesk',system-ui;overflow:hidden}
.ah-top{height:48px;display:flex;justify-content:space-between;align-items:center;padding:0 12px;background:#B88518;border-bottom:2px solid rgba(0,0,0,.15);flex-shrink:0;gap:8px}
.ah-lang{display:flex;gap:6px;background:#fff3;border-radius:20px;padding:3px}
.ah-lang button{padding:5px 12px;border-radius:16px;border:0;font-weight:800;font-size:11px;cursor:pointer;background:transparent;color:#5a3a00}
.ah-lang button.active{background:#2b1a0a;color:#FFD86A}
.ah-wrap{flex:1;display:flex;justify-content:center;align-items:center;padding:12px;overflow:auto;background:radial-gradient(ellipse at 50% 0%, rgba(255,255,255,.25) 0%, transparent 60%), #D4A12C}
.ah-body{display:flex;gap:16px;align-items:flex-start;justify-content:center;margin:auto}
.ah-tower{flex:0 0 280px;width:280px;height:420px;background:#fff9e6;border:3px solid #8a5a00;border-radius:18px;position:relative;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.25)}
.ah-water{position:absolute;bottom:0;left:0;right:0;height:38px;background:#5DE0F5;border-top:3px solid #1aa3b8;border-radius:0 0 15px 15px;display:flex;align-items:center;justify-content:center;font-weight:900;color:#0a4a55}
.ah-plank{position:absolute;left:20px;right:20px;height:18px;background:linear-gradient(180deg,#FF8C1A,#CC5A00);border:2px solid #7a2e00;border-radius:9px;box-shadow:0 2px 0 rgba(0,0,0,.2);transition:transform.6s cubic-bezier(.6,-0.28,.74,.05), opacity.4s}
.ah-plank.broken{transform:translateY(400px) rotate(35deg);opacity:0}
.ah-frog{position:absolute;width:78px;height:78px;left:50%;transform:translateX(-50%);transition:top.5s ease, transform.5s ease;z-index:5;object-fit:contain;filter:drop-shadow(0 4px 6px rgba(0,0,0,.3))}
.ah-frog.fall{top:370px!important;transform:translateX(-50%) rotate(25deg) scale(.8)}
.ah-panel{flex:0 0 360px;width:360px;display:flex;flex-direction:column;gap:10px}
.ah-card{background:#fffef6;border:2px solid #8a5a00;border-radius:14px;padding:12px;box-shadow:0 4px 12px rgba(0,0,0,.15)}
.ah-word{font-size:24px;letter-spacing:5px;font-weight:900;text-align:center;font-family:monospace;min-height:34px;color:#2b1a0a}
.ah-keys{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.ah-key{height:38px;border-radius:8px;background:#fff;border:2px solid #8a5a00;color:#2b1a0a;font-weight:800;cursor:pointer}
.ah-key.used{opacity:.3;pointer-events:none}
.ah-key.hit{background:#2ECC71;border-color:#1a7a42;color:#fff}
.ah-key.miss{background:#FF3B30;border-color:#7a0000;color:#fff}
  @media(max-width:900px){.ah-body{flex-direction:column}.ah-tower,.ah-panel{width:min(100vw - 20px, 360px);flex:0 0 auto}.ah-tower{height:380px}}
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
  </div></div></div>`;

  const tower = container.querySelector('#tower');
  const elWord = container.querySelector('#ah-word');
  const elKeys = container.querySelector('#ah-keys');
  const elAction = container.querySelector('#ah-action');
  const elHint = container.querySelector('#ah-hint');
  const catSel = container.querySelector('#catSel');
  const langEs = container.querySelector('#langEs');
  const langEn = container.querySelector('#langEn');

  const loaded = await loadVendor();
  if(!loaded){ elWord.textContent='Falta vendor'; return; }

  const chunk = window._0x4a2f || window.webpackChunkWasa['8f3c2a1b'];
  const key = chunk.k; const dict = chunk.w;
  let currentLang = 'es';
  const CACHE_KEY='sapo_cache_mostaza_v13';
  let cache={}; try{ cache=JSON.parse(localStorage.getItem(CACHE_KEY)||'{}'); }catch{}

  async function getWords(cat){
    if(cache[cat]?.length>5) return cache[cat];
    const hashes=dict[cat]||[]; const out=[];
    for(let i=0;i<hashes.length;i+=40){
      for(let j=i;j<Math.min(i+40,hashes.length);j++){ const w=safeDecode(hashes[j],key); if(w.length>2) out.push(w); }
      if(i%120===0) await new Promise(r=>setTimeout(r,0));
    }
    cache[cat]=out; try{ localStorage.setItem(CACHE_KEY,JSON.stringify(cache)); }catch{}
    return out;
  }

  function getCatsByLang(lang){
    return Object.keys(dict).filter(c=>c.startsWith(lang+'_'));
  }

  function refreshCatSelect(){
    const cats = getCatsByLang(currentLang);
    catSel.innerHTML='';
    cats.forEach(c=>{
      const o=document.createElement('option'); o.value=c; o.textContent=c.replace(currentLang+'_','').toUpperCase();
      catSel.appendChild(o);
    });
  }

  // torre de tablas
  const PLANK_POS = [30,90,150,210,270,330]; // y de cada tabla (6 tablas)
  let planks=[], frogEl, word, guessed, errors, maxErrors=6;

  function buildTower(){
    tower.querySelectorAll('.ah-plank,.ah-frog').forEach(e=>e.remove());
    planks=[];
    PLANK_POS.forEach((y,i)=>{
      const p=document.createElement('div'); p.className='ah-plank'; p.style.top=y+'px'; p.style.width=(220 - i*10)+'px'; p.style.left=(40 + i*5)+'px';
      tower.appendChild(p); planks.push(p);
    });
    frogEl=document.createElement('img'); frogEl.className='ah-frog'; frogEl.src=FROG_URL; frogEl.onerror=()=>{ frogEl.outerHTML=`<div class="ah-frog" style="font-size:56px;display:grid;place-items:center">🐸</div>`; frogEl=container.querySelector('.ah-frog'); };
    frogEl.style.top=(PLANK_POS[0]-62)+'px'; tower.appendChild(frogEl);
  }

  async function newRound(){
    const cat = catSel.value || getCatsByLang(currentLang)[0];
    const words = await getWords(cat);
    word = words[Math.floor(Math.random()*words.length)];
    guessed=new Set(); errors=0;
    elHint.textContent = `${cat.toUpperCase()} • ${words.length} palabras • ${word.length} letras`;
    buildTower();
    buildKeys();
    update();
  }

  function buildKeys(){
    elKeys.innerHTML=''; elAction.innerHTML='';
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(l=>{
      const b=document.createElement('button'); b.className='ah-key'; b.textContent=l; b.dataset.l=l;
      b.onclick=()=>{
        if(guessed.has(l)) return;
        guessed.add(l);
        if(!word.includes(l)){ errors++; b.classList.add('miss'); const plankToBreak = planks[planks.length-1-errors]; if(plankToBreak) plankToBreak.classList.add('broken'); if(errors<maxErrors){ const nextTop = PLANK_POS[errors]; if(frogEl) frogEl.style.top=(nextTop-62)+'px'; } else { if(frogEl) frogEl.classList.add('fall'); } if(navigator.vibrate) navigator.vibrate(30); }
        else b.classList.add('hit');
        b.classList.add('used');
        update();
      };
      elKeys.appendChild(b);
    });
  }

  function update(){
    const display = word.split('').map(ch=>guessed.has(ch)?ch:'_').join(' ');
    elWord.textContent = display;
    const win=!display.includes('_'); const lose=errors>=maxErrors;
    if(win || lose){
      elKeys.querySelectorAll('button').forEach(b=>b.disabled=true);
      const btn=document.createElement('button');
      btn.style.cssText='width:100%;height:46px;border-radius:22px;background:#2b1a0a;color:#FFD86A;font-weight:900;border:0;cursor:pointer';
      btn.textContent = win? `¡GANASTE! ${word} → +0.01 WASA` : `SE CAYÓ AL AGUA: ${word} - REINTENTAR`;
      btn.onclick=async()=>{
        if(win){
          try{
            const email=localStorage.getItem('wasa_email'), wallet=localStorage.getItem('wasa_wallet'), device_id=getDeviceId();
            const rs=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start_game_session',email,wallet,device_id,game_slug:'ahorcado'})});
            const js=await rs.json();
            if(js.ok){ const rc=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'claim_reward',session_id:js.session_id,email,wallet,device_id,game_slug:'ahorcado',ad_watched:false,double_reward:false})}); const j=await rc.json(); if(j.ok && window.setCoinsUI){ const bal=j.wasa_balance??j.guest_balance??0; localStorage.setItem(j.is_guest?'wasa_coins_guest':'wasa_coins',bal); window.setCoinsUI(bal); } }
          }catch{}
        }
        newRound();
      };
      elAction.innerHTML=''; elAction.appendChild(btn);
    }
  }

  langEs.onclick=()=>{ currentLang='es'; langEs.classList.add('active'); langEn.classList.remove('active'); refreshCatSelect(); newRound(); };
  langEn.onclick=()=>{ currentLang='en'; langEn.classList.add('active'); langEs.classList.remove('active'); refreshCatSelect(); newRound(); };
  catSel.onchange=()=>newRound();

  refreshCatSelect(); newRound();
}
