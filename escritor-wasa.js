// escritor-wasapass.js - FINAL PARA GITHUB PAGES - LAYOUT NUEVO
// Layout: apodo abajo izq, QR cuadrado abajo der, 2026 ya en base
// Base en raiz: /wasa-pass.png o /xc32487hfd.klf (bytes PNG con ext inventada)

const WORKER_URL='https://games-wasa-worker.javimsites.workers.dev/';
const BASE_IMG_URL='./xc32487hfd.klf'; // o './wasa-pass.png' - funciona igual por blob
const SECRET='wasa_2026_f0und3rs_9k2j4l8x';

function genId10(){
  const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const a=new Uint8Array(10); crypto.getRandomValues(a);
  let id=''; for(let i=0;i<10;i++) id+=chars[a[i]%62]; return id;
}

async function loadImageObfuscated(url){
  const resp=await fetch(url+'?v='+Date.now());
  const blob=await resp.blob();
  const objUrl=URL.createObjectURL(blob);
  const img=await new Promise((res,rej)=>{
    const im=new Image(); im.crossOrigin='anonymous';
    im.onload=()=>{ URL.revokeObjectURL(objUrl); res(im); };
    im.onerror=rej; im.src=objUrl;
  });
  return img;
}

export async function crearWasaPassFinal({codeId, apodo, email, tx_hash, multiplier=5}){
  if(!codeId) codeId=genId10();

  const W=1024, H=1560;
  const canvas=document.createElement('canvas'); canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext('2d');

  const base=await loadImageObfuscated(BASE_IMG_URL);
  ctx.drawImage(base,0,0,W,H);

  // 1. APODO en rectangulo inferior izq (coordenadas del nuevo layout image_f217b2.png)
  const nickRect={x:Math.floor(W*0.12), y:Math.floor(H*0.852), w:Math.floor(W*0.62), h:Math.floor(H*0.088)};
  ctx.fillStyle='#FFFFFF';
  ctx.fillRect(nickRect.x+4, nickRect.y+4, nickRect.w-8, nickRect.h-8);
  ctx.fillStyle='#0A2A3A';
  ctx.font=`bold ${Math.floor(nickRect.h*0.42)}px monospace`;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText((apodo||'PLAYER').toUpperCase().slice(0,12), nickRect.x+nickRect.w/2, nickRect.y+nickRect.h/2+2);

  // 2. QR CUADRADO abajo der - compatible 100% (no rMQR)
  const qrValue=`https://games.wasa.chat/pass?id=${codeId}`; // 38 chars
  const qrSize= Math.floor(H*0.095);
  const qrRect={x:Math.floor(W*0.79), y:Math.floor(H*0.846), w:qrSize, h:qrSize};
  const qrUrl=`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrValue)}&color=000000&bgcolor=FFFFFF&margin=1&format=png`;
  const qrImg=await new Promise((res,rej)=>{const im=new Image(); im.crossOrigin='anonymous'; im.onload=()=>res(im); im.onerror=rej; im.src=qrUrl;});
  // fondo blanco detras del QR para lectura perfecta
  ctx.fillStyle='#FFFFFF'; ctx.fillRect(qrRect.x-2, qrRect.y-2, qrRect.w+4, qrRect.h+4);
  ctx.drawImage(qrImg, qrRect.x, qrRect.y, qrRect.w, qrRect.h);

  // 3. 2026 ya viene en base, no hace falta dibujarlo, pero si queres reforzarlo:
  // ctx.fillStyle='#C9A86A'; ctx.font='12px monospace'; ctx.fillText('2026', W*0.48, H*0.97);

  const dataUrl=canvas.toDataURL('image/png'); const b64=dataUrl.split(',')[1];
  const body={action:'sendeditedimage',email:(email||'').toLowerCase(),codeId,slots:1,slotNum:1,nombre:apodo||codeId,apodo:apodo||codeId,tx_hash:tx_hash||'',percent:0,image_b64:b64,image_filename:`${codeId}-WASA-PASS-X${multiplier}.png`,multiplier};
  const resp=await fetch(WORKER_URL,{method:'POST',headers:{'Content-Type':'text/plain','X-WASA-KEY':SECRET},body:JSON.stringify(body)});
  const j=await resp.json().catch(()=>({})); if(!j.ok) throw new Error(JSON.stringify(j));
  return {ok:true, codeId, apodo, dataUrl, passUrl:qrValue};
}
