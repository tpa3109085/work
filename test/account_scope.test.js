import test from 'node:test';
import assert from 'node:assert/strict';
import {Cloud} from '../api.js';
const config={supabaseUrl:'https://mwfhqffcxshifuezhmqf.supabase.co',publishableKey:'sb_publishable_test'};
const response=(value,status=200)=>({ok:status<400,status,text:async()=>JSON.stringify(value)});
function storage(){const data=new Map();return {getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)}}
test('a delayed old-account 401 cannot refresh, expose data to, or sign out a new account',async()=>{
 let release,calls=0;const cloud=new Cloud(config,storage(),()=>{calls++;return new Promise(resolve=>release=resolve)});
 cloud.store({access_token:'A',refresh_token:'rA',expires_in:3600,user:{id:'A'}});
 const pending=cloud.request('/rest/v1/example');cloud.store({access_token:'B',refresh_token:'rB',expires_in:3600,user:{id:'B'}});
 release(response({message:'expired'},401));await assert.rejects(pending,/帳號已切換/);assert.equal(cloud.session().user.id,'B');assert.equal(calls,1);
});
