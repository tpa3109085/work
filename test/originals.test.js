import test from 'node:test';import assert from 'node:assert/strict';
import {sourcePayload,sourceAllowed} from '../originals.js';import {mergeRows} from '../core.js';
test('combined original keeps text and images while sender-filtered historical controls stay out of totals',()=>{
 const payload={kind:'mc_line_context_v1',eligible:true,text:'同人圖文',images:[{message_id:2,ocr_text:'報名期限'}],tasks:[{task:'報名'}]};
 assert.equal(sourcePayload(JSON.stringify(payload)).images.length,1);
 const blocked={todo_key:'d'.repeat(64),source_type:'LINE',original_text:JSON.stringify({...payload,eligible:false}),task:'歷史事項',priority:'P3'};
 assert.equal(sourceAllowed(blocked),false);assert.equal(mergeRows([blocked],[]).length,0);
 assert.equal(sourcePayload('傳統原文').text,'傳統原文');assert.equal(sourceAllowed({source_type:'Email',original_text:''}),true);
});
