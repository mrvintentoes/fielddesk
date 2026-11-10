// Tabs, address bar, back/forward, links that open tabs.
const H = require('./helpers');
const { check, sleep } = H;
(async () => {
  const s = await H.startServer();
  const { app, ui } = await H.launch(H.freshProfile('t01'));
  const T = () => H.tabsOf(ui);
  const urls = async () => (await T()).tabs.map((t) => t.url.replace(s.base, ''));
  try {
    await H.loose(ui);
    let t = await T();
    check('loose starts with one new tab', t.tabs.length === 1 && t.tabs[0].url === 'fielddesk://newtab');

    // ---- address bar input kinds
    const kinds = await ui.evaluate(() => ['example.com', 'localhost:8080', 'localhost', '127.0.0.1:99/x', 'napoleon ulm 1805', 'what is 2.5', 'node.js', 'foo', 'mailto:a@b.c', 'javascript:alert(1)', 'file:///etc/passwd', 'about:blank', 'example.com/a b', 'münchen.de', '[::1]:8080', 'en.wikipedia.org/wiki/Ulm_(1805)', 'HTTP://EXAMPLE.com', 'user:pw@example.com', 'example.com:8080/x', 'fielddesk://about', 'view-source:http://x.com', 'chrome://gpu', 'C:\\dir', 'a.b', 'intranet/', 'http://intranet', 'https://ex ample.com', ' https://example.com ', '1.2.3', 'cache:example.com', 'site:example.com ulm', 'define:fog', 'example.co.uk', 'EXAMPLE.COM', 'x.museum', 'data:text/html,<b>x', 'ftp://example.com'].map((q) => [q, FD.toUrl(q, 'ddg')]));
    console.log(kinds.map((k) => '    ' + JSON.stringify(k[0]) + ' -> ' + k[1]).join('\n'));

    await H.typeGo(ui, s.base.replace('http://', '') + '/a');   // bare host:port
    check('typed 127.0.0.1:port/a loads', await H.loaded(ui, '/a'));
    await sleep(300);
    t = await T();
    check('title and favicon arrive', t.tabs[0].title === 'Page A' && !!t.tabs[0].favicon, JSON.stringify(t.tabs[0]));
    check('address shows url', (await ui.inputValue('#address')) === s.base + '/a', await ui.inputValue('#address'));
    check('back enabled (to new tab page)', !(await ui.isDisabled('#back-btn')));
    let al = await H.aligned(app, ui); check('view aligned with slot', al.ok, al.problems.join('; '));

    // localhost:port
    await H.typeGo(ui, 'localhost:' + s.port + '/b');
    check('typed localhost:port/b loads', await H.loaded(ui, 'localhost:' + s.port + '/b'));
    // link click in page
    let pg = H.viewPage(app, '/b');
    await pg.click('#to-c');
    check('link click navigates same tab', await H.loaded(ui, '/c'));
    await sleep(300);
    t = await T();
    check('still one tab', t.tabs.length === 1);
    check('title follows link nav', t.tabs[0].title === 'Page C', t.tabs[0].title);

    // ---- back / forward chain: newtab -> a -> b -> c
    await ui.click('#back-btn'); check('back to b', await H.loaded(ui, '/b'));
    await ui.click('#back-btn'); check('back to a', await H.loaded(ui, '/a'));
    await sleep(200);
    check('back still enabled at first web page', !(await ui.isDisabled('#back-btn')));
    await ui.click('#back-btn'); await sleep(400);
    t = await T();
    check('back from first web page returns to new tab page', t.tabs[0].url === 'fielddesk://newtab', t.tabs[0].url);
    check('new tab page rendered', await ui.isVisible('.page-newtab'));
    check('address empty on new tab page', (await ui.inputValue('#address')) === '');
    let v = await H.views(app); check('live view hidden on new tab page', v.every((x) => !x.visible), JSON.stringify(v));
    check('forward enabled on new tab page', !(await ui.isDisabled('#fwd-btn')));
    check('back disabled on new tab page', await ui.isDisabled('#back-btn'));
    await ui.click('#fwd-btn'); await sleep(500);
    t = await T();
    check('forward returns to a', t.tabs[0].url.endsWith('/a') && t.tabs[0].title === 'Page A', JSON.stringify(t.tabs[0]));
    al = await H.aligned(app, ui); check('view visible+aligned after forward from new tab page', al.ok, al.problems.join('; '));
    await ui.click('#fwd-btn'); check('forward to b', await H.loaded(ui, '/b'));
    await ui.click('#fwd-btn'); check('forward to c', await H.loaded(ui, '/c'));
    await sleep(200);
    check('forward disabled at end', await ui.isDisabled('#fwd-btn'));
    // keyboard back/forward via menu
    await H.accel(app, 'Alt+Left'); check('Alt+Left goes back', await H.loaded(ui, '/b'));
    await H.accel(app, 'Alt+Right'); check('Alt+Right goes forward', await H.loaded(ui, '/c'));

    // back to newtab, then type something new: forward history is dropped, back works
    await ui.evaluate(() => FD.navigate(FD.current(), 'fielddesk://about'));
    await sleep(300);
    t = await T();
    check('navigating web -> built-in page keeps a way back', !(await ui.isDisabled('#back-btn')), 'back disabled on fielddesk://about after coming from ' + s.base + '/c');

    // ---- in-page: hash + pushState
    await ui.evaluate((u) => FD.navigate(FD.current(), u, { typed: true }), s.base + '/a');
    await H.loaded(ui, '/a'); await sleep(300);
    pg = H.viewPage(app, '/a');
    await pg.click('#hash'); await sleep(400);
    t = await T(); check('hash link updates address', t.tabs[0].url.endsWith('/a#h2'), t.tabs[0].url);
    await pg.click('#push'); await sleep(400);
    t = await T(); check('pushState updates address and title', t.tabs[0].url.endsWith('/a/pushed') && t.tabs[0].title === 'Pushed A', JSON.stringify(t.tabs[0].url + ' ' + t.tabs[0].title));
    await ui.click('#back-btn'); await sleep(400);
    t = await T(); check('back over pushState', t.tabs[0].url.endsWith('/a#h2'), t.tabs[0].url);
    // ---- form
    await pg.fill('#q', 'hello world'); await pg.click('#go');
    check('GET form submits', await H.loaded(ui, '/echo?q=hello+world'));
    await ui.click('#back-btn'); await H.loaded(ui, '/a'); await sleep(300);
    // redirect
    await H.typeGo(ui, s.base + '/redirect');
    check('redirect ends at /b with right address', await H.loaded(ui, '/b'));
    // 404 page with body is shown, not our error page
    await H.typeGo(ui, s.base + '/404'); await H.loaded(ui, '/404'); await sleep(300);
    check('HTTP 404 shows the server page', !(await ui.isVisible('.page-error')) && (await T()).tabs[0].title === 'Not found here');
    // no <title>
    await H.typeGo(ui, s.base + '/notitle'); await H.loaded(ui, '/notitle'); await sleep(300);
    t = await T(); console.log('    untitled page tab title:', JSON.stringify(t.tabs[0].title), '| strip text:', JSON.stringify(await ui.textContent('#tabs .tab .tab-title')));

    // ---- links opening tabs. Tab 0 = /a ; add a trailing tab to check placement.
    await H.typeGo(ui, s.base + '/a'); await H.loaded(ui, '/a'); await sleep(300);
    await ui.evaluate((u) => { const cur = FD.current().id; FD.newTab(u + '/d', { background: true }); }, s.base);
    await sleep(500);
    pg = H.viewPage(app, s.base + '/a');
    await pg.click('#blank'); await sleep(900);
    t = await T();
    check('target=_blank opens a tab next to opener', (await urls()).join() === '/a,/c,/d', (await urls()).join());
    check('target=_blank tab is foreground', t.tabs[1].id === t.active);
    al = await H.aligned(app, ui); check('new foreground tab view aligned', al.ok, al.problems.join('; '));
    check('back disabled in tab opened by link', await ui.isDisabled('#back-btn'));
    await ui.evaluate(() => FD.closeTab(FD.current().id)); await sleep(300);
    t = await T();
    console.log('    after closing link-opened tab, active is', t.tabs.find((x) => x.id === t.active).url.replace(s.base, ''), '(Chrome returns to opener /a)');

    await ui.evaluate(() => FD.selectTab(FD.ws().tabs[0].id)); await sleep(300);
    pg = H.viewPage(app, s.base + '/a');
    await pg.click('#l1', { modifiers: ['Control'] }); await sleep(500);
    await pg.click('#l2', { modifiers: ['Control'] }); await sleep(500);
    await pg.click('#l3', { button: 'middle' }); await sleep(900);
    t = await T();
    check('ctrl/middle-click open background tabs (active unchanged)', t.active === t.tabs[0].id, (await urls()).join());
    check('background tabs open after opener in click order (n/1,n/2,n/3)', (await urls()).join() === '/a,/n/1,/n/2,/n/3,/d', (await urls()).join());
    v = await H.views(app);
    check('background tabs actually load', ['/n/1', '/n/2', '/n/3'].every((p) => v.some((x) => x.url.endsWith(p) && !x.visible)), JSON.stringify(v.map((x) => [x.url, x.visible])));
    check('background tab titles arrive', t.tabs.filter((x) => /\/n\//.test(x.url)).every((x) => /^N\d$/.test(x.title)), t.tabs.map((x) => x.title).join());
    al = await H.aligned(app, ui); check('opener still visible/aligned', al.ok, al.problems.join('; '));

    await pg.click('#blank', { modifiers: ['Shift'] }); await sleep(800);
    t = await T(); console.log('    shift-click target=_blank ->', (await urls()).join(), 'active', t.tabs.findIndex((x) => x.id === t.active));
    await ui.evaluate(() => FD.selectTab(FD.ws().tabs[0].id)); await sleep(300);
    const before = (await T()).tabs.length;
    await pg.click('#wopen'); await sleep(800);
    t = await T(); check('window.open opens a foreground tab next to opener', t.tabs.length === before + 1 && t.tabs[1].url.endsWith('/c') && t.active === t.tabs[1].id, (await urls()).join());
    await ui.evaluate(() => FD.selectTab(FD.ws().tabs[0].id)); await sleep(300);
    await pg.click('#wpop'); await sleep(800);
    t = await T(); check('window.open with features becomes a tab', t.tabs.length === before + 2 && t.tabs[1].url.endsWith('/c'), (await urls()).join());
    check('no extra OS windows', (await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length)) === 1);
    await ui.evaluate(() => FD.selectTab(FD.ws().tabs[0].id)); await sleep(300);
    // POST form to _blank not covered; POST same tab
    await pg.click('#pgo'); await H.loaded(ui, '/echo'); await sleep(300);
    pg = H.viewPage(app, '/echo');
    check('POST form works', /POST.*q=posted/.test(await pg.textContent('#e')));
    // mailto does nothing bad
        await pg.click('#mail', { noWaitAfter: true }).catch(() => {}); await sleep(800);
    t = await T(); check('mailto leaves no stuck spinner', !t.tabs[0].rt.loading); check('mailto link leaves page in place', /\/echo$/.test(t.tabs[0].url), t.tabs[0].url);

    H.rootShot('t01-end');
  } finally { await app.close(); await s.close(); }
  console.log(H.failures() ? `\n${H.failures()} FAILED` : '\nall ok');
})().catch((e) => { console.error(e); process.exit(1); });
