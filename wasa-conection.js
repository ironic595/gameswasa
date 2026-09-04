// wasa-conection.js v9.3 - FIX modal trabado "Creando cuenta..." + guest migration
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
let userMenuOpen = false;
let linkedWallets = JSON.parse(localStorage.getItem('wasa_wallets')||'[]');
let pendingVerifyEmail = null;

function getDeviceId(){
  let id = localStorage.getItem('wasa_device_id');
  if(!id){
    id = 'dev_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('wasa_device_id', id);
  }
  return id;
}
function getStoredWallet(){ return localStorage.getItem('wasa_wallet'); }
function getStoredEmail(){ return localStorage.getItem('wasa_email'); }
function getStoredNick(){ return localStorage.getItem('wasa_nick'); }
function getGuestCoins(){ return parseFloat(localStorage.getItem('wasa_coins_guest')||'0'); }
function isLogged(){ return!!(getStoredWallet() || getStoredEmail()); }

async function loadWasaConfig(){
  try{
    const r = await fetch(WASA_CONFIG.WORKER_URL + '?action=get_wasa_config&t='+Date.now());
    const j = await r.json();
    if(j.ok && j.receiver){
      WASA_CONFIG.RECEIVER = j.receiver;
      if(j.usdt_contract) WASA_CONFIG.USDT_CONTRACT = j.usdt_contract;
      if(j.prices) WASA_CONFIG.PRICES = j.prices;
      WASA_CONFIG._loaded = true;
    }
  }catch(e){}
}
function updateWalletUI(){ /* igual que v9 */
  connectedWallet = getStoredWallet();
  connectedEmail = getStoredEmail();
  connectedNickname = getStoredNick();
  try{ linkedWallets = JSON.parse(localStorage.getItem('wasa_wallets')||'[]'); }catch{}
  const btn=document.getElementById('walletBtn');
  const info=document.getElementById('walletConnectedInfo');
  const userBtn=document.getElementById('userBtn');
  if(btn){
    if(connectedWallet){
      btn.textContent = (connectedNickname || connectedWallet.slice(0,6)+'...'+connectedWallet.slice(-4));
      btn.classList.add('connected');
      if(info){ info.style.display='block'; info.textContent='✅ Conectado: '+connectedWallet; }
    }else{ btn.textContent='Connect Wallet'; btn.classList.remove('connected'); if(info) info.style.display='none'; }
  }
  if(userBtn){
    if(isLogged()){
      const name = connectedNickname || connectedEmail?.split('@')[0] || connectedWallet?.slice(0,6) || 'U';
      userBtn.textContent = name.slice(0,2).toUpperCase();
      userBtn.className = 'user-btn connected';
    }else{ userBtn.textContent = '👤'; userBtn.className = 'user-btn disconnected'; }
  }
  if(!isLogged()) closeUserMenu();
}
async function syncBalanceFromD1(){
  const email = getStoredEmail(); const wallet = getStoredWallet(); const device_id = getDeviceId();
  try{
    if(email || wallet){
      const r = await fetch(WASA_CONFIG.WORKER_URL, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({action:'get_balance', email, wallet, device_id})});
      const j = await r.json();
      if(j.ok && typeof j.wasa_balance!== 'undefined'){
        localStorage.setItem('wasa_coins', j.wasa_balance);
        if(typeof setCoinsUI === 'function') setCoinsUI(j.wasa_balance);
        updateWalletUI();
      }
    } else {
      const r = await fetch(WASA_CONFIG.WORKER_URL, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({action:'get_guest_balance', device_id})});
      const j = await r.json();
      if(j.ok){ localStorage.setItem('wasa_coins_guest', j.guest_balance); if(typeof setCoinsUI === 'function') setCoinsUI(j.guest_balance); }
    }
  }catch(e){}
}
function handleWalletBtn(){ if(getStoredWallet()){ openWasaBuy(); }else{ openWalletChooser(); } }
function openWalletChooser(){ document.getElementById('walletChooser')?.classList.add('open'); }
function closeWalletChooser(){ document.getElementById('walletChooser')?.classList.remove('open'); }
function openWasaBuy(){ document.getElementById('wasaBuyModal')?.classList.add('open'); updateWalletUI(); }
function closeWasaBuy(){ document.getElementById('wasaBuyModal')?.classList.remove('open'); }
function openAuthEmail(tab){ if(tab) authTab=tab; closeWalletChooser(); closeUserMenu(); closeVerifyModal(); document.getElementById('authModal')?.classList.add('open'); switchAuthTab(authTab); }
function closeAuthEmail(){ document.getElementById('authModal')?.classList.remove('open'); }
function switchAuthTab(tab){
  authTab=tab;
  document.getElementById('tabLogin')?.classList.toggle('active', tab==='login');
  document.getElementById('tabRegister')?.classList.toggle('active', tab==='register');
  document.getElementById('loginForm').style.display = tab==='login'? 'block' : 'none';
  document.getElementById('registerForm').style.display = tab==='register'? 'block' : 'none';
  document.getElementById('forgotBox')?.classList.remove('open');
}
function openUserMenu(){ document.getElementById('userDropdown')?.classList.add('open'); userMenuOpen=true; }
function closeUserMenu(){ document.getElementById('userDropdown')?.classList.remove('open'); userMenuOpen=false; }
function handleUserBtn(){ if(userMenuOpen) closeUserMenu(); else openUserMenu(); }
function openUserProfile(){ /* igual */ const modal=document.getElementById('userProfileModal'); if(!modal) return; document.getElementById('profileEmail').textContent=getStoredEmail()||'No logeado'; document.getElementById('profileWallet').textContent=getStoredWallet()?.slice(0,10)+'...'+getStoredWallet()?.slice(-6) || 'No conectada'; document.getElementById('profileCoins').textContent=(localStorage.getItem('wasa_coins')||'0')+' $WASA'; document.getElementById('profileDisplayName').textContent=getStoredNick()||getStoredEmail()?.split('@')[0]||'Invitado'; document.getElementById('profileNickname').value=getStoredNick()||''; modal.classList.add('open'); }
function closeUserProfile(){ document.getElementById('userProfileModal')?.classList.remove('open'); }

// ---- FIX PRINCIPAL: doRegister que no se cuelga ----
async function doRegister(){
  const emailEl=document.getElementById('authEmailReg') || document.getElementById('regEmail');
  const passEl=document.getElementById('authPassReg') || document.getElementById('regPass');
  const nickEl=document.getElementById('authNickReg') || document.getElementById('regNick');
  const statusEl=document.getElementById('authStatusReg') || document.getElementById('registerStatus');
  const btn=document.getElementById('registerBtn') || document.querySelector('#registerForm button');
  const email=emailEl?.value.trim().toLowerCase()||'';
  const pass=passEl?.value||'';
  const nick=nickEl?.value.trim()||'';
  if(!email.includes('@')){ if(statusEl){ statusEl.textContent='❌ Email inválido'; statusEl.className='status-box status-err'; statusEl.style.display='block'; } return; }
  if(pass.length<6){ if(statusEl){ statusEl.textContent='❌ Mín 6 caracteres'; statusEl.className='status-box status-err'; statusEl.style.display='block'; } return; }
  if(statusEl){ statusEl.textContent='⏳ Creando cuenta...'; statusEl.className='status-box status-info'; statusEl.style.display='block'; }
  if(btn) btn.disabled=true;
  try{
    const r=await fetch(WASA_CONFIG.WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'register', email, password:pass, nickname:nick, device_id:getDeviceId()})});
    const j=await r.json();
    if(!j.ok) throw new Error(j.error||'Error al crear cuenta');
    // CASO 1: necesita verificación (tu caso ironic595@gmail.com)
    if(j.need_verify || j.need_verification){
      pendingVerifyEmail=email;
      localStorage.setItem('wasa_email_pending', email);
      if(statusEl){ statusEl.textContent='✅ Cuenta creada, verifica tu mail'; statusEl.className='status-box status-ok'; }
      setTimeout(()=>{
        closeAuthEmail();
        openVerifyModal(email);
        const lbl=document.getElementById('verifyEmailLabel'); if(lbl) lbl.textContent=email;
        const gc=document.getElementById('verifyGuestCoins'); if(gc) gc.textContent=j.guest_balance||getGuestCoins()||'0';
      },500);
      return;
    }
    // CASO 2: ya verificado (raro)
    localStorage.setItem('wasa_email', j.email||email);
    if(nick) localStorage.setItem('wasa_nick', nick);
    connectedEmail=email; connectedNickname=nick;
    updateWalletUI();
    if(statusEl){ statusEl.textContent='✅ Cuenta creada'; statusEl.className='status-box status-ok'; }
    setTimeout(()=>{ closeAuthEmail(); openUserProfile(); },700);
  }catch(e){
    if(statusEl){ statusEl.textContent='❌ '+(e.message||'Error'); statusEl.className='status-box status-err'; statusEl.style.display='block'; }
  }finally{ if(btn) btn.disabled=false; }
}
async function doLogin(){
  const email=document.getElementById('authEmail')?.value.trim().toLowerCase()||'';
  const pass=document.getElementById('authPass')?.value||'';
  const statusEl=document.getElementById('authStatus');
  if(statusEl){ statusEl.textContent='⏳ Entrando...'; statusEl.className='status-box status-info'; statusEl.style.display='block'; }
  try{
    const r=await fetch(WASA_CONFIG.WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login', email, password:pass, device_id:getDeviceId()})});
    const j=await r.json(); if(!j.ok) throw new Error(j.error);
    localStorage.setItem('wasa_email', j.email); if(j.nickname) localStorage.setItem('wasa_nick', j.nickname);
    connectedEmail=j.email; connectedNickname=j.nickname||null;
    updateWalletUI(); if(statusEl){ statusEl.textContent='✅ Login OK'; statusEl.className='status-box status-ok'; }
    setTimeout(()=>{ closeAuthEmail(); syncBalanceFromD1(); },700);
  }catch(e){ if(statusEl){ statusEl.textContent='❌ '+e.message; statusEl.className='status-box status-err'; } }
}
function openVerifyModal(email){
  const modal=document.getElementById('verifyEmailModal'); if(!modal) return;
  const label=document.getElementById('verifyEmailLabel'); if(label) label.textContent=email||pendingVerifyEmail||'tu email';
  const gc=document.getElementById('verifyGuestCoins'); if(gc) gc.textContent=getGuestCoins()||localStorage.getItem('wasa_coins_guest')||'0';
  modal.classList.add('open');
  pendingVerifyEmail=email||pendingVerifyEmail;
}
function closeVerifyModal(){ document.getElementById('verifyEmailModal')?.classList.remove('open'); }
async function doVerifyEmail(){
  const code=document.getElementById('verifyCodeInput')?.value.trim()||'';
  const statusEl=document.getElementById('verifyStatus');
  const email=pendingVerifyEmail || localStorage.getItem('wasa_email_pending') || getStoredEmail();
  if(code.length!==6){ if(statusEl){ statusEl.textContent='❌ Código de 6 dígitos'; statusEl.className='status-box status-err'; statusEl.style.display='block'; } return; }
  if(statusEl){ statusEl.textContent='⏳ Verificando...'; statusEl.className='status-box status-info'; statusEl.style.display='block'; }
  try{
    const r=await fetch(WASA_CONFIG.WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'verify_email', email, code, device_id:getDeviceId()})});
    const j=await r.json(); if(!j.ok) throw new Error(j.error);
    localStorage.setItem('wasa_email', email); localStorage.removeItem('wasa_email_pending');
    if(j.nickname) localStorage.setItem('wasa_nick', j.nickname);
    localStorage.setItem('wasa_coins', j.wasa_balance||0); localStorage.removeItem('wasa_coins_guest');
    connectedEmail=email; connectedNickname=j.nickname||null;
    updateWalletUI(); if(typeof setCoinsUI==='function') setCoinsUI(j.wasa_balance||0);
    if(statusEl){ statusEl.textContent='✅ Verificado! '+ (j.claimed? j.claimed+' WASA migrados' : ''); statusEl.className='status-box status-ok'; }
    setTimeout(()=>{ closeVerifyModal(); openUserProfile(); },1000);
  }catch(e){ if(statusEl){ statusEl.textContent='❌ '+e.message; statusEl.className='status-box status-err'; } }
}
async function resendVerifyCode(){
  const email=pendingVerifyEmail || localStorage.getItem('wasa_email_pending'); if(!email) return;
  const statusEl=document.getElementById('verifyStatus');
  if(statusEl){ statusEl.textContent='⏳ Reenviando...'; statusEl.className='status-box status-info'; statusEl.style.display='block'; }
  try{
    const r=await fetch(WASA_CONFIG.WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'register', email, password:'000000', nickname:'resend', device_id:getDeviceId(), resend:true})});
    const j=await r.json(); if(!j.ok) throw new Error(j.error);
    if(statusEl){ statusEl.textContent='✅ Código reenviado'; statusEl.className='status-box status-ok'; }
  }catch(e){ if(statusEl){ statusEl.textContent='❌ '+e.message; statusEl.className='status-box status-err'; } }
}
function openForgot(){ document.getElementById('forgotBox')?.classList.add('open'); document.getElementById('loginForm').style.display='none'; }
function closeForgot(){ document.getElementById('forgotBox')?.classList.remove('open'); document.getElementById('loginForm').style.display='block'; }
async function requestPasswordReset(){ /* igual */ }
async function verifyPasswordReset(){ /* igual */ }
async function connectWith(t){ /* igual */ }
async function buyWasa(a){ /* igual */ }
async function claimGuestCoins(){ const email=getStoredEmail(); const device_id=getDeviceId(); if(!email||!device_id) return; try{ const r=await fetch(WASA_CONFIG.WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'claim_guest_coins', email, device_id})}); const j=await r.json(); if(j.ok){ localStorage.setItem('wasa_coins', j.wasa_balance); localStorage.removeItem('wasa_coins_guest'); setCoinsUI(j.wasa_balance); } }catch(e){} }
function doAuthEmail(){ openAuthEmail('login'); }
function setCoinsUI(n){ const f=(()=>{ const v=parseFloat(n)||0; if(v===0) return '0'; if(v<0.001) return v.toFixed(6).replace(/0+$/,'').replace(/\.$/,''); if(v<1) return (Math.round(v*1000000)/1000000).toString(); return (Math.round(v*1000)/1000).toString(); })()+' $WASA'; const mc=document.getElementById('modalCoins'); if(mc) mc.textContent=f; const hc=document.getElementById('headerCoins'); if(hc) hc.textContent=f; const pe=document.getElementById('profileCoins'); if(pe) pe.textContent=f; }
function getCoins(){ const main=parseFloat(localStorage.getItem('wasa_coins')||'0'); if(!getStoredEmail() &&!getStoredWallet()){ const guest=parseFloat(localStorage.getItem('wasa_coins_guest')||'0'); return main+guest; } return main; }
function setCoins(n){ const email=getStoredEmail(); const wallet=getStoredWallet(); if(!email &&!wallet){ setCoinsUI(n); return; } const old=parseFloat(localStorage.getItem('wasa_coins')||'0'); const delta=n-old; if(Math.abs(delta)>0.1){ setCoinsUI(old); return; } localStorage.setItem('wasa_coins', n); setCoinsUI(n); }
function addCoins(n){ if(n>0.1) return; const cur=getCoins(); setCoins(cur+n); }
window.addEventListener('DOMContentLoaded', async()=>{ getDeviceId(); updateWalletUI(); setCoinsUI(getCoins()); await loadWasaConfig(); await syncBalanceFromD1(); });
window.WASA_CONFIG=WASA_CONFIG; window.getDeviceId=getDeviceId; window.handleUserBtn=handleUserBtn; window.openUserMenu=openUserMenu; window.closeUserMenu=closeUserMenu; window.openUserProfile=openUserProfile; window.closeUserProfile=closeUserProfile; window.saveProfile=async function(){ const nick=document.getElementById('profileNickname')?.value.trim()||''; const el=document.getElementById('profileStatus'); const show=(m,c)=>{ if(el){ el.textContent=m; el.className='status-box '+c; el.style.display='block'; } }; if(nick.length<2) return show('Mín 2 caracteres','status-err'); localStorage.setItem('wasa_nick', nick); try{ await fetch(WASA_CONFIG.WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'update_profile',email:getStoredEmail(),nickname:nick,wallet:getStoredWallet()})}); }catch(e){} updateWalletUI(); document.getElementById('profileDisplayName').textContent=nick; show('✅ Guardado: '+nick,'status-ok'); }; window.logoutUser=function(){ closeUserMenu(); closeUserProfile(); localStorage.removeItem('wasa_wallet'); localStorage.removeItem('wasa_email'); localStorage.removeItem('wasa_nick'); localStorage.removeItem('wasa_wallets'); localStorage.setItem('wasa_coins','0'); if(typeof setCoinsUI==='function') setCoinsUI(0); updateWalletUI(); syncBalanceFromD1(); }; window.loadWasaConfig=loadWasaConfig; window.updateWalletUI=updateWalletUI; window.handleWalletBtn=handleWalletBtn; window.openWalletChooser=openWalletChooser; window.closeWalletChooser=closeWalletChooser; window.openWasaBuy=openWasaBuy; window.closeWasaBuy=closeWasaBuy; window.openAuthEmail=openAuthEmail; window.closeAuthEmail=closeAuthEmail; window.switchAuthTab=switchAuthTab; window.doLogin=doLogin; window.doRegister=doRegister; window.openForgot=openForgot; window.closeForgot=closeForgot; window.requestPasswordReset=requestPasswordReset||function(){}; window.verifyPasswordReset=verifyPasswordReset||function(){}; window.connectWith=connectWith||function(){}; window.buyWasa=buyWasa||function(){}; window.doAuthEmail=doAuthEmail; window.syncBalanceFromD1=syncBalanceFromD1; window.setCoinsUI=setCoinsUI; window.getCoins=getCoins; window.setCoins=setCoins; window.addCoins=addCoins; window.openVerifyModal=openVerifyModal; window.closeVerifyModal=closeVerifyModal; window.doVerifyEmail=doVerifyEmail; window.resendVerifyCode=resendVerifyCode; window.claimGuestCoins=claimGuestCoins;
