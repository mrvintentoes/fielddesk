// Tab management, shortcuts via the real application menu, many tabs, window resize.
const H = require('./helpers');
const { check, sleep } = H;
(async () => {
  const s = await H.startServer();
  const { app, ui } = await H.launch(H.freshProfile('t02'));
  const T = () => H.tabsOf(ui);
  const urls = async () => (await T()).tabs.map((t) => t.url.replace(s.base, '').replace('fielddesk://', '~'));
  const activeIdx = async () => { const t = await T(); return t.tabs.findIndex((x) => x.id === t.active); };
  try {
    await H.loose(ui);
    // new tab via + button and Ctrl+T
    await ui.click('#newtab-btn'); await sleep(300);
    check('+ opens a new tab at the end, active', (await urls()).join() === '~newtab,~newtab' && (await activeIdx()) === 1);
    check('+ focuses the address bar', await ui.evaluate(() => document.activeElement.id === 'address'));
    await H.accel(app, 'CmdOrCtrl+T'); await sleep(300);
    check('Ctrl+T opens a new tab', (await urls()).length === 3 && (await activeIdx()) === 2);
    check('Ctrl+T focuses the address bar', await ui.evaluate(() => document.activeElement.id === 'address'));
    await ui.keyboard.type(s.base + '/a'); await ui.keyboard.press('Enter'); await H.loaded(ui, '/a');
    // Ctrl+T while the address bar of a web page has focus: must show an empty bar
    await ui.click('#address'); await sleep(150);
    await H.accel(app, 'CmdOrCtrl+T'); await sleep(400);
    check('Ctrl+T with address focused: address is empty for the new tab', (await ui.inputValue('#address')) === '', 'address shows ' + JSON.stringify(await ui.inputValue('#address')) + ' on fielddesk://newtab');
    await ui.keyboard.type(s.base + '/b'); await ui.keyboard.press('Enter');
    check('typing after Ctrl+T navigates the new tab', await H.loaded(ui, '/b'), (await urls()).join());
    await sleep(300);
    for (const p of ['/c', '/d', '/n/1', '/n/2', '/n/3', '/n/4']) await ui.evaluate((u) => FD.newTab(u), s.base + p);
    await sleep(1500);
    console.log('    tabs:', (await urls()).join(' '));
    // Ctrl+1..8, Ctrl+9
    for (const n of [1, 3, 8]) { await H.accel(app, 'CmdOrCtrl+' + n); await sleep(250); check('Ctrl+' + n + ' selects tab ' + n, (await activeIdx()) === n - 1, 'active index ' + (await activeIdx())); }
    await H.accel(app, 'CmdOrCtrl+9'); await sleep(250); check('Ctrl+9 selects last tab', (await activeIdx()) === (await urls()).length - 1);
    let al = await H.aligned(app, ui); check('after tab switches exactly the active view is visible+aligned', al.ok, al.problems.join('; '));
    await H.accel(app, 'Ctrl+Tab'); await sleep(250); check('Ctrl+Tab wraps to first', (await activeIdx()) === 0);
    await H.accel(app, 'Ctrl+Shift+Tab'); await sleep(250); check('Ctrl+Shift+Tab wraps to last', (await activeIdx()) === (await urls()).length - 1);
    console.log('    PageUp item found:', await H.accel(app, 'CmdOrCtrl+PageUp')); await sleep(250); check('Ctrl+PageUp previous', (await activeIdx()) === (await urls()).length - 2);
    await H.accel(app, 'CmdOrCtrl+PageDown'); await sleep(250); check('Ctrl+PageDown next', (await activeIdx()) === (await urls()).length - 1);
    // click a tab
    await ui.click('#tabs .tab:nth-child(4)'); await sleep(300);
    check('clicking a tab selects it', (await activeIdx()) === 3);
    check('address follows tab', (await ui.inputValue('#address')) === s.base + '/b', await ui.inputValue('#address'));
    al = await H.aligned(app, ui); check('clicked tab view aligned', al.ok, al.problems.join('; '));
    // address bar focus then switch tab: bar must show the new tab
    await ui.click('#address'); await ui.keyboard.type('half typed');
    await H.accel(app, 'CmdOrCtrl+1'); await sleep(400);
    check('switching tabs while typing resets the address bar to the new tab', (await ui.inputValue('#address')) === '', 'tab 1 is the new tab page but address shows ' + JSON.stringify(await ui.inputValue('#address')));
    await ui.keyboard.press('Escape'); await sleep(200);
    al = await H.aligned(app, ui); console.log('    after typed+switch: views', JSON.stringify((await H.views(app)).filter((v) => v.visible).map((v) => v.url)), 'suggest hidden', await ui.evaluate(() => document.getElementById('suggest').hidden), 'frozen', await ui.evaluate(() => FD.S.frozen));

    await H.accel(app, 'CmdOrCtrl+4'); await sleep(300);
    const stale = await ui.evaluate(() => { const s = FD.S.slots.left; return s ? { frozen: s.classList.contains('frozen'), bg: s.style.backgroundImage.length, connected: s.isConnected } : null; });
    check('no stale frozen still left on the page slot after suggestions closed on another tab', stale && !stale.frozen && !stale.bg, JSON.stringify(stale));
    H.rootShot('t02-stale-freeze');
    await ui.evaluate(() => { const s = FD.S.slots.left; if (s) { s.classList.remove('frozen'); s.style.backgroundImage = ''; } }); // clear so later checks are independent
    // close: Ctrl+W on middle tab selects right neighbour
    await H.accel(app, 'CmdOrCtrl+4'); await sleep(250);
    let before = await urls();
    await H.accel(app, 'CmdOrCtrl+W'); await sleep(300);
    let after = await urls();
    check('Ctrl+W closes active tab', after.length === before.length - 1 && !after.includes('/b'), after.join());
    check('after close the right neighbour is active', (await activeIdx()) === 3, 'idx ' + (await activeIdx()));
    al = await H.aligned(app, ui); check('after close view aligned', al.ok, al.problems.join('; '));
    check('closed tab view destroyed', !(await H.views(app)).some((v) => v.url.endsWith('/b')));
    // close button and middle click
    await ui.hover('#tabs .tab:nth-child(5)'); await ui.click('#tabs .tab:nth-child(5) .tab-close'); await sleep(300);
    check('x button closes a background tab without switching', (await urls()).length === after.length - 1 && (await activeIdx()) === 3, (await urls()).join());
    await ui.click('#tabs .tab:nth-child(2)', { button: 'middle' }); await sleep(300);
    check('middle-click closes a tab', (await urls()).length === after.length - 2, (await urls()).join());
    // close last tab in strip -> left neighbour
    await H.accel(app, 'CmdOrCtrl+9'); await sleep(200); await H.accel(app, 'CmdOrCtrl+W'); await sleep(300);
    check('closing the last tab selects the new last', (await activeIdx()) === (await urls()).length - 1);
    // reopen: order
    console.log('    now:', (await urls()).join(' '));
    await H.accel(app, 'CmdOrCtrl+Shift+T'); await sleep(600);
    console.log('    after 1 reopen:', (await urls()).join(' '), 'active', await activeIdx());
    await H.accel(app, 'CmdOrCtrl+Shift+T'); await sleep(600);
    await H.accel(app, 'CmdOrCtrl+Shift+T'); await sleep(600);
    const re = await urls();
    console.log('    after 3 reopens:', re.join(' '), 'active', await activeIdx());
    check('reopen restores most recent first (/n/4 then newtab-skipped then /n/1, /b)', re.includes('/n/4') && re.includes('/n/1') && re.includes('/b'), re.join());
    const expected = before.slice(); expected.splice(1, 1); // the closed new tab page is not reopened
    check('reopened tabs return to their old positions', re.join() === expected.join() , 'before: ' + before.join(' ') + ' | after: ' + re.join(' '));
    al = await H.aligned(app, ui); check('reopened tab loads and is aligned', al.ok, al.problems.join('; '));
    await H.accel(app, 'CmdOrCtrl+Shift+T'); await sleep(300);

    // close all tabs -> never zero tabs, window stays
    for (let i = 0; i < 20; i++) { await H.accel(app, 'CmdOrCtrl+W'); await sleep(60); }
    await sleep(400);
    check('closing every tab leaves one new tab page', (await urls()).join() === '~newtab', (await urls()).join());
    check('window still open', (await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length)) === 1);
    check('no orphan views', (await H.views(app)).length === 0, JSON.stringify(await H.views(app)));
    console.log('    address focused after closing the last tab:', await ui.evaluate(() => document.activeElement.id === 'address'), '(Chrome focuses the omnibox on a fresh new tab page)');

    // ---- 24 tabs
    for (let i = 0; i < 24; i++) await ui.evaluate((u) => FD.newTab(u, { background: true }), s.base + '/n/' + i);
    await sleep(2500);
    const geo = await ui.evaluate(() => { const r = (el) => { const b = el.getBoundingClientRect(); return { l: Math.round(b.left), r: Math.round(b.right), w: Math.round(b.width) }; }; const tabs = [...document.querySelectorAll('#tabs .tab')].map(r); return { n: tabs.length, tabs, plus: r(document.getElementById('newtab-btn')), strip: r(document.getElementById('tabstrip')), tabsBox: r(document.getElementById('tabs')), win: innerWidth, scrollW: document.getElementById('tabs').scrollWidth }; });
    console.log('    25 tabs: tab widths', geo.tabs[0].w, '..', geo.tabs[geo.n - 1].w, 'last tab right', geo.tabs[geo.n - 1].r, 'tabs box right', geo.tabsBox.r, 'plus', JSON.stringify(geo.plus), 'win', geo.win, 'scrollW', geo.scrollW);
    check('25 tabs: + button inside window', geo.plus.r <= geo.win && geo.plus.w > 10);
    check('25 tabs: every tab visible inside the strip', geo.tabs.every((t) => t.r <= geo.tabsBox.r + 1 && t.w >= 20), 'clipped tabs: ' + geo.tabs.filter((t) => t.r > geo.tabsBox.r + 1).length);
    await ui.click('#tabs .tab:nth-child(25)'); await sleep(500);
    check('25 tabs: last tab clickable', (await activeIdx()) === 24);
    await H.shot(ui, 'browsing-25tabs'); H.rootShot('t02-25tabs');
    // narrow window (min width)
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(880, 600)); await sleep(700);
    const geo2 = await ui.evaluate(() => { const r = (el) => { const b = el.getBoundingClientRect(); return { l: Math.round(b.left), r: Math.round(b.right), w: Math.round(b.width) }; }; const tabs = [...document.querySelectorAll('#tabs .tab')].map(r); return { tabs, plus: r(document.getElementById('newtab-btn')), tabsBox: r(document.getElementById('tabs')), win: innerWidth }; });
    console.log('    880px: tab widths', geo2.tabs[0].w, 'x', geo2.tabs.length, 'sum', geo2.tabs.reduce((a, t) => a + t.w + 2, 0), 'box', JSON.stringify(geo2.tabsBox), 'plus', JSON.stringify(geo2.plus), 'win', geo2.win);
    check('880px/25 tabs: + button inside window', geo2.plus.r <= geo2.win);
    check('880px/25 tabs: tabs past the edge can be reached by scrolling the strip', await ui.evaluate(() => { const t = document.getElementById('tabs'); return getComputedStyle(t).overflowX === 'auto' && t.scrollWidth >= t.clientWidth; }));
    const activeVisible = await ui.evaluate(() => { const a = document.querySelector('#tabs .tab.active').getBoundingClientRect(), b = document.getElementById('tabs').getBoundingClientRect(); return a.right <= b.right + 1; });
    check('880px/25 tabs: active tab is visible in strip', activeVisible);
    al = await H.aligned(app, ui); check('after resize to 880x600 view matches slot', al.ok, al.problems.join('; '));
    await H.shot(ui, 'browsing-25tabs-narrow'); H.rootShot('t02-25tabs-narrow');
    // resize sequence
    for (const [w, h] of [[1300, 800], [900, 560], [1440, 900], [1000, 700]]) {
      await app.evaluate(({ BrowserWindow }, [w, h]) => BrowserWindow.getAllWindows()[0].setSize(w, h), [w, h]); await sleep(500);
      al = await H.aligned(app, ui); check(`resize ${w}x${h}: view matches slot`, al.ok, al.problems.join('; '));
    }
    // rail collapse + drawer open change the slot
    await H.accel(app, 'CmdOrCtrl+.'); await sleep(500); al = await H.aligned(app, ui); check('rail toggle: view matches slot', al.ok, al.problems.join('; '));
    await H.accel(app, 'CmdOrCtrl+Shift+.'); await sleep(500); al = await H.aligned(app, ui); check('drawer toggle: view matches slot', al.ok, al.problems.join('; '));
    await H.accel(app, 'CmdOrCtrl+Shift+.'); await H.accel(app, 'CmdOrCtrl+.'); await sleep(400);
    // maximize / fullscreen
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].maximize()); await sleep(700);
    al = await H.aligned(app, ui); check('maximize: view matches slot', al.ok, al.problems.join('; '));
    // split view alignment with two live pages
    await H.accel(app, 'CmdOrCtrl+3'); await sleep(400);
    await H.accel(app, 'CmdOrCtrl+\\'); await sleep(900);
    al = await H.aligned(app, ui); check('split: both views match their slots', al.ok && al.s.length === 2, al.problems.join('; ') + ' slots ' + al.s.length);
    H.rootShot('t02-split');
    await H.accel(app, 'CmdOrCtrl+\\'); await sleep(600);
    al = await H.aligned(app, ui); check('unsplit: one view matches slot', al.ok && al.s.length === 1, al.problems.join('; '));
    // memory: how many live renderer views for 25 tabs
    console.log('    live views with 25 tabs:', (await H.views(app)).length);
    // tab drag reorder via model? (HTML5 drag not driven here)
  } finally { await app.close(); await s.close(); }
  console.log(H.failures() ? `\n${H.failures()} FAILED` : '\nall ok');
})().catch((e) => { console.error(e); process.exit(1); });
