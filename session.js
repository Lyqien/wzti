'use strict';
globalThis.WZTISession=(()=>{
  const version=WZTI_CONFIG.version;
  function validAnswers(answers,complete=false){
    if(!answers||typeof answers!=='object'||Array.isArray(answers))return false;
    const keys=Object.keys(answers);
    return keys.length<=28&&(!complete||keys.length===28)&&keys.every(id=>{
      const q=WZTI_CONFIG.questions.find(q=>q.id===id);
      return !!q&&Object.prototype.hasOwnProperty.call(q.options,answers[id]);
    });
  }
  function clearLegacy(){try{localStorage.removeItem('wzti-progress-v1');localStorage.removeItem('wzti-visitor-v1')}catch{}}
  function encode(answers){
    if(!validAnswers(answers,true))throw Error('incomplete');
    const a=WZTI_CONFIG.questions.map(q=>answers[q.id]).join('');
    return btoa(JSON.stringify({s:1,v:version,a})).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }
  function decode(hash){
    if(!hash||hash==='#')return {status:'none'};
    if(!hash.startsWith('#r='))return {status:'invalid'};
    const token=hash.slice(3);
    if(token.length>512||!token.length||!/^[A-Za-z0-9_-]+$/.test(token))return {status:'invalid'};
    try{
      const p=JSON.parse(atob(token.replace(/-/g,'+').replace(/_/g,'/')));
      if(p?.s!==1||p.v!==version)return {status:'outdated'};
      if(typeof p.a!=='string'||p.a.length!==28||!/^[ABCD]{28}$/.test(p.a))return {status:'invalid'};
      const answers=Object.fromEntries(WZTI_CONFIG.questions.map((q,i)=>[q.id,p.a[i]]));
      return validAnswers(answers,true)?{status:'shared',answers}:{status:'invalid'};
    }catch{return {status:'invalid'}}
  }
  function link(answers){const url=new URL(location.href);url.hash='r='+encode(answers);return url.href}
  return {clearLegacy,validAnswers,encode,decode,link};
})();
