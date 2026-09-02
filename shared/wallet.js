// shared/wallet.js - por ahora mock, después lo conectamos a pay.wasa.chat
export async function getCoins() {
  return parseInt(localStorage.getItem('wasa_coins') || '0');
}
export async function addCoins(n) {
  const c = await getCoins();
  localStorage.setItem('wasa_coins', c + n);
}
