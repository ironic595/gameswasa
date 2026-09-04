// wasa-conexion.js FINAL - 2 pestañas + recupero con código
const WASA_CONFIG = {
  USDT_CONTRACT: '0x55d398326f99059fF775485246999027B3197955',
  RECEIVER: null,
  WORKER_URL: 'https://games-wasa-worker.javimsites.workers.dev/',
  PRICES: { 10: 5, 50: 20, 100: 35 },
  _loaded: false
};
let connectedWallet = localStorage.getItem('wasa_wallet') || null;
let connectedNickname = localStorage.getItem('wasa_nick') || null;
let authTab = 'login';

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
      if(foot) foot.textContent = 'USDT BSC • D1 • '+j.receiver.slice(0,6)+'...'+j.receiver.slice(-4);
    }
  }catch(e){ console.warn('D1 no responde', e); }
}

function updateWalletUI(){
  const btn=document.getElementById('walletBtn');
  if(!btn) return;
  btn.textContent = connectedWallet? (connectedNickname || connectedWallet.slice(0,6)+'...'+connectedWallet.slice(-4)) : 'Connect Wallet';
  btn.classList.toggle('connected',!!connectedWallet);
}

function handleWalletBtn(){ if(connectedWallet) openWasaBuy(); else openWalletChooser(); }
function openWalletChooser(){ if(connectedWallet) return openWasaBuy(); document.getElementById('walletChooser')?.classList.add('open'); }
function closeWalletChooser(){ document.getElementById('walletChooser')?.classList.remove('open'); }
function openWasaBuy(){ document.getElementById('wasaBuyModal')?.classList.add('open'); }
function closeWasaBuy(){ document.getElementById('wasaBuyModal')?.classList.remove('open'); }

function openAuthEmail(tab='login'){
  closeWalletChooser();
  authTab=tab;
  document.getElementById('authModal')?.classList.add('open');
  switchAuthTab(tab);
}
function closeAuthEmail(){ document.getElementById('authModal')?.classList.remove('open'); }

function switchAuthTab(tab){
  authTab=tab;
  document.getElementById('tabLogin')?.classList.toggle('active', tab==='login');
  document.getElementById('tabRegister')?.classList.toggle('active', tab==='register');
  document.getElementById('loginForm').style.display = tab==='login'? 'block' : 'none';
  document.getElementById('registerForm').style.display = tab==='register'? 'block' : 'none';
  document.getElementById('forgotBox')?.classList.remove('open');
}

function showStatus(msg,cls,isReg=false){
  const id = isReg? 'authStatusReg' : 'authStatus';
  const el=document.getElementById(id); if(!el) return;
  el.textContent=msg; el.className='status-box '+cls; el.style.display='block';
}

async function doLogin(){
  const email=document.getElementById('authEmail')?.value.trim().toLowerCase()||'';
  const pass=document.getElementById('authPass')?.value||'';
  if(!email.includes('@')) return showStatus('Email inválido','status-err');
  if(pass.length<6) return showStatus('Mín 6','status-err');
  showStatus('⏳ Entrando...','status-info');
  try{
    const r=await fetch(WASA_CONFIG.WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login',email,password:pass})});
    const j=await r.json(); if(!j.ok) throw new Error(j.error);
    localStorage.setItem('wasa_email', email); if(j.nickname) localStorage.setItem('wasa_nick', j.nickname);
    showStatus('✅ Login OK','status-ok'); setTimeout(()=>{ closeAuthEmail(); openWasaBuy(); },600);
  }catch(e){ showStatus('❌ '+e.message,'status-err'); }
}

async function doRegister(){
  const email=document.getElementById('authEmailReg')?.value.trim().toLowerCase()||'';
  const pass=document.getElementById('authPassReg')?.value||'';
  const nick=document.getElementById('authNickReg')?.value.trim()||'';
  if(!email.includes('@')) return showStatus('Email inválido','status-err',true);
  if(pass.length<6) return showStatus('Mín 6','status-err',true);
  showStatus('⏳ Creando...','status-info',true);
  try{
    const r=await fetch(WASA_CONFIG.WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'register',email,password:pass,nickname:nick})});
    const j=await r.json(); if(!j.ok) throw new Error(j.error);
    localStorage.setItem('wasa_email', email); if(nick) localStorage.setItem('wasa_nick', nick);
    showStatus('✅ Cuenta creada','status-ok',true); setTimeout(()=>{ closeAuthEmail(); openWasaBuy(); },600);
  }catch(e){ showStatus('❌ '+e.message,'status-err',true); }
}

// FORGOT PASSWORD
function openForgot(){
  document.getElementById('forgotBox')?.classList.add('open');
  document.getElementById('loginForm').style.display='none';
  document.getElementById('forgotStep1').style.display='block';
  document.getElementById('forgotStep2').style.display='none';
  const email=document.getElementById('authEmail')?.value||'';
  if(email) document.getElementById('forgotEmail').value=email;
}
function closeForgot(){
  document.getElementById('forgotBox')?.classList.remove('open');
  document.getElementById('loginForm').style.display='block';
}

async function requestPasswordReset(){
  const email=document.getElementById('forgotEmail')?.value.trim().toLowerCase()||'';
  const el=document.getElementById('forgotStatus');
  if(!email.includes('@')){ el.textContent='Email inválido'; el.className='status-box status-err'; el.style.display='block'; return; }
  el.textContent='⏳ Enviando código...'; el.className='status-box status-info'; el.style.display='block';
  try{
    const r=await fetch(WASA_CONFIG.WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'requestpasswordreset',email})});
    const j=await r.json();
    el.textContent=j.msg||'Código enviado, revisá spam'; el.className='status-box status-ok';
    document.getElementById('forgotStep1').style.display='none';
    document.getElementById('forgotStep2').style.display='block';
  }catch(e){ el.textContent='❌ '+e.message; el.className='status-box status-err'; }
}

async function verifyPasswordReset(){
  const email=document.getElementById('forgotEmail')?.value.trim().toLowerCase()||'';
  const code=document.getElementById('forgotCode')?.value.trim()||'';
  const newPass=document.getElementById('forgotNewPass')?.value||'';
  const el=document.getElementById('forgotStatus');
  if(code.length!==6) { el.textContent='Código 6 dígitos'; el.className='status-box status-err'; el.style.display='block'; return; }
  if(newPass.length<6){ el.textContent='Mín 6 caracteres'; el.className='status-box status-err'; el.style.display='block'; return; }
  el.textContent='⏳ Verificando...'; el.className='status-box status-info'; el.style.display='block';
  try{
    const r=await fetch(WASA_CONFIG.WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'verifypasswordreset',email,code,newPassword:newPass})});
    const j=await r.json(); if(!j.ok) throw new Error(j.error);
    el.textContent='✅ Contraseña cambiada!'; el.className='status-box status-ok';
    localStorage.setItem('wasa_email', email);
    setTimeout(()=>{ closeAuthEmail(); closeForgot(); openWasaBuy(); },800);
  }catch(e){ el.textContent='❌ '+e.message; el.className='status-box status-err'; }
}

// WALLET + BUY (igual que antes)
async function connectWith(type){
  const isMobile=/Android|iPhone|iPad/i.test(navigator.userAgent);
  const cur=window.location.href; const domain=cur.replace('https://','').split('/')[0];
  try{
    if(window.ethereum){ const accs=await window.ethereum.request({method:'eth_requestAccounts'}); connectedWallet=accs[0]; localStorage.setItem('wasa_wallet',connectedWallet); updateWalletUI(); closeWalletChooser(); openWasaBuy(); return; }
    if(isMobile){
      if(type==='metamask') location.href=`https://metamask.app.link/dapp/${domain}`;
      if(type==='trust') location.href=`https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(cur)}`;
    }
  }catch(e){ alert(e.message); }
}
function parseUSDTtoWei(a){ const [w,f='']=String(a).split('.'); return BigInt(w+(f+'000000000000000000').slice(0,18)); }
async function buyWasa(amt){
  const usdt=WASA_CONFIG.PRICES[amt]; const nick=document.getElementById('nicknameInput')?.value.trim()||''; const statusEl=document.getElementById('buyStatus');
  const show=(m,c)=>{ if(statusEl){ statusEl.textContent=m; statusEl.className='status-box '+c; statusEl.style.display='block'; } };
  if(!WASA_CONFIG._loaded) await loadWasaConfig();
  if(!connectedWallet){ show('Conectá wallet','status-info'); return openWalletChooser(); }
  try{
    show('⏳ Pagando '+usdt+' USDT...','status-info');
    const toPadded=WASA_CONFIG.RECEIVER.toLowerCase().replace('0x','').padStart(64,'0');
    const amountHex=parseUSDTtoWei(String(usdt)).toString(16).padStart(64,'0');
    const data='0xa9059cbb'+toPadded+amountHex;
    const txHash=await window.ethereum.request({method:'eth_sendTransaction',params:[{from:connectedWallet,to:WASA_CONFIG.USDT_CONTRACT,data}]});
    show('⏳ Esperando conf... '+txHash.slice(0,10)+'...','status-info');
    let receipt=null; for(let i=0;i<60;i++){ try{ receipt=await window.ethereum.request({method:'eth_getTransactionReceipt',params:[txHash]}); if(receipt) break; }catch{} await new Promise(r=>setTimeout(r,1000)); }
    if(receipt && receipt.status==='0x0') throw new Error('Tx fallida');
    await fetch(WASA_CONFIG.WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'buy_wasa',wallet:connectedWallet,nickname:nick||connectedNickname||'',email:localStorage.getItem('wasa_email')||'',wasa_amount:amt,usdt_amount:usdt,network:'BSC',tx_hash:txHash})});
    const cur=parseFloat(localStorage.getItem('wasa_coins')||'0'); localStorage.setItem('wasa_coins',cur+amt); if(typeof setCoins==='function') setCoins(cur+amt);
    show('🎉 Compraste '+amt+' WASA!','status-ok');
  }catch(e){ show('❌ '+e.message,'status-err'); }
}

window.addEventListener('DOMContentLoaded', async()=>{ updateWalletUI(); await loadWasaConfig(); });
window.WASA_CONFIG=WASA_CONFIG; window.loadWasaConfig=loadWasaConfig; window.updateWalletUI=updateWalletUI; window.handleWalletBtn=handleWalletBtn; window.openWalletChooser=openWalletChooser; window.closeWalletChooser=closeWalletChooser; window.openWasaBuy=openWasaBuy; window.closeWasaBuy=closeWasaBuy; window.openAuthEmail=openAuthEmail; window.closeAuthEmail=closeAuthEmail; window.switchAuthTab=switchAuthTab; window.doLogin=doLogin; window.doRegister=doRegister; window.openForgot=openForgot; window.closeForgot=closeForgot; window.requestPasswordReset=requestPasswordReset; window.verifyPasswordReset=verifyPasswordReset; window.connectWith=connectWith; window.buyWasa=buyWasa;
