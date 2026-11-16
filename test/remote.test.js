import test from 'node:test';
import assert from 'node:assert/strict';
import {REMOTE_KEYS,REMOTE_KIND,onlineHost,remoteRecord,validateRemoteGroup} from '../remote.js';
import {mergeRows} from '../core.js';
test('remote control metadata never becomes a todo',()=>{assert.deepEqual(mergeRows(Object.values(REMOTE_KEYS).map(todo_key=>({todo_key,source_type:'Email',priority:'P4'})),[]),[]);});
test('offline or stale desktops cannot accept new work',()=>{const now=Date.now();assert.equal(onlineHost({device:'a'.repeat(32),serverUpdatedAt:new Date(now-1000).toISOString()},now),true);assert.equal(onlineHost({device:'a'.repeat(32),serverUpdatedAt:new Date(now-100000).toISOString()},now),false);assert.equal(onlineHost(null,now),false);});
test('remote request accepts only a bounded group name',()=>{assert.equal(validateRemoteGroup(' 關山大隊分隊主管群組 '),'關山大隊分隊主管群組');for(const group of ['', '../test','a'.repeat(101),'..'])assert.throws(()=>validateRemoteGroup(group));});
test('unrelated assignment notes are not interpreted as control messages',()=>{assert.equal(remoteRecord([{todo_key:REMOTE_KEYS.host,assignment_status:'{"device":"a"}'}],REMOTE_KEYS.host),null);assert.equal(remoteRecord([{todo_key:REMOTE_KEYS.host,assignment_status:JSON.stringify({kind:REMOTE_KIND,device:'a'})}],REMOTE_KEYS.host).device,'a');});
