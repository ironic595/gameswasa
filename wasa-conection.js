// wasa-conection.js FINAL v2 - con perfil usuario dorado + fix wallets
// Fix: cada wallet abre su página correcta, no siempre metamask
// Nuevo: icono usuario arriba derecha, modal perfil con apodo
const WASA_CONFIG = {
  USDT_CONTRACT: '0x55d398326f99059fF775485246999027B3197955',
  RECEIVER: null,
  WORKER_URL: 'https://games-wasa-worker.javimsites.workers.dev/',
  PRICES: { 10: 5, 50: 20, 100: 35 },
  _loaded: false
};
let connectedWallet = localStorage.getItem('wasa_wallet') || null;
let connectedNickname = localStorage.getItem('wasa_nick') || null;
let connectedEmail = localStorage.getItem('wasa_email') || null;
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
      if(foot) foot.textContent = 'USDT BSC • D1 • Receiver: '+j.receiver.slice(0,6)+'...'+j.receiver.slice(-4);
      return j;
    }
  }catch(e){ console.warn('D1 no responde', e); }
  return null;
}

function isLogged(){ return !!(connectedWallet || connectedEmail); }

function updateWalletUI(){
  const btn=document.getElementById('walletBtn');
  const info=document.getElementById('walletConnectedInfo');
  const userBtn=document.getElementById('userBtn');
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
  // user icon
  if(userBtn){
    if(isLogged()){
      const name = connectedNickname || connectedEmail?.split('@')[0] || connectedWallet?.slice(0,6) || '👤';
      userBtn.textContent = name.slice(0,2).toUpperCase();
      userBtn.classList.add('connected');
      userBtn.title = connectedNickname || connectedEmail || connectedWallet || 'Mi perfil';
    }else{
      userBtn.textContent = '👤';
      userBtn.classList.remove('connected');
      userBtn.title = 'Mi perfil';
    }
  }
}

function handleWalletBtn(){ if(connectedWallet){ openWasaBuy(); }else{ openWalletChooser(); } }
function openWalletChooser(){ const el=document.getElementById('walletChooser'); if(el) el.classList.add('open'); }
function closeWalletChooser(){ const el=document.getElementById('walletChooser'); if(el) el.classList.remove('open'); }
function openWasaBuy(){ const el=document.getElementById('wasaBuyModal'); if(el) el.classList.add('open'); updateWalletUI(); }
function closeWasaBuy(){ const el=document.getElementById('wasaBuyModal'); if(el) el.classList.remove('open'); }

function openAuthEmail(tab){ if(tab) authTab=tab; closeWalletChooser(); const el=document.getElementById('authModal'); if(el) el.classList.add('open'); switchAuthTab(authTab); }
function closeAuthEmail(){ const el=document.getElementById('authModal'); if(el) el.classList.remove('open'); }
function switchAuthTab(tab){
  authTab=tab;
  const tL=document.getElementById('tabLogin'), tR=document.getElementById('tabRegister');
  const fL=document.getElementById('loginForm'), fR=document.getElementById('registerForm');
  const fB=document.getElementById('forgotBox');
  if(tL) tL.classList.toggle('active', tab==='login');
  if(tR) tR.classList.toggle('active', tab==='register');
  if(fL) fL.style.display = tab==='login'? 'block' : 'none';
  if(fR) fR.style.display = tab==='register'? 'block' : 'none';
  if(fB) fB.classList.remove('open');
}
function showAuthStatus(msg, cls, isReg){
  const id = isReg? 'authStatusReg' : 'authStatus';
  const el=document.getElementById(id); if(!el) return;
  el.textContent=msg; el.className='status-box '+cls; el.style.display='block';
}
async function doLogin(){
  const email=document.getElementById('authEmail')?.value.trim().toLowerCase()||'';
  const pass=document.getElementById('authPass')?.value||'';
  if(!email.includes('@')) return showAuthStatus('Email inválido','status-err');
  if(pass.length<6) return showAuthStatus('Mín 6 caracteres','status-err');
  showAuthStatus('⏳ Entrando...','status-info');
  try{
    const r=await fetch(WASA_CONFIG.WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login',email,password:pass})});
    const j=await r.json(); if(!j.ok) throw new Error(j.error);
    localStorage.setItem('wasa_email', j.email); connectedEmail=j.email;
    if(j.nickname){ localStorage.setItem('wasa_nick', j.nickname); connectedNickname=j.nickname; }
    updateWalletUI(); showAuthStatus('✅ Login OK','status-ok'); setTimeout(()=>{ closeAuthEmail(); if(isLogged()) openUserProfile(); },700);
  }catch(e){ showAuthStatus('❌ '+e.message,'status-err'); }
}
async function doRegister(){
  const email=document.getElementById('authEmailReg')?.value.trim().toLowerCase()||'';
  const pass=document.getElementById('authPassReg')?.value||'';
  const nick=document.getElementById('authNickReg')?.value.trim()||'';
  if(!email.includes('@')) return showAuthStatus('Email inválido','status-err',true);
  if(pass.length<6) return showAuthStatus('Mín 6 caracteres','status-err',true);
  showAuthStatus('⏳ Creando cuenta...','status-info',true);
  try{
    const r=await fetch(WASA_CONFIG.WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'register',email,password:pass,nickname:nick})});
    const j=await r.json(); if(!j.ok) throw new Error(j.error);
    localStorage.setItem('wasa_email', j.email); connectedEmail=j.email;
    if(nick){ localStorage.setItem('wasa_nick', nick); connectedNickname=nick; }
    updateWalletUI(); showAuthStatus('✅ Cuenta creada','status-ok',true); setTimeout(()=>{ closeAuthEmail(); openUserProfile(); },700);
  }catch(e){ showAuthStatus('❌ '+e.message,'status-err',true); }
}
function openForgot(){
  const box=document.getElementById('forgotBox'); const f1=document.getElementById('forgotStep1'), f2=document.getElementById('forgotStep2'); const loginForm=document.getElementById('loginForm');
  if(box) box.classList.add('open'); if(loginForm) loginForm.style.display='none'; if(f1) f1.style.display='block'; if(f2) f2.style.display='none';
  const email=document.getElementById('authEmail')?.value||''; const fe=document.getElementById('forgotEmail'); if(fe && email) fe.value=email;
}
function closeForgot(){
  const box=document.getElementById('forgotBox'); const f1=document.getElementById('forgotStep1'), f2=document.getElementById('forgotStep2'); const loginForm=document.getElementById('loginForm');
  if(box) box.classList.remove('open'); if(f1) f1.style.display='block'; if(f2) f2.style.display='none'; if(loginForm) loginForm.style.display='block';
}
async function requestPasswordReset(){
  const email=document.getElementById('forgotEmail')?.value.trim().toLowerCase()||''; const statusEl=document.getElementById('forgotStatus');
  const show=(m,c)=>{ if(statusEl){ statusEl.textContent=m; statusEl.className='status-box '+c; statusEl.style.display='block'; } };
  if(!email.includes('@')) return show('Email inválido','status-err');
  show('⏳ Enviando código (revisá spam)...','status-info');
  try{
    const r=await fetch(WASA_CONFIG.WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'requestpasswordreset',email})});
    const j=await r.json(); show(j.msg || 'Código enviado a '+email,'status-ok'); document.getElementById('forgotStep1').style.display='none'; document.getElementById('forgotStep2').style.display='block';
  }catch(e){ show('❌ '+e.message,'status-err'); }
}
async function verifyPasswordReset(){
  const email=document.getElementById('forgotEmail')?.value.trim().toLowerCase()||''; const code=document.getElementById('forgotCode')?.value.trim()||''; const newPass=document.getElementById('forgotNewPass')?.value||''; const statusEl=document.getElementById('forgotStatus');
  const show=(m,c)=>{ if(statusEl){ statusEl.textContent=m; statusEl.className='status-box '+c; statusEl.style.display='block'; } };
  if(code.length!==6) return show('Código de 6 dígitos','status-err'); if(newPass.length<6) return show('Nueva pass mín 6','status-err');
  show('⏳ Verificando...','status-info');
  try{
    const r=await fetch(WASA_CONFIG.WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'verifypasswordreset',email,code,newPassword:newPass})});
    const j=await r.json(); if(!j.ok) throw new Error(j.error);
    show('✅ Contraseña cambiada! Entrá con la nueva','status-ok'); setTimeout(()=>{ closeForgot(); switchAuthTab('login'); document.getElementById('authEmail').value=email; },1200);
  }catch(e){ show('❌ '+e.message,'status-err'); }
}

// FIX WALLETS - cada una abre su página correcta
async function connectWith(type){
  const isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const currentUrl=window.location.href;
  const domain=currentUrl.replace('https://','').replace('http://','').split('/')[0];
  const path=window.location.pathname;
  try{
    if(window.ethereum){
      const accs=await window.ethereum.request({method:'eth_requestAccounts'});
      connectedWallet=accs[0]; localStorage.setItem('wasa_wallet',connectedWallet); updateWalletUI(); closeWalletChooser(); openWasaBuy(); return;
    }
    // Mobile deep links
    if(isMobile){
      if(type==='metamask'){ window.location.href=`https://metamask.app.link/dapp/${domain}${path}`; return; }
      if(type==='trust'){ window.location.href=`https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(currentUrl)}`; return; }
      if(type==='rabby'){ window.location.href=`https://rabby.io/`; return; }
      if(type==='okx'){ window.location.href=`https://www.okx.com/download?deeplink=okx%3A%2F%2Fwallet%2Fdapp%2Furl%3Furl%3D${encodeURIComponent(currentUrl)}`; return; }
    }
    // Desktop sin wallet instalada - abrir página correcta de cada wallet, no siempre metamask
    const downloads={
      metamask:'https://metamask.io/download/',
      trust:'https://trustwallet.com/download',
      rabby:'https://rabby.io/',
      okx:'https://www.okx.com/download',
      walletconnect:'https://walletconnect.com/'
    };
    const url = downloads[type] || downloads.metamask;
    window.open(url,'_blank');
  }catch(e){ alert('Error: '+e.message); }
}

function parseUSDTtoWei(amount){ const [w,f='']=String(amount).split('.'); const frac=(f+'000000000000000000').slice(0,18); return BigInt(w+frac); }
async function buyWasa(wasaAmount){
  const usdtAmount=WASA_CONFIG.PRICES[wasaAmount]; const statusEl=document.getElementById('buyStatus');
  const show=(m,c)=>{ if(statusEl){ statusEl.textContent=m; statusEl.className='status-box '+c; statusEl.style.display='block'; } };
  if(!WASA_CONFIG._loaded){ show('⏳ Cargando config...','status-info'); await loadWasaConfig(); }
  if(!connectedWallet){ show('⚠ Conectá billetera primero','status-info'); openWalletChooser(); return; }
  if(!WASA_CONFIG.RECEIVER){ show('⚠ Worker D1 caído','status-err'); return; }
  try{
    show('⏳ Pago '+usdtAmount+' USDT -> '+wasaAmount+' WASA...','status-info');
    const toPadded=WASA_CONFIG.RECEIVER.toLowerCase().replace('0x','').padStart(64,'0');
    const amountHex=parseUSDTtoWei(String(usdtAmount)).toString(16).padStart(64,'0');
    const data='0xa9059cbb'+toPadded+amountHex;
    const txHash=await window.ethereum.request({method:'eth_sendTransaction',params:[{from:connectedWallet,to:WASA_CONFIG.USDT_CONTRACT,data}]});
    show('⏳ Tx: '+txHash.slice(0,20)+'... esperando','status-info');
    let receipt=null; for(let i=0;i<60;i++){ try{ receipt=await window.ethereum.request({method:'eth_getTransactionReceipt',params:[txHash]}); if(receipt) break; }catch{} await new Promise(r=>setTimeout(r,1000)); }
    if(receipt && (receipt.status==='0x0'||receipt.status===0)) throw new Error('Transacción fallida on-chain');
    show('✅ Confirmado! Guardando en D1...','status-ok');
    try{ await fetch(WASA_CONFIG.WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'buy_wasa',wallet:connectedWallet,nickname:connectedNickname||'',email:connectedEmail||localStorage.getItem('wasa_email')||'',wasa_amount:wasaAmount,usdt_amount:usdtAmount,network:'BSC',tx_hash:txHash})}); }catch(e){ console.warn(e); }
    const cur=parseFloat(localStorage.getItem('wasa_coins')||'0'); localStorage.setItem('wasa_coins',cur+wasaAmount); if(typeof setCoins==='function') setCoins(cur+wasaAmount); updateWalletUI();
    show('🎉 ¡Compraste '+wasaAmount+' WASA!','status-ok');
  }catch(e){ show('❌ '+e.message,'status-err'); }
}

// NUEVO - PERFIL USUARIO
function handleUserBtn(){
  if(isLogged()){ openUserProfile(); }else{ openAuthEmail('login'); }
}
function openUserProfile(){
  const modal=document.getElementById('userProfileModal'); if(!modal) return;
  document.getElementById('profileEmail').textContent = connectedEmail || localStorage.getItem('wasa_email') || 'No logeado';
  document.getElementById('profileWallet').textContent = connectedWallet ? connectedWallet.slice(0,10)+'...'+connectedWallet.slice(-6) : 'No conectada';
  document.getElementById('profileCoins').textContent = (typeof fmtWASA!=='undefined'? fmtWASA(getCoins?getCoins():0) : localStorage.getItem('wasa_coins')||'0') + ' $WASA';
  document.getElementById('profileDisplayName').textContent = connectedNickname || connectedEmail?.split('@')[0] || (connectedWallet? connectedWallet.slice(0,6)+'...' : 'Invitado');
  const nickInput=document.getElementById('profileNickname'); if(nickInput) nickInput.value = connectedNickname || localStorage.getItem('wasa_nick') || '';
  modal.classList.add('open');
}
function closeUserProfile(){ const el=document.getElementById('userProfileModal'); if(el) el.classList.remove('open'); }
async function saveProfile(){
  const nick=document.getElementById('profileNickname')?.value.trim()||''; const statusEl=document.getElementById('profileStatus');
  const show=(m,c)=>{ if(statusEl){ statusEl.textContent=m; statusEl.className='status-box '+c; statusEl.style.display='block'; } };
  if(nick.length<2){ show('Apodo mín 2 caracteres','status-err'); return; }
  show('⏳ Guardando...','status-info');
  localStorage.setItem('wasa_nick', nick); connectedNickname=nick;
  try{
    // intentar guardar en D1 también
    const email = connectedEmail || localStorage.getItem('wasa_email');
    if(email || connectedWallet){
      await fetch(WASA_CONFIG.WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'update_profile',email,nickname:nick,wallet:connectedWallet})});
    }
  }catch(e){ console.warn('No se pudo guardar en D1, guardado local', e); }
  updateWalletUI();
  document.getElementById('profileDisplayName').textContent=nick;
  show('✅ Apodo guardado: '+nick,'status-ok');
}
function logoutUser(){
  localStorage.removeItem('wasa_wallet'); localStorage.removeItem('wasa_email'); localStorage.removeItem('wasa_nick');
  connectedWallet=null; connectedNickname=null; connectedEmail=null;
  updateWalletUI(); closeUserProfile(); closeWasaBuy();
  const st=document.getElementById('profileStatus'); if(st) st.style.display='none';
}

function doAuthEmail(){ openAuthEmail('login'); }

window.addEventListener('DOMContentLoaded', async()=>{
  connectedWallet=localStorage.getItem('wasa_wallet')||null;
  connectedNickname=localStorage.getItem('wasa_nick')||null;
  connectedEmail=localStorage.getItem('wasa_email')||null;
  updateWalletUI(); await loadWasaConfig();
  if(window.ethereum){
    window.ethereum.request({method:'eth_accounts'}).then(a=>{ if(a[0]){ connectedWallet=a[0]; localStorage.setItem('wasa_wallet',a[0]); updateWalletUI(); } }).catch(()=>{});
  }
});

window.WASA_CONFIG=WASA_CONFIG; window.loadWasaConfig=loadWasaConfig; window.updateWalletUI=updateWalletUI; window.handleWalletBtn=handleWalletBtn; window.handleUserBtn=handleUserBtn; window.openWalletChooser=openWalletChooser; window.closeWalletChooser=closeWalletChooser; window.openWasaBuy=openWasaBuy; window.closeWasaBuy=closeWasaBuy; window.openAuthEmail=openAuthEmail; window.closeAuthEmail=closeAuthEmail; window.switchAuthTab=switchAuthTab; window.doLogin=doLogin; window.doRegister=doRegister; window.openForgot=openForgot; window.closeForgot=closeForgot; window.requestPasswordReset=requestPasswordReset; window.verifyPasswordReset=verifyPasswordReset; window.connectWith=connectWith; window.buyWasa=buyWasa; window.doAuthEmail=doAuthEmail; window.openUserProfile=openUserProfile; window.closeUserProfile=closeUserProfile; window.saveProfile=saveProfile; window.logoutUser=logoutUser;
