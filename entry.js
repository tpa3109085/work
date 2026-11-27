// 入口分流：預設顯示卡片入口；?view=todos 進管制事項；?view=duty 進即時看板；?view=odis 進公文系統
const VERSION = '20261127-home-worklist2';
const params = new URLSearchParams(location.search);
const view = params.get('view');

if (view === 'duty' || location.hash === '#firemisSection') {
  await import(`./duty-board.js?v=${VERSION}`);
} else if (view === 'calendar') {
  await import(`./duty-calendar.js?v=${VERSION}`);
} else if (view === 'odis') {
  location.replace(`./odis.html?v=${VERSION}`);
} else if (view === 'todos') {
  document.body.className = 'todos-page';
  await import(`./app.js?v=${VERSION}`);
} else {
  // 入口頁：保留既有工作清單 DOM，由 home.js 重排為卡片＋登入／清單
  document.body.className = 'home-page todos-page';
  await import(`./home.js?v=${VERSION}`);
}
