'use strict';
let config=globalThis.WZTI_CONFIG,answers={},current=0,screen='home',transitionTimer,viewEpoch=0,sharedView=false,lastResult=null;
const app=document.querySelector('#app');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const asset=s=>{const u=new URL(s.replace(/\.png$/i,'.webp'),document.baseURI);if(config.imageVersions?.[s])u.searchParams.set('v',config.imageVersions[s]);return u.href};
function show(html){document.querySelector('#copy-toast')?.remove();document.documentElement.classList.remove('card-open');document.body.classList.remove('card-open');viewEpoch++;clearTimeout(transitionTimer);document.querySelector('#ui-dialog')?.remove();document.body.classList.toggle('answering',screen==='question');document.documentElement.classList.toggle('answering',screen==='question');app.innerHTML=html;window.scrollTo({top:0,behavior:'instant'});const heading=app.querySelector('h1');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true})}}
function removeSharedHash(){if(location.hash)history.replaceState(null,'',location.pathname+location.search)}
function home(message=''){
  screen='home';sharedView=false;answers={};current=0;
  show(`<section class="home"><img class="home-logo home-icon" src="${config.brand.iconDataURI}" alt="WZTI"><div class="eyebrow">王者荣耀人格测试</div><h1>来测测你的农格</h1><p class="completion-time">129位全英雄 · 约5-8分钟完成</p>${message?`<p class="progress-notice" role="status">${esc(message)}</p>`:''}<button class="primary" id="start">开始测试</button><div class="creator-note"><p>由一名重度农友制作</p><p>还想测什么人格？我来帮你做！</p><p>联系我 <a href="mailto:3229065685@qq.com">3229065685@qq.com</a></p><p>（也可以找作者打游戏！）</p></div></section>`);
  WZTIStats.home();
  document.querySelector('#start').onclick=()=>{removeSharedHash();sharedView=false;answers={};current=0;question();setTimeout(warmImages,0)};
}
function question(){
  screen='question';sharedView=false;const q=config.questions[current];
  show(`<section class="question"><div class="meta"><span>答题进度</span><span><strong>${String(current+1).padStart(2,'0')}</strong> / 28</span></div><div class="progress" role="progressbar" aria-label="已完成题目" aria-valuemin="0" aria-valuemax="28" aria-valuenow="${Object.keys(answers).length}"><i style="width:${Object.keys(answers).length/28*100}%"></i></div><h1>${esc(q.question)}</h1><div class="options" role="group" aria-label="请选择一个答案">${Object.entries(q.options).map(([key,value])=>`<button class="option ${answers[q.id]===key?'selected':''}" aria-pressed="${answers[q.id]===key}" data-key="${key}"><b>${key}</b><span>${esc(value)}</span></button>`).join('')}</div><div class="nav"><button class="secondary" id="prev" ${current===0?'disabled':''}>← 上一题</button></div></section>`);
  app.querySelectorAll('.option').forEach(btn=>btn.onclick=()=>{
    if(btn.disabled)return;answers[q.id]=btn.dataset.key;
    const progress=app.querySelector('.progress');progress.setAttribute('aria-valuenow',Object.keys(answers).length);progress.firstElementChild.style.width=Object.keys(answers).length/28*100+'%';
    app.querySelectorAll('.option').forEach(el=>{el.disabled=true;el.classList.toggle('selected',el===btn);el.setAttribute('aria-pressed',el===btn)});
    transitionTimer=setTimeout(()=>{if(current<27){current++;question()}else result()},220);
  });
  document.querySelector('#prev').onclick=()=>{if(current>0){current--;question()}};
}
const clearImages=new Map(),imageRequests=new Map();let warmJob;
function heroImage(record,kind){const path=record['英雄展示图'],url=clearImages.get(path)||clearImages.get(path+'#png')||deliveryURLs(path)[0];return `<div class="art-frame ${kind==='hero'?'main':'partner'}-art-frame" data-image-slot="${kind}"><img class="${kind}-art" data-original="${esc(path)}" crossorigin="anonymous" src="${esc(url)}" alt="${esc(record['英雄名称'])}" width="768" height="512"><button type="button" class="image-retry" hidden>重试图片</button></div>`}
function wireResultImage(image){const path=image.dataset.original,frame=image.closest('.art-frame'),retry=frame.querySelector('.image-retry'),urls=[...deliveryURLs(path),backupURL(path)];let attempt=0;image.onload=()=>{retry.hidden=true;image.dataset.ready='1'};image.onerror=()=>{if(!image.isConnected)return;delete image.dataset.ready;attempt++;if(attempt<urls.length)image.src=urls[attempt];else retry.hidden=false};async function useCache(force=false){if(force){clearImages.delete(path);await dropPersistentImage(path)}cacheClearImage(path,true).then(url=>{if(image.isConnected&&!(image.complete&&image.naturalWidth>0))image.src=url},()=>{if(image.isConnected&&!image.naturalWidth)retry.hidden=false})}retry.onclick=()=>{attempt=0;retry.hidden=true;image.src=urls[0]+(urls[0].includes('?')?'&':'?')+'retry='+Date.now();useCache(true)};if(image.complete&&image.naturalWidth>0)image.dataset.ready='1';else useCache()}
function deliveryURLs(path){const urls=[];if(config.imageCDN&&config.imageCDNPaths?.includes(path))urls.push(new URL(path.replace(/\.png$/i,'.webp'),config.imageCDN).href);urls.push(asset(path));return urls}
const deliveryStats={persistentHits:0,cdnWins:0,originWins:0};const imageCacheName='wzti-clear-images-v1';
async function persistentImages(){try{return globalThis.caches?await caches.open(imageCacheName):null}catch{return null}}
async function dropPersistentImage(path){try{const cache=await persistentImages();if(cache)await cache.delete(deliveryURLs(path)[0])}catch{}}
async function cachedBlob(path){try{const cache=await persistentImages(),response=cache&&await cache.match(deliveryURLs(path)[0]);if(response&&response.ok){const blob=await response.blob();if(blob.size&&blob.type.startsWith('image/')){deliveryStats.persistentHits++;return blob}}}catch{}return null}
async function saveBlob(path,blob){try{const cache=await persistentImages();if(cache)await cache.put(deliveryURLs(path)[0],new Response(blob,{headers:{'Content-Type':blob.type,'Cache-Control':'public,max-age=31536000,immutable'}}))}catch{}}
function raceImageSources(urls,urgent){return new Promise((resolve,reject)=>{let failures=0,settled=false;const controllers=urls.map(()=>new AbortController());urls.forEach((url,i)=>{const timer=setTimeout(()=>controllers[i].abort(),9000);fetch(url,{cache:'force-cache',priority:urgent?'high':'low',signal:controllers[i].signal}).then(async response=>{if(!response.ok)throw Error('image');const blob=await response.blob();if(!blob.size||!blob.type.startsWith('image/'))throw Error('empty image');if(!settled){settled=true;controllers.forEach((c,j)=>{if(i!==j)c.abort()});if(config.imageCDN&&url.startsWith(config.imageCDN))deliveryStats.cdnWins++;else deliveryStats.originWins++;resolve(blob)}}).catch(()=>{if(++failures===urls.length&&!settled){settled=true;reject(Error('images unavailable'))}}).finally(()=>clearTimeout(timer))})})}
function backupURL(path){const u=new URL('Images/Backup/'+path.split('/').pop(),asset('config.json'));if(config.imageVersions?.[path])u.searchParams.set('v',config.imageVersions[path]);return u.href}
function cacheClearImage(path,urgent=false,backupOnly=false){const key=path+(backupOnly?'#png':'');if(clearImages.has(key))return Promise.resolve(clearImages.get(key));if(imageRequests.has(key))return imageRequests.get(key);const promise=(async()=>{let blob=await cachedBlob(path);if(!blob){try{blob=await raceImageSources(backupOnly?[backupURL(path)]:deliveryURLs(path),urgent)}catch{blob=await raceImageSources([backupURL(path)],urgent)}await saveBlob(path,blob)}const url=URL.createObjectURL(blob);clearImages.set(key,url);return url})();imageRequests.set(key,promise);promise.then(()=>imageRequests.delete(key),()=>imageRequests.delete(key));return promise}
function warmImages(){if(warmJob)return warmJob;const paths=[...new Set(config.results.map(r=>r['英雄展示图']))];let next=0;warmJob=Promise.all(Array.from({length:3},async()=>{while(next<paths.length){const path=paths[next++];try{await cacheClearImage(path)}catch{}}}));return warmJob}

function dialog(title,body){
  document.querySelector('#ui-dialog')?.remove();const node=document.createElement('dialog');node.id='ui-dialog';node.className='ui-dialog';node.setAttribute('aria-labelledby','dialog-title');
  node.innerHTML=`<div class="dialog-heading"><h2 id="dialog-title">${esc(title)}</h2><button class="dialog-close" aria-label="关闭">×</button></div><div class="dialog-content">${body}</div>`;
  document.body.append(node);const close=()=>{node.close?.();node.remove();document.documentElement.classList.remove('card-open');document.body.classList.remove('card-open')};node.querySelector('.dialog-close').onclick=close;node.addEventListener('cancel',close);
  if(node.showModal)node.showModal();else node.setAttribute('open','');return node;
}
function toast(message){
  document.querySelector('#copy-toast')?.remove();const node=document.createElement('div');node.id='copy-toast';node.className='toast';node.setAttribute('role','status');node.setAttribute('aria-live','polite');document.body.append(node);node.textContent=message;setTimeout(()=>node.remove(),2500);
}
function copyResult(){
  const epoch=viewEpoch;
  const url=WZTISession.link(answers);
  const manual=()=>{
    if(epoch!==viewEpoch)return;
    const node=dialog('复制结果链接',`<p>链接包含本次选择，朋友可以看到这次的农格结果。</p><label for="result-link">长按或选中下方链接复制</label><textarea id="result-link" readonly rows="4"></textarea>`);
    const input=node.querySelector('textarea');input.value=url;input.focus();input.select();
  };
  if(navigator.clipboard?.writeText)navigator.clipboard.writeText(url).then(()=>{
    if(screen==='result'&&epoch===viewEpoch)toast('复制成功');
  },manual);else manual();
}
async function saveResultCard(){
  const record=lastResult;const node=dialog('保存我的农格',`<p class="export-status" role="status">正在生成结果图片…</p>`);node.classList.add('card-dialog');document.documentElement.classList.add('card-open');document.body.classList.add('card-open');
  async function generate(){
    const body=node.querySelector('.dialog-content');body.innerHTML='<p class="export-status" role="status">正在生成结果图片…</p>';
    try{
      const {url}=await WZTIShare.card(record);if(!node.isConnected)return;
      body.innerHTML='<p class="save-guide">长按保存图片</p><div class="export-image-wrap"><img class="export-image" alt="农格结果分享图片，长按保存"></div>';
      body.querySelector('img').src=url;
    }catch{
      if(!node.isConnected)return;body.innerHTML='<p role="alert">图片暂时无法生成，请检查网络后重试。</p><button class="primary" id="retry-export">重新生成</button>';body.querySelector('button').onclick=generate;
    }
  }
  generate();
}
function result({friend=false}={}){
  const output=matchWZTI(config,answers);
  if(output.status!=='matched'){current=config.questions.findIndex(q=>q.id===output.missing[0]);question();return}
  sharedView=friend;
  if(!friend)WZTIStats.completed();
  const r=output.result,p=r['最佳匹配英雄'];lastResult=r;screen='result';
  const reasons=r['匹配原因'],near=r['接近结果'];
  show(`<article class="result">${friend?'<div class="friend-banner"><span>朋友的农格结果</span><button class="secondary" id="friend-start">我也去测测</button></div>':''}${heroImage(r,'hero')}<div class="eyebrow">你的主要共鸣英雄</div><h1>${esc(r['英雄名称'])}</h1><div class="persona">${esc(r['人格标题'])}</div><blockquote>“${esc(r['英雄台词'])}”</blockquote><section class="panel match-reasons"><h2 class="section-title">你们的共鸣之处</h2>${reasons.length?`<ul class="reason-list">${reasons.map(text=>`<li>${esc(text)}</li>`).join('')}</ul>`:''}</section>${near.length?`<section class="panel near-results"><h2 class="section-title">你也有这些英雄的一面</h2><div class="near-heroes">${near.map(h=>`<div class="near-hero">${heroImage(h,'near')}<strong>${esc(h['英雄名称'])}${h['与主结果同分']?'<small>同分共鸣</small>':''}</strong><span>${esc(h['人格标题'])}</span></div>`).join('')}</div></section>`:''}<section class="panel"><h2 class="section-title">你的性格底色</h2><p>${esc(r['性格描述'])}</p></section><section class="panel tendencies"><h2 class="section-title">你的农格维度</h2><div class="chart" role="group" aria-label="八项作答倾向，点击各项查看说明">${Object.entries(r['性格维度百分比']).map(([k,v],i)=>`<button type="button" class="column" data-dimension="${i}" aria-label="${esc(k)}，${v}／100，查看说明" aria-expanded="false" aria-controls="dimension-detail"><b>${v}<span>／100</span></b><span class="track"><span class="fill" style="height:${v}%"></span></span><small>${esc(k)}</small></button>`).join('')}</div><p class="chart-note">点击其他维度查看详情</p><div id="dimension-detail" class="dimension-detail" hidden></div></section><section class="panel partner"><h2 class="section-title">与你互补的英雄搭档</h2>${heroImage(p,'partner')}<h3>${esc(p['英雄名称'])}</h3><p class="partner-note">按主英雄预设的娱乐推荐，并非独立关系测评或官方CP。</p>${['合拍在哪里','容易摩擦在哪里','相处小建议'].map(key=>`<div class="partner-section"><h4>${key}</h4><p>${esc(p[key])}</p></div>`).join('')}</section>${!friend?`<section class="panel sharing"><h2 class="section-title">把这份农格带走</h2><div class="share-keywords">${r['分享关键词'].map(text=>`<span>${esc(text)}</span>`).join('')}</div><div class="share-actions"><button class="primary" id="save-card">保存结果图片</button><button class="secondary" id="copy-result">复制结果链接</button></div><p class="share-disclosure">链接包含本次选择。</p></section>`:''}<div class="result-actions"><button class="secondary" id="restart">${friend?'我也去测测':'再测一次'}</button></div></article>`);
  app.querySelectorAll('img[data-original]').forEach(wireResultImage);
  app.querySelectorAll('[data-dimension]').forEach(button=>button.onclick=()=>{
    const index=Number(button.dataset.dimension),rule=config.dimensionRules[index],detail=document.querySelector('#dimension-detail');const close=false;
    app.querySelectorAll('[data-dimension]').forEach(b=>b.setAttribute('aria-expanded','false'));detail.hidden=close;if(close)return;
    button.setAttribute('aria-expanded','true');detail.innerHTML=`<h3>${esc(rule.name)}</h3><p>${esc(rule.description)}。</p><p><strong>较低倾向时：</strong>${esc(rule['较低倾向说明'])}</p>`;
  });
  document.querySelector('[data-dimension]')?.click();
  document.querySelector('#copy-result')?.addEventListener('click',copyResult);document.querySelector('#save-card')?.addEventListener('click',saveResultCard);
  const restart=()=>{answers={};current=0;sharedView=false;removeSharedHash();home()};
  document.querySelector('#restart').onclick=restart;document.querySelector('#friend-start')?.addEventListener('click',restart);
}
function route(){
  const parsed=WZTISession.decode(location.hash);
  if(parsed.status==='shared'){answers=parsed.answers;current=27;result({friend:true});return}
  if(parsed.status==='invalid'||parsed.status==='outdated'){
    home(parsed.status==='outdated'?'这份结果链接的版本暂不支持，请重新测试。':'结果链接不完整或已损坏，你可以重新开始测试。');return;
  }
  home();
}
document.querySelector('#brand').onclick=e=>{e.preventDefault();removeSharedHash();home()};
window.addEventListener('hashchange',route);
window.addEventListener('pageshow',event=>{if(event.persisted){WZTIStats.newVisit();route();WZTIStats.home()}});
async function boot(){
  WZTISession.clearLegacy();
  document.querySelector('#brand img').src=config.brand.logoDataURI;
  await Promise.all([config.brand.iconDataURI,config.brand.logoDataURI].map(src=>new Promise(resolve=>{const image=new Image();image.onload=()=>{if(image.decode)image.decode().then(resolve,resolve);else resolve()};image.onerror=resolve;image.src=src})));
  route();WZTIStats.home();document.body.style.visibility='visible';
}
boot();
