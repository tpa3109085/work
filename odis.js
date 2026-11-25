import {documentDeadline,urgentDocuments,warningSignature,taipeiDayNumber} from './odis-deadlines.js?v=20261125-duty-reminder1';
import {Cloud} from './api.js?v=20261125-duty-reminder1';
import config from './config.js?v=20261125-duty-reminder1';
import {ODIS_KEYS,documentKey,documentMatchesOwner} from './odis-protocol.js?v=20261125-duty-reminder1';
/* ODIS: PIN-only local reader; no scheduled fetching or push. */
const root=document.getElementById('odisRoot'),local=['127.0.0.1','localhost'].includes(location.hostname);
let listing=null,busy=false,selectedCategory=null,listVisible=false,renderedDay=null,lastWarningSignature='';
const deadlineDialog=document.createElement('dialog');deadlineDialog.id='odisDeadlineDialog';deadlineDialog.className='odis-deadline-dialog';deadlineDialog.setAttribute('aria-labelledby','odisDeadlineTitle');document.body.append(deadlineDialog);
const CATEGORIES=["主辦公文","受會公文","決行公文","會核公文"];
const cloud=local?null:new Cloud(config);let recordOwner=null;const recordCache=new Map();
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const stamp=value=>value?new Date(value).toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false}):'—';
function note(){root.append(el('p','手動查看 · 後台憑證驗證 · 不設定 10:00 排程 · 不推播','odis-hint'));}
async function request(path,options={}){const response=await fetch(path,{cache:'no-store',...options});if(!response.ok)throw Error('本機公文服務未啟動，請先開啟本機網頁。');return response.json();}
function prompt(message=''){
 listing=null;listVisible=false;lastWarningSignature='';if(deadlineDialog.open)deadlineDialog.close();deadlineDialog.replaceChildren();root.replaceChildren();note();const panel=el('section',undefined,'odis-panel');panel.append(el('h2','公文系統查看'));
 if(!local&&!cloud.session()){panel.append(el('p','請先登入工作平台，再返回公文頁查看。'));const login=el('a','登入工作平台');login.href='./?view=todos';panel.append(login);root.append(panel);return;}
 panel.append(el('p','公文資料由本機後台憑證服務讀取，登入後於此頁查看清單與內容。'));
 const button=el('button','讀取公文'),error=el('p',message,'odis-error');button.type='button';error.setAttribute('role','alert');panel.append(button,error);root.append(panel);
 button.addEventListener('click',async()=>{if(busy)return;busy=true;button.disabled=true;button.textContent='正在讀取…';error.textContent='';try{const data=local?await request('./api/odis?refresh=1'):await remoteList();if(!data.ok)throw Error(data.error||'無法讀取公文');listing=data;renderList();}catch(e){error.textContent=e.message;}finally{button.disabled=false;button.textContent='讀取公文';busy=false;}});

}
function renderList(){
 listVisible=true;renderedDay=taipeiDayNumber();
 const items=(listing.items||[]).filter(i=>Number.isInteger(i.category)&&i.category>=0&&i.category<4);if(!CATEGORIES[selectedCategory])selectedCategory=items[0]?.category??0;
 root.replaceChildren();note();const panel=el('section',undefined,'odis-panel');panel.append(el('h2',listing.owner+'的公文 · '+items.length+' 件'),el('p','來源讀取：'+stamp(listing.fetched_at)+(listing.cached?'（快取）':''),'odis-hint'),el('p','主辦、受會、決行、會核 · 點選分類卡片查看公文','odis-hint'));
 const exit=el('button','結束查看');exit.type='button';exit.addEventListener('click',async()=>{if(busy)return;busy=true;try{if(local)await request('./api/odis/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});recordCache.clear();prompt();}catch(e){panel.append(el('p',e.message));}finally{busy=false;}});panel.append(exit);
 const cards=el('div',undefined,'odis-category-cards');cards.setAttribute('aria-label','公文分類');
 CATEGORIES.forEach((label,category)=>{const card=el('button',undefined,'odis-category-card'+(selectedCategory===category?' is-active':''));card.type='button';card.dataset.category=String(category);card.setAttribute('aria-pressed',String(selectedCategory===category));card.append(el('span',label),el('strong',String(items.filter(i=>i.category===category).length)),el('small','件'));card.addEventListener('click',()=>{selectedCategory=category;renderList();});cards.append(card);});panel.append(cards,el('h3',CATEGORIES[selectedCategory]));
 const selected=items.filter(i=>i.category===selectedCategory);if(!selected.length)panel.append(el('p','此類目前沒有公文。','odis-empty'));
 const list=el('ul',undefined,'odis-list');for(const item of selected){const row=el('li',undefined,'odis-item'),button=el('button');button.type='button';button.append(el('div',item.status+' · '+item.doc_no,'odis-docno'),el('div',item.subject||'（無主旨）','odis-subject'),el('div',(item.date_label||'日期')+'：'+(item.date||'—'),'odis-date'));const due=documentDeadline(item);if(due&&due.days>=0&&due.days<=3)button.append(el('span',due.label,'odis-due-badge'+(due.days===0?' is-today':'')));button.addEventListener('click',()=>openDoc(item));row.append(button);list.append(row);}panel.append(list);root.append(panel);renderDeadlineWarnings(items);
}
async function openDoc(item,force=false){if(busy)return;if(deadlineDialog.open)deadlineDialog.close();listVisible=false;busy=true;const panel=el('section',undefined,'odis-panel'),back=el('button','返回公文清單');back.type='button';back.addEventListener('click',()=>{if(!busy)renderList();});root.replaceChildren();note();root.append(panel);const renew=el('button','更新簽稿正文');renew.type='button';renew.addEventListener('click',()=>openDoc(item,true));panel.append(back,renew,el('h2',item.subject),el('p','正在讀取公文內容…'));
 try{const data=local?await request('./api/odis/doc/'+encodeURIComponent(item.key)):await remoteDocument(item.key,force);panel.lastChild.remove();if(!data.ok)throw Error(data.error||'無法讀取公文');panel.append(el('p',data.doc_no+' · '+(data.date_label||'日期')+' '+(data.date||'—')),el('p',(data.content_source||'紙筆欄簽稿正文')+(data.pages?' · '+data.pages+' 頁':''),'odis-hint'),el('pre',data.content,'odis-doc-body'));if(data.truncated)panel.append(el('p','內容超出顯示上限。')); }catch(e){panel.append(el('p',e.message));}finally{busy=false;}}
document.getElementById('odisRefresh').addEventListener('click',async()=>{if(!listing||busy)return;busy=true;try{const data=local?await request('./api/odis?refresh=1'):await remoteList();if(!data.ok)throw Error(data.error||'重新讀取失敗');listing=data;renderList();}catch(e){prompt(e.message);}finally{busy=false;}});
function clock(){document.getElementById('odisClock').textContent=new Date().toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false});if(listing&&listVisible&&!document.hidden&&!busy&&renderedDay!==taipeiDayNumber())renderList();}clock();setInterval(clock,30000);prompt();

async function readRecord(key){
 const owner=cloud.scope();if(recordOwner!==owner){recordCache.clear();recordOwner=owner;}
 const manifest=await cloud.request('/rest/v1/mc_cloud_todos?todo_key=eq.'+key+'&select=synced_at&limit=1');cloud.checkScope(owner);
 if(!manifest.length){recordCache.delete(key);return null;}
 if(recordCache.get(key)?.version===manifest[0].synced_at)return recordCache.get(key).data;
 const rows=await cloud.request('/rest/v1/mc_cloud_todos?todo_key=eq.'+key+'&select=original_text,synced_at&limit=1');cloud.checkScope(owner);
 if(!rows.length)return null;
 const payload=JSON.parse(rows[0].original_text||'null');if(!['mc_odis_list_v1','mc_odis_document_v1'].includes(payload?.kind)||!payload.data?.ok)throw Error('公文資料格式不正確');
 recordCache.set(key,{version:rows[0].synced_at,data:payload.data});if(recordCache.size>16)recordCache.delete(recordCache.keys().next().value);return payload.data;
}
async function remoteRequest(command,key){
 const owner=cloud.scope(),rows=await cloud.request('/rest/v1/mc_cloud_state?todo_key=in.('+ODIS_KEYS.host+','+ODIS_KEYS.response+')&select=todo_key,assignment_status,assignment_updated_at');cloud.checkScope(owner);
 const host=rows.find(r=>r.todo_key===ODIS_KEYS.host),age=Date.now()-Date.parse(host?.assignment_updated_at||'');
 if(!Number.isFinite(age)||age>180000||age< -60000)throw Error('本機公文服務未連線；已同步的資料仍可查看。');
 const previous=rows.find(r=>r.todo_key===ODIS_KEYS.response);let state;try{state=JSON.parse(previous?.assignment_status||'null');}catch{}
 if(state?.status==='running'&&Date.now()-Date.parse(previous.assignment_updated_at)<180000)throw Error('本機正在處理另一個公文查看要求，請稍後再試。');
 const id=crypto.randomUUID().replaceAll('-','');
 await cloud.request('/rest/v1/rpc/mc_cloud_set_assignment',{method:'POST',body:{p_key:ODIS_KEYS.request,p_value:JSON.stringify({kind:'mc_odis_request_v1',id,command,...(key?{key}:{})})}});
 const status=document.getElementById('odisProgress');status.textContent='已送出手動讀取要求，等待本機後台回覆…';
 try{for(let i=0;i<50;i++){
  await new Promise(resolve=>setTimeout(resolve,3000));cloud.checkScope(owner);
  const results=await cloud.request('/rest/v1/mc_cloud_state?todo_key=eq.'+ODIS_KEYS.response+'&select=assignment_status&limit=1');cloud.checkScope(owner);let value;try{value=JSON.parse(results[0]?.assignment_status||'null');}catch{}
  if(value?.id!==id)continue;if(value.status==='success')return;if(value.status==='failed')throw Error(value.error||'本機讀取失敗，請檢查後台設定。');status.textContent='本機正在讀取公文，請稍候…';
 }throw Error('等候本機回覆逾時，請稍後手動重試。');}finally{status.textContent='';}
}
async function remoteList(){await remoteRequest('list');const data=await readRecord(ODIS_KEYS.list);if(!data)throw Error('尚未收到公文清單');return data;}
async function remoteDocument(key,force=false){const owner=listing?.owner,record=await documentKey(key),cached=await readRecord(record);if(!force&&documentMatchesOwner(cached,owner))return cached;await remoteRequest('document',key);const data=await readRecord(record);if(listing?.owner!==owner||!documentMatchesOwner(data,owner))throw Error('公文查看人已變更或內容尚未同步，請重新讀取清單及正文。');return data;}
window.addEventListener('storage',event=>{if(cloud&&event.key===cloud.storageKey){listing=null;recordCache.clear();prompt();}});
if(cloud?.session())readRecord(ODIS_KEYS.list).then(data=>{if(data){listing=data;renderList();}}).catch(error=>prompt(error.message));

function showDeadlinePopup(urgent){
 deadlineDialog.replaceChildren();
 const title=el('h2','公文期限警示');title.id='odisDeadlineTitle';deadlineDialog.append(title,el('p',`3 天內到期 ${urgent.length} 件（包含今天，依台北日期計算）。`));
 const list=el('ul',undefined,'odis-alert-list');for(const {item,deadline} of urgent){const row=el('li'),button=el('button');button.type='button';button.append(el('strong',deadline.label+' · '+(item.date||deadline.iso)),el('span',item.subject||'（無主旨）'),el('small',CATEGORIES[item.category]+' · '+item.doc_no));button.addEventListener('click',()=>{deadlineDialog.close();selectedCategory=item.category;openDoc(item);});row.append(button);list.append(row);}deadlineDialog.append(list);
 const close=el('button','稍後查看','odis-warning-dismiss');close.type='button';close.addEventListener('click',()=>deadlineDialog.close());deadlineDialog.append(close);
 if(!deadlineDialog.open){if(typeof deadlineDialog.showModal==='function')deadlineDialog.showModal();else deadlineDialog.setAttribute('open','');}
}
function renderDeadlineWarnings(items){
 const urgent=urgentDocuments(items),signature=warningSignature(items);
 const previous=document.getElementById('odisDeadlineBanner');if(previous)previous.remove();
 if(urgent.length){const banner=el('section',undefined,'odis-deadline-banner');banner.id='odisDeadlineBanner';banner.setAttribute('role','alert');banner.append(el('strong',`3 天內到期 ${urgent.length} 件`),el('span','請優先確認辦理期限。'));const view=el('button','查看期限警示');view.type='button';view.addEventListener('click',()=>showDeadlinePopup(urgent));banner.append(view);root.insertBefore(banner,root.firstChild);
  if(signature!==lastWarningSignature){lastWarningSignature=signature;showDeadlinePopup(urgent);}
 }else{lastWarningSignature=signature;if(deadlineDialog.open)deadlineDialog.close();}
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)clock();});
