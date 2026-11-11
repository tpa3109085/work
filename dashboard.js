export function selectDashboardView(view,doc,render){
 const get=id=>doc.getElementById(id);
 for(const id of ['search','source','priority','status'])if(get(id))get(id).value='';
 if(get('completion'))get('completion').value=view==='done'?'done':view==='all'?'':'pending';
 if(get('status'))get('status').value=view==='today'?'今天到期':view==='overdue'?'已逾期':'';
 render();
 const labels={today:'今日待辦',overdue:'逾期未完成',pending:'未完成事項',done:'已完成事項',all:'全部事項'};
 const title=get('taskListTitle');
 if(title)title.textContent=labels[view]||'待辦清單';
 doc.querySelectorAll('#stats .stat').forEach(card=>card.setAttribute('aria-pressed',String(card.dataset.view===view)));
 const target=title||get('resultCount')||get('rows');
 if(!target)return;
 // Older home-screen WebViews may reject the options argument.
 try{target.focus?.({preventScroll:true});}catch{}
 try{target.scrollIntoView({behavior:'smooth',block:'start'});}catch{target.scrollIntoView?.();}
}
