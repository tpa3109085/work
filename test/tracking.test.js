import test from 'node:test';import assert from 'node:assert/strict';import {inDueWindow} from '../tracking.js';
test('Taipei deadline windows honor completion, overdue and seven-day boundary',()=>{
 const now=new Date('2026-11-15T16:01:00Z');const row=day=>({deadline:{day,status:'未到期'}});
 assert.equal(inDueWindow(row('2026-11-17'),'tomorrow',now),true);
 assert.equal(inDueWindow(row('2026-11-16'),'tomorrow',now),false);
 assert.equal(inDueWindow(row('2026-11-23'),'next7',now),true);
 assert.equal(inDueWindow(row('2026-11-24'),'next7',now),false);
 assert.equal(inDueWindow({...row('2026-11-17'),completed:true},'next7',now),false);
 assert.equal(inDueWindow({deadline:{day:'2026-11-16',status:'已逾期'}},'next7',now),false);
});
