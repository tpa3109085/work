import {traditionalUi} from './locale.js?v=20261127-home-worklist2';
import {REMOTE_KEYS,REMOTE_KIND} from './remote.js?v=20261127-home-worklist2';
import {AUTOMATION_KEY} from './automation.js?v=20261127-home-worklist2';
export function localRows(data){
 const stamp='2000-01-01T00:00:00Z';
 const todos=data.todos.map(row=>({todo_key:row.key,task:row.task,subject:row.subject,source_type:row.source_type==='LINE'?'LINE':'Email',assigned_to:row.assigned_to,priority:row.priority,analysis_date:row.analysis_deadline_date||null,analysis_time:row.analysis_deadline_time||null,analysis_note:row.analysis_due_display,source_completed:!!row.completed,original_text:'',source_url:row.source_url}));
 const states=data.todos.map(row=>({todo_key:row.key,completed:!!row.completed,completed_updated_at:stamp,deadline_mode:row.deadline_mode==='manual'?'manual':'analysis',manual_date:row.deadline_date||null,manual_time:row.deadline_time||null,deadline_updated_at:stamp,assignment_status:row.assignment_status||'',assignment_updated_at:stamp}));
 for(const item of data.images||[])todos.push({todo_key:item.image_key,subject:'MessageControl 圖片來源 v1',task:'LINE 圖片預覽（系統資料）',original_text:JSON.stringify(item)});
 states.push({todo_key:AUTOMATION_KEY,assignment_status:JSON.stringify(data.automation)});
 return {todos,states,registry:{groups:data.groups||[],removed:data.removed_groups||[]}};
}
export class LocalCloud{
 constructor(fetcher=globalThis.fetch.bind(globalThis),storage=localStorage){this.local=true;this.url='local-messagecontrol';this.fetcher=fetcher;this.storage=storage;}
 session(){return {local:true};}
 async get(path,body){const response=await this.fetcher(path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{cache:'no-store'});const value=await response.json();if(!response.ok||value.ok===false)throw Error(traditionalUi(value.error||'本機資料服務暫時無法使用'));return value;}
 async data(){return localRows(await this.get('/api/todos'));}
 async original(key){return this.get('/api/original/'+key);}
 complete(key,completed){return this.get('/api/status',{key,completed});}
 setDeadline(key,mode,day=null,clock=null){return this.get('/api/deadline',{key,mode,deadline_date:day,deadline_time:clock});}
 setAssignment(key,value){if(key===REMOTE_KEYS.request){const command=JSON.parse(value);return this.get('/api/line-job',{group:command.group,remote_request_id:command.id});}return this.get('/api/assignment',{key,status_text:value});}
 changeGroup(group,field,enabled,action){return this.get('/api/line-group',{group,field,enabled,action});}
 async control(){const data=await this.get('/api/control-state');const at=new Date().toISOString(),device='0'.repeat(32),job=data.job||{},id=job.remote_request_id||job.id;const value=(todo_key,data)=>({todo_key,assignment_status:JSON.stringify({kind:REMOTE_KIND,...data}),assignment_updated_at:at});const states=[value(REMOTE_KEYS.host,{device,status:['queued','exporting','importing','analyzing'].includes(job.status)?'busy':'ready'})];if(id){states.push(value(REMOTE_KEYS.request,{id,device}));states.push(value(REMOTE_KEYS.response,{...job,request_id:id,device}));}return {states,registry:data.registry,connection:data.connection};}
 async request(){return (await this.control()).states;}
}
