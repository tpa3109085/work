const LABELS={checked:'已勾選',partial:'部分未勾選',unchecked:'未勾選',unknown:'待確認',no_items:'無對應項目'};
export function renderDuty(data,root,{local=false,onRefresh,onConnect}={}){
 if(!root)return;root.replaceChildren();
 const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
 const header=el('div',undefined,'duty-heading');header.append(el('div','鹿野分隊｜勤務與保養核對','duty-title'),el('span','只讀取 · 不代勾選','duty-readonly'));root.append(header);
 if(!local){root.append(el('p','此區塊的勤務與保養資料保留在本機。請在安裝 MessageControl 的電腦開啟本機網頁查看。','muted'));const link=el('a','開啟本機勤務核對');link.href='http://127.0.0.1:8765/';link.target='_blank';link.rel='noopener noreferrer';root.append(link);return;}
 data=data||{};const controls=el('div',undefined,'duty-actions');
 for(const [label,action] of [['連接／重新登入消防系統',onConnect],['更新讀數',onRefresh]]){const b=el('button',label,'secondary');b.type='button';b.addEventListener('click',()=>action?.());controls.append(b);}root.append(controls);
 const state=el('p','', 'duty-message');state.setAttribute('role','status');root.append(state);
 const time=value=>{const date=new Date(value||'');return Number.isFinite(date.getTime())?date.toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false}):'尚未讀取';};
 const fresh=data.status==='ready';state.textContent=data.collector?.message||'連接後會每 5 分鐘自動讀取一次；下列狀態不會回寫消防系統。';
 if(!fresh){const notice=el('p',data.status==='stale'?'資料已過期或日期／名單未核實，暫不判定漏勾。請更新讀數或重新登入。':'尚未連接消防系統；請先登入並完成只讀取連接。','duty-warning');root.append(notice);}
 const duty=el('section',undefined,'duty-live');duty.append(el('h3','當日勤務'));
 const meta=el('div',undefined,'duty-stats');
 for(const [label,value] of [['勤務日期',data.date||'—'],['上班人員',data.roster_valid?`${data.people.length} 人`:'待確認'],['08–20',data.roster?.day_count??'—'],['20–08',data.roster?.night_count??'—']]){const card=el('div');card.append(el('span',label),el('strong',String(value)));meta.append(card);}duty.append(meta);
 duty.append(el('p','當日上班名單：'+((data.people||[]).map(r=>r.person).join('、')||'尚未讀取')));
 duty.append(el('p',`主管：${data.roster?.supervisor||'—'} · 勤務表更新：${data.roster?.updated_at||'—'}`,'muted'));
 duty.append(el('p','資料讀取時間：'+time(data.captured_at)+' · 台北時間','muted'));root.append(duty);
 const check=el('section');check.append(el('h3','上班人員對應保養項目是否勾選'));
 check.append(el('p',data.matching||'以原系統使用人／保管人，對應當天勤務表。','muted'));
 if(fresh){check.append(el('p',`尚未勾選 ${data.missing||0} 項 · 已填異常 ${data.abnormal||0} 項`,data.missing?'duty-alert':'muted'));}
 const table=el('table');const head=el('tr');for(const label of ['上班人員','車輛保養計畫','裝備器材保養紀錄'])head.append(el('th',label));const thead=el('thead');thead.append(head);table.append(thead);const body=el('tbody');
 for(const row of data.people||[]){const tr=el('tr');tr.append(el('th',row.person));for(const kind of ['vehicles','equipment']){const item=row[kind]||{};const td=el('td');td.append(el('span',LABELS[item.status]||'待確認','duty-badge duty-'+(LABELS[item.status]?item.status:'unknown')));if(fresh&&item.total)td.append(el('small',`${item.checked||0}/${item.total} 已勾選`));if(item.abnormal)td.append(el('small',`${item.abnormal} 項異常`,'duty-alert'));
   if(item.items?.length){const detail=el('details');detail.append(el('summary','查看對應項目'));for(const asset of item.items){const label=!fresh?'歷史讀數':asset.applicable===false?'不適用':asset.checked===true?'已勾選':asset.checked===false?'未勾選':'待確認';detail.append(el('p',`${asset.name||''} ${asset.code||''} · ${label}${asset.note?' · '+asset.note:''}`));}td.append(detail);}tr.append(td);}body.append(tr);}table.append(body);const wrap=el('div',undefined,'table-wrap');wrap.append(table);check.append(wrap);root.append(check);
 const links=el('div',undefined,'duty-actions');for(const [kind,label] of [['roster','查看每日勤務表'],['vehicles','查看車輛保養計畫'],['equipment','查看裝備保養紀錄']]){const a=el('a',label);a.href=({roster:'https://ttfd2.firemis.tw/#/shift/list',vehicles:'https://ttfd.firemis.tw/#/car-maintenance-list',equipment:'https://ttfd2.firemis.tw/#/device/maintenance-list'})[kind];a.target='_blank';a.rel='noopener noreferrer';links.append(a);}root.append(links);
}
