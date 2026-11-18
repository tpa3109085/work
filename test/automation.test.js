import test from 'node:test';
import assert from 'node:assert/strict';
import {AUTOMATION_KEY,readAutomation} from '../automation.js';
import {mergeRows} from '../core.js';
test('automation reports remain separate from real task totals',()=>{
 const report={version:1,items:[{name:'LINE',status:'failed',at:'2026-11-12T09:00:00+08:00'}]};
 assert.deepEqual(readAutomation([{todo_key:AUTOMATION_KEY,assignment_status:JSON.stringify(report)}]),report);
 assert.deepEqual(mergeRows([{todo_key:AUTOMATION_KEY}],[]),[]);
 assert.equal(readAutomation([{todo_key:AUTOMATION_KEY,assignment_status:'broken'}]),null);
 assert.equal(readAutomation([]),null);
});

import {renderAutomation} from '../automation.js';
function element(tag='div'){
 return {tag,textContent:'',className:'',children:[],append(...items){this.children.push(...items)},replaceChildren(...items){this.children=items}};
}
test('review warnings stay distinct from failed jobs and all six flows are visible',()=>{
 const previous=globalThis.document;
 globalThis.document={createElement:tag=>element(tag)};
 try{
  const summary=element('summary'),body=element();
  const panel={querySelector:s=>s==='summary'?summary:body};
  const report={reported_at:new Date().toISOString(),items:[{name:'郵件',status:'review',note:'4 封OCR待核對'},...Array.from({length:5},(_,i)=>({name:i===4?'雲端同步':'流程'+i,status:'success'}))]};
  renderAutomation(report,panel);
  assert.equal(summary.children[1].textContent,'1 項待核對');
  const rows=body.children.filter(x=>x.className==='automation-row');
  assert.equal(rows.length,6);
  assert.equal(rows[0].children[0].children[1].textContent,'待核對');
  assert.equal(rows[5].children[0].children[0].textContent,'雲端同步');
  report.items[0].status='failed';renderAutomation(report,panel);
  assert.equal(summary.children[1].textContent,'1 項失敗需處理');
 }finally{globalThis.document=previous;}
});
