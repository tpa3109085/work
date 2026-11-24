document.title='工作平台｜鹿野分隊';
// 入口頁：兩個卡片區（管制事項 / 鹿野分隊即時看板）
const VERSION = '20261124-duty-cloud1';

const CARDS = [
  {
    key: 'todos',
    href: './?view=todos',
    icon: '☑',
    title: '管制事項',
    desc: '交辦事項清單、期限追蹤、承辦人與交辦情形。可勾選完成、修改期限、查看原文。',
    meta: '清單 · 期限 · 交辦',
    cta: '進入管制事項'
  },
  {
    key: 'duty',
    href: './?view=duty',
    icon: '◉',
    title: '分隊即時看板',
    desc: '查看鹿野分隊單位狀態、當日勤務、車輛與火搶裝備保養，以及 iCare 填報情形。',
    meta: '單位狀態 · 勤務 · 裝備 · 未填報',
    cta: '進入即時看板'
  },
  {key:'calendar',href:'./?view=calendar',icon:'▦',title:'個人勤休月曆',desc:'多人排班、勤二休二月曆、個別日期調整、超勤時數與金額試算，以及 PNG 匯出。',meta:'勤休 · 月曆 · 超勤試算',cta:'進入勤休月曆'}
];

function el(tag, text, cls) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (cls) node.className = cls;
  return node;
}

function cardIcon(key){
 const box=el('span',undefined,'home-card-icon');box.setAttribute('aria-hidden','true');
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 for(const [attr,value] of Object.entries({viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':'1.7','stroke-linecap':'round','stroke-linejoin':'round'}))svg.setAttribute(attr,value);
 const paths={todos:['M9 5h10v15H5V5h1','M9 3h6v4H9z','m8 13 2 2 5-5'],duty:['M3 4h18v12H3z','M8 21h8','M12 16v5','M7 12V9','M12 12V7','M17 12v-2'],calendar:['M4 5h16v16H4z','M8 3v4','M16 3v4','M4 10h16','M8 14h1','M14 14h2','M8 18h1']};
 for(const d of paths[key]){const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',d);svg.append(path);}box.append(svg);return box;
}

function buildCard(card) {
  const link = el('a', undefined, `home-card home-card--${card.key}`);
  link.href = card.href;
  link.setAttribute('aria-label', `${card.title}：${card.desc}`);

  const top = el('div', undefined, 'home-card-top');
  top.append(cardIcon(card.key), el('span', card.meta, 'home-card-meta'));

  const body = el('div', undefined, 'home-card-body');
  body.append(el('h2', card.title, 'home-card-title'), el('p', card.desc, 'home-card-desc'));

  const cta = el('span', card.cta, 'home-card-cta');

  link.append(top, body, cta);
  return link;
}

function clock() {
  const target = document.getElementById('homeClock');
  if (!target) return;
  target.textContent = new Date().toLocaleString('zh-TW', {
    timeZone: 'Asia/Taipei',
    hour12: false
  });
}

function render() {
  const host = document.getElementById('homeEntry');
  if (!host) return;

  host.replaceChildren();

  const head = el('header', undefined, 'home-head');
  head.append(
    el('p', '鹿野分隊 · 每日工作入口', 'home-eyebrow'),
    el('h1', '工作平台', 'home-title'),
    el('p', '管制事項、分隊即時看板與個人勤休月曆，整合交辦追蹤、勤務狀態與個人排班。', 'home-sub')
  );

  const grid = el('div', undefined, 'home-cards');
  for (const card of CARDS) grid.append(buildCard(card));

  const foot = el('p', undefined, 'home-foot');
  foot.append(el('span', '台北時間　'), el('span', '', 'home-clock'));
  foot.lastChild.id = 'homeClock';

  host.append(head, grid, foot);

  clock();
  setInterval(clock, 1000);
}

render();
