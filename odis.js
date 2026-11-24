/* ODIS: PIN-only local reader; no scheduled fetching or push. */
const root=document.getElementById('odisRoot'),local=['127.0.0.1','localhost'].includes(location.hostname);
let listing=null,busy=false;
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const stamp=value=>value?new Date(value).toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false}):'—';
function official(){const a=el('a','開啟官方公文系統','odis-source-link');a.href='https://odis.taitung.gov.tw/GDMS_LOGIN.aspx';a.target='_blank';a.rel='noopener noreferrer';return a;}
function note(){root.append(el('p','手動查看 · 僅需 PIN · 不設定 10:00 排程 · 不推播','odis-hint'));}
async function request(path,options={}){const response=await fetch(path,{cache:'no-store',...options});if(!response.ok)throw Error('本機公文服務未啟動，請先開啟本機網頁。');return response.json();}
function prompt(message=''){
 listing=null;root.replaceChildren();note();const panel=el('section',undefined,'odis-panel');panel.append(el('h2',local?'輸入 PIN 查看公文':'公文系統查看入口'));
 if(!local){panel.append(el('p','請在官方網站選擇 PIN 碼登入。此公開入口不保存 PIN 或公文內容；本機整合清單請於安裝 MessageControl 的電腦查看。'),official());root.append(panel);return;}
 panel.append(el('p','官方 Chrome 已確認可查看陳家慧的公文。整合查詢的獨立登入仍未成功，請先由官方入口查看；下方保留 PIN 手動重試。'),official());
 const form=el('form'),label=el('label','PIN 碼'),input=el('input');Object.assign(input,{type:'password',inputMode:'numeric',autocomplete:'one-time-code',required:true,pattern:'[0-9]{6,12}',minLength:6,maxLength:12,name:'pin'});label.append(input);
 const button=el('button','登入並查看公文');button.type='submit';const error=el('p',message,'odis-error');error.setAttribute('role','alert');form.append(label,button,error);panel.append(form,el('p','PIN 僅暫存於本機服務記憶體 15 分鐘；按「結束查看」或服務重新啟動後清除。不寫入設定檔。','odis-hint'),official());root.append(panel);
 form.addEventListener('submit',async event=>{event.preventDefault();if(busy)return;busy=true;button.disabled=true;button.textContent='正在登入與讀取…';error.textContent='';try{const data=await request('./api/odis/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin:input.value})});if(!data.ok)throw Error(data.error||'登入未成功');listing=data;renderList();}catch(e){error.textContent=e.message;}finally{input.value='';button.disabled=false;button.textContent='登入並查看公文';busy=false;}});
}
function renderList(){
 root.replaceChildren();note();const panel=el('section',undefined,'odis-panel');panel.append(el('h2',listing.owner+'的公文 · '+listing.count+' 件'),el('p','來源讀取：'+stamp(listing.fetched_at)+(listing.cached?'（快取）':''),'odis-hint'),el('p',listing.scope||'','odis-hint'));
 const exit=el('button','結束查看');exit.type='button';exit.addEventListener('click',async()=>{if(busy)return;busy=true;try{await request('./api/odis/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});prompt();}catch(e){panel.append(el('p',e.message));}finally{busy=false;}});panel.append(exit);
 if(!listing.items?.length)panel.append(el('p','目前五個公文匣沒有公文。'));
 const list=el('ul',undefined,'odis-list');for(const item of listing.items||[]){const row=el('li',undefined,'odis-item'),button=el('button');button.type='button';button.append(el('div',item.status+' · '+item.doc_no,'odis-docno'),el('div',item.subject||'（無主旨）','odis-subject'),el('div',(item.date_label||'日期')+'：'+(item.date||'—'),'odis-date'));button.addEventListener('click',()=>openDoc(item));row.append(button);list.append(row);}panel.append(list,official());root.append(panel);
}
async function openDoc(item){if(busy)return;busy=true;const panel=el('section',undefined,'odis-panel'),back=el('button','返回公文清單');back.type='button';back.addEventListener('click',()=>{if(!busy)renderList();});root.replaceChildren();note();root.append(panel);panel.append(back,el('h2',item.subject),el('p','正在讀取公文內容…'));
 try{const data=await request('./api/odis/doc/'+encodeURIComponent(item.key));panel.lastChild.remove();if(!data.ok)throw Error(data.error||'無法讀取公文');panel.append(el('p',data.doc_no+' · '+(data.date_label||'日期')+' '+(data.date||'—')),el('pre',data.content,'odis-doc-body'));if(data.truncated)panel.append(el('p','內容較長，請至官方網站查看全文。'));panel.append(official());}catch(e){panel.append(el('p',e.message));}finally{busy=false;}}
document.getElementById('odisRefresh').addEventListener('click',async()=>{if(!local||!listing||busy)return;busy=true;try{const data=await request('./api/odis?refresh=1');if(!data.ok)throw Error(data.error||'重新讀取失敗');listing=data;renderList();}catch(e){prompt(e.message);}finally{busy=false;}});
function clock(){document.getElementById('odisClock').textContent=new Date().toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false});}clock();setInterval(clock,30000);prompt();
