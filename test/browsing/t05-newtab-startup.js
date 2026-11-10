// First run, startup frames, new tab page (search, pinned sites, Resume), workspace switching.
const H = require('./helpers');
const { check, sleep } = H;
const { _electron } = require('playwright');
const path = require('path'), fs = require('fs');
const { execSync } = require('child_process');
(async () => {
  const s = await H.startServer();
  const profile = H.freshProfile('t05');
  let app, ui;
  try {
    // ---- startup frames on first run: sample the screen while the app boots
    const args = [H.ROOT]; if (process.getuid && process.getuid() === 0) args.unshift('--no-sandbox');
    const t0 = Date.now();
    const pApp = _electron.launch({ executablePath: require('electron'), args, env: Object.assign({}, process.env, { FIELDDESK_USER_DATA: profile }) });
    const frames = [];
    for (let i = 0; i < 14; i++) { const f = path.join(H.SHOTS, 't05-boot-' + String(i).padStart(2, '0') + '.png'); try { execSync('import -window root ' + f); frames.push([Date.now() - t0, f]); } catch (_) {} await sleep(120); }
    app = await pApp; ui = await app.firstWindow(); await ui.waitForSelector('html.ready');
    // classify frames by the colour in the middle of the window and in the tab strip
    for (const [ms, f] of frames) {
      const px = execSync(`convert ${f} -format "%[pixel:p{700,450}] %[pixel:p{700,30}] %[pixel:p{200,65}]" info:`).toString();
      console.log('    boot frame @' + ms + 'ms centre/tabstrip/toolbar:', px);
    }
    await sleep(800);
    H.rootShot('t05-first-run');
    let t = await H.tabsOf(ui);
    check('first run opens Fog of War in split view', t.ws === 'fog' && t.split, JSON.stringify(t.tabs.map((x) => x.url)));
    const chromeH = await ui.evaluate(() => ({ chrome: document.getElementById('chrome').getBoundingClientRect().height, win: innerHeight, panes: document.getElementById('panes').getBoundingClientRect().width, winW: innerWidth }));
    console.log('    chrome height', chromeH.chrome, 'of', chromeH.win, '| page area width', chromeH.panes, 'of', chromeH.winW);
    // ---- new tab page in loose
    await H.loose(ui); await sleep(300);
    H.rootShot('t05-newtab'); await H.shot(ui, 'browsing-newtab');
    check('new tab page shows search box', await ui.isVisible('.nt-search'));
    console.log('    focus on fresh new tab page:', await ui.evaluate(() => document.activeElement.className || document.activeElement.id || document.activeElement.tagName));
    check('Resume button present', await ui.isVisible('#resume-btn'));
    console.log('    resume text:', JSON.stringify((await ui.textContent('#resume-btn')).slice(0, 120)));
    const tiles = () => ui.evaluate(() => [...document.querySelectorAll('.tile .tile-title')].map((e) => e.textContent));
    console.log('    tiles:', (await tiles()).join(', '));
    // search box: phrase
    await ui.fill('.nt-search', 'napoleon ulm'); await ui.keyboard.press('Enter'); await sleep(600);
    t = await H.tabsOf(ui);
    check('new tab search goes to the search engine in the same tab', t.tabs.length === 1 && /duckduckgo\.com\/\?q=napoleon%20ulm/.test(t.tabs[0].url), t.tabs[0].url);
    await H.waitFor(() => ui.isVisible('.page-error'), 15000);
    await ui.click('#back-btn'); await sleep(500);
    t = await H.tabsOf(ui); check('back from (failed) search returns to new tab page', t.tabs[0].url === 'fielddesk://newtab', t.tabs[0].url);
    console.log('    search box content after coming back:', JSON.stringify(await ui.inputValue('.nt-search')));
    // search box: url
    await ui.fill('.nt-search', s.base.replace('http://', '') + '/a'); await ui.keyboard.press('Enter');
    check('new tab search box accepts an address', await H.loaded(ui, '/a'));
    let al = await H.aligned(app, ui); check('page live after new-tab search', al.ok, al.problems.join('; '));
    for (let i = 0; i < 3 && (await H.tabsOf(ui)).tabs[0].url !== 'fielddesk://newtab'; i++) { await ui.click('#back-btn'); await sleep(700); }
    check('back reaches the new tab page again', (await H.tabsOf(ui)).tabs[0].url === 'fielddesk://newtab', (await H.tabsOf(ui)).tabs[0].url);
    // pinned sites: add
    await ui.click('.tile-add'); await sleep(200);
    await ui.keyboard.type(s.base.replace('http://', '') + '/b'); await ui.keyboard.press('Tab'); await ui.keyboard.type('Fixture B'); await ui.keyboard.press('Enter'); await sleep(300);
    check('pin a site adds a tile', (await tiles()).includes('Fixture B'), (await tiles()).join());
    // invalid address in pin form
    await ui.click('.tile-add'); await sleep(200); await ui.keyboard.type('not a url'); await ui.keyboard.press('Enter'); await sleep(200);
    console.log('    pin form with "not a url": form still open =', await ui.isVisible('.tile-form'), '| any message =', JSON.stringify(await ui.evaluate(() => (document.querySelector('.tile-form') || {}).textContent)));
    await ui.click('.tile-form .btn.quiet'); await sleep(200);
    // click tile
    await ui.click('.tile-link:has-text("Fixture B")');
    check('clicking a pinned tile opens it in this tab', await H.loaded(ui, '/b') && (await H.tabsOf(ui)).tabs.length === 1);
    await sleep(300); await ui.click('#back-btn'); await sleep(700);
    check('newtab -> A -> back -> tile B -> back returns to the new tab page (not to A)', (await H.tabsOf(ui)).tabs[0].url === 'fielddesk://newtab', 'went to ' + (await H.tabsOf(ui)).tabs[0].url);
    for (let i = 0; i < 3 && (await H.tabsOf(ui)).tabs[0].url !== 'fielddesk://newtab'; i++) { await ui.click('#back-btn'); await sleep(700); }
    // ctrl-click and middle-click tile
    await ui.click('.tile-link:has-text("Fixture B")', { modifiers: ['Control'] }); await sleep(600);
    t = await H.tabsOf(ui); check('ctrl-click tile opens background tab', t.tabs.length === 2 && t.tabs[0].id === t.active && t.tabs[1].url.endsWith('/b'), JSON.stringify(t.tabs.map((x) => x.url)));
    await ui.click('.tile-link:has-text("Fixture B")', { button: 'middle' }); await sleep(600);
    t = await H.tabsOf(ui); check('middle-click tile opens background tab', t.tabs.length === 3 && t.tabs[0].id === t.active, JSON.stringify(t.tabs.map((x) => x.url)));
    // remove pinned
    await ui.hover('.tile:has-text("Wikisource")'); await ui.click('.tile:has-text("Wikisource") .tile-x'); await sleep(200);
    check('unpin removes a tile', !(await tiles()).includes('Wikisource'));
    // second new tab shows the same tiles
    await ui.evaluate(() => FD.newTab()); await sleep(300);
    check('tiles consistent on another new tab', (await tiles()).includes('Fixture B') && !(await tiles()).includes('Wikisource'), (await tiles()).join());
    await ui.evaluate(() => FD.selectTab(FD.ws().tabs[0].id)); await sleep(300);
    console.log('    first (older) new tab page tiles after change made elsewhere:', (await tiles()).join(', '));
    // ---- Resume
    const looseTabs = (await H.tabsOf(ui)).tabs.map((x) => x.url);
    const resumeName = await ui.textContent('#resume-btn .nt-resume-name');
    await ui.click('#resume-btn'); await sleep(800);
    t = await H.tabsOf(ui);
    check('Resume switches to the named workspace', await ui.evaluate((n) => FD.ws().name === n, resumeName), resumeName + ' -> ' + t.ws);
    console.log('    resumed', t.ws, 'tabs', t.tabs.map((x) => x.url).join(' '), 'split', t.split);
    let v = await H.views(app);
    check('Resume: views of the old workspace are gone', !v.some((x) => x.url.startsWith(s.base)), JSON.stringify(v.map((x) => x.url)));
    H.rootShot('t05-resumed');
    // put real pages in this workspace, leave, resume back
    await ui.evaluate((u) => { FD.newTab(u + '/a'); FD.newTab(u + '/c'); }, s.base); await H.loaded(ui, '/c'); await sleep(300);
    const wsTabs = (await H.tabsOf(ui)).tabs.map((x) => x.url);
    const wsId = t.ws;
    await ui.evaluate(() => FD.openWorkspace('loose')); await sleep(600);
    t = await H.tabsOf(ui);
    check('back in loose: its tabs are intact', t.tabs.map((x) => x.url).join() === looseTabs.join(), t.tabs.map((x) => x.url).join(' '));
    await ui.evaluate(() => { const nt = FD.ws().tabs.find((x) => x.url === 'fielddesk://newtab'); FD.selectTab(nt.id); }); await sleep(400);
    console.log('    resume now offers:', JSON.stringify(await ui.textContent('#resume-btn .nt-resume-name').catch(() => null)), '(last workspace was', wsId + ')');
    check('Resume offers the workspace just left', await ui.evaluate((id) => (FD.resumeTarget() || {}).id === id, wsId) && (await ui.textContent('#resume-btn .nt-resume-name').catch(() => '')) === await ui.evaluate((id) => FD.S.state.workspaces[id].name, wsId), 'button shows ' + JSON.stringify(await ui.textContent('#resume-btn .nt-resume-name').catch(() => null)));
    await ui.click('#resume-btn'); await sleep(900);
    t = await H.tabsOf(ui);
    check('Resume restores its tabs, order and active tab', t.ws === wsId && t.tabs.map((x) => x.url).join() === wsTabs.join() && t.tabs.find((x) => x.id === t.active).url.endsWith('/c'), t.tabs.map((x) => x.url).join(' '));
    await H.loaded(ui, '/c'); await sleep(400);
    al = await H.aligned(app, ui); check('Resume: active page live and aligned', al.ok, al.problems.join('; '));
    v = await H.views(app); check('Resume: only the visible tab(s) loaded', v.length === al.s.length, JSON.stringify(v.map((x) => x.url)));
    // restart keeps the pinned sites and workspace
    await sleep(400); await app.close();
    ({ app, ui } = await H.launch(profile)); await sleep(800);
    t = await H.tabsOf(ui);
    check('restart: reopens in the workspace that was open', t.ws === wsId);
    check('restart: pinned sites persisted', await ui.evaluate(() => FD.S.state.pinnedSites.some((p) => p.title === 'Fixture B') && !FD.S.state.pinnedSites.some((p) => p.title === 'Wikisource')));
  } finally { try { await app.close(); } catch (_) {} await s.close(); }
  console.log(H.failures() ? `\n${H.failures()} FAILED` : '\nall ok');
})().catch((e) => { console.error(e); process.exit(1); });
