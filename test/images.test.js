import test from 'node:test';
import assert from 'node:assert/strict';
import {readImages} from '../images.js';
import {mergeRows} from '../core.js';
test('image metadata never inflates task counts and malformed payloads are ignored',()=>{
 const metadata={todo_key:'b'.repeat(64),task:'LINE 圖片預覽（系統資料）',subject:'MessageControl 圖片來源 v1',original_text:JSON.stringify({kind:'mc_line_image_v1',image_key:'b'.repeat(64)})};
 assert.equal(mergeRows([metadata],[]).length,0);assert.equal(readImages([metadata]).length,1);
 assert.equal(readImages([{...metadata,original_text:'bad'}]).length,0);
 assert.equal(readImages([{...metadata,todo_key:'c'.repeat(64)}]).length,0);
});
