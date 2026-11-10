// Collapse / restore the rail (button, Hide, shortcut), plus source re-opening details.
const T = require('./common');
const { check, sleep } = T;
T.run('rail', async (base) => {
  const prof = T.profile('rail', true);
  let { app, ui } = await T.launch(prof);
  await T.setWindow(app, 1440, 900);
  const railHidden = () => ui.$eval('#rail', (e) => e.hidden || e.getBoundingClientRect().width === 0);
  const drawerHidden = () => ui.$eval('#drawer', (e) => e.hidden);
  await ui.evaluate((u) => { FD.openWorkspace('avc'); FD.navigate(FD.current(), u + '/A', { typed: true }); }, base); await sleep(1500);
  check('avc: compare drawer open, rail visible', !(await railHidden()) && !(await drawerHidden()));
  const wide = async () => { await sleep(350); const v = (await T.views(app)).find((x) => x.visible); return v.bounds.x + v.bounds.width; };
  const w0 = await wide();
  // ---- toolbar button
  await ui.click('#rail-btn');
  check('toolbar button collapses rail and drawer together', (await railHidden()) && (await drawerHidden()));
  check('page takes the full window width', (await wide()) === await ui.evaluate(() => innerWidth), String(await wide()));
  T.rootShot('80-collapsed');
  check('toolbar button still visible to bring it back', await ui.$eval('#rail-btn', (e) => e.getBoundingClientRect().width > 0));
  await ui.click('#rail-btn');
  const back = { rail: !(await railHidden()), drawer: !(await drawerHidden()), pins: await ui.$$eval('#rail .pin', (e) => e.length) };
  check('toolbar button brings the rail and pins back', back.rail && back.pins === 2);
  check('bringing it back restores the compare drawer that was open', back.drawer, JSON.stringify(back));
  if (!back.drawer) { await ui.click('#rail .pin[data-commander=caesar]'); await sleep(200); }
  check('pin click reopens compare', await ui.evaluate(() => FD.ws().drawer.open && FD.ws().drawer.panel === 'compare'));
  // ---- Hide button on the rail
  await ui.click('#rail .rail-btn[title^="Collapse"]');
  check('rail Hide button collapses', (await railHidden()) && (await drawerHidden()));
  // ---- shortcut (menu item is what the accelerator fires)
  const acc = await T.appMenu(app, 'Collapse or Show the Desk Rail'); await sleep(200);
  check('shortcut menu item brings the rail back', !(await railHidden()), 'accelerator ' + acc);
  // real key events: Ctrl+. sent to the UI window and to the focused web page
  const key = (target) => app.evaluate(({ BrowserWindow }, target) => { const wc = target === 'ui' ? BrowserWindow.getAllWindows()[0].webContents : [...global.__fieldDesk.tabs.values()].find((t) => t.view.getVisible()).view.webContents; wc.focus(); for (const type of ['keyDown', 'keyUp']) wc.sendInputEvent({ type, keyCode: '.', modifiers: ['control'] }); }, target);
  await key('ui'); await sleep(300);
  const k1 = await railHidden();
  await key('page'); await sleep(300);
  const k2 = await railHidden();
  console.log('  synthetic Ctrl+. → UI focused: collapsed=' + k1 + ' ; page focused: collapsed=' + k2 + ' (expected true then false if accelerators see synthetic keys)');
  if (await railHidden()) await ui.click('#rail-btn');
  // ---- drawer shortcut while collapsed
  await ui.click('#rail-btn'); await T.appMenu(app, 'Open or Close the Drawer'); await sleep(200);
  check('drawer shortcut while collapsed shows rail + drawer', !(await railHidden()) && !(await drawerHidden()));
  // ---- collapsed state per workspace and across restart
  await ui.click('#rail-btn'); await sleep(400);
  await app.close(); ({ app, ui } = await T.launch(prof)); await sleep(900);
  check('restart: still collapsed', await railHidden());
  check('restart: collapsed but can come back', await ui.$('#rail-btn') !== null);
  await ui.evaluate(() => FD.openWorkspace('fog')); await sleep(300);
  check('collapse is per workspace (fog still shows rail)', !(await railHidden()));
  await ui.evaluate(() => FD.openWorkspace('avc')); await sleep(900);
  await ui.click('#rail-btn'); await sleep(200);

  // ---- clip source reopened with a text fragment
  await ui.evaluate((u) => { FD.addClip({ commanderId: 'caesar', category: 'tempo', text: 'Sentence number 380 of a very long passage about marching tempo and supply.', url: u + '/A', title: 'Fixture A' }); FD.closeTab(FD.current().id); if (!(FD.ws().drawer.open && FD.ws().drawer.panel === 'compare')) FD.openPanel('compare'); }, base); await sleep(400);
  const n0 = (await T.ws(ui)).tabs.length;
  await ui.click('#drawer .col[data-col=caesar] .cat[data-cat=tempo] .clip .clip-text'); await sleep(1800);
  const p = await T.viewPage(app, '/A');
  const info = { tabUrl: await ui.evaluate(() => FD.current().url), address: await ui.$eval('#address', (e) => e.value), scrollY: await p.evaluate(() => scrollY), n: (await T.ws(ui)).tabs.length };
  console.log('  reopened clip source:', JSON.stringify(info));
  check('clip reopens its closed source in a tab', info.n === n0 + 1 && info.tabUrl.startsWith(base + '/A'));
  check('reopened source is scrolled to the clipped passage', info.scrollY > 500, 'scrollY ' + info.scrollY);
  await ui.click('#tabs .tab:nth-child(1)'); await sleep(300);
  await ui.click('#drawer .col[data-col=caesar] .cat[data-cat=tempo] .clip .clip-text'); await sleep(700);
  check('second click focuses that tab instead of opening another', (await T.ws(ui)).tabs.length === n0 + 1 && await ui.evaluate((b) => FD.current().url.startsWith(b + '/A'), base));
  // clip whose source is open in the other split pane
  await ui.evaluate((u) => { FD.newTab(u + '/B', { typed: true }); }, base); await sleep(900);
  await ui.click('#split-btn'); await sleep(600);
  let w = await T.ws(ui);
  console.log('  split: left', w.tabs.find((t) => t.id === w.active).url.replace(base, ''), 'right', w.tabs.find((t) => t.id === w.split.right).url.replace(base, ''));
  await ui.click('#drawer .col[data-col=caesar] .cat[data-cat=tempo] .clip .clip-text'); await sleep(700);
  w = await T.ws(ui);
  const shownUrls = [w.active, w.split.right].map((id) => w.tabs.find((t) => t.id === id).url.replace(base, '').split('#')[0]);
  check('in split view, clicking a clip shows its source in one of the panes', shownUrls.includes('/A'), shownUrls.join(' | '));
  check('…and both panes still show different tabs', w.active !== w.split.right);
  // unpin keeps the file
  await ui.evaluate(() => FD.unpin('caesar')); await sleep(200);
  check('unpinning keeps the commander’s clips on file', (await T.state(ui)).commanders.caesar.clips.length === 1);
  await app.close();
});
