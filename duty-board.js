import {traditionalUi} from './locale.js?v=20261124-egress2';
import {renderDutyCards} from './duty-cards.js?v=20261124-egress2';
import {renderIcare} from './icare.js?v=20261124-egress2';
document.title='管制事項・鹿野分隊即時看板';
document.body.className='duty-board-page';
document.body.innerHTML=`<main class="board-shell"><header class="board-header"><div><p class="board-eyebrow">管制事項・鹿野分隊</p><h1>管制事項・鹿野分隊即時看板</h1><p>單位狀態與當日勤務為主體 · 車輛保養勾選 · 上班人員火搶裝備勾選 · 今日未填報</p></div><div><span id="boardClock" class="board-clock"></span><nav><a class="back-todos" href="./?view=todos">← 返回管制事項</a><a class="back-home" href="./">入口首頁</a><a class="back-calendar" href="./?view=calendar">消防勤休月曆</a><button id="boardFullscreen" type="button">全螢幕顯示</button></nav></div></header><section id="boardRoot" aria-label="勤務與保養卡片"></section><section id="icareRoot" aria-label="iCare 今日未填報"></section><aside class="board-settings"><span id="boardMessage" role="status"></span><div><button id="boardConnect" type="button">連接／重新登入消防系統</button><button id="boardRefresh" type="button">立即讀取來源</button></div></aside><footer>自動顯示最新讀數 · 看板每 15 秒更新，來源每日 10:00、16:00 採集 · 台北時間 · 只讀取，不代勾選</footer></main>`;
const root=document.getElementById('boardRoot'),icareRoot=document.getElementById('icareRoot'),message=document.getElementById('boardMessage');
const local=['localhost','127.0.0.1'].includes(location.hostname);
let loading=false,acting=false,lastData=null,icareLoading=false;

function clock(){document.getElementById('boardClock').textContent=new Date().toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false});}

async function loadIcare(refresh=false){
 if(icareLoading||document.hidden)return;icareLoading=true;
 try{
  if(!local){renderIcare({ok:false,error:'iCare 查詢需在本機控制台執行。'},icareRoot);return;}
  const response=await fetch('./api/icare'+(refresh?'?refresh=1':''),{cache:'no-store'});
  if(!response.ok)throw Error('iCare 服務暫時無法連線');
  const data=await response.json();
  const button=renderIcare(data,icareRoot);
  if(button)button.addEventListener('click',async()=>{button.disabled=true;button.textContent='讀取中…';await loadIcare(true);});
 }catch(error){
  const button=renderIcare({ok:false,error:error.message},icareRoot);
  if(button)button.addEventListener('click',()=>loadIcare(true));
 }finally{icareLoading=false;}
}

async function load(){
 if(loading||document.hidden)return;loading=true;
 try{
  if(!local){renderDutyCards(null,root,{local:false});return;}
  const response=await fetch('./api/firemis',{cache:'no-store'});if(!response.ok)throw Error('資料服務暫時無法連線');
  lastData=await response.json();renderDutyCards(lastData,root,{local:true});
  const manual=lastData.collection_mode==='manual_chrome'||lastData.collection_mode==='manual_browser'||lastData.collector?.phase==='manual_review';
  document.querySelector('.board-shell footer').textContent=manual?'Chrome 現場核對 · 看板每 15 秒更新顯示 · 持續自動採集尚未連接 · 台北時間 · 只讀取，不代勾選':'自動顯示最新讀數 · 看板每 15 秒更新，來源每日 10:00、16:00 採集 · 台北時間 · 只讀取，不代勾選';
  message.textContent=traditionalUi(lastData.collector?.message||'尚未啟動採集器，請連接專用 Chrome 並登入消防系統。');
 }catch(error){renderDutyCards(lastData,root,{local:true,disconnected:true});message.textContent='連線中斷，將自動重試。';}
 finally{loading=false;}
}

async function action(connect){
 if(acting||!local)return;acting=true;
 const buttons=[document.getElementById('boardConnect'),document.getElementById('boardRefresh')];buttons.forEach(b=>b.disabled=true);
 try{const response=await fetch('./api/firemis-refresh',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({connect})});if(!response.ok)throw Error('啟動失敗');await load();}
 catch{message.textContent='無法啟動讀取，請檢查本機服務。';}finally{acting=false;buttons.forEach(b=>b.disabled=false);}
}
document.getElementById('boardConnect').addEventListener('click',()=>action(true));
document.getElementById('boardRefresh').addEventListener('click',()=>action(false));
if(!local){document.getElementById('boardConnect').hidden=true;document.getElementById('boardRefresh').hidden=true;}
document.getElementById('boardFullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{message.textContent='此瀏覽器不支援全螢幕，可直接放大視窗。';}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){clock();load();loadIcare();}});
clock();load();loadIcare();setInterval(clock,1000);setInterval(load,15000);setInterval(()=>loadIcare(),300000);
