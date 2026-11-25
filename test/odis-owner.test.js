import test from 'node:test';
import assert from 'node:assert/strict';
import {documentMatchesOwner} from '../odis-protocol.js';
test('ODIS documents from a previous selected person cannot be reused',()=>{
 const document={owner:'甲員',viewer:'paper_pen_v3'};
 assert.equal(documentMatchesOwner(document,'甲員'),true);
 assert.equal(documentMatchesOwner(document,'乙員'),false);
 assert.equal(documentMatchesOwner(document,''),false);
 assert.equal(documentMatchesOwner(null,'甲員'),false);
 assert.equal(documentMatchesOwner({...document,viewer:'old'},'甲員'),false);
});
