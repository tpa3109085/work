import {REMOTE_KEYS} from './remote.js?v=20261119-mail-coverage1';
import {validateConfig} from './core.js?v=20261119-mail-coverage1';
export class Cloud{
 constructor(config,storage=localStorage,fetcher=globalThis.fetch.bind(globalThis)){Object.assign(this,validateConfig(config));this.storage=storage;this.fetcher=fetcher;this.storageKey='messagecontrol-auth:'+this.url;this.refreshing=null;}
 session(){try{return JSON.parse(this.storage.getItem(this.storageKey)||'null');}catch{return null;}}
 store(session){this.storage.setItem(this.storageKey,JSON.stringify({...session,expires_at:Date.now()+session.expires_in*1000}));}
 clear(){this.storage.removeItem(this.storageKey);}
 async request(path,{method='GET',body,auth=true,retried=false}={}){
  let session=this.session();
  if(auth&&session&&session.expires_at<Date.now()+30000){await this.refresh();session=this.session();}
  if(auth&&!session)throw Error('請先登入');
  const response=await this.fetcher(this.url+path,{method,headers:{apikey:this.key,...(auth?{Authorization:'Bearer '+session.access_token}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const text=await response.text();let result;try{result=text?JSON.parse(text):null;}catch{throw Error('資料服務回覆格式不正確');}
  if(!response.ok){if(response.status===401&&auth&&!retried){await this.refresh();return this.request(path,{method,body,auth,retried:true});}if(response.status===401&&auth)this.clear();const error=Error(response.status===401?'登入已失效，請重新登入':result?.msg||result?.message||result?.error_description||'資料服務暫時無法使用');error.status=response.status;throw error;}
  return result;
 }
 async login(email,password){const session=await this.request('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password},auth:false});this.store(session);return session;}
 async refresh(){
  if(this.refreshing)return this.refreshing;
  const session=this.session();if(!session)throw Error('請先登入');
  const perform=async()=>{
   const current=this.session();
   if(current?.access_token!==session.access_token&&current?.expires_at>Date.now()+30000)return;
   try{const next=await this.request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:current?.refresh_token||session.refresh_token},auth:false});this.store(next);}
   catch(error){if([400,401].includes(error.status))this.clear();throw error;}
  };
  this.refreshing=(globalThis.navigator?.locks?globalThis.navigator.locks.request('mc-auth-refresh:'+this.url,perform):perform()).finally(()=>{this.refreshing=null;});return this.refreshing;
 }
 async control(){const [states,rows]=await Promise.all([this.request('/rest/v1/mc_cloud_state?todo_key=in.('+Object.values(REMOTE_KEYS).join(',')+')&select=todo_key,assignment_status,assignment_updated_at'),this.request('/rest/v1/mc_cloud_todos?todo_key=eq.'+REMOTE_KEYS.registry+'&select=original_text')]);let registry={groups:[],removed:[]};try{const value=JSON.parse(rows[0]?.original_text||'null');if(value?.kind==='mc_remote_line_v1')registry=value;}catch{}return {states,registry};}
 async logout(){try{await this.request('/auth/v1/logout',{method:'POST'});}finally{this.clear();}}
 async data(){
  const rows=[];let offset=0;
  for(;;){const batch=await this.request('/rest/v1/mc_cloud_todos?select=*&subject=neq.'+encodeURIComponent('MessageControl 圖片來源 v1')+'&order=todo_key&limit=500&offset='+offset);rows.push(...batch);if(batch.length<500)break;offset+=500;}
  const images=await this.request('/rest/v1/mc_cloud_todos?select=*&subject=eq.'+encodeURIComponent('MessageControl 圖片來源 v1')+'&order=synced_at.desc&limit=100');rows.push(...images);
  const states=[];offset=0;for(;;){const batch=await this.request('/rest/v1/mc_cloud_state?select=*&order=todo_key&limit=500&offset='+offset);states.push(...batch);if(batch.length<500)break;offset+=500;}
  return {todos:rows,states};
 }
 async complete(key,completed){return this.request('/rest/v1/rpc/mc_cloud_set_completed',{method:'POST',body:{p_key:key,p_completed:completed}});}
 async setDeadline(key,mode,day=null,clock=null){return this.request('/rest/v1/rpc/mc_cloud_set_deadline',{method:'POST',body:{p_key:key,p_mode:mode,p_date:day,p_time:clock}});}
 async setAssignment(key,value){return this.request('/rest/v1/rpc/mc_cloud_set_assignment',{method:'POST',body:{p_key:key,p_value:value}});}
}
