import {traditionalUi} from './locale.js?v=20261125-odis-deadline4';
import {renderDutyCards} from './duty-cards.js?v=20261125-odis-deadline4';
import {renderIcare} from './icare.js?v=20261125-odis-deadline4';
import {Cloud} from './api.js?v=20261125-odis-deadline4';
import config from './config.js?v=20261125-odis-deadline4';
import {boardView} from './board-data.js?v=20261125-odis-deadline4';
document.title='管制事項・鹿野分隊即時看板';
document.body.className='duty-board-page';
document.body.innerHTML=`<main class="board-shell"><header class="board-header"><div><p class="board-eyebrow">管制事項・鹿野分隊</p><h1>管制事項・鹿野分隊即時看板</h1><p>單位狀態與當日勤務為主體 · 車輛保養勾選 · 上班人員火搶裝備勾選 · 今日未填報</p></div><div><span id="boardClock" class="board-clock"></span><nav><a class="back-todos" href="./?view=todos">← 返回管制事項</a><a class="back-home" href="./">入口首頁</a><a class="back-calendar" href="./?view=calendar">消防勤休月曆</a><button id="boardFullscreen" type="button">全螢幕顯示</button></nav></div></header><section id="boardRoot" aria-label="勤務與保養卡片"></section><section id="icareRoot" aria-label="iCare 今日未填報"></section><aside class="board-settings"><span id="boardMessage" role="status"></span><div><button id="boardConnect" type="button">連接／重新登入消防系統</button><button id="boardRefresh" type="button">立即讀取來源</button></div></aside><footer>自動顯示最新讀數 · 看板每 15 秒更新，來源每日 10:00、16:00 採集 · 台北時間 · 只讀取，不代勾選</footer></main>`;
const root=document.getElementById('boardRoot'),icareRoot=document.getElementById('icareRoot'),message=document.getElementById('boardMessage');
const local=['localhost','127.0.0.1'].includes(location.hostname);
let loading=false,acting=false,lastData=null,icareLoading=false;
const cloud=local?null:new Cloud(config);
const auth=document.createElement('section');auth.className='board-login';auth.hidden=true;
auth.innerHTML='<h2>登入分隊看板</h2><p>使用管制事項的同一個帳號，查看本機同步的勤務與保養讀數。</p><form><label>電子信箱<input name="email" type="email" autocomplete="username" required></label><label>密碼<input name="password" type="password" autocomplete="current-password" required></label><button type="submit">登入看板</button><p class="board-login-error" role="alert"></p></form>';
document.querySelector('.board-header').after(auth);
const logout=document.createElement('button');logout.type='button';logout.textContent='登出';logout.hidden=true;document.querySelector('.board-header nav').append(logout);
function clearPrivate(){lastData=null;root.replaceChildren();icareRoot.replaceChildren();message.textContent='';if(cloud)cloud.resetCaches();}
function showLogin(){clearPrivate();auth.hidden=false;logout.hidden=true;}
auth.querySelector('form').addEventListener('submit',async event=>{event.preventDefault();const form=event.currentTarget,button=form.querySelector('button'),error=form.querySelector('[role=alert]');button.disabled=true;error.textContent='';try{await cloud.login(form.elements.email.value.trim(),form.elements.password.value);auth.hidden=true;await load();}catch(e){error.textContent=traditionalUi(e.message);}finally{form.elements.password.value='';button.disabled=false;}});
logout.addEventListener('click',async()=>{showLogin();try{await cloud.logout();}catch{}finally{showLogin();}});
window.addEventListener('storage',event=>{if(cloud&&event.key===cloud.storageKey){clearPrivate();load();}});

function clock(){document.getElementById('boardClock').textContent=new Date().toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false});}

async function loadIcare(refresh=false){
 if(icareLoading||document.hidden)return;icareLoading=true;
 try{
  if(!local)return;
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
  if(!local){
   if(!cloud.session()){showLogin();return;}
   auth.hidden=true;logout.hidden=false;
   const payload=await cloud.board();
   if(!payload){clearPrivate();message.textContent='尚未收到此帳號的看板資料。請保持本機電腦及雲端同步開啟。';return;}
   const view=boardView(payload);lastData=view.duty;renderDutyCards(lastData,root,{local:true});
   const button=renderIcare(view.icare,icareRoot);if(button)button.addEventListener('click',()=>load());
   const stamp=new Date(payload.synced_at).toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false});
   message.textContent='雲端讀數 · 最後資料同步：'+stamp+' · 本機離線時保留最近一次讀數。';
   document.querySelector('.board-shell footer').textContent='雲端唯讀看板 · 每 60 秒檢查版本，資料變動才下載 · 來源每日 10:00、16:00 採集 · 台北時間 · 不代勾選';
   return;
  }
  const response=await fetch('./api/firemis',{cache:'no-store'});if(!response.ok)throw Error('資料服務暫時無法連線');
  lastData=await response.json();renderDutyCards(lastData,root,{local:true});
  const manual=lastData.collection_mode==='manual_chrome'||lastData.collection_mode==='manual_browser'||lastData.collector?.phase==='manual_review';
  document.querySelector('.board-shell footer').textContent=manual?'Chrome 現場核對 · 看板每 15 秒更新顯示 · 持續自動採集尚未連接 · 台北時間 · 只讀取，不代勾選':'自動顯示最新讀數 · 看板每 15 秒更新，來源每日 10:00、16:00 採集 · 台北時間 · 只讀取，不代勾選';
  message.textContent=traditionalUi(lastData.collector?.message||'尚未啟動採集器，請連接專用 Chrome 並登入消防系統。');
 }catch(error){if(!local){if(!cloud.session()){showLogin();return;}if(lastData)renderDutyCards(boardView({kind:'mc_duty_board_v1',duty:lastData}).duty,root,{local:true});message.textContent='雲端連線中斷，保留上次讀數並自動重試。';}else{renderDutyCards(lastData,root,{local:true,disconnected:true});message.textContent='連線中斷，將自動重試。';}}
 finally{loading=false;}
}

async function action(connect){
 if(acting||!local)return;acting=true;
 const buttons=[document.getElementById('boardConnect'),document.getElementById('boardRefresh')];buttons.forEach(b=>b.disabled=true);
 try{const response=await fetch('./api/firemis-refresh',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({connect})});if(!response.ok)throw Error('啟動失敗');await load();}
 catch{message.textContent='無法啟動讀取，請檢查本機服務。';}finally{acting=false;buttons.forEach(b=>b.disabled=false);}
}
document.getElementById('boardConnect').addEventListener('click',()=>action(true));
document.getElementById('boardRefresh').addEventListener('click',()=>local?action(false):load());
if(!local){document.getElementById('boardConnect').hidden=true;document.getElementById('boardRefresh').textContent='更新雲端讀數';}
document.getElementById('boardFullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{message.textContent='此瀏覽器不支援全螢幕，可直接放大視窗。';}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){clock();load();loadIcare();}});
clock();load();loadIcare();setInterval(clock,1000);setInterval(load,local?15000:60000);if(local)setInterval(()=>loadIcare(),300000);
