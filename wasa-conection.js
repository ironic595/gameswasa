// wasa-connection.js - Conexion aparte para games.wasa.chat
const WASA_CONFIG = {
  USDT_CONTRACT: '0x55d398326f99059fF775485246999027B3197955',
  RECEIVER: null,
  WORKER_URL: 'https://games-wasa-worker.javimsites.workers.dev/',
  PRICES: { 10: 5, 50: 20, 100: 35 },
  _loaded: false
};
let connectedWallet = localStorage.getItem('wasa_wallet') || null;
let connectedNickname = localStorage.getItem('wasa_nick') || null;
async function loadWasaConfig(){
  try{
    const r = await fetch(WASA_CONFIG.WORKER_URL + '?action=get_wasa_config&t='+Date.now());
    const j = await r.json();
    if(j.ok && j.receiver){
      WASA_CONFIG.RECEIVER = j.receiver;
      if(j.usdt_contract) WASA_CONFIG.USDT_CONTRACT = j.usdt_contract;
      if(j.prices) WASA_CONFIG.PRICES = j.prices;
      WASA_CONFIG._loaded = true;
      const foot = document.getElementById('configFooter');
      if(foot) foot.textContent = 'USDT BSC • D1 • Receiver: '+j.receiver.slice(0,6)+'...'+j.receiver.slice(-4);
      return j;
    }
  }catch(e){ console.warn('D1 no responde', e); }
  return null;
}
function updateWalletUI(){
  const btn=document.getElementById('walletBtn');
  const info=document.getElementById('walletConnectedInfo');
  if(!btn) return;
  if(connectedWallet){
    btn.textContent = (connectedNickname || connectedWallet.slice(0,6)+'...'+connectedWallet.slice(-4));
    btn.classList.add('connected');
    if(info){ info.style.display='block'; info.textContent='✅ Conectado: '+connectedWallet; }
  }else{
    btn.textContent='Connect Wallet';
    btn.classList.remove('connected');
    if(info) info.style.display='none';
  }
}
function handleWalletBtn(){ if(connectedWallet){ openWasaBuy(); }else{ openWalletChooser(); } }
function openWalletChooser(){ if(connectedWallet){ openWasaBuy(); return; } const el=document.getElementById('walletChooser'); if(el) el.classList.add('open'); }
function closeWalletChooser(){ const el=document.getElementById('walletChooser'); if(el) el.classList.remove('open'); }
function openWasaBuy(){ const el=document.getElementById('wasaBuyModal'); if(el) el.classList.add('open'); updateWalletUI(); }
function closeWasaBuy(){ const el=document.getElementById('wasaBuyModal'); if(el) el.classList.remove('open'); }
function openAuthEmail(){ closeWalletChooser(); const el=document.getElementById('authModal'); if(el) el.classList.add('open'); }
function closeAuthEmail(){ const el=document.getElementById('authModal'); if(el) el.classList.remove('open'); }
async function connectWith(type){
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const currentUrl = window.location.href;
  const domain = currentUrl.replace('https://','').replace('http://','').split('/')[0];
  try{
    if(window.ethereum){
      const accs = await window.ethereum.request({method:'eth_requestAccounts'});
      connectedWallet = accs[0];
      localStorage.setItem('wasa_wallet', connectedWallet);
      updateWalletUI(); closeWalletChooser(); openWasaBuy(); return;
    }
    if(isMobile){
      if(type==='metamask'){ window.location.href = `https://metamask.app.link/dapp/${domain}${window.location.pathname}`; return; }
      if(type==='trust'){ window.location.href = `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(currentUrl)}`; return; }
      if(type==='rabby'){ window.location.href = `https://rabby.io/open?url=${encodeURIComponent(currentUrl)}`; return; }
      if(type==='okx'){ window.location.href = `https://www.okx.com/download?deeplink=okx%3A%2F%2Fwallet%2Fdapp%2Furl%3Furl%3D${encodeURIComponent(currentUrl)}`; return; }
    }
    if(!window.ethereum){ window.open('https://metamask.io/download/','_blank'); }
  }catch(e){ alert('Error: '+e.message); }
}
function parseUSDTtoWei(amount){ const [w,f=''] = String(amount).split('.'); const frac = (f+'000000000000000000').slice(0,18); return BigInt(w+frac); }
async function buyWasa(wasaAmount){
  const usdtAmount = WASA_CONFIG.PRICES[wasaAmount];
  const nick = document.getElementById('nicknameInput')?.value.trim() || null;
  const statusEl = document.getElementById('buyStatus');
  const show = (m,c)=>{ if(statusEl){ statusEl.textContent=m; statusEl.className='status-box '+c; statusEl.style.display='block'; } };
  if(!WASA_CONFIG._loaded){ show('⏳ Cargando config...','status-info'); await loadWasaConfig(); }
  if(!connectedWallet){ show('⚠ Conectá billetera','status-info'); openWalletChooser(); return; }
  if(!WASA_CONFIG.RECEIVER){ show('⚠ Worker D1 caído','status-err'); return; }
  try{
    show('⏳ Pago '+usdtAmount+' USDT -> '+wasaAmount+' WASA...','status-info');
    const toPadded = WASA_CONFIG.RECEIVER.toLowerCase().replace('0x','').padStart(64,'0');
    const amountHex = parseUSDTtoWei(String(usdtAmount)).toString(16).padStart(64,'0');
    const data = '0xa9059cbb'+toPadded+amountHex;
    const txHash = await window.ethereum.request({ method:'eth_sendTransaction', params:[{ from: connectedWallet, to: WASA_CONFIG.USDT_CONTRACT, data }] });
    show('⏳ Tx: '+txHash.slice(0,20)+'... esperando','status-info');
    let receipt=null; for(let i=0;i<60;i++){ try{ receipt=await window.ethereum.request({method:'eth_getTransactionReceipt',params:[txHash]}); if(receipt) break; }catch{} await new Promise(r=>setTimeout(r,1000)); }
    if(receipt && (receipt.status==='0x0'||receipt.status===0)) throw new Error('Tx fallida');
    show('✅ Confirmado! Guardando en D1...','status-ok');
    if(nick){ localStorage.setItem('wasa_nick', nick); connectedNickname=nick; }
    try{ await fetch(WASA_CONFIG.WORKER_URL,{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'buy_wasa', wallet:connectedWallet, nickname:nick||connectedNickname||'', email:localStorage.getItem('wasa_email')||'', wasa_amount:wasaAmount, usdt_amount:usdtAmount, network:'BSC', tx_hash:txHash }) }); }catch(e){}
    const cur = parseFloat(localStorage.getItem('wasa_coins')||'0'); localStorage.setItem('wasa_coins', cur + wasaAmount); if(typeof setCoins==='function') setCoins(cur + wasaAmount); updateWalletUI(); show('🎉 Compraste '+wasaAmount+' WASA!','status-ok');
  }catch(e){ show('❌ '+e.message,'status-err'); }
}
function doAuthEmail(mode){
  const email=document.getElementById('authEmail')?.value.trim().toLowerCase()||''; const pass=document.getElementById('authPass')?.value||''; const nick=document.getElementById('authNick')?.value.trim()||''; const el=document.getElementById('authStatus');
  const show=(m,c)=>{ if(el){ el.textContent=m; el.className='status-box '+c; el.style.display='block'; } };
  if(!email.includes('@')) return show('Email inválido','status-err'); if(pass.length<6) return show('Mín 6 chars','status-err');
  localStorage.setItem('wasa_email', email); if(nick) localStorage.setItem('wasa_nick', nick); show((mode==='login'?'Login OK: ':'Cuenta creada: ')+email,'status-ok'); setTimeout(()=>{ closeAuthEmail(); openWasaBuy(); },800);
}
window.addEventListener('DOMContentLoaded', async()=>{ updateWalletUI(); await loadWasaConfig(); if(window.ethereum){ window.ethereum.request({method:'eth_accounts'}).then(a=>{ if(a[0]){ connectedWallet=a[0]; localStorage.setItem('wasa_wallet',a[0]); updateWalletUI(); } }).catch(()=>{}); } });
window.WASA_CONFIG=WASA_CONFIG; window.loadWasaConfig=loadWasaConfig; window.updateWalletUI=updateWalletUI; window.handleWalletBtn=handleWalletBtn; window.openWalletChooser=openWalletChooser; window.closeWalletChooser=closeWalletChooser; window.openWasaBuy=openWasaBuy; window.closeWasaBuy=closeWasaBuy; window.openAuthEmail=openAuthEmail; window.closeAuthEmail=closeAuthEmail; window.connectWith=connectWith; window.buyWasa=buyWasa; window.doAuthEmail=doAuthEmail;
