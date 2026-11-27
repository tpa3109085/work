import {traditionalUi} from './locale.js?v=20261127-entry-repair3';
export const AUTOMATION_KEY='603f861f4871965ee0ba166853dddbc00f27ab98b094089fcff0c9022c073cfa';
export function automationIsOld(report,now=Date.now()){
 const cadence=Math.max(0,Math.min(3600,Number(report.heartbeat_seconds)||0));
 return now-new Date(report.reported_at).getTime()>Math.max(300000,(cadence+180)*1000);
}
export function readAutomation(states){
 try{const row=states.find(x=>x.todo_key===AUTOMATION_KEY);const report=JSON.parse(row?.assignment_status||'null');return report?.version===1&&Array.isArray(report.items)?report:null;}catch{return null;}
}
export function renderAutomation(report,panel,{onRetryGroup}={}){
 if(!panel)return;
 const labels={success:'成功',failed:'失敗',partial:'部分失敗',review:'待核對',running:'執行中',unknown:'尚無紀錄'};
 const make=(tag,text,cls)=>{const e=document.createElement(tag);e.textContent=traditionalUi(text);if(cls)e.className=cls;return e;};
 const summary=panel.querySelector('summary'),body=panel.querySelector('.automation-body');body.replaceChildren();
 const items=Array.isArray(report?.items)?report.items.slice(0,10):[];
 const failures=items.filter(x=>['failed','partial'].includes(x.status)).length;
 const reviews=items.filter(x=>x.status==='review').length;
 summary.replaceChildren(make('span','自動化執行狀態'),make('span',!items.length?'尚未收到回報':failures?`${failures} 項失敗需處理`:reviews?`${reviews} 項待核對`:'查看最近執行結果',failures?'automation-alert':reviews?'automation-review':'automation-hint'));
 const format=value=>{const d=new Date(value);return Number.isFinite(d.getTime())?d.toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false}):'尚無時間紀錄';};
 if(!items.length){body.append(make('p','尚未收到本機回報。請確認電腦已開機且雲端同步正在執行。','muted'));return;}
 const old=automationIsOld(report);
 body.append(make('p',`最後回報：${format(report.reported_at)}（台北時間）${old?' · 回報較舊，請確認本機連線':''}`,'automation-time'));
 for(const item of items){
  const state=labels[item.status]?item.status:'unknown';const row=make('div','','automation-row');
  const heading=make('div','','automation-heading');heading.append(make('strong',String(item.name||'流程').slice(0,50)),make('span',labels[state],'automation-badge automation-'+state));
  row.append(heading,make('div',`${format(item.at)} · ${String(item.schedule||'').slice(0,50)}`,'automation-time'));
  if(item.attempt_origin)row.append(make('div','最近執行來源：'+item.attempt_origin,'automation-time'));
  if(item.scheduled_at)row.append(make('div',`最近每日排程：${format(item.scheduled_at)} · ${labels[item.scheduled_status]||'待確認'}`,'automation-time'));
  if(item.last_success_at)row.append(make('div','最近成功：'+format(item.last_success_at),'automation-time'));
  for(const group of (Array.isArray(item.retry_groups)?item.retry_groups:[])){
   if(typeof group!=='string'||group.length>100||!onRetryGroup)continue;
   const retry=make('button','重新執行群組流程 · '+group,'automation-retry');retry.type='button';
   retry.addEventListener('click',()=>onRetryGroup(group));row.append(retry);
  }
  if(item.note)row.append(make('p',String(item.note).slice(0,200),'automation-note'));body.append(row);
 }
 body.append(make('p','此處顯示各流程最近一次執行結果；日期不同代表尚未執行今天的排程。','automation-time'));
}
