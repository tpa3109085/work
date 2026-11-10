import config from './config.js';
import {Cloud} from './api.js';
import {deadline,mergeRows,validDate,validTime} from './core.js';
const $=id=>document.getElementById(id);
let cloud,all=[],editing=null,busy=false;
try{cloud=new Cloud(config);}catch{$('setup').hidden=false;$('loginButton').disabled=true;}
function showLogin(){all=[];$('rows').replaceChildren();$('workspace').hidden=true;$('loginPanel').hidden=false;$('logout').hidden=true;}
function node(tag,text,className){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;}
function original(row){const details=node('details',undefined,'original');const summary=node('summary','查看原文');const content=node('pre',row.original_text||'原文尚未同步','original-text');details.append(summary,content);return details;}
function assignment(row){
 const cell=node('td',undefined,'assignment');const editor=node('textarea',row.assignment,'assignment-editor');editor.maxLength=2000;editor.setAttribute('aria-label','交辦情形');editor.placeholder='例如：已交辦、追蹤中、待回覆';
 const save=node('button','保存','secondary small');save.addEventListener('click',async()=>{const value=editor.value.trim();save.disabled=true;try{await cloud.setAssignment(row.todo_key,value);await load();}catch(e){$('error').textContent=e.message;}finally{save.disabled=false;}});
 cell.append(editor,save);return cell;
}
function render(){
 const pending=all.filter(x=>!x.completed),count=s=>pending.filter(x=>x.deadline.status===s).length;
 $('stats').replaceChildren(...[['待辦總數',all.length],['未完成',pending.length],['已完成',all.length-pending.length],['逾期未完成',count('已逾期')],['今天到期',count('今天到期')]].map(([label,value])=>{const card=node('div',undefined,'stat');card.append(node('span',label),node('strong',String(value)));return card;}));
 const urgent=pending.filter(x=>x.priority==='P1').length;
 $('reminders').hidden=!(urgent||count('已逾期')||count('今天到期'));
 $('reminders').textContent=`期限提醒：逾期未完成 ${count('已逾期')} 項 · 今天到期 ${count('今天到期')} 項 · P1 未完成 ${urgent} 項`;
 const query=$('search').value.toLowerCase().trim();
 const rows=all.filter(x=>(!$('source').value||x.source_type===$('source').value)&&(!$('priority').value||x.priority===$('priority').value)&&(!$('status').value||x.deadline.status===$('status').value)&&(!$('completion').value||(x.completed?$('completion').value==='done':$('completion').value==='pending'))&&(!query||[x.task,x.subject,x.assigned_to].join(' ').toLowerCase().includes(query)));
 $('empty').hidden=!!rows.length;
 $('rows').replaceChildren(...rows.map(x=>{
  const row=node('tr',undefined,x.completed?'done':'');const check=node('input',undefined,'check');check.type='checkbox';check.checked=x.completed;check.setAttribute('aria-label','標記完成');
  check.addEventListener('change',async()=>{check.disabled=true;try{await cloud.complete(x.todo_key,check.checked);await load();}catch(e){check.checked=x.completed;$('error').textContent=e.message;}finally{check.disabled=false;}});
  const completed=node('td');completed.append(check);const priority=node('td',x.priority,'priority '+x.priority);
  const task=node('td',undefined,'task');task.append(node('div',x.task,'task-title'),node('div',`${x.source_type} · ${x.subject||''}`,'task-note'),original(x));
  const owner=node('td',x.assigned_to||'待確認');const due=node('td');due.append(node('span',x.deadline.display,'badge '+(x.deadline.status==='已逾期'?'overdue':x.deadline.status==='今天到期'?'today':'')),node('div',x.deadline.status+' · '+x.deadline.label,'task-note'));
  const edit=node('button','修改期限','secondary small');edit.addEventListener('click',()=>openDeadline(x));due.append(edit);row.append(completed,priority,task,owner,assignment(x),due);return row;
 }));
}
async function load(){
 if(editing)return;
 try{const data=await cloud.data();all=mergeRows(data.todos,data.states);$('loginPanel').hidden=true;$('workspace').hidden=false;$('logout').hidden=false;$('error').textContent='';$('updated').textContent='資料讀取時間：'+new Date().toLocaleString('zh-TW',{timeZone:'Asia/Taipei'})+' · 台北時間';render();}
 catch(e){if(!cloud.session())showLogin();$('loginError').textContent=$('error').textContent=e.message;}
}
function openDeadline(row){editing=row;$('deadlineTask').textContent=row.task;$('analysisDeadline').textContent='分析期限：'+deadline(row).display;$('deadlineDate').value=row.deadline.day;$('deadlineTime').value=row.deadline.clock;$('deadlineError').textContent='';$('deadlineDialog').showModal();}
async function saveDeadline(mode,clear=false){
 if(!editing||busy)return;const day=clear?null:$('deadlineDate').value||null,clock=clear?null:$('deadlineTime').value||null;
 if(mode==='manual'&&!clear&&(!validDate(day)||(clock&&!validTime(clock)))){$('deadlineError').textContent='請選擇有效日期與時間。';return;}
 busy=true;const buttons=[...$('deadlineDialog').querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);
 try{await cloud.setDeadline(editing.todo_key,mode,mode==='manual'?day:null,mode==='manual'?clock:null);editing=null;$('deadlineDialog').close();await load();}
 catch(e){$('deadlineError').textContent=e.message;}finally{busy=false;buttons.forEach(b=>b.disabled=false);}
}
$('loginForm').addEventListener('submit',async e=>{e.preventDefault();$('loginButton').disabled=true;$('loginError').textContent='';try{await cloud.login($('email').value.trim(),$('password').value);$('password').value='';await load();}catch(error){$('loginError').textContent=error.message;}finally{$('loginButton').disabled=false;}});
$('logout').addEventListener('click',async()=>{try{await cloud.logout();}catch{}showLogin();});
$('refresh').addEventListener('click',load);
for(const id of ['source','priority','status','completion'])$(id).addEventListener('change',render);$('search').addEventListener('input',render);
$('saveDeadline').addEventListener('click',()=>saveDeadline('manual'));$('resetDeadline').addEventListener('click',()=>saveDeadline('analysis'));$('clearDeadline').addEventListener('click',()=>saveDeadline('manual',true));
$('cancelDeadline').addEventListener('click',()=>{if(!busy){editing=null;$('deadlineDialog').close();load();}});$('deadlineDialog').addEventListener('cancel',e=>{if(busy)e.preventDefault();else editing=null;});
if(cloud?.session())load();setInterval(()=>{if(cloud?.session()&&!editing)load();},30000);
