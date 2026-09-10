// games/2048-madera/game.js - v2 ECONOMY - 0,0001 cada 20 combinaciones + Ad obligatorio
export async function init(container, ctx){
  container.innerHTML='';
  const style=document.createElement('style');
  style.textContent=`
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=JetBrains+Mono:wght@800&display=swap');
 .w2048{width:100%;height:100%;min-height:100%;display:flex;flex-direction:column;font-family:'Space Grotesk';background:radial-gradient(ellipse at 20% 10%,rgba(139,90,43,.18),transparent 60%),radial-gradient(ellipse at 80% 90%,rgba(210,180,140,.25),transparent 60%),linear-gradient(180deg,#d2b48c 0%,#bc9a6a 30%,#8b5a2b 100%);color:#3e2723;overflow:hidden;position:relative}
 .w-top{flex-shrink:0;display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:rgba(62,39,35,.88);border-bottom:2px solid #5c4033;gap:8px;flex-wrap:wrap;color:#f5deb3;z-index:5}
 .w-pill{border:1px solid rgba(245,222,179,.25);border-radius:20px;padding:5px 10px;font-size:10px;background:rgba(92,64,51,.6);cursor:pointer;font-weight:700;color:#f5deb3;white-space:nowrap}
 .w-pill.yellow{background:#f5deb3;color:#3e2723;border-color:#3e2723;font-weight:800}
 .w-body{flex:1;display:flex;align-items:center;justify-content:center;gap:28px;padding:20px;overflow:auto;width:100%;max-width:1100px;margin:0 auto}
 .w-left{flex:0 0 320px;display:flex;flex-direction:column;gap:12px}
 .w-board-wrap{background:linear-gradient(180deg,#5c4033,#3e2723);padding:12px;border-radius:18px;box-shadow:0 12px 32px rgba(0,0,0,.4);border:2px solid #4a2c17}
 .w-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;width:100%;aspect-ratio:1}
 .w-cell{width:100%;aspect-ratio:1;background:rgba(62,39,35,.6);border-radius:10px;box-shadow:inset 0 2px 4px rgba(0,0,0,.3)}
 .w-tiles{position:relative;width:100%;aspect-ratio:1;margin-top:-100%;pointer-events:none}
 .w-tile{position:absolute;width:calc(25% - 7.5px);height:calc(25% - 7.5px);border-radius:10px;display:grid;place-items:center;font-family:'JetBrains Mono';font-weight:800;font-size:28px;transition:all.15s cubic-bezier(.34,1.56,.64,1);box-shadow:0 4px 12px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.3);animation:pop.25s cubic-bezier(.34,1.56,.64,1)}
  @keyframes pop{0%{transform:scale(.2)}60%{transform:scale(1.15)}100%{transform:scale(1)}}
 .t-2{background:linear-gradient(180deg,#fff8e7,#f5deb3);color:#3e2723}.t-4{background:linear-gradient(180deg,#f5deb3,#deb887);color:#3e2723}.t-8{background:linear-gradient(180deg,#deb887,#d2b48c);color:#3e2723}.t-16{background:linear-gradient(180deg,#d2b48c,#bc9a6a);color:#fff}.t-32{background:linear-gradient(180deg,#bc9a6a,#a67b5b);color:#fff}.t-64{background:linear-gradient(180deg,#a67b5b,#8b5a2b);color:#fff}.t-128{background:linear-gradient(180deg,#cd853f,#a0522d);color:#fff;font-size:24px}.t-256{background:linear-gradient(180deg,#a0522d,#8b4513);color:#fff;font-size:24px}.t-512{background:linear-gradient(180deg,#8b4513,#654321);color:#fff;font-size:22px}.t-1024{background:linear-gradient(180deg,#654321,#3e2723);color:#f5deb3;font-size:20px}.t-2048{background:linear-gradient(135deg,#ffd700,#ffb700 50%,#ff8c00);color:#3e2723;font-size:20px;box-shadow:0 0 24px rgba(255,215,0,.6);border:2px solid #fff}
 .w-right{flex:1;max-width:400px;display:flex;flex-direction:column;gap:14px}
 .w-stats{display:grid;grid-template-columns:1fr 1fr;gap:8px}
 .w-stat{background:linear-gradient(180deg,#fef9c3,#fde68a);border:1px solid #5c4033;border-radius:12px;padding:10px 12px}
 .w-stat b{font-family:'JetBrains Mono';font-size:16px;display:block;color:#3e2723}.w-stat span{font-size:9px;opacity:.7;text-transform:uppercase;letter-spacing:.08em;color:#5c4033;font-weight:700}
 .w-progress{height:8px;background:rgba(92,64,51,.2);border-radius:4px;overflow:hidden;border:1px solid rgba(92,64,51,.2)}
 .w-progress-bar{height:100%;background:linear-gradient(90deg,#8b5a2b,#3e2723);transition:width.3s ease;width:0%}
 .w-controls{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
 .w-btn{padding:10px;border-radius:12px;font-weight:800;font-size:10px;text-transform:uppercase;cursor:pointer;border:2px solid #5c4033;background:#f5deb3;color:#3e2723}.w-btn.primary{background:#3e2723;color:#f5deb3}
 .w-how{font-size:11px;line-height:1.5;color:#3e2723;background:rgba(245,222,179,.6);border:1px solid rgba(92,64,51,.2);border-radius:12px;padding:12px}
  @media(max-width:900px){.w-body{flex-direction:column;align-items:stretch;justify-content:flex-start;gap:16px;padding:12px}.w-left{flex:0 0 auto;width:100%}.w-right{max-width:100%}}
 .w-win{position:absolute;inset:0;background:rgba(62,39,35,.88);backdrop-filter:blur(16px);display:grid;place-items:center;z-index:20}
 .w-win-card{background:linear-gradient(180deg,#fef9c3,#fde68a);border:2px solid #5c4033;border-radius:20px;padding:24px;text-align:center;width:min(360px,92vw)}
 .w-win-amount{display:flex;align-items:center;justify-content:center;gap:8px;background:rgba(34,197,94,.15);border:1px solid rgba(34,197,94,.4);border-radius:12px;padding:10px;margin:12px 0;font-weight:800;color:#14532d}
 .w-win-btn{width:100%;padding:12px;border-radius:12px;font-weight:800;font-size:11px;text-transform:uppercase;cursor:pointer;border:2px solid #5c4033;margin-top:8px}
 .w-win-btn.x2{background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#000}.w-win-btn.secondary{background:#3e2723;color:#f5deb3}.w-win-btn.ghost{background:#f5deb3;color:#3e2723}
 .w-ad-overlay{position:absolute;inset:0;background:rgba(62,39,35,.92);backdrop-filter:blur(12px);z-index:25;display:grid;place-items:center}
  `;

  container.appendChild(style);

  let wins=parseInt(localStorage.getItem('w2048_wins')||'0');
  let best=parseInt(localStorage.getItem('w2048_best')||'0');
  let score=0, grid=[], undoStack=[], totalReward=0;
  let mergeCount=0; // contador para ad cada 20
  const REWARD_PER_20 = 0.0001; // máximo que pediste
  const MERGES_FOR_AD = 20;

  const root=document.createElement('div'); root.className='w2048';
  root.innerHTML=`
    <div class="w-top">
      <div style="font-weight:800;font-size:12px;letter-spacing:.1em">🪵 2048 MADERA • ECONOMY</div>
      <div style="display:flex;gap:5px;flex-wrap:wrap">
        <button class="w-pill yellow" id="wStats">🏆 ${wins}W • BEST ${best}</button>
        <button class="w-pill" id="wUndo">↩️ UNDO</button>
        <button class="w-pill" id="wNew">↻ NUEVO</button>
      </div>
    </div>
    <div class="w-body">
      <div class="w-left">
        <div class="w-board-wrap">
          <div class="w-grid" id="wGrid"></div>
          <div class="w-tiles" id="wTiles"></div>
        </div>
        <div style="background:rgba(245,222,179,.7);border:1px solid #5c4033;border-radius:12px;padding:10px">
          <div style="display:flex;justify-content:space-between;font-size:10px;font-weight:800;margin-bottom:6px"><span>PROGRESO PARA ANUNCIO</span><span id="wProgText">0/20</span></div>
          <div class="w-progress"><div class="w-progress-bar" id="wProgBar"></div></div>
          <div style="font-size:9px;opacity:.7;margin-top:6px">Cada 20 combinaciones = anuncio + 0,0001 WASA. No es por cada merge.</div>
        </div>
      </div>
      <div class="w-right">
        <div class="w-stats">
          <div class="w-stat"><b id="wScore">0</b><span>SCORE</span></div>
          <div class="w-stat"><b id="wBest">${best}</b><span>BEST</span></div>
          <div class="w-stat"><b id="wReward">+0.000000</b><span>WASA TOTAL</span></div>
          <div class="w-stat"><b id="wCount">0</b><span>COMBINACIONES</span></div>
        </div>
        <div class="w-controls">
          <button class="w-btn" id="wUp">↑</button>
          <button class="w-btn" id="wHint">💡 HINT</button>
          <button class="w-btn" id="wDown">↓</button>
          <button class="w-btn" id="wLeft">←</button>
          <button class="w-btn" id="wReset">RESET</button>
          <button class="w-btn" id="wRight">→</button>
        </div>
        <div class="w-how">
          <b>Economía ajustada:</b> Ya no da WASA por cada merge. Junta <b>20 combinaciones</b>, mirá un anuncio y recién ahí cobrás <b>0,0001 WASA</b>. Así no se puede farmear fácil.<br>
          <span style="opacity:.7">PC: flechas • Móvil: deslizar</span>
        </div>
      </div>
    </div>
  `;
  container.appendChild(root);

  function fmt(n){ return n.toFixed(6); }
  function addCoinsServer(amount, meta){
    if(amount<=0) return Promise.resolve({ok:false});
    const email=localStorage.getItem('wasa_email'), wallet=localStorage.getItem('wasa_wallet'), device_id=localStorage.getItem('wasa_device_id');
    if(!email&&!wallet){
      const cur=parseFloat(localStorage.getItem('wasa_coins_guest')||'0');
      localStorage.setItem('wasa_coins_guest',(cur+amount).toString());
      window.setCoinsUI&&window.setCoinsUI(cur+amount);
      return Promise.resolve({ok:true, wasa_balance: cur+amount});
    }
    return fetch('https://games-wasa-worker.javimsites.workers.dev/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'claim_reward',email,wallet,device_id,amount,game:'2048-madera',meta})})
.then(r=>r.json()).then(j=>{ if(j.ok){ localStorage.setItem('wasa_coins',j.wasa_balance); window.setCoinsUI&&window.setCoinsUI(j.wasa_balance);} return j; }).catch(()=>({ok:false}));
  }

  function tryShowAd(){
    return new Promise((resolve)=>{
      const showFake=()=>{
        const ad=document.createElement('div'); ad.className='w-ad-overlay';
        ad.innerHTML='<div style="background:linear-gradient(180deg,#fef9c3,#fde68a);border:2px solid #5c4033;border-radius:16px;padding:20px;width:min(320px,90vw);text-align:center;color:#3e2723"><div style="font-size:28px">🪵📺</div><div style="font-weight:800;margin:8px 0">Anuncio obligatorio para cobrar</div><div style="font-size:10px;opacity:.7">20 combinaciones completadas • +0,0001 WASA</div><div style="height:6px;background:rgba(92,64,51,.2);border-radius:4px;overflow:hidden;margin:12px 0"><div id="adP" style="height:100%;width:0%;background:#8b5a2b;transition:width.1s linear"></div></div><div style="font-size:10px;opacity:.7" id="adT">4s</div></div>';
        root.appendChild(ad); let p=0; const iv=setInterval(()=>{ p+=2.5; ad.querySelector('#adP').style.width=p+'%'; ad.querySelector('#adT').textContent=Math.max(0,4-Math.floor(p/25))+'s'; if(p>=100){ clearInterval(iv); ad.remove(); resolve(true); } },40);
      };
      if(window.showRewardedAd){ window.showRewardedAd({onReward:()=>resolve(true), onFail:()=>showFake(), onClose:()=>showFake()}); setTimeout(showFake,3500); return; }
      if(window.gmShowVideo){ window.gmShowVideo((ok)=> ok?resolve(true):showFake()); return; }
      showFake();
    });
  }

  function initGrid(){
    grid=Array(4).fill(0).map(()=>Array(4).fill(0));
    const gEl=root.querySelector('#wGrid'); gEl.innerHTML=''; for(let i=0;i<16;i++){ const c=document.createElement('div'); c.className='w-cell'; gEl.appendChild(c); }
    addRandom(); addRandom(); score=0; mergeCount=0; totalReward=0; undoStack=[]; render();
  }

  function addRandom(){
    const empties=[]; for(let r=0;r<4;r++) for(let c=0;c<4;c++) if(grid[r][c]===0) empties.push([r,c]);
    if(empties.length===0) return;
    const [r,c]=empties[Math.floor(Math.random()*empties.length)];
    grid[r][c]=Math.random()<0.9?2:4;
  }

  function render(){
    const tilesEl=root.querySelector('#wTiles'); tilesEl.innerHTML='';
    let maxTile=2;
    for(let r=0;r<4;r++) for(let c=0;c<4;c++){
      const v=grid[r][c]; if(v===0) continue; maxTile=Math.max(maxTile,v);
      const tile=document.createElement('div'); tile.className='w-tile t-'+(v>2048?'super':v>1024?1024:v>512?512:v); tile.textContent=v;
      tile.style.left='calc('+c+' * (25% + 2.5px))'; tile.style.top='calc('+r+' * (25% + 2.5px))';
      tile.style.width='calc(25% - 7.5px)'; tile.style.height='calc(25% - 7.5px)';
      tilesEl.appendChild(tile);
    }
    root.querySelector('#wScore').textContent=score;
    root.querySelector('#wBest').textContent=Math.max(best,score);
    root.querySelector('#wReward').textContent='+'+fmt(totalReward);
    root.querySelector('#wCount').textContent=mergeCount;
    root.querySelector('#wProgText').textContent=mergeCount+'/'+MERGES_FOR_AD;
    root.querySelector('#wProgBar').style.width=(mergeCount/MERGES_FOR_AD*100)+'%';
    if(score>best){ best=score; localStorage.setItem('w2048_best',best); }
  }

  function move(dir){
    const old=JSON.stringify(grid);
    let gained=0, mergesInThisMove=0;
    const process = (arr)=>{
      let a=arr.filter(x=>x!==0);
      for(let i=0;i<a.length-1;i++){
        if(a[i]===a[i+1]){ a[i]*=2; a[i+1]=0; gained+=a[i]; mergesInThisMove++; }
      }
      a=a.filter(x=>x!==0); while(a.length<4) a.push(0); return a;
    };

    const newGrid=grid.map(r=>[...r]);
    if(dir==='left'){ for(let r=0;r<4;r++) newGrid[r]=process(newGrid[r]); }
    else if(dir==='right'){ for(let r=0;r<4;r++) newGrid[r]=process([...newGrid[r]].reverse()).reverse(); }
    else if(dir==='up'){ for(let c=0;c<4;c++){ let col=[newGrid[0][c],newGrid[1][c],newGrid[2][c],newGrid[3][c]]; col=process(col); for(let r=0;r<4;r++) newGrid[r][c]=col[r]; } }
    else if(dir==='down'){ for(let c=0;c<4;c++){ let col=[newGrid[0][c],newGrid[1][c],newGrid[2][c],newGrid[3][c]]; col=process(col.reverse()).reverse(); for(let r=0;r<4;r++) newGrid[r][c]=col[r]; } }

    if(JSON.stringify(newGrid)!==old){
      undoStack.push({grid: grid.map(r=>[...r]), score}); if(undoStack.length>10) undoStack.shift();
      grid=newGrid; score+=gained;

      // ECONOMIA NUEVA: no paga por cada merge, acumula
      mergeCount+=mergesInThisMove;
      if(mergeCount>=MERGES_FOR_AD){
        // Bloquea movimiento hasta ver ad
        const pendingMerges=mergeCount;
        mergeCount=0;
        // Muestra ad obligatorio
        tryShowAd().then(()=>{
          totalReward+=REWARD_PER_20;
          addCoinsServer(REWARD_PER_20, '20_merges_'+pendingMerges).then(j=>{
            render();
            if(j.ok){
              // feedback visual
              const el=root.querySelector('#wReward');
              el.animate([{transform:'scale(1)'},{transform:'scale(1.2)'},{transform:'scale(1)'}],{duration:400});
            }
          });
        });
      }

      addRandom(); render();
    }
  }

  // Controls
  root.querySelector('#wNew').onclick=initGrid;
  root.querySelector('#wReset').onclick=initGrid;
  root.querySelector('#wUndo').onclick=()=>{ if(undoStack.length>0){ const p=undoStack.pop(); grid=p.grid; score=p.score; render(); } };
  root.querySelector('#wUp').onclick=()=>move('up');
  root.querySelector('#wDown').onclick=()=>move('down');
  root.querySelector('#wLeft').onclick=()=>move('left');
  root.querySelector('#wRight').onclick=()=>move('right');
  root.querySelector('#wHint').onclick=()=>{ const dirs=['up','down','left','right']; move(dirs[Math.floor(Math.random()*4)]); };

  window.addEventListener('keydown', e=>{
    if(e.key==='ArrowUp'||e.key==='w') move('up');
    if(e.key==='ArrowDown'||e.key==='s') move('down');
    if(e.key==='ArrowLeft'||e.key==='a') move('left');
    if(e.key==='ArrowRight'||e.key==='d') move('right');
    if(e.key==='r') initGrid();
  });

  let sx=0,sy=0;
  root.addEventListener('touchstart', e=>{ sx=e.touches[0].clientX; sy=e.touches[0].clientY; }, {passive:true});
  root.addEventListener('touchend', e=>{
    if(!sx) return; const dx=e.changedTouches[0].clientX-sx; const dy=e.changedTouches[0].clientY-sy;
    if(Math.abs(dx)>Math.abs(dy)){ if(Math.abs(dx)>30) move(dx>0?'right':'left'); }
    else{ if(Math.abs(dy)>30) move(dy>0?'down':'up'); }
    sx=0; sy=0;
  }, {passive:true});

  initGrid();
}
