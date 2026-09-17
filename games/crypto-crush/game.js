// games/crypto-crush/game.js - v7.0 MENU + TUTORIAL BOMBA/RAYO + TIENDA BOOSTERS + BOMBA emoji 💣 + MEME FACES
export function init(container, args){
  const WORKER_URL = window.WASA_CONFIG?.WORKER_URL || 'https://games-wasa-worker.javisimes.workers.dev/';
  function getDeviceId(){ let id=localStorage.getItem('wasa_device_id'); if(!id){ id='dev_'+Math.random().toString(36).slice(2)+Date.now().toString(36); localStorage.setItem('wasa_device_id',id);} return id; }
  function fmt(n){ const v=parseFloat(n)||0; if(v===0) return '0'; return (Math.round(v*1e7)/1e7).toFixed(7).replace(/0+$/,'').replace(/\.$/,''); }

  function getAssetBases(){
    const bases=[];
    try{
      const scripts=document.querySelectorAll('script[src*="crypto-crush"]');
      scripts.forEach(s=>{
        const url=new URL(s.src, window.location.origin);
        const dir=url.pathname.substring(0, url.pathname.lastIndexOf('/')+1);
        bases.push(dir+'assets/'); bases.push(dir);
      });
    }catch{}
    bases.push('/games/crypto-crush/assets/','games/crypto-crush/assets/','./games/crypto-crush/assets/','./assets/','assets/','/assets/','./','/');
    return [...new Set(bases)];
  }
  const ASSET_BASES=getAssetBases();

  const ALL_TOKENS = [
    {icon:'₿', name:'BTC',  bg:'#F7931A', bd:'#E67E00', light:'#FFB84D', img:'btc.png'},
    {icon:'Ξ', name:'ETH',  bg:'#627EEA', bd:'#3C5FE3', light:'#8AA0FF', img:'eth.png'},
    {icon:'Đ', name:'DASH', bg:'#1E88E5', bd:'#1565C0', light:'#42A5F5', img:'dash.png'},
    {icon:'Ł', name:'LTC',  bg:'#A6A9AA', bd:'#7A7D7E', light:'#CFD8DC', img:'ltc.png'},
    {icon:'W', name:'WASA', bg:'#A855F7', bd:'#7E22CE', light:'#38BDF8', img:'wasa.png'},
    {icon:'B', name:'BNB',  bg:'#F3BA2F', bd:'#D99A00', light:'#FCD535', img:'bnb.png'},
    {icon:'₮', name:'USDT', bg:'#26A17B', bd:'#1A7A5C', light:'#4ECC9E', img:'usdt.png'},
    {icon:'🐶', name:'DOGE',  bg:'#C2A633', bd:'#9A8300', light:'#E8C547', img:'doge.png'},
    {icon:'🐕', name:'SHIB',  bg:'#FF4565', bd:'#E02D4A', light:'#FF7A91', img:'shib.png'},
    {icon:'🐸', name:'PEPE',  bg:'#22C55E', bd:'#16A34A', light:'#4ADE80', img:'pepe.png'},
    {icon:'🐺', name:'FLOKI', bg:'#8B5CF6', bd:'#6D28D9', light:'#A78BFA', img:'floki.png'},
  ];
  const SZ = 8;
  const BASE_REWARD = 0.0001;
  const MEME_LAUGH_FILES = ['doge_laugh.png','shiba_laugh.png','pepe_laugh.png','floki_laugh.png'];
  const MEME_CRY_FILES   = ['doge_cry.png','pepe_cry.png','shiba_cry.png','floki_cry.png'];

  function getUnlockedTokens(level){ const count=Math.min(11, 5+Math.floor((level-1)/3)); return ALL_TOKENS.slice(0, count); }
  function getActiveTokensForLevel(level){
    const unlocked=getUnlockedTokens(level);
    const maxPerGame=level<10?5:6;
    const take=Math.min(maxPerGame, unlocked.length);
    const shuffled=[...unlocked].sort(()=>Math.random()-0.5);
    let active=shuffled.slice(0, take);
    if(level%3===0 && unlocked.some(t=>t.name==='WASA') && !active.some(t=>t.name==='WASA')) active[0]=ALL_TOKENS.find(t=>t.name==='WASA');
    return active;
  }
  function generateLevel(n, activeTokens){
    const lvl={number:n, moves:0, time:0, type:'moves', objectives:[], reward: BASE_REWARD * (1 + Math.floor(n/10)*0.5), activeTokens };
    const isTimed = n>=7 && n%7===0;
    if(isTimed){
      lvl.type='time'; lvl.time=Math.max(45, 75 - Math.floor(n/2) + 45); lvl.moves=999;
      const scoreTarget=Math.floor(800 + n*180 + Math.random()*400);
      lvl.objectives.push({id:'score_main', type:'score', name:'PUNTOS', icon:'⭐', target:scoreTarget, current:0});
      if(Math.random()<0.6){ const tok=activeTokens[Math.floor(Math.random()*activeTokens.length)]; lvl.objectives.push({id:tok.name+'_sec', type:'collect_color', color:ALL_TOKENS.indexOf(tok), token:tok, name:tok.name, icon:tok.icon, target:Math.floor(6+n*0.8), current:0}); }
    } else {
      lvl.type='moves'; lvl.moves=Math.max(14, 24 - Math.floor(n/4) + Math.floor(n/12));
      const numObjs=n<5?1:n<12?2:n<35?3:4; const usedNames=new Set(); let hasThunder=false, hasSpecial=false; let attempts=0;
      while(lvl.objectives.length < numObjs && attempts<30){
        attempts++; const roll=Math.random();
        if(roll<0.75){
          let available=activeTokens.filter(t=>!usedNames.has(t.name));
          if(available.length===0){ if(lvl.objectives.filter(o=>o.type==='collect_color').length>=2) continue; available=activeTokens; }
          if(usedNames.size>0 && available.some(t=>!usedNames.has(t.name)) && Math.random()<0.7){ available=available.filter(t=>!usedNames.has(t.name)); }
          const token=available[Math.floor(Math.random()*available.length)]; usedNames.add(token.name);
          const target=Math.floor(7 + n*1.6 + Math.random()*7 + lvl.objectives.length*2.5);
          lvl.objectives.push({id:token.name+'_'+lvl.objectives.length, type:'collect_color', color:ALL_TOKENS.indexOf(token), token, name:token.name, icon:token.icon, target, current:0});
        } else if(roll<0.86 && !hasSpecial){
          const special=Math.random()<0.5?'bomb':'striped'; const target=Math.floor(1 + n/22);
          lvl.objectives.push({id:special+'_'+lvl.objectives.length, type:'collect_special', special, name:special==='bomb'?'BOMBAS':'RAYADAS', icon:special==='bomb'?'💣':'↔️', target, current:0}); hasSpecial=true;
        } else if(!hasThunder){
          if(n<8) continue; lvl.objectives.push({id:'thunder_'+lvl.objectives.length, type:'collect_rainbow', name:'RAYO', icon:'⚡', target:1, current:0}); hasThunder=true;
        }
      }
    }
    if(!lvl.objectives.some(o=>o.type==='collect_color') && lvl.type==='moves'){
      const tok=activeTokens[Math.floor(Math.random()*activeTokens.length)]; lvl.objectives[0]={id:tok.name, type:'collect_color', color:ALL_TOKENS.indexOf(tok), token:tok, name:tok.name, icon:tok.icon, target:10+n*2, current:0};
    }
    lvl.objectives=lvl.objectives.filter(o=>{ if(o.type==='collect_color'){ return activeTokens.some(t=>t.name===o.name); } return true; });
    const seen=new Set(); lvl.objectives=lvl.objectives.filter(o=>{ const key=o.type+'_'+o.name+'_'+(o.special||''); if(seen.has(key) && o.type!=='collect_color') return false; if(o.type==='collect_rainbow' && seen.has('thunder')) return false; seen.add(key); if(o.type==='collect_rainbow') seen.add('thunder'); return true; });
    return lvl;
  }

  container.style.height='100%'; container.style.overflow='hidden'; container.style.display='flex'; container.style.flexDirection='column';

  container.innerHTML=`<style>
*{box-sizing:border-box}
.cc{width:100%;height:100%;display:flex;flex-direction:column;background:radial-gradient(ellipse at 50% 0%, #0F0F1A 0%, #1A1A2E 25%, #16213E 60%, #0F0F1A 100%);color:#fff;font-family:Inter,system-ui;overflow:hidden;position:relative;touch-action:none}
.cc-header{width:100%;background:rgba(255,255,255,.97);color:#2a1a5e;box-shadow:0 4px 20px rgba(0,0,0,.3);z-index:10;flex-shrink:0;border-bottom:2px solid #E9D5FF}
.cc-header-inner{width:100%;padding:8px 10px;display:flex;align-items:center;gap:8px;justify-content:space-between;flex-wrap:nowrap;min-height:48px}
.cc-header-left{display:flex;align-items:center;gap:6px;flex-shrink:0}
.cc-icon-btn{width:32px;height:32px;border-radius:9px;border:1.5px solid #DDD6FE;background:#fff;display:grid;place-items:center;font-size:16px;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.12)}
.cc-level-badge{background:#1A1A2E;color:#fff;border-radius:10px;padding:4px 10px;font-weight:900;font-size:12px;line-height:1}
.cc-level-badge span{font-size:9px;opacity:.7;font-weight:700;display:block}
.cc-level-badge.timed{background:linear-gradient(135deg,#EF4444,#DC2626); animation:pulse 1s infinite}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
.cc-tokens{display:flex;gap:4px;align-items:center}
.cc-token-chip{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;font-weight:900;font-size:12px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.2);flex-shrink:0;transition:all .2s;overflow:hidden;background:#fff}
.cc-token-chip img{width:82%;height:82%;object-fit:contain;display:block}
.cc-token-chip.needed{transform:scale(1.25);box-shadow:0 0 0 2.5px #22C55E, 0 0 12px #22C55E;z-index:2;border-color:#22C55E}
.cc-token-chip.wasa{box-shadow:0 0 0 2px #fff, 0 0 12px #A855F7; border-color:#A855F7}
.cc-header-center{flex:1;min-width:0;display:flex;gap:6px;align-items:center;overflow:hidden}
.cc-obj-mini{flex:1;min-width:70px;background:#F5F3FF;border:1.5px solid #DDD6FE;border-radius:10px;padding:4px 7px;display:flex;align-items:center;gap:5px}
.cc-obj-mini.done{background:#DCFCE7;border-color:#22C55E}
.cc-obj-mini-icon{width:24px;height:24px;border-radius:7px;display:grid;place-items:center;font-weight:900;font-size:11px;flex-shrink:0;overflow:hidden;background:#fff; border:1.5px solid #e5e7eb}
.cc-obj-mini-icon img{width:82%;height:82%;object-fit:contain}
.cc-obj-mini-info{flex:1;min-width:0}
.cc-obj-mini-name{font-weight:900;font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cc-obj-mini-bar{height:5px;background:#EDE9FE;border-radius:999px;overflow:hidden;margin-top:2px}
.cc-obj-mini-fill{height:100%;background:linear-gradient(90deg,#22C55E,#4ADE80);transition:width .3s}
.cc-obj-mini.time{border-color:#F59E0B; background:linear-gradient(180deg,#FFFBEB,#FEF3C7)}
.cc-obj-mini.time .cc-obj-mini-fill{background:linear-gradient(90deg,#F59E0B,#EF4444)}
.cc-header-right{display:flex;gap:5px;align-items:center;flex-shrink:0}
.cc-stat-mini{background:#fff;border:1.5px solid #E9D5FF;border-radius:10px;padding:4px 7px;min-width:52px;text-align:center}
.cc-stat-mini b{font-size:11px;font-weight:900;display:block;line-height:1;color:#2a1a5e}
.cc-stat-mini span{font-size:6px;font-weight:800;opacity:.6;letter-spacing:.05em;text-transform:uppercase;color:#4C1D95}
.cc-stat-mini.gold{background:linear-gradient(180deg,#FEF08A,#FACC15);border-color:#EAB308}
.cc-main{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:10px 10px 6px;overflow:auto;overflow-x:hidden;touch-action:none;width:100%;min-height:0;gap:8px}
.cc-board{width:min(92vw, 460px);aspect-ratio:1;background:rgba(255,255,255,.98);border-radius:18px;padding:6px;box-shadow:0 24px 60px rgba(0,0,0,.45), 0 0 0 2.5px rgba(255,255,255,.95);position:relative;touch-action:none;user-select:none;contain:layout;flex-shrink:0}
.cc-grid{display:grid;grid-template-columns:repeat(${SZ},1fr);grid-template-rows:repeat(${SZ},1fr);gap:4px;width:100%;height:100%;touch-action:none}
.cc-cell{position:relative;border-radius:11px;display:grid;place-items:center;cursor:pointer;touch-action:none}
.cc-cell.sel{transform:scale(1.1);z-index:5}.cc-cell.sel::after{content:'';position:absolute;inset:-2px;border:3px solid #FACC15;border-radius:12px;box-shadow:0 0 14px #FACC15;pointer-events:none}
.cc-candy{width:88%;height:88%;border-radius:13px;display:grid;place-items:center;font-weight:900;font-size:15px;position:relative;box-shadow:0 4px 0 rgba(0,0,0,.18), inset 0 2px 0 rgba(255,255,255,.95);border:2px solid rgba(0,0,0,.08);overflow:hidden;background:#fff}
.cc-candy img{width:76%;height:76%;object-fit:contain;display:block;pointer-events:none;filter:drop-shadow(0 1px 2px rgba(0,0,0,.22))}
.cc-candy.wasa-candy{background:linear-gradient(180deg, #38BDF8 0%, #0EA5E9 25%, #A855F7 70%, #9333EA 100%) !important; border-color:#7E22CE !important; box-shadow:0 4px 0 rgba(126,34,206,.35), inset 0 2px 0 rgba(255,255,255,.95), 0 0 16px rgba(168,85,247,.55) !important}
.cc-candy.wasa-candy img{filter:drop-shadow(0 2px 3px rgba(0,0,0,.3)) brightness(1.08) contrast(1.1)}
.cc-candy.dash-candy{background:linear-gradient(180deg, #42A5F5 0%, #1E88E5 100%) !important; border-color:#1565C0 !important; box-shadow:0 4px 0 rgba(21,101,192,.3), inset 0 2px 0 rgba(255,255,255,.9), 0 0 10px rgba(30,136,229,.4) !important}
.cc-candy::before{content:'';position:absolute;top:8%;left:14%;width:34%;height:26%;background:rgba(255,255,255,.9);border-radius:50%;pointer-events:none;z-index:1}
.cc-candy.bomb{box-shadow:0 0 0 2.5px #000, 0 4px 0 rgba(0,0,0,.35), 0 0 16px #EF4444 !important; border-color:#000 !important}
.cc-candy.bomb::after{content:'💣';position:absolute;font-size:18px;z-index:4;bottom:-2px;right:-2px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.6));}
.cc-candy.bomb .bomb-wrap{position:absolute;inset:-2px;border:2.5px dashed #000;border-radius:13px;pointer-events:none;z-index:3}
.cc-candy.striped-h{box-shadow:0 0 0 2px #fff, 0 4px 0 rgba(0,0,0,.2), 0 0 14px #38BDF8 !important}
.cc-candy.striped-h::after{content:'↔️';position:absolute;font-size:11px;z-index:4;top:2px;right:2px}
.cc-candy.striped-h::before{content:'';position:absolute;left:-3px;right:-3px;top:50%;height:5px;background:repeating-linear-gradient(90deg, #fff 0 5px, #38BDF8 5px 10px);transform:translateY(-50%);border-radius:999px;z-index:2;box-shadow:0 0 6px #fff; top:8%; left:14%; width:34%; height:26%; background:rgba(255,255,255,.9); border-radius:50%}
.cc-candy.striped-v{box-shadow:0 0 0 2px #fff, 0 4px 0 rgba(0,0,0,.2), 0 0 14px #A855F7 !important}
.cc-candy.striped-v::after{content:'↕️';position:absolute;font-size:11px;z-index:4;top:2px;right:2px}
.cc-candy.color-bomb{background:radial-gradient(circle at 30% 30%, #FEF08A, #FACC15 25%, #EAB308 55%, #854D0E 100%) !important;border:2.5px solid #fff !important;box-shadow:0 0 28px #FACC15, 0 0 16px #fff, inset 0 0 14px rgba(255,255,255,.9) !important;animation:thunderPulse 0.8s ease-in-out infinite}
.cc-candy.color-bomb::before{content:'⚡';position:absolute;font-size:26px;z-index:3;filter:drop-shadow(0 0 6px #fff) drop-shadow(0 0 10px #FACC15);animation:thunderFlash .2s ease-in-out infinite alternate}
.cc-candy.color-bomb img{display:none}
.cc-candy.color-bomb::after{content:none}
@keyframes thunderPulse{0%,100%{transform:scale(1);box-shadow:0 0 28px #FACC15, 0 0 16px #fff}50%{transform:scale(1.08);box-shadow:0 0 36px #FDE047, 0 0 24px #fff, 0 0 40px #FACC15}}
@keyframes thunderFlash{0%{filter:drop-shadow(0 0 6px #fff) drop-shadow(0 0 10px #FACC15) brightness(1)}100%{filter:drop-shadow(0 0 10px #fff) drop-shadow(0 0 16px #FDE047) brightness(1.4)}}
.cc-cell.matched{animation:pop .38s cubic-bezier(.34,1.56,.64,1) forwards}
@keyframes pop{0%{transform:scale(1)}25%{transform:scale(1.32)}100%{transform:scale(0) rotate(80deg);opacity:0}}
.cc-cell.new{animation:newpop .28s cubic-bezier(.34,1.56,.64,1)}
@keyframes newpop{0%{transform:scale(0)}60%{transform:scale(1.15)}100%{transform:scale(1)}}
.cc-explo{position:absolute;left:50%;top:50%;width:8px;height:8px;background:radial-gradient(circle, #fff, #FACC15, #EAB308, transparent);border-radius:50%;pointer-events:none;transform:translate(-50%,-50%);animation:explo .4s ease-out forwards;z-index:20}
@keyframes explo{0%{width:8px;height:8px;opacity:1}100%{width:110px;height:110px;opacity:0}}
.cc-combo{position:absolute;left:50%;top:16%;transform:translateX(-50%);background:linear-gradient(135deg,#FACC15,#F59E0B);color:#000;padding:5px 12px;border-radius:999px;font-weight:900;font-size:13px;box-shadow:0 4px 12px rgba(0,0,0,.35);pointer-events:none;animation:combo .8s ease forwards;z-index:30;border:2px solid #fff}
@keyframes combo{0%{opacity:0;transform:translateX(-50%) translateY(16px) scale(.6)}20%{opacity:1;transform:translateX(-50%) translateY(0) scale(1.15)}100%{opacity:0;transform:translateX(-50%) translateY(-32px) scale(1)}}
.cc-thunder-fx{position:absolute;inset:0;pointer-events:none;z-index:25;overflow:visible}
.cc-lightning{position:absolute;height:3px;background:linear-gradient(90deg, #fff, #FDE047, #FACC15, #fff);border-radius:2px;transform-origin:left center;box-shadow:0 0 6px #fff, 0 0 12px #FACC15;animation:lightningStrike .35s ease-out forwards}
.cc-lightning::after{content:'⚡';position:absolute;right:-10px;top:50%;transform:translateY(-50%);font-size:14px;filter:drop-shadow(0 0 4px #fff)}
@keyframes lightningStrike{0%{transform:scaleX(0);opacity:0}20%{opacity:1}100%{transform:scaleX(1);opacity:0}}
.cc-lightning-hit{position:absolute;width:40px;height:40px;background:radial-gradient(circle, #fff 0%, #FEF08A 30%, #FACC15 60%, transparent 100%);border-radius:50%;pointer-events:none;transform:translate(-50%,-50%);animation:lightningHit .4s ease-out forwards;z-index:26}
@keyframes lightningHit{0%{transform:translate(-50%,-50%) scale(0);opacity:1}50%{transform:translate(-50%,-50%) scale(1.6);opacity:1}100%{transform:translate(-50%,-50%) scale(2.5);opacity:0}}
.cc-obj-complete{position:absolute;inset:0;background:rgba(15,15,26,.88);display:grid;place-items:center;z-index:40;pointer-events:none;backdrop-filter:blur(4px)}
.cc-obj-complete-text{font-size:min(8vw, 36px);font-weight:900;letter-spacing:.08em;color:#fff;text-shadow:0 0 20px #FACC15, 0 0 40px #FACC15, 0 4px 0 #000;text-align:center;line-height:1.1;animation:objBlink 0.5s ease-in-out infinite alternate, objScale 0.6s cubic-bezier(.34,1.56,.64,1)}
.cc-obj-complete-sub{font-size:14px;opacity:.8;margin-top:8px;letter-spacing:.1em}
.cc-obj-complete-meme{width:min(42vw, 180px);height:min(42vw, 180px);margin:0 auto 14px;filter:drop-shadow(0 8px 20px rgba(0,0,0,.6)) drop-shadow(0 0 18px rgba(250,204,21,.7));animation:memeBounce .5s cubic-bezier(.34,1.56,.64,1), memeLaugh .6s ease-in-out infinite alternate}
@keyframes memeBounce{0%{transform:scale(0) rotate(-12deg)}60%{transform:scale(1.2) rotate(6deg)}100%{transform:scale(1) rotate(0)}}
@keyframes memeLaugh{0%{transform:scale(1) rotate(-2deg)}100%{transform:scale(1.06) rotate(2deg)}}
@keyframes objBlink{0%{opacity:1;filter:brightness(1) drop-shadow(0 0 10px #FACC15)}100%{opacity:.9;filter:brightness(1.3) drop-shadow(0 0 20px #fff) drop-shadow(0 0 30px #FACC15)}}
@keyframes objScale{0%{transform:scale(.8)}100%{transform:scale(1.08)}}
.cc-fail-meme{width:min(38vw, 160px);height:min(38vw, 160px);margin:0 auto 12px;filter:drop-shadow(0 6px 16px rgba(0,0,0,.5));animation:memeCry .7s ease-in-out infinite alternate}
@keyframes memeCry{0%{transform:translateY(0) scale(1)}100%{transform:translateY(6px) scale(1.02)}}
.cc-menu{position:fixed;inset:0;background:radial-gradient(ellipse at 50% 0%, #0F0F1A 0%, #1A1A2E 60%, #0F0F1A 100%);z-index:100;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;overflow:auto}
.cc-menu-card{background:linear-gradient(180deg,#fff,#F5F3FF);border-radius:24px;padding:24px;width:min(420px,96vw);color:#0F172A;box-shadow:0 24px 60px rgba(0,0,0,.5);text-align:center}
.cc-menu-title{font-size:28px;font-weight:900;letter-spacing:-.02em;margin:4px 0}
.cc-menu-sub{font-size:12px;opacity:.6;font-weight:700;letter-spacing:.08em}
.cc-menu-btn{width:100%;height:54px;border-radius:14px;font-weight:900;font-size:14px;border:0;cursor:pointer;margin-top:10px;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 6px 16px rgba(0,0,0,.15)}
.cc-menu-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}
.cc-howto{position:fixed;inset:0;background:rgba(15,15,26,.92);backdrop-filter:blur(14px);z-index:110;padding:16px;display:grid;place-items:center;overflow:auto}
.cc-howto-card{background:#fff;border-radius:20px;padding:18px;width:min(440px,96vw);color:#0F172A;max-height:90vh;overflow:auto}
.cc-howto-item{display:flex;gap:12px;align-items:flex-start;background:#F5F3FF;border:1.5px solid #DDD6FE;border-radius:14px;padding:12px;margin-top:10px}
.cc-howto-icon{width:44px;height:44px;border-radius:12px;background:#fff;border:2px solid #E9D5FF;display:grid;place-items:center;font-size:22px;flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,.1)}
.cc-booster{border:2px solid #E9D5FF;border-radius:16px;padding:12px;display:flex;gap:12px;align-items:center;background:linear-gradient(180deg,#fff,#FFFBEB);margin-top:10px}
.cc-booster-icon{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;font-size:26px;background:linear-gradient(180deg,#FEF08A,#FACC15);border:2px solid #EAB308;flex-shrink:0}
.cc-bottom{width:100%;background:rgba(0,0,0,.25);backdrop-filter:blur(6px);padding:5px 10px;display:flex;justify-content:center;gap:8px;flex-shrink:0;border-top:1px solid rgba(255,255,255,.15)}
.cc-bottom-info{font-size:8px;opacity:.7;text-align:center}
</style>
<div class="cc" id="root">
  <div class="cc-header">
    <div class="cc-header-inner">
      <div class="cc-header-left">
        <button class="cc-icon-btn" id="btnMenu" title="Menú">☰</button>
        <div class="cc-level-badge" id="lvlBadge"><b id="lvlNum">N1</b><span id="lvlUnlock">5/11</span></div>
        <div class="cc-tokens" id="activeTokens"></div>
        <div style="font-weight:900;font-size:11px;opacity:.8"><span id="moves">25</span> <span id="movesLabel" style="font-size:8px;opacity:.6">MOVS</span></div>
      </div>
      <div class="cc-header-center" id="objList"></div>
      <div class="cc-header-right">
        <button class="cc-icon-btn" id="btnHelp" title="Cómo jugar">?</button>
        <button class="cc-icon-btn" id="btnShop" title="Boosters" style="background:linear-gradient(180deg,#FEF08A,#FACC15)">🛒</button>
        <div class="cc-stat-mini"><b id="cScore">0</b><span>Score</span></div>
        <div class="cc-stat-mini gold"><b id="cReward">+0.0000</b><span>WASA</span></div>
      </div>
    </div>
  </div>
  <div class="cc-main" id="mainArea"><div class="cc-board" id="board"><div class="cc-grid" id="grid"></div><div class="cc-thunder-fx" id="thunderFx"></div></div></div>
  <div class="cc-bottom"><div class="cc-bottom-info" id="debugInfo">v7.0 MENU + BOMBA 💣 + RAYO ⚡</div></div>
  <div id="ui"></div>
</div>`;

  const root=container.querySelector('#root'); const ui=root.querySelector('#ui'); const gridEl=root.querySelector('#grid'); const boardEl=root.querySelector('#board'); const thunderFx=root.querySelector('#thunderFx'); const debugInfo=root.querySelector('#debugInfo');
  let best=parseInt(localStorage.getItem('wcrush_best')||'0');
  let currentLevelNum=parseInt(localStorage.getItem('wcrush_level')||'1');
  let level=null; let board=[], score=0, totalReward=parseFloat(localStorage.getItem('wcrush_wasa')||'0'), moves=0, timeLeft=0, timerInt=null, busy=false, sel=null, lastSwap=null;
  let session=null, claiming=false, pendingAd=null, startTime=Date.now(); let workingBase=null; let gameStarted=false;
  let boosters = JSON.parse(localStorage.getItem('wcrush_boosters')||'{"hammer":1,"bomb":1,"rayo":1}');

  function getMemeUrl(fileName){ const base = workingBase || '/games/crypto-crush/assets/'; return base + fileName; }
  function pickRandomMeme(type){ const list = type==='laugh' ? MEME_LAUGH_FILES : MEME_CRY_FILES; return list[Math.floor(Math.random()*list.length)]; }
  async function startSession(){ try{ const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start_game_session', email:localStorage.getItem('wasa_email'), wallet:localStorage.getItem('wasa_wallet'), device_id:getDeviceId(), game_slug:'crypto-crush', level:currentLevelNum})}); const j=await r.json(); if(j.ok) session=j.session_id; }catch{} }
  async function claim(isDouble, ad){ if(claiming) return {ok:false}; if(!session) await startSession(); if(!session) return {ok:false}; claiming=true; try{ const r=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'claim_reward', session_id:session, email:localStorage.getItem('wasa_email'), wallet:localStorage.getItem('wasa_wallet'), device_id:getDeviceId(), game_slug:'crypto-crush', level:currentLevelNum, ad_watched:ad, double_reward:isDouble, time_taken:(Date.now()-startTime)/1000})}); const j=await r.json(); if(j.ok){ const b=j.wasa_balance??j.guest_balance??0; localStorage.setItem(j.is_guest?'wasa_coins_guest':'wasa_coins',b); if(window.setCoinsUI) window.setCoinsUI(b); session=null; claiming=false; return j; } claiming=false; return {ok:false, error:j.error}; }catch{ claiming=false; return {ok:false}; } }
  function openAd(t){ if(window.vrAd!==0 && window.vrAd!==undefined) return; pendingAd=t; window.vrAdType=t; window.vrAd=1; ui.innerHTML=`<div style="position:fixed;inset:0;background:rgba(0,0,0,.7);display:grid;place-items:center;z-index:50;color:white;font-weight:800">Cargando anuncio...</div>`; }
  function randColorFromActive(active){ const tok=active[Math.floor(Math.random()*active.length)]; return ALL_TOKENS.indexOf(tok); }
  function makeCell(color, special=null){ return {c:color, s:special}; }
  function saveBoosters(){ localStorage.setItem('wcrush_boosters', JSON.stringify(boosters)); }

  function createTokenImg(token, fallbackText){
    const wrapper=document.createElement('div'); wrapper.style.width='100%'; wrapper.style.height='100%'; wrapper.style.display='grid'; wrapper.style.placeItems='center';
    const img=document.createElement('img'); img.alt=token.name; img.loading='lazy'; img.style.width='76%'; img.style.height='76%'; img.style.objectFit='contain';
    let baseIndex=0;
    function tryNextBase(){
      if(baseIndex>=ASSET_BASES.length){ const span=document.createElement('span'); span.textContent=fallbackText||token.icon; span.style.fontWeight='900'; span.style.fontSize='13px'; wrapper.innerHTML=''; wrapper.appendChild(span); return; }
      const base=ASSET_BASES[baseIndex]; const urlToTry = workingBase ? workingBase + token.img : base + token.img; img.src=urlToTry;
    }
    img.onload=()=>{ if(!workingBase){ workingBase=ASSET_BASES[baseIndex]; if(!workingBase.endsWith('/')) workingBase+='/'; const src=img.src; workingBase=src.substring(0, src.lastIndexOf('/')+1); } };
    img.onerror=()=>{ baseIndex++; if(workingBase) workingBase=null; tryNextBase(); };
    tryNextBase(); wrapper.appendChild(img); return wrapper;
  }
  function createModalTokenIcon(token){
    const base = workingBase || '/games/crypto-crush/assets/';
    return `<div style="width:32px;height:32px;flex-shrink:0;border-radius:9px;background:linear-gradient(180deg,${token.light},${token.bg});border:2px solid ${token.bd};display:flex;align-items:center;justify-content:center;box-shadow:0 2px 4px rgba(0,0,0,.12)"><img src="${base}${token.img}" alt="${token.name}" style="width:20px;height:20px;object-fit:contain;display:block" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div style="display:none;width:20px;height:20px;align-items:center;justify-content:center;font-weight:900;font-size:12px">${token.icon}</div></div>`;
  }

  function showMainMenu(){
    gameStarted=false; busy=true;
    if(timerInt) clearInterval(timerInt);
    ui.innerHTML=`<div class="cc-menu" id="mainMenu">
      <div class="cc-menu-card">
        <div style="font-size:48px">💎</div>
        <div class="cc-menu-title">CRYPTO CRUSH</div>
        <div class="cc-menu-sub">NIVEL ${currentLevelNum} • ${getUnlockedTokens(currentLevelNum).length}/11 TOKENS</div>
        <button class="cc-menu-btn" id="mPlay" style="background:linear-gradient(135deg,#22C55E,#16A34A);color:#000">▶ JUGAR NIVEL ${currentLevelNum}</button>
        <div class="cc-menu-grid">
          <button class="cc-menu-btn" id="mHow" style="background:#fff;border:2px solid #DDD6FE;color:#2a1a5e">❓ COMO JUGAR</button>
          <button class="cc-menu-btn" id="mShop" style="background:linear-gradient(135deg,#FEF08A,#FACC15);color:#000">🛒 BOOSTERS</button>
        </div>
        <div style="margin-top:14px;display:flex;gap:6px;justify-content:center">
          <div style="background:#F5F3FF;border:1.5px solid #DDD6FE;border-radius:10px;padding:6px 10px;font-size:10px;font-weight:900">🔨 ${boosters.hammer} MARTILLOS</div>
          <div style="background:#FEF2F2;border:1.5px solid #FECACA;border-radius:10px;padding:6px 10px;font-size:10px;font-weight:900">💣 ${boosters.bomb} BOMBAS</div>
          <div style="background:#FFFBEB;border:1.5px solid #FDE68A;border-radius:10px;padding:6px 10px;font-size:10px;font-weight:900">⚡ ${boosters.rayo} RAYOS</div>
        </div>
        <div style="font-size:9px;opacity:.5;margin-top:10px">WASA: ${fmt(totalReward)} • BEST: ${best}</div>
      </div>
    </div>`;
    ui.querySelector('#mPlay').onclick=()=>{ ui.innerHTML=''; showLevelIntro(); };
    ui.querySelector('#mHow').onclick=()=>showHowToPlay();
    ui.querySelector('#mShop').onclick=()=>showBoosterShop();
  }

  function showHowToPlay(){
    ui.innerHTML=`<div class="cc-howto" id="howto">
      <div class="cc-howto-card">
        <div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:18px">❓ CÓMO JUGAR</b><button id="closeHow" style="width:32px;height:32px;border-radius:10px;border:1.5px solid #E5E7EB;background:#fff;cursor:pointer">✕</button></div>
        
        <div style="background:#FEF9C3;border:2px solid #FDE047;border-radius:14px;padding:12px;margin-top:12px;font-size:13px"><b>🎯 Objetivo:</b> Junta los tokens que te pide cada nivel antes de quedarte sin movimientos o tiempo.</div>

        <div class="cc-howto-item">
          <div class="cc-howto-icon">💣</div>
          <div><b style="font-size:14px">BOMBA (T o L)</b><br><span style="font-size:12px;opacity:.8">Hace 5 fichas en forma de T o L (ej: 3 horizontal + 2 vertical cruzadas).<br><b>Explota 3x3</b> a su alrededor. Toca para activarla.</span><br><div style="margin-top:6px;font-family:monospace;font-size:12px;background:#000;color:#0f0;padding:6px;border-radius:8px">🟦🟦🟦<br>🟦💣🟦<br>🟦🟦 → 💥 BOOM 3x3</div></div>
        </div>

        <div class="cc-howto-item">
          <div class="cc-howto-icon" style="background:linear-gradient(180deg,#FEF08A,#FACC15)">↔️</div>
          <div><b style="font-size:14px">RAYADA (4 en línea)</b><br><span style="font-size:12px;opacity:.8">Hace 4 iguales en línea.<br>Horizontal <b>↔️ barre toda la fila</b>, Vertical <b>↕️ barre columna</b>.</span><br><div style="margin-top:6px;font-family:monospace;font-size:12px;background:#000;color:#38BDF8;padding:6px;border-radius:8px">🟦🟦🟦🟦 → ↔️ RAYADA<br>Toca → ¡PUM toda la fila!</div></div>
        </div>

        <div class="cc-howto-item" style="border-color:#EAB308;background:linear-gradient(180deg,#FFFBEB,#FEF9C3)">
          <div class="cc-howto-icon" style="background:radial-gradient(circle,#FEF08A,#FACC15);border-color:#EAB308">⚡</div>
          <div><b style="font-size:14px">RAYO (5 en línea)</b><br><span style="font-size:12px;opacity:.8">Hace <b>5 iguales en línea</b>.<br>Crea un <b>RAYO ⚡</b> que elimina <b>TODOS los tokens del color que elijas</b>.<br>Arrastra el RAYO hacia un token para elegir color.<br><b>Animación:</b> lanza rayos eléctricos a cada ficha.</span><br><div style="margin-top:6px;font-family:monospace;font-size:12px;background:#000;color:#FACC15;padding:6px;border-radius:8px">🟦🟦🟦🟦🟦 → ⚡<br>⚡ + 🟨 = elimina TODOS los 🟨<br>⚡⚡⚡→💥💥💥</div></div>
        </div>

        <div class="cc-howto-item">
          <div class="cc-howto-icon">🎯</div>
          <div><b style="font-size:14px">COMBOS</b><br><span style="font-size:12px;opacity:.8">Si al caer caen más de 3, se crean más bombas/rayadas automáticas.<br>¡Encadena COMBO x2, x3 para más puntos!</span></div>
        </div>

        <button id="btnGotIt" style="width:100%;height:46px;border-radius:14px;font-weight:900;border:0;background:#2a1a5e;color:#fff;margin-top:14px;cursor:pointer">¡ENTENDIDO! ▶</button>
      </div>
    </div>`;
    const close = ()=>{ const el=ui.querySelector('#howto'); if(el) el.remove(); };
    ui.querySelector('#closeHow').onclick=close;
    ui.querySelector('#btnGotIt').onclick=close;
  }

  function showBoosterShop(){
    ui.innerHTML=`<div class="cc-howto" id="shop">
      <div class="cc-howto-card">
        <div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:18px">🛒 TIENDA BOOSTERS</b><button id="closeShop" style="width:32px;height:32px;border-radius:10px;border:1.5px solid #E5E7EB;background:#fff;cursor:pointer">✕</button></div>
        <div style="background:#F5F3FF;border:1.5px solid #DDD6FE;border-radius:12px;padding:10px;margin-top:12px;font-size:11px;text-align:center">Tu WASA: <b>${fmt(totalReward)}</b> • Usa boosters al inicio del nivel para ventaja</div>

        <div class="cc-booster">
          <div class="cc-booster-icon">🔨</div>
          <div style="flex:1"><b>Martillo</b><br><span style="font-size:11px;opacity:.7">Rompe 1 ficha sin gastar movimiento. Ideal para destrabar.</span><br><span style="font-size:10px;font-weight:900">Tenés: ${boosters.hammer}</span></div>
          <div style="text-align:right"><button class="buyBtn" data-type="hammer" style="height:36px;padding:0 14px;border-radius:10px;border:0;background:#2a1a5e;color:#fff;font-weight:900;cursor:pointer">0.0001 WASA</button><br><button class="useBtn" data-type="hammer" style="margin-top:6px;height:28px;padding:0 10px;border-radius:8px;border:1.5px solid #22C55E;background:#DCFCE7;color:#065F46;font-weight:800;font-size:10px;cursor:pointer">USAR +1</button></div>
        </div>

        <div class="cc-booster">
          <div class="cc-booster-icon" style="background:linear-gradient(180deg,#FECACA,#EF4444)">💣</div>
          <div style="flex:1"><b>Bomba Inicial</b><br><span style="font-size:11px;opacity:.7">Empieza el nivel con 1 bomba 💣 ya en el tablero. Explota 3x3.</span><br><span style="font-size:10px;font-weight:900">Tenés: ${boosters.bomb}</span></div>
          <div style="text-align:right"><button class="buyBtn" data-type="bomb" style="height:36px;padding:0 14px;border-radius:10px;border:0;background:#2a1a5e;color:#fff;font-weight:900;cursor:pointer">0.0002 WASA</button><br><button class="useBtn" data-type="bomb" style="margin-top:6px;height:28px;padding:0 10px;border-radius:8px;border:1.5px solid #EF4444;background:#FEE2E2;color:#991B1B;font-weight:800;font-size:10px;cursor:pointer">USAR +1</button></div>
        </div>

        <div class="cc-booster">
          <div class="cc-booster-icon">⚡</div>
          <div style="flex:1"><b>Rayo Inicial</b><br><span style="font-size:11px;opacity:.7">Empieza con 1 rayo ⚡. Elimina todo un color. ¡El más poderoso!</span><br><span style="font-size:10px;font-weight:900">Tenés: ${boosters.rayo}</span></div>
          <div style="text-align:right"><button class="buyBtn" data-type="rayo" style="height:36px;padding:0 14px;border-radius:10px;border:0;background:#2a1a5e;color:#fff;font-weight:900;cursor:pointer">0.0005 WASA</button><br><button class="useBtn" data-type="rayo" style="margin-top:6px;height:28px;padding:0 10px;border-radius:8px;border:1.5px solid #EAB308;background:#FEF9C3;color:#854D0E;font-weight:800;font-size:10px;cursor:pointer">USAR +1</button></div>
        </div>

        <button id="btnShopPlay" style="width:100%;height:48px;border-radius:14px;font-weight:900;border:0;background:linear-gradient(135deg,#22C55E,#16A34A);color:#000;margin-top:14px;cursor:pointer">▶ JUGAR CON BOOSTERS</button>
      </div>
    </div>`;
    ui.querySelector('#closeShop').onclick=()=>{ const el=ui.querySelector('#shop'); if(el) el.remove(); };
    ui.querySelector('#btnShopPlay').onclick=()=>{ ui.innerHTML=''; showLevelIntro(true); };
    ui.querySelectorAll('.buyBtn').forEach(btn=>{
      btn.onclick=()=>{
        const type=btn.dataset.type;
        const costs={hammer:0.0001,bomb:0.0002,rayo:0.0005};
        const cost=costs[type];
        if(totalReward>=cost){
          totalReward-=cost; localStorage.setItem('wcrush_wasa', totalReward);
          boosters[type]=(boosters[type]||0)+1; saveBoosters();
          showBoosterShop();
        } else { btn.textContent='¡Sin WASA!'; setTimeout(()=>btn.textContent=cost+' WASA',1200); }
      };
    });
    ui.querySelectorAll('.useBtn').forEach(btn=>{
      btn.onclick=()=>{
        const type=btn.dataset.type;
        if((boosters[type]||0)>0){
          // marcar para usar en próximo nivel - por ahora solo suma visual
          btn.textContent='✓ ACTIVADO';
          btn.style.background='#22C55E'; btn.style.color='#fff';
          // guardamos en session que quiere usar
          let pending = JSON.parse(localStorage.getItem('wcrush_pending_boosters')||'{}');
          pending[type]=(pending[type]||0)+1;
          localStorage.setItem('wcrush_pending_boosters', JSON.stringify(pending));
        }
      };
    });
  }

  function animateThunder(originR, originC, targetKeys){
    thunderFx.innerHTML=''; const originEl = gridEl.querySelector(`[data-r="${originR}"][data-c="${originC}"]`); if(!originEl) return;
    const boardRect = boardEl.getBoundingClientRect(); const originRect = originEl.getBoundingClientRect();
    const ox = originRect.left - boardRect.left + originRect.width/2; const oy = originRect.top - boardRect.top + originRect.height/2;
    targetKeys.forEach((key, idx)=>{
      const [r,c]=key.split(',').map(Number); if(r===originR && c===originC) return;
      const targetEl = gridEl.querySelector(`[data-r="${r}"][data-c="${c}"]`); if(!targetEl) return;
      const tr = targetEl.getBoundingClientRect(); const tx = tr.left - boardRect.left + tr.width/2; const ty = tr.top - boardRect.top + tr.height/2;
      const dx = tx-ox, dy = ty-oy; const dist = Math.sqrt(dx*dx + dy*dy); const angle = Math.atan2(dy,dx)*180/Math.PI;
      const lightning = document.createElement('div'); lightning.className='cc-lightning'; lightning.style.left = ox+'px'; lightning.style.top = oy+'px'; lightning.style.width = dist+'px'; lightning.style.transform = `rotate(${angle}deg) scaleX(0)`; lightning.style.animationDelay = (idx*0.06)+'s';
      thunderFx.appendChild(lightning); requestAnimationFrame(()=>{ lightning.style.transform = `rotate(${angle}deg) scaleX(1)`; });
      setTimeout(()=>{ const hit = document.createElement('div'); hit.className='cc-lightning-hit'; hit.style.left = tx+'px'; hit.style.top = ty+'px'; thunderFx.appendChild(hit); setTimeout(()=>hit.remove(), 400); }, idx*60 + 120);
      setTimeout(()=>lightning.remove(), 500 + idx*60);
    });
    setTimeout(()=>{ thunderFx.innerHTML=''; }, targetKeys.length*60 + 800);
  }

  function triggerWinSequence(){
    if(busy) return; busy=true; gameStarted=false; if(timerInt) clearInterval(timerInt);
    const laughFile = pickRandomMeme('laugh'); const laughUrl = getMemeUrl(laughFile);
    const completeOverlay = document.createElement('div'); completeOverlay.className='cc-obj-complete';
    completeOverlay.innerHTML=`<div style="text-align:center;padding:12px"><img class="cc-obj-complete-meme" src="${laughUrl}" alt="laugh" onerror="this.style.display='none'"><div class="cc-obj-complete-text">⚡ OBJETIVOS<br>COMPLETADOS ⚡</div><div class="cc-obj-complete-sub">¡NIVEL ${currentLevelNum} SUPERADO!</div></div>`;
    boardEl.appendChild(completeOverlay); debugInfo.textContent=`¡N${currentLevelNum} COMPLETADO! ${laughFile}`;
    const objMinis = root.querySelectorAll('.cc-obj-mini'); objMinis.forEach(el=>{ el.style.animation='objBlink .3s ease-in-out 6 alternate'; });
    setTimeout(()=>{ if(completeOverlay.parentNode) completeOverlay.remove(); showWin(laughFile); }, 3000);
  }

  function showLevelIntro(useBoosters=false){
    gameStarted=false; busy=false; if(timerInt) clearInterval(timerInt);
    const isTimeLevel = level.type==='time';
    const title = isTimeLevel ? '⏰ NIVEL POR TIEMPO' : '🎯 NIVEL POR MOVIMIENTOS';
    const desc = isTimeLevel ? `¡Alcanza <b style="color:#F59E0B">${level.objectives.find(o=>o.type==='score')?.target || 1000} puntos</b> antes de que se acabe el tiempo!<br>Tienes <b>${level.time} segundos</b>.` : `Consigue los objetivos con solo <b style="color:#F59E0B">${level.moves} movimientos</b>.`;
    const pending = JSON.parse(localStorage.getItem('wcrush_pending_boosters')||'{}');
    const hasPending = Object.keys(pending).some(k=>pending[k]>0);
    const objsHtml = level.objectives.map(o=>{
      if(o.type==='score'){ return `<div style="min-height:48px;background:#FFFBEB;border:2px solid #F59E0B;border-radius:12px;padding:10px 12px;display:flex;align-items:center;gap:12px"><div style="width:32px;height:32px;flex-shrink:0;border-radius:9px;background:#fff;border:2px solid #F59E0B;display:flex;align-items:center;justify-content:center;font-size:18px">⭐</div><div style="flex:1;display:flex;align-items:center"><b style="font-size:13px;line-height:32px">${o.target} PUNTOS</b></div></div>`; }
      if(o.type==='collect_color'){ const tok=ALL_TOKENS[o.color]; return `<div style="min-height:48px;background:#F5F3FF;border:2px solid #DDD6FE;border-radius:12px;padding:10px 12px;display:flex;align-items:center;gap:12px">${createModalTokenIcon(tok)}<div style="flex:1;display:flex;align-items:center"><b style="font-size:13px;line-height:32px;letter-spacing:.02em">${o.name} ${o.target}</b></div></div>`; }
      if(o.type==='collect_special'){ const isBomb = o.special==='bomb'; return `<div style="min-height:48px;background:#F5F3FF;border:2px solid #DDD6FE;border-radius:12px;padding:10px 12px;display:flex;align-items:center;gap:12px"><div style="width:32px;height:32px;flex-shrink:0;border-radius:9px;background:#fff;border:2px solid #E5E7EB;display:flex;align-items:center;justify-content:center;font-size:18px">${isBomb?'💣':'↔️'}</div><div style="flex:1;display:flex;align-items:center"><b style="font-size:13px;line-height:32px">${o.name} ${o.target}</b></div></div>`; }
      return `<div style="min-height:48px;background:linear-gradient(180deg,#FEF9C3,#FDE047);border:2px solid #EAB308;border-radius:12px;padding:10px 12px;display:flex;align-items:center;gap:12px"><div style="width:32px;height:32px;flex-shrink:0;border-radius:9px;background:radial-gradient(circle at 30% 30%, #FEF08A, #FACC15 30%, #CA8A04 100%);border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 0 14px #FACC15, inset 0 0 8px rgba(255,255,255,.9)">⚡</div><div style="flex:1;display:flex;align-items:center"><b style="font-size:13px;line-height:32px;color:#854D0E">${o.name} ${o.target}</b></div></div>`;
    }).join('');

    ui.innerHTML=`<div id="introModal" style="position:fixed;inset:0;background:rgba(15,15,26,.92);backdrop-filter:blur(16px);display:grid;place-items:center;z-index:50;padding:16px">
      <div style="background:linear-gradient(180deg,#fff,#FFFBEB);border:3px solid ${isTimeLevel?'#EF4444':'#EAB308'};border-radius:22px;padding:20px;text-align:center;width:min(380px,94vw);color:#0F172A;box-shadow:0 20px 60px rgba(0,0,0,.5)">
        <div style="font-size:11px;font-weight:900;letter-spacing:.12em;opacity:.6;text-transform:uppercase">${title}</div>
        <div style="font-size:32px;font-weight:900;margin:8px 0;color:${isTimeLevel?'#DC2626':'#854D0E'};line-height:1">NIVEL ${currentLevelNum}</div>
        <div style="background:${isTimeLevel?'#FEF2F2':'#FEF9C3'};border:1.5px solid ${isTimeLevel?'#FECACA':'#FDE047'};border-radius:12px;padding:12px;margin:12px 0;font-size:13px;line-height:1.4">${desc}</div>
        <div style="display:grid;gap:8px;margin:14px 0;text-align:left">${objsHtml}</div>
        ${hasPending?`<div style="background:#DCFCE7;border:2px solid #22C55E;border-radius:12px;padding:8px;font-size:11px;font-weight:800;margin-bottom:10px">🚀 BOOSTERS ACTIVOS: ${Object.entries(pending).filter(([k,v])=>v>0).map(([k,v])=>k+':'+v).join(', ')}</div>`:''}
        <div style="font-size:10px;opacity:.5;margin:10px 0;letter-spacing:.02em">Tokens: ${level.activeTokens.map(t=>t.name).join(', ')}</div>
        <button id="btnStart" style="width:100%;height:52px;border-radius:14px;font-weight:900;font-size:15px;border:0;background:${isTimeLevel?'linear-gradient(135deg,#EF4444,#DC2626)':'linear-gradient(135deg,#EAB308,#CA8A04)'};color:#fff;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;gap:8px">▶ ACEPTAR Y EMPEZAR</button>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
          <button id="btnIntroHow" style="height:38px;border-radius:10px;border:1.5px solid #DDD6FE;background:#fff;font-weight:800;font-size:11px;cursor:pointer">❓ COMO JUGAR</button>
          <button id="btnIntroShop" style="height:38px;border-radius:10px;border:1.5px solid #EAB308;background:#FFFBEB;font-weight:800;font-size:11px;cursor:pointer">🛒 BOOSTERS</button>
        </div>
      </div>
    </div>`;
    const btn=ui.querySelector('#btnStart'); const btnHow=ui.querySelector('#btnIntroHow'); const btnShop=ui.querySelector('#btnIntroShop');
    if(btn){ btn.onclick=()=>{ const modal=ui.querySelector('#introModal'); if(modal) modal.remove(); applyPendingBoosters(); startGameTimer(); }; }
    if(btnHow) btnHow.onclick=()=>showHowToPlay();
    if(btnShop) btnShop.onclick=()=>showBoosterShop();
  }

  function applyPendingBoosters(){
    const pending = JSON.parse(localStorage.getItem('wcrush_pending_boosters')||'{}');
    if(Object.keys(pending).length===0) return;
    // aplicar bomba y rayo al tablero
    let applied=[];
    if(pending.bomb){ for(let i=0;i<pending.bomb;i++){ const r=Math.floor(Math.random()*SZ), c=Math.floor(Math.random()*SZ); board[r][c]=makeCell(board[r][c].c, 'bomb'); applied.push('💣'); } boosters.bomb=Math.max(0,(boosters.bomb||0)-pending.bomb); }
    if(pending.rayo){ for(let i=0;i<pending.rayo;i++){ const r=Math.floor(Math.random()*SZ), c=Math.floor(Math.random()*SZ); board[r][c]=makeCell(board[r][c].c, 'color'); applied.push('⚡'); } boosters.rayo=Math.max(0,(boosters.rayo||0)-pending.rayo); }
    saveBoosters();
    localStorage.removeItem('wcrush_pending_boosters');
    if(applied.length) debugInfo.textContent=`Boosters aplicados: ${applied.join(' ')}`;
    draw();
  }

  function startGameTimer(){ gameStarted=true; busy=false; startTime=Date.now(); debugInfo.textContent=`N${currentLevelNum} ${level.type==='time'?'⏰ '+level.time+'s':'🎯 '+level.moves+' movs'} 💣⚡`; if(level.type==='time'){ if(timerInt) clearInterval(timerInt); timerInt=setInterval(()=>{ if(!gameStarted) return; timeLeft--; if(timeLeft<=0){ timeLeft=0; clearInterval(timerInt); checkFail(); } updateUI(); },1000); } updateUI(); }
  function loadLevel(n){
    currentLevelNum=n; localStorage.setItem('wcrush_level', n);
    const activeTokens=getActiveTokensForLevel(n); level=generateLevel(n, activeTokens);
    score=0; moves=level.moves; timeLeft=level.time; sel=null; busy=false; lastSwap=null; gameStarted=false; if(timerInt) clearInterval(timerInt);
    let tries=0; do{ board=Array(SZ).fill(0).map(()=>Array(SZ).fill(0).map(()=>makeCell(randColorFromActive(activeTokens)))); tries++; }while(findMatches().groups.length>0 && tries<100);
    gridEl.innerHTML=''; for(let r=0;r<SZ;r++) for(let c=0;c<SZ;c++){ const cell=document.createElement('div'); cell.className='cc-cell'; cell.dataset.r=r; cell.dataset.c=c; gridEl.appendChild(cell); }
    thunderFx.innerHTML=''; const activeDiv=root.querySelector('#activeTokens'); activeDiv.innerHTML=''; const neededNames=new Set(level.objectives.filter(o=>o.type==='collect_color').map(o=>o.name));
    activeTokens.forEach(tok=>{ const chip=document.createElement('div'); const isWasa=tok.name==='WASA'; chip.className='cc-token-chip'+(neededNames.has(tok.name)?' needed':'')+(isWasa?' wasa':''); chip.style.background=`linear-gradient(180deg, ${tok.light}, ${tok.bg})`; chip.style.borderColor=tok.bd; chip.title=tok.name; chip.appendChild(createTokenImg(tok, tok.icon)); activeDiv.appendChild(chip); });
    startSession(); draw(); updateObjectivesUI(); updateUI(); showMainMenu();
  }
  function updateUI(){
    const badge=root.querySelector('#lvlBadge');
    if(level.type==='time'){ badge.classList.add('timed'); badge.innerHTML=`<b id="lvlNum">N${currentLevelNum} ⏰</b><span id="lvlUnlock">${level.time}s</span>`; }
    else { badge.classList.remove('timed'); badge.innerHTML=`<b id="lvlNum">N${currentLevelNum}</b><span id="lvlUnlock">${getUnlockedTokens(currentLevelNum).length}/11</span>`; }
    if(level.type==='time'){ root.querySelector('#moves').textContent=gameStarted ? timeLeft+'s' : level.time+'s'; root.querySelector('#movesLabel').textContent=gameStarted ? 'TIEMPO' : 'LISTO'; }
    else { root.querySelector('#moves').textContent=moves; root.querySelector('#movesLabel').textContent='MOVS'; }
    root.querySelector('#cScore').textContent=score; root.querySelector('#cReward').textContent='+'+fmt(totalReward).slice(0,6);
  }
  function updateObjectivesUI(){
    const list=root.querySelector('#objList'); list.innerHTML='';
    level.objectives.forEach(obj=>{
      const item=document.createElement('div'); item.className='cc-obj-mini'+(obj.current>=obj.target?' done':'')+(obj.type==='score'?' time':'');
      const icon=document.createElement('div'); icon.className='cc-obj-mini-icon';
      if(obj.type==='collect_color'){ const tok=ALL_TOKENS[obj.color]; icon.style.background=`linear-gradient(180deg, ${tok.light}, ${tok.bg})`; icon.style.border=`1.5px solid ${tok.bd}`; icon.innerHTML=''; icon.appendChild(createTokenImg(tok, tok.icon)); }
      else { icon.style.background='#fff'; icon.textContent=obj.icon; }
      const info=document.createElement('div'); info.className='cc-obj-mini-info'; info.innerHTML=`<div class="cc-obj-mini-name">${obj.name} ${obj.current}/${obj.target}</div><div class="cc-obj-mini-bar"><div class="cc-obj-mini-fill" style="width:${Math.min(100, obj.current/obj.target*100)}%"></div></div>`;
      item.appendChild(icon); item.appendChild(info); list.appendChild(item);
    });
  }
  function draw(){
    for(let r=0;r<SZ;r++) for(let c=0;c<SZ;c++){
      const idx=r*SZ+c; const cellEl=gridEl.children[idx]; if(!cellEl) continue;
      const obj=board[r][c]; if(!obj){ cellEl.innerHTML=''; continue; }
      let candy=cellEl.querySelector('.cc-candy'); if(!candy){ candy=document.createElement('div'); cellEl.appendChild(candy); }
      const tok=ALL_TOKENS[obj.c]; let cls='cc-candy'; if(tok?.name==='WASA') cls+=' wasa-candy'; if(tok?.name==='DASH') cls+=' dash-candy';
      if(obj.s==='bomb') cls+=' bomb'; else if(obj.s==='h') cls+=' striped-h'; else if(obj.s==='v') cls+=' striped-v'; else if(obj.s==='color') cls+=' color-bomb';
      candy.className=cls;
      if(obj.s==='color'){ candy.innerHTML='⚡'; candy.style.fontSize='24px'; }
      else if(obj.s==='bomb'){
        candy.innerHTML='';
        const wrap=document.createElement('div'); wrap.style.width='100%'; wrap.style.height='100%'; wrap.style.display='grid'; wrap.style.placeItems='center'; wrap.appendChild(createTokenImg(tok, tok.icon));
        candy.appendChild(wrap);
        const bombBadge=document.createElement('div'); bombBadge.textContent='💣'; bombBadge.style.position='absolute'; bombBadge.style.bottom='-4px'; bombBadge.style.right='-4px'; bombBadge.style.fontSize='18px'; bombBadge.style.zIndex='5'; bombBadge.style.filter='drop-shadow(0 1px 2px rgba(0,0,0,.6))';
        candy.appendChild(bombBadge);
        const wrapBorder=document.createElement('div'); wrapBorder.className='bomb-wrap'; candy.appendChild(wrapBorder);
        if(tok.name!=='WASA' && tok.name!=='DASH'){ candy.style.background=`linear-gradient(180deg, ${tok.light}, ${tok.bg})`; candy.style.borderColor='#000'; }
      }
      else { candy.innerHTML=''; candy.appendChild(createTokenImg(tok, tok.icon)); if(tok.name!=='WASA' && tok.name!=='DASH'){ candy.style.background=`linear-gradient(180deg, ${tok.light}, ${tok.bg})`; candy.style.borderColor=tok.bd; } }
      cellEl.classList.remove('sel','matched','new'); if(sel && sel.r==r && sel.c==c) cellEl.classList.add('sel');
    }
  }
  function isAdj(r1,c1,r2,c2){ return Math.abs(r1-r2)+Math.abs(c1-c2)===1; }
  function checkWin(){ return level.objectives.every(o=>o.current>=o.target); }
  function checkFail(){ if(!gameStarted) return; if(level.type==='time' && timeLeft<=0 && !checkWin()){ showFail(); } if(level.type==='moves' && moves<=0 && !checkWin()){ showFail(); } }
  async function handleSelect(r,c){
    if(busy || !gameStarted) return; const obj=board[r][c];
    if(obj.s==='color'){
      if(sel===null){ sel={r,c}; draw(); debugInfo.textContent='⚡ Rayo seleccionado - cambia con un color'; return; }
      else { const other=board[sel.r][sel.c]; if(other.s==='color' || obj.s==='color'){ const targetColor = other.s==='color' ? obj.c : other.c; const rainbowR = other.s==='color' ? sel.r : r; const rainbowC = other.s==='color' ? sel.c : c; const isDoubleRainbow = other.s==='color' && obj.s==='color'; if(isDoubleRainbow){ await activateColorBombRainbowAll(); } else { await activateColorBomb(rainbowR, rainbowC, targetColor); } return; } }
    }
    if(obj.s && sel===null && (obj.s==='h'||obj.s==='v'||obj.s==='bomb')){ await activateSpecial(r,c); return; }
    if(!sel){ sel={r,c}; draw(); return; }
    if(sel.r===r && sel.c===c){ sel=null; draw(); return; }
    if(!isAdj(sel.r,sel.c,r,c)){ sel={r,c}; draw(); return; }
    await trySwap(sel.r,sel.c,r,c);
  }
  async function activateSpecial(r,c){
    if(busy || !gameStarted) return; busy=true; sel=null; const obj=board[r][c]; let toRemove=new Set();
    if(obj.s==='h'){ for(let cc=0;cc<SZ;cc++) toRemove.add(r+','+cc); }
    else if(obj.s==='v'){ for(let rr=0;rr<SZ;rr++) toRemove.add(rr+','+c); }
    else if(obj.s==='bomb'){ for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){ const nr=r+dr, nc=c+dc; if(nr>=0&&nr<SZ&&nc>=0&&nc<SZ) toRemove.add(nr+','+nc); } }
    const allMatchedForCount = Array.from(toRemove); allMatchedForCount.forEach(k=>{ const [rr,cc]=k.split(',').map(Number); const col=board[rr][cc]?.c; if(col!==undefined) level.objectives.forEach(o=>{ if(o.type==='collect_color' && o.color===col) o.current++; }); });
    if(obj.s==='bomb' || obj.s==='h' || obj.s==='v') level.objectives.forEach(o=>{ if(o.type==='collect_special') o.current++; });
    await processMatchesWithSet(Array.from(toRemove), null, 1, []); await runAutoCascade();
    if(level.type==='moves') moves--; updateObjectivesUI(); updateUI(); busy=false; if(checkWin()) triggerWinSequence(); else checkFail();
  }
  async function activateColorBombRainbowAll(){
    if(busy || !gameStarted) return; busy=true; sel=null; let toRemove=new Set(); for(let rr=0;rr<SZ;rr++) for(let cc=0;cc<SZ;cc++) toRemove.add(rr+','+cc);
    const keys = Array.from(toRemove); const centerR = Math.floor(SZ/2), centerC = Math.floor(SZ/2); animateThunder(centerR, centerC, keys); await new Promise(r=>setTimeout(r, 400));
    toRemove.forEach(k=>{ const [rr,cc]=k.split(',').map(Number); const col=board[rr][cc]?.c; if(col!==undefined) level.objectives.forEach(o=>{ if(o.type==='collect_color' && o.color===col) o.current++; }); });
    level.objectives.forEach(o=>{ if(o.type==='collect_rainbow') o.current++; }); await processMatchesWithSet(keys, null, 2, []); await runAutoCascade();
    if(level.type==='moves') moves--; updateObjectivesUI(); updateUI(); busy=false; if(checkWin()) triggerWinSequence(); else checkFail();
  }
  async function activateColorBomb(r,c,targetColor){
    if(busy || !gameStarted) return; busy=true; sel=null; let toRemove=new Set(); toRemove.add(r+','+c);
    for(let rr=0;rr<SZ;rr++) for(let cc=0;cc<SZ;cc++) if(board[rr][cc]?.c===targetColor) toRemove.add(rr+','+cc);
    const keys = Array.from(toRemove); animateThunder(r,c, keys); await new Promise(r=>setTimeout(r, 350 + keys.length*25));
    toRemove.forEach(k=>{ const [rr,cc]=k.split(',').map(Number); const col=board[rr][cc]?.c; if(col!==undefined) level.objectives.forEach(o=>{ if(o.type==='collect_color' && o.color===col) o.current++; }); });
    level.objectives.forEach(o=>{ if(o.type==='collect_rainbow') o.current++; }); await processMatchesWithSet(keys, null, 1, []); await runAutoCascade();
    if(level.type==='moves') moves--; updateObjectivesUI(); updateUI(); busy=false; if(checkWin()) triggerWinSequence(); else checkFail();
  }
  async function trySwap(r1,c1,r2,c2){
    if(busy || !gameStarted) return; busy=true; lastSwap={r1,c1,r2,c2}; const a=board[r1][c1], b=board[r2][c2];
    if(a.s==='color' || b.s==='color'){
      const br=a.s==='color'?r1:r2, bc=a.s==='color'?c1:c2; const other=a.s==='color'?b:a; let toRemove=new Set(); toRemove.add(br+','+bc);
      if(other.s==='color'){ for(let rr=0;rr<SZ;rr++) for(let cc=0;cc<SZ;cc++) toRemove.add(rr+','+cc); }
      else { for(let rr=0;rr<SZ;rr++) for(let cc=0;cc<SZ;cc++) if(board[rr][cc]?.c===other.c) toRemove.add(rr+','+cc); }
      const keys = Array.from(toRemove); sel=null; draw(); animateThunder(br,bc, keys); await new Promise(r=>setTimeout(r, 350 + keys.length*25));
      toRemove.forEach(k=>{ const [rr,cc]=k.split(',').map(Number); const col=board[rr][cc]?.c; if(col!==undefined) level.objectives.forEach(o=>{ if(o.type==='collect_color' && o.color===col) o.current++; }); });
      level.objectives.forEach(o=>{ if(o.type==='collect_rainbow') o.current++; }); await processMatchesWithSet(keys, null, 1, []); await runAutoCascade();
      if(level.type==='moves') moves--; updateObjectivesUI(); updateUI(); busy=false; if(checkWin()) triggerWinSequence(); else checkFail(); return;
    }
    swap(r1,c1,r2,c2); draw(); await new Promise(res=>setTimeout(res,120)); let found=findMatches(); if(found.groups.length===0){ swap(r1,c1,r2,c2); draw(); busy=false; sel=null; return; }
    sel=null; await processCascade(found); if(level.type==='moves') moves--; updateObjectivesUI(); updateUI(); busy=false; if(checkWin()) triggerWinSequence(); else checkFail();
  }
  function swap(r1,c1,r2,c2){ const t=board[r1][c1]; board[r1][c1]=board[r2][c2]; board[r2][c2]=t; }
  function findMatches(){
    const groups=[]; const allCells=new Set();
    for(let r=0;r<SZ;r++){ let c=0; while(c<SZ){ const col=board[r][c]?.c; if(col===undefined){ c++; continue; } let end=c+1; while(end<SZ && board[r][end]?.c===col) end++; const len=end-c; if(len>=3){ const cells=[]; for(let k=c;k<end;k++) cells.push({r,c:k}); groups.push({cells, len, dir:'h', color:col}); cells.forEach(cell=>allCells.add(cell.r+','+cell.c)); } c=end; } }
    for(let c=0;c<SZ;c++){ let r=0; while(r<SZ){ const col=board[r][c]?.c; if(col===undefined){ r++; continue; } let end=r+1; while(end<SZ && board[end][c]?.c===col) end++; const len=end-r; if(len>=3){ const cells=[]; for(let k=r;k<end;k++) cells.push({r:k,c}); groups.push({cells, len, dir:'v', color:col}); cells.forEach(cell=>allCells.add(cell.r+','+cell.c)); } r=end; } }
    return {groups, all:Array.from(allCells)};
  }
  async function runAutoCascade(){
    let combo=1; let found=findMatches(); while(found.groups.length>0){
      combo++; const specialsToCreate=[]; const cellToGroups=new Map(); found.groups.forEach(g=>g.cells.forEach(cell=>{ const key=cell.r+','+cell.c; if(!cellToGroups.has(key)) cellToGroups.set(key,[]); cellToGroups.get(key).push(g); }));
      for(const [key, gList] of cellToGroups){ if(gList.length>=2){ const hasH=gList.some(g=>g.dir==='h'); const hasV=gList.some(g=>g.dir==='v'); if(hasH && hasV){ const [r,c]=key.split(',').map(Number); specialsToCreate.push({r,c,type:'bomb', color:board[r][c]?.c}); } } }
      found.groups.forEach(g=>{ if(g.len===4){ let target=g.cells[Math.floor(g.cells.length/2)]; if(!specialsToCreate.some(s=>s.r===target.r && s.c===target.c)) specialsToCreate.push({r:target.r,c:target.c,type: g.dir==='h' ? 'v' : 'h', color:g.color}); } else if(g.len>=5){ let target=g.cells[Math.floor(g.cells.length/2)]; specialsToCreate.push({r:target.r,c:target.c,type:'color', color:g.color}); } });
      const countSet = new Set(found.all); countSet.forEach(k=>{ const [rr,cc]=k.split(',').map(Number); const col=board[rr][cc]?.c; if(col!==undefined) level.objectives.forEach(o=>{ if(o.type==='collect_color' && o.color===col) o.current++; }); });
      specialsToCreate.forEach(s=>{ if(s.type==='bomb' || s.type==='h' || s.type==='v') level.objectives.forEach(o=>{ if(o.type==='collect_special') o.current++; }); if(s.type==='color') level.objectives.forEach(o=>{ if(o.type==='collect_rainbow') o.current++; }); });
      let toRemoveSet=new Set(found.all); specialsToCreate.forEach(s=> toRemoveSet.delete(s.r+','+s.c)); await processMatchesWithSet(Array.from(toRemoveSet), null, combo, specialsToCreate, false);
      found=findMatches(); if(found.groups.length>0) await new Promise(r=>setTimeout(r,100));
    } updateObjectivesUI(); updateUI(); if(checkWin()) triggerWinSequence();
  }
  async function processCascade(firstFind){
    let combo=0; let current=firstFind; while(current.groups.length>0){
      combo++; const specialsToCreate=[]; const cellToGroups=new Map(); current.groups.forEach(g=>g.cells.forEach(cell=>{ const key=cell.r+','+cell.c; if(!cellToGroups.has(key)) cellToGroups.set(key,[]); cellToGroups.get(key).push(g); }));
      for(const [key, gList] of cellToGroups){ if(gList.length>=2){ const hasH=gList.some(g=>g.dir==='h'); const hasV=gList.some(g=>g.dir==='v'); if(hasH && hasV){ const [r,c]=key.split(',').map(Number); specialsToCreate.push({r,c,type:'bomb', color:board[r][c]?.c}); } } }
      current.groups.forEach(g=>{ if(g.len===4){ let target=g.cells[Math.floor(g.cells.length/2)]; if(lastSwap){ if(g.cells.some(cell=>cell.r===lastSwap.r1 && cell.c===lastSwap.c1)) target={r:lastSwap.r1,c:lastSwap.c1}; else if(g.cells.some(cell=>cell.r===lastSwap.r2 && cell.c===lastSwap.c2)) target={r:lastSwap.r2,c:lastSwap.c2}; } if(!specialsToCreate.some(s=>s.r===target.r && s.c===target.c)) specialsToCreate.push({r:target.r,c:target.c,type: g.dir==='h' ? 'v' : 'h', color:g.color}); } else if(g.len>=5){ let target=g.cells[Math.floor(g.cells.length/2)]; if(lastSwap){ if(g.cells.some(cell=>cell.r===lastSwap.r1 && cell.c===lastSwap.c1)) target={r:lastSwap.r1,c:lastSwap.c1}; else if(g.cells.some(cell=>cell.r===lastSwap.r2 && cell.c===lastSwap.c2)) target={r:lastSwap.r2,c:lastSwap.c2}; } specialsToCreate.push({r:target.r,c:target.c,type:'color', color:g.color}); } });
      const countSet = new Set(current.all); countSet.forEach(k=>{ const [rr,cc]=k.split(',').map(Number); const col=board[rr][cc]?.c; if(col!==undefined) level.objectives.forEach(o=>{ if(o.type==='collect_color' && o.color===col) o.current++; }); });
      specialsToCreate.forEach(s=>{ if(s.type==='bomb' || s.type==='h' || s.type==='v') level.objectives.forEach(o=>{ if(o.type==='collect_special') o.current++; }); if(s.type==='color') level.objectives.forEach(o=>{ if(o.type==='collect_rainbow') o.current++; }); });
      level.objectives.forEach(o=>{ if(o.type==='score') o.current=score; }); let toRemoveSet=new Set(current.all); specialsToCreate.forEach(s=> toRemoveSet.delete(s.r+','+s.c)); await processMatchesWithSet(Array.from(toRemoveSet), null, combo, specialsToCreate, false);
      current=findMatches(); if(current.groups.length>0) await new Promise(r=>setTimeout(r,100));
    } updateObjectivesUI(); updateUI(); if(checkWin()) triggerWinSequence();
  }
  async function processMatchesWithSet(keys, origin, combo=1, specialsToCreate=[], countAlready=true){
    if(countAlready){ keys.forEach(k=>{ const [r,c]=k.split(',').map(Number); const col=board[r]?.[c]?.c; if(col!==undefined) level.objectives.forEach(o=>{ if(o.type==='collect_color' && o.color===col) o.current++; }); }); specialsToCreate.forEach(s=>{ if(s.type==='bomb' || s.type==='h' || s.type==='v') level.objectives.forEach(o=>{ if(o.type==='collect_special') o.current++; }); if(s.type==='color') level.objectives.forEach(o=>{ if(o.type==='collect_rainbow') o.current++; }); }); level.objectives.forEach(o=>{ if(o.type==='score') o.current=score; }); }
    keys.forEach(k=>{ const [r,c]=k.split(',').map(Number); const el=gridEl.querySelector(`[data-r="${r}"][data-c="${c}"]`); if(el){ el.classList.add('matched'); const explo=document.createElement('div'); explo.className='cc-explo'; el.appendChild(explo); } if(board[r] && board[r][c]!==undefined) board[r][c]=null; });
    score+=keys.length*10*combo*(currentLevelNum<20?1:2) + (specialsToCreate.length>0 ? 50*combo : 0);
    if(combo>1){ const comboEl=document.createElement('div'); comboEl.className='cc-combo'; comboEl.textContent=`COMBO x${combo}!`; root.querySelector('#board').appendChild(comboEl); setTimeout(()=>comboEl.remove(),800); }
    await new Promise(r=>setTimeout(r,300)); for(let c=0;c<SZ;c++){ let write=SZ-1; for(let r=SZ-1;r>=0;r--){ if(board[r][c]!==null){ if(write!==r){ board[write][c]=board[r][c]; board[r][c]=null; } write--; } } for(let r=write;r>=0;r--) board[r][c]=makeCell(randColorFromActive(level.activeTokens)); }
    specialsToCreate.forEach(s=>{ if(board[s.r]) board[s.r][s.c]=makeCell(s.color, s.type); }); draw();
    for(let c=0;c<SZ;c++){ for(let r=0;r<2;r++){ const el=gridEl.querySelector(`[data-r="${r}"][data-c="${c}"]`); if(el){ el.classList.add('new'); setTimeout(()=>el.classList.remove('new'),300); } } }
    await new Promise(r=>setTimeout(r,80)); lastSwap=null; level.objectives.forEach(o=>{ if(o.type==='score') o.current=score; });
  }
  function showWin(laughFileFromSeq){
    gameStarted=false; busy=false; if(timerInt) clearInterval(timerInt); const reward=level.reward; totalReward+=reward; localStorage.setItem('wcrush_wasa', totalReward); if(score>best){ best=score; localStorage.setItem('wcrush_best',best); }
    const isTimeLevel=level.type==='time'; const laughFile = laughFileFromSeq || pickRandomMeme('laugh'); const laughUrl = getMemeUrl(laughFile);
    ui.innerHTML=`<div style="position:fixed;inset:0;background:rgba(15,15,26,.92);backdrop-filter:blur(14px);display:grid;place-items:center;z-index:60;padding:16px"><div style="background:linear-gradient(180deg,#fff,#FFFBEB);border:3px solid #22C55E;border-radius:22px;padding:22px;text-align:center;width:min(360px,94vw);color:#0F172A"><img src="${laughUrl}" style="width:110px;height:110px;object-fit:contain;margin:0 auto 10px;display:block;filter:drop-shadow(0 4px 12px rgba(0,0,0,.3))" onerror="this.style.display='none'"><div style="font-size:48px">🎉</div><div style="font-weight:900;font-size:11px;opacity:.6">${isTimeLevel?'⏰ TIEMPO':'🎯 MOVIMIENTOS'} COMPLETADO</div><div style="font-weight:900;font-size:22px;color:#065F46">¡NIVEL ${currentLevelNum}!</div><div style="background:linear-gradient(180deg,#DCFCE7,#86EFAC);border:2px solid #22C55E;border-radius:14px;padding:12px;margin:12px 0;font-weight:900;color:#065F46">💰 +${fmt(reward)} WASA</div><button id="btnNext" style="width:100%;height:46px;border-radius:14px;font-weight:900;border:0;background:linear-gradient(135deg,#22C55E,#16A34A);color:#000;cursor:pointer">SIGUIENTE NIVEL ${currentLevelNum+1}</button><button id="btnDouble" style="width:100%;height:44px;border-radius:14px;font-weight:900;border:2.5px solid #FACC15;background:linear-gradient(135deg,#FEF08A,#FACC15);color:#000;margin-top:8px;cursor:pointer">📺 X2 = ${fmt(reward*2)} WASA</button><button id="btnMenuAfter" style="width:100%;height:38px;border-radius:10px;border:1.5px solid #DDD6FE;background:#fff;margin-top:8px;font-weight:800;cursor:pointer">☰ MENÚ</button></div></div>`;
    const btnNext=ui.querySelector('#btnNext'); const btnDouble=ui.querySelector('#btnDouble'); const btnMenuAfter=ui.querySelector('#btnMenuAfter');
    if(btnNext){ btnNext.onclick=()=>{ btnNext.disabled=true; btnNext.textContent='CARGANDO...'; claim(false,false).catch(()=>{}); ui.innerHTML=''; setTimeout(()=>{ currentLevelNum++; loadLevel(currentLevelNum); },100); }; }
    if(btnDouble){ btnDouble.onclick=()=>openAd('double_level'); }
    if(btnMenuAfter){ btnMenuAfter.onclick=()=>{ ui.innerHTML=''; showMainMenu(); }; }
  }
  function showFail(){
    gameStarted=false; busy=false; if(timerInt) clearInterval(timerInt); const isTimeLevel=level.type==='time'; const reason=isTimeLevel ? `⏰ Tiempo agotado` : `Sin movimientos`; const cryFile = pickRandomMeme('cry'); const cryUrl = getMemeUrl(cryFile);
    ui.innerHTML=`<div style="position:fixed;inset:0;background:rgba(15,15,26,.92);backdrop-filter:blur(14px);display:grid;place-items:center;z-index:60;padding:16px"><div style="background:linear-gradient(180deg,#fff,#FEF2F2);border:3px solid #EF4444;border-radius:22px;padding:22px;text-align:center;width:min(360px,94vw);color:#0F172A"><img src="${cryUrl}" class="cc-fail-meme" style="width:130px;height:130px;object-fit:contain;margin:0 auto 12px;display:block" onerror="this.style.display='none'"><div style="font-size:40px">${isTimeLevel?'⏰':'😭'}</div><div style="font-weight:900;font-size:20px;color:#991B1B">${reason}</div><div style="font-size:12px;opacity:.7;margin:8px 0">Te faltó ${level.objectives.filter(o=>o.current<o.target).map(o=>o.name+' '+o.current+'/'+o.target).join(', ')}</div><button id="btnRetry" style="width:100%;height:46px;border-radius:14px;font-weight:900;border:0;background:#EF4444;color:#fff;cursor:pointer">REINTENTAR</button><button id="btnSkip" style="width:100%;height:44px;border-radius:14px;border:2.5px solid #DDD6FE;background:#fff;color:#854D0E;margin-top:8px;cursor:pointer">${isTimeLevel?'VER ANUNCIO +15s':'VER ANUNCIO +5 MOVS'}</button><button id="btnFailMenu" style="width:100%;height:38px;border-radius:10px;border:1.5px solid #DDD6FE;background:#fff;margin-top:8px;font-weight:800;cursor:pointer">☰ MENÚ / TIENDA</button></div></div>`;
    const btnRetry=ui.querySelector('#btnRetry'); const btnSkip=ui.querySelector('#btnSkip'); const btnFailMenu=ui.querySelector('#btnFailMenu');
    if(btnRetry) btnRetry.onclick=()=>{ ui.innerHTML=''; loadLevel(currentLevelNum); };
    if(btnSkip) btnSkip.onclick=()=>openAd(isTimeLevel?'extra_time':'extra_moves');
    if(btnFailMenu) btnFailMenu.onclick=()=>{ ui.innerHTML=''; showMainMenu(); };
  }
  let dragStart=null;
  function preventScroll(e){ if(dragStart) e.preventDefault(); }
  document.addEventListener('touchmove', preventScroll, {passive:false});
  root.querySelector('#mainArea').addEventListener('touchmove', (e)=>{ if(dragStart) e.preventDefault(); }, {passive:false});
  gridEl.addEventListener('pointerdown', e=>{ const cell=e.target.closest('.cc-cell'); if(!cell || busy) return; dragStart={r:+cell.dataset.r, c:+cell.dataset.c, x:e.clientX, y:e.clientY}; e.preventDefault(); try{ cell.setPointerCapture(e.pointerId); }catch{} });
  gridEl.addEventListener('pointerup', e=>{
    if(!dragStart) return; const cell=document.elementFromPoint(e.clientX,e.clientY)?.closest('.cc-cell'); const dx=e.clientX-dragStart.x, dy=e.clientY-dragStart.y;
    if(cell && (dragStart.r!==+cell.dataset.r || dragStart.c!==+cell.dataset.c) && Math.abs(dragStart.r-+cell.dataset.r)+Math.abs(dragStart.c-+cell.dataset.c)===1){ trySwap(dragStart.r,dragStart.c,+cell.dataset.r,+cell.dataset.c); }
    else if(Math.abs(dx)>18 || Math.abs(dy)>18){ let nr=dragStart.r, nc=dragStart.c; if(Math.abs(dx)>Math.abs(dy)){ nc+= dx>0?1:-1; } else { nr+= dy>0?1:-1; } if(nr>=0&&nr<SZ&&nc>=0&&nc<SZ) trySwap(dragStart.r,dragStart.c,nr,nc); else handleSelect(dragStart.r,dragStart.c); }
    else { handleSelect(dragStart.r,dragStart.c); } dragStart=null;
  });
  gridEl.addEventListener('pointercancel', ()=>{ dragStart=null; });
  root.querySelector('#btnMenu').onclick=()=>showMainMenu();
  root.querySelector('#btnHelp').onclick=()=>showHowToPlay();
  root.querySelector('#btnShop').onclick=()=>showBoosterShop();
  const watcher=setInterval(()=>{ if(window.vrAd===4 && pendingAd){ const t=pendingAd; pendingAd=null; window.vrAd=0; window.vrAdType=null; (async()=>{
    if(t==='double_level'){ ui.innerHTML=`<div style="position:fixed;inset:0;background:rgba(0,0,0,.7);display:grid;place-items:center;z-index:40;color:white">Validando X2...</div>`; const res=await claim(true,true); if(res.ok){ totalReward+=level.reward; localStorage.setItem('wcrush_wasa', totalReward); currentLevelNum++; ui.innerHTML=''; setTimeout(()=>loadLevel(currentLevelNum),100); } else { ui.innerHTML=''; showWin(); } }
    if(t==='extra_moves'){ moves+=5; gameStarted=true; busy=false; startGameTimer(); updateUI(); ui.innerHTML=''; }
    if(t==='extra_time'){ timeLeft+=15; gameStarted=true; busy=false; startGameTimer(); updateUI(); ui.innerHTML=''; }
  })(); } },150);
  loadLevel(currentLevelNum);
  container._cleanup=()=>{ clearInterval(watcher); if(timerInt) clearInterval(timerInt); document.removeEventListener('touchmove', preventScroll); window.vrAd=0; };
}
