import test from 'node:test';
import assert from 'node:assert/strict';
import {AssignmentDrafts,sortTasks,resetFilters} from '../workspace.js';
test('unsaved notes survive filtering/reloads without replacing newer server content',()=>{
 const drafts=new AssignmentDrafts();drafts.setScope('owner-a');drafts.set('task','my draft','saved note');
 assert.equal(drafts.value('task','server note'),'my draft');
 drafts.reconcile([{todo_key:'task',assignment:'new phone note'}]);
 assert.equal(drafts.value('task'),'my draft');assert.equal(drafts.conflict('task'),true);
 drafts.saved('task','my draft');assert.equal(drafts.size,0);
});
test('a later edit is preserved when an earlier save finishes',()=>{
 const drafts=new AssignmentDrafts();drafts.set('task','first','original');drafts.set('task','second','original');
 drafts.saved('task','first');assert.equal(drafts.value('task'),'second');assert.equal(drafts.has('task'),true);
 drafts.reconcile([{todo_key:'task',assignment:'first'}]);assert.equal(drafts.conflict('task'),false);
});
test('account switch discards old private drafts and returning to saved text clears dirty state',()=>{
 const drafts=new AssignmentDrafts();drafts.setScope('a');drafts.set('task','draft','saved');drafts.setScope('b');
 assert.equal(drafts.value('task','b note'),'b note');assert.equal(drafts.size,0);
 drafts.set('task','draft','saved');drafts.set('task','saved','saved');assert.equal(drafts.size,0);
});
test('urgent mode places overdue/today before future work; other modes honor the chosen order',()=>{
 const rows=[
  {todo_key:'a',priority:'P1',completed:false,deadline:{status:'未到期',day:'2026-12-20',clock:''}},
  {todo_key:'b',priority:'P3',completed:false,deadline:{status:'已逾期',day:'2026-11-01',clock:'12:00'}},
  {todo_key:'c',priority:'P2',completed:false,deadline:{status:'今天到期',day:'2026-11-17',clock:'09:00'}},
  {todo_key:'d',priority:'P1',completed:true,deadline:{status:'已逾期',day:'2026-10-01',clock:''}},
  {todo_key:'e',priority:'P4',completed:false,deadline:{status:'未設定',day:'',clock:''}}
 ];
 assert.deepEqual(sortTasks(rows).map(x=>x.todo_key),['b','c','a','e','d']);
 assert.deepEqual(sortTasks(rows,'priority').map(x=>x.todo_key),['a','c','b','e','d']);
 assert.equal(sortTasks(rows,'deadline')[0].todo_key,'b');assert.equal(rows[0].todo_key,'a');
});
test('reset returns to pending work and clears dashboard selection without touching task state',()=>{
 const fields=Object.fromEntries(['search','source','priority','status','completion','sort','taskListTitle'].map(id=>[id,{value:'filter'}]));
 let pressed;resetFilters({getElementById:id=>fields[id],querySelectorAll:()=>[{setAttribute:(name,value)=>pressed=value}]});
 assert.equal(fields.search.value,'');assert.equal(fields.completion.value,'pending');assert.equal(fields.sort.value,'urgency');assert.equal(pressed,'false');assert.equal(fields.taskListTitle.textContent,'待辦清單');
});
