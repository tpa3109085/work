// 入口分流：預設顯示卡片入口；?view=todos 進管制事項；?view=duty 進即時看板；?view=odis 進公文系統
const VERSION = '20261127-entry-repair3';
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
  // 首頁固定顯示四個入口；工作清單及登入表單只在管制事項頁載入。
  document.body.className = 'home-page';
  document.body.innerHTML = '<main class="home-shell"><div id="homeEntry"></div></main>';
  await import(`./home.js?v=${VERSION}`);
}
