/* ODIS: PIN-only local reader; no scheduled fetching or push. */
const root=document.getElementById('odisRoot'),local=['127.0.0.1','localhost'].includes(location.hostname);
let listing=null,busy=false;
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const stamp=value=>value?new Date(value).toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false}):'—';
function note(){root.append(el('p','手動查看 · 後台憑證驗證 · 不設定 10:00 排程 · 不推播','odis-hint'));}
async function request(path,options={}){const response=await fetch(path,{cache:'no-store',...options});if(!response.ok)throw Error('本機公文服務未啟動，請先開啟本機網頁。');return response.json();}
function prompt(message=''){
 listing=null;root.replaceChildren();note();const panel=el('section',undefined,'odis-panel');panel.append(el('h2','公文系統查看'));
 if(!local){panel.append(el('p','此頁不提供 PIN 或密碼輸入。公文讀數需要由本機後台憑證服務取得；線上公文服務目前尚未接通。'));root.append(panel);return;}
 panel.append(el('p','公文資料由本機後台憑證服務讀取，本頁僅查看公文。'));
 const button=el('button','讀取公文'),error=el('p',message,'odis-error');button.type='button';error.setAttribute('role','alert');panel.append(button,error);root.append(panel);
 button.addEventListener('click',async()=>{if(busy)return;busy=true;button.disabled=true;button.textContent='正在讀取…';error.textContent='';try{const data=await request('./api/odis?refresh=1');if(!data.ok)throw Error(data.error||'無法讀取公文');listing=data;renderList();}catch(e){error.textContent=e.message;}finally{button.disabled=false;button.textContent='讀取公文';busy=false;}});

}
function renderList(){
 root.replaceChildren();note();const panel=el('section',undefined,'odis-panel');panel.append(el('h2',listing.owner+'的公文 · '+listing.count+' 件'),el('p','來源讀取：'+stamp(listing.fetched_at)+(listing.cached?'（快取）':''),'odis-hint'),el('p',listing.scope||'','odis-hint'));
 const exit=el('button','結束查看');exit.type='button';exit.addEventListener('click',async()=>{if(busy)return;busy=true;try{await request('./api/odis/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});prompt();}catch(e){panel.append(el('p',e.message));}finally{busy=false;}});panel.append(exit);
 if(!listing.items?.length)panel.append(el('p','目前五個公文匣沒有公文。'));
 const list=el('ul',undefined,'odis-list');for(const item of listing.items||[]){const row=el('li',undefined,'odis-item'),button=el('button');button.type='button';button.append(el('div',item.status+' · '+item.doc_no,'odis-docno'),el('div',item.subject||'（無主旨）','odis-subject'),el('div',(item.date_label||'日期')+'：'+(item.date||'—'),'odis-date'));button.addEventListener('click',()=>openDoc(item));row.append(button);list.append(row);}panel.append(list);root.append(panel);
}
async function openDoc(item){if(busy)return;busy=true;const panel=el('section',undefined,'odis-panel'),back=el('button','返回公文清單');back.type='button';back.addEventListener('click',()=>{if(!busy)renderList();});root.replaceChildren();note();root.append(panel);panel.append(back,el('h2',item.subject),el('p','正在讀取公文內容…'));
 try{const data=await request('./api/odis/doc/'+encodeURIComponent(item.key));panel.lastChild.remove();if(!data.ok)throw Error(data.error||'無法讀取公文');panel.append(el('p',data.doc_no+' · '+(data.date_label||'日期')+' '+(data.date||'—')),el('pre',data.content,'odis-doc-body'));if(data.truncated)panel.append(el('p','內容超出顯示上限。')); }catch(e){panel.append(el('p',e.message));}finally{busy=false;}}
document.getElementById('odisRefresh').addEventListener('click',async()=>{if(!local||!listing||busy)return;busy=true;try{const data=await request('./api/odis?refresh=1');if(!data.ok)throw Error(data.error||'重新讀取失敗');listing=data;renderList();}catch(e){prompt(e.message);}finally{busy=false;}});
function clock(){document.getElementById('odisClock').textContent=new Date().toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false});}clock();setInterval(clock,30000);prompt();
