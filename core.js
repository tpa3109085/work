export function validateConfig(config){
 const url=String(config.supabaseUrl||'').replace(/\/$/,'');
 const key=String(config.publishableKey||'');
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url))throw Error('尚未設定正確的資料服務網址');
 if(key.startsWith('sb_secret_'))throw Error('網站不可使用私密金鑰');
 if(!key.startsWith('sb_publishable_')){
  try{const p=JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));if(p.role!=='anon')throw Error();}
  catch{throw Error('請使用公開發布金鑰');}
 }
 return {url,key};
}
export function taipeiDay(now=new Date()){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const part=t=>parts.find(p=>p.type===t).value;return `${part('year')}-${part('month')}-${part('day')}`;
}
export function validDate(value){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return false;
 const d=new Date(value+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value;
}
export function validTime(value){return /^([01]\d|2[0-3]):[0-5]\d$/.test(value||'');}
export function deadline(row,state={},now=new Date()){
 const manual=!!state.deadline_updated_at&&state.deadline_mode==='manual';
 const day=manual?state.manual_date:row.analysis_date;
 const rawTime=manual?state.manual_time:row.analysis_time;
 const clock=rawTime?rawTime.slice(0,5):null;
 if(day&&!validDate(day))throw Error('期限日期不合法');
 if(clock&&!validTime(clock))throw Error('期限時間不合法');
 const due=day?new Date(`${day}T${clock?clock+':00':'23:59:59'}+08:00`):null;
 const status=!due?'未設定':now>due?'已逾期':day===taipeiDay(now)?'今天到期':'未到期';
 return {manual,day:day||'',clock:clock||'',status,label:manual?'手動設定':'分析期限',
  display:day?(clock?`${day} ${clock}`:`${day}（${manual?'當日截止':'時間待核對'}）`):(manual?'未設定':row.analysis_note||'未設定')};
}
export function mergeRows(todos,states,now=new Date()){
 const map=new Map(states.map(s=>[s.todo_key,s]));
 const visible=todos.filter(row=>row.todo_key!=='603f861f4871965ee0ba166853dddbc00f27ab98b094089fcff0c9022c073cfa'&&!(row.todo_key==='a'.repeat(64)&&row.subject==='虚构测试资料，不是真实 LINE 聊天'&&row.task==='【连接测试】确认线上待办能够读取和保存'));
 return visible.map(row=>{const state=map.get(row.todo_key)||{};return {...row,state,
  completed:state.completed_updated_at?!!state.completed:!!row.source_completed,
  assignment:state.assignment_updated_at?(state.assignment_status||''):'',deadline:deadline(row,state,now)};})
 .sort((a,b)=>Number(a.completed)-Number(b.completed)||(['P1','P2','P3','P4','待確認'].indexOf(a.priority)-['P1','P2','P3','P4','待確認'].indexOf(b.priority))||(a.deadline.day||'9999').localeCompare(b.deadline.day||'9999')||a.todo_key.localeCompare(b.todo_key));
}
