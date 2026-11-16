export function inDueWindow(row,window,now=new Date()){
 if(row.completed)return false;
 const status=row.deadline?.status||row.status;
 if(status==='已逾期')return false;
 const day=row.deadline?.day||row.deadline_date||row.due;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day||''))return false;
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const part=t=>parts.find(p=>p.type===t).value;
 const today=`${part('year')}-${part('month')}-${part('day')}`;
 const offset=n=>new Date(Date.parse(today+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
 return window==='tomorrow'?day===offset(1):day>=today&&day<=offset(7);
}
export function matchesDueFilter(row,filter){
 if(filter==='明日到期')return inDueWindow(row,'tomorrow');
 if(filter==='7日內到期')return inDueWindow(row,'next7');
 return !filter||(row.deadline?.status||row.status)===filter;
}
