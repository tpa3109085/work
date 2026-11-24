// Official tables checked 2026-11-24; amounts are NTD/month.
// Police salary points and civil-service points are separate columns.
export const PAY_SOURCES={
 salary:'https://www.dgpa.gov.tw/uploads/dgpa/files/202611/d5a6eb75-93ff-46fe-8546-5b8b726f2d21.pdf',
 professional:'https://www.dgpa.gov.tw/uploads/dgpa/files/202611/b225c8d4-23ec-4609-8ee1-e09b5cbc4c6e.pdf',
 supervisor:'https://www.personnel.ntpc.gov.tw/uploaddowndoc?dis=personnel11&file=personnel11%2F202505061640080.pdf&filedisplay=police-fire-supervisor.pdf&flag=doc',
 announcement:'https://www.dgpa.gov.tw/information?pid=13137&uid=108'
};
// [civil points, police salary points, monthly salary].
export const SALARY_ROWS=[
 [800,770,63570],[790,740,60290],[780,710,59520],[750,680,57220],
 [730,650,55690],[710,625,54160],[690,600,52630],[670,575,51100],
 [650,550,49560],[630,525,48030],[610,500,46500],[590,475,44970],
 [550,450,41900],[535,430,40760],[520,410,39610],[505,390,38460],
 [490,370,37310],[475,350,36160],[460,330,35010],[445,310,33860],
 [430,290,32710],[415,275,31560],[400,260,30410],[385,245,29270],
 [370,230,28120],[360,220,27350],[350,210,26580],[340,200,25820],
 [330,190,25050],[320,180,24290],[310,170,23520],[300,160,22750],
 [290,150,21990],[280,140,21220],[270,130,20460],[260,120,19690],
 [250,110,18920],[240,100,18160],[230,90,17390],
 [220,null,16630],[210,null,16090],[200,null,15540],[190,null,15000],
 [180,null,14460],[170,null,13920],[160,null,13380]
];
export const FIRE_GRADES=[
 [2,'警佐四階'],[3,'警佐三階'],[4,'警佐二階'],[5,'警佐一階'],
 [6,'警正四階'],[7,'警正三階'],[8,'警正二階'],[9,'警正一階'],
 [10,'警監四階'],[11,'警監三階'],[12,'警監二階'],[13,'警監一階'],[14,'警監特階']
];
const PROFESSIONAL_114={2:21690,3:21750,4:22110,5:22730,6:25890,7:26830,8:29850,9:30930,10:36660,11:39190,12:43360,13:44660,14:47640};
const SUPERVISOR_114={5:4320,6:4870,7:5930,8:7750,9:10010,10:13510,11:19710,12:30410,13:33730,14:41630};
export function lookupFirePay(setup,month){
 if(!['114','11507-announced'].includes(setup.scheme))throw Error('請選擇待遇表版本');
 if(!/^\d{4}-\d{2}$/.test(month)||month<'2025-01'||month>'2026-12')throw Error('此月份尚無已核對的待遇表，請改用手動金額');
 if(setup.scheme==='11507-announced'&&month<'2026-07')throw Error('115/07 公告方案不適用於 2026 年 7 月以前');
 if(!['police','civil'].includes(setup.pointType))throw Error('請選擇點數種類');
 const raw=String(setup.points??'').trim();
 if(!/^\d+$/.test(raw))throw Error('請輸入有效的薪俸點數');
 const row=SALARY_ROWS.find(r=>r[setup.pointType==='police'?1:0]===Number(raw));
 if(!row)throw Error('該點數未列於所選俸額表，請核對點數種類或改用手動金額');
 const grade=Number(setup.grade);
 if(!Object.hasOwn(PROFESSIONAL_114,grade))throw Error('請選擇本職核定官階，不能只依俸點判定專業加給');
 if(typeof setup.isSupervisor!=='boolean')throw Error('請確認主管身分');
 if(setup.isSupervisor&&!Object.hasOwn(SUPERVISOR_114,grade))throw Error('該官階未列主管加給標準，請依核定金額改用手動輸入');
 const increase=setup.scheme==='11507-announced'?2000:0;
 return {salary:row[2],professional:PROFESSIONAL_114[grade]+increase,supervisor:setup.isSupervisor?SUPERVISOR_114[grade]+increase:0};
}
