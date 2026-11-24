// Opens an editable Google Calendar draft. No event is saved automatically.
import {validDate,validTime} from './core.js?v=20261125-odis-deadline4';
import {sourcePayload} from './originals.js?v=20261125-odis-deadline4';
export function calendarOriginalText(value){
 const p=sourcePayload(value);
 return [p.text||'',...(p.images||[]).filter(i=>i.ocr_text&&!['reference','deleted_reference','expired'].includes(i.status)).map(i=>'圖片文字辨識：\n'+i.ocr_text)].filter(Boolean).join('\n\n');
}
export function calendarEventUrl(row){
 const url=new URL('https://calendar.google.com/calendar/render');
 url.searchParams.set('action','TEMPLATE');
 url.searchParams.set('ctz','Asia/Taipei');
 url.searchParams.set('text',String(row.task||row.subject||'管制事項').slice(0,500));
 url.searchParams.set('details',[
  '由 MessageControl 管制事項建立；請核對日期與時段後儲存。',
  row.assigned_to?'承辦人：'+row.assigned_to:'',
  row.priority?'優先級：'+row.priority:'',
  row.subject?'來源：'+row.subject:'',
  row.assignment?'交辦情形：'+row.assignment:'',
  row.deadline?.clock?'預設為期限時間起算 30 分鐘的提醒，可自行修改。':'只有日期時建立全天提醒；沒有期限時請自行設定日期。'
  ,calendarOriginalText(row.original_text)?'【原文】\n'+calendarOriginalText(row.original_text):'原文尚未取得'
 ].filter(Boolean).join('\n\n'));
 const day=row.deadline?.day,clock=row.deadline?.clock;
 if(day&&validDate(day)){
  if(clock&&validTime(clock)){
   const start=new Date(`${day}T${clock}:00+08:00`);
   const compact=d=>d.toISOString().replace(/[-:]/g,'').replace('.000','');
   url.searchParams.set('dates',`${compact(start)}/${compact(new Date(start.getTime()+30*60000))}`);
  }else{
   const end=new Date(day+'T00:00:00Z');end.setUTCDate(end.getUTCDate()+1);
   url.searchParams.set('dates',`${day.replaceAll('-','')}/${end.toISOString().slice(0,10).replaceAll('-','')}`);
  }
 }
 return url.href;
}
