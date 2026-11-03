'use strict';
globalThis.WZTIShare=(()=>{
  const font='"Yuanti SC","YouYuan",system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif';
  function image(src){return new Promise((resolve,reject)=>{
    const img=new Image(),timer=setTimeout(()=>reject(Error('image timeout')),12000);
    img.onload=async()=>{try{if(img.decode)await img.decode();clearTimeout(timer);resolve(img)}catch{clearTimeout(timer);reject(Error('image decode'))}};
    img.onerror=()=>{clearTimeout(timer);reject(Error('image unavailable'))};img.crossOrigin='anonymous';img.src=src;
  })}
  function fit(ctx,img,x,y,w,h){const scale=Math.min(w/img.naturalWidth,h/img.naturalHeight);const iw=img.naturalWidth*scale,ih=img.naturalHeight*scale;ctx.drawImage(img,x+(w-iw)/2,y+(h-ih)/2,iw,ih)}
  function lines(ctx,text,width){let rows=[],row='';for(const c of text){if(ctx.measureText(row+c).width>width&&row){rows.push(row);row=c}else row+=c}if(row)rows.push(row);return rows}
  async function card(record){
    await document.fonts.ready;
    const path=record['英雄展示图'];
    const heroURL=await Promise.race([cacheClearImage(path,true),new Promise((_,reject)=>setTimeout(()=>reject(Error('image timeout')),15000))]);
    const [hero,logo,qr]=await Promise.all([image(heroURL),image(WZTI_CONFIG.brand.logoDataURI),image(WZTI_CONFIG.shareQRDataURI)]);
    const canvas=document.createElement('canvas');canvas.width=750;canvas.height=1250;const ctx=canvas.getContext('2d');
    ctx.fillStyle='#f8f4eb';ctx.fillRect(0,0,750,1250);ctx.strokeStyle='#cbb17b';ctx.lineWidth=2;ctx.strokeRect(24,24,702,1202);ctx.strokeStyle='#e1d4b7';ctx.strokeRect(32,32,686,1186);
    fit(ctx,logo,48,40,120,80);ctx.fillStyle='#756b5d';ctx.font='22px '+font;ctx.textAlign='right';ctx.fillText('王者荣耀人格测试',688,91);
    ctx.fillStyle='#f2eadb';ctx.fillRect(48,140,654,438);fit(ctx,hero,60,148,630,420);
    ctx.textAlign='center';ctx.fillStyle='#756b5d';ctx.font='20px '+font;ctx.fillText('你的主要共鸣英雄',375,625);
    ctx.fillStyle='#332e27';ctx.font='700 54px '+font;ctx.fillText(record['英雄名称'],375,698);
    ctx.font='27px '+font;const persona=lines(ctx,record['人格标题'],620);persona.forEach((line,i)=>ctx.fillText(line,375,745+i*38));
    let y=774+(persona.length-1)*38;
    ctx.font='20px '+font;
    const tags=record['分享关键词'],rows=[[]];let width=0;
    for(const tag of tags){const w=ctx.measureText(tag).width+28;if(width+w>620&&rows.at(-1).length){rows.push([]);width=0}rows.at(-1).push({tag,w});width+=w+12}
    for(const row of rows){let x=(750-(row.reduce((a,t)=>a+t.w,0)+(row.length-1)*12))/2;for(const {tag,w} of row){ctx.fillStyle='#eee2c7';ctx.fillRect(x,y,w,38);ctx.fillStyle='#715525';ctx.fillText(tag,x+w/2,y+26);x+=w+12}y+=50}
    const reason=record['匹配原因']?.[0];
    if(reason){ctx.font='23px '+font;ctx.fillStyle='#594f40';for(const line of lines(ctx,reason,610)){ctx.fillText(line,375,y+30);y+=35}}
    const footer=Math.max(1020,y+32);
    if(footer+180>1250)throw Error('card layout');
    ctx.strokeStyle='#ded0b0';ctx.beginPath();ctx.moveTo(64,footer-18);ctx.lineTo(686,footer-18);ctx.stroke();
    ctx.imageSmoothingEnabled=false;ctx.drawImage(qr,76,footer,148,148);ctx.imageSmoothingEnabled=true;
    ctx.textAlign='left';ctx.font='700 28px '+font;ctx.fillStyle='#332e27';ctx.fillText('来测测你的农格',254,footer+55);
    ctx.font='20px '+font;ctx.fillStyle='#756b5d';ctx.fillText('129位全英雄 · 共28题',254,footer+96);ctx.fillText('扫码开始 · 测试仅供娱乐',254,footer+132);
    return {url:canvas.toDataURL('image/png'),canvas};
  }
  return {card};
})();
