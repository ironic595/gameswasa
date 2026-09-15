// escritor-wasapass.js - FINAL PNG CHARS - v11 - Usa /img/A.png .. Z,0..9
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
async function loadCharImg(char){
  const safe = char.toUpperCase();
  const names = [safe];
  if(safe === '_') names.unshift('_','UNDERSCORE','guion');
  for(const n of names){
    try{
      const url = `./img/${n}.png`;
      const resp = await fetch(url+'?v='+Date.now(), {cache:'no-store'});
      if(!resp.ok) continue;
      const blob = await resp.blob();
      const objUrl = URL.createObjectURL(blob);
      const img = await new Promise((res,rej)=>{
        const im=new Image(); im.crossOrigin='anonymous';
        im.onload=()=>{ URL.revokeObjectURL(objUrl); res(im); };
        im.onerror=(e)=>{ URL.revokeObjectURL(objUrl); rej(e); };
        im.src=objUrl;
      });
      return img;
    }catch{}
  }
  return null;
}
export async function crearWasaPassFinal({codeId, apodo, email, tx_hash, multiplier=5}){
  if(!codeId) codeId=genId10();
  const cleanApodo = (apodo||'PLAYER').toUpperCase().replace(/[^A-Z0-9_]/g,'').slice(0,12);
  const W=1024, H=1560;
  const canvas=document.createElement('canvas'); canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext('2d');
  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality='high';
  const base=await loadImageObfuscated(BASE_IMG_URL);
  ctx.drawImage(base,0,0,W,H);
  const nickRect={x:Math.floor(W*0.140), y:Math.floor(H*0.8549), w:Math.floor(W*0.49), h:Math.floor(H*0.0459)}; // corrido +3.3% a la derecha para centrar entre borde y QR - fix tu captura ANDRYZEN5600
  const chars = cleanApodo.split('');
  const charImgs = [];
  for(const c of chars){
    const img = await loadCharImg(c);
    if(img) charImgs.push({c, img});
    else if(c === '_' || c === ' '){
      charImgs.push({c, img:null, isSpace:true});
    }
  }
  const targetH = Math.floor(nickRect.h * 0.88);
  let totalW = 0;
  const scaled = [];
  for(const {c,img,isSpace} of charImgs){
    if(isSpace){
      const w = Math.floor(targetH * 0.4);
      scaled.push({w, h:targetH, img:null, isSpace:true});
      totalW += w;
    } else if(img){
      const scale = targetH / img.height;
      const w = Math.floor(img.width * scale);
      scaled.push({w, h:targetH, img});
      totalW += w;
    }
  }
  // FIX desborde: cada PNG A.png.. tiene padding interno, superponer más (-7.5px) como LIMITED EDITION - tu captura ANDRYZEN5600 aún se ve separado
  const letterSpacing = Math.floor(W * -0.0075); // -7.7px en 1024 - un poco más superpuesto
  totalW += Math.max(0, scaled.length-1) * letterSpacing;
  let curX = nickRect.x + Math.floor((nickRect.w - totalW)/2);
  const curY = nickRect.y + Math.floor((nickRect.h - targetH)/2);
  for(let i=0;i<scaled.length;i++){
    const s = scaled[i];
    if(!s.isSpace && s.img){
      ctx.drawImage(s.img, curX, curY, s.w, s.h);
    }
    curX += s.w + letterSpacing;
  }
  const qrValue=`https://games.wasa.chat/pass?id=${codeId}`;
  const qrSize= Math.floor(W*0.146);
  const qrRect={x:Math.floor(W*0.735), y:Math.floor(H*0.832), w:qrSize, h:qrSize}; // subido - no pisa 2026
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
    image_base64: dataUrl,
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
if(typeof window!=='undefined'){ window.crearWasaPassFinal = crearWasaPassFinal; }
