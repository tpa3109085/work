import {traditionalUi} from './locale.js?v=20261127-odis-polish1';
export const REMOTE_KEYS={"request": "a6d53352a372eec9d689ce04fd0be6df305ada0214245cf3a2a535b52097d625", "response": "dd17f71beb2aa8a465bec86e506d48aee500758d7cef28a575e1935947770d39", "host": "2be69bed40f0b882057ce5b6bf1b27c601a02749436588bd94b08730bf3a4929", "registry": "2a19c9a49803824ad8541487e6639f1e650f39cce701d811ab5b476d2ec4d551", "settings_request": "b7c3a7a145165ee7a3d17d31023e18043cd6d34087a0b4ebaced0f78f0246f02", "settings_response": "492bf00dbb1651dafcffc6cbfa9087a501bb8a83143a6c27c2c7fa284a43261b"};
export const REMOTE_KIND='mc_remote_line_v1';
const ACTIVE=new Set(['queued','exporting','importing','analyzing']);
export function remoteRecord(states,key){try{const row=states.find(x=>x.todo_key===key);const value=JSON.parse(row?.assignment_status||'null');return value?.kind===REMOTE_KIND?{...value,serverUpdatedAt:row.assignment_updated_at}:null;}catch{return null;}}
export function onlineHost(host,now=Date.now()){const age=now-new Date(host?.serverUpdatedAt||'').getTime();return /^[a-f0-9]{32}$/.test(host?.device||'')&&age>=-60000&&age<180000;}
export function validateRemoteGroup(value){const group=String(value||'').trim();if(!group||group.length>100||/[\\/:*?"<>|\x00-\x1f]/.test(group)||['.','..'].includes(group))throw Error('請輸入完整群組名稱（最多100字，不可包含路徑符號）');return group;}
export class RemoteControl{
 constructor(cloud,panel){this.cloud=cloud;this.panel=panel;this.form=panel.querySelector('form');this.button=panel.querySelector('button[type=submit]');this.input=panel.querySelector('input');this.connection=panel.querySelector('.remote-connection');this.progress=panel.querySelector('.remote-progress');this.storageKey='mc-remote-last:'+cloud.url;this.pending=false;this.polling=false;this.form.addEventListener('submit',event=>{event.preventDefault();this.submit();});}
 async refresh({force=false}={}){
  const scope=this.cloud.local?'local':this.cloud.session()?.user?.id||'session';
  if(this.scope!==scope){this.scope=scope;this.host=null;this.lastPoll=0;this.lastFailure=0;this.activeRequest=false;this.progress.textContent='';this.button.disabled=true;}
  const interval=this.lastFailure?60000:this.host?.status==='busy'||this.pending||this.activeRequest?5000:60000;
  if(this.polling||!this.cloud.session()||(!force&&Date.now()-(this.lastPoll||0)<interval))return;this.polling=true;this.lastPoll=Date.now();
  try{const {states,registry,connection}=await this.cloud.control();this.lastFailure=0;this.update(states);this.onRegistry?.(registry);const status=document.getElementById('connectionStatus');if(status){const good=this.cloud.local?connection?.status==='connected'&&Date.now()-new Date(connection.at).getTime()<90000:onlineHost(this.host);status.textContent=good?'Supabase 同步連線正常 · 自動續期與重連已啟用':'Supabase 正在等待本機連線或重新連線；既有資料保留';status.dataset.status=good?'connected':'reconnecting';}}
  catch(error){this.lastFailure=Date.now();this.connection.textContent='無法確認本機連線：'+traditionalUi(error.message);this.button.disabled=true;const status=document.getElementById('connectionStatus');if(status){status.textContent='連線暫時中斷，保留登入並自動重試';status.dataset.status='reconnecting';}}
  finally{this.polling=false;}
 }
 update(states){
  const host=remoteRecord(states,REMOTE_KEYS.host),response=remoteRecord(states,REMOTE_KEYS.response),request=remoteRecord(states,REMOTE_KEYS.request);this.host=host;
  const online=onlineHost(host);this.connection.textContent=this.cloud.local?'本機直接連線，可立即操作':online?(host.status==='busy'?'本機正在執行 LINE 任務':'本機已連線，可接收任務'):'本機未連線：請開啟電腦及 MessageControl 雲端同步。';
  const waiting=request&&Date.now()-new Date(request.serverUpdatedAt).getTime()<600000&&!(response?.request_id===request.id&&!ACTIVE.has(response.status));
  this.activeRequest=!!waiting;
  this.button.disabled=!online||host?.status==='busy'||!!waiting||this.pending;
  const last=this.cloud.storage.getItem(this.storageKey);
  if(response&&(!last||response.request_id===last)){
   const labels={queued:'等待執行',exporting:'正在匯出',importing:'正在匯入及處理圖片',analyzing:'正在分析',success:'完成',partial:'部分完成',failed:'失敗',needs_window:'需要檢查 LINE 視窗',paused:'已暫停',rejected:'未執行',unknown:'待確認'};
   this.progress.textContent=[response.group||'',labels[response.status]||response.status,traditionalUi(response.message||''),response.since?'分析自 '+response.since.slice(0,10)+' 至匯出當日':'',response.analyzed!==undefined?'已分析 '+response.analyzed+' 段 · 新增待辦 '+(response.tasks||0)+' 項':'',traditionalUi(response.error||'')].filter(Boolean).join(' · ');
   this.progress.dataset.status=response.status;
  }else if(last&&request?.id===last){this.progress.textContent=waiting?'任務已送出，等待本機接收……':'任務未在有效期內收到回報，請重新提交。';}
 }
 async submit(){
  this.pending=true;this.button.disabled=true;
  try{
   const group=validateRemoteGroup(this.input.value);
   const states=await this.cloud.request('/rest/v1/mc_cloud_state?todo_key=in.('+Object.values(REMOTE_KEYS).join(',')+')&select=todo_key,assignment_status,assignment_updated_at');this.update(states);
   const host=remoteRecord(states,REMOTE_KEYS.host),existing=remoteRecord(states,REMOTE_KEYS.request),response=remoteRecord(states,REMOTE_KEYS.response);
   if(!onlineHost(host))throw Error('本機未連線，請先啟動本機電腦和雲端同步');
   if(host.status==='busy'||(existing&&Date.now()-new Date(existing.serverUpdatedAt).getTime()<600000&&!(response?.request_id===existing.id&&!ACTIVE.has(response.status))))throw Error('已有任務正在等待或執行，請等候完成');
   const id=crypto.randomUUID().replaceAll('-','');
   await this.cloud.setAssignment(REMOTE_KEYS.request,JSON.stringify({kind:REMOTE_KIND,id,device:host.device,command:'export_analyze',group}));
   this.cloud.storage.setItem(this.storageKey,id);this.progress.textContent='任務已送出，等待本機接收……';this.progress.dataset.status='queued';
  }catch(error){this.progress.textContent='無法開始：'+traditionalUi(error.message);this.progress.dataset.status='failed';}
  finally{this.pending=false;await this.refresh({force:true});}
 }
}
