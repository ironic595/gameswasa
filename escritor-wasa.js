// escritor-wasapass.js - FINAL PARA GITHUB PAGES - v10 FIX
// Layout NUEVO: apodo abajo izq 12% x 85.2% w62% h8.8% - QR cuadrado abajo der 79% x 84.6% 9.5%
// Base: /xc32487hfd.klf (PNG con ext inventada para ofuscar)

const WORKER_URL='https://games-wasa-worker.javimsites.workers.dev/';
const BASE_IMG_URL='./xc32487hfd.klf';
const SECRET='wasa_2026_f0und3rs_9k2j4l8x';

function genId10(){
  const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const a=new Uint8Array(10); crypto.getRandomValues(a);
  let id=''; for(let i=0;i<10;i++) id+=chars[a[i]%62]; return id;
}

async function loadImageObfuscated(url){
  try{
    const resp=await fetch(url+'?v='+Date.now(), {cache:'no-store'});
    if(!resp.ok) throw new Error('base not found');
    const blob=await resp.blob();
    const objUrl=URL.createObjectURL(blob);
    const img=await new Promise((res,rej)=>{
      const im=new Image(); im.crossOrigin='anonymous';
      im.onload=()=>{ URL.revokeObjectURL(objUrl); res(im); };
      im.onerror=(e)=>{ URL.revokeObjectURL(objUrl); rej(e); };
      im.src=objUrl;
    });
    return img;
  }catch(e){
    // fallback a wasa-pass.png
    const resp2=await fetch('./wasa-pass.png?v='+Date.now());
    const blob2=await resp2.blob();
    const objUrl2=URL.createObjectURL(blob2);
    return await new Promise((res,rej)=>{
      const im=new Image(); im.crossOrigin='anonymous';
      im.onload=()=>{ URL.revokeObjectURL(objUrl2); res(im); };
      im.onerror=rej; im.src=objUrl2;
    });
  }
}

export async function crearWasaPassFinal({codeId, apodo, email, tx_hash, multiplier=5}){
  if(!codeId) codeId=genId10();
  const cleanApodo = (apodo||'PLAYER').toUpperCase().replace(/[^A-Z0-9_]/g,'').slice(0,12);
  
  const W=1024, H=1560;
  const canvas=document.createElement('canvas'); canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext('2d');

  const base=await loadImageObfuscated(BASE_IMG_URL);
  ctx.drawImage(base,0,0,W,H);

  // 1. APODO - rectangulo inferior izq (nuevo layout)
  const nickRect={x:Math.floor(W*0.12), y:Math.floor(H*0.852), w:Math.floor(W*0.62), h:Math.floor(H*0.088)};
  ctx.fillStyle='#FFFFFF';
  ctx.fillRect(nickRect.x+4, nickRect.y+4, nickRect.w-8, nickRect.h-8);
  // borde sutil
  ctx.strokeStyle='rgba(0,0,0,0.15)'; ctx.lineWidth=2; ctx.strokeRect(nickRect.x+4, nickRect.y+4, nickRect.w-8, nickRect.h-8);
  ctx.fillStyle='#0A2A3A';
  // Fuente Fixedsys si esta cargada, sino monospace bold
  ctx.font=`bold ${Math.floor(nickRect.h*0.50)}px Fixedsys, monospace`;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(cleanApodo, nickRect.x+nickRect.w/2, nickRect.y+nickRect.h/2+2);

  // 2. QR CUADRADO abajo der - 100% compatible (no rMQR)
  const qrValue=`https://games.wasa.chat/pass?id=${codeId}`;
  const qrSize= Math.floor(H*0.095); // 148px aprox
  const qrRect={x:Math.floor(W*0.79), y:Math.floor(H*0.846), w:qrSize, h:qrSize};
  
  // Intentar con qrcodejs local si existe, sino qrserver
  let qrImg;
  if(window.QRCode){
    const div=document.createElement('div'); div.style.position='fixed'; div.style.left='-9999px'; document.body.appendChild(div);
    new QRCode(div,{text:qrValue,width:300,height:300,correctLevel:QRCode.CorrectLevel.H});
    await new Promise(r=>setTimeout(r,350));
    let qrUrl=""; const cv=div.querySelector('canvas'); if(cv) qrUrl=cv.toDataURL(); else { const imgEl=div.querySelector('img'); if(imgEl) qrUrl=imgEl.src; }
    document.body.removeChild(div);
    if(qrUrl){
      qrImg=await new Promise((res,rej)=>{const im=new Image(); im.onload=()=>res(im); im.onerror=rej; im.src=qrUrl;});
    }
  }
  if(!qrImg){
    const qrUrl=`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrValue)}&color=000000&bgcolor=FFFFFF&margin=1&format=png`;
    qrImg=await new Promise((res,rej)=>{const im=new Image(); im.crossOrigin='anonymous'; im.onload=()=>res(im); im.onerror=rej; im.src=qrUrl;});
  }
  ctx.fillStyle='#FFFFFF'; ctx.fillRect(qrRect.x-2, qrRect.y-2, qrRect.w+4, qrRect.h+4);
  ctx.drawImage(qrImg, qrRect.x, qrRect.y, qrRect.w, qrRect.h);

  const dataUrl=canvas.toDataURL('image/png'); 
  const b64=dataUrl.split(',')[1];

  // Enviar al worker - usa alias sendeditedimage que tu worker ya soporta
  const body={
    action:'sendeditedimage',
    email:(email||'').toLowerCase(),
    codeId, 
    wasa_pass_id: codeId,
    slots:1, slotNum:1,
    nombre:cleanApodo, apodo:cleanApodo,
    tx_hash:tx_hash||'',
    percent:0,
    image_b64:b64,
    image_base64: dataUrl, // compatibilidad con nuevo worker
    image_filename:`${codeId}-WASA-PASS-X${multiplier}.png`,
    multiplier
  };
  
  const resp=await fetch(WORKER_URL,{
    method:'POST',
    headers:{'Content-Type':'application/json','X-WASA-KEY':SECRET},
    body:JSON.stringify(body)
  });
  const j=await resp.json().catch(()=>({ok:false}));
  if(!j.ok) throw new Error('Email worker fail: '+(j.error||JSON.stringify(j)));
  
  return {ok:true, codeId, apodo:cleanApodo, dataUrl, passUrl:qrValue, emailed: j.emailed};
}

// Compatibilidad: si lo cargas como script normal (no module), exponer global
if(typeof window!=='undefined'){ window.crearWasaPassFinal = crearWasaPassFinal; }
