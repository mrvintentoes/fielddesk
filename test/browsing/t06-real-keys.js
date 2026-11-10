// Real X11 key presses (XTest via xkey.py) so the native accelerators themselves are exercised,
// with keyboard focus in the app UI and inside a live web page. Linux/Xvfb only.
const H = require('./helpers');
const { check, sleep } = H;
const { execFileSync } = require('child_process');
const path = require('path');
const key = async (...k) => { execFileSync('python3', [path.join(__dirname, 'xkey.py'), ...k]); await sleep(450); };
(async () => {
  const s = await H.startServer();
  const { app, ui } = await H.launch(H.freshProfile('t06'));
  const T = () => H.tabsOf(ui);
  const idx = async () => { const t = await T(); return t.tabs.findIndex((x) => x.id === t.active); };
  const focusInfo = () => app.evaluate(({ BrowserWindow }) => { const w = BrowserWindow.getAllWindows()[0]; return { winFocused: w.isFocused(), ui: w.webContents.isFocused(), views: [...global.__fieldDesk.tabs.values()].filter((t) => t.view.webContents.isFocused()).map((t) => t.view.webContents.getURL()) }; });
  try {
    await H.loose(ui);
    await app.evaluate(({ BrowserWindow }) => { const w = BrowserWindow.getAllWindows()[0]; w.show(); w.focus(); });
    await H.typeGo(ui, s.base + '/a'); await H.loaded(ui, '/a'); await sleep(500);
    console.log('    focus after typed navigation:', JSON.stringify(await focusInfo()));
    check('after Enter in the address bar keyboard focus is in the page', (await focusInfo()).views.some((u) => u.endsWith('/a')), JSON.stringify(await focusInfo()));
    // sanity: do real keys reach the app at all?
    await key('ctrl+t');
    let t = await T();
    const live = t.tabs.length === 2;
    check('real Ctrl+T (focus in web page) opens a tab', live, 'tabs ' + t.tabs.length);
    if (!live) { console.log('    real key events are not reaching the app in this X server; skipping'); return; }
    check('real Ctrl+T focuses address bar', await ui.evaluate(() => document.activeElement.id === 'address'));
    await key('type:' + s.base.replace('http://', '') + '/b', 'Return'); 
    check('typing a url with real keys + Enter navigates', await H.loaded(ui, '/b'), (await T()).tabs.map((x) => x.url).join());
    await sleep(400);
    console.log('    focus now:', JSON.stringify(await focusInfo()));
    // with focus inside the web page:
    await key('ctrl+1'); check('Ctrl+1 from inside a page', (await idx()) === 0);
    await key('ctrl+2'); check('Ctrl+2', (await idx()) === 1);
    await key('ctrl+Tab'); check('Ctrl+Tab', (await idx()) === 0);
    await key('ctrl+shift+Tab'); check('Ctrl+Shift+Tab', (await idx()) === 1);
    await key('ctrl+Prior'); check('Ctrl+PageUp', (await idx()) === 0);
    await key('ctrl+Next'); check('Ctrl+PageDown', (await idx()) === 1);
    await key('ctrl+9'); check('Ctrl+9', (await idx()) === 1);
    // navigation keys with focus in page
    await H.viewPage(app, s.base + '/b').click('#to-c'); await H.loaded(ui, '/c'); await sleep(300);
    await key('alt+Left'); check('Alt+Left goes back (focus in page)', await H.loaded(ui, '/b', 3000));
    await key('alt+Right'); check('Alt+Right goes forward', await H.loaded(ui, '/c', 3000));
    let n = s.hits.filter((h) => h === '/c').length;
    await key('F5'); check('F5 reloads', s.hits.filter((h) => h === '/c').length === n + 1);
    await key('ctrl+r'); check('Ctrl+R reloads', s.hits.filter((h) => h === '/c').length === n + 2);
    await key('ctrl+shift+r'); check('Ctrl+Shift+R reloads', s.hits.filter((h) => h === '/c').length === n + 3);
    await key('ctrl+l'); check('Ctrl+L focuses + selects address (from page focus)', await ui.evaluate(() => { const a = document.getElementById('address'); return document.activeElement === a && a.selectionEnd - a.selectionStart === a.value.length && a.value.length > 5; }));
    await key('Escape'); await sleep(200);
    console.log('    after Escape from address: focus', JSON.stringify(await focusInfo()));
    await key('alt+d'); check('Alt+D focuses address', await ui.evaluate(() => document.activeElement.id === 'address')); await key('Escape');
    await key('ctrl+k'); check('Ctrl+K focuses address', await ui.evaluate(() => document.activeElement.id === 'address')); await key('Escape');
    await key('F6'); console.log('    F6 focuses address:', await ui.evaluate(() => document.activeElement.id === 'address')); await key('Escape');
    await key('ctrl+d'); check('Ctrl+D bookmarks', (await ui.textContent('#star-btn')) === '★'); await key('ctrl+d');
    await key('ctrl+f'); check('Ctrl+F opens find and focuses it', await ui.isVisible('#findbar') && await ui.evaluate(() => document.activeElement.id === 'find-input'));
    await key('type:needle'); await sleep(400);
    check('typing into find with real keys', /of 3/.test(await ui.textContent('#find-count')), await ui.textContent('#find-count') + ' input=' + await ui.inputValue('#find-input'));
    await key('Return'); check('Enter = next match', /^2 of 3/.test(await ui.textContent('#find-count')), await ui.textContent('#find-count'));
    await key('F3'); console.log('    F3 next match:', await ui.textContent('#find-count'));
    await key('ctrl+g'); console.log('    Ctrl+G next match:', await ui.textContent('#find-count'));
    await key('Escape'); check('Escape closes find', !(await ui.isVisible('#findbar')));
    console.log('    focus after closing find:', JSON.stringify(await focusInfo()));
    const z = async () => (await H.views(app)).find((x) => x.visible).zoom;
    await key('ctrl+equal'); const z1 = await z(); await key('ctrl+shift+equal'); const z2 = await z(); await key('ctrl+minus'); const z3 = await z(); await key('ctrl+0'); const z4 = await z();
    check('Ctrl+= / Ctrl+Shift+= (plus) / Ctrl+- / Ctrl+0', z1 === 0.5 && z2 === 1 && z3 === 0.5 && z4 === 0, [z1, z2, z3, z4].join());
    await key('ctrl+KP_Add'); console.log('    Ctrl+numpad-plus zoom:', await z()); await key('ctrl+0');
    // find on a built-in page with real typing
    await key('ctrl+t'); await key('type:fielddesk://about', 'Return'); await sleep(400);
    await key('ctrl+f'); await key('type:privacy'); await sleep(300);
    console.log('    find on built-in page: input', JSON.stringify(await ui.inputValue('#find-input')), 'selection', JSON.stringify(await ui.evaluate(() => String(getSelection()))), 'count', JSON.stringify(await ui.textContent('#find-count')), 'focus', await ui.evaluate(() => document.activeElement.id));
    check('find on built-in page: typed word reaches the find box', (await ui.inputValue('#find-input')) === 'privacy', 'find box contains ' + JSON.stringify(await ui.inputValue('#find-input')));
    H.rootShot('t06-find-builtin');
    await key('Escape'); await ui.evaluate(() => FD.closeFind()); 
    await key('ctrl+w'); check('Ctrl+W closes tab', (await T()).tabs.length === 2);
    await key('ctrl+shift+t'); await sleep(300); check('Ctrl+Shift+T reopens', (await T()).tabs.length === 3, (await T()).tabs.map((x) => x.url).join());
    // typing in a page textarea must not trigger app shortcuts, and text shortcuts must work there
    await key('ctrl+1'); await sleep(300);
    const pg = H.viewPage(app, s.base + '/a'); await pg.click('#ta'); 
    await key('type:hello world'); await key('ctrl+a'); await key('ctrl+c'); await key('Delete'); await key('ctrl+v'); await key('ctrl+z'); await key('ctrl+shift+z');
    console.log('    textarea after type, select-all, copy, delete, paste, undo, redo:', JSON.stringify(await pg.inputValue('#ta')));
    check('copy/paste/select-all work inside a page textarea', (await pg.inputValue('#ta')) === 'hello world', await pg.inputValue('#ta'));
    await key('ctrl+Left'); await key('Home'); check('Ctrl+Left / Home in a textarea do not navigate', (await T()).tabs[0].url.endsWith('/a'));
    const before = (await T()).tabs[0].url; await key('alt+Left'); await sleep(400);
    console.log('    Alt+Left while typing in a page textarea: url', before, '->', (await T()).tabs[0].url);
    // Escape stops a loading page?
    await ui.evaluate((u) => FD.navigate(FD.current(), u + '/hang', { typed: true }), s.base); await sleep(500);
    await key('Escape'); await sleep(400);
    t = await T(); console.log('    Escape while a page is loading stops it:', !t.tabs.find((x) => x.id === t.active).rt.loading);
    await ui.evaluate(() => FD.reload()); await sleep(300);
    // F11 / ctrl+q last
    await key('F11'); await sleep(900);
    let al = await H.aligned(app, ui); console.log('    F11 fullscreen:', await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isFullScreen()), 'aligned', al.ok, al.problems.join('; '));
    await key('F11'); await sleep(700);
    await key('ctrl+period'); await sleep(300); console.log('    Ctrl+. rail collapsed:', await ui.evaluate(() => FD.ws().railCollapsed)); await key('ctrl+period');
    await key('ctrl+n'); await key('ctrl+p'); await key('ctrl+h'); await key('ctrl+j'); await sleep(300);
    console.log('    after Ctrl+N, Ctrl+P, Ctrl+H, Ctrl+J: windows', await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length), 'tabs', (await T()).tabs.length, 'drawer', await ui.evaluate(() => FD.ws().drawer.open));
  } finally { try { await app.close(); } catch (_) {} await s.close(); }
  console.log(H.failures() ? `\n${H.failures()} FAILED` : '\nall ok');
})().catch((e) => { console.error(e); process.exit(1); });
