import test from 'node:test';
import assert from 'node:assert/strict';
import {Cloud} from '../api.js';
const config={supabaseUrl:'https://mwfhqffcxshifuezhmqf.supabase.co',publishableKey:'sb_publishable_test'};
function fixture({dateHeader=false}={}){
 const mem=new Map(),storage={getItem:k=>mem.get(k),setItem:(k,v)=>mem.set(k,v),removeItem:k=>mem.delete(k)};
 const t='2026-11-20T00:00:00Z';
 const service={todos:Array.from({length:350},(_,i)=>({todo_key:String(i).padStart(64,'0'),task:'測試事項'+i,subject:'測試',priority:'P1',source_type:'Email',synced_at:t})),states:Array.from({length:350},(_,i)=>({todo_key:String(i).padStart(64,'0'),assignment_status:'測試交辦'.repeat(50),assignment_updated_at:t})),bytes:0,paths:[],fail:false,clock:'Fri, 20 Nov 2026 00:02:00 GMT'};
 const fetcher=async path=>{
  if(service.fail)throw Error('offline');
  const u=new URL(path);service.paths.push(u);
  let rows=structuredClone(u.pathname.endsWith('mc_cloud_todos')?service.todos:service.states);
  const since=u.searchParams.get('synced_at');
  if(since){const dot=since.indexOf('.'),op=since.slice(0,dot),cutoff=since.slice(dot+1);rows=rows.filter(r=>op==='gt'?r.synced_at>cutoff:r.synced_at>=cutoff);}
  const or=u.searchParams.get('or');
  if(or){const [,op,time]=or.match(/completed_updated_at\.(gte|gt)\.([^,)]+)/);rows=rows.filter(r=>['completed_updated_at','deadline_updated_at','assignment_updated_at'].some(k=>r[k]&&(op==='gt'?r[k]>time:r[k]>=time)));}
  const keys=u.searchParams.getAll('todo_key').find(v=>v.startsWith('in.'));
  if(keys){const keep=new Set(keys.slice(4,-1).split(','));rows=rows.filter(r=>keep.has(r.todo_key));}
  rows.sort((a,b)=>a.todo_key.localeCompare(b.todo_key));
  const offset=Number(u.searchParams.get('offset')||0);rows=rows.slice(offset,offset+Number(u.searchParams.get('limit')||500));
  const fields=u.searchParams.get('select').split(',');rows=rows.map(r=>Object.fromEntries(fields.filter(k=>k in r).map(k=>[k,r[k]])));
  const body=JSON.stringify(rows);service.bytes+=Buffer.byteLength(body);
  return {ok:true,status:200,headers:{get:key=>dateHeader&&key==='date'?service.clock:null},text:async()=>body};
 };
 const client=new Cloud(config,storage,fetcher);client.store({user:{id:'A'},access_token:'test',refresh_token:'test',expires_in:3600});
 return {service,client};
}
test('350 unchanged bulk-synced tasks retain data while avoiding full body downloads',async()=>{
 const {client,service}=fixture();const first=await client.data(),initial=service.bytes;
 const second=await client.data(),idle=service.bytes-initial;
 assert.equal(first.todos.length,350);assert.deepEqual(second,first);assert.ok(idle<initial/100);
 service.todos[0].task='更新';service.todos[0].synced_at='2026-11-20T00:03:00Z';
 service.states[0].completed=true;service.states[0].completed_updated_at='2026-11-20T00:03:00Z';
 const changed=await client.data();assert.equal(changed.todos[0].task,'更新');assert.equal(changed.states[0].completed,true);
 console.log(JSON.stringify({simulation_full_bytes:initial,simulation_idle_bytes:idle}));
});
test('failed delta does not advance cache; deletion reconciliation reads keys only',async()=>{
 const {client,service}=fixture();await client.data();const cursor=client.listCache.todoCursor;
 service.fail=true;await assert.rejects(client.data(),/offline/);assert.equal(client.listCache.todoCursor,cursor);
 service.fail=false;service.todos.shift();service.states.shift();client.listCache.reconciledAt=Date.now()-600001;
 const data=await client.data();assert.equal(data.todos.length,349);assert.equal(data.states.length,349);
 assert.equal(service.paths.filter(u=>u.searchParams.get('select')==='todo_key').length,2);
});
test('server Date advances cursor with overlap without using client time',async()=>{
 const {client,service}=fixture({dateHeader:true});await client.data();assert.equal(client.listCache.cursorMode,'server');
 assert.equal(client.listCache.todoCursor,'2026-11-20T00:01:58.000Z');
 service.clock='Fri, 20 Nov 2026 00:04:00 GMT';await client.data();assert.equal(client.listCache.todoCursor,'2026-11-20T00:03:58.000Z');
});

test('manual refresh immediately reconciles deleted tasks',async()=>{
 const {client,service}=fixture();await client.data();service.todos.shift();
 const data=await client.data({reconcile:true});assert.equal(data.todos.length,349);
});
