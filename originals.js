export function sourcePayload(value){
 if(value&&typeof value==='object')return value;
 try{const p=JSON.parse(value);if(p?.kind==='mc_line_context_v1')return p;}catch{}
 return {text:typeof value==='string'?value:'原文尚未同步',images:[],tasks:[]};
}
export function sourceAllowed(row){return row.source_type!=='LINE'||sourcePayload(row.original_text).eligible!==false;}
export function renderOriginal(container,value,control={}){
 const p=sourcePayload(value),el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
 const parts=[];
 if(control.task){
  const box=el('section',undefined,'original-control');box.append(el('h4','本項管制事項'),el('strong',control.task),el('p',`${control.priority||''} · 承辦：${control.assigned_to||'待確認'} · ${control.completed?'已完成':'未完成'}`),el('p','目前期限：'+(control.deadline||'未設定')));
  if(control.assignment)box.append(el('p','交辦情形：'+control.assignment));parts.push(box);
 }
 if(p.window_start)parts.push(el('p',`同群組、同人 10 分鐘內合併為 1 項待辦：${p.window_start} ～ ${p.window_end} · ${p.sender} · ${p.message_ids?.length||0} 則訊息`,'task-note'));
 parts.push(el('pre',p.text||'原文尚未同步','original-text'));
 for(const image of p.images||[]){
  const box=el('section',undefined,'original-image');box.append(el('h4',`圖片 · ${image.sent_at||''} · ${image.sender||p.sender||''}`));
  if(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(image.thumbnail||'')&&image.thumbnail.length<160000){const img=el('img');img.src=image.thumbnail;img.alt='此管制事項的原始 LINE 圖片預覽';img.loading='lazy';box.append(img);}
  if(['reference','deleted_reference'].includes(image.status)){box.append(el('p',image.status==='deleted_reference'?'勤務／人力車輛表：依設定不保留圖檔，已刪除。':'參考圖片：依設定略過文字辨識與 AI 分析。','task-note'));}
  else if(image.status==='expired'){box.append(el('p','圖檔已超過一個月保留期限，已刪除。','task-note'));}
  else{const ocr=el('details');ocr.append(el('summary','圖片文字辨識原文'),el('pre',image.ocr_text||(image.status==='success'?'未辨識到可讀文字':'尚待文字辨識'),'original-text'));box.append(ocr);}parts.push(box);
 }
 if(p.tasks?.length){const box=el('section',undefined,'original-related');box.append(el('h4','合併待辦的交辦明細'));
  for(const task of p.tasks)box.append(el('p',`${task.priority} · ${task.task} · 分析期限：${task.due_at||'未明示'}`));
  box.append(el('small','以上明細共用本項待辦的完成狀態；主卡採最早分析期限，仍可手動修改。'));parts.push(box);
 }
 container.replaceChildren(...parts);
}
