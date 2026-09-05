// wasa-conection.js v9.4 - FIX REAL connectWith + undefined
const WASA_CONFIG = {
  USDT_CONTRACT: '0x55d398326f99059fF775485246999027B3197955',
  RECEIVER: null,
  WORKER_URL: 'https://games-wasa-worker.javimsites.workers.dev/',
  PRICES: { 10: 5, 50: 20, 100: 35 },
  _loaded: false
};
let connectedWallet = null; let connectedNickname = null; let connectedEmail = null;
let authTab = 'login'; let userMenuOpen = false; let linkedWallets = []; let pendingVerifyEmail = null;

function getDeviceId(){ let id=localStorage.getItem('wasa_device_id'); if(!id){ id='dev_'+Math.random().toString(36).slice(2)+Date.now().toString(36); localStorage.setItem('wasa_device_id',id); } return id; }
function cleanStored(v){ if(v==null) return null; const s=String(v).trim(); if(!s || s==="undefined" || s==="null" || s==="") return null; return s; }
function getStoredWallet(){ const v=cleanStored(localStorage.getItem('wasa_wallet')); if(!v || v.length<10) return null; return v.toLowerCase(); }
function getStoredEmail(){ const v=cleanStored(localStorage.getItem('wasa_email')); if(!v ||!v.includes('@')) return null; return v.toLowerCase(); }
function getStoredNick(){ return cleanStored(localStorage.getItem('wasa_nick')); }
function getGuestCoins(){ return parseFloat(localStorage.getItem('wasa_coins_guest')||'0'); }
function isLogged(){ return!!(getStoredWallet() || getStoredEmail()); }

async function loadWasaConfig(){ try{ const r=await fetch(WASA_CONFIG.WORKER_URL+'?action=get_wasa_config&t='+Date.now()); const j=await r.json(); if(j.ok&&j.receiver){ WASA_CONFIG.RECEIVER=j.receiver; if(j.usdt_contract) WASA_CONFIG.USDT_CONTRACT=j.usdt_contract; if(j.prices) WASA_CONFIG.PRICES=j.prices; WASA_CONFIG._loaded=true; } }catch(e){} }
function updateWalletUI(){
  connectedWallet=getStoredWallet(); connectedEmail=getStoredEmail(); connectedNickname=getStoredNick();
  try{ linkedWallets=JSON.parse(localStorage.getItem('wasa_wallets')||'[]'); if(!Array.isArray(linkedWallets)) linkedWallets=[]; }catch{ linkedWallets=[]; }
  const btn=document.getElementById('walletBtn'); const info=document.getElementById('walletConnectedInfo'); const userBtn=document.getElementById('userBtn');
  if(btn){ if(connectedWallet){ btn.textContent=(connectedNickname||connectedWallet.slice(0,6)+'...'+connectedWallet.slice(-4)); btn.classList.add('connected'); if(info){ info.style.display='block'; info.textContent='✅ '+connectedWallet; } }else{ btn.textContent='Connect Wallet'; btn.classList.remove('connected'); if(info) info.style.display='none'; } }
  if(userBtn){ if(isLogged()){ const name=connectedNickname||connectedEmail?.split('@')[0]||connectedWallet?.slice(0,6)||'U'; userBtn.textContent=name.slice(0,2).toUpperCase(); userBtn.className='user-btn connected'; }else{ userBtn.textContent='👤'; userBtn.className='user-btn disconnected'; } }
  if(!isLogged()) closeUserMenu();
}
async function syncBalanceFromD1(){
  const email=getStoredEmail(); const wallet=getStoredWallet(); const device_id=getDeviceId();
  try{
    if(email||wallet){ const r=await fetch(WASA_CONFIG.WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'get_balance',email,wallet,device_id})}); const j=await r.json(); if(j.ok&&typeof j.wasa_balance!=='undefined'){ localStorage.setItem('wasa_coins',j.wasa_balance); setCoinsUI(j.wasa_balance); if(j.wallets) localStorage.setItem('wasa_wallets',JSON.stringify(j.wallets)); if(j.nickname&&!getStoredNick()) localStorage.setItem('wasa_nick',j.nickname); updateWalletUI(); } }
    else{ const r=await fetch(WASA_CONFIG.WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'get_guest_balance',device_id})}); const j=await r.json(); if(j.ok){ localStorage.setItem('wasa_coins_guest',j.guest_balance); setCoinsUI(j.guest_balance); } }
  }catch(e){}
}
async function saveCoinsToD1(delta){}
async function claimGuestCoins(){ const email=getStoredEmail(); const device_id=getDeviceId(); if(!email||!device_id) return; try{ const r=await fetch(WASA_CONFIG.WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'claim_guest_coins',email,device_id})}); const j=await r.json(); if(j.ok){ localStorage.setItem('wasa_coins',j.wasa_balance); localStorage.removeItem('wasa_coins_guest'); setCoinsUI(j.wasa_balance); } }catch(e){} }
function handleWalletBtn(){ if(getStoredWallet()){ openWasaBuy(); }else{ openWalletChooser(); } }
function openWalletChooser(){ document.getElementById('walletChooser')?.classList.add('open'); }
function closeWalletChooser(){ document.getElementById('walletChooser')?.classList.remove('open'); }
function openWasaBuy(){ document.getElementById('wasaBuyModal')?.classList.add('open'); updateWalletUI(); }
function closeWasaBuy(){ document.getElementById('wasaBuyModal')?.classList.remove('open'); }
function openAuthEmail(tab){ if(tab) authTab=tab; closeWalletChooser(); closeUserMenu(); closeVerifyModal(); document.getElementById('authModal')?.classList.add('open'); switchAuthTab(authTab); }
function closeAuthEmail(){ document.getElementById('authModal')?.classList.remove('open'); }
function switchAuthTab(tab){ authTab=tab; document.getElementById('tabLogin')?.classList.toggle('active',tab==='login'); document.getElementById('tabRegister')?.classList.toggle('active',tab==='register'); const lf=document.getElementById('loginForm'); const rf=document.getElementById('registerForm'); if(lf) lf.style.display=tab==='login'?'block':'none'; if(rf) rf.style.display=tab==='register'?'block':'none'; const fb=document.getElementById('forgotBox'); if(fb) fb.classList.remove('open'); }
function openUserMenu(){ if(!isLogged()){ openAuthEmail('register'); return; } document.getElementById('userDropdown')?.classList.add('open'); userMenuOpen=true; }
function closeUserMenu(){ document.getElementById('userDropdown')?.classList.remove('open'); userMenuOpen=false; }
function handleUserBtn(){ if(!isLogged()){ openAuthEmail('register'); return; } if(userMenuOpen) closeUserMenu(); else openUserMenu(); }
function openUserProfile(){
  const modal=document.getElementById('userProfileModal'); if(!modal) return;
  const email=getStoredEmail(); const wallet=getStoredWallet(); const nick=getStoredNick(); const isLog=isLogged();
  document.getElementById('profileEmail').textContent=email||'No logeado';
  document.getElementById('profileWallet').textContent=wallet? wallet.slice(0,10)+'...'+wallet.slice(-6) : 'No conectada';
  const guestBal=localStorage.getItem('wasa_coins_guest')||'0';
  document.getElementById('profileCoins').textContent=(localStorage.getItem('wasa_coins')||'0')+' $WASA'+(guestBal!=='0'&&!isLog?' + '+guestBal+' guest':'');
  document.getElementById('profileDisplayName').textContent=isLog?(nick||email?.split('@')[0]||(wallet?wallet.slice(0,6)+'...':'Usuario')):'Invitado';
  const nickInput=document.getElementById('profileNickname'); if(nickInput) nickInput.value=nick||'';
  const listEl=document.getElementById('profileWalletsList'); if(listEl){ if(linkedWallets.length>0){ listEl.innerHTML=linkedWallets.map(w=>`<div style="font-size:10px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05);display:flex;justify-content:space-between"><span>${w.wallet_address.slice(0,6)}...${w.wallet_address.slice(-4)}</span><span style="color:${w.is_primary?'#fbbf24':'#64748b'}">${w.is_primary?'● primaria':''}</span></div>`).join(''); }else{ listEl.innerHTML='<div style="font-size:10px;color:#64748b">No hay wallets linkeadas</div>'; } }
  modal.classList.add('open');
}
function closeUserProfile(){ document.getElementById('userProfileModal')?.classList.remove('open'); }
async function saveProfile(){ const nick=document.getElementById('profileNickname')?.value.trim()||''; const el=document.getElementById('profileStatus'); const show=(m,c)=>{ if(el){ el.textContent=m; el.className='status-box '+c; el.style.display='block'; } }; if(nick.length<2) return show('Mín 2 caracteres','status-err'); localStorage.setItem('wasa_nick',nick); try{ await fetch(WASA_CONFIG.WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'update_profile',email:getStoredEmail(),nickname:nick,wallet:getStoredWallet()})}); }catch(e){} updateWalletUI(); document.getElementById('profileDisplayName').textContent=nick; show('✅ Guardado: '+nick,'status-ok'); }
function logoutUser(){ closeUserMenu(); closeUserProfile(); localStorage.removeItem('wasa_wallet'); localStorage.removeItem('wasa_email'); localStorage.removeItem('wasa_nick'); localStorage.removeItem('wasa_wallets'); localStorage.removeItem('wasa_email_pending'); localStorage.setItem('wasa_coins','0'); setCoinsUI(0); updateWalletUI(); syncBalanceFromD1(); }
function setCoinsUI(n){ const f=(()=>{ const v=parseFloat(n)||0; if(v===0) return '0'; if(v<0.001) return v.toFixed(6).replace(/0+$/,'').replace(/\.$/,''); if(v<1) return (Math.round(v*1000000)/1000000).toString(); return (Math.round(v*1000)/1000).toString(); })()+' $WASA'; ['modalCoins','headerCoins','profileCoins'].forEach(id=>{const el=document.getElementById(id); if(el) el.textContent=f;}); }
function getCoins(){ const main=parseFloat(localStorage.getItem('wasa_coins')||'0'); if(!getStoredEmail()&&!getStoredWallet()){ const guest=parseFloat(localStorage.getItem('wasa_coins_guest')||'0'); return main+guest; } return main; }
function setCoins(n){ const email=getStoredEmail(); const wallet=getStoredWallet(); if(!email&&!wallet){ setCoinsUI(n); return; } const old=parseFloat(localStorage.getItem('wasa_coins')||'0'); if(Math.abs(n-old)>0.1){ setCoinsUI(old); return; } localStorage.setItem('wasa_coins',n); setCoinsUI(n); }
function addCoins(n){ if(n>0.1) return; const cur=getCoins(); setCoins(cur+n); }
function showAuthStatus(msg,cls,isReg){ const id=isReg?'authStatusReg':'authStatus'; const el=document.getElementById(id); if(!el) return; el.textContent=msg; el.className='status-box '+cls; el.style.display='block'; }
async function doLogin(){ const email=document.getElementById('authEmail')?.value.trim().toLowerCase()||''; const pass=document.getElementById('authPass')?.value||''; if(!email.includes('@')) return showAuthStatus('Email inválido','status-err',false); try{ const r=await fetch(WASA_CONFIG.WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login',email,password:pass,device_id:getDeviceId()})}); const j=await r.json(); if(!j.ok) throw new Error(j.error); localStorage.setItem('wasa_email',j.email||email); if(j.nickname) localStorage.setItem('wasa_nick',j.nickname); updateWalletUI(); showAuthStatus('✅ Login OK','status-ok',false); setTimeout(()=>{ closeAuthEmail(); syncBalanceFromD1(); },700); }catch(e){ showAuthStatus('❌ '+e.message,'status-err',false); } }
async function doRegister(){ const email=document.getElementById('authEmailReg')?.value.trim().toLowerCase()||''; const pass=document.getElementById('authPassReg')?.value||''; const nick=document.getElementById('authNickReg')?.value.trim()||''; const statusEl=document.getElementById('authStatusReg'); if(!email.includes('@')) return; if(statusEl){ statusEl.textContent='⏳ Creando cuenta...'; statusEl.className='status-box status-info'; statusEl.style.display='block'; } try{ const r=await fetch(WASA_CONFIG.WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'register',email,password:pass,nickname:nick,device_id:getDeviceId()})}); const j=await r.json(); if(!j.ok) throw new Error(j.error); pendingVerifyEmail=email; localStorage.setItem('wasa_email_pending',email); if(statusEl){ statusEl.textContent='✅ Revisa tu email'; statusEl.className='status-box status-ok'; } setTimeout(()=>{ closeAuthEmail(); openVerifyModal(email); },600); }catch(e){ if(statusEl){ statusEl.textContent='❌ '+(e.message||'Error'); statusEl.className='status-box status-err'; } } }
function openForgot(){ const box=document.getElementById('forgotBox'); if(box) box.classList.add('open'); }
function closeForgot(){ const box=document.getElementById('forgotBox'); if(box) box.classList.remove('open'); const lf=document.getElementById('loginForm'); if(lf) lf.style.display='block'; }
async function requestPasswordReset(){ const email=document.getElementById('forgotEmail')?.value.trim().toLowerCase()||''; const el=document.getElementById('forgotStatus'); try{ const r=await fetch(WASA_CONFIG.WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'requestpasswordreset',email})}); const j=await r.json(); if(!j.ok) throw new Error(j.error); if(el){ el.textContent='✅ Código enviado'; el.className='status-box status-ok'; el.style.display='block'; } document.getElementById('forgotStep1').style.display='none'; document.getElementById('forgotStep2').style.display='block'; }catch(e){ if(el){ el.textContent='❌ '+e.message; el.className='status-box status-err'; el.style.display='block'; } } }
async function verifyPasswordReset(){ const email=document.getElementById('forgotEmail')?.value.trim().toLowerCase()||''; const code=document.getElementById('forgotCode')?.value.trim()||''; const pass=document.getElementById('forgotNewPass')?.value||''; try{ const r=await fetch(WASA_CONFIG.WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'verifypasswordreset',email,code,newPassword:pass})}); const j=await r.json(); if(!j.ok) throw new Error(j.error); closeForgot(); openAuthEmail('login'); }catch(e){} }
// --- FIX REAL ---
async function connectWith(type){
  const info=document.getElementById('walletConnectedInfo');
  const showInfo=(m,c)=>{ if(info){ info.textContent=m; info.className='status-box '+c; info.style.display='block'; } };
  try{
    if(!window.ethereum){
      showInfo('❌ No detecto billetera. Instalá MetaMask / usa el navegador de la wallet','status-err');
      window.open('https://metamask.io/download/','_blank');
      return;
    }
    showInfo('⏳ Conectando...','status-info');
    const accs=await window.ethereum.request({method:'eth_requestAccounts'});
    const wallet=accs[0];
    if(!wallet) throw new Error('No wallet returned');
    localStorage.setItem('wasa_wallet',wallet.toLowerCase());
    updateWalletUI();
    const email=getStoredEmail();
    if(email){ await fetch(WASA_CONFIG.WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'link_wallet',email,wallet})}); }
    closeWalletChooser();
    showInfo('✅ Conectado: '+wallet,'status-ok');
    setTimeout(()=>openWasaBuy(),300);
  }catch(e){
    console.error('connectWith fail',e);
    showInfo('❌ '+(e.message||'Cancelado o rechazado por el usuario'),'status-err');
  }
}
async function buyWasa(wasaAmount){ const usdt=WASA_CONFIG.PRICES[wasaAmount]; const el=document.getElementById('buyStatus'); if(el){ el.textContent='⏳ Pago '+usdt+' USDT -> '+wasaAmount+' WASA...'; el.className='status-box status-info'; el.style.display='block'; } }
function openVerifyModal(email){ const m=document.getElementById('verifyEmailModal'); if(!m) return; const lbl=document.getElementById('verifyEmailLabel'); if(lbl) lbl.textContent=email||pendingVerifyEmail||'tu email'; m.classList.add('open'); pendingVerifyEmail=email||pendingVerifyEmail; }
function closeVerifyModal(){ document.getElementById('verifyEmailModal')?.classList.remove('open'); }
async function doVerifyEmail(){ const code=document.getElementById('verifyCodeInput')?.value.trim()||''; const statusEl=document.getElementById('verifyStatus'); const email=pendingVerifyEmail||localStorage.getItem('wasa_email_pending')||getStoredEmail(); if(code.length!==6){ if(statusEl){ statusEl.textContent='❌ Código 6 dígitos'; statusEl.className='status-box status-err'; statusEl.style.display='block'; } return; } try{ const r=await fetch(WASA_CONFIG.WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'verify_email',email,code,device_id:getDeviceId()})}); const j=await r.json(); if(!j.ok) throw new Error(j.error); localStorage.setItem('wasa_email',email); localStorage.removeItem('wasa_email_pending'); if(j.nickname) localStorage.setItem('wasa_nick',j.nickname); localStorage.setItem('wasa_coins',j.wasa_balance||0); localStorage.removeItem('wasa_coins_guest'); setCoinsUI(j.wasa_balance||0); updateWalletUI(); if(statusEl){ statusEl.textContent='✅ Verificado!'; statusEl.className='status-box status-ok'; statusEl.style.display='block'; } setTimeout(()=>{ closeVerifyModal(); openUserProfile(); },800); }catch(e){ if(statusEl){ statusEl.textContent='❌ '+e.message; statusEl.className='status-box status-err'; statusEl.style.display='block'; } } }
async function resendVerifyCode(){ const email=pendingVerifyEmail||localStorage.getItem('wasa_email_pending'); if(!email) return; try{ const r=await fetch(WASA_CONFIG.WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'resend_code',email,device_id:getDeviceId()})}); const j=await r.json(); if(!j.ok) throw new Error(j.error); }catch(e){} }
document.addEventListener('click',(e)=>{ const menu=document.getElementById('userDropdown'); const btn=document.getElementById('userBtn'); if(!menu||!btn) return; if(userMenuOpen&&!menu.contains(e.target)&&!btn.contains(e.target)){ closeUserMenu(); } });
window.addEventListener('DOMContentLoaded',async()=>{
  if(cleanStored(localStorage.getItem('wasa_wallet'))===null) localStorage.removeItem('wasa_wallet');
  if(cleanStored(localStorage.getItem('wasa_email'))===null) localStorage.removeItem('wasa_email');
  if(cleanStored(localStorage.getItem('wasa_nick'))===null) localStorage.removeItem('wasa_nick');
  getDeviceId(); updateWalletUI(); setCoinsUI(getCoins()); await loadWasaConfig(); await syncBalanceFromD1();
  if(window.ethereum){ window.ethereum.request({method:'eth_accounts'}).then(a=>{ if(a[0]&&!getStoredWallet()){ localStorage.setItem('wasa_wallet',a[0].toLowerCase()); updateWalletUI(); syncBalanceFromD1(); } }).catch(()=>{}); window.ethereum.on&&window.ethereum.on('accountsChanged',(accs)=>{ if(accs&&accs[0]){ localStorage.setItem('wasa_wallet',accs[0].toLowerCase()); updateWalletUI(); } }); }
});
window.WASA_CONFIG=WASA_CONFIG;window.getDeviceId=getDeviceId;window.handleUserBtn=handleUserBtn;window.openUserMenu=openUserMenu;window.closeUserMenu=closeUserMenu;window.openUserProfile=openUserProfile;window.closeUserProfile=closeUserProfile;window.saveProfile=saveProfile;window.logoutUser=logoutUser;window.loadWasaConfig=loadWasaConfig;window.updateWalletUI=updateWalletUI;window.handleWalletBtn=handleWalletBtn;window.openWalletChooser=openWalletChooser;window.closeWalletChooser=closeWalletChooser;window.openWasaBuy=openWasaBuy;window.closeWasaBuy=closeWasaBuy;window.openAuthEmail=openAuthEmail;window.closeAuthEmail=closeAuthEmail;window.switchAuthTab=switchAuthTab;window.doLogin=doLogin;window.doRegister=doRegister;window.openForgot=openForgot;window.closeForgot=closeForgot;window.requestPasswordReset=requestPasswordReset;window.verifyPasswordReset=verifyPasswordReset;window.connectWith=connectWith;window.buyWasa=buyWasa;window.setCoinsUI=setCoinsUI;window.getCoins=getCoins;window.setCoins=setCoins;window.addCoins=addCoins;window.openVerifyModal=openVerifyModal;window.closeVerifyModal=closeVerifyModal;window.doVerifyEmail=doVerifyEmail;window.resendVerifyCode=resendVerifyCode;
