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

async function ensureFixedsys(){
  try {
    const fontFace = new FontFace('FixedsysTTF', 'url(/fnts/Fixedsys.ttf)', { weight: '200' });
    await fontFace.load();
    document.fonts.add(fontFace);
    await document.fonts.ready;
    await document.fonts.load(`200 19px FixedsysTTF`);
  } catch(e) {
    console.warn('FixedsysTTF no cargo, fallback', e);
    try { await document.fonts.load(`200 19px Fixedsys`); await document.fonts.ready; } catch {}
  }
}

export async function crearWasaPassFinal({codeId, apodo, email, tx_hash, multiplier=5}){
  if(!codeId) codeId=genId10();
  const cleanApodo = (apodo||'PLAYER').toUpperCase().replace(/[^A-Z0-9_]/g,'').slice(0,12);
  await ensureFixedsys();
  
  const W=1024, H=1560;
  const canvas=document.createElement('canvas'); canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext('2d');
  ctx.imageSmoothingEnabled=false;

  const base=await loadImageObfuscated(BASE_IMG_URL);
  ctx.drawImage(base,0,0,W,H);

  // 1. APODO - EXACTO del modelo YOUR NAME: 12.17% x 85.49% w47.8% h4.59% - ESTILO EMBOSS REAL - 19px (antes 14px)
  const nickRect={x:Math.floor(W*0.1217), y:Math.floor(H*0.8549), w:Math.floor(W*0.4782), h:Math.floor(H*0.0459)};
  const fontSize = Math.floor(nickRect.h*0.72); // 19px pedido - antes 0.55 (14px) se veía chico
  const yPos = nickRect.y + nickRect.h/2 + 2;
  const xPos = nickRect.x + nickRect.w/2;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.font = `200 ${fontSize}px "FixedsysTTF", "Fixedsys", "Courier New", Courier, monospace`;
  try { ctx.letterSpacing = '4px'; } catch {}
  const shadows = [
    {dx: 3, dy: 3, color: '#091721'},
    {dx: 2, dy: 2, color: '#210d02'},
    {dx: 1, dy: 1, color: '#5e2a09'},
    {dx: -1, dy: 1, color: '#944d1a'},
    {dx: 1, dy: -1, color: '#944d1a'},
    {dx: -1, dy: -1, color: '#ffcc99'},
  ];
  for(const s of shadows){
    ctx.fillStyle = s.color;
    ctx.fillText(cleanApodo, xPos + s.dx, yPos + s.dy);
  }
  ctx.fillStyle = '#d99152';
  ctx.fillText(cleanApodo, xPos, yPos);

  // 2. QR CUADRADO abajo der - AJUSTE FINAL: más arriba y más a la izq (tu captura BOCAJUNIORS9 muestra QR abajo-der tocando borde)
  const qrValue=`https://games.wasa.chat/pass?id=${codeId}`;
  // QR: 14.8% + movido -0.8% X y -0.8% Y para centrar perfecto en recuadro gris y no tapar 2026
  const qrSize= Math.floor(W*0.149); // 14.8% ~151px - entra holgado
  const qrRect={x:Math.floor(W*0.727), y:Math.floor(H*0.831), w:qrSize, h:qrSize};
  
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
