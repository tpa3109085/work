import test from 'node:test';
import assert from 'node:assert/strict';
import {selectDashboardView} from '../dashboard.js';
function fixture(legacy=false){
 const elements=Object.fromEntries(['search','source','priority','status','completion','resultCount','rows'].map(id=>[id,{value:'old',scrollIntoView(){this.scrolled=true;}}]));
 if(!legacy)elements.taskListTitle={focus(){throw Error('unsupported');},scrollIntoView(options){if(options)throw Error('unsupported');this.scrolled=true;}};
 const cards=['today','overdue','pending','done','all'].map(view=>({dataset:{view},setAttribute(k,v){this[k]=v;}}));
 return {elements,cards,getElementById:id=>elements[id],querySelectorAll:()=>cards};
}
test('all dashboard cards set matching filters and remain usable after repeated taps',()=>{
 const doc=fixture();let renders=0;
 for(const [view,status,completion] of [['today','今天到期','pending'],['overdue','已逾期','pending'],['done','','done'],['all','',''],['pending','','pending']]){
  selectDashboardView(view,doc,()=>renders++);
  assert.equal(doc.elements.status.value,status);assert.equal(doc.elements.completion.value,completion);
  assert.equal(doc.cards.filter(x=>x['aria-pressed']==='true').length,1);
 }
 assert.equal(renders,5);assert.equal(doc.elements.taskListTitle.scrolled,true);
});
test('cached older HTML without the list heading still filters and scrolls',()=>{
 const doc=fixture(true);selectDashboardView('overdue',doc,()=>{});
 assert.equal(doc.elements.status.value,'已逾期');assert.equal(doc.elements.resultCount.scrolled,true);
});
