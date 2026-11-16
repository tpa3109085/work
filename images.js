export function readImages(rows){
 return rows.filter(x=>x.subject==='MessageControl 圖片來源 v1'&&x.task==='LINE 圖片預覽（系統資料）').flatMap(x=>{try{const image=JSON.parse(x.original_text);return image.kind==='mc_line_image_v1'&&image.image_key===x.todo_key?[image]:[];}catch{return [];}});
}
export function isImageMetadata(row){return row.subject==='MessageControl 圖片來源 v1'&&row.task==='LINE 圖片預覽（系統資料）';}
export function renderImages(images,panel,{link}={}){
 const openKeys=new Set([...panel.querySelectorAll('details[open][data-disclosure]')].map(x=>x.dataset.disclosure));
 const reveal=(details,key)=>{details.dataset.disclosure=key;details.open=openKeys.has(key);};
 const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
 const labels={success:'分析完成',pending:'待分析',ocr_ready:'等待圖文合併分析',error:'分析失敗',needs_link:'待配對消息時間',excluded:'不在分析範圍',reference:'參考圖片（已略過）'};
 const summary=el('summary',`LINE 圖片與辨識 · ${images.length} 張`);
 const hint=el('p','依 LINE 訊息時間分析；文字辨識可能有誤，請對照圖片核對期限。','task-note');
 const grid=el('div',undefined,'image-grid');
 for(const item of images){
  const card=el('article',undefined,'image-card');
  if(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(item.thumbnail||'')&&item.thumbnail.length<160000){
   const preview=el('details');reveal(preview,item.image_key+':preview');preview.append(el('summary','查看圖片'));
   const img=el('img');img.src=item.thumbnail;img.alt=`${item.group_name} ${item.sender||''} 的 LINE 圖片`;img.loading='lazy';preview.append(img);card.append(preview);
  }
  card.append(el('strong',item.group_name),el('p',`${item.sent_at||'消息時間待配對'} · ${item.sender||'發送者待確認'}`,'task-note'),el('span',labels[item.status]||item.status,'badge'));
  if(item.error)card.append(el('p',item.error,'image-error'));
  if(item.status==='reference'){card.append(el('p','每日勤務編組／上班人力與車輛檢視表，依設定略過文字辨識及 AI 分析。','task-note'));}
  else{const ocr=el('details');reveal(ocr,item.image_key+':ocr');ocr.append(el('summary','文字辨識原文'),el('pre',item.ocr_text||(item.status==='success'?'未辨識到可讀文字':'尚未辨識'),'original-text'));card.append(ocr);}
  const result=el('div',undefined,'image-results');
  for(const task of item.tasks||[]){result.append(el('p',`${task.priority} · ${task.task}`),el('small',`承辦：${task.assigned_to||'待確認'} · 期限：${task.due_at||task.deadline_text||'未明示'}`));}
  if(item.status==='success'&&!item.tasks?.length)result.append(el('p','未辨識到需要後續處理的交辦'));
  card.append(result);
  if(link&&['needs_link','error','pending'].includes(item.status)){
   const button=el('button',item.status==='pending'?'立即分析':'配對來源／重試','secondary small');button.type='button';
   button.onclick=async()=>{button.disabled=true;try{await link(item);}catch(e){alert(e.message);}finally{button.disabled=false;}};card.append(button);
  }
  grid.append(card);
 }
 panel.replaceChildren(summary,hint,grid);
}
