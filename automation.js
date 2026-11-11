export const AUTOMATION_KEY='603f861f4871965ee0ba166853dddbc00f27ab98b094089fcff0c9022c073cfa';
export function readAutomation(states){
 try{const row=states.find(x=>x.todo_key===AUTOMATION_KEY);const report=JSON.parse(row?.assignment_status||'null');return report?.version===1&&Array.isArray(report.items)?report:null;}catch{return null;}
}
export function renderAutomation(report,panel){
 if(!panel)return;
 const labels={success:'成功',failed:'失敗',partial:'部分失敗',running:'執行中',unknown:'尚無紀錄'};
 const make=(tag,text,cls)=>{const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e;};
 const summary=panel.querySelector('summary'),body=panel.querySelector('.automation-body');body.replaceChildren();
 const items=Array.isArray(report?.items)?report.items.slice(0,5):[];
 const failures=items.filter(x=>['failed','partial'].includes(x.status)).length;
 summary.replaceChildren(make('span','自動化執行狀態'),make('span',!items.length?'尚未收到回報':failures?`${failures} 項需注意`:'查看最近執行結果',failures?'automation-alert':'automation-hint'));
 const format=value=>{const d=new Date(value);return Number.isFinite(d.getTime())?d.toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false}):'尚無時間紀錄';};
 if(!items.length){body.append(make('p','尚未收到本機回報。請確認電腦已開機且雲端同步正在執行。','muted'));return;}
 const old=Date.now()-new Date(report.reported_at).getTime()>300000;
 body.append(make('p',`最後回報：${format(report.reported_at)}（台北時間）${old?' · 回報較舊，請確認本機連線':''}`,'automation-time'));
 for(const item of items){
  const state=labels[item.status]?item.status:'unknown';const row=make('div','','automation-row');
  const heading=make('div','','automation-heading');heading.append(make('strong',String(item.name||'流程').slice(0,50)),make('span',labels[state],'automation-badge automation-'+state));
  row.append(heading,make('div',`${format(item.at)} · ${String(item.schedule||'').slice(0,50)}`,'automation-time'));
  if(item.note)row.append(make('p',String(item.note).slice(0,200),'automation-note'));body.append(row);
 }
 body.append(make('p','此處顯示各流程最近一次執行結果；日期不同代表尚未執行今天的排程。','automation-time'));
}
