import {REMOTE_KEYS} from './remote.js?v=20261120-egress1';
import {validateConfig} from './core.js?v=20261120-egress1';
import {HIDDEN_SOURCE_NOTE} from './originals.js?v=20261120-egress1';
const IMAGE_SUBJECT='MessageControl 圖片來源 v1';
const TODO_FIELDS='todo_key,task,subject,source_type,assigned_to,priority,analysis_date,analysis_time,analysis_note,source_completed,synced_at';
const STATE_FIELDS='todo_key,completed,completed_updated_at,deadline_mode,manual_date,manual_time,deadline_updated_at,assignment_status,assignment_updated_at';
export class Cloud{
 constructor(config,storage=localStorage,fetcher=globalThis.fetch.bind(globalThis)){Object.assign(this,validateConfig(config));this.storage=storage;this.fetcher=fetcher;this.storageKey='messagecontrol-auth:'+this.url;this.refreshing=null;}
 session(){try{return JSON.parse(this.storage.getItem(this.storageKey)||'null');}catch{return null;}}
 store(session){this.storage.setItem(this.storageKey,JSON.stringify({...session,expires_at:Date.now()+session.expires_in*1000}));}
 clear(){this.storage.removeItem(this.storageKey);this.resetCaches();}
 resetCaches(){this.cacheOwner=null;this.originals=new Map();this.imageRows=new Map();this.versions=new Map();this.dataPromise=null;this.imagePromise=null;}
 scope(){const s=this.session();if(!s)throw Error('請先登入');const owner=s.user?.id||s.user?.email||'session';if(this.cacheOwner!==owner){this.resetCaches();this.cacheOwner=owner;}return owner;}
 checkScope(owner){if(this.scope()!==owner)throw Error('帳號已切換，請重新讀取資料');}
 async request(path,{method='GET',body,auth=true,retried=false}={}){
  let session=this.session();
  const owner=auth?(session?.user?.id||session?.user?.email):null;
  if(auth&&session&&session.expires_at<Date.now()+30000){await this.refresh();session=this.session();}
  if(auth&&!session)throw Error('請先登入');
  if(owner&&owner!==(session?.user?.id||session?.user?.email))throw Error('帳號已切換，請重新讀取資料');
  const response=await this.fetcher(this.url+path,{method,headers:{apikey:this.key,...(auth?{Authorization:'Bearer '+session.access_token}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const text=await response.text();let result;try{result=text?JSON.parse(text):null;}catch{throw Error('資料服務回覆格式不正確');}
  if(owner&&owner!==(this.session()?.user?.id||this.session()?.user?.email))throw Error('帳號已切換，請重新讀取資料');
  if(!response.ok){if(response.status===401&&auth&&!retried){await this.refresh();return this.request(path,{method,body,auth,retried:true});}if(response.status===401&&auth)this.clear();const error=Error(response.status===401?'登入已失效，請重新登入':result?.msg||result?.message||result?.error_description||'資料服務暫時無法使用');error.status=response.status;throw error;}
  return result;
 }
 async login(email,password){this.resetCaches();const session=await this.request('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password},auth:false});this.store(session);return session;}
 async refresh(){
  if(this.refreshing)return this.refreshing;
  const session=this.session();if(!session)throw Error('請先登入');
  const perform=async()=>{
   const current=this.session();
   if(current?.access_token!==session.access_token&&current?.expires_at>Date.now()+30000)return;
   try{const next=await this.request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:current?.refresh_token||session.refresh_token},auth:false});const latest=this.session();if(!latest||(current?.user?.id&&latest.user?.id!==current.user.id))return;this.store(next);}
   catch(error){if([400,401].includes(error.status)&&this.session()?.refresh_token===current?.refresh_token)this.clear();throw error;}
  };
  this.refreshing=(globalThis.navigator?.locks?globalThis.navigator.locks.request('mc-auth-refresh:'+this.url,perform):perform()).finally(()=>{this.refreshing=null;});return this.refreshing;
 }
 async control(){const owner=this.scope();const [states,rows]=await Promise.all([this.request('/rest/v1/mc_cloud_state?todo_key=in.('+Object.values(REMOTE_KEYS).join(',')+')&select=todo_key,assignment_status,assignment_updated_at'),this.request('/rest/v1/mc_cloud_todos?todo_key=eq.'+REMOTE_KEYS.registry+'&select=original_text')]);this.checkScope(owner);let registry={groups:[],removed:[]};try{const value=JSON.parse(rows[0]?.original_text||'null');if(value?.kind==='mc_remote_line_v1')registry=value;}catch{}return {states,registry};}
 async logout(){try{await this.request('/auth/v1/logout',{method:'POST'});}finally{this.clear();}}
 async data(){
  const owner=this.scope();if(this.dataPromise)return this.dataPromise;
  const work=this.readData(owner);this.dataPromise=work;try{return await work;}finally{if(this.dataPromise===work)this.dataPromise=null;}
 }
 async readData(owner){
  const rows=[];let offset=0;
  const excluded=Object.values(REMOTE_KEYS).join(',');
  for(;;){const batch=await this.request('/rest/v1/mc_cloud_todos?select='+TODO_FIELDS+'&subject=neq.'+encodeURIComponent(IMAGE_SUBJECT)+'&todo_key=not.in.('+excluded+')&or=(analysis_note.neq.'+encodeURIComponent(HIDDEN_SOURCE_NOTE)+',analysis_note.is.null)&order=todo_key&limit=500&offset='+offset);rows.push(...batch);if(batch.length<500)break;offset+=500;}
  const states=[];offset=0;for(;;){const batch=await this.request('/rest/v1/mc_cloud_state?select='+STATE_FIELDS+'&todo_key=not.in.('+excluded+')&order=todo_key&limit=500&offset='+offset);states.push(...batch);if(batch.length<500)break;offset+=500;}
  this.checkScope(owner);this.versions=new Map(rows.map(r=>[r.todo_key,r.synced_at]));
  return {todos:rows,states};
 }
 async original(key){
  const owner=this.scope(),version=this.versions.get(key),cached=this.originals.get(key);
  if(cached&&cached.version===version)return cached.value;
  const rows=await this.request('/rest/v1/mc_cloud_todos?todo_key=eq.'+encodeURIComponent(key)+'&select=original_text,synced_at&limit=1');this.checkScope(owner);
  if(!rows.length)throw Error('找不到原文或目前帳號無權讀取');
  this.versions.set(key,rows[0].synced_at);this.originals.set(key,{version:rows[0].synced_at,value:rows[0].original_text||''});
  if(this.originals.size>24)this.originals.delete(this.originals.keys().next().value);
  return rows[0].original_text||'';
 }
 async images(){
  const owner=this.scope();if(this.imagePromise)return this.imagePromise;
  const work=this.readImages(owner);this.imagePromise=work;try{return await work;}finally{if(this.imagePromise===work)this.imagePromise=null;}
 }
 async readImages(owner){
  const manifest=await this.request('/rest/v1/mc_cloud_todos?subject=eq.'+encodeURIComponent(IMAGE_SUBJECT)+'&select=todo_key,synced_at&order=synced_at.desc,todo_key&limit=100');this.checkScope(owner);
  const changed=manifest.filter(r=>!this.imageRows.has(r.todo_key)||this.imageRows.get(r.todo_key).synced_at!==r.synced_at);
  const updates=changed.length?await this.request('/rest/v1/mc_cloud_todos?subject=eq.'+encodeURIComponent(IMAGE_SUBJECT)+'&todo_key=in.('+changed.map(r=>r.todo_key).join(',')+')&select=todo_key,task,subject,original_text,synced_at'):[];
  this.checkScope(owner);for(const row of updates)this.imageRows.set(row.todo_key,row);
  const keep=new Set(manifest.map(r=>r.todo_key));for(const key of this.imageRows.keys())if(!keep.has(key))this.imageRows.delete(key);
  return manifest.map(r=>this.imageRows.get(r.todo_key)).filter(Boolean);
 }
 async complete(key,completed){return this.request('/rest/v1/rpc/mc_cloud_set_completed',{method:'POST',body:{p_key:key,p_completed:completed}});}
 async setDeadline(key,mode,day=null,clock=null){return this.request('/rest/v1/rpc/mc_cloud_set_deadline',{method:'POST',body:{p_key:key,p_mode:mode,p_date:day,p_time:clock}});}
 async setAssignment(key,value){return this.request('/rest/v1/rpc/mc_cloud_set_assignment',{method:'POST',body:{p_key:key,p_value:value}});}
}
