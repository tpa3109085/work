export function matchesSource(row,value){
 if(!value)return true;
 return value.startsWith('group:') ? row.source_type==='LINE'&&row.subject===value.slice(6) : row.source_type===value;
}
export function sourceOptions(rows,emailType='Email',removed=[]){
 const groups=[...new Set(rows.filter(row=>row.source_type==='LINE'&&row.subject&&!removed.includes(row.subject)).map(row=>row.subject))].sort();
 return [['','全部來源'],['LINE','全部 LINE 群組'],[emailType,'郵件'],...groups.map(name=>['group:'+name,'LINE · '+name])];
}
export function renderSourceOptions(select,rows,removed=[]){
 const previous=select.value;select.replaceChildren();
 for(const [value,label] of sourceOptions(rows,'Email',removed)){const option=select.ownerDocument.createElement('option');option.value=value;option.textContent=label;select.append(option);}
 if([...select.options].some(option=>option.value===previous))select.value=previous;
}
