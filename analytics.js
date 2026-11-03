// No external SDK, no answers or hero results collected, and no blocking requests.
globalThis.WZTIStats=(()=>{
  const settings=globalThis.WZTI_CONFIG?.analytics;
  if(!settings?.endpoint||!settings?.anonKey)return {home(){},completed(){},newVisit(){}};
  const newState=()=>({id:crypto.randomUUID(),hasOpened:false,openPending:false,completePending:false,completeSent:false});
  // A fresh ID for each page opening; only retry requests share an ID.
  let visit=newState(),visibleCount=null;
  function render(){
    const home=document.querySelector('.home');if(!home)return;
    let node=home.querySelector('.participant-count');
    if(visibleCount===null){node?.remove();return}
    if(!node){node=document.createElement('p');node.className='participant-count';home.querySelector('#start').after(node)}
    node.textContent='已有'+visibleCount+'位农友开发农格';
  }
  async function request(kind,state=visit){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6000);
    try{
      const response=await fetch(settings.endpoint,{method:kind?'POST':'GET',headers:{'Authorization':'Bearer '+settings.anonKey,'apikey':settings.anonKey,...(kind?{'Content-Type':'application/json'}:{})},body:kind?JSON.stringify({visitor_id:state.id,kind}):undefined,signal:controller.signal,keepalive:!!kind,cache:'no-store'});
      if(!response.ok)throw Error('stats');
      const data=await response.json();visibleCount=Number.isSafeInteger(data.completed)&&data.completed>=5000?data.completed:null;render();return true;
    }catch{return false}finally{clearTimeout(timer)}
  }
  async function retry(kind,state){for(let attempt=0;attempt<3;attempt++){if(await request(kind,state))return true;if(attempt<2)await new Promise(resolve=>setTimeout(resolve,2000*(attempt+1)))}return false}
  function opened(state){if(state.hasOpened||state.openPending)return;state.openPending=true;retry('opened',state).then(ok=>{state.hasOpened=ok;state.openPending=false})}
  return {
    home(){render();const state=visit;setTimeout(()=>{if(state!==visit)return;if(!state.hasOpened)opened(state);else request()},0)},
    completed(){const state=visit;if(state.completeSent||state.completePending)return;state.completePending=true;setTimeout(()=>retry('completed',state).then(ok=>{state.completeSent=ok;state.completePending=false}),0)},
    newVisit(){visit=newState();visibleCount=null}
  };
})();
