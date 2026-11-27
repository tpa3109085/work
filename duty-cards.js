import {traditionalUi} from './locale.js?v=20261127-home-worklist2';
const labels={checked:'已勾選',partial:'部分未勾選',unchecked:'未勾選',unknown:'待確認',no_items:'無對應項目'};
const element=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const displayTime=value=>{const d=new Date(value||'');return Number.isFinite(d.getTime())?d.toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false}):'—';};

/* 自動採集狀態：精簡為單行摘要 + 可展開細節，不再佔用大面積版面 */
function collectionBar(data,fresh,manual){
 const states={idle:'待命中',starting:'啟動中',reading:'採集中',ready:'上次採集成功',needs_login:'等待 Chrome 重新登入',stopped:'採集器已停止',stalled:'採集器無回應',failed:'採集失敗',manual_verified:'現場核對讀數',success:'成功',running:'執行中',retry_wait:'等待限次重試'};
 const schedule=data.schedule||{},last=schedule.last||{};
 const collector=states[data.collector?.status]||'尚未連接採集器';
 const age=data.data_age_minutes;
 const ageText=age===null||age===undefined?'':age<1?'剛更新':age<60?`${age} 分鐘前`:`${Math.floor(age/60)} 小時前`;
 const bar=element('section',undefined,'board-collection');
 const head=element('div',undefined,'collection-head');
 const dot=element('span',undefined,'collection-dot '+(fresh?'is-ok':'is-warn'));
 head.append(dot,element('strong','自動採集'),element('span',collector,'collection-state'));
 if(ageText)head.append(element('span',ageText,'collection-age'));
 if(manual)head.append(element('span','現場核對','collection-tag'));
 const detail=element('details',undefined,'collection-detail');
 detail.append(element('summary','詳細狀態'));
 detail.append(element('p',`每日 10:00、14:00（台北時間） · 下次：${displayTime(schedule.next_run)}`,'board-muted'));
 detail.append(element('p',`最後心跳：${displayTime(data.collector?.heartbeat_at)} · 資料讀取：${displayTime(data.captured_at)}`,'board-muted'));
 const reminder=data.reminder;
 if(reminder?.enabled){const statuses={preview:'預覽，未送出',sent:'已送出',no_omissions:'無缺漏，不推播',already_attempted:'今日已處理',failed_or_uncertain:'送出結果待確認，不自動重送',not_sent_retryable:'LINE 忙碌，等待重試',disabled:'未啟用',outside_delivery_window:'非推播時段',paused:'已暫停'};detail.append(element('p',`每日 10:00 缺漏提醒 → ${reminder.group} · ${statuses[reminder.status]||'等待首次執行'}${reminder.at?' · '+displayTime(reminder.at):''}`,'board-reminder'));}
 if(last.slot)detail.append(element('p',`最近排程：${displayTime(last.slot)} · ${states[last.status]||'待確認'} · 已嘗試 ${last.attempts||0} 次`,'board-muted'));
 if(data.api_checks?.length){
  const apiStates={json:'已返回 JSON',authenticated:'登入有效',cached:'使用有效快取',needs_login:'登入已失效',retryable:'服務暫時忙碌',failed:'讀取失敗',invalid_json:'返回格式無法確認',unexpected:'返回格式異常',too_large:'返回資料超過檢查上限'};
  for(const api of data.api_checks)detail.append(element('p',`${api.name} · HTTP ${api.http_status} · ${apiStates[api.state]||'待確認'}${Number.isInteger(api.records)?' · '+api.records+' 筆':''}`,'board-muted'));
 }
 bar.append(head,detail);
 return bar;
}

/* Separate the source duty table from the source unit-status row. */
function dutySection(data,fresh){
 const daily=data.daily_duty||{},section=element('section',undefined,'board-duty');
 section.append(element('h2',(daily.date?daily.date+' ':'')+'當日勤務'));
 if(!fresh||!daily.confirmed){section.append(element('p','尚未取得來源當日勤務，請重新讀取來源。','board-muted'));return section;}
 const wrap=element('div',undefined,'duty-table-scroll'),table=element('table',undefined,'duty-source-table');
 table.setAttribute('aria-label','當日勤務時間、人員及內容');
 const head=element('thead'),header=element('tr');for(const label of ['時間','人員','內容'])header.append(element('th',label));head.append(header);table.append(head);
 const body=element('tbody');
 for(const item of daily.items||[]){const row=element('tr');for(const text of [item.time,item.people,item.content])row.append(element('td',text||'—'));body.append(row);}
 table.append(body);wrap.append(table);section.append(wrap);
 if(!daily.items?.length)section.append(element('p','來源顯示無勤務','board-muted'));
 section.append(element('small','來源讀取：'+displayTime(daily.captured_at),'board-muted'));return section;
}
function unitSection(data,fresh){
 const unit=data.unit_status||{},confirmed=fresh&&unit.confirmed,section=element('section',undefined,'board-unit');section.append(element('h2','單位狀態'));
 const grid=element('div',undefined,'duty-grid');
 const fields=[['主管',unit.supervisor],['值班',unit.duty_officer],['在隊',unit.in_station],['在外',unit.out_station],['不在單位',unit.absent],['單位訊息（前三筆）',unit.message]];
 for(const [label,value] of fields){const item=element('div',undefined,'duty-item');item.append(element('span',label),element('strong',confirmed?String(value??'').trim()||'—':'待確認'));grid.append(item);}
 section.append(grid);
 section.append(element('small',confirmed?'來源讀取：'+displayTime(unit.captured_at):'尚未取得來源單位狀態，不以上班人數推算。','board-muted'));return section;
}

export function renderDutyCards(data,root,{local=true,disconnected=false}={}){
 root.replaceChildren();
 if(!local){const card=element('section',undefined,'board-empty');card.append(element('h2','請在本機開啟勤務看板'),element('p','勤務與保養資料保留在安裝 MessageControl 的電腦。'));const a=element('a','開啟本機即時看板');a.href='http://127.0.0.1:8765/?view=duty';card.append(a);root.append(card);return;}
 data=data||{};const fresh=data.status==='ready'&&!disconnected;
 const manual=data.collection_mode==='manual_chrome'||data.collection_mode==='manual_browser'||data.collector?.phase==='manual_review';
 const stamp=new Date(data.captured_at||'');const time=Number.isFinite(stamp.getTime())?stamp.toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false}):'尚未取得';
 const status=element('div',undefined,'board-status '+(fresh?'is-live':'is-waiting'));
 status.append(element('strong',fresh?(manual?'● Chrome 現場核對':'● 資料有效'):disconnected?'● 連線中斷':'● 等待有效資料'),element('span','來源讀取：'+time));
 root.append(status);
 if(!fresh)root.append(element('p',data.captured_at?'目前為歷史讀數，暫不判定已完成或漏勾。':'尚未取得勤務資料，請先完成消防系統連接。','board-warning'));
 else if(data.aged)root.append(element('p',`資料為今日較早的讀數（${data.data_age_minutes} 分鐘前），勾選狀態仍以該次讀取為準；要最新請按「立即讀取來源」。`,'board-muted'));

 if(fresh&&data.collection_warning)root.append(element('p','採集目前停止或失敗；保留今日上次成功核對的勾選狀態，並非即時讀數。','board-warning'));
 root.append(collectionBar(data,fresh,manual));
 root.append(dutySection(data,fresh),unitSection(data,fresh));

 const stats=element('section',undefined,'board-stats');
 for(const [title,value,note] of [['勤務日期',data.date||'—','鹿野分隊'],['當日上班',fresh&&data.roster_valid?`${data.people?.length||0} 人`:'待確認',`日班 ${data.roster?.day_count??'—'} · 夜班 ${data.roster?.night_count??'—'}`],['分隊車輛',data.fleet?String(data.fleet.total||0):'待確認','包含所有車輛，不限上班保管人'],['已填異常',fresh?String(data.abnormal||0):'—','已有記錄，需另行關注']]){const card=element('article',undefined,'board-stat');card.append(element('span',title),element('strong',value),element('small',note));stats.append(card);}root.append(stats);

 /* 當日上班名單：標題不帶括號 */
 const roster=element('section',undefined,'board-roster');
 roster.append(element('h2','當日上班名單'),element('p',(data.people||[]).map(x=>x.person).join('　')||'上班名單待讀取'));
 if(data.roster?.supervisor)roster.append(element('small','主管：'+data.roster.supervisor));
 root.append(roster);

 const fleetSection=element('section',undefined,'board-category board-vehicles');fleetSection.append(element('h2','車輛｜全分隊車輛保養'));
 const fleetGrid=element('div',undefined,'board-people');const fleet=data.fleet;
 if(!fleet)fleetSection.append(element('p','全分隊車輛資料待服務更新或下一次採集，不以部分上班人員車輛代替。','board-warning'));
 for(const vehicle of fleet?.items||[]){
  const card=element('article',undefined,'board-person');card.append(element('h3',vehicle.name||'車輛'),element('p',vehicle.code||'—'));
  const state=!fresh||fleet.status==='unknown'?'unknown':vehicle.checked===true?'checked':vehicle.checked===false?'unchecked':'unknown';card.append(element('p',labels[state],'board-badge state-'+state));
  if(vehicle.abnormal&&fresh)card.append(element('p','已填異常，請關注','board-warning'));if(vehicle.note)card.append(element('small',vehicle.note));fleetGrid.append(card);
 }fleetSection.append(fleetGrid);root.append(fleetSection);

 const gearSection=element('section',undefined,'board-category board-equipment');gearSection.append(element('h2','個人裝備｜火搶裝備（對照上班人員）'));
 const grid=element('section',undefined,'board-people');grid.setAttribute('aria-label','上班人員火搶裝備勾選卡片');
 for(const person of data.people||[]){
  const group=person.equipment||{},items=(group.items||[]).filter(x=>/火[搶抢]/.test(x.name||''));
  const card=element('article',undefined,'board-person');card.append(element('h2',person.person));
  let state=!fresh?'unknown':!items.length?'no_items':group.status==='unknown'?'unknown':items.some(x=>x.checked!==true&&x.checked!==false)?'unknown':items.every(x=>x.checked===true)?'checked':items.every(x=>x.checked===false)?'unchecked':'partial';
  card.append(element('span',labels[state],'board-badge state-'+state));
  if(!items.length)card.append(element('p',fresh?'無對應火搶個人裝備':'等待火搶裝備資料','board-muted'));
  const section=element('section',undefined,'board-maintenance'),list=element('ul');
  for(const asset of items){const assetState=!fresh||group.status==='unknown'?'unknown':asset.applicable===false?'na':asset.checked===true?'checked':asset.checked===false?'unchecked':'unknown';
   const line=element('li',undefined,'asset-'+assetState);line.append(element('span',`${asset.name||''}${asset.code?' · '+asset.code:''}`),element('strong',assetState==='na'?'不適用':labels[assetState]));if(asset.note)line.append(element('small',asset.note));list.append(line);
  }section.append(list);card.append(section);grid.append(card);
 }gearSection.append(grid);root.append(gearSection);
 if(!data.people?.length)root.append(element('div','連接成功後自動顯示當日上班人員的火搶個人裝備，不需逐項點開。','board-empty'));
 root.append(element('p','以原系統使用人／保管人對應上班名單；勾號代表項目已有記錄，不推定填寫人。','board-note'));
}
