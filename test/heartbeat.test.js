import test from 'node:test';
import assert from 'node:assert/strict';
import {automationIsOld} from '../automation.js';

test('idle five minute heartbeat tolerates dashboard polling but expires when disconnected',()=>{
 const report={reported_at:'2026-11-25T00:00:00Z',heartbeat_seconds:300};
 const at=Date.parse(report.reported_at);
 assert.equal(automationIsOld(report,at+7*60000),false);
 assert.equal(automationIsOld(report,at+8*60000+1),true);
 assert.equal(automationIsOld({...report,heartbeat_seconds:undefined},at+5*60000+1),true);
});
