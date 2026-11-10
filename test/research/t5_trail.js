// Rabbit Hole: branching trail per workspace.
const T = require('./common');
const { check, sleep } = T;
T.run('trail', async (base) => {
  const prof = T.profile('trail', true);
  let { app, ui } = await T.launch(prof);
  await T.setWindow(app, 1440, 900);
  const name = (u) => u.replace(base, '');
  const tree = () => ui.evaluate((base) => { const tr = FD.ws().trail; const kids = (p) => tr.nodes.filter((n) => n.parent === p); const walk = (n) => n.url.replace(base, '') + (kids(n.id).length ? '(' + kids(n.id).map(walk).join(',') + ')' : ''); return kids(null).map(walk).join(' '); }, base);
  const rows = () => ui.$$eval('#drawer .trail-row', (els) => els.map((e) => ({ title: e.querySelector('.trail-title').textContent, depth: (parseInt(e.style.paddingLeft, 10) - 8) / 16, state: e.className.replace('trail-row ', ''), tag: (e.querySelector('.tag') || {}).textContent || '' })));
  const fmt = (rs) => rs.map((r) => '  '.repeat(r.depth) + r.title.replace('Fixture ', '') + '[' + r.state + (r.tag ? ':' + r.tag : '') + ']').join(' / ');
  const typeUrl = async (u) => { await ui.click('#address'); await ui.keyboard.press('Control+A'); await ui.keyboard.type(u); await ui.keyboard.press('Enter'); await sleep(1300); };
  const follow = async (from, id) => { const p = await T.viewPage(app, from); await p.click(id); await sleep(900); };

  // a new named workspace, recording on by default?
  await ui.click('#ws-btn'); await sleep(200);
  await ui.fill('#ws-name', 'Trail test'); await ui.click('#drawer .ws-new .btn:not(.primary)'); await sleep(500);
  let w = await T.ws(ui);
  check('new empty workspace created', w.name === 'Trail test' && w.tabs.length === 1);
  console.log('  recording default in a new workspace:', w.rabbit, '| in Loose tabs:', (await T.state(ui)).workspaces.loose.rabbit, '| fog:', (await T.state(ui)).workspaces.fog.rabbit);
  await ui.click('#rail .rail-btn[data-panel=trail]'); await sleep(200);
  check('trail panel has the on/off switch', await ui.$('#drawer input[type=checkbox]') !== null);
  if (!w.rabbit) { await ui.click('#drawer input[type=checkbox]'); await sleep(150); }
  T.rootShot('50-trail-empty');

  // ---- A -> B -> C, back, back, -> D
  await typeUrl(base + '/A');
  await follow('/A', '#toB'); await follow('/B', '#toC');
  check('A→B→C recorded as a chain', (await tree()) === '/A(/B(/C))', await tree());
  await ui.click('#back-btn'); await sleep(700); await ui.click('#back-btn'); await sleep(700);
  check('back twice returns to A without new nodes', (await tree()) === '/A(/B(/C))' && await ui.evaluate((b) => FD.current().url === b + '/A', base), await tree());
  await follow('/A', '#toD');
  check('A→D makes a second branch under A', (await tree()) === '/A(/B(/C),/D)', await tree());
  let r = await rows();
  console.log('  rows:', fmt(r));
  check('panel shows the tree with indentation', r.map((x) => x.depth).join() === '0,1,2,1' && r.map((x) => x.title).join() === 'Fixture A,Fixture B,Fixture C,Fixture D', fmt(r));
  check('abandoned branch end (C) is marked abandoned', r[2].tag === 'abandoned' && r[2].state === 'left', JSON.stringify(r[2]));
  check('current page (D) is marked here', r[3].tag === 'here', JSON.stringify(r[3]));
  check('B (passed through) and A are not marked abandoned', r[0].tag === '' && r[1].tag === '', JSON.stringify(r.slice(0, 2)));
  T.rootShot('51-trail-tree');

  // ---- revisit the abandoned source by clicking it
  const nTabs = (await T.ws(ui)).tabs.length;
  await ui.click('#drawer .trail-row:nth-child(3)'); await sleep(1300);
  w = await T.ws(ui);
  check('clicking an abandoned page reopens it', await ui.evaluate((b) => FD.current().url.startsWith(b + '/C'), base), JSON.stringify(w.tabs.map((t) => name(t.url))));
  console.log('  after revisiting C: tabs', w.tabs.map((t) => name(t.url)).join(), '(was ' + nTabs + ' tab) tree', await tree());
  check('revisiting C does not duplicate it in the tree', (await tree()) === '/A(/B(/C),/D)', await tree());
  r = await rows(); console.log('  rows:', fmt(r));
  check('revisited C no longer abandoned', r.find((x) => x.title === 'Fixture C').tag !== 'abandoned', fmt(r));

  // ---- typed URL starts a new root
  await typeUrl(base + '/X');
  check('typed URL starts a new root', / \/X$/.test(await tree()), await tree());
  await follow('/X', '#toY');
  check('link from typed page is its child', /\/X\(\/Y\)$/.test(await tree()), await tree());

  // ---- link opened in a new tab is a child
  const p = await T.viewPage(app, '/Y');
  await p.click('#blank'); await sleep(1500);
  check('target=_blank link opens a new tab', (await T.ws(ui)).tabs.some((t) => t.url === base + '/E'), (await T.ws(ui)).tabs.map((t) => name(t.url)).join());
  check('new-tab page is a child of the page that opened it', /\/X\(\/Y\(\/E\)\)$/.test(await tree()), await tree());
  // context menu "Open link in new tab" on Y's link to X… use E's link to A via ctrl-click instead
  const pe = await T.viewPage(app, '/E');
  await pe.click('#toA', { modifiers: ['Control'] }); await sleep(1500);
  console.log('  ctrl+click from E → A in background tab; tree:', await tree(), '| tabs:', (await T.ws(ui)).tabs.map((t) => name(t.url)).join());
  check('ctrl+click background tab recorded as child of E', /\/E\(\/A\)/.test(await tree()), await tree());
  r = await rows(); console.log('  rows:', fmt(r));
  T.rootShot('52-trail-bigger');

  // ---- in-page (pushState) navigation
  await typeUrl(base + '/spa');
  const ps = await T.viewPage(app, '/spa'); await ps.click('#push'); await sleep(700);
  const spa = await ui.evaluate(() => FD.current().url);
  console.log('  after pushState: tab url', name(spa), 'tree', await tree());
  check('single-page-app navigation (pushState) is recorded in the trail', /\/spa\(\/spa2\)/.test(await tree()), await tree());

  // ---- toggle off stops recording
  const before = await tree();
  await ui.click('#drawer input[type=checkbox]'); await sleep(200);
  check('switch turns recording off', !(await T.ws(ui)).rabbit);
  r = await rows(); check('existing trail still shown while off', r.length > 0);
  await typeUrl(base + '/A'); await follow('/A', '#toB');
  check('nothing recorded while off', (await tree()) === before, await tree());
  await ui.click('#drawer input[type=checkbox]'); await sleep(200);
  await follow('/B', '#toC');
  const afterOn = await tree();
  console.log('  off: typed A, A→B; on again: B→C. tree:', afterOn);
  check('after switching back on, B→C is not attached to an unrelated page', !/\/spa2?\(\/C\)|\/spa\(\/spa2\(\/C\)\)/.test(afterOn), afterOn);

  // ---- per workspace
  await ui.evaluate(() => FD.openWorkspace('avc')); await sleep(400);
  check('trail is per workspace (avc has its own)', !(await tree()).includes('/X'));
  await ui.evaluate(() => { const s = FD.S.state; FD.openWorkspace(s.order.find((id) => s.workspaces[id].name === 'Trail test')); }); await sleep(1200);
  check('switching back: trail intact and no duplicate nodes from restored tabs', (await tree()) === afterOn, await tree());

  // ---- restart
  await sleep(300); await app.close();
  ({ app, ui } = await T.launch(prof)); await sleep(1500);
  check('restart: trail survives unchanged', (await tree()) === afterOn, (await tree()) + '  vs  ' + afterOn);
  await ui.evaluate(() => { if (!(FD.ws().drawer.open && FD.ws().drawer.panel === 'trail')) FD.openPanel('trail'); }); await sleep(300);
  r = await rows(); console.log('  rows after restart:', fmt(r));
  check('restart: current page still marked here', r.some((x) => x.tag === 'here'));
  T.rootShot('53-trail-after-restart');
  // export includes the trail
  const md = await ui.evaluate(() => FD.buildMarkdown());
  check('export contains the trail as a nested list', /## Trail[\s\S]*- \[Fixture A\][\s\S]*\n  - \[Fixture B\]/.test(md), (md.split('## Trail')[1] || '').slice(0, 400));
  // clear
  await ui.click('#drawer .drawer-foot .btn'); await ui.click('#drawer .drawer-foot .btn'); await sleep(200);
  check('clear trail (two clicks) empties it', (await tree()) === '');
  await app.close();
});
