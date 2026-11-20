import test from 'node:test';
import assert from 'node:assert/strict';
import {Cloud} from '../api.js';
import {sourceAllowed,HIDDEN_SOURCE_NOTE} from '../originals.js';
import {RemoteControl} from '../remote.js';
const config={supabaseUrl:'https://mwfhqffcxshifuezhmqf.supabase.co',publishableKey:'sb_publishable_test'};
const key='1'.repeat(64),photo='2'.repeat(64);
const storage=()=>{const values=new Map();return {getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)}};
const response=value=>({ok:true,status:200,text:async()=>JSON.stringify(value)});
function service(){
 const s={calls:[],version:'2026-11-20T00:00:00Z',pictureVersion:'2026-11-20T00:00:00Z',hasPicture:true,bodyReads:0,photoReads:0};
 s.fetch=async(url,options)=>{
  const u=new URL(url),select=u.searchParams.get('select')||'',fields=select.split(',');s.calls.push(u);
  const owner=options.headers.Authorization;
  let rows=[];
  if(u.pathname.endsWith('mc_cloud_todos')){
   if(u.searchParams.get('subject')?.startsWith('eq.')){
    if(select.includes('original_text'))s.photoReads++;
    if(s.hasPicture)rows=[{todo_key:photo,task:'LINE 圖片預覽（系統資料）',subject:'MessageControl 圖片來源 v1',synced_at:s.pictureVersion,original_text:owner+' photo'}];
   }else{
    if(select.includes('original_text'))s.bodyReads++;
    rows=[{todo_key:key,task:'待辦',subject:'測試',source_type:'Email',priority:'P3',source_completed:false,synced_at:s.version,original_text:owner+' private original '.repeat(5000)}];
   }
  }
  return response(rows.map(row=>Object.fromEntries(fields.filter(f=>f in row).map(f=>[f,row[f]]))));
 };return s;
}
function client(s){const c=new Cloud(config,storage(),s.fetch);c.store({access_token:'A',refresh_token:'r',expires_in:3600,user:{id:'A'}});return c;}
test('list loads no originals or images; concurrent loads share requests and originals invalidate on revision',async()=>{
 const s=service(),c=client(s);const [data]=await Promise.all([c.data(),c.data()]);
 assert.equal(s.calls.length,2);assert.equal(s.bodyReads,0);assert.equal(s.photoReads,0);assert.ok(!('original_text' in data.todos[0]));assert.ok(s.calls.every(u=>u.searchParams.get('select')!=='*'));
 assert.match(await c.original(key),/Bearer A/);await c.original(key);assert.equal(s.bodyReads,1);
 s.version='2026-11-20T01:00:00Z';await c.data();await c.original(key);assert.equal(s.bodyReads,2);
 assert.ok(!sourceAllowed({source_type:'LINE',analysis_note:HIDDEN_SOURCE_NOTE}));
});
test('image manifest avoids repeated picture bodies and honors revisions and removal',async()=>{
 const s=service(),c=client(s);assert.equal((await c.images()).length,1);await c.images();assert.equal(s.photoReads,1);
 s.pictureVersion='2026-11-20T01:00:00Z';await c.images();assert.equal(s.photoReads,2);
 s.hasPicture=false;assert.deepEqual(await c.images(),[]);assert.equal(s.photoReads,2);
});
test('account switch clears original and image memory caches even with matching revisions',async()=>{
 const s=service(),c=client(s);await c.data();assert.match(await c.original(key),/Bearer A/);await c.images();
 c.store({access_token:'B',refresh_token:'rB',expires_in:3600,user:{id:'B'}});await c.data();
 assert.match(await c.original(key),/Bearer B/);assert.equal((await c.images())[0].original_text,'Bearer B photo');assert.equal(s.photoReads,2);
 c.clear();assert.equal(c.originals.size,0);assert.equal(c.imageRows.size,0);await assert.rejects(c.original(key),/請先登入/);
});
test('idle remote controls wait thirty seconds while active work and explicit refresh stay responsive',async()=>{
 const previous=globalThis.document;globalThis.document={getElementById:()=>null};
 try{
  let calls=0;const cloud={url:'test',session:()=>({}),control:async()=>{calls++;return {states:[],registry:{}}}};
  const form={addEventListener(){}};const control=new RemoteControl(cloud,{querySelector:q=>q==='form'?form:{}});control.update=()=>{};
  await control.refresh();await control.refresh();assert.equal(calls,1);
  control.pending=true;control.lastPoll=Date.now()-6000;await control.refresh();assert.equal(calls,2);
  await control.refresh({force:true});assert.equal(calls,3);
 }finally{globalThis.document=previous;}
});
