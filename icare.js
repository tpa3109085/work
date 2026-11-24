/* iCare「今日未填報」：只顯示鹿野分隊 */
const element=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};

export function renderIcare(data,root){
 if(!root)return;
 root.replaceChildren();
 const section=element('section',undefined,'board-icare');
 const head=element('div',undefined,'icare-head');
 head.append(element('h2','今日未填報｜iCare 生理健康管理'));
 const refresh=element('button','重新整理','icare-refresh');
 refresh.type='button';
 head.append(refresh);
 section.append(head);

 if(!data){section.append(element('p','正在讀取 iCare…','board-muted'));root.append(section);return refresh;}
 if(!data.ok){
  section.append(element('p',data.error||'iCare 暫時無法讀取','board-warning'));
  section.append(element('p','此區塊只讀取 iCare 的「今日未填報」，不會寫入或代填任何資料。','board-muted'));
  root.append(section);return refresh;
 }

 const meta=element('p',undefined,'icare-meta');
 const parts=[`範圍：${data.unit}`];
 if(data.brigade)parts.push(data.brigade);
 if(data.generated_at)parts.push(`資料時間 ${data.generated_at}${data.cached?'（快取）':''}`);
 meta.textContent=parts.join(' · ');
 section.append(meta);

 if(data.roster_stale){
  section.append(element('p',`⚠️ iCare 的「當日上班」名單同步日期為 ${data.roster_date||'未知'}，不是今天（${data.date||'—'}），以下結果僅供參考。`,'board-warning'));
 }

 const kpi=element('div',undefined,'icare-kpi');
 for(const [label,value,cls] of [['應填（上班）',data.total,''],['已填',data.filled,'ok'],['未填',data.missing,data.missing?'bad':'ok']]){
  const card=element('div',undefined,'icare-kpi-item '+(cls||''));
  card.append(element('b',String(value)),element('span',label));
  kpi.append(card);
 }
 section.append(kpi);

 if(!data.total){
  section.append(element('p',data.note||'今日名單中沒有鹿野分隊的人員','board-muted'));
 }else if(data.missing){
  const chips=element('div',undefined,'icare-chips');
  for(const person of data.unfilled||[]){
   const chip=element('span',undefined,'icare-chip miss');
   chip.append(element('span',person.name));
   if(person.maybe)chip.append(element('small','可能是「'+person.maybe+'」打錯字'));
   chips.append(chip);
  }
  section.append(element('h3','未填報人員'),chips);
 }else{
  section.append(element('p','✓ 鹿野分隊今日全部已填報','icare-allok'));
 }

 if(data.filled_people?.length){
  const detail=element('details',undefined,'icare-filled');
  detail.append(element('summary',`已填 ${data.filled_people.length} 人`));
  const chips=element('div',undefined,'icare-chips');
  for(const person of data.filled_people){
   const chip=element('span',undefined,'icare-chip');
   chip.append(element('span',person.name));
   if(person.time)chip.append(element('small',person.time+(person.note?' '+person.note:'')));
   chips.append(chip);
  }
  detail.append(chips);
  section.append(detail);
 }

 if(data.extra?.length){
  const detail=element('details',undefined,'icare-filled');
  detail.append(element('summary',`今天有填報、但不在上班名單的人（${data.extra.length} 人）`));
  const chips=element('div',undefined,'icare-chips');
  for(const person of data.extra){
   const chip=element('span',undefined,'icare-chip');
   chip.append(element('span',person.name));
   chip.append(element('small',[person.unit,person.time].filter(Boolean).join(' ')));
   chips.append(chip);
  }
  detail.append(chips);
  section.append(detail);
 }

 section.append(element('p','資料來源：iCare（ttfd-icare.netlify.app）· 只讀取，不代填、不寫入。','board-note'));
 root.append(section);
 return refresh;
}
