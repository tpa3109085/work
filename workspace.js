export class AssignmentDrafts{
 constructor(){this.items=new Map();}
 setScope(scope){if(this.scope!==scope){this.items.clear();this.scope=scope;}}
 get size(){return this.items.size;}
 value(key,saved=''){return this.items.get(key)?.value??saved;}
 has(key){return this.items.has(key);}
 set(key,value,saved=''){
  const previous=this.items.get(key),base=previous?.base??saved;
  if(value===saved){this.items.delete(key);return;}
  this.items.set(key,{value,base,conflict:base!==saved});
 }
 reconcile(rows){
  for(const row of rows){const item=this.items.get(row.todo_key);if(!item)continue;
   if(item.value===(row.assignment||''))this.items.delete(row.todo_key);
   else item.conflict=item.base!==(row.assignment||'');
  }
 }
 conflict(key){return !!this.items.get(key)?.conflict;}
 discard(key){this.items.delete(key);}
 saved(key,value){const item=this.items.get(key);if(item?.value===value)this.items.delete(key);else if(item){item.base=value;item.conflict=false;}}
}
const priority=p=>({P1:0,P2:1,P3:2,P4:3,'待確認':4}[p]??5);
const due=row=>(row.deadline?.day||'9999-12-31')+'T'+(row.deadline?.clock||'23:59');
const urgency=row=>row.deadline?.status==='已逾期'?0:row.deadline?.status==='今天到期'?1:row.deadline?.day?2:3;
export function sortTasks(rows,mode='urgency'){
 return [...rows].sort((a,b)=>{
  const completed=Number(a.completed)-Number(b.completed);if(completed)return completed;
  const p=priority(a.priority)-priority(b.priority),d=due(a).localeCompare(due(b));
  return (mode==='priority'?p||d:mode==='deadline'?d||p:urgency(a)-urgency(b)||d||p)||a.todo_key.localeCompare(b.todo_key);
 });
}
export function resetFilters(doc){
 for(const id of ['search','source','priority','status']){const item=doc.getElementById(id);if(item)item.value='';}
 if(doc.getElementById('completion'))doc.getElementById('completion').value='pending';
 if(doc.getElementById('sort'))doc.getElementById('sort').value='urgency';
 const title=doc.getElementById('taskListTitle');if(title)title.textContent='待辦清單';
 doc.querySelectorAll('#stats .stat,#deadlineTracking .stat').forEach(card=>card.setAttribute('aria-pressed','false'));
}
