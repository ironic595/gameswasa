// wasa-conection.js v8 - verificación email + guest merge + multiwallet
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
    }
  }catch(e){ console.warn('D1 no responde', e); }
}
function getStoredWallet(){ return localStorage.getItem('wasa_wallet'); }
function getStoredEmail(){ return localStorage.getItem('wasa_email'); }
function getStoredNick(){ return localStorage.getItem('wasa_nick'); }
function getGuestCoins(){ return parseFloat(localStorage.getItem('wasa_coins_guest')||'0'); }
function getCoinsRaw(){ return parseFloat(localStorage.getItem('wasa_coins')||'0'); }
function isLogged(){ return !!(getStoredWallet() || getStoredEmail()); }

function updateWalletUI(){
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
      if(info){
        let txt = '✅ Conectado: '+connectedWallet;
        if(linkedWallets.length>1) txt += ' (+'+(linkedWallets.length-1)+' más)';
        info.style.display='block'; info.textContent=txt;
      }
    }else{
      btn.textContent='Connect Wallet';
      btn.classList.remove('connected');
      if(info) info.style.display='none';
    }
  }
  if(userBtn){
    if(isLogged()){
      const name = connectedNickname || connectedEmail?.split('@')[0] || connectedWallet?.slice(0,6) || 'U';
      userBtn.textContent = name.slice(0,2).toUpperCase();
      userBtn.className = 'user-btn connected';
      userBtn.title = connectedNickname || connectedEmail || connectedWallet || 'Mi perfil';
    }else{
      userBtn.textContent = '👤';
      userBtn.className = 'user-btn disconnected';
      userBtn.title = 'Iniciar sesión';
    }
  }
  if(!isLogged()) closeUserMenu();
}

async function syncBalanceFromD1(){
  const email = getStoredEmail();
  const wallet = getStoredWallet();
  if(!email && !wallet) return;
  try{
    const r = await fetch(WASA_CONFIG.WORKER_URL, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({action:'get_balance', email, wallet})});
    const j = await r.json();
    if(j.ok && typeof j.wasa_balance !== 'undefined'){
      const bal = parseFloat(j.wasa_balance)||0;
      localStorage.setItem('wasa_coins', bal);
      if(typeof setCoinsUI === 'function') setCoinsUI(bal);
      if(j.wallets && j.wallets.length>0){
        localStorage.setItem('wasa_wallets', JSON.stringify(j.wallets));
        linkedWallets = j.wallets;
        if(!wallet){
          const primary = j.wallets.find(w=>w.is_primary) || j.wallets[0];
          if(primary?.wallet_address && !primary.wallet_address.startsWith('email:')){
            localStorage.setItem('wasa_wallet', primary.wallet_address);
          }
        }
      } else if(j.wallet && !j.wallet.startsWith('email:')){
        if(!wallet) localStorage.setItem('wasa_wallet', j.wallet);
        localStorage.setItem('wasa_wallets', JSON.stringify([{wallet_address:j.wallet,is_primary:1}]));
      }
      if(j.nickname && !getStoredNick()){
        localStorage.setItem('wasa_nick', j.nickname);
      }
      updateWalletUI();
      console.log('[WASA] sync balance', bal);
    }
  }catch(e){ console.warn('sync balance fail', e); }
}

async function saveCoinsToD1(delta){
  const email = getStoredEmail();
  const wallet = getStoredWallet();
  if(!email && !wallet){
    // guest mode: guardar como guest separado
    const guest = getGuestCoins() + delta;
    localStorage.setItem('wasa_coins_guest', guest);
    return;
  }
  try{
    await fetch(WASA_CONFIG.WORKER_URL, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({action:'add_coins', email, wallet: email? null : wallet, amount: delta})});
  }catch(e){}
}

async function claimGuestCoins(){
  const guest = getGuestCoins();
  const email = getStoredEmail();
  if(guest<=0 || !email) return;
  try{
    const r = await fetch(WASA_CONFIG.WORKER_URL, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({action:'claim_guest_coins', email, guest_amount: guest, wallet: getStoredWallet()})});
    const j = await r.json();
    if(j.ok){
      console.log('[WASA] guest claimed', j.claimed, 'new balance', j.wasa_balance);
      localStorage.setItem('wasa_coins', j.wasa_balance);
      localStorage.removeItem('wasa_coins_guest');
      setCoinsUI(j.wasa_balance);
      const infoEl = document.getElementById('profileCoins');
      if(infoEl) infoEl.textContent = j.wasa_balance + ' $WASA (incluye '+guest+' de invitado)';
    }
  }catch(e){ console.warn('claim guest fail', e); }
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
function showAuthStatus(msg,cls,isReg){
  const id = isReg? 'authStatusReg' : 'authStatus';
  const el=document.getElementById(id); if(!el) return;
  el.textContent=msg; el.className='status-box '+cls; el.style.display='block';
}

// VERIFICACION EMAIL
function openVerifyModal(email){
  pendingVerifyEmail = email || getStoredEmail() || document.getElementById('authEmailReg')?.value || document.getElementById('authEmail')?.value;
  const modal = document.getElementById('verifyEmailModal');
  if(!modal) return;
  document.getElementById('verifyEmailLabel').textContent = pendingVerifyEmail;
  document.getElementById('verifyCodeInput').value = '';
  document.getElementById('verifyStatus').style.display='none';
  modal.classList.add('open');
  closeAuthEmail();
}
function closeVerifyModal(){ document.getElementById('verifyEmailModal')?.classList.remove('open'); }

async function doVerifyEmail(){
  const code = document.getElementById('verifyCodeInput')?.value.trim()||'';
  const el = document.getElementById('verifyStatus');
  const show = (m,c)=>{ if(el){ el.textContent=m; el.className='status-box '+c; el.style.display='block'; } };
  if(code.length!==6) return show('Código de 6 dígitos','status-err');
  if(!pendingVerifyEmail) return show('Falta email','status-err');
  show('⏳ Verificando...','status-info');
  try{
    const r = await fetch(WASA_CONFIG.WORKER_URL, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({action:'verify_email', email: pendingVerifyEmail, code})});
    const j = await r.json();
    if(!j.ok) throw new Error(j.error);
    localStorage.setItem('wasa_email', j.email);
    if(j.nickname) localStorage.setItem('wasa_nick', j.nickname);
    if(j.wasa_balance!==undefined) localStorage.setItem('wasa_coins', j.wasa_balance);
    if(j.wallet) localStorage.setItem('wasa_wallet', j.wallet);
    updateWalletUI();
    setCoinsUI(j.wasa_balance||0);
    show('✅ Cuenta verificada! Entrando...','status-ok');
    // si habia guest coins, reclamar
    setTimeout(async()=>{
      closeVerifyModal();
      await claimGuestCoins();
      await syncBalanceFromD1();
    }, 800);
  }catch(e){ show('❌ '+e.message,'status-err'); }
}

async function resendVerifyCode(){
  const el = document.getElementById('verifyStatus');
  const show = (m,c)=>{ if(el){ el.textContent=m; el.className='status-box '+c; el.style.display='block'; } };
  if(!pendingVerifyEmail) return show('Falta email','status-err');
  show('⏳ Reenviando...','status-info');
  try{
    const r = await fetch(WASA_CONFIG.WORKER_URL, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({action:'resend_verification', email: pendingVerifyEmail})});
    const j = await r.json();
    if(!j.ok) throw new Error(j.error);
    show('✅ Código reenviado a '+pendingVerifyEmail,'status-ok');
  }catch(e){ show('❌ '+e.message,'status-err'); }
}

async function doLogin(){
  const email=document.getElementById('authEmail')?.value.trim().toLowerCase()||'';
  const pass=document.getElementById('authPass')?.value||'';
  if(!email.includes('@')) return showAuthStatus('Email inválido','status-err');
  if(pass.length<6) return showAuthStatus('Mín 6 caracteres','status-err');
  showAuthStatus('⏳ Entrando...','status-info');
  try{
    const r=await fetch(WASA_CONFIG.WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login',email,password:pass})});
    const j=await r.json();
    if(!j.ok){
      if(j.need_verification){
        pendingVerifyEmail = email;
        showAuthStatus('⚠️ No verificado, te enviamos código','status-info');
        setTimeout(()=>openVerifyModal(email), 800);
        return;
      }
      throw new Error(j.error);
    }
    localStorage.setItem('wasa_email', j.email);
    if(j.nickname) localStorage.setItem('wasa_nick', j.nickname);
    if(j.wasa_balance!==undefined) localStorage.setItem('wasa_coins', j.wasa_balance);
    if(j.wallets && j.wallets.length>0){
      localStorage.setItem('wasa_wallets', JSON.stringify(j.wallets));
      if(!getStoredWallet()){
        const primary = j.wallets.find(w=>w.is_primary) || j.wallets[0];
        if(primary?.wallet_address) localStorage.setItem('wasa_wallet', primary.wallet_address);
      }
    } else if(j.wallet && !getStoredWallet()){
      localStorage.setItem('wasa_wallet', j.wallet);
    }
    updateWalletUI();
    setCoinsUI(j.wasa_balance||0);
    showAuthStatus('✅ Login OK: '+(j.wasa_balance||0)+' WASA','status-ok');
    // guest merge
    const guest = getGuestCoins();
    if(guest>0){
      showAuthStatus(`✅ Login OK + ${guest} WASA de invitado se sumarán...`,'status-ok');
    }
    setTimeout(async()=>{
      closeAuthEmail();
      if(guest>0) await claimGuestCoins();
      await syncBalanceFromD1();
    },600);
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
    if(j.need_verification){
      pendingVerifyEmail = j.email;
      localStorage.setItem('wasa_email_pending', j.email);
      if(nick) localStorage.setItem('wasa_nick', nick);
      showAuthStatus('✅ Cuenta creada, revisá tu email para verificar','status-ok',true);
      setTimeout(()=>openVerifyModal(j.email), 1000);
      return;
    }
    localStorage.setItem('wasa_email', j.email);
    if(nick) localStorage.setItem('wasa_nick', nick);
    localStorage.setItem('wasa_coins', j.wasa_balance||0);
    updateWalletUI();
    setCoinsUI(0);
    showAuthStatus('✅ Cuenta creada','status-ok',true);
    setTimeout(()=>{ closeAuthEmail(); },800);
  }catch(e){ showAuthStatus('❌ '+e.message,'status-err',true); }
}
function openForgot(){ document.getElementById('forgotBox')?.classList.add('open'); document.getElementById('loginForm').style.display='none'; document.getElementById('forgotStep1').style.display='block'; document.getElementById('forgotStep2').style.display='none'; }
function closeForgot(){ document.getElementById('forgotBox')?.classList.remove('open'); document.getElementById('loginForm').style.display='block'; }
async function requestPasswordReset(){
  const email=document.getElementById('forgotEmail')?.value.trim().toLowerCase()||''; const el=document.getElementById('forgotStatus');
  const show=(m,c)=>{ if(el){ el.textContent=m; el.className='status-box '+c; el.style.display='block'; } };
  if(!email.includes('@')) return show('Email inválido','status-err');
  show('⏳ Enviando...','status-info');
  try{ const r=await fetch(WASA_CONFIG.WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'requestpasswordreset',email})}); const j=await r.json(); show(j.msg||'Código enviado','status-ok'); document.getElementById('forgotStep1').style.display='none'; document.getElementById('forgotStep2').style.display='block'; }catch(e){ show('❌ '+e.message,'status-err'); }
}
async function verifyPasswordReset(){
  const email=document.getElementById('forgotEmail')?.value.trim().toLowerCase()||''; const code=document.getElementById('forgotCode')?.value.trim()||''; const newPass=document.getElementById('forgotNewPass')?.value||''; const el=document.getElementById('forgotStatus');
  const show=(m,c)=>{ if(el){ el.textContent=m; el.className='status-box '+c; el.style.display='block'; } };
  if(code.length!==6) return show('Código 6 dígitos','status-err'); if(newPass.length<6) return show('Mín 6','status-err');
  show('⏳ Verificando...','status-info');
  try{ const r=await fetch(WASA_CONFIG.WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'verifypasswordreset',email,code,newPassword:newPass})}); const j=await r.json(); if(!j.ok) throw new Error(j.error); show('✅ Contraseña cambiada','status-ok'); setTimeout(()=>{ closeForgot(); switchAuthTab('login'); },1000); }catch(e){ show('❌ '+e.message,'status-err'); }
}
async function connectWith(type){
  const isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent); const currentUrl=window.location.href; const domain=currentUrl.replace('https://','').replace('http://','').split('/')[0]; const path=window.location.pathname;
  try{
    if(window.ethereum){
      const accs=await window.ethereum.request({method:'eth_requestAccounts'});
      const newWallet = accs[0].toLowerCase();
      localStorage.setItem('wasa_wallet', accs[0]);
      const email = getStoredEmail();
      if(email){
        try{
          await fetch(WASA_CONFIG.WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'link_wallet',email,wallet:accs[0]})});
          let wallets = [];
          try{ wallets = JSON.parse(localStorage.getItem('wasa_wallets')||'[]'); }catch{}
          if(!wallets.find(w=>w.wallet_address?.toLowerCase()===newWallet)){
            wallets.push({wallet_address:newWallet,is_primary:1});
          }
          localStorage.setItem('wasa_wallets', JSON.stringify(wallets));
        }catch(e){}
      }
      updateWalletUI(); closeWalletChooser(); openWasaBuy(); syncBalanceFromD1(); return;
    }
    if(isMobile){
      if(type==='metamask'){ window.location.href=`https://metamask.app.link/dapp/${domain}${path}`; return; }
      if(type==='trust'){ window.location.href=`https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(currentUrl)}`; return; }
    }
    const downloads={ metamask:'https://metamask.io/download/', trust:'https://trustwallet.com/download', rabby:'https://rabby.io/', okx:'https://www.okx.com/download' };
    window.open(downloads[type]||downloads.metamask,'_blank');
  }catch(e){ alert('Error: '+e.message); }
}
function parseUSDTtoWei(a){ const [w,f='']=String(a).split('.'); return BigInt(w+(f+'000000000000000000').slice(0,18)); }
async function buyWasa(amt){
  const usdt=WASA_CONFIG.PRICES[amt]; const statusEl=document.getElementById('buyStatus');
  const show=(m,c)=>{ if(statusEl){ statusEl.textContent=m; statusEl.className='status-box '+c; statusEl.style.display='block'; } };
  if(!WASA_CONFIG._loaded){ show('⏳ Cargando config...','status-info'); await loadWasaConfig(); }
  if(!getStoredWallet()){ show('⚠ Conectá billetera','status-info'); openWalletChooser(); return; }
  if(!WASA_CONFIG.RECEIVER){ show('⚠ Worker caído','status-err'); return; }
  try{
    show('⏳ Pago '+usdt+' USDT -> '+amt+' WASA...','status-info');
    const toPadded=WASA_CONFIG.RECEIVER.toLowerCase().replace('0x','').padStart(64,'0');
    const amountHex=parseUSDTtoWei(String(usdt)).toString(16).padStart(64,'0');
    const data='0xa9059cbb'+toPadded+amountHex;
    const txHash=await window.ethereum.request({method:'eth_sendTransaction',params:[{from:getStoredWallet(),to:WASA_CONFIG.USDT_CONTRACT,data}]});
    show('⏳ Tx '+txHash.slice(0,18)+'... esperando','status-info');
    let receipt=null; for(let i=0;i<60;i++){ try{ receipt=await window.ethereum.request({method:'eth_getTransactionReceipt',params:[txHash]}); if(receipt) break; }catch{} await new Promise(r=>setTimeout(r,1000)); }
    if(receipt && (receipt.status==='0x0'||receipt.status===0)) throw new Error('Tx fallida');
    show('✅ Confirmado! Guardando...','status-ok');
    try{ await fetch(WASA_CONFIG.WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'buy_wasa',wallet:getStoredWallet(),nickname:getStoredNick()||'',email:getStoredEmail()||'',wasa_amount:amt,usdt_amount:usdt,network:'BSC',tx_hash:txHash})}); }catch(e){}
    const cur=parseFloat(localStorage.getItem('wasa_coins')||'0'); localStorage.setItem('wasa_coins',cur+amt); if(typeof setCoinsUI==='function') setCoinsUI(cur+amt); updateWalletUI(); show('🎉 ¡Compraste '+amt+' WASA!','status-ok');
    syncBalanceFromD1();
  }catch(e){ show('❌ '+e.message,'status-err'); }
}
function handleUserBtn(){
  if(!isLogged()){ openAuthEmail('login'); return; }
  if(userMenuOpen){ closeUserMenu(); }else{ openUserMenu(); }
}
function openUserMenu(){ document.getElementById('userDropdown')?.classList.add('open'); userMenuOpen=true; }
function closeUserMenu(){ document.getElementById('userDropdown')?.classList.remove('open'); userMenuOpen=false; }
function openUserProfile(){
  closeUserMenu();
  const modal=document.getElementById('userProfileModal'); if(!modal) return;
  document.getElementById('profileEmail').textContent = getStoredEmail() || 'No logeado';
  const wallets = JSON.parse(localStorage.getItem('wasa_wallets')||'[]');
  let walletText = getStoredWallet() ? getStoredWallet().slice(0,10)+'...'+getStoredWallet().slice(-6) : 'No conectada';
  if(wallets.length>1) walletText += ' (+'+(wallets.length-1)+' más)';
  document.getElementById('profileWallet').textContent = walletText;
  document.getElementById('profileCoins').textContent = (localStorage.getItem('wasa_coins')||'0') + ' $WASA';
  if(getGuestCoins()>0) document.getElementById('profileCoins').textContent += ' + '+getGuestCoins()+' guest';
  document.getElementById('profileDisplayName').textContent = getStoredNick() || getStoredEmail()?.split('@')[0] || (getStoredWallet()? getStoredWallet().slice(0,6)+'...' : 'Invitado');
  document.getElementById('profileNickname').value = getStoredNick() || '';
  const listEl = document.getElementById('profileWalletsList');
  if(listEl){
    if(wallets.length>0){
      listEl.innerHTML = wallets.map(w=>`<div style="font-size:10px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05);display:flex;justify-content:space-between"><span>${w.wallet_address.slice(0,6)}...${w.wallet_address.slice(-4)}</span><span style="color:${w.is_primary?'#fbbf24':'#64748b'}">${w.is_primary?'● primaria':''}</span></div>`).join('');
    } else {
      listEl.innerHTML = '<div style="font-size:10px;color:#64748b">No hay wallets linkeadas</div>';
    }
  }
  modal.classList.add('open');
}
function closeUserProfile(){ document.getElementById('userProfileModal')?.classList.remove('open'); }
async function saveProfile(){
  const nick=document.getElementById('profileNickname')?.value.trim()||''; const el=document.getElementById('profileStatus');
  const show=(m,c)=>{ if(el){ el.textContent=m; el.className='status-box '+c; el.style.display='block'; } };
  if(nick.length<2) return show('Mín 2 caracteres','status-err');
  localStorage.setItem('wasa_nick', nick);
  try{ await fetch(WASA_CONFIG.WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'update_profile',email:getStoredEmail(),nickname:nick,wallet:getStoredWallet()})}); }catch(e){}
  updateWalletUI(); document.getElementById('profileDisplayName').textContent=nick; show('✅ Guardado: '+nick,'status-ok');
}
function logoutUser(){
  closeUserMenu(); closeUserProfile();
  localStorage.removeItem('wasa_wallet'); localStorage.removeItem('wasa_email'); localStorage.removeItem('wasa_nick'); localStorage.removeItem('wasa_wallets');
  localStorage.setItem('wasa_coins','0');
  // no borrar guest coins al logout, por si quiere reclamar luego
  if(typeof setCoinsUI==='function') setCoinsUI(0);
  updateWalletUI();
}
document.addEventListener('click', (e)=>{
  const menu=document.getElementById('userDropdown'); const btn=document.getElementById('userBtn');
  if(!menu || !btn) return;
  if(userMenuOpen && !menu.contains(e.target) && !btn.contains(e.target)){ closeUserMenu(); }
});
function doAuthEmail(){ openAuthEmail('login'); }

function setCoinsUI(n){
  const f = (()=>{
    const v=parseFloat(n)||0;
    if(v===0) return '0';
    if(v<0.001) return v.toFixed(6).replace(/0+$/,'').replace(/\.$/,'');
    if(v<1) return (Math.round(v*1000000)/1000000).toString();
    return (Math.round(v*1000)/1000).toString();
  })() + ' $WASA';
  const mc=document.getElementById('modalCoins'); if(mc) mc.textContent=f;
  const hc=document.getElementById('headerCoins'); if(hc) hc.textContent=f;
  const pe=document.getElementById('profileCoins'); if(pe) pe.textContent=f;
}
function getCoins(){
  // si no esta logueado, el balance es guest + coins (para mostrar)
  const main = parseFloat(localStorage.getItem('wasa_coins')||'0');
  if(!getStoredEmail() && !getStoredWallet()){
    return main + getGuestCoins();
  }
  return main;
}
function setCoins(n){
  const email = getStoredEmail();
  const wallet = getStoredWallet();
  if(!email && !wallet){
    // guest mode
    const old = parseFloat(localStorage.getItem('wasa_coins')||'0') + getGuestCoins();
    const delta = n - old;
    if(delta>0){
      localStorage.setItem('wasa_coins_guest', getGuestCoins()+delta);
    } else {
      // si setea menos, ajustar guest
      const newGuest = Math.max(0, getGuestCoins()+delta);
      localStorage.setItem('wasa_coins_guest', newGuest);
    }
    localStorage.setItem('wasa_coins', '0');
    setCoinsUI(n);
    return;
  }
  const old = parseFloat(localStorage.getItem('wasa_coins')||'0');
  const delta = n - old;
  localStorage.setItem('wasa_coins', n);
  setCoinsUI(n);
  if(Math.abs(delta)>0.0000001) saveCoinsToD1(delta);
}
function addCoins(n){
  const cur = getCoins();
  setCoins(cur+n);
}

window.addEventListener('DOMContentLoaded', async()=>{
  updateWalletUI();
  setCoinsUI(getCoins());
  await loadWasaConfig();
  await syncBalanceFromD1();
  // si hay guest coins y se logueo despues, reclamar auto?
  if(getStoredEmail() && getGuestCoins()>0){
    console.log('[WASA] hay guest coins', getGuestCoins(), 'para reclamar');
  }
  if(window.ethereum){
    window.ethereum.request({method:'eth_accounts'}).then(a=>{ if(a[0] && !getStoredWallet()){ localStorage.setItem('wasa_wallet',a[0]); updateWalletUI(); syncBalanceFromD1(); } }).catch(()=>{});
    window.ethereum.on && window.ethereum.on('accountsChanged', (accs)=>{
      if(accs && accs[0]){
        localStorage.setItem('wasa_wallet', accs[0]);
        updateWalletUI();
        const email = getStoredEmail();
        if(email){
          fetch(WASA_CONFIG.WORKER_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'link_wallet',email,wallet:accs[0]})}).then(()=>syncBalanceFromD1());
        }
      }
    });
  }
});

window.WASA_CONFIG=WASA_CONFIG; window.handleUserBtn=handleUserBtn; window.openUserMenu=openUserMenu; window.closeUserMenu=closeUserMenu; window.openUserProfile=openUserProfile; window.closeUserProfile=closeUserProfile; window.saveProfile=saveProfile; window.logoutUser=logoutUser; window.loadWasaConfig=loadWasaConfig; window.updateWalletUI=updateWalletUI; window.handleWalletBtn=handleWalletBtn; window.openWalletChooser=openWalletChooser; window.closeWalletChooser=closeWalletChooser; window.openWasaBuy=openWasaBuy; window.closeWasaBuy=closeWasaBuy; window.openAuthEmail=openAuthEmail; window.closeAuthEmail=closeAuthEmail; window.switchAuthTab=switchAuthTab; window.doLogin=doLogin; window.doRegister=doRegister; window.openForgot=openForgot; window.closeForgot=closeForgot; window.requestPasswordReset=requestPasswordReset; window.verifyPasswordReset=verifyPasswordReset; window.connectWith=connectWith; window.buyWasa=buyWasa; window.doAuthEmail=doAuthEmail; window.syncBalanceFromD1=syncBalanceFromD1; window.setCoinsUI=setCoinsUI; window.getCoins=getCoins; window.setCoins=setCoins; window.addCoins=addCoins; window.openVerifyModal=openVerifyModal; window.closeVerifyModal=closeVerifyModal; window.doVerifyEmail=doVerifyEmail; window.resendVerifyCode=resendVerifyCode; window.claimGuestCoins=claimGuestCoins;
