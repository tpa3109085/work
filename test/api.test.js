import test from 'node:test';
import assert from 'node:assert/strict';
import {Cloud} from '../api.js';
const config={supabaseUrl:'https://mwfhqffcxshifuezhmqf.supabase.co',publishableKey:'sb_publishable_test'};
function store(){const data=new Map();return {getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};}
const response=(value,status=200)=>({ok:status<400,status,text:async()=>JSON.stringify(value)});
test('unauthenticated reads never send network requests',async()=>{
 const cloud=new Cloud(config,store(),()=>assert.fail('network called'));
 await assert.rejects(cloud.data(),/請先登入/);
});
test('password is not persisted, and logout clears tokens even on network failure',async()=>{
 const storage=store();let fail=false;
 const cloud=new Cloud(config,storage,async()=>{if(fail)throw Error('offline');return response({access_token:'token',refresh_token:'refresh',expires_in:3600});});
 await cloud.login('test@example.invalid','password-secret');
 assert.ok(!storage.getItem(cloud.storageKey).includes('password-secret'));
 fail=true;await assert.rejects(cloud.logout());assert.equal(cloud.session(),null);
});
test('parallel expired reads share one token refresh',async()=>{
 let refreshes=0;const cloud=new Cloud(config,store(),async(url,options)=>{
  if(url.includes('grant_type=refresh_token')){refreshes++;return response({access_token:'new',refresh_token:'r',expires_in:3600});}
  assert.equal(options.headers.Authorization,'Bearer new');return response([]);
 });
 cloud.store({access_token:'old',refresh_token:'r',expires_in:-10});
 await Promise.all([cloud.data(),cloud.data()]);assert.equal(refreshes,1);
});
test('401 clears session, and deadline reset retains the explicit analysis mode',async()=>{
 let sent;const cloud=new Cloud(config,store(),async(url,options)=>{sent=JSON.parse(options.body);return response({message:'expired'},401);});
 cloud.store({access_token:'a',refresh_token:'r',expires_in:3600});
 await assert.rejects(cloud.setDeadline('key','analysis'),/登入已失效/);
 assert.deepEqual(sent,{p_key:'key',p_mode:'analysis',p_date:null,p_time:null});assert.equal(cloud.session(),null);
});
