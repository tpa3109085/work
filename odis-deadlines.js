const DAY=86400000;
export function taipeiDayNumber(now=new Date()){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const value=key=>Number(parts.find(p=>p.type===key).value);
 return Date.UTC(value('year'),value('month')-1,value('day'))/DAY;
}
export function documentDeadline(item,now=new Date()){
 if(!Number.isInteger(item?.category)||item.category<0||item.category>3||item.completed||/已結案|歸檔|作廢|完成/.test(item.status||''))return null;
 if(item.date_label&&!/限辦|到期|期限/.test(item.date_label))return null;
 const match=String(item.date||'').trim().match(/^(\d{2,4})[\/年-](\d{1,2})[\/月-](\d{1,2})日?$/);
 if(!match)return null;
 let year=Number(match[1]);const month=Number(match[2]),day=Number(match[3]);
 if(match[1].length<4)year+=1911;
 const timestamp=Date.UTC(year,month-1,day),date=new Date(timestamp);
 if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)return null;
 const days=timestamp/DAY-taipeiDayNumber(now);
 return {days,iso:`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`,label:days===0?'今天到期':days===1?'明天到期':days<0?'已逾期':`${days} 天後到期`};
}
export function urgentDocuments(items,now=new Date()){
 return items.map(item=>({item,deadline:documentDeadline(item,now)})).filter(r=>r.deadline&&r.deadline.days>=0&&r.deadline.days<=3).sort((a,b)=>a.deadline.days-b.deadline.days||String(a.item.key).localeCompare(String(b.item.key)));
}
export function warningSignature(items,now=new Date()){
 return String(taipeiDayNumber(now))+':'+urgentDocuments(items,now).map(r=>r.item.key+'@'+r.deadline.iso).sort().join('|');
}
