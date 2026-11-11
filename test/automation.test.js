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
