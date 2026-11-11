import {validateConfig} from './core.js?v=20261112-home2';
export class Cloud{
 constructor(config,storage=localStorage,fetcher=globalThis.fetch.bind(globalThis)){Object.assign(this,validateConfig(config));this.storage=storage;this.fetcher=fetcher;this.storageKey='messagecontrol-auth:'+this.url;this.refreshing=null;}
 session(){try{return JSON.parse(this.storage.getItem(this.storageKey)||'null');}catch{return null;}}
 store(session){this.storage.setItem(this.storageKey,JSON.stringify({...session,expires_at:Date.now()+session.expires_in*1000}));}
 clear(){this.storage.removeItem(this.storageKey);}
 async request(path,{method='GET',body,auth=true}={}){
  let session=this.session();
  if(auth&&session&&session.expires_at<Date.now()+30000){await this.refresh();session=this.session();}
  if(auth&&!session)throw Error('請先登入');
  const response=await this.fetcher(this.url+path,{method,headers:{apikey:this.key,...(auth?{Authorization:'Bearer '+session.access_token}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const text=await response.text();let result;try{result=text?JSON.parse(text):null;}catch{throw Error('資料服務回覆格式不正確');}
  if(!response.ok){if(response.status===401&&auth)this.clear();throw Error(response.status===401?'登入已失效，請重新登入':result?.msg||result?.message||result?.error_description||'資料服務暫時無法使用');}
  return result;
 }
 async login(email,password){const session=await this.request('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password},auth:false});this.store(session);return session;}
 async refresh(){
  if(this.refreshing)return this.refreshing;
  const session=this.session();if(!session)throw Error('請先登入');
  this.refreshing=this.request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:session.refresh_token},auth:false}).then(s=>this.store(s)).catch(e=>{this.clear();throw e;}).finally(()=>{this.refreshing=null;});return this.refreshing;
 }
 async logout(){try{await this.request('/auth/v1/logout',{method:'POST'});}finally{this.clear();}}
 async data(){
  const rows=[];let offset=0;
  for(;;){const batch=await this.request('/rest/v1/mc_cloud_todos?select=*&order=todo_key&limit=500&offset='+offset);rows.push(...batch);if(batch.length<500)break;offset+=500;}
  const states=[];offset=0;for(;;){const batch=await this.request('/rest/v1/mc_cloud_state?select=*&order=todo_key&limit=500&offset='+offset);states.push(...batch);if(batch.length<500)break;offset+=500;}
  return {todos:rows,states};
 }
 async complete(key,completed){return this.request('/rest/v1/rpc/mc_cloud_set_completed',{method:'POST',body:{p_key:key,p_completed:completed}});}
 async setDeadline(key,mode,day=null,clock=null){return this.request('/rest/v1/rpc/mc_cloud_set_deadline',{method:'POST',body:{p_key:key,p_mode:mode,p_date:day,p_time:clock}});}
 async setAssignment(key,value){return this.request('/rest/v1/rpc/mc_cloud_set_assignment',{method:'POST',body:{p_key:key,p_value:value}});}
}
