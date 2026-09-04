function getStoredWallet(){
  const v = localStorage.getItem('wasa_wallet');
  if(!v || v==="undefined" || v==="null" || v==="" || v.length<10) return null;
  return v;
}
function getStoredEmail(){
  const v = localStorage.getItem('wasa_email');
  if(!v || v==="undefined" || v==="null" || v==="" ||!v.includes('@')) return null;
  return v;
}
function getStoredNick(){
  const v = localStorage.getItem('wasa_nick');
  if(!v || v==="undefined" || v==="null") return null;
  return v;
}
function isLogged(){
  return!!(getStoredWallet() || getStoredEmail());
}

function openUserProfile(){
  const modal=document.getElementById('userProfileModal'); if(!modal) return;
  const isLog = isLogged();
  const email = getStoredEmail();
  const wallet = getStoredWallet();

  document.getElementById('profileEmail').textContent = email || 'No logeado';
  // FIX undefined...undefined
  document.getElementById('profileWallet').textContent = wallet? wallet.slice(0,10)+'...'+wallet.slice(-6) : 'No conectada';
  document.getElementById('profileCoins').textContent = (localStorage.getItem('wasa_coins')||'0')+' $WASA';
  document.getElementById('profileDisplayName').textContent = isLog? (getStoredNick() || email?.split('@')[0] || wallet?.slice(0,6) || 'Usuario') : 'Invitado';
  const nickInput=document.getElementById('profileNickname'); if(nickInput) nickInput.value = getStoredNick()||'';

  // FIX lógico: si no está logeado, no mostrar "Cerrar Sesión"
  const btnSave = modal.querySelector('.btn-wasa-primary');
  const btnLogout = modal.querySelector('.btn-wasa-secondary');
  if(!isLog){
    if(btnSave) btnSave.style.display='none';
    if(btnLogout){
      btnLogout.textContent='🔑 Iniciar Sesión';
      btnLogout.onclick = ()=>{ closeUserProfile(); openAuthEmail('login'); };
      btnLogout.style.display='block';
    }
  } else {
    if(btnSave){ btnSave.style.display='block'; btnSave.textContent='💾 Guardar apodo'; }
    if(btnLogout){ btnLogout.textContent='🚪 Cerrar Sesión'; btnLogout.onclick = logoutUser; btnLogout.style.display='block'; }
  }
  modal.classList.add('open');
}

function logoutUser(){
  closeUserMenu(); closeUserProfile();
  localStorage.removeItem('wasa_wallet');
  localStorage.removeItem('wasa_email');
  localStorage.removeItem('wasa_nick');
  localStorage.removeItem('wasa_wallets');
  localStorage.removeItem('wasa_email_pending');
  localStorage.removeItem('wasa_wallet_pending');
  localStorage.setItem('wasa_coins','0');
  if(typeof setCoinsUI==='function') setCoinsUI(0);
  updateWalletUI();
  // forzar estado invitado
  const btn = document.getElementById('userBtn');
  if(btn){ btn.textContent='👤'; btn.className='user-btn disconnected'; }
}
