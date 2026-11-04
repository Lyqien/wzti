// Authenticated by the gateway (verify_jwt=true), using the public anon JWT.
// This counts browser identifiers, not verified real-world identities.
const allowedOrigin = 'https://lyqien.github.io';
const cors = {'Access-Control-Allow-Origin':allowedOrigin,'Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Vary':'Origin','Cache-Control':'no-store'};
const reply = (data,status=200) => new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json'}});
export function createHandler(env,fetcher=fetch) {
  return async function(req) {
    const origin = req.headers.get('origin');
    if(origin && origin !== allowedOrigin) return reply({error:'origin'},403);
    if(req.method === 'OPTIONS') return new Response(null,{status:204,headers:cors});
    if(!['POST','GET'].includes(req.method)) return reply({error:'method'},405);
    let event;
    if(req.method === 'POST') {
      if(Number(req.headers.get('content-length')||0)>512) return reply({error:'body'},413);
      const body = await req.text();
      if(body.length>512) return reply({error:'body'},413);
      try {event=JSON.parse(body)} catch {return reply({error:'body'},400)}
      if(!event || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(event.visitor_id)||!['opened','completed'].includes(event.kind)) return reply({error:'event'},400);
    }
    try {
      const key=env('SUPABASE_SERVICE_ROLE_KEY');
      const response=await fetcher(env('SUPABASE_URL')+'/rest/v1/rpc/'+(event?'wzti_record':'wzti_public_count'),{
        method:'POST',headers:{'apikey':key,'Authorization':'Bearer '+key,'Content-Type':'application/json'},
        body:JSON.stringify(event?{p_visitor_id:event.visitor_id,p_kind:event.kind}:{})
      });
      if(!response.ok) throw Error('database');
      const data=await response.json();
      // Never forward raw database errors, private totals, or event records.
      return reply({opened:Number.isSafeInteger(data.opened)&&data.opened>=0?data.opened:null});
    } catch {return reply({error:'unavailable'},503)}
  };
}
if(typeof Deno!=='undefined') Deno.serve(createHandler(name=>Deno.env.get(name)));
