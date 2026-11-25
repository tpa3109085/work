import {calendarEventUrl} from './calendar.js?v=20261125-portable-egress1';
import {LocalCloud} from './local.js?v=20261125-portable-egress1';
import {GroupSettings,readRegistry} from './groups.js?v=20261125-portable-egress1';
import {RemoteControl} from './remote.js?v=20261125-portable-egress1';
import {matchesSource,renderSourceOptions} from './sources.js?v=20261125-portable-egress1';
import {renderOriginal} from './originals.js?v=20261125-portable-egress1';
import {readImages,renderImages} from './images.js?v=20261125-portable-egress1';
import {inDueWindow,matchesDueFilter} from './tracking.js?v=20261125-portable-egress1';
import {readAutomation,renderAutomation} from './automation.js?v=20261125-portable-egress1';
import {selectDashboardView} from './dashboard.js?v=20261125-portable-egress1';
import {AssignmentDrafts,sortTasks,resetFilters} from './workspace.js?v=20261125-portable-egress1';
import config from './config.js?v=20261125-portable-egress1';
import {Cloud} from './api.js?v=20261125-portable-egress1';
import {deadline,mergeRows,validDate,validTime} from './core.js?v=20261125-portable-egress1';
const $=id=>document.getElementById(id);
let remote,groupControls;
let removedSources=[];
let cloud,all=[],editing=null,busy=false;
let galleryRows=[],galleryLoaded=false,galleryOwner=null;
const drafts=new AssignmentDrafts();
try{cloud=['127.0.0.1','localhost'].includes(location.hostname)?new LocalCloud():new Cloud(config);}catch{$('setup').hidden=false;$('loginButton').disabled=true;}
if(cloud){remote=new RemoteControl(cloud,$('remoteControl'));groupControls=new GroupSettings(cloud,$('groupSettingsPanel'),registry=>{removedSources=registry.removed||[];renderSourceOptions($('source'),all,removedSources);if(!document.activeElement?.matches('textarea,input'))render();});remote.onRegistry=registry=>groupControls.update(registry);setInterval(()=>{if(!document.hidden)remote.refresh();},5000);if(cloud.local){$('localShortcut').hidden=true;$('loginPanel').hidden=true;$('workspace').hidden=false;}}
function showLogin(){all=[];galleryRows=[];galleryLoaded=false;galleryOwner=null;renderImages([], $('imagesPanel'));$('rows').replaceChildren();$('workspace').hidden=true;$('loginPanel').hidden=false;$('logout').hidden=true;}
function node(tag,text,className){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;}
function original(row){const details=node('details',undefined,'original');const summary=node('summary','查看原文');const content=node('div',undefined,'original-content');const draw=()=>renderOriginal(content,row.original_text,{task:row.task,priority:row.priority,assigned_to:row.assigned_to,deadline:row.deadline.display,completed:row.completed,assignment:row.assignment});draw();let loading=false;details.addEventListener('toggle',async()=>{if(!details.open||row.original_text||loading)return;loading=true;content.textContent='正在載入原文……';try{row.original_text=await cloud.original(row.todo_key);draw();}catch(error){content.textContent=error.message;}finally{loading=false;}});details.append(summary,content);return details;}
function assignment(row){
 const cell=node('td',undefined,'assignment');const editor=node('textarea',undefined,'assignment-editor');editor.value=drafts.value(row.todo_key,row.assignment);editor.maxLength=2000;editor.setAttribute('aria-label','交辦情形');editor.placeholder='例如：已交辦、追蹤中、待回覆';
 const actions=node('div',undefined,'assignment-actions'),save=node('button','保存','secondary small'),cancel=node('button','還原','secondary small'),status=node('span',undefined,'assignment-status');status.setAttribute('aria-live','polite');
 const sync=()=>{const dirty=drafts.has(row.todo_key),conflict=drafts.conflict(row.todo_key);editor.dataset.dirty=String(dirty);save.disabled=cancel.disabled=!dirty;status.dataset.state=conflict?'conflict':dirty?'dirty':'saved';status.textContent=conflict?'其他裝置已更新，保存將採用目前輸入內容。':dirty?'尚未保存 · 切換篩選會保留此內容':'已保存';};
 editor.addEventListener('input',()=>{drafts.set(row.todo_key,editor.value,row.assignment);sync();});
 cancel.addEventListener('click',()=>{drafts.discard(row.todo_key);editor.value=row.assignment;sync();});
 save.addEventListener('click',async()=>{
  const value=editor.value.trim();editor.value=value;drafts.set(row.todo_key,value,row.assignment);editor.disabled=save.disabled=cancel.disabled=true;status.textContent='正在保存……';
  try{await cloud.setAssignment(row.todo_key,value);drafts.saved(row.todo_key,value);row.assignment=value;const current=all.find(x=>x.todo_key===row.todo_key);if(current)current.assignment=value;$('saveNotice').textContent='交辦情形已保存';sync();await load();}
  catch(e){status.textContent='保存失敗，輸入內容已保留：'+e.message;status.dataset.state='error';$('error').textContent=e.message;}
  finally{editor.disabled=false;save.disabled=cancel.disabled=!drafts.has(row.todo_key);}
 });
 sync();actions.append(save,cancel);cell.append(editor,actions,status);return cell;
}
function render(){
 const pending=all.filter(x=>!x.completed),count=s=>pending.filter(x=>x.deadline.status===s).length;
 $('stats').replaceChildren(...[['今日待辦',count('今天到期'),'today','今日截止 · 優先處理'],['逾期未完成',count('已逾期'),'overdue','已超過期限 · 立即追蹤'],['未完成',pending.length,'pending','所有待處理事項'],['已完成',all.length-pending.length,'done','查看完成紀錄'],['待辦總數',all.length,'all','查看全部事項']].map(([label,value,view,hint])=>{const card=node('button',undefined,'stat stat-'+view);card.type='button';card.dataset.view=view;card.setAttribute('aria-pressed','false');card.append(node('span',label),node('strong',String(value)),node('small',hint+' ↗'));card.addEventListener('click',()=>selectDashboard(view));return card;}));
 $('deadlineTracking').replaceChildren(...[['7 日內到期','next7'],['明日到期','tomorrow']].map(([label,view])=>{const card=node('button',undefined,'stat stat-'+view);card.type='button';card.dataset.view=view;card.append(node('span',label),node('strong',String(all.filter(x=>inDueWindow(x,view)).length)),node('small','點選查看相關事項 ↗'));card.addEventListener('click',()=>selectDashboard(view));return card;}));
 const urgent=pending.filter(x=>x.priority==='P1').length;
 $('reminders').hidden=!(urgent||count('已逾期')||count('今天到期'));
 $('reminders').textContent=`期限提醒：逾期未完成 ${count('已逾期')} 項 · 今天到期 ${count('今天到期')} 項 · P1 未完成 ${urgent} 項`;
 const query=$('search').value.toLowerCase().trim();
 const rows=sortTasks(all.filter(x=>matchesSource(x,$('source').value)&&(!$('priority').value||x.priority===$('priority').value)&&matchesDueFilter(x,$('status').value)&&(!$('completion').value||(x.completed?$('completion').value==='done':$('completion').value==='pending'))&&(!query||[x.task,x.subject,x.assigned_to,x.assignment].join(' ').toLowerCase().includes(query))),$('sort').value);
 $('filterSummary').textContent=[$('completion').selectedOptions[0]?.textContent,$('source').selectedOptions[0]?.textContent,$('status').selectedOptions[0]?.textContent].filter(Boolean).join(' · ');
 $('resultCount').textContent=`顯示 ${rows.length} 項 · 共 ${all.length} 項待辦`;
 $('empty').hidden=!!rows.length;
 $('rows').replaceChildren(...rows.map(x=>{
  const row=node('tr',undefined,x.completed?'done':x.deadline.status==='已逾期'?'overdue-row':x.deadline.status==='今天到期'?'today-row':'');const check=node('input',undefined,'check');check.type='checkbox';check.checked=x.completed;check.setAttribute('aria-label','標記完成');
  check.addEventListener('change',async()=>{check.disabled=true;try{await cloud.complete(x.todo_key,check.checked);await load();}catch(e){check.checked=x.completed;$('error').textContent=e.message;}finally{check.disabled=false;}});
  const completed=node('td');completed.append(check);const priority=node('td',x.priority,'priority '+x.priority);
  const task=node('td',undefined,'task');const source=original(x);const title=node('button',x.task,'task-title task-link');title.type='button';title.setAttribute('aria-expanded','false');title.addEventListener('click',()=>{source.open=!source.open;title.setAttribute('aria-expanded',String(source.open));});source.addEventListener('toggle',()=>title.setAttribute('aria-expanded',String(source.open)));task.append(title,node('div',`${x.source_type} · ${x.subject||''}`,'task-note'),source);
  const owner=node('td',x.assigned_to||'待確認','owner');const due=node('td',undefined,'deadline-cell');due.append(node('span',x.deadline.display,'badge '+(x.deadline.status==='已逾期'?'overdue':x.deadline.status==='今天到期'?'today':'')),node('div',x.deadline.status+' · '+x.deadline.label,'task-note'));
  const edit=node('button','修改期限','secondary small');edit.addEventListener('click',()=>openDeadline(x));due.append(edit);const calendar=node('button','加入 Google 日曆','secondary small calendar-link');calendar.type='button';calendar.title='帶入原文文字，開啟可編輯行程後再儲存';calendar.addEventListener('click',async()=>{
   const draft=window.open('about:blank','_blank');if(draft){draft.opener=null;draft.document.title='正在讀取原文';draft.document.body.textContent='正在讀取原文，請稍候……';}
   calendar.disabled=true;calendar.textContent='讀取原文中…';
   try{if(!x.original_text)x.original_text=await cloud.original(x.todo_key);const url=calendarEventUrl(x);if(draft)draft.location.replace(url);else{$('error').textContent='原文已讀取，請允許彈出視窗後再按一次「加入 Google 日曆」。';}}
   catch(error){if(draft)draft.close();$('error').textContent='原文讀取失敗，尚未開啟日曆行程：'+error.message;}
   finally{calendar.disabled=false;calendar.textContent='加入 Google 日曆';}
  });due.append(calendar);row.append(completed,priority,task,owner,assignment(x),due);return row;
 }));
}
function selectDashboard(view){selectDashboardView(view,document,render);}
async function load({reconcile=false}={}){
 if(document.hidden||editing||document.querySelector('.original[open]')||document.activeElement?.matches('.assignment-editor'))return;
 try{const data=await cloud.data({reconcile});all=mergeRows(data.todos,data.states);drafts.setScope(cloud.local?cloud.url:cloud.session()?.user?.id);drafts.reconcile(all);if(cloud.local)groupControls.update(data.registry||readRegistry(data.todos));else await remote?.refresh();renderSourceOptions($('source'),all,removedSources);if(cloud.local)renderImages(readImages(data.todos),$('imagesPanel'),{link:linkLocalImage});else{syncGalleryScope();renderGallery();if($('imagesPanel').open)await loadGallery();}renderAutomation(readAutomation(data.states),$('automationPanel'),{onRetryGroup:async group=>{const panel=$('remoteControl').closest('details');if(panel)panel.open=true;remote.input.value=group;remote.form.scrollIntoView({behavior:'smooth',block:'center'});await remote.submit();}});$('loginPanel').hidden=true;$('workspace').hidden=false;$('logout').hidden=!!cloud.local;$('error').textContent='';$('updated').textContent='資料讀取時間：'+new Date().toLocaleString('zh-TW',{timeZone:'Asia/Taipei'})+' · 台北時間';render();}
 catch(e){if(!cloud.session())showLogin();$('loginError').textContent=$('error').textContent=e.message;}
}
function syncGalleryScope(){const owner=cloud.session()?.user?.id||'session';if(owner!==galleryOwner){galleryOwner=owner;galleryRows=[];galleryLoaded=false;}}
function renderGallery(){const panel=$('imagesPanel');renderImages(readImages(galleryRows),panel);if(!galleryLoaded)panel.querySelector('summary').textContent='LINE 圖片與辨識 · 點開載入';}
async function loadGallery(){
 if(cloud.local||!cloud.session()||document.hidden)return;syncGalleryScope();const owner=galleryOwner;
 try{const rows=await cloud.images();if(owner!==galleryOwner)return;galleryRows=rows;galleryLoaded=true;renderGallery();}
 catch(error){const hint=$('imagesPanel').querySelector('.task-note');if(hint)hint.textContent='圖片暫時無法載入：'+error.message;}
}
$('imagesPanel').addEventListener('toggle',()=>{if($('imagesPanel').open&&!cloud?.local)loadGallery();});
$('remoteControl').addEventListener('toggle',()=>{if($('remoteControl').open&&!document.hidden)remote?.refresh({force:true});});
async function linkLocalImage(item){
 if(item.status==='pending'){await cloud.get('/api/image-link',{key:item.image_key,retry:true});return;}
 const data=await cloud.get('/api/image-messages?group='+encodeURIComponent(item.group_name));
 const choices=data.messages.slice(0,20).map(row=>row.id+' · '+row.sent_at+' · '+row.sender).join('\n');
 const answer=prompt('請輸入圖片所屬的消息 ID；取消可保留原狀。\n'+choices);if(answer===null)return;
 const id=Number(answer);if(!data.messages.some(row=>row.id===id))throw Error('請選擇此群組的有效圖片消息 ID');
 await cloud.get('/api/image-link',{key:item.image_key,message_id:id});
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
$('logout').addEventListener('click',async()=>{if(drafts.size&&!confirm('尚有未保存的交辦內容。確定放棄並登出？'))return;try{await cloud.logout();}catch{}drafts.setScope(null);showLogin();});
$('refresh').addEventListener('click',()=>load({reconcile:true}));
$('resetFilters').addEventListener('click',()=>{resetFilters(document);render();});
for(const id of ['source','priority','status','completion','sort'])$(id).addEventListener('change',render);$('search').addEventListener('input',render);
$('saveDeadline').addEventListener('click',()=>saveDeadline('manual'));$('resetDeadline').addEventListener('click',()=>saveDeadline('analysis'));$('clearDeadline').addEventListener('click',()=>saveDeadline('manual',true));
$('cancelDeadline').addEventListener('click',()=>{if(!busy){editing=null;$('deadlineDialog').close();load();}});$('deadlineDialog').addEventListener('cancel',e=>{if(busy)e.preventDefault();else editing=null;});
if(cloud?.session()){load();if(!document.hidden)remote?.refresh();}setInterval(()=>{if(!document.hidden&&cloud?.session()&&!editing)load();},120000);
const BUILD='20261125-portable-egress1';
async function resumeHomeScreen(){
 if(document.hidden||editing||drafts.size||document.activeElement?.matches('input,textarea'))return;
 try{
  const response=await fetch('./version.json',{cache:'no-store'});
  if(response.ok){const {version}=await response.json();
   if(typeof version==='string'&&/^[a-zA-Z0-9-]+$/.test(version)&&version!==BUILD&&sessionStorage.getItem('mc-reloaded-build')!==version){
    sessionStorage.setItem('mc-reloaded-build',version);const url=new URL(location.href);url.searchParams.set('v',version);location.replace(url.href);return;
   }
  }
 }catch{}
 if(cloud?.session())await load();
}
window.addEventListener('pageshow',resumeHomeScreen);
document.addEventListener('visibilitychange',resumeHomeScreen);

window.addEventListener('online',()=>{if(!document.hidden){remote?.refresh({force:true});if(cloud?.session())load();}});

window.addEventListener('beforeunload',event=>{if(drafts.size){event.preventDefault();event.returnValue='';}});
