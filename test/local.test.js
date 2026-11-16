import test from 'node:test';
import assert from 'node:assert/strict';
import {localRows,LocalCloud} from '../local.js';
import {mergeRows} from '../core.js';
import {sourcePayload} from '../originals.js';
test('shared local adapter preserves completion, manual deadline and assignment state',()=>{
 const data=localRows({todos:[{key:'a'.repeat(64),source_type:'LINE',subject:'群組',task:'工作',priority:'P1',completed:true,deadline_mode:'manual',deadline_date:'2026-11-20',deadline_time:'12:00',analysis_deadline_date:'2026-11-19',assignment_status:'已交辦'}],images:[],automation:{},groups:[],removed_groups:['舊群']});
 const row=mergeRows(data.todos,data.states)[0];assert.equal(row.completed,true);assert.equal(row.assignment,'已交辦');assert.equal(row.deadline.day,'2026-11-20');assert.equal(row.deadline.clock,'12:00');assert.deepEqual(data.registry.removed,['舊群']);
});
test('local original keeps email text and combined LINE payload as objects',async()=>{
 const cloud=new LocalCloud(async()=>({ok:true,json:async()=>({text:'完整原文'})}),{});assert.equal(sourcePayload(await cloud.original('a'.repeat(64))).text,'完整原文');
});
