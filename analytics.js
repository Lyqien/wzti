// No external SDK, no answers or hero results collected, and no blocking requests.
globalThis.WZTIStats=(()=>{
  const settings=globalThis.WZTI_CONFIG?.analytics;
  if(!settings?.endpoint||!settings?.anonKey)return {home(){},completed(){}};
  const uuid=()=>crypto.randomUUID();
  let visitor,visibleCount=null,hasOpened=false,openPending=false,completePending=false,completeSent=false;
  try{visitor=localStorage.getItem('wzti-visitor-v1');if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(visitor||'')){visitor=uuid();localStorage.setItem('wzti-visitor-v1',visitor)}}catch{visitor=uuid()}
  function render(){
    const home=document.querySelector('.home');if(!home)return;
    let node=home.querySelector('.participant-count');
    if(visibleCount===null){node?.remove();return}
    if(!node){node=document.createElement('p');node.className='participant-count';home.querySelector('#start').after(node)}
    node.textContent='已有'+visibleCount+'位农友开发农格';
  }
  async function request(kind){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6000);
    try{
      const response=await fetch(settings.endpoint,{method:kind?'POST':'GET',headers:{'Authorization':'Bearer '+settings.anonKey,'apikey':settings.anonKey,...(kind?{'Content-Type':'application/json'}:{})},body:kind?JSON.stringify({visitor_id:visitor,kind}):undefined,signal:controller.signal,keepalive:!!kind,cache:'no-store'});
      if(!response.ok)throw Error('stats');
      const data=await response.json();visibleCount=Number.isSafeInteger(data.completed)&&data.completed>=5000?data.completed:null;render();return true;
    }catch{return false}finally{clearTimeout(timer)}
  }
  async function retry(kind){for(let attempt=0;attempt<3;attempt++){if(await request(kind))return true;if(attempt<2)await new Promise(resolve=>setTimeout(resolve,2000*(attempt+1)))}return false}
  function opened(){if(hasOpened||openPending)return;openPending=true;retry('opened').then(ok=>{hasOpened=ok;openPending=false})}
  return {
    home(){render();setTimeout(()=>{if(!hasOpened)opened();else request()},0)},
    completed(){if(completeSent||completePending)return;completePending=true;setTimeout(()=>retry('completed').then(ok=>{completeSent=ok;completePending=false}),0)}
  };
})();
