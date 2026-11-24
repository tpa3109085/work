import test from 'node:test';
import assert from 'node:assert/strict';
import {documentDeadline,urgentDocuments,warningSignature} from '../odis-deadlines.js';
const now=new Date('2026-11-25T12:00:00+08:00');
const item=(key,date,extra={})=>({key,date,category:3,date_label:'限辦日期',...extra});
test('ROC and Gregorian deadlines use inclusive today through three-day boundary',()=>{
 const records=[item('old','115/11/24'),item('today','115/11/25'),item('tomorrow','2026-11-26'),item('third','115年11月28日'),item('later','115/11/29')];
 assert.deepEqual(urgentDocuments(records,now).map(r=>r.item.key),['today','tomorrow','third']);
 assert.equal(documentDeadline(records[0],now).days,-1);
});
test('invalid dates, non-deadline dates, review and closed documents do not alert',()=>{
 for(const data of [item('a','115/02/30'),item('b','115/13/01'),item('c','invalid'),item('d','115/11/26',{date_label:'發文日期'}),item('e','115/11/26',{category:4}),item('f','115/11/26',{completed:true}),item('g','115/11/26',{status:'已結案'})])assert.equal(documentDeadline(data,now),null);
 assert.ok(documentDeadline(item('leap','113/02/29'),now));
});
test('Taipei midnight advances countdown independently of the device timezone',()=>{
 const record=item('a','115/11/28');
 assert.equal(documentDeadline(record,new Date('2026-11-24T15:59:59Z')).days,4);
 assert.equal(documentDeadline(record,new Date('2026-11-24T16:00:00Z')).days,3);
});
test('reordering or category selection does not retrigger an acknowledged popup, but dates do',()=>{
 const a=[item('a','115/11/26'),item('b','115/11/27')];
 assert.equal(warningSignature(a,now),warningSignature([...a].reverse(),now));
 assert.notEqual(warningSignature(a,now),warningSignature([a[0],item('b','115/11/28')],now));
 assert.notEqual(warningSignature(a,now),warningSignature(a,new Date('2026-11-26T12:00:00+08:00')));
});
