export const BOARD_KIND='mc_duty_board_v1';
export const BOARD_KEY='f604e848c93226a82c2abf7cac60b7b5d7bfdc153ce711c9372a96314b9bcf52';
const taipeiDay=now=>{const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);return ['year','month','day'].map(k=>p.find(x=>x.type===k).value).join('-');};
export function boardView(payload,now=new Date()){
 if(payload?.kind!==BOARD_KIND||!payload.duty)throw Error('看板資料格式不正確');
 const duty=structuredClone(payload.duty),icare=structuredClone(payload.icare||{ok:false});
 const today=taipeiDay(now),age=(now-new Date(duty.captured_at||''))/60000;
 duty.data_age_minutes=Number.isFinite(age)?Math.max(0,Math.floor(age)):null;
 duty.aged=age>10;
 if(duty.date!==today||!Number.isFinite(age)||age< -1){duty.status='stale';duty.roster_valid=false;}
 if(icare.date!==today){icare.ok=false;icare.error='iCare 尚未取得今日讀數，請等待本機更新。';}
 return {duty,icare};
}
