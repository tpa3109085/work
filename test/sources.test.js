import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesSource,sourceOptions} from '../sources.js';
const rows=[{source_type:'LINE',subject:'甲群'},{source_type:'LINE',subject:'乙群'},{source_type:'LINE',subject:'甲群'},{source_type:'Email',subject:'甲群'}];
test('group source options are unique and include all sources and email',()=>{assert.deepEqual(sourceOptions(rows),[['','全部來源'],['LINE','全部 LINE 群組'],['Email','郵件'],['group:乙群','LINE · 乙群'],['group:甲群','LINE · 甲群']]);});
test('group filter matches exact LINE group and excludes email with the same subject',()=>{assert.equal(rows.filter(row=>matchesSource(row,'group:甲群')).length,2);assert.equal(rows.filter(row=>matchesSource(row,'LINE')).length,3);assert.equal(rows.filter(row=>matchesSource(row,'Email')).length,1);assert.equal(rows.filter(row=>matchesSource(row,'')).length,4);});

test('removed schedules disappear from source options while history remains available',()=>{assert.equal(sourceOptions(rows,'Email',['甲群']).some(([value])=>value==='group:甲群'),false);assert.equal(rows.filter(row=>matchesSource(row,'')).length,4);});
