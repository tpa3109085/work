import test from 'node:test';
import assert from 'node:assert/strict';
import {validateConfig,taipeiDay,deadline,mergeRows,validDate} from '../core.js';
const url='https://mwfhqffcxshifuezhmqf.supabase.co';
test('connection fixture is excluded without hiding real tasks',()=>{
 const fixture={todo_key:'a'.repeat(64),subject:'虚构测试资料，不是真实 LINE 聊天',task:'【连接测试】确认线上待办能够读取和保存',priority:'P3'};
 const real={...fixture,todo_key:'b'.repeat(64),task:'真實工作事項'};
 assert.deepEqual(mergeRows([fixture,real],[]).map(x=>x.todo_key),[real.todo_key]);
 assert.equal(mergeRows([{...fixture,subject:'實際工作主旨'}],[]).length,1);
});
test('public configuration accepts public keys and rejects privileged keys',()=>{
 assert.equal(validateConfig({supabaseUrl:url,publishableKey:'sb_publishable_test'}).url,url);
 for(const key of ['sb_secret_test','',`x.${btoa(JSON.stringify({role:'service_role'}))}.x`])assert.throws(()=>validateConfig({supabaseUrl:url,publishableKey:key}));
 assert.throws(()=>validateConfig({supabaseUrl:'https://example.com',publishableKey:'sb_publishable_test'}));
});
test('Taipei day boundary and invalid dates',()=>{
 assert.equal(taipeiDay(new Date('2026-11-09T16:01:00Z')),'2026-11-10');
 assert.equal(validDate('2026-02-29'),false);
});
test('analysis date remains effective until manual override; reset restores analysis',()=>{
 const row={analysis_date:'2026-11-10',analysis_time:'09:00:00'};
 assert.equal(deadline(row,{},new Date('2026-11-10T00:00:00Z')).status,'今天到期');
 const state={deadline_updated_at:'2026-11-09T00:00Z',deadline_mode:'manual',manual_date:'2026-11-11'};
 assert.equal(deadline(row,state).day,'2026-11-11');
 assert.equal(deadline(row,{...state,manual_date:null}).status,'未設定');
 assert.equal(deadline(row,{...state,deadline_mode:'analysis'}).day,'2026-11-10');
});
test('date without time expires at Taipei end of day',()=>{
 const row={analysis_date:'2026-11-10'};
 assert.equal(deadline(row,{},new Date('2026-11-10T15:59:58Z')).status,'今天到期');
 assert.equal(deadline(row,{},new Date('2026-11-10T16:00:00Z')).status,'已逾期');
});
test('cloud completion overrides source completion independently of deadline',()=>{
 const row={todo_key:'a',priority:'P1',source_completed:true,analysis_date:'2026-11-10'};
 const [merged]=mergeRows([row],[{todo_key:'a',completed:false,completed_updated_at:'2026-11-09T00:00Z'}]);
 assert.equal(merged.completed,false);assert.equal(merged.deadline.day,'2026-11-10');
});
