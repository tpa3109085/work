import {REMOTE_KEYS,REMOTE_KIND,onlineHost,remoteRecord} from './remote.js?v=20261127-logout-home1';
export function readRegistry(rows){try{const result=JSON.parse(rows.find(x=>x.todo_key===REMOTE_KEYS.registry)?.original_text||'null');return result?.kind===REMOTE_KIND?result:null;}catch{return null;}}
export class GroupSettings{
 constructor(cloud,panel,changed){this.cloud=cloud;this.panel=panel;this.changed=changed;this.registry={groups:[],removed:[]};this.busy=false;this.signature='';}
 update(registry){if(!registry)return;this.registry=registry;const signature=JSON.stringify(registry);if(signature===this.signature)return;this.signature=signature;this.render();this.changed(registry);}
 render(){
  const host=this.panel.querySelector('.group-grid');host.replaceChildren();
  const make=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
  for(const item of this.registry.groups||[]){
   const row=make('div');row.className='group-row';row.append(make('strong',item.group_name));
   for(const [field,label] of [['export_enabled','每日 10:00、18:00 匯出'],['analyze_enabled','繼續分析管制']]){const wrap=make('label'),box=make('input');box.type='checkbox';box.checked=!!item[field];box.disabled=this.busy;box.onchange=()=>this.change(item.group_name,field,box.checked);wrap.append(box,make('span',label));row.append(wrap);}
   const remove=make('button','刪除排程');remove.type='button';remove.className='group-remove';remove.disabled=this.busy;remove.onclick=()=>{if(confirm('刪除「'+item.group_name+'」的排程並移除來源選項？聊天、圖片與待辦資料保留。'))this.change(item.group_name,null,null,'remove');};row.append(remove);host.append(row);
  }
  if(!(this.registry.groups||[]).length)host.append(make('p','目前沒有群組排程，可在上方輸入名稱加入。'));
 }
 async change(group,field,enabled,action){
  if(this.busy)return;this.busy=true;this.render();const status=this.panel.querySelector('.group-message');status.textContent='正在保存並同步群組設定……';
  try{
   if(this.cloud.local){await this.cloud.changeGroup(group,field,enabled,action);this.update((await this.cloud.control()).registry);}
   else{
    let {states}=await this.cloud.control();const host=remoteRecord(states,REMOTE_KEYS.host),previous=remoteRecord(states,REMOTE_KEYS.settings_request),response=remoteRecord(states,REMOTE_KEYS.settings_response);
    if(!onlineHost(host))throw Error('本機未連線，請稍後再試');
    if(previous&&Date.now()-new Date(previous.serverUpdatedAt).getTime()<600000&&response?.request_id!==previous.id)throw Error('另一項群組設定正在保存，請稍後再試');
    const id=crypto.randomUUID().replaceAll('-','');await this.cloud.setAssignment(REMOTE_KEYS.settings_request,JSON.stringify({kind:REMOTE_KIND,id,device:host.device,command:action==='remove'?'group_remove':'group_set',group,field,enabled}));
    let done=false;
    for(let attempt=0;attempt<30;attempt++){await new Promise(resolve=>setTimeout(resolve,2000));const data=await this.cloud.control();const answer=remoteRecord(data.states,REMOTE_KEYS.settings_response);if(answer?.request_id===id){if(answer.status!=='success')throw Error(answer.message||'保存失敗');const item=data.registry.groups?.find(x=>x.group_name===group);if(action==='remove'?!item:item?.[field]===enabled){this.update(data.registry);done=true;break;}}}
    if(!done)throw Error('尚未收到本機確認；請查看連線狀態，勿重複提交');
   }
   status.textContent='群組設定已保存，來源選項已同步更新。';
  }catch(error){status.textContent=error.message;}
  finally{this.busy=false;this.render();}
 }
}
