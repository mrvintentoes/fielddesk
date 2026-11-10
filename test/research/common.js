'use strict';
// Shared helpers for the research-feature checks. Run each test with:
//   xvfb-run -a -s "-screen 0 1440x900x24" node test/research/<name>.js
const path = require('path'), fs = require('fs'), http = require('http'), cp = require('child_process');
const lib = require('../lib');
const SCRATCH = process.env.FD_SCRATCH || '/tmp/claude-0/-home-claude/afeb33f8-cbaa-5a21-a4a6-1788f1ba6c50/scratchpad/research';
fs.mkdirSync(SCRATCH, { recursive: true });
const SHOTS = path.join(SCRATCH, 'shots'); fs.mkdirSync(SHOTS, { recursive: true });

const LONG = Array.from({ length: 400 }, (_, i) => 'Sentence number ' + i + ' of a very long passage about marching tempo and supply.').join(' ');
function pageHtml(name, links, extra) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Fixture ${name}</title>
<style>body{font:16px/1.5 Georgia;margin:30px;max-width:700px}p{margin:14px 0}</style></head><body>
<h1>Fixture page ${name}</h1>
<p id="p1">Caesar marched ${name} with remarkable speed, covering ground that his enemies thought impossible in the season.</p>
<p id="p2">He said "veni, vidi, vici" &amp; meant it; the legions' supply wagons followed.</p>
<p id="p3">&lt;img src=x onerror=alert(1)&gt; &lt;script&gt;window.__pwn=1&lt;/script&gt; markup-like text [brackets] (parens) *stars* _under_ # hash</p>
<p id="p4">Line one of a block<br>Line two of a block<br><br>Line four after a blank</p>
<p id="long">${LONG}</p>
<p>${(links || []).map((l) => `<a id="to${l}" href="/${l}">go to ${l}</a>`).join(' | ')}</p>
<p><a id="blank" href="/E" target="_blank">open E in new window</a></p>
${extra || ''}
</body></html>`;
}
const PAGES = {
  A: pageHtml('A', ['B', 'D']), B: pageHtml('B', ['C', 'A']), C: pageHtml('C', ['A']), D: pageHtml('D', ['A']), E: pageHtml('E', ['A']),
  X: pageHtml('X', ['Y']), Y: pageHtml('Y', ['X']),
  spa: pageHtml('SPA', ['A'], `<p><a id="push" href="#">pushState to /spa2</a></p><script>document.getElementById('push').onclick=function(e){e.preventDefault();history.pushState({},'','/spa2');document.title='Fixture SPA2';}</script>`),
  titles: pageHtml('Titles', ['A'], `<script>var n=0;setInterval(function(){document.title='Tick '+(n++);},60);</script>`),
  'paren_(x)': pageHtml('Paren', ['A'])
};
function startServer() {
  return new Promise((res) => {
    const srv = http.createServer((req, rsp) => {
      const k = decodeURIComponent(req.url.split('?')[0].slice(1));
      if (k === 'slow') { setTimeout(() => { rsp.writeHead(200, { 'content-type': 'text/html' }); rsp.end(PAGES.A); }, 1500); return; }
      const body = PAGES[k];
      if (!body) { rsp.writeHead(404); rsp.end('nope'); return; }
      rsp.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); rsp.end(body);
    });
    srv.listen(0, '127.0.0.1', () => res({ srv, base: 'http://127.0.0.1:' + srv.address().port }));
  });
}
function profile(name, fresh) {
  const p = path.join(SCRATCH, 'profiles', name);
  if (fresh) fs.rmSync(p, { recursive: true, force: true });
  return p;
}
const views = (app) => app.evaluate(() => [...global.__fieldDesk.tabs.entries()].map(([id, t]) => ({ id, url: t.view.webContents.getURL(), visible: t.view.getVisible(), bounds: t.view.getBounds() })));
// The Playwright page for a tab's live view (matched by URL).
async function viewPage(app, urlPart) {
  for (let i = 0; i < 40; i++) {
    for (const p of app.windows()) { try { if (p.url().includes(urlPart)) return p; } catch (_) {} }
    await lib.sleep(150);
  }
  throw new Error('no view page for ' + urlPart);
}
// Real right-click at page coordinates in a tab's view; returns the menu items (flattened).
async function rightClick(app, tabId, x, y) {
  await app.evaluate(({}, a) => { global.__fdBefore = global.__fieldDesk.lastContextMenu(); const wc = global.__fieldDesk.tabs.get(a.tabId).view.webContents;
    wc.sendInputEvent({ type: 'mouseDown', button: 'right', x: a.x, y: a.y, clickCount: 1 }); wc.sendInputEvent({ type: 'mouseUp', button: 'right', x: a.x, y: a.y, clickCount: 1 }); }, { tabId, x, y });
  for (let i = 0; i < 30; i++) { await lib.sleep(100); if (await app.evaluate(() => global.__fieldDesk.lastContextMenu() !== global.__fdBefore && !!global.__fieldDesk.lastContextMenu())) break; }
  return menuItems(app);
}
const menuItems = (app) => app.evaluate(() => { const m = global.__fieldDesk.lastContextMenu(); if (!m) return null; const out = [];
  const walk = (menu, pre) => menu.items.forEach((i) => { out.push({ id: i.id || null, label: pre + i.label, enabled: i.enabled, type: i.type }); if (i.submenu) walk(i.submenu, pre + i.label + ' > '); }); walk(m, ''); return out; });
const menuClick = (app, id) => app.evaluate(({}, id) => { const m = global.__fieldDesk.lastContextMenu(); let hit = null;
  const walk = (menu) => menu.items.forEach((i) => { if (i.id === id) hit = hit || i; if (i.submenu) walk(i.submenu); }); walk(m); m.closePopup(); if (!hit) return false; hit.click(); return true; }, id);
const menuClose = (app) => app.evaluate(() => { const m = global.__fieldDesk.lastContextMenu(); if (m) m.closePopup(); });
// Click an application-menu item by label (what a shortcut would fire).
const appMenu = (app, label) => app.evaluate(({ Menu }, label) => { let hit = null; const walk = (m) => m.items.forEach((i) => { if (i.label === label) hit = i; if (i.submenu) walk(i.submenu); }); walk(Menu.getApplicationMenu()); if (!hit) return false; hit.click(); return hit.accelerator || true; }, label);
function rootShot(name) { const f = path.join(SHOTS, name + '.png'); try { cp.execSync('import -window root ' + JSON.stringify(f)); } catch (e) { console.log('  shot failed', e.message); } return f; }
const state = (ui) => ui.evaluate(() => JSON.parse(JSON.stringify(FD.S.state)));
const ws = (ui) => ui.evaluate(() => JSON.parse(JSON.stringify(FD.ws())));
const slots = (ui) => ui.evaluate(() => [...document.querySelectorAll('.webslot')].filter((s) => s.isConnected).map((s) => { const b = s.getBoundingClientRect(); return { id: s.dataset.tab, x: Math.round(b.left), y: Math.round(b.top), width: Math.round(b.width), height: Math.round(b.height) }; }));
async function setWindow(app, w, h) { await app.evaluate(({ BrowserWindow }, s) => { const win = BrowserWindow.getAllWindows()[0]; win.unmaximize(); win.setBounds({ x: 0, y: 0, width: s.w, height: s.h }); }, { w, h }); await lib.sleep(500); }
async function run(name, fn) {
  let srv;
  try { srv = await startServer(); await fn(srv.base); }
  catch (e) { console.log('  EXCEPTION in ' + name + ': ' + (e.stack || e)); process.exitCode = 1; }
  finally { if (srv) srv.srv.close(); }
  console.log(name + ': ' + lib.failures() + ' failing checks');
}
module.exports = Object.assign({}, lib, { SCRATCH, SHOTS, LONG, startServer, profile, views, viewPage, rightClick, menuItems, menuClick, menuClose, appMenu, rootShot, state, ws, slots, setWindow, run });
