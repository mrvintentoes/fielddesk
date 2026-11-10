'use strict';
// Shared helpers for the stage-1 browsing checks: a local fixture site and main-process probes.
const http = require('http');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const lib = require('../lib');

const SCRATCH = process.env.FD_SCRATCH || '/tmp/claude-0/-home-claude/afeb33f8-cbaa-5a21-a4a6-1788f1ba6c50/scratchpad/browsing';
const SHOTS = path.join(SCRATCH, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

const ICON = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAFklEQVR42mP8z8Dwn4ECwDhqwKgBwwYAAEYIAhDsl4bCAAAAAElFTkSuQmCC', 'base64');
const page = (title, body, head) => `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>${head || ''}</head><body style="font:16px sans-serif"><h1 id="h">${title}</h1>${body}</body></html>`;

function startServer() {
  const hits = [];
  const srv = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    hits.push(u.pathname + u.search);
    const send = (code, type, body, hdr) => { res.writeHead(code, Object.assign({ 'Content-Type': type, 'Cache-Control': 'no-store' }, hdr || {})); res.end(body); };
    const p = u.pathname;
    if (p === '/favicon.ico' || p === '/icon.png') return send(200, 'image/png', ICON);
    if (p === '/a') return send(200, 'text/html', page('Page A', `
      <p><a id="to-b" href="/b">to B</a></p>
      <p><a id="blank" href="/c" target="_blank">C in new tab</a></p>
      <p><a id="blank2" href="/d" target="_blank" rel="noopener">D in new tab</a></p>
      <p><a id="l1" href="/n/1">n1</a> <a id="l2" href="/n/2">n2</a> <a id="l3" href="/n/3">n3</a></p>
      <p><button id="wopen" onclick="window.open('/c')">window.open C</button>
         <button id="wpop" onclick="window.open('/c','_blank','width=300,height=200')">popup C</button></p>
      <p><a id="mail" href="mailto:x@example.com">mail</a> <a id="hash" href="#h2">hash</a>
         <button id="push" onclick="history.pushState({}, '', '/a/pushed'); document.title='Pushed A'">pushState</button></p>
      <p><a id="dl" href="/download">download</a></p>
      <form id="f" action="/echo" method="get"><input id="q" name="q"><button id="go">go</button></form>
      <form id="fp" action="/echo" method="post"><input id="pq" name="q" value="posted"><button id="pgo">post</button></form>
      <p><textarea id="ta"></textarea></p>
      <p><button id="alert" onclick="alert('hi')">alert</button><button id="fs" onclick="document.documentElement.requestFullscreen()">fullscreen</button></p>
      <h2 id="h2" style="margin-top:1500px">needle section</h2>`, '<link rel="icon" href="/icon.png">'));
    if (p === '/a/pushed') return send(200, 'text/html', page('Pushed A (server)', ''));
    if (p === '/b') return send(200, 'text/html', page('Page B', '<p><a id="to-c" href="/c">to C</a> <a id="to-a" href="/a">to A</a></p>'));
    if (p === '/c') return send(200, 'text/html', page('Page C', '<p>needle one. needle two. Needle three.</p><p><a id="to-a" href="/a">to A</a></p>'));
    if (p === '/d') return send(200, 'text/html', page('Page D', '<p>d</p>'));
    if (p.startsWith('/n/')) return send(200, 'text/html', page('N' + p.slice(3), '<p>numbered</p>'));
    if (p === '/long') return send(200, 'text/html', page('Long page', Array.from({ length: 400 }, (_, i) => `<p>Line ${i} needle</p>`).join('')));
    if (p === '/notitle') return send(200, 'text/html', '<!doctype html><p>no title here</p>');
    if (p === '/echo') {
      let body = ''; req.on('data', (d) => { body += d; });
      return req.on('end', () => send(200, 'text/html', page('Echo ' + req.method, `<pre id="e">${req.method} ${u.search} ${body}</pre>`)));
    }
    if (p === '/slow') return void setTimeout(() => send(200, 'text/html', page('Slow page', '<p>slow</p>')), Number(u.searchParams.get('ms') || 4000));
    if (p === '/hang') return; // never answers
    if (p === '/redirect') return send(302, 'text/plain', '', { Location: '/b' });
    if (p === '/404') return send(404, 'text/html', page('Not found here', '<p>404</p>'));
    if (p === '/download') return send(200, 'application/octet-stream', 'data', { 'Content-Disposition': 'attachment; filename="x.bin"' });
    if (p === '/color') return send(200, 'text/html', `<!doctype html><title>Color ${u.searchParams.get('c')}</title><body style="margin:0;background:${u.searchParams.get('c')}"><div style="height:3000px"></div>`);
    if (p === '/unload') return send(200, 'text/html', page('Unload guard', '<script>addEventListener("beforeunload", e => { e.preventDefault(); e.returnValue = "x"; });</script><input id="i">'));
    send(404, 'text/html', page('Not found', '<p>nope</p>'));
  });
  return new Promise((resolve) => srv.listen(0, '127.0.0.1', () => {
    const port = srv.address().port;
    resolve({ srv, port, base: 'http://127.0.0.1:' + port, hits, close: () => new Promise((r) => { srv.closeAllConnections && srv.closeAllConnections(); srv.close(r); }) });
  }));
}

const views = (app) => app.evaluate(() => [...global.__fieldDesk.tabs.entries()].map(([id, t]) => {
  const wc = t.view.webContents;
  return { id, url: wc.getURL(), title: wc.getTitle(), visible: t.view.getVisible(), bounds: t.view.getBounds(), loading: wc.isLoading(), zoom: wc.getZoomLevel() };
}));
const slots = (ui) => ui.evaluate(() => [...document.querySelectorAll('.webslot')].filter((s) => s.isConnected).map((s) => { const b = s.getBoundingClientRect(); return { id: s.dataset.tab, x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height), frozen: s.classList.contains('frozen'), bg: !!s.style.backgroundImage }; }));
const tabsOf = (ui) => ui.evaluate(() => ({ active: FD.ws().active, cur: FD.current().id, ws: FD.ws().id, split: FD.ws().split.on, tabs: FD.ws().tabs.map((t) => ({ id: t.id, url: t.url, title: t.title, favicon: t.favicon, rt: Object.assign({}, FD.rt(t.id)) })) }));
// Compare the live view rectangles with the slots the UI reserved for them.
async function aligned(app, ui) {
  const v = await views(app), s = await slots(ui);
  const problems = [];
  for (const sl of s) {
    const vw = v.find((x) => x.id === sl.id);
    if (!vw) { problems.push('no view for slot ' + sl.id); continue; }
    if (!vw.visible) problems.push('view hidden for slot ' + sl.id);
    const b = vw.bounds;
    if (Math.abs(b.x - sl.x) > 1 || Math.abs(b.y - sl.y) > 1 || Math.abs(b.width - sl.w) > 1 || Math.abs(b.height - sl.h) > 1) problems.push(`bounds ${JSON.stringify(b)} vs slot ${JSON.stringify(sl)}`);
    if (sl.frozen) problems.push('slot still frozen');
  }
  for (const vw of v) if (vw.visible && !s.some((x) => x.id === vw.id)) problems.push('view visible without slot: ' + vw.url);
  return { ok: problems.length === 0 && s.length > 0, problems, v, s };
}
// Invoke an application-menu item by accelerator, as the OS would on that key press.
const accel = (app, a) => app.evaluate(({ Menu }, a) => {
  const walk = (m) => { for (const i of m.items) { if (i.accelerator && i.accelerator.toLowerCase() === a.toLowerCase()) return i; if (i.submenu) { const r = walk(i.submenu); if (r) return r; } } return null; };
  const it = walk(Menu.getApplicationMenu());
  if (!it) return false;
  it.click(); return true;
}, a);
const menuTable = (app) => app.evaluate(({ Menu }) => {
  const out = []; const walk = (m, p) => { for (const i of m.items) { if (i.submenu) walk(i.submenu, p + i.label + ' > '); else if (i.type !== 'separator') out.push({ path: p + i.label, accel: i.accelerator || null, role: i.role || null }); } };
  walk(Menu.getApplicationMenu(), ''); return out;
});
async function waitFor(fn, ms, step) {
  const end = Date.now() + (ms || 8000);
  for (;;) { let v; try { v = await fn(); } catch (_) { v = false; } if (v) return v; if (Date.now() > end) return false; await lib.sleep(step || 100); }
}
// The Playwright page for a live view, by URL substring.
function viewPage(app, part) { return app.windows().find((w) => w.url().includes(part)); }
function rootShot(name) { const f = path.join(SHOTS, name + '.png'); try { execSync('import -window root ' + JSON.stringify(f)); } catch (e) { console.log('  (root shot failed)'); } return f; }
function freshProfile(name, keep) { const d = path.join(SCRATCH, 'profiles', name); if (!keep) fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true }); return d; }
async function loose(ui) { await ui.evaluate(() => FD.openWorkspace('loose')); await lib.sleep(300); }
// Type in the address bar like a user and press Enter.
async function typeGo(ui, text) { await ui.click('#address'); await ui.keyboard.press('Control+a'); await ui.keyboard.type(text, { delay: 15 }); await ui.keyboard.press('Enter'); }
const loaded = (ui, part, ms) => waitFor(() => ui.evaluate((part) => { const t = FD.current(); return t.url.includes(part) && !FD.rt(t.id).loading; }, part), ms || 10000);

module.exports = Object.assign({}, lib, { startServer, views, slots, tabsOf, aligned, accel, menuTable, waitFor, viewPage, rootShot, freshProfile, loose, typeGo, loaded, SCRATCH, SHOTS });
