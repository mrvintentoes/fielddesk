// Suggestions dropdown and the freeze/unfreeze of live pages, failed loads, reload/stop, bookmarks, find, zoom.
const H = require('./helpers');
const { check, sleep } = H;
(async () => {
  const s = await H.startServer();
  const { app, ui } = await H.launch(H.freshProfile('t03'));
  const T = () => H.tabsOf(ui);
  const sugg = () => ui.evaluate(() => ({ hidden: document.getElementById('suggest').hidden, items: [...document.querySelectorAll('#suggest .sugg')].map((e) => ({ t: e.textContent, sel: e.classList.contains('sel') })), frozen: FD.S.frozen }));
  const settled = async (label) => { await sleep(500); const al = await H.aligned(app, ui); check(label + ': live view visible, aligned, not frozen', al.ok, al.problems.join('; ')); const f = await ui.evaluate(() => FD.S.frozen); check(label + ': freeze counter back to 0', f === 0, 'S.frozen=' + f); };
  try {
    await H.loose(ui);
    await H.typeGo(ui, s.base + '/a'); await H.loaded(ui, '/a');
    await H.typeGo(ui, s.base + '/b'); await H.loaded(ui, '/b');
    await H.typeGo(ui, s.base + '/c'); await H.loaded(ui, '/c'); await sleep(300);
    await ui.evaluate((u) => FD.newTab(u + '/d', { background: true }), s.base); await sleep(600);

    // ---- suggestions
    await ui.click('#address'); await sleep(100);
    check('clicking address selects whole url', await ui.evaluate(() => { const a = document.getElementById('address'); return a.selectionStart === 0 && a.selectionEnd === a.value.length && a.value.length > 0; }));
    let v = await H.views(app); check('focusing address alone does not hide the page', v.some((x) => x.visible));
    await ui.keyboard.type('Page', { delay: 30 }); await sleep(500);
    let sg = await sugg();
    console.log('    suggestions for "Page":', JSON.stringify(sg.items.map((i) => i.t)));
    check('dropdown opens with suggestions', !sg.hidden && sg.items.length >= 3);
    check('history suggestions by title', sg.items.some((i) => /Visited.*Page A/.test(i.t)));
    check('open-tab suggestion', sg.items.some((i) => /Switch to tab.*Page D/.test(i.t)));
    v = await H.views(app); check('live views hidden while dropdown open', v.every((x) => !x.visible));
    let sl = await H.slots(ui); check('slot shows a still while frozen', sl[0] && sl[0].frozen && sl[0].bg, JSON.stringify(sl));
    H.rootShot('t03-suggest-open'); await H.shot(ui, 'browsing-suggest');
    const box = await ui.evaluate(() => { const b = document.getElementById('suggest').getBoundingClientRect(), a = document.getElementById('address-wrap').getBoundingClientRect(); return { b: [b.left, b.top, b.width, b.height].map(Math.round), a: [a.left, a.bottom, a.width].map(Math.round) }; });
    console.log('    dropdown box', JSON.stringify(box));
    // arrows
    await ui.keyboard.press('ArrowDown'); await sleep(100);
    sg = await sugg(); check('ArrowDown moves selection', sg.items[1].sel);
    const filled = await ui.inputValue('#address'); console.log('    address after ArrowDown:', filled);
    await ui.keyboard.press('ArrowUp'); await sleep(100);
    sg = await sugg(); check('ArrowUp moves back', sg.items[0].sel);
    console.log('    address after ArrowDown,ArrowUp:', JSON.stringify(await ui.inputValue('#address')), '(typed text was "Page")');
    check('ArrowUp back to first row restores what the user typed', (await ui.inputValue('#address')) === 'Page', await ui.inputValue('#address'));
    // Escape
    await ui.keyboard.press('Escape');
    await settled('Escape');
    sg = await sugg(); check('Escape closes dropdown', sg.hidden);
    check('Escape restores url in address', (await ui.inputValue('#address')) === s.base + '/c', await ui.inputValue('#address'));
    check('Escape leaves the tab where it was', (await T()).tabs[0].url.endsWith('/c'));

    // Enter on a history suggestion
    await ui.click('#address'); await ui.keyboard.type('Page A', { delay: 30 }); await sleep(400);
    sg = await sugg(); const idx = sg.items.findIndex((i) => /Visited.*Page A/.test(i.t));
    for (let i = 0; i < idx; i++) await ui.keyboard.press('ArrowDown');
    await ui.keyboard.press('Enter');
    check('Enter on history suggestion navigates', await H.loaded(ui, '/a'));
    await settled('Enter on suggestion');
    // click a suggestion
    await ui.click('#address'); await ui.keyboard.type('Page B', { delay: 30 }); await sleep(400);
    await ui.click('#suggest .sugg:has-text("Visited")');
    check('clicking a suggestion navigates', await H.loaded(ui, '/b'));
    await settled('click suggestion');
    // switch-to-tab suggestion
    await ui.click('#address'); await ui.keyboard.type('Page D', { delay: 30 }); await sleep(400);
    await ui.click('#suggest .sugg:has-text("Switch to tab")'); await sleep(400);
    let t = await T(); check('switch-to-tab suggestion switches', t.tabs.find((x) => x.id === t.active).url.endsWith('/d') && t.tabs.length === 2, JSON.stringify(t.tabs.map((x) => x.url)));
    await settled('switch-to-tab');
    await ui.evaluate(() => FD.selectTab(FD.ws().tabs[0].id)); await sleep(300);
    // click away into the page area while the dropdown is open
    await ui.click('#address'); await ui.keyboard.type('zzz', { delay: 30 }); await sleep(400);
    await ui.mouse.click(400, 500);
    await settled('click on page area while open');
    check('click-away closes dropdown', (await sugg()).hidden);
    // delete all text closes it
    await ui.click('#address'); await ui.keyboard.type('q', { delay: 30 }); await sleep(300); await ui.keyboard.press('Backspace'); await sleep(300);
    check('emptying the box closes dropdown', (await sugg()).hidden);
    await settled('emptied box'); await ui.keyboard.press('Escape'); await sleep(200);
    // rapid open/close
    for (let i = 0; i < 12; i++) { await ui.click('#address'); await ui.keyboard.type('x'); await ui.keyboard.press('Escape'); }
    await settled('12 rapid open/close (click,type,Esc)');
    await ui.evaluate(async () => { const a = document.getElementById('address'); for (let i = 0; i < 30; i++) { a.focus(); a.value = 'r' + i; a.dispatchEvent(new Event('input')); if (i % 3 === 0) await new Promise((r) => setTimeout(r, 7)); a.blur(); if (i % 5 === 0) await new Promise((r) => setTimeout(r, 3)); } });
    await settled('30 rapid programmatic open/close');
    await ui.evaluate(async () => { for (let i = 0; i < 20; i++) { FD.freeze(); FD.unfreeze(); } FD.freeze(); await new Promise((r) => setTimeout(r, 1)); FD.unfreeze(); });
    await settled('interleaved FD.freeze/unfreeze');
    // dropdown open, then a shortcut switches tab / opens new tab
    await ui.click('#address'); await ui.keyboard.type('Pa', { delay: 30 }); await sleep(400);
    await H.accel(app, 'CmdOrCtrl+2'); await sleep(600);
    sg = await sugg(); t = await T();
    console.log('    dropdown open then Ctrl+2: suggest hidden', sg.hidden, 'S.frozen', sg.frozen, 'address', JSON.stringify(await ui.inputValue('#address')), 'active', t.tabs.find((x) => x.id === t.active).url, 'focus', await ui.evaluate(() => document.activeElement.id));
    v = await H.views(app); check('after Ctrl+2 with dropdown open the new active page is live', v.some((x) => x.visible && x.url.endsWith('/d')) && sg.hidden, 'visible: ' + JSON.stringify(v.filter((x) => x.visible).map((x) => x.url)) + ' dropdown hidden: ' + sg.hidden);
    H.rootShot('t03-suggest-then-switch');
    await ui.keyboard.press('Escape'); await sleep(300); await ui.mouse.click(400, 500); await sleep(300);
    await settled('after that, Escape');
    await ui.evaluate(() => FD.selectTab(FD.ws().tabs[0].id)); await sleep(300);
    // suggestions when a page is loading slowly / freeze with a not-yet-painted page
    await ui.evaluate((u) => FD.navigate(FD.current(), u + '/hang', { typed: true }), s.base); await sleep(300);
    await ui.click('#address'); await ui.keyboard.type('Pag', { delay: 30 }); await sleep(600);
    check('dropdown opens while page is still loading', !(await sugg()).hidden);
    await ui.keyboard.press('Escape'); await sleep(400);
    v = await H.views(app); check('view returns after dropdown on a loading page', v.some((x) => x.visible));

    // ---- stop and reload
    t = await T(); check('loading state while page hangs', t.tabs[0].rt.loading && (await ui.textContent('#reload-btn')) === '×', JSON.stringify(t.tabs[0]));
    check('spinner in tab while loading', await ui.isVisible('#tabs .tab.active .tab-spin'));
    await ui.click('#reload-btn'); await sleep(600);
    t = await T();
    check('stop ends loading', !t.tabs[0].rt.loading && (await ui.textContent('#reload-btn')) === '↻', JSON.stringify(t.tabs[0]));
    console.log('    after stop: url', t.tabs[0].url, 'title', JSON.stringify(t.tabs[0].title), 'address', await ui.inputValue('#address'), 'view url', (await H.views(app)).find((x) => x.id === t.tabs[0].id).url, 'error page', await ui.isVisible('.page-error'));
    check('after stopping, address shows the page actually displayed', (await ui.inputValue('#address')) === (await H.views(app)).find((x) => x.id === t.tabs[0].id).url, 'address ' + (await ui.inputValue('#address')) + ' but page shown is ' + (await H.views(app)).find((x) => x.id === t.tabs[0].id).url);
    H.rootShot('t03-after-stop');
    await H.typeGo(ui, s.base + '/a'); await H.loaded(ui, '/a'); await sleep(300);
    let n = s.hits.filter((h) => h === '/a').length;
    await ui.click('#reload-btn'); await sleep(700);
    check('reload button refetches', s.hits.filter((h) => h === '/a').length === n + 1);
    await H.accel(app, 'CmdOrCtrl+R'); await sleep(700);
    check('Ctrl+R refetches', s.hits.filter((h) => h === '/a').length === n + 2);
    await H.accel(app, 'F5'); await sleep(700);
    check('F5 refetches', s.hits.filter((h) => h === '/a').length === n + 3);
    await H.accel(app, 'CmdOrCtrl+Shift+R'); await sleep(700);
    check('Ctrl+Shift+R refetches', s.hits.filter((h) => h === '/a').length === n + 4);
    check('reload keeps title', (await T()).tabs[0].title === 'Page A');

    // ---- failed loads
    const dead = 'http://127.0.0.1:9/dead';
    await H.typeGo(ui, dead); await sleep(1500);
    t = await T();
    check('refused port shows error page', await ui.isVisible('.page-error'), JSON.stringify(t.tabs[0]));
    console.log('    error text:', JSON.stringify((await ui.textContent('.page-error').catch(() => '')).replace(/\s+/g, ' ')));
    check('address keeps the failed url', (await ui.inputValue('#address')) === dead, await ui.inputValue('#address'));
    v = await H.views(app); check('live view hidden behind error page', v.every((x) => !x.visible), JSON.stringify(v.map((x) => [x.url, x.visible])));
    check('tab not stuck loading', !t.tabs[0].rt.loading);
    H.rootShot('t03-error'); await H.shot(ui, 'browsing-error');
    n = await ui.evaluate(() => FD.S.state.history.filter((h) => h.url.includes(':9/dead')).length);
    console.log('    failed url in history:', n);
    // Try again (still failing)
    await ui.click('.page-error .btn.primary'); await sleep(1500);
    check('Try again on a still-dead url shows the error again', await ui.isVisible('.page-error'));
    check('not stuck loading after failed retry', !(await T()).tabs[0].rt.loading, JSON.stringify((await T()).tabs[0].rt));
    // Go back from error page
    const hasBack = await ui.isVisible('.page-error .btn:has-text("Go back")');
    check('error page offers Go back', hasBack);
    if (hasBack) { await ui.click('.page-error .btn:has-text("Go back")'); await sleep(900); t = await T(); check('Go back from error returns to previous page', t.tabs[0].url.endsWith('/a') && !(await ui.isVisible('.page-error')), t.tabs[0].url); const al = await H.aligned(app, ui); check('page live again after Go back', al.ok, al.problems.join('; ')); }
    // forward to the error again?
    console.log('    after Go back: fwd disabled =', await ui.isDisabled('#fwd-btn'));
    // error then a server that comes back: use a second server started late
    const net = require('net'); const tmp = net.createServer(); await new Promise((r) => tmp.listen(0, '127.0.0.1', r)); const port2 = tmp.address().port; await new Promise((r) => tmp.close(r));
    await H.typeGo(ui, 'http://127.0.0.1:' + port2 + '/late'); await sleep(1200);
    check('dead port -> error page', await ui.isVisible('.page-error'));
    const http = require('http'); const late = http.createServer((q, r) => { r.writeHead(200, { 'Content-Type': 'text/html' }); r.end('<title>Late page</title><p>arrived'); }); await new Promise((r) => late.listen(port2, '127.0.0.1', r));
    await ui.click('.page-error .btn.primary'); await sleep(1500);
    t = await T();
    check('Try again loads once the server is up', !(await ui.isVisible('.page-error')) && t.tabs[0].title === 'Late page', JSON.stringify(t.tabs[0]));
    let al = await H.aligned(app, ui); check('page live after successful retry', al.ok, al.problems.join('; '));
    late.closeAllConnections(); late.close();
    // Ctrl+R on an error page
    await H.typeGo(ui, dead); await sleep(1200);
    await H.accel(app, 'CmdOrCtrl+R'); await sleep(1200);
    check('Ctrl+R on error page retries and errors again cleanly', await ui.isVisible('.page-error') && !(await T()).tabs[0].rt.loading);
    // back button from error page
    await ui.click('#back-btn'); await sleep(900);
    t = await T(); check('toolbar Back from error page works', !(await ui.isVisible('.page-error')) && /late/.test(t.tabs[0].url), t.tabs[0].url + ' err=' + JSON.stringify(t.tabs[0].rt.error));
    // blocked public host
    await H.typeGo(ui, 'https://en.wikipedia.org/wiki/Ulm'); const gotErr = await H.waitFor(() => ui.isVisible('.page-error'), 20000);
    console.log('    blocked host -> error page:', gotErr, JSON.stringify((await ui.textContent('.page-error').catch(() => '')).replace(/\s+/g, ' ').slice(0, 200)));
    check('blocked public host shows error page', !!gotErr);
    // unresolvable
    await H.typeGo(ui, 'http://no-such-host.invalid/'); const gotErr2 = await H.waitFor(() => ui.evaluate(() => !!FD.rt(FD.current().id).error && FD.current().url.includes('invalid')), 20000);
    check('unresolvable host shows error page', !!gotErr2, JSON.stringify((await T()).tabs[0]));
    // typing a new url from an error page
    await H.typeGo(ui, s.base + '/b'); check('navigating away from an error page works', await H.loaded(ui, '/b')); await sleep(300);
    al = await H.aligned(app, ui); check('page live after leaving error', al.ok && !(await ui.isVisible('.page-error')), al.problems.join('; '));

    // ---- bookmarks
    check('star empty initially', (await ui.textContent('#star-btn')) === '☆');
    await ui.click('#star-btn'); await sleep(200);
    check('star toggles on', (await ui.textContent('#star-btn')) === '★');
    await H.typeGo(ui, s.base + '/c'); await H.loaded(ui, '/c'); await sleep(300);
    check('star off on a different page', (await ui.textContent('#star-btn')) === '☆');
    await H.accel(app, 'CmdOrCtrl+D'); await sleep(200);
    check('Ctrl+D bookmarks', (await ui.textContent('#star-btn')) === '★');
    await ui.click('.rail-btn[data-panel="bookmarks"]'); await sleep(400);
    const drawerText = await ui.textContent('#drawer');
    check('bookmarks listed in drawer', /Page B/.test(drawerText) && /Page C/.test(drawerText), drawerText.slice(0, 200));
    al = await H.aligned(app, ui); check('drawer open: view matches slot', al.ok, al.problems.join('; '));
    H.rootShot('t03-bookmarks-drawer');
    console.log('    drawer rows:', JSON.stringify(await ui.evaluate(() => [...document.querySelectorAll('#drawer a, #drawer .row, #drawer li')].slice(0, 6).map((e) => e.className + '|' + e.textContent.slice(0, 50)))));
    // click bookmark in drawer
    const row = ui.locator('#drawer a:has-text("Page B")').first();
    if (await row.count()) { await row.click(); check('clicking a bookmark opens it', await H.loaded(ui, '/b')); await sleep(200); check('star on for bookmarked page', (await ui.textContent('#star-btn')) === '★'); }
    else check('bookmark row clickable', false, 'no <a> for bookmark');
    await ui.click('#address'); await ui.keyboard.type('Page C', { delay: 30 }); await sleep(400);
    sg = await sugg(); check('bookmark appears in suggestions', sg.items.some((i) => /^Bookmark.*Page C/.test(i.t)), JSON.stringify(sg.items.map((i) => i.t)));
    await ui.keyboard.press('Escape'); await sleep(300);
    await ui.click('#star-btn'); await sleep(200);
    check('star toggles off (unbookmark)', (await ui.textContent('#star-btn')) === '☆' && !/Page B/.test(await ui.textContent('#drawer section')), '');
    await ui.evaluate(() => FD.toggleDrawer()); await sleep(300);
    // bookmark on new tab page
    await ui.evaluate(() => FD.newTab()); await sleep(300);
    await ui.click('#star-btn'); await sleep(200);
    console.log('    star on new tab page -> toast:', JSON.stringify(await ui.textContent('#toast')));
    await ui.evaluate(() => FD.closeTab(FD.current().id)); await sleep(300);

    // ---- find in page
    await ui.evaluate(() => FD.selectTab(FD.ws().tabs[0].id)); await sleep(200);
    await H.typeGo(ui, s.base + '/c'); await H.loaded(ui, '/c'); await sleep(400);
    await H.accel(app, 'CmdOrCtrl+F'); await sleep(400);
    check('Ctrl+F opens find bar focused', await ui.isVisible('#findbar') && await ui.evaluate(() => document.activeElement.id === 'find-input'));
    al = await H.aligned(app, ui); check('find bar open: view moves below it', al.ok, al.problems.join('; '));
    await ui.keyboard.type('needle', { delay: 40 }); await sleep(600);
    check('find counts matches (3, case-insensitive)', /of 3/.test(await ui.textContent('#find-count')), await ui.textContent('#find-count'));
    const c1 = await ui.textContent('#find-count');
    await ui.keyboard.press('Enter'); await sleep(400); const c2 = await ui.textContent('#find-count');
    await ui.keyboard.press('Enter'); await sleep(400); const c3 = await ui.textContent('#find-count');
    await ui.keyboard.press('Shift+Enter'); await sleep(400); const c4 = await ui.textContent('#find-count');
    console.log('    find counts typed/Enter/Enter/Shift+Enter:', c1, '|', c2, '|', c3, '|', c4);
    check('Enter advances, Shift+Enter goes back', c2 !== c1 && c3 !== c2 && c4 === c2, [c1, c2, c3, c4].join(' | '));
    check('focus stays in find box while stepping', await ui.evaluate(() => document.activeElement.id === 'find-input'));
    H.rootShot('t03-find');
    await ui.fill('#find-input', 'zzzz'); await sleep(500);
    check('no matches reported', /No matches|0 of 0/i.test(await ui.textContent('#find-count')), await ui.textContent('#find-count'));
    await ui.fill('#find-input', ''); await sleep(400);
    console.log('    empty find text count:', JSON.stringify(await ui.textContent('#find-count')));
    await ui.fill('#find-input', 'needle'); await sleep(400);
    // switch tab with find open
    await H.accel(app, 'CmdOrCtrl+2'); await sleep(500);
    console.log('    find bar after tab switch: visible', await ui.isVisible('#findbar'), 'count', JSON.stringify(await ui.textContent('#find-count')), 'input', await ui.inputValue('#find-input'));
    await H.accel(app, 'CmdOrCtrl+1'); await sleep(400);
    // the find bar belongs to the tab it was opened on, so it is closed after a tab switch; open it again
    if (!(await ui.isVisible('#findbar'))) { await H.accel(app, 'CmdOrCtrl+F'); await sleep(400); }
    await ui.click('#find-input'); await ui.keyboard.press('Escape'); await sleep(400);
    check('Escape closes find bar', !(await ui.isVisible('#findbar')));
    al = await H.aligned(app, ui); check('find closed: view back to full slot', al.ok, al.problems.join('; '));
    // find on built-in page
    await ui.evaluate(() => FD.newTab('fielddesk://about')); await sleep(400);
    await H.accel(app, 'CmdOrCtrl+F'); await sleep(300); await ui.keyboard.type('privacy', { delay: 30 }); await sleep(300);
    console.log('    find on built-in page: count', JSON.stringify(await ui.textContent('#find-count')), 'selection', JSON.stringify(await ui.evaluate(() => String(getSelection()))), 'focus', await ui.evaluate(() => document.activeElement.id), 'input value', JSON.stringify(await ui.inputValue('#find-input')));
    await ui.keyboard.press('Escape'); await sleep(200); await ui.evaluate(() => { FD.closeFind(); FD.closeTab(FD.current().id); }); await sleep(300);

    // ---- zoom
    await ui.evaluate(() => FD.selectTab(FD.ws().tabs[0].id)); await sleep(300);
    const z = async () => (await H.views(app)).find((x) => x.visible).zoom;
    await H.accel(app, 'CmdOrCtrl+='); await sleep(200); const z1 = await z();
    await H.accel(app, 'CmdOrCtrl+='); await sleep(200); const z2 = await z();
    await H.accel(app, 'CmdOrCtrl+-'); await sleep(200); const z3 = await z();
    await H.accel(app, 'CmdOrCtrl+0'); await sleep(200); const z4 = await z();
    check('zoom in/out/reset', z1 > 0 && z2 > z1 && z3 === z1 && z4 === 0, [z1, z2, z3, z4].join());
    console.log('    Ctrl+Plus item present:', await H.accel(app, 'CmdOrCtrl+Plus'), '-> zoom', await z()); await H.accel(app, 'CmdOrCtrl+0');
    al = await H.aligned(app, ui); check('zoom does not disturb view bounds', al.ok, al.problems.join('; '));
  } finally { await app.close(); await s.close(); }
  console.log(H.failures() ? `\n${H.failures()} FAILED` : '\nall ok');
})().catch((e) => { console.error(e); process.exit(1); });
