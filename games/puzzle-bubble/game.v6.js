// v20 FINAL - RUZZLE BUBBLE - DINO PUNK VERDE CLARO - NO BASE64
// Uso: window.RUZZLE_DINO_URL = 'https://tu-cdn.com/ruzzle_dino_final_green.png'
// Si no pones nada, usa el verde por defecto
export function init(container, args){
  const DINO_URL_IDLE = args?.dinoUrlIdle || window.RUZZLE_DINO_IDLE || 'dino_manos_cintura.png';
  const DINO_URL_WIN = args?.dinoUrlWin || window.RUZZLE_DINO_WIN || 'dino_festejando.png';
  const DINO_URL = DINO_URL_IDLE;
  const WORKER_URL = window.WASA_CONFIG?.WORKER_URL || 'https://games-wasa-worker.javimsites.workers.dev/';
  const getDeviceId = ()=> window.getDeviceId?window.getDeviceId():(()=>{let id=localStorage.getItem('wasa_device_id'); if(!id){id='dev_'+Math.random().toString(36).slice(2)+Date.now().toString(36); localStorage.setItem('wasa_device_id',id);} return id;})();

  const B=8,Q=12,WE=32,UU=WE*0.865,RN=B*WE+WE/2+2,NU=Q*UU+80;
  const PAL=["#00D4FF","#FF3BB0","#FFD400","#2AFF8A","#FF7A2E"];

  // COLOR PROGRESSION BY LEVEL - 10 niveles por color, se oscurece levemente
  const COLOR_STAGES = [
    {name:'VIOLETA', light:'#f3e8ff', dark:'#7c3aed'}, // 1-10 violeta clarito -> oscuro
    {name:'VERDE',   light:'#dcfce7', dark:'#16a34a'}, // 11-20 verde
    {name:'CELESTE', light:'#e0f2fe', dark:'#0284c7'}, // 21-30 azul celeston
    {name:'SALMON',  light:'#ffe4e6', dark:'#f43f5e'}, // 31-40 salmon/rosa
    {name:'AMARILLO',light:'#fef9c3', dark:'#ca8a04'}, // 41-50 amarillo
    {name:'NARANJA', light:'#ffedd5', dark:'#ea580c'}, // 51-60 naranja
    {name:'TURQUESA',light:'#ccfbf1', dark:'#0d9488'}, // 61-70 turquesa
    {name:'ROSA',    light:'#fce7f3', dark:'#db2777'}, // 71-80 rosa
  ];
  function hexToRgb(h){ h=h.replace('#',''); if(h.length===3) h=h.split('').map(c=>c+c).join(''); let r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16); return {r,g,b}; }
  function rgbToHex(r,g,b){ return '#'+[r,g,b].map(x=>{ let h=Math.round(x).toString(16); return h.length===1?'0'+h:h; }).join(''); }
  function lerpColor(a,b,t){ let ca=hexToRgb(a), cb=hexToRgb(b); return rgbToHex(ca.r+(cb.r-ca.r)*t, ca.g+(cb.g-ca.g)*t, ca.b+(cb.b-ca.b)*t); }
  function getLevelColors(lvl){
    let stageIdx = Math.floor((lvl-1)/10) % COLOR_STAGES.length;
    let stage = COLOR_STAGES[stageIdx];
    let progress = ((lvl-1)%10)/9; // 0 to 1 dentro del bloque de 10
    let bg = lerpColor(stage.light, stage.dark, progress);
    // background del juego oscuro basado en ese color pero muy oscurecido para no quemar ojos
    // mezclamos el color con #08080d
    let darkBg = lerpColor(bg, '#08080d', 0.85 - progress*0.15); // se va oscureciendo
    let accent = lerpColor(stage.light, stage.dark, 0.5+progress*0.3);
    return {stage, progress, bg, darkBg, accent, stageName: stage.name, levelInStage: ((lvl-1)%10)+1 };
  }
  function applyLevelTheme(lvl){
    let {darkBg, accent, stageName, levelInStage} = getLevelColors(lvl);
    // cambiar fondo principal
    let pb6 = container.querySelector('.pb6');
    if(pb6){ pb6.style.background = `radial-gradient(ellipse at 30% 20%, ${accent}22, transparent 60%), ${darkBg}`; }
    // top bar accent
    let top = container.querySelector('#pb6title');
    if(top){ top.style.color = accent; }
    // dino card border
    let dinoCard = container.querySelector('.dino-card');
    if(dinoCard){ dinoCard.style.borderColor = accent+'55'; }
    // barra de progreso
    let bar = container.querySelector('#pb6bar');
    if(bar){ bar.style.background = `linear-gradient(90deg, ${accent}, ${accent}aa)`; }
  }


  const Oe=(r,c)=>({x:c*WE+(r%2?WE/2:0)+WE/2+1,y:r*UU+WE/2+8});
  const mm=(x,y)=>{let r=Math.round((y-WE/2-8)/UU),off=r%2?WE/2:0,c=Math.round((x-WE/2-1-off)/WE);return{r,c}};
  const ru=(r,c)=>r%2===0?[[r-1,c-1],[r-1,c],[r,c-1],[r,c+1],[r+1,c-1],[r+1,c]]:[[r-1,c],[r-1,c+1],[r,c-1],[r,c+1],[r+1,c],[r+1,c+1]];
  const tu=e=>e.map(n=>[...n]);
  function vm(e,r,c){let col=e[r]?.[c];if(col==null)return[];let seen=new Set(),q=[[r,c]];seen.add(`${r},${c}`);let out=[];while(q.length){let [rr,cc]=q.shift();if(e[rr]?.[cc]!==col)continue;out.push([rr,cc]);for(let [nr,nc] of ru(rr,cc)){if(nr<0||nr>=Q||nc<0||nc>=B)continue;if(nr%2===1 && nc>=B-1) continue; let k=`${nr},${nc}`;if(seen.has(k))continue;if(e[nr][nc]===col){seen.add(k);q.push([nr,nc]);}}}return out}
  function hm(e){
    let seen=new Set(),qq=[];
    for(let c=0;c<B-1;c++) if(e[0][c]!==null){ qq.push([0,c]); seen.add(`0,${c}`);}
    while(qq.length){let [r,c]=qq.shift();for(let [nr,nc] of ru(r,c)){if(nr<0||nr>=Q||nc<0||nc>=B)continue;if(nr%2===1 && nc>=B-1) continue; let k=`${nr},${nc}`;if(seen.has(k))continue;if(e[nr][nc]!==null){seen.add(k);qq.push([nr,nc]);}}}
    let floating=[];for(let r=0;r<Q;r++) for(let c=0;c<B;c++){if(r%2===1 && c>=B-1) continue; if(e[r][c]!==null&&!seen.has(`${r},${c}`))floating.push([r,c]);}return floating;
  }
  function isConnectedTop(grid,r,c){ if(r===0) return true; let seen=new Set(),qq=[[r,c]];seen.add(`${r},${c}`);while(qq.length){let [rr,cc]=qq.shift();if(rr===0) return true; for(let [nr,nc] of ru(rr,cc)){if(nr<0||nr>=Q||nc<0||nc>=B)continue;if(nr%2===1 && nc>=B-1) continue; if(grid[nr][nc]===null)continue;let k=`${nr},${nc}`;if(seen.has(k))continue;seen.add(k);qq.push([nr,nc]);}} return false; }
  function lu(x,y,grid){let {r,c}=mm(x,y),best=[];for(let dr=-3;dr<=3;dr++)for(let dc=-3;dc<=3;dc++){let nr=r+dr,nc=c+dc;if(nr<0||nr>=Q||nc<0||nc>=B)continue;if(nr%2===1 && nc>=B-1) continue; if(grid[nr][nc]!==null)continue;if(!(nr===0||ru(nr,nc).some(([rr,cc])=>{if(rr<0||rr>=Q||cc<0||cc>=B)return false; if(rr%2===1 && cc>=B-1) return false; return grid[rr][cc]!==null;})))continue;let p=Oe(nr,nc),d=Math.hypot(p.x-x,p.y-y);best.push({r:nr,c:nc,d})}if(best.length===0){for(let rr=0;rr<Q;rr++)for(let cc=0;cc<B;cc++){if(rr%2===1 && cc>=B-1) continue; if(grid[rr][cc]!==null) continue; if(!(rr===0||ru(rr,cc).some(([a,b])=>{if(a<0||a>=Q||b<0||b>=B)return false; if(a%2===1 && b>=B-1) return false; return grid[a][b]!==null;})))continue;let p=Oe(rr,cc);best.push({r:rr,c:cc,d:Math.hypot(p.x-x,p.y-y)})}}if(best.length===0)return null;best.sort((a,b)=>a.d-b.d);return best[0]}
  function ym(angle,grid,ox,oy){let rad=angle*Math.PI/180,dx=Math.cos(rad),dy=Math.sin(rad),x=ox,y=oy;for(let i=0;i<500;i++){x+=dx*6;y+=dy*6;if(x<=WE/2+2){x=WE/2+2;dx*=-1}if(x>=RN-WE/2-2){x=RN-WE/2-2;dx*=-1}if(y<=WE/2+10){let p=lu(x,y,grid);if(p){let v=Oe(p.r,p.c);return{place:p,x:v.x,y:v.y}}return null}for(let r=0;r<Q;r++)for(let c=0;c<B;c++){if(grid[r][c]===null)continue;if(r%2===1 && c>=B-1) continue; let g=Oe(r,c);if(Math.hypot(g.x-x,g.y-y)<WE*0.88){let pp=lu(x,y,grid);if(pp){let vv=Oe(pp.r,pp.c);return{place:pp,x:vv.x,y:vv.y}}return null}}}return null}
  function gm(angle,grid,ox,oy){let rad=angle*Math.PI/180,dx=Math.cos(rad),dy=Math.sin(rad),x=ox,y=oy,p=[{x,y}],bounces=0;for(let i=0;i<300;i++){x+=dx*8;y+=dy*8;if(x<=WE/2+2||x>=RN-WE/2-2){dx*=-1;x=Math.max(WE/2+2,Math.min(RN-WE/2-2,x));p.push({x,y});bounces++;if(bounces>=2)break}if(y<=WE/2+12){p.push({x,y});break}for(let r=0;r<Q;r++)for(let c=0;c<B;c++){if(grid[r][c]===null)continue;if(r%2===1 && c>=B-1) continue; let H=Oe(r,c);if(Math.hypot(H.x-x,H.y-y)<WE*0.9){p.push({x,y});return p}}}return p}

  container.innerHTML=`
  <style>
.pb6{width:100%;height:100%;background:#08080d;color:#fff;font-family:system-ui;display:flex;flex-direction:column;overflow:hidden;position:relative}
.pb6-top{height:42px;display:flex;justify-content:space-between;align-items:center;padding:0 12px;background:#0f0f17;border-bottom:1px solid rgba(255,255,255,.08);flex-shrink:0}
.pb6-wrap{flex:1;display:flex;justify-content:center;align-items:center;padding:12px;overflow:auto}
.pb6-body{display:flex;gap:16px;align-items:flex-start;justify-content:center;margin:auto}
.pb6-left{flex:0 0 ${RN}px;width:${RN}px;background:#0f0f17;border:1px solid rgba(255,255,255,.08);border-radius:16px;overflow:hidden}
.pb6-canvas{display:block;width:${RN}px;height:${NU}px;touch-action:none}
.pb6-right{flex:0 0 300px;width:300px;display:flex;flex-direction:column;gap:10px}
.pb6-st{background:#15151f;border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:10px}.pb6-st b{font-family:monospace;font-size:14px}.pb6-st span{font-size:9px;opacity:.5}
.pb6-win{position:absolute;inset:0;background:rgba(0,0,0,.82);display:grid;place-items:center;z-index:20;padding:16px}
.pb6-card{background:#15151f;border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:18px;text-align:center;width:min(340px,92vw)}
#readyOverlay{position:absolute;inset:0;display:grid;place-items:center;background:rgba(8,8,13,.88);z-index:50;backdrop-filter:blur(4px)}
#readyText{font-size:72px;font-weight:900;color:#fff;letter-spacing:.05em;text-shadow:0 0 12px #00F0FF,0 0 32px #FF00D4;transform:scale(.4);transition:transform .35s cubic-bezier(.175,.885,.32,1.275)}
.dino-card{background:#15151f;border:1px solid rgba(42,255,138,.2);border-radius:16px;padding:10px;text-align:center;position:relative;overflow:hidden}
.dino-img-bg{background:#15151f;border-radius:12px;padding:6px}
@media(max-width:900px){.pb6-wrap{padding:8px}.pb6-body{flex-direction:column;align-items:center;width:100%}.pb6-left{width:min(100vw - 16px, ${RN}px);flex:0 0 auto}.pb6-right{width:min(100vw - 16px, 300px);flex:0 0 auto}.pb6-canvas{width:100%!important;height:auto!important;aspect-ratio:${RN}/${NU}}}
  </style>
  <div class="pb6">
    <div class="pb6-top"><div id="pb6title" style="font-weight:900;font-size:11px;letter-spacing:.15em;color:#2AFF8A">RUZZLE BUBBLE • DINO PUNK</div><div id="pb6lvl" style="background:#1b1b27;border-radius:16px;padding:4px 10px;font-size:10px;font-weight:800">LVL 1</div></div>
    <div class="pb6-wrap"><div class="pb6-body">
      <div class="pb6-left"><canvas id="pb6cv" class="pb6-canvas" width="${RN}" height="${NU}"></canvas><div style="height:3px;background:#000"><div id="pb6bar" style="height:100%;background:linear-gradient(90deg,#2AFF8A,#00D4FF,#FF3BB0);width:0%"></div></div><div style="display:flex;justify-content:space-between;padding:4px 8px;font-size:8px;opacity:.4;font-family:monospace"><span>▼</span><span id="pb6ceil">45s</span><span>▼</span></div></div>
      <div class="pb6-right">
        <div class="dino-card">
          <div class="dino-img-bg"><img id="dinoImg" src="${DINO_URL}" style="width:160px;height:160px;object-fit:contain;display:block;margin:0 auto;" onerror="this.style.display='none'"/></div>
          <div style="font-weight:900;font-size:13px;letter-spacing:.12em;color:#2AFF8A;margin-top:6px">RUZZLE</div>
          <div style="font-size:9px;opacity:.5;letter-spacing:.1em">DINO PUNK VERDE • LVL <span id="dinoLvl">1</span></div>
          <div id="dinoBubble" style="margin-top:8px;background:#0e0e14;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:8px 10px;font-size:12px;font-weight:700;min-height:36px;display:grid;place-items:center;line-height:1.2">READY?</div>
        </div>
        <div class="pb6-stats" style="display:grid;grid-template-columns:1fr 1fr;gap:6px"><div class="pb6-st"><b id="pb6obj">0/30</b><br><span>OBJETIVO</span></div><div class="pb6-st"><b id="pb6tm">45s / 12</b><br><span>TECHO</span></div><div class="pb6-st"><b id="pb6sc">0</b><br><span>SCORE</span></div><div class="pb6-st"><b id="pb6nxt" style="display:inline-block;width:16px;height:16px;border-radius:50%"></b><br><span>SIGUIENTE</span></div></div>
      </div>
    </div></div>
    <div id="pb6ui"></div>
    <div id="readyOverlay"><div id="readyText">READY?</div></div>
  </div>`;

  const canvas=container.querySelector('#pb6cv');
  const DPR = 1;
  canvas.width = RN * DPR; canvas.height = NU * DPR;
  canvas.style.width = RN+'px'; canvas.style.height = NU+'px';
  const ctx=canvas.getContext('2d',{alpha:false}); ctx.scale(DPR,DPR);

  let audioCtx=null;
  function getAudio(){ if(!audioCtx){ try{ audioCtx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } return audioCtx; }
  function playTone(f,t,v,d,s){ const c=getAudio(); if(!c) return; if(c.state==='suspended') c.resume(); const o=c.createOscillator(),g=c.createGain(); o.type=t||'sine'; o.frequency.value=f; if(s) o.frequency.linearRampToValueAtTime(s,c.currentTime+d); g.gain.setValueAtTime(v,c.currentTime); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+d); o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime+d); }
  function sfxPop(n){ playTone(440+n*40,'sine',0.3,0.12); setTimeout(()=>playTone(880,'triangle',0.15,0.15),30); }
  function sfxBounce(){ playTone(200,'square',0.15,0.08); }
  function sfxShoot(){ playTone(150,'sine',0.25,0.15,600); }
  function sfxReady(){ playTone(300,'sine',0.3,0.4,400); }
  function sfxGo(){ playTone(400,'sine',0.4,0.3,800); setTimeout(()=>playTone(600,'sine',0.35,0.4,900),100); }
  function sfxCombo(c){ playTone(300+c*80,'triangle',0.35,0.35,600+c*50); }
  function sfxDrop(n){ for(let i=0;i<Math.min(n,5);i++) setTimeout(()=>playTone(200+i*30,'sine',0.2,0.2), i*60); }
  function sfxWin(){ playTone(400,'sine',0.3,0.2,600); setTimeout(()=>playTone(600,'sine',0.3,0.3,900),150); setTimeout(()=>playTone(800,'sine',0.4,0.5),300); }
  function sfxLose(){ playTone(400,'sawtooth',0.25,0.5,100); }
  let audioUnlocked=false;
  function unlockAudio(){ if(audioUnlocked) return; audioUnlocked=true; const c=getAudio(); if(c && c.state==='suspended') c.resume(); }

  let level=parseInt(localStorage.getItem('pb_level')||'1'), target=()=>Math.min(80,30+(level-1)*5), need=()=>Math.max(5,12-Math.floor((level-1)/4)), maxT=()=>Math.max(10,45-(level-1)*0.5);
  let grid=[], score=0, popped=0, cur=0, nxt=0, angle=-90, ghost=null, traj=[], shooting=null, shot=0, ceilT=maxT(), ceilIv=null, sess=null, pend=null, claiming=false;
  let colors=()=>Math.min(5,3+Math.floor(level/2)), It=RN/2, Dt=NU-22;
  let rafId=null, isShooting=false, shotsSinceAd=0; const SHOTS_PER_AD=45; // cada 45 tiros
  let popTexts=[], combo=0, lastPopTime=0;
  const COMBO_WORDS=["Nice!","Good!","Great!","Very Good!","Excellent!","Amazing!","Incredible!","LEGENDARY!"];
  function addPopAnim(r,c,colIndex,count,isFloating){
    const p=Oe(r,c); let txt=""; if(isFloating) txt="Drop!"; else { if(count>=8) txt=COMBO_WORDS[7]; else if(count>=7) txt=COMBO_WORDS[6]; else if(count>=6) txt=COMBO_WORDS[5]; else if(count>=5) txt=COMBO_WORDS[4]; else if(count>=4) txt=COMBO_WORDS[3]; else if(count>=3) txt=COMBO_WORDS[2]; else txt=COMBO_WORDS[0]; }
    const now=Date.now(); if(now-lastPopTime<2000 && !isFloating) combo++; else combo=1; lastPopTime=now;
    let bonus= combo>1?` Combo x${combo}!`:"";
    popTexts.push({x:p.x,y:p.y,text:txt+bonus,color:PAL[colIndex]||"#fff",life:60,maxLife:60,scale:0.6,isCombo:combo>1});
    if(popTexts.length>6) popTexts.shift();
    const dinoB=container.querySelector('#dinoBubble');
    if(dinoB){ if(combo>=3) dinoB.textContent=`WOW! ${txt} Combo x${combo}!`; else if(count>=5) dinoB.textContent=`${txt} 🔥🔥`; else if(isFloating) dinoB.textContent=`Caen ${count}!`; else dinoB.textContent=txt; }
    if(isFloating) sfxDrop(count); else { sfxPop(count); if(combo>1) setTimeout(()=>sfxCombo(combo),120); }
  }
  const spriteCanvases = PAL.map(col=>{ const s=document.createElement('canvas'); s.width=WE; s.height=WE; const sc=s.getContext('2d'); sc.fillStyle=col; sc.beginPath(); sc.arc(WE/2,WE/2,WE/2-1,0,Math.PI*2); sc.fill(); sc.fillStyle='rgba(255,255,255,.35)'; sc.beginPath(); sc.arc(WE*0.35,WE*0.35,WE*0.18,0,Math.PI*2); sc.fill(); return s; });
  async function startSess(){ try{ const email=localStorage.getItem('wasa_email'), wallet=localStorage.getItem('wasa_wallet'), device_id=getDeviceId(); const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start_game_session',email,wallet,device_id,game_slug:'ruzzle-bubble',level})}); const j=await r.json(); if(j.ok) sess=j.session_id; }catch(e){} }
  async function claim(isDouble, ad){ if(claiming) return {ok:false}; if(!sess) await startSess(); if(!sess) return {ok:false}; claiming=true; try{ const email=localStorage.getItem('wasa_email'), wallet=localStorage.getItem('wasa_wallet'), device_id=getDeviceId(); const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'claim_reward',session_id:sess,email,wallet,device_id,game_slug:'ruzzle-bubble',level,ad_watched:ad,double_reward:isDouble,time_taken:30})}); const j=await r.json(); if(j.ok){ const bal=j.wasa_balance??j.guest_balance??0; if(j.is_guest){ localStorage.setItem('wasa_coins_guest',bal); localStorage.setItem('wasa_coins','0'); } else localStorage.setItem('wasa_coins',bal); if(window.setCoinsUI) window.setCoinsUI(bal); sess=null; claiming=false; return j; } claiming=false; return {ok:false}; }catch(e){ claiming=false; return {ok:false}; } }
  function openAd(t){ if(window.vrAd!==0) return; pend=t; window.vrAdType=t; window.vrAd=1; }
  function checkAd(){ if(shotsSinceAd>=SHOTS_PER_AD){ shotsSinceAd=0; if(window.vrAd===0 && !isShooting){ pend='inter'; window.vrAdType='inter'; window.vrAd=1; } } }
  function doInitGrid(){
    let rows=Math.min(7,5+Math.floor(level/3)); grid=Array.from({length:Q},()=>Array(B).fill(null));
    for(let r=0;r<rows;r++){ let cols=r%2===1?B-1:B; for(let c=0;c<cols;c++){ if(level===1&&Math.random()<0.12) continue; grid[r][c]=Math.floor(Math.random()*colors()); } }
    for(let r=0;r<Q;r++) if(r%2===1) grid[r][B-1]=null;
    popped=0; shot=0; ceilT=maxT(); cur=Math.floor(Math.random()*colors()); nxt=Math.floor(Math.random()*colors()); angle=-90; shooting=null; isShooting=false; ghost=null; traj=[]; score=0; applyLevelTheme(level); const _di=container.querySelector('#dinoImg'); if(_di) _di.src=DINO_URL_IDLE; startSess(); updateUI(); startCeil(); drawBoard();
  }
  function showReadyGo(){
    const ov=container.querySelector('#readyOverlay'); const txt=container.querySelector('#readyText'); const dinoB=container.querySelector('#dinoBubble'); const lvlEl=container.querySelector('#dinoLvl'); if(lvlEl) lvlEl.textContent=level; if(!ov){ doInitGrid(); return; }
    ov.style.display='grid'; ov.style.opacity='1'; txt.textContent='READY?'; txt.style.transform='scale(.4)'; txt.style.color='#fff'; unlockAudio(); sfxReady(); if(dinoB) dinoB.textContent='Ready?';
    setTimeout(()=>{ txt.style.transform='scale(1.15)'; },80);
    setTimeout(()=>{ txt.textContent='GO!'; txt.style.color='#2AFF8A'; txt.style.transform='scale(.5)'; sfxGo(); setTimeout(()=>{ txt.style.transform='scale(1.4)'; },40); if(dinoB) dinoB.textContent='GO GO GO! 🔥'; },950);
    setTimeout(()=>{ ov.style.transition='opacity .4s'; ov.style.opacity='0'; setTimeout(()=>{ ov.style.display='none'; doInitGrid(); },420); },1750);
  }
  function startCeil(){ if(ceilIv) clearInterval(ceilIv); ceilIv=setInterval(()=>{ ceilT--; updateUI(); if(ceilT<=0){ pushCeil(); ceilT=maxT(); } },1000); }
  function pushCeil(){
    if(isShooting) return; const old = tu(grid); let ng=Array.from({length:Q},()=>Array(B).fill(null));
    for(let r=Q-1;r>0;r--){ let src=old[r-1]; let row=[...src]; if(r%2===1) row[B-1]=null; ng[r]=row; }
    let nr=Array(B).fill(null); for(let c=0;c<B-1;c++){ if(Math.random()>0.15) nr[c]=Math.floor(Math.random()*colors()); } nr[B-1]=null; ng[0]=nr;
    let floating=hm(ng); if(floating.length>0){ floating.forEach(([rr,cc])=> ng[rr][cc]=null ); popped+=floating.length; score+=floating.length*5; if(floating.length>=2) addPopAnim(ng.length-2,2,2,floating.length,true); }
    if(ng[Q-1].some(v=>v!==null)){ lose(); return; } grid=ng; shot=0; updateUI(); drawBoard();
  }
  function updateUI(){ let {stageName, levelInStage, accent} = getLevelColors(level); container.querySelector('#pb6lvl').textContent=`LVL ${level} • ${stageName} ${levelInStage}/10`; const dl=container.querySelector('#dinoLvl'); if(dl) dl.textContent=level; let titleEl=container.querySelector('#pb6title'); if(titleEl){ titleEl.innerHTML=`RUZZLE BUBBLE • <span style='color:${accent}'>${stageName}</span> • ${levelInStage}/10`; } container.querySelector('#pb6obj').textContent=popped+'/'+target(); container.querySelector('#pb6tm').textContent=ceilT+'s / '+need(); container.querySelector('#pb6sc').textContent=score; container.querySelector('#pb6bar').style.width=Math.min(100,popped/target()*100)+'%'; container.querySelector('#pb6ceil').textContent=ceilT+'s'; const nxtEl=container.querySelector('#pb6nxt'); if(nxtEl) nxtEl.style.background=PAL[nxt]; }
  function drawBoard(){
    ctx.fillStyle='#0f0f17'; ctx.fillRect(0,0,RN,NU);
    if(traj.length>1){ ctx.strokeStyle='rgba(255,255,255,.25)'; ctx.lineWidth=1; ctx.setLineDash([4,4]); ctx.beginPath(); ctx.moveTo(traj[0].x,traj[0].y); for(let i=1;i<traj.length;i++) ctx.lineTo(traj[i].x,traj[i].y); ctx.stroke(); ctx.setLineDash([]); }
    for(let r=0;r<Q;r++) for(let c=0;c<B;c++){ if(r%2===1 && c>=B-1) continue; let col=grid[r][c]; if(col==null) continue; let {x,y}=Oe(r,c); ctx.drawImage(spriteCanvases[col], x-WE/2, y-WE/2); }
    if(isShooting && shooting){ ctx.drawImage(spriteCanvases[shooting.col], shooting.x-WE/2, shooting.y-WE/2); }
    for(let t of popTexts){ let a=t.life/t.maxLife; if(a<=0) continue; ctx.save(); ctx.globalAlpha=a; ctx.translate(t.x, t.y - (t.maxLife - t.life)*0.9); ctx.scale(t.scale,t.scale); ctx.font=`900 ${t.isCombo?18:14}px system-ui`; ctx.textAlign='center'; ctx.lineWidth=3; ctx.strokeStyle='rgba(0,0,0,.85)'; ctx.strokeText(t.text,0,0); ctx.fillStyle=t.color; ctx.fillText(t.text,0,0); ctx.restore(); }
    for(let t of popTexts){ t.life--; t.scale+=0.012; } popTexts=popTexts.filter(t=>t.life>0);
    ctx.fillStyle='#1b1b27'; ctx.beginPath(); ctx.arc(It,Dt,28,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='rgba(255,255,255,.15)'; ctx.stroke(); ctx.drawImage(spriteCanvases[cur], It-16, Dt-16, 32,32);
    if(popTexts.length>0 && !isShooting){ if(rafId) cancelAnimationFrame(rafId); rafId=requestAnimationFrame(drawBoard); }
  }
  function loop(){
    if(isShooting && shooting){
      shooting.x+=shooting.dirX*14; shooting.y+=shooting.dirY*14;
      if(shooting.x<=WE/2+2||shooting.x>=RN-WE/2-2){ shooting.dirX*=-1; shooting.x=Math.max(WE/2+2,Math.min(RN-WE/2-2,shooting.x)); sfxBounce(); }
      if(shooting.y<=WE/2+10){ let p=lu(shooting.x,shooting.y,grid); if(p) place(p.r,p.c,shooting.col); else { isShooting=false; shooting=null; drawBoard(); } return; }
      for(let r=0;r<Q;r++) for(let c=0;c<B;c++){ if(r%2===1 && c>=B-1) continue; if(grid[r][c]===null)continue; let g=Oe(r,c); if(Math.hypot(g.x-shooting.x,g.y-shooting.y)<WE*0.9){ let p=lu(shooting.x,shooting.y,grid); if(p) place(p.r,p.c,shooting.col); else { isShooting=false; shooting=null; drawBoard(); } return; } }
      drawBoard(); rafId=requestAnimationFrame(loop);
    }
  }
  function place(r,c,col){
    let pendingCol=col; isShooting=false; shooting=null; if(rafId){ cancelAnimationFrame(rafId); rafId=null; }
    if(r%2===1 && c>=B-1) c=B-2; if(grid[r][c]!==null){ let alt=lu(Oe(r,c).x,Oe(r,c).y,grid); if(!alt){ shot++; shotsSinceAd++; checkAd(); updateUI(); drawBoard(); return; } r=alt.r; c=alt.c; }
    let ng=tu(grid); ng[r][c]=pendingCol; if(r%2===1) ng[r][B-1]=null; if(!isConnectedTop(ng,r,c)){ ng[r][c]=null; shot++; shotsSinceAd++; checkAd(); updateUI(); grid=ng; drawBoard(); return; }
    let conn=vm(ng,r,c); if(conn.length>=3){ addPopAnim(r,c,pendingCol,conn.length,false); conn.forEach(([rr,cc])=> ng[rr][cc]=null ); let floating=hm(ng); if(floating.length>0) addPopAnim(floating[0][0],floating[0][1],pendingCol,floating.length,true); floating.forEach(([rr,cc])=> ng[rr][cc]=null ); popped+=conn.length+floating.length; score+=conn.length*15+floating.length*8; grid=ng; shot++; shotsSinceAd++; checkAd(); updateUI(); drawBoard(); if(popped>=target()||grid.flat().every(v=>v===null)){ win(); return; } } else { grid=ng; shot++; shotsSinceAd++; checkAd(); updateUI(); drawBoard(); }
    if(shot>=need()){ pushCeil(); ceilT=maxT(); shot=0; } cur=nxt; nxt=Math.floor(Math.random()*colors()); updateUI(); drawBoard(); if(grid[Q-1].some(v=>v!==null)) lose();
  }
  function win(){ if(ceilIv) clearInterval(ceilIv); isShooting=false; shooting=null; if(rafId) cancelAnimationFrame(rafId); const dinoB=container.querySelector('#dinoBubble'); if(dinoB) dinoB.textContent='You Rock! 🤘'; sfxWin(); container.querySelector('#pb6ui').innerHTML=`<div class="pb6-win"><div class="pb6-card"><div style="font-size:28px">✓</div><h2 style="font-size:18px;font-weight:900;margin-top:8px">¡NIVEL ${level}!</h2><div style="margin-top:12px;background:#0e0e14;border-radius:12px;padding:12px"><button id="bCl" style="width:100%;height:44px;border-radius:22px;background:#fff;color:#000;font-weight:900">RECLAMAR +0.01 WASA</button><button id="bX2" style="margin-top:8px;width:100%;height:44px;border-radius:22px;background:linear-gradient(90deg,#2AFF8A,#00D4FF);color:#fff;font-weight:900">X2 ANUNCIO → 0.02</button></div></div></div>`; container.querySelector('#bCl').onclick=async()=>{ let b=container.querySelector('#bCl'); b.textContent='VALIDANDO...'; b.disabled=true; let r=await claim(false,false); if(r.ok){ level++; localStorage.setItem('pb_level',level); container.querySelector('#pb6ui').innerHTML=`<div class="pb6-win"><div class="pb6-card"><div style="font-size:28px">✅</div><div style="font-weight:900;margin:8px 0">+0.01 ACREDITADO</div><button id="ok" style="width:100%;height:44px;border-radius:22px;background:#fff;color:#000;font-weight:900">LVL ${level}</button></div></div>`; container.querySelector('#ok').onclick=()=>{ container.querySelector('#pb6ui').innerHTML=''; showReadyGo(); }; } else { b.textContent='REINTENTAR'; b.disabled=false; } }; container.querySelector('#bX2').onclick=()=>{ openAd('double'); container.querySelector('#bX2').textContent='CARGANDO AD...'; }; }
  function lose(){ if(ceilIv) clearInterval(ceilIv); isShooting=false; shooting=null; if(rafId) cancelAnimationFrame(rafId); const dinoB=container.querySelector('#dinoBubble'); if(dinoB) dinoB.textContent='Oh no! 😵'; sfxLose(); container.querySelector('#pb6ui').innerHTML=`<div class="pb6-win"><div class="pb6-card" style="background:#1a1012"><div style="font-size:28px">✕</div><h2 style="margin-top:8px">TECHO ALCANZADO</h2><div style="display:flex;gap:8px;margin-top:12px"><button id="bAg" style="flex:1;height:40px;border-radius:20px;background:#fff;color:#000;font-weight:800">REINTENTAR</button><button id="bR" style="flex:1;height:40px;border-radius:20px;background:#222;color:#fff">RESET</button></div></div></div>`; container.querySelector('#bAg').onclick=()=>{ container.querySelector('#pb6ui').innerHTML=''; showReadyGo(); }; container.querySelector('#bR').onclick=()=>{ level=1; localStorage.setItem('pb_level',1); container.querySelector('#pb6ui').innerHTML=''; showReadyGo(); }; }
  function shoot(){ unlockAudio(); if(isShooting) return; let rad=angle*Math.PI/180; shooting={x:It,y:Dt,dirX:Math.cos(rad),dirY:Math.sin(rad),col:cur}; isShooting=true; sfxShoot(); if(rafId) cancelAnimationFrame(rafId); rafId=requestAnimationFrame(loop); }
  function getPos(e){ const rect=canvas.getBoundingClientRect(); const scaleX=RN/rect.width, scaleY=NU/rect.height; const clientX=e.touches?e.touches[0].clientX:e.clientX; const clientY=e.touches?e.touches[0].clientY:e.clientY; return {x:(clientX-rect.left)*scaleX, y:(clientY-rect.top)*scaleY}; }
  canvas.addEventListener('pointermove', e=>{ if(isShooting) return; let {x,y}=getPos(e); let ang=Math.atan2(y-Dt,x-It)*180/Math.PI; if(ang>-15) ang=-15; if(ang<-165) ang=-165; angle=ang; let g=ym(angle,grid,It,Dt); ghost=g?{x:g.x,y:g.y}:null; traj=gm(angle,grid,It,Dt); drawBoard(); }, {passive:true});
  canvas.addEventListener('pointerdown', e=>{ e.preventDefault(); let {x,y}=getPos(e); let ang=Math.atan2(y-Dt,x-It)*180/Math.PI; if(ang>-15) ang=-15; if(ang<-165) ang=-165; angle=ang; shoot(); }, {passive:false});
  window.addEventListener('keydown', e=>{ if(e.code==='ArrowLeft') angle=Math.max(-165,angle-4); if(e.code==='ArrowRight') angle=Math.min(-15,angle+4); if(e.code==='Space'||e.code==='ArrowUp'){ e.preventDefault(); shoot(); } let g=ym(angle,grid,It,Dt); ghost=g?{x:g.x,y:g.y}:null; traj=gm(angle,grid,It,Dt); drawBoard(); });
  let adIv=setInterval(async()=>{ if(window.vrAd===4 && pend){ let t=pend; pend=null; window.vrAd=0; window.vrAdType=null; window._gm_shown=false; if(t==='inter'){ shotsSinceAd=0; } else { let r=await claim(true,true); if(r.ok){ level++; localStorage.setItem('pb_level',level); container.querySelector('#pb6ui').innerHTML=`<div class="pb6-win"><div class="pb6-card"><div style="font-size:28px">✅</div><div style="font-weight:900">X2 +0.02</div><button id="ok2" style="margin-top:10px;width:100%;height:44px;border-radius:22px;background:#fff;color:#000;font-weight:900">LVL ${level}</button></div></div>`; container.querySelector('#ok2').onclick=()=>{ container.querySelector('#pb6ui').innerHTML=''; showReadyGo(); }; } } } },500);
  showReadyGo();
  container._cleanup=()=>{ clearInterval(ceilIv); clearInterval(adIv); if(rafId) cancelAnimationFrame(rafId); window.vrAd=0; };
}
