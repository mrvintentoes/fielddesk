// Assorted sceptical-user checks: slow loads, built-in page history, dialogs, downloads, crash, context menu, tab drag, restart frames.
const H = require('./helpers');
const { check, sleep } = H;
const { execFileSync, execSync } = require('child_process');
const path = require('path');
const key = async (...k) => { execFileSync('python3', [path.join(__dirname, 'xkey.py'), ...k]); await sleep(450); };
(async () => {
  const s = await H.startServer();
  const profile = H.freshProfile('t07');
  let { app, ui } = await H.launch(profile);
  const T = () => H.tabsOf(ui);
  const rel = (u) => u.replace(s.base, '').replace('fielddesk://', '~');
  try {
    await H.loose(ui);
    await app.evaluate(({ BrowserWindow }) => { const w = BrowserWindow.getAllWindows()[0]; w.show(); w.focus(); });
    await H.typeGo(ui, s.base + '/a'); await H.loaded(ui, '/a'); await sleep(400);
    await key('ctrl+backslash'); check('real Ctrl+\\ toggles split', (await T()).split === true); await key('ctrl+backslash');
    await key('ctrl+period'); check('real Ctrl+. collapses rail', await ui.evaluate(() => FD.ws().railCollapsed === true)); 
    let al = await H.aligned(app, ui); check('rail collapsed: view fills, aligned', al.ok, al.problems.join('; '));
    const pageShare = await ui.evaluate(() => { const b = document.querySelector('.webslot').getBoundingClientRect(); return (b.width * b.height) / (innerWidth * innerHeight); });
    console.log('    share of window given to the page: rail collapsed', pageShare.toFixed(3));
    H.rootShot('t07-rail-collapsed');
    await key('ctrl+period');
    console.log('    share of window given to the page: rail shown', (await ui.evaluate(() => { const b = document.querySelector('.webslot').getBoundingClientRect(); return (b.width * b.height) / (innerWidth * innerHeight); })).toFixed(3));

    // ---- address bar during a slow load shows where we are going
    await H.typeGo(ui, s.base + '/slow?ms=2500'); await sleep(900);
    let t = await T();
    check('during a slow typed load the address shows the pending url', (await ui.inputValue('#address')).includes('/slow'), 'address shows ' + (await ui.inputValue('#address')) + ', tab title ' + JSON.stringify(t.tabs[0].title));
    H.rootShot('t07-slow-loading');
    // quit-equivalent: what would be saved now?
    console.log('    state url while loading /slow:', rel(t.tabs[0].url));
    await H.loaded(ui, '/slow', 6000); await sleep(300);
    check('slow page arrives', (await T()).tabs[0].title === 'Slow page');
    // typed url then immediately another typed url
    await ui.evaluate((u) => { FD.navigate(FD.current(), u + '/slow?ms=1500', { typed: true }); setTimeout(() => FD.navigate(FD.current(), u + '/c', { typed: true }), 200); }, s.base);
    await sleep(2500); t = await T();
    check('second navigation wins over a slower first', t.tabs[0].url.endsWith('/c') && t.tabs[0].title === 'Page C' && !(await ui.isVisible('.page-error')), JSON.stringify(t.tabs[0]));

    // ---- built-in page history
    await ui.evaluate(() => FD.newTab()); await sleep(300);
    await ui.click('a:has-text("Shortcuts and privacy")');
    const onAbout = await H.waitFor(() => ui.evaluate(() => FD.current().url === 'fielddesk://about'), 3000);
    check('About link on the new tab page opens fielddesk://about', !!onAbout, (await T()).tabs.map((x) => x.url).join());
    t = await T();
    check('new tab -> About link: Back returns to the new tab page', !(await ui.isDisabled('#back-btn')), 'on ' + t.tabs[1].url + ' the Back button is disabled');
    const aboutText = await ui.textContent('.page');
    console.log('    about page shortcut rows:', JSON.stringify(aboutText.match(/Back and forward[^R]*/)?.[0]), '| platform', await ui.evaluate(() => document.documentElement.dataset.platform));
    H.rootShot('t07-about');
    await ui.evaluate(() => FD.closeTab(FD.current().id)); await sleep(300);

    // ---- 30 tabs at the default window width
    for (let i = 0; i < 29; i++) await ui.evaluate((u) => FD.newTab(u, { background: true }), s.base + '/n/' + i);
    await sleep(2500);
    const geo = await ui.evaluate(() => { const box = document.getElementById('tabs').getBoundingClientRect(); const tabs = [...document.querySelectorAll('#tabs .tab')].map((e) => e.getBoundingClientRect()); return { n: tabs.length, hidden: tabs.filter((b) => b.left >= box.right - 1).length, partly: tabs.filter((b) => b.right > box.right + 1 && b.left < box.right - 1).length, w: Math.round(tabs[0].width), win: innerWidth, titleW: Math.round(document.querySelector('#tabs .tab:not(.active) .tab-title').getBoundingClientRect().width) }; });
    check('30 tabs at ' + geo.win + 'px: all tabs reachable in the strip', geo.hidden === 0 && geo.partly === 0, geo.hidden + ' tabs entirely hidden, ' + geo.partly + ' cut off; tab width ' + geo.w + 'px, title width ' + geo.titleW + 'px');
    await ui.evaluate(() => FD.selectTab(FD.ws().tabs[FD.ws().tabs.length - 1].id)); await sleep(400);
    const vis = await ui.evaluate(() => { const a = document.querySelector('#tabs .tab.active').getBoundingClientRect(), b = document.getElementById('tabs').getBoundingClientRect(); return a.left < b.right - 1; });
    check('30 tabs: the active (last) tab is visible in the strip', vis);
    H.rootShot('t07-30tabs');
    // rapid switching
    for (let i = 0; i < 40; i++) await H.accel(app, i % 3 ? 'Ctrl+Tab' : 'Ctrl+Shift+Tab');
    await sleep(900);
    al = await H.aligned(app, ui); check('40 rapid tab switches: exactly one live view, aligned', al.ok && al.v.filter((x) => x.visible).length === 1, al.problems.join('; '));
    await ui.evaluate(() => { const w = FD.ws(); w.tabs.slice(1).forEach((x) => FD.closeTab(x.id)); FD.S.state.closed.length = 0; }); await sleep(500);
    check('closing 29 tabs destroys their views', (await H.views(app)).length === 1, String((await H.views(app)).length));

    // ---- Ctrl+T / Ctrl+W while the suggestions dropdown is open
    await H.typeGo(ui, s.base + '/a'); await H.loaded(ui, '/a'); await sleep(300);
    await key('ctrl+l'); await key('type:Pag'); await sleep(400);
    await key('ctrl+t'); await sleep(300);
    let st = await ui.evaluate(() => ({ sugg: !document.getElementById('suggest').hidden, addr: document.getElementById('address').value, frozen: FD.S.frozen, url: FD.current().url }));
    check('Ctrl+T opened a tab', (await T()).tabs.length === 2);
    check('Ctrl+T with dropdown open: dropdown closes and bar is empty', !st.sugg && st.addr === '', JSON.stringify(st));
    H.rootShot('t07-ctrlT-with-dropdown');
    await ui.keyboard.press('Escape'); await sleep(300);
    await ui.evaluate(() => FD.selectTab(FD.ws().tabs[0].id)); await sleep(500);
    al = await H.aligned(app, ui); check('...and the first tab is live again afterwards', al.ok, al.problems.join('; '));
    H.rootShot('t07-after-ctrlT-dropdown');
    await ui.evaluate(() => { const s = FD.S.slots.left; if (s) { s.classList.remove('frozen'); s.style.backgroundImage = ''; } });
    await ui.evaluate(() => { const x = FD.ws().tabs[1]; if (x) FD.closeTab(x.id); }); await sleep(300);

    // ---- dialogs, downloads, popups without url
    let pg = H.viewPage(app, s.base + '/a');
    const dialogs = []; pg.on('dialog', (d) => { dialogs.push(d.type() + ':' + d.message()); d.dismiss().catch(() => {}); });
    await pg.click('#alert', { noWaitAfter: true, timeout: 5000 }).catch((e) => console.log('    alert click:', e.message.split('\n')[0]));
    await sleep(500); console.log('    alert() dialogs seen by driver:', JSON.stringify(dialogs));
    await app.evaluate(({ session }) => { global.__dl = null; session.fromPartition('persist:web').once('will-download', (e, item) => { global.__dl = { name: item.getFilename(), savePath: item.getSavePath() }; e.preventDefault(); }); });
    await pg.click('#dl', { noWaitAfter: true }).catch(() => {}); await sleep(1200);
    const dl = await app.evaluate(() => global.__dl);
    console.log('    download link -> will-download fired in main:', JSON.stringify(dl), '(test cancels it; the app registers no will-download handler of its own)');
    t = await T(); check('download link leaves the tab on its page, not loading', t.tabs[0].url.endsWith('/a') && !t.tabs[0].rt.loading && !(await ui.isVisible('.page-error')), JSON.stringify(t.tabs[0]));
    const nb = (await T()).tabs.length;
    await pg.evaluate(() => { const w = window.open('', '_blank'); window.__w = w ? 'got window' : 'null'; }).catch(() => {});
    await sleep(500); console.log('    window.open("") ->', await pg.evaluate(() => window.__w), '| tabs', (await T()).tabs.length - nb, 'new');

    // ---- HTML fullscreen
    await pg.click('#fs').catch(() => {}); await sleep(800);
    const fs1 = await app.evaluate(({ BrowserWindow }) => { const w = BrowserWindow.getAllWindows()[0]; const t = [...global.__fieldDesk.tabs.values()].find((x) => x.view.getVisible()); return { winFS: w.isFullScreen(), htmlFS: t ? t.view.webContents.isCurrentlyAudible !== undefined && null : null, view: t && t.view.getBounds(), content: w.getContentBounds() }; });
    const inFs = await pg.evaluate(() => !!document.fullscreenElement);
    console.log('    requestFullscreen(): page thinks fullscreen =', inFs, '| view bounds', JSON.stringify(fs1.view), 'window content', JSON.stringify(fs1.content));
    if (inFs) { H.rootShot('t07-html-fullscreen'); check('HTML fullscreen: the page view covers the whole window', fs1.view.x === 0 && fs1.view.y === 0 && fs1.view.width >= fs1.content.width - 1, 'view stays at ' + JSON.stringify(fs1.view)); await pg.evaluate(() => document.exitFullscreen()).catch(() => {}); await sleep(500); }

    // ---- context menu on a link
    await pg.click('#to-b', { button: 'right' }); await sleep(600);
    const menu = await app.evaluate(() => { const m = global.__fieldDesk.lastContextMenu(); return m ? m.items.map((i) => i.label || '-') : null; });
    console.log('    link context menu:', JSON.stringify(menu));
    if (menu) {
      await app.evaluate(() => { const m = global.__fieldDesk.lastContextMenu(); m.closePopup(); m.items.find((i) => /new tab/i.test(i.label)).click(); }); await sleep(800);
      t = await T(); check('context menu "Open link in new tab" opens background tab next to opener', t.tabs.length === 2 && t.tabs[1].url.endsWith('/b') && t.active === t.tabs[0].id, t.tabs.map((x) => rel(x.url)).join());
    }
    // ---- tab drag reorder
    const order0 = (await T()).tabs.map((x) => rel(x.url)).join();
    await ui.dragAndDrop('#tabs .tab:nth-child(2)', '#tabs .tab:nth-child(1)').catch((e) => console.log('    drag failed', e.message.split('\n')[0])); await sleep(400);
    const order1 = (await T()).tabs.map((x) => rel(x.url)).join();
    check('dragging tab 2 onto tab 1 reorders', order0 !== order1, order0 + ' -> ' + order1);
    al = await H.aligned(app, ui); check('after drag: view live and aligned', al.ok, al.problems.join('; '));

    // ---- renderer crash
    await app.evaluate(() => { const t = [...global.__fieldDesk.tabs.values()].find((x) => x.view.getVisible()); t.view.webContents.forcefullyCrashRenderer(); }); await sleep(1200);
    check('crashed page shows the error page', await ui.isVisible('.page-error'), '');
    console.log('    crash text:', JSON.stringify((await ui.textContent('.page-error').catch(() => '')).replace(/\s+/g, ' ')));
    if (await ui.isVisible('.page-error')) { await ui.click('.page-error .btn.primary'); await sleep(1500); t = await T(); const cur = t.tabs.find((x) => x.id === t.active); check('Try again after a crash reloads the page', !(await ui.isVisible('.page-error')) && cur.title === 'Page A', JSON.stringify(cur)); al = await H.aligned(app, ui); check('after crash recovery: live and aligned', al.ok, al.problems.join('; ')); }

    // ---- beforeunload page: closing the tab must not hang
    await ui.evaluate((u) => FD.newTab(u + '/unload'), s.base); await H.loaded(ui, '/unload'); await sleep(300);
    pg = H.viewPage(app, s.base + '/unload'); await pg.click('#i'); await pg.keyboard.type('x');
    const n0 = (await H.views(app)).length;
    await ui.evaluate(() => FD.closeTab(FD.current().id)); await sleep(800);
    check('closing a tab with a beforeunload guard destroys its view', (await H.views(app)).length === n0 - 1, (await H.views(app)).map((x) => x.url).join());

    // ---- restart frames: is there a white/blank flash when the active tab is a web page?
    await sleep(500); await app.close();
    const { _electron } = require('playwright');
    const args = [H.ROOT]; if (process.getuid && process.getuid() === 0) args.unshift('--no-sandbox');
    const t0 = Date.now();
    const pApp = _electron.launch({ executablePath: require('electron'), args, env: Object.assign({}, process.env, { FIELDDESK_USER_DATA: profile }) });
    const frames = [];
    for (let i = 0; i < 16; i++) { const f = path.join(H.SHOTS, 't07-restart-' + String(i).padStart(2, '0') + '.png'); try { execSync('import -window root ' + f); frames.push([Date.now() - t0, f]); } catch (_) {} await sleep(60); }
    app = await pApp; ui = await app.firstWindow(); await ui.waitForSelector('html.ready');
    for (const [ms, f] of frames) console.log('    restart frame @' + ms + 'ms tabstrip/toolbar-bg/page-centre:', execSync(`convert ${f} -format "%[pixel:p{700,22}] %[pixel:p{1300,48}] %[pixel:p{700,450}]" info:`).toString());
  } finally { try { await app.close(); } catch (_) {} await s.close(); }
  console.log(H.failures() ? `\n${H.failures()} FAILED` : '\nall ok');
})().catch((e) => { console.error(e); process.exit(1); });
