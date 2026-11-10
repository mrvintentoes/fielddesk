// Session restore, reopen closed tab across restart, kill -9 durability, first paint.
const H = require('./helpers');
const { check, sleep } = H;
const fs = require('fs'), path = require('path');
(async () => {
  const s = await H.startServer();
  const profile = H.freshProfile('t04');
  const rel = (u) => u.replace(s.base, '').replace('fielddesk://', '~');
  let { app, ui } = await H.launch(profile);
  try {
    await H.loose(ui);
    await H.typeGo(ui, s.base + '/a'); await H.loaded(ui, '/a');
    for (const p of ['/b', '/c', '/long', '/d']) await ui.evaluate((u) => FD.newTab(u), s.base + p);
    await sleep(1500);
    await ui.evaluate(() => FD.newTab()); await sleep(200);           // a new tab page in the middle of the session
    await ui.evaluate((u) => FD.newTab(u), s.base + '/n/1'); await sleep(800);
    // in tab /c build some history: c -> a -> b
    await ui.evaluate(() => FD.selectTab(FD.ws().tabs[2].id)); await sleep(300);
    await H.viewPage(app, s.base + '/c').click('#to-a'); await sleep(600);
    // close two tabs for reopen-after-restart: /d then /b
    await ui.evaluate(() => { FD.closeTab(FD.ws().tabs[4].id); FD.closeTab(FD.ws().tabs[1].id); }); await sleep(300);
    // scroll the long page, make it active
    await ui.evaluate(() => FD.selectTab(FD.ws().tabs.find((t) => /long/.test(t.url)).id)); await sleep(500);
    await H.viewPage(app, s.base + '/long').evaluate(() => scrollTo(0, 3000)); await sleep(300);
    // bookmark + zoom
    await ui.click('#star-btn');
    const before = await H.tabsOf(ui);
    console.log('    before quit:', before.tabs.map((t) => rel(t.url) + '[' + t.title + ']').join(' '), '| active', rel(before.tabs.find((t) => t.id === before.active).url));
    await sleep(600);
    await app.close();

    // ---- relaunch: capture the earliest paint
    s.hits.length = 0;
    const t0 = Date.now();
    ({ app, ui } = await H.launch(profile));
    const early = H.rootShot('t04-restart-early');
    const st0 = await H.tabsOf(ui);
    await sleep(1800);
    H.rootShot('t04-restart-settled');
    const st = await H.tabsOf(ui);
    check('restart: same workspace', st.ws === 'loose', st.ws);
    check('restart: tab order and urls', st.tabs.map((t) => t.url).join() === before.tabs.map((t) => t.url).join(), st.tabs.map((t) => rel(t.url)).join(' '));
    check('restart: active tab', rel(st.tabs.find((t) => t.id === st.active).url) === '/long');
    check('restart: titles shown immediately (before load)', st0.tabs.map((t) => t.title).join() === before.tabs.map((t) => t.title).join(), st0.tabs.map((t) => t.title).join('|'));
    check('restart: favicons kept for unloaded tabs', st.tabs.filter((t) => /\/a$/.test(t.url)).every((t) => !!t.favicon), JSON.stringify(st.tabs.map((t) => !!t.favicon)));
    let v = await H.views(app);
    check('restart: only the active tab is loaded', v.length === 1 && v[0].url.endsWith('/long'), JSON.stringify(v.map((x) => x.url)));
    check('restart: server saw only the active page', s.hits.filter((h) => !/favicon|icon/.test(h)).join() === '/long', s.hits.join());
    let al = await H.aligned(app, ui); check('restart: active view visible+aligned', al.ok, al.problems.join('; '));
    const sy = await H.viewPage(app, s.base + '/long').evaluate(() => scrollY);
    console.log('    scroll position after restart:', sy, '(was 3000)');
    check('restart: bookmark persisted', (await ui.textContent('#star-btn')) === '★');
    check('restart: no unloaded tab shows a spinner', (await ui.locator('#tabs .tab-spin').count()) === 0, 'spinners: ' + await ui.locator('#tabs .tab-spin').count());
    // lazily load on select
    await ui.click('#tabs .tab:nth-child(1)'); check('restart: selecting an unloaded tab loads it', await H.loaded(ui, '/a')); await sleep(300);
    al = await H.aligned(app, ui); check('restart: lazily loaded tab aligned', al.ok, al.problems.join('; '));
    // history of restored tab
    await ui.click('#tabs .tab:nth-child(2)'); await H.loaded(ui, '/a'); await sleep(400);
    console.log('    restored tab that had history c->a: back disabled =', await ui.isDisabled('#back-btn'), '(Chrome restores per-tab back history)');
    // reopen closed after restart
    await H.accel(app, 'CmdOrCtrl+Shift+T'); await sleep(900);
    let now = await H.tabsOf(ui);
    check('restart: Ctrl+Shift+T reopens last closed (/b)', now.tabs.some((t) => t.url.endsWith('/b')) && now.tabs.find((t) => t.id === now.active).url.endsWith('/b'), now.tabs.map((t) => rel(t.url)).join(' '));
    await H.accel(app, 'CmdOrCtrl+Shift+T'); await sleep(900);
    now = await H.tabsOf(ui);
    check('restart: second reopen brings /d', now.tabs.find((t) => t.id === now.active).url.endsWith('/d'), now.tabs.map((t) => rel(t.url)).join(' '));
    await H.accel(app, 'CmdOrCtrl+Shift+T'); await sleep(400);
    console.log('    third reopen with nothing left: toast', JSON.stringify(await ui.textContent('#toast')), 'tabs', (await H.tabsOf(ui)).tabs.length);

    // ---- reopen a tab closed in another workspace
    await ui.evaluate(() => FD.closeTab(FD.current().id)); await sleep(200);
    await ui.evaluate(() => FD.openWorkspace('fog')); await sleep(600);
    const fogBefore = (await H.tabsOf(ui)).tabs.length;
    await H.accel(app, 'CmdOrCtrl+Shift+T'); await sleep(700);
    now = await H.tabsOf(ui);
    check('reopen does not drop a tab closed in "Loose tabs" into another workspace', !(now.ws === 'fog' && now.tabs.length === fogBefore + 1), 'tab ' + rel(now.tabs[now.tabs.length - 1].url) + ' closed in loose reopened inside workspace ' + now.ws);
    await ui.evaluate(() => { const w = FD.ws(); const t = w.tabs.find((x) => /127\.0\.0\.1/.test(x.url)); if (t) FD.closeTab(t.id); FD.S.state.closed.length = 0; FD.openWorkspace('loose'); }); await sleep(600);

    // ---- kill -9 shortly after a change
    await ui.evaluate((u) => FD.newTab(u + '/n/77'), s.base);
    await sleep(700);
    const pid = app.process().pid;
    const expect = (await H.tabsOf(ui)).tabs.map((t) => t.url);
    process.kill(pid, 'SIGKILL');
    await sleep(1500);
    const saved = JSON.parse(fs.readFileSync(path.join(profile, 'field-desk.json'), 'utf8'));
    check('kill -9 700ms after opening a tab: tab is in the state file', saved.workspaces.loose.tabs.some((t) => t.url.endsWith('/n/77')), saved.workspaces.loose.tabs.map((t) => rel(t.url)).join(' '));
    check('state file is valid JSON after kill', !!saved.workspaces);
    try { await app.close(); } catch (_) {}
    ({ app, ui } = await H.launch(profile));
    await sleep(1200);
    now = await H.tabsOf(ui);
    check('relaunch after kill -9 restores tabs and active', now.tabs.map((t) => t.url).join() === expect.join() && now.tabs.find((t) => t.id === now.active).url.endsWith('/n/77'), now.tabs.map((t) => rel(t.url)).join(' '));
    check('relaunch after kill: no .tmp or .unreadable litter', !fs.readdirSync(profile).some((f) => /field-desk\.json\.(tmp|unreadable)/.test(f)), fs.readdirSync(profile).filter((f) => /field-desk/.test(f)).join());
    // kill within 100ms of a change (debounce window)
    await ui.evaluate((u) => { FD.newTab(u + '/n/88'); }, s.base);
    await sleep(100);
    process.kill(app.process().pid, 'SIGKILL'); await sleep(1200);
    const saved2 = JSON.parse(fs.readFileSync(path.join(profile, 'field-desk.json'), 'utf8'));
    console.log('    kill -9 100ms after a change: change saved =', saved2.workspaces.loose.tabs.some((t) => t.url.endsWith('/n/88')), '(debounce is ~270ms; loss of the last 0.3s is tolerable)');
    try { await app.close(); } catch (_) {}
    // kill during a navigation in progress
    ({ app, ui } = await H.launch(profile)); await sleep(800);
    await H.typeGo(ui, s.base + '/b'); await H.loaded(ui, '/b'); await sleep(700);
    process.kill(app.process().pid, 'SIGKILL'); await sleep(1000);
    const saved3 = JSON.parse(fs.readFileSync(path.join(profile, 'field-desk.json'), 'utf8'));
    const act = saved3.workspaces.loose.tabs.find((t) => t.id === saved3.workspaces.loose.active);
    check('kill -9 after navigation: new url and title saved', act.url.endsWith('/b') && act.title === 'Page B', JSON.stringify(act));
    try { await app.close(); } catch (_) {}

    // ---- corrupt state file
    fs.writeFileSync(path.join(profile, 'field-desk.json'), '{"workspaces": {"loose": ');
    ({ app, ui } = await H.launch(profile)); await sleep(800);
    now = await H.tabsOf(ui);
    check('corrupt state file: app still starts', now.tabs.length > 0, now.ws);
    console.log('    after corrupt file: workspace', now.ws, 'files', fs.readdirSync(profile).filter((f) => /field-desk/.test(f)).join());
    await app.close();
    // ---- restart with active tab on a dead url, and window size restore
    ({ app, ui } = await H.launch(profile)); await sleep(500);
    await H.loose(ui);
    await H.typeGo(ui, 'http://127.0.0.1:9/dead'); await sleep(1000);
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setBounds({ x: 40, y: 30, width: 1111, height: 700 })); await sleep(500);
    await app.close();
    ({ app, ui } = await H.launch(profile)); await sleep(1500);
    now = await H.tabsOf(ui);
    check('restart on a dead url shows the error page, not a blank', await ui.isVisible('.page-error'), JSON.stringify(now.tabs.find((t) => t.id === now.active)));
    const wb = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].getBounds());
    check('window size restored', wb.width === 1111 && wb.height === 700, JSON.stringify(wb));
  } finally { try { await app.close(); } catch (_) {} await s.close(); }
  console.log(H.failures() ? `\n${H.failures()} FAILED` : '\nall ok');
})().catch((e) => { console.error(e); process.exit(1); });
