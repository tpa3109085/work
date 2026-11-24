import {lookupFirePay,SALARY_ROWS,FIRE_GRADES,PAY_SOURCES} from './fire-pay.js?v=20261124-duty-cloud1';
document.title='消防勤休月曆｜MessageControl';
document.body.className='calendar-page';
for(const link of document.querySelectorAll('link[rel=stylesheet]'))link.remove();
const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href='./duty-calendar.css?v=20261124-duty-cloud1';document.head.append(sheet);
document.body.innerHTML="<header><div><small>個人排班 · 勤2休2</small><h1>消防勤休月曆</h1></div></header><nav class=\"calendar-nav\" aria-label=\"工作區切換\"><a class=\"home\" href=\"./\">入口首頁</a><a href=\"./?view=todos\">管制事項</a><a href=\"./?view=duty\">鹿野分隊即時看板</a></nav>\n<main><p class=\"calendar-storage-note\">本機整合版：設定與月曆儲存在目前瀏覽器，與原網站的儲存空間分開；不會自動同步原網站的個人修改。</p>\n<section class=\"panel people\" aria-label=\"人員管理\">\n<div class=\"people-controls\">\n<label>目前人員<select id=\"peopleSelect\"></select></label>\n<button type=\"button\" class=\"primary\" id=\"addPerson\">新增人員</button>\n<button type=\"button\" id=\"renamePerson\">更改名稱</button>\n</div>\n<p class=\"muted\"><small>各人員的設定和月曆分開保存於此瀏覽器。</small></p>\n<p id=\"peopleStatus\" role=\"status\" hidden></p>\n</section>\n<section class=\"panel controls\" aria-label=\"超勤試算\">\n<div class=\"bar\"><h2>超勤試算</h2><div class=\"actions\"><button id=\"prev\">上月</button><input type=\"month\" id=\"month\" class=\"monthpick\" aria-label=\"選擇年月\" min=\"1912-01\" max=\"9999-12\" required><button id=\"next\">下月</button></div></div>\n<form id=\"settings\">\n<div class=\"topinputs basic-settings\">\n<label>休息時間（小時）<input name=\"restHours\" type=\"number\" min=\"4\" max=\"24\" step=\"any\" required><small class=\"muted\">一般勤務預扣 4 小時，可按日期調整。</small></label>\n\n<label>每月超勤費上限（元）<input name=\"cap\" type=\"number\" min=\"0\" max=\"100000000\" step=\"0.01\"></label>\n<button class=\"primary apply\">套用試算</button>\n</div>\n<fieldset class=\"salary-settings\">\n<legend>公務人員（消防）超勤時薪</legend><div class=\"pay-lookup\"><label>資料帶入方式<select id=\"payMode\"><option value=\"manual\">手動金額（保留現有設定）</option><option value=\"auto\">俸點自動帶入</option></select></label><div id=\"payLookupFields\" class=\"pay-lookup-fields\" hidden><label>點數種類<select id=\"pointType\"><option value=\"police\">消防／警察薪俸額</option><option value=\"civil\">一般公務人員俸點</option></select></label><label id=\"pointsLabel\">薪俸點數<input id=\"payPoints\" type=\"number\" min=\"1\" max=\"800\" step=\"1\" list=\"payPointOptions\" placeholder=\"例如：500\"><datalist id=\"payPointOptions\"></datalist></label><label>本職核定官階<select id=\"fireGrade\"><option value=\"\">請選擇核定官階</option></select></label><label>待遇表版本<select id=\"payScheme\"><option value=\"114\">114/01 標準（加給調增前）</option><option value=\"11507-announced\">115/07 公告方案（依核定選用）</option></select></label><label class=\"pay-supervisor\"><input id=\"isSupervisor\" type=\"checkbox\">領有主管職務加給</label></div><p id=\"payLookupMessage\" class=\"muted\" role=\"status\">俸額與專業加給需分別依點數、本職核定官階帶入；同一俸點可能有不同官階。</p><details class=\"pay-source\"><summary>待遇表來源與適用說明</summary><p>內建 114/01 俸額及加給標準，以及 115/07 公告的專業、主管加給各增 2,000 元方案。115/11/20 公告另載明須俟追加預算案總統公布後生效，請依機關核定版本選用。未納入 116 年通案調薪。</p><p>警消薪俸額 500 與一般公務俸點 610 對應相同月支薪俸；請依薪資單所列欄位選擇。</p><p><a id=\"paySalarySource\" target=\"_blank\" rel=\"noopener noreferrer\">俸額表</a> · <a id=\"payProfessionalSource\" target=\"_blank\" rel=\"noopener noreferrer\">專業加給表（二）</a> · <a id=\"paySupervisorSource\" target=\"_blank\" rel=\"noopener noreferrer\">警消主管加給表</a> · <a id=\"payAnnouncement\" target=\"_blank\" rel=\"noopener noreferrer\">調整公告</a></p><p>本項只帶入原有超勤試算使用的薪俸、專業及主管加給；特殊補足差額或其他核定情形可切換手動金額。</p></details></div>\n<div class=\"salary-inputs\">\n<label>月支薪俸（元）<input id=\"salary\" name=\"salary\" type=\"number\" min=\"0\" max=\"10000000\" step=\"1\"></label>\n<label>每月專業加給（元）<input id=\"professional\" name=\"professional\" type=\"number\" min=\"0\" max=\"10000000\" step=\"1\"></label>\n<label>每月主管職務加給（元）<input id=\"supervisor\" name=\"supervisor\" type=\"number\" min=\"0\" max=\"10000000\" step=\"1\" placeholder=\"未支領可留空\"></label>\n<div class=\"salary-rate\"><span>每小時支給基準</span><output id=\"salaryRate\" for=\"salary professional supervisor\"></output></div>\n</div>\n<p class=\"muted\"><small>月支薪俸與適用加給合計 ÷ 240，四捨五入至元。 <a href=\"https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=S0030020&amp;flno=4\" target=\"_blank\" rel=\"noopener\">查閱支給辦法第 4 條</a></small></p>\n</fieldset>\n<details><summary>輪班起始日與當月正常工時</summary>\n<div class=\"topinputs\">\n<label>第一天勤務<input name=\"anchor\" type=\"date\" min=\"1912-01-01\" max=\"9999-12-31\" required></label>\n<label>當月正常辦公日數<input name=\"days\" type=\"number\" min=\"0\" max=\"31\" step=\"1\" aria-describedby=\"officeSource\" placeholder=\"留空自動帶入\"><small id=\"officeSource\" class=\"muted\"></small></label>\n<label>請領時數口徑<select name=\"claim\"><option value=\"ceil\">原表：整小時進位</option><option value=\"exact\">依金額換算，保留小數</option></select></label>\n</div>\n<div class=\"actions\"><button class=\"primary\">套用設定</button></div>\n</details>\n<p id=\"settingsMessage\" role=\"status\"></p>\n</form>\n<div class=\"targets\" id=\"targets\" aria-live=\"polite\"></div>\n</section>\n<section class=\"summary\" id=\"summary\" aria-label=\"月度摘要\"></section>\n\n<div class=\"layout\">\n<section class=\"panel calendar\">\n<div class=\"bar\"><h2 id=\"monthTitle\"></h2><button class=\"primary\" id=\"exportPng\" type=\"button\">匯出 PNG</button></div>\n<p id=\"exportStatus\" role=\"status\" hidden></p>\n<div class=\"grid\" id=\"grid\"></div>\n<div class=\"legend\"><span class=\"tag duty\">上班</span><span class=\"tag\">輪休</span><span class=\"tag credit\">假別計入工時</span><span class=\"tag custom\">外宿／個別調整</span></div>\n<p class=\"muted\"><small>點選日期檢視或調整。上班時數歸排班日期，跨月採同一口徑。</small></p>\n<div class=\"calc\" id=\"breakdown\"></div>\n<details><summary>工時定義與資料來源</summary>\n<p>正常工時會依人事行政總處政府行政機關辦公日曆自動帶入，每個辦公日計 8 小時。內建民國 106 至 116 年資料。欄位填入數字可套用單位核定的辦公日數，清空後即恢復自動。</p>\n<p>勤2休2自所選日期的第一天勤務起循環。勤務日指一班的開始日。排班工時扣除可扣計的休息，再加上單位核定可計入的工時。月超勤以計入工時減月正常工時，最低為零。</p>\n<p id=\"sampleNote\" hidden>請依個人核定排班及薪資設定試算。</p>\n<p>「補」計入 12 小時，「休、公、差、事、病、喪」各計入 8 小時。輪休為 0 小時。</p>\n<p>外宿按當日下班時間計入上班工時。外16、外17、外18、外19、外20 分別計入 8、9、10、11、12 小時。</p>\n<p>一般勤務以 24 小時扣除休息時間。預設扣 4 小時，計入 20 小時；當日休息改為 5 小時時，計入 19 小時。核定異動可直接輸入計入時數。金額為估算，以單位核定為準。</p>\n<p><a href=\"https://www.nfa.gov.tw/cht/index.php?article_id=13275&code=list&flag=detail&ids=1648\" target=\"_blank\" rel=\"noopener\">消防署勤休實施要點</a> · <a href=\"https://www.nfa.gov.tw/pro/index.php?article_id=13799&code=list&flag=detail&ids=115\" target=\"_blank\" rel=\"noopener\">消防署超勤加班費核發要點</a> · <a href=\"https://data.gov.tw/dataset/14718\" target=\"_blank\" rel=\"noopener\">人事行政總處辦公日曆</a></p></details>\n</section>\n\n</div>\n</main>\n<dialog id=\"personEditor\" aria-labelledby=\"personTitle\">\n<h2 id=\"personTitle\"></h2>\n<form id=\"personForm\">\n<label>姓名或代號<input name=\"name\" maxlength=\"40\" required autocomplete=\"off\"></label>\n<label id=\"personAnchor\">第一天勤務<input name=\"anchor\" type=\"date\" min=\"1912-01-01\" max=\"9999-12-31\" required></label>\n<p id=\"personMessage\" class=\"error\" role=\"status\"></p>\n<div class=\"actions\"><button class=\"primary\" id=\"savePerson\">儲存</button><button type=\"button\" id=\"cancelPerson\">取消</button></div>\n</form>\n</dialog>\n<dialog id=\"editor\"><h2 id=\"dateTitle\"></h2><form id=\"adjust\">\n<label>當日類型<select name=\"type\"><option value=\"duty\">上班</option><option value=\"off\">輪休</option><option value=\"comp\">補 · 12 小時</option><option value=\"leave\">休 · 8 小時</option><option value=\"official\">公 · 8 小時</option><option value=\"trip\">差 · 8 小時</option><option value=\"personal\">事 · 8 小時</option><option value=\"sick\">病 · 8 小時</option><option value=\"bereavement\">喪 · 8 小時</option><option value=\"credit\">其他核定計入</option><optgroup label=\"外宿\" id=\"overnightOptions\"></optgroup><option value=\"custom\">個別調整</option></select></label>\n<div id=\"dutyFields\">\n<label>當日休息時間（小時）<input name=\"restHours\" type=\"number\" min=\"4\" max=\"24\" step=\"any\" required><small class=\"muted\">至少 4 小時。</small></label></div>\n<p id=\"fixedHours\" role=\"status\"></p>\n<div id=\"minutesField\"><label id=\"hoursLabel\">計入工時（小時）</label><input id=\"manualHours\" name=\"hours\" type=\"number\" min=\"0\" max=\"24\" step=\"0.000001\" aria-labelledby=\"hoursLabel\"></div>\n<label>原表標記／備註<input maxlength=\"60\" name=\"note\"></label>\n<p id=\"adjustMessage\" role=\"status\" class=\"error\"></p>\n<div class=\"actions\"><button class=\"primary\">儲存日期</button><button type=\"button\" id=\"clear\">恢復勤2休2</button><button type=\"button\" id=\"close\">關閉</button></div>\n</form></dialog>";

'use strict';
const $ = id => document.getElementById(id);
const keys = {duty:'上班',off:'輪休',credit:'補休',custom:'調整'};
const leaveTypes = {
  comp:{label:'補',hours:12},
  leave:{label:'休',hours:8},
  official:{label:'公',hours:8},
  trip:{label:'差',hours:8},
  personal:{label:'事',hours:8},
  sick:{label:'病',hours:8},
  bereavement:{label:'喪',hours:8}
};
const overnightTypes = {out16:8,out17:9,out18:10,out19:11,out20:12};
const overnightLabel = type => '外'+type.slice(3);
for (const [type, hours] of Object.entries(overnightTypes)) {
  const option = document.createElement('option');
  option.value=type;
  option.textContent=overnightLabel(type)+' · '+hours+' 小時';
  $('overnightOptions').append(option);
}
// Monthly workday totals from DGPA's government office calendar (data.gov.tw/dataset/14718).
const officialOfficeDays = {
  2017:[18, 18, 23, 18, 21, 23, 21, 23, 22, 19, 22, 21],
  2018:[22, 15, 23, 18, 23, 20, 22, 23, 19, 22, 22, 21],
  2019:[23, 15, 20, 20, 23, 19, 23, 22, 20, 22, 21, 22],
  2020:[17, 20, 22, 20, 21, 21, 23, 21, 23, 19, 21, 23],
  2021:[20, 16, 22, 20, 21, 21, 22, 22, 21, 20, 22, 22],
  2022:[21, 15, 23, 19, 22, 21, 21, 23, 21, 20, 22, 22],
  2023:[16, 20, 24, 17, 23, 21, 21, 23, 21, 20, 22, 21],
  2024:[22, 16, 21, 20, 23, 19, 23, 22, 20, 22, 21, 22],
  2025:[17, 20, 21, 20, 21, 21, 23, 21, 21, 20, 20, 22],
  2026:[21, 14, 22, 20, 20, 21, 23, 21, 20, 20, 21, 22],
  2027:[20, 15, 22, 19, 21, 21, 22, 22, 20, 19, 22, 21]
};
const officialDays = month => {
  const [year,monthNumber]=month.split('-').map(Number);
  return officialOfficeDays[year]?.[monthNumber-1];
};
const sampleMonth = '2026-12';
const key = 'fire-duty-calendar-people-v1';
const legacyKey = 'fire-duty-calendar-v1';
const initialRestHours = 4;
const exampleDays = {};
const sampleGroups = [];
for (const [days, data] of sampleGroups) {
  for (const day of days) exampleDays[sampleMonth+'-'+String(day).padStart(2,'0')] = data;
}
const defaults = {name:'人員 1',anchor:'2026-12-01',restHours:initialRestHours,rate:null,cap:null,claim:'ceil',office:{},overrides:exampleDays,month:sampleMonth};
const firstId = 'person-1';
function normalizeExampleName(person) {}
function readDirectory() {
  try {
    const saved=JSON.parse(localStorage.getItem(key));
    if (saved?.people && Object.hasOwn(saved.people,saved.activeId)) {
      normalizeExampleName(saved.people[firstId]);
      return saved;
    }
  } catch {}
  return null;
}
let directory=readDirectory();
const existingDirectory=directory!=null;
if (!directory) {
  let first=structuredClone(defaults);
  try {
    const old=JSON.parse(localStorage.getItem(legacyKey));
    if (old) {
      first={...first,...old};
      if (old.anchor==='2026-12-03') first.anchor=defaults.anchor;
      if (!old.officeAuto && first.office[sampleMonth]===21) delete first.office[sampleMonth];
    }
  } catch {}
  normalizeExampleName(first);
  directory={activeId:firstId,people:{[firstId]:first}};
}
let state=directory.people[directory.activeId];
const settings = $('settings'), adjust = $('adjust'), personForm = $('personForm');
let month = state.month;
let selected;
let editingPerson = false;
const hour = n => new Intl.NumberFormat('zh-TW',{maximumFractionDigits:2}).format(n);
const round = n => Math.round(n * 100) / 100;
const val = (form, name) => form.elements.namedItem(name);
const value = (form, name) => val(form,name).value;
const number = (form,name) => value(form,name) === '' ? null : Number(value(form,name));
const dayIndex = date => Date.parse(date+'T00:00:00Z')/86400000;
function persist() {
  const latest=readDirectory();
  if (latest) directory.people={...latest.people,[directory.activeId]:state};
  try {
    localStorage.setItem(key,JSON.stringify(directory));
    return true;
  } catch {return false}
}
function validateRest(hours) {
  if (!Number.isFinite(hours) || hours < 4 || hours > 24) {
    throw Error('休息時間須介於 4 至 24 小時。');
  }
}
function migrateRest(periods) {
  const minutes = value => Number(value.slice(0,2))*60 + Number(value.slice(3));
  const hours = periods.reduce((total,[from,to]) => total + (minutes(to)-minutes(from)+1440)%1440,0)/60;
  return hours>=4 && hours<=24 ? hours : initialRestHours;
}
if (!existingDirectory) {
  if (Array.isArray(state.rest)) {
    state.restHours=migrateRest(state.rest);
    delete state.rest;
  }
  for (const data of Object.values(state.overrides)) {
    if (Array.isArray(data.rest)) {
      data.restHours=migrateRest(data.rest);
      delete data.rest;
    }
  }
  for (const [date, original] of Object.entries(exampleDays)) {
    const saved = state.overrides[date];
    if (original.type==='out16' && saved?.type==='custom' && saved.hours===8 && saved.note==='外16') {
      state.overrides[date]={...original};
    }
    if (original.type==='comp' && saved?.type==='credit' && saved.hours===12 && ['補','补'].includes(saved.note)) {
      state.overrides[date]={...original};
    }
    if (original.sample && saved?.type==='duty' && saved.hours===20 && Object.keys(saved).length===2) {
      state.overrides[date]={...original};
    }
  }
}
function fillPeople() {
  const select=$('peopleSelect');
  select.replaceChildren();
  for (const [id, person] of Object.entries(directory.people)) {
    const option=document.createElement('option');
    option.value=id;
    option.textContent=person.name;
    select.append(option);
  }
  select.value=directory.activeId;
}
function selectPerson(id) {
  const latest=readDirectory();
  if (latest) directory.people={...directory.people,...latest.people};
  if (!Object.hasOwn(directory.people,id)) return;
  directory.activeId=id;
  state=directory.people[id];
  month=state.month;
  $('settingsMessage').textContent='';
  fillPeople();
  fillSettings();
  render();
  const saved=persist();
  $('peopleStatus').hidden=saved;
  $('peopleStatus').textContent=saved?'':'目前瀏覽器無法保留人員資料。';
}
function openPersonEditor(rename) {
  editingPerson=rename;
  $('personTitle').textContent=rename?'更改人員名稱':'新增人員';
  $('personAnchor').hidden=rename;
  val(personForm,'anchor').disabled=rename;
  val(personForm,'anchor').value=month+'-01';
  val(personForm,'name').value=rename?state.name:'';
  $('personMessage').textContent='';
  $('personEditor').showModal();
  val(personForm,'name').focus();
}
$('peopleSelect').onchange=e=>selectPerson(e.target.value);
$('addPerson').onclick=()=>openPersonEditor(false);
$('renamePerson').onclick=()=>openPersonEditor(true);
$('cancelPerson').onclick=()=>$('personEditor').close();
personForm.onsubmit=e=>{
  e.preventDefault();
  const name=value(personForm,'name').trim();
  const feedback=$('personMessage');
  const latest=readDirectory();
  if (latest) directory.people={...directory.people,...latest.people};
  if (!name) {
    feedback.textContent='請輸入姓名或代號。';
    return;
  }
  if (Object.entries(directory.people).some(([id, person])=>
    (!editingPerson || id!==directory.activeId) && person.name.toLocaleLowerCase()===name.toLocaleLowerCase())) {
    feedback.textContent='已有同名人員，請加上可辨識的代號。';
    return;
  }
  if (editingPerson) {
    state=directory.people[directory.activeId];
    state.name=name;
  } else {
    const id=globalThis.crypto?.randomUUID?.() ?? 'person-'+Date.now()+'-'+Math.random().toString(36).slice(2);
    const anchor=value(personForm,'anchor');
    state={name,anchor,restHours:initialRestHours,rate:null,cap:null,claim:'ceil',
      office:{},overrides:{},month:anchor.slice(0,7)};
    directory.activeId=id;
    directory.people[id]=state;
    month=state.month;
  }
  const saved=persist();
  $('personEditor').close();
  $('peopleStatus').hidden=false;
  $('peopleStatus').textContent=saved?(editingPerson?'名稱已更新。':'已新增並切換至 '+name+'。')
    :'人員資料已更新，目前瀏覽器無法保留資料。';
  $('settingsMessage').textContent='';
  fillPeople();
  fillSettings();
  render();
};
function dayData(date) {
  const phase = ((dayIndex(date)-dayIndex(state.anchor))%4+4)%4;
  const data = state.overrides[date] ?? {type:phase<2?'duty':'off'};
  if (data.type === 'off') return {...data,work:0,credit:0,rest:0};
  if (Object.hasOwn(leaveTypes,data.type)) return {...data,work:0,credit:leaveTypes[data.type].hours,rest:0};
  if (data.type === 'credit') return {...data,work:0,credit:data.hours,rest:0};
  if (Object.hasOwn(overnightTypes,data.type)) return {...data,work:overnightTypes[data.type],credit:0,rest:null};
  if (data.hours != null) return {...data,work:data.hours,credit:0,rest:null};
  const rest = data.restHours ?? state.restHours;
  return {...data,work:24-rest,credit:0,rest};
}
const salaryFields=['salary','professional','supervisor'];
function officialRate(pay) {
  if (pay?.salary==null || pay.professional==null) return null;
  return Math.round((pay.salary+pay.professional+(pay.supervisor??0))/240);
}
function enteredPay() {
  return Object.fromEntries(salaryFields.map(field=>[field,number(settings,field)]));
}
function updateSalaryPreview() {
  const pay=enteredPay();
  const rate=officialRate(pay);
  const empty=salaryFields.every(field=>pay[field]==null);
  $('salaryRate').textContent=rate!=null?hour(rate)+' 元／小時'
    :empty&&state.rate!=null?hour(state.rate)+' 元／小時（原設定）':'請填月支薪俸及專業加給';
}
for(const [grade,label] of FIRE_GRADES){const option=document.createElement('option');option.value=grade;option.textContent=label+'（相當職等 '+grade+'）';$('fireGrade').append(option);}
for(const [id,key] of [['paySalarySource','salary'],['payProfessionalSource','professional'],['paySupervisorSource','supervisor'],['payAnnouncement','announcement']])$(id).href=PAY_SOURCES[key];
function paySetup(){return {mode:$('payMode').value,pointType:$('pointType').value,points:$('payPoints').value,grade:$('fireGrade').value,scheme:$('payScheme').value,isSupervisor:$('isSupervisor').checked};}
function applyPayLookup(){
 const setup=paySetup(),automatic=setup.mode==='auto';$('payLookupFields').hidden=!automatic;
 for(const field of salaryFields)val(settings,field).readOnly=automatic;
 $('payPoints').placeholder=setup.pointType==='police'?'例如：500':'例如：610';
 $('payPointOptions').replaceChildren(...SALARY_ROWS.filter(r=>r[setup.pointType==='police'?1:0]!=null).map(r=>{const option=document.createElement('option');option.value=r[setup.pointType==='police'?1:0];return option;}));
 if(automatic){
  try{const pay=lookupFirePay(setup,month);for(const field of salaryFields)val(settings,field).value=pay[field];$('payLookupMessage').textContent='已自動帶入。按「套用試算」儲存；需個別修正請切換手動金額。';$('payLookupMessage').className='saved';}
  catch(error){for(const field of salaryFields)val(settings,field).value='';$('payLookupMessage').textContent=error.message;$('payLookupMessage').className='error';}
 }else{$('payLookupMessage').textContent='手動金額可保留核定差額；選擇「俸點自動帶入」即可查表。';$('payLookupMessage').className='muted';}
 updateSalaryPreview();
 if(automatic&&salaryFields.every(field=>number(settings,field)==null))$('salaryRate').textContent='請完成點數與官階設定';
}
for(const id of ['payMode','pointType','payPoints','fireGrade','payScheme','isSupervisor'])$(id).addEventListener(id==='payPoints'?'input':'change',applyPayLookup);
for (const field of salaryFields) val(settings,field).oninput=updateSalaryPreview;
function totals(days, office, rate, cap, claim) {
  const sum = field => days.reduce((acc,d)=>acc+d[field],0);
  const work = sum('work'), credit = sum('credit');
  const normal = office == null ? null : office*8;
  const extra = normal == null ? null : Math.max(0,work+credit-normal);
  const target = rate > 0 && cap != null ? cap/rate : null;
  const limit = target == null ? null : (claim==='ceil'?Math.ceil(Math.round(cap*100)/Math.round(rate*100)):target);
  const paid = limit == null || extra == null ? null : Math.min(extra,limit);
  return {work,credit,normal,extra,target,limit,paid,amount:paid==null?null:round(Math.min(cap,paid*rate))};
}
const show = (n,suffix=' 小時') => n==null?'待填寫':hour(n)+suffix;
function monthView() {
  const [year,number] = month.split('-').map(Number);
  const firstDay = new Date(Date.UTC(year,number-1,1)).getUTCDay();
  const count = new Date(Date.UTC(year,number,0)).getUTCDate();
  const days = Array.from({length:count},(_,i)=>{
    const date=month+'-'+String(i+1).padStart(2,'0');
    const data=dayData(date);
    const leave=leaveTypes[data.type];
    const overnight=Object.hasOwn(overnightTypes,data.type);
    const label=overnight?overnightLabel(data.type):(leave?.label??keys[data.type]);
    const style=leave?'credit':(overnight?'custom':data.type);
    return {...data,date,label,style};
  });
  return {title:'民國 '+(year-1911)+' 年 '+number+' 月',firstDay,days};
}
function render() {
  const {title,firstDay,days}=monthView();
  $('month').value = month;
  $('monthTitle').textContent = title;
  $('sampleNote').hidden=directory.activeId!==firstId || month!==sampleMonth;
  const manualDays = state.office[month];
  const officeDays = manualDays ?? officialDays(month);
  const t = totals(days,officeDays,officialRate(state.pay)??state.rate,state.cap,state.claim);
  const duty = days.filter(d => d.type==='duty' || d.work>0).length;
  const goal = t.limit===0 ? 0 : (t.normal==null || t.limit==null ? null : t.normal+t.limit);
  const required = goal==null ? null : Math.max(0,goal-t.credit);
  const remaining = required==null ? null : Math.max(0,required-t.work);
  const targets = [
    ['報滿所需超勤時數',show(t.limit),'超勤費上限 ÷ 時薪，依請領口徑換算'],
    ['本月上班時數目標',show(required),'正常工時 ＋ 所需超勤 − 核定計入時數'],
    ['依目前排班還需上班',show(remaining),remaining===0?'目前排班已足額':'報滿所需上班時數 − 目前上班時數']
  ];
  $('targets').innerHTML = targets.map(([title,num,caption])=>'<div class="metric"><span>'+title+'</span><strong>'+num+'</strong><small>'+caption+'</small></div>').join('');
  const metrics = [
    ['目前排班上班時數',show(t.work),duty+' 個有勤務時數的日期'],
    ['正常工時',show(t.normal),t.normal==null?'請填寫當月正常辦公日數':officeDays+' 個辦公日 × 8 小時'+(manualDays==null?' · 官方日曆':' · 手動設定')],
    ['月超勤時數',show(t.extra),'計入工時 '+show(t.work+t.credit)],
    ['預估超勤費',show(t.amount,' 元'),t.paid==null?'請填寫核算資料':'依 '+show(t.paid)+' 估算']
  ];
  $('summary').innerHTML = metrics.map(([title,num,caption])=>'<div class="metric"><span>'+title+'</span><strong>'+num+'</strong><small>'+caption+'</small></div>').join('');
  const grid = $('grid');
  grid.replaceChildren();
  for (const label of '日一二三四五六') {
    const cell = document.createElement('div');
    cell.className = 'weekday';
    cell.textContent = label;
    grid.append(cell);
  }
  for(let i=0;i<firstDay;i++) grid.append(document.createElement('span'));
  days.forEach((d,i)=>{
    const button = document.createElement('button');
    button.className='day '+d.style;
    const numberNode=document.createElement('b'),labelNode=document.createElement('span'),hoursNode=document.createElement('small');numberNode.textContent=String(i+1);labelNode.textContent=d.label;hoursNode.textContent=(d.work+d.credit)>0?show(d.work+d.credit):'';button.append(numberNode,labelNode,hoursNode);
    const restLabel = d.type==='duty' && d.rest!=null ? '休息 '+show(d.rest) : '';
    if (restLabel) {
      const rest = document.createElement('small');
      rest.textContent=restLabel;
      button.append(rest);
    }
    button.setAttribute('aria-label',d.date+' '+d.label+' '+show(d.work+d.credit)+(restLabel?'，'+restLabel:''));
    button.onclick=()=>openDay(d.date);
    grid.append(button);
  });
  const lines = [
    ['假別等核定計入',show(t.credit)],
    ['休息時間合計',show(days.reduce((sum,d)=>sum+(d.rest??0),0))+(days.some(d=>d.rest===null)?'（部分日期未提供）':'')],
    ['金額上限 ÷ 時薪',show(t.target)],
    ['報滿需計入的月工時',show(goal)],
    ['達上限的每勤務日平均超勤',show(t.target==null||duty===0?null:t.limit/duty)],
    ['超勤扣除預估請領後剩餘',show(t.paid==null?null:Math.max(0,t.extra-t.paid))]
  ];
  $('breakdown').innerHTML = lines.map(([label,num])=>'<div class="tableline"><span>'+label+'</span><b>'+num+'</b></div>').join('');
}
function makeMonthImage(view, person) {
  const width=1440, margin=54, gap=10, rowHeight=122, top=217;
  const cellWidth=(width-2*margin-6*gap)/7;
  const rows=Math.ceil((view.firstDay+view.days.length)/7);
  const height=top+rows*(rowHeight+gap)+74;
  const canvas=document.createElement('canvas');
  canvas.width=width;
  canvas.height=height;
  const ctx=canvas.getContext('2d');
  if (!ctx) throw Error('目前瀏覽器無法產生圖片。');
  const palette={
    duty:{fill:'#e6f3ec',ink:'#235e4c'},
    off:{fill:'#f2f5f8',ink:'#536478'},
    credit:{fill:'#edf0fc',ink:'#4d5290'},
    custom:{fill:'#fff0e2',ink:'#8b461f'}
  };
  const font='"Microsoft JhengHei","PingFang TC","Noto Sans TC",sans-serif';
  function text(value,x,y,size,color,weight=400,maxWidth) {
    ctx.font=weight+' '+size+'px '+font;
    ctx.fillStyle=color;
    if (maxWidth) ctx.fillText(value,x,y,maxWidth);
    else ctx.fillText(value,x,y);
  }
  function block(x,y,w,h,fill) {
    ctx.fillStyle=fill;
    ctx.fillRect(x,y,w,h);
  }
  block(0,0,width,height,'#ffffff');
  block(0,0,width,151,'#192c43');
  block(0,151,width,4,'#ce7849');
  text('消防勤休月曆',margin,49,25,'#dae3ef',700);
  text(view.title,margin,109,43,'#ffffff',700);
  const personX=width/2+35;
  text(person,personX,106,34,'#ffffff',700,width-personX-margin);
  [...'日一二三四五六'].forEach((weekday,i)=>{
    const x=margin+i*(cellWidth+gap);
    ctx.textAlign='center';
    text(weekday,x+cellWidth/2,195,23,i===0||i===6?'#8b461f':'#182638',700);
    ctx.textAlign='start';
  });
  for (let index=0; index<rows*7; index++) {
    const x=margin+index%7*(cellWidth+gap);
    const y=top+Math.floor(index/7)*(rowHeight+gap);
    const day=view.days[index-view.firstDay];
    if (!day) {
      block(x,y,cellWidth,rowHeight,'#f6f8f7');
      continue;
    }
    const theme=palette[day.style];
    block(x,y,cellWidth,rowHeight,theme.fill);
    text(String(index-view.firstDay+1),x+14,y+32,25,'#172b2d',700);
    text(day.label,x+14,y+65,23,theme.ink,700,cellWidth-28);
    if (day.work+day.credit>0) text(show(day.work+day.credit),x+14,y+92,20,'#172b2d');
    if (day.type==='duty' && day.rest!=null) text('休息 '+show(day.rest),x+14,y+115,17,'#405b58');
  }
  const legend=[['duty','上班'],['off','輪休'],['credit','假別計入工時'],['custom','外宿／個別調整']];
  let x=margin;
  for (const [style,label] of legend) {
    block(x,height-46,18,18,palette[style].fill);
    text(label,x+26,height-30,20,'#405b58');
    x+=label.length*20+62;
  }
  return canvas;
}
$('exportPng').onclick=()=>{
  const button=$('exportPng'), status=$('exportStatus');
  button.disabled=true;
  status.hidden=true;
  function finish(message,isError=false) {
    status.textContent=message;
    status.className=isError?'error':'saved';
    status.hidden=false;
    button.disabled=false;
  }
  try {
    const person=state.name;
    const safeName=person.replace(/[<>:"/\|?*]/g,'_');
    const filename=safeName+'_'+month+'_排班.png';
    makeMonthImage(monthView(),person).toBlob(blob=>{
      if (!blob) {
        finish('圖片產生失敗，請再試一次。',true);
        return;
      }
      try {
        const url=URL.createObjectURL(blob);
        const link=document.createElement('a');
        link.href=url;
        link.download=filename;
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(()=>URL.revokeObjectURL(url),30000);
        finish('已送出 PNG 下載。');
      } catch {
        finish('無法下載圖片，請再試一次。',true);
      }
    },'image/png');
  } catch {
    finish('目前瀏覽器無法產生圖片。',true);
  }
};
function fillSettings() {
  for(const name of ['anchor','restHours','cap','claim']) val(settings,name).value=state[name]??'';
  for (const field of salaryFields) val(settings,field).value=state.pay?.[field]??'';
  const setup=state.payLookup||{mode:'manual',pointType:'police',points:'',grade:'',scheme:'114',isSupervisor:false};
  for(const [id,key] of [['payMode','mode'],['pointType','pointType'],['payPoints','points'],['fireGrade','grade'],['payScheme','scheme']])$(id).value=setup[key]??'';
  $('isSupervisor').checked=setup.isSupervisor===true;applyPayLookup();
  const official=officialDays(month);
  const officeInput=val(settings,'days');
  officeInput.value=state.office[month]??'';
  officeInput.placeholder=official==null?'請填辦公日數':'自動：'+official+' 日';
  $('officeSource').textContent=official==null?'所選月份尚無內建資料。':'官方日曆 '+official+' 日 · 留空使用官方基準';
  val(settings,'days').max=new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5)),0)).getUTCDate();
}
function switchMonth(next) {
  if(!/^\d{4}-\d\d$/.test(next)||next<'1912-01'||next>'9999-12') return;
  month=state.month=next;
  persist();
  fillSettings();
  $('settingsMessage').textContent='';
  render();
}
function stepMonth(offset) {
  const [y,m]=month.split('-').map(Number);
  const next=new Date(Date.UTC(y,m-1+offset,1)).toISOString().slice(0,7);
  switchMonth(next);
}
$('prev').onclick=()=>stepMonth(-1);
$('next').onclick=()=>stepMonth(1);
$('month').onchange=e=>switchMonth(e.target.value);
settings.onsubmit=e=>{
  e.preventDefault();
  const feedback=$('settingsMessage');
  try {
    const restHours=number(settings,'restHours');
    validateRest(restHours);
    const lookup=paySetup();
    if(lookup.mode==='auto')lookupFirePay(lookup,month);
    const pay=enteredPay();
    const empty=salaryFields.every(field=>pay[field]==null);
    if (!empty && officialRate(pay)==null) throw Error('請填寫月支薪俸與每月專業加給。無專業加給可填 0。');
    Object.assign(state,{anchor:value(settings,'anchor'),restHours,payLookup:lookup,pay:empty?null:pay,
      cap:number(settings,'cap'),claim:value(settings,'claim')});
    const manualDays=number(settings,'days');
    if (manualDays==null) delete state.office[month];
    else state.office[month]=manualDays;
    feedback.className='saved';
    feedback.textContent=persist()?'設定已儲存。':'設定已更新，當前瀏覽器無法保留資料。';
    render();
  } catch (error) {feedback.className='error';feedback.textContent=error.message}
};
function openDay(date) {
  selected=date;
  const data=dayData(date);
  $('dateTitle').textContent=date+' · 日期調整';
  val(adjust,'type').value=data.type;
  val(adjust,'hours').value=data.hours??'';
  val(adjust,'note').value=data.note??'';
  val(adjust,'restHours').value=state.overrides[date]?.restHours??state.restHours;
  $('adjustMessage').textContent='';
  fields();
  $('editor').showModal();
}
function fields() {
  const type=value(adjust,'type'), duty=type==='duty', off=type==='off';
  $('dutyFields').hidden=!duty;
  $('dutyFields').querySelectorAll('input').forEach(input=>input.disabled=!duty);
  const leave = leaveTypes[type];
  const overnight = overnightTypes[type];
  const manual = !off && !leave && overnight==null;
  $('fixedHours').textContent=leave ? '此假別計入 '+show(leave.hours)+'。'
    : overnight!=null ? '當日 '+type.slice(3)+':00 下班，計入上班 '+show(overnight)+'。' : '';
  $('minutesField').hidden=!manual;
  val(adjust,'hours').disabled=!manual;
  val(adjust,'hours').required=manual&&!duty;
  $('hoursLabel').textContent=duty?'直接指定計入小時（留空則依 24 小時扣除休息）':'計入工時（小時）';
}
val(adjust,'type').onchange=fields;
$('close').onclick=()=>$('editor').close();
$('clear').onclick=()=>{
  delete state.overrides[selected];
  persist();
  $('editor').close();
  render();
};
adjust.onsubmit=e=>{
  e.preventDefault();
  try {
    const data={type:value(adjust,'type'),note:value(adjust,'note')};
    if(data.type!=='off' && !Object.hasOwn(leaveTypes,data.type) && !Object.hasOwn(overnightTypes,data.type)) data.hours=number(adjust,'hours');
    if(data.type==='duty') {
      if (data.hours == null) {
        data.restHours=number(adjust,'restHours');
        validateRest(data.restHours);
      }
    }
    state.overrides[selected]=data;
    persist();
    $('editor').close();
    render();
  } catch (error) {$('adjustMessage').textContent=error.message}
};
fillPeople();
fillSettings();
render();
