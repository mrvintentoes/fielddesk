// Split view: on/off, divider drag, live views exactly on their slots, drawer while split, restart.
const T = require('./common');
const { check, sleep } = T;
T.run('split', async (base) => {
  const prof = T.profile('split', true);
  let { app, ui } = await T.launch(prof);
  await T.setWindow(app, 1440, 900);
  // compare each visible live view with the slot the UI drew for it
  async function aligned(label, expectCount) {
    await sleep(350);
    const vs = (await T.views(app)).filter((v) => v.visible), ss = await T.slots(ui);
    let ok = vs.length === ss.length && (expectCount == null || vs.length === expectCount);
    for (const s of ss) { const v = vs.find((x) => x.id === s.id); if (!v || Math.abs(v.bounds.x - s.x) > 1 || Math.abs(v.bounds.y - s.y) > 1 || Math.abs(v.bounds.width - s.width) > 1 || Math.abs(v.bounds.height - s.height) > 1) ok = false; }
    const frozen = await ui.evaluate(() => ({ cls: document.querySelectorAll('.webslot.frozen').length, bg: [...document.querySelectorAll('.webslot')].filter((s) => s.style.backgroundImage).length, S: FD.S.frozen, drag: document.body.classList.contains('dragging') }));
    check(label + ': live views sit exactly on their slots', ok, JSON.stringify({ views: vs.map((v) => v.bounds), slots: ss.map(({ id, ...r }) => r) }));
    check(label + ': not left frozen', frozen.cls === 0 && frozen.bg === 0 && frozen.S === 0 && !frozen.drag, JSON.stringify(frozen));
    return { vs, ss };
  }
  await ui.evaluate((u) => { FD.openWorkspace('loose'); const t = FD.current(); FD.navigate(t, u + '/A', { typed: true }); FD.newTab(u + '/B', { typed: true }); FD.newTab(u + '/C', { typed: true }); FD.selectTab(t.id); }, base);
  await sleep(1500);
  await aligned('single', 1);
  await ui.click('#split-btn'); await sleep(900);
  let w = await T.ws(ui);
  check('split button turns split on', w.split.on && await ui.$eval('#split-btn', (e) => e.classList.contains('on')));
  let a = await aligned('split on', 2);
  check('two different live pages side by side', a.vs.length === 2 && a.vs[0].url !== a.vs[1].url && a.vs.every((v) => v.bounds.width > 300), JSON.stringify(a.vs.map((v) => v.url)));
  T.rootShot('30-split');
  const noOverlap = (vs) => { const [l, r] = vs.slice().sort((p, q) => p.bounds.x - q.bounds.x); return l.bounds.x + l.bounds.width <= r.bounds.x; };
  check('panes do not overlap', noOverlap(a.vs));

  // ---- divider drag with real mouse events
  const div = async () => ui.$eval('#divider', (e) => { const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
  let d = await div();
  await ui.mouse.move(d.x, d.y); await ui.mouse.down(); await sleep(120);
  const during = await ui.evaluate(() => ({ drag: document.body.classList.contains('dragging') }));
  for (let x = d.x; x >= 420; x -= 40) { await ui.mouse.move(x, d.y); await sleep(15); }
  await ui.mouse.move(420, d.y); await sleep(250);
  T.rootShot('31-split-dragging');
  const mid = await ui.evaluate(() => ({ leftW: document.getElementById('pane-left').getBoundingClientRect().width, vis: null }));
  const midViews = (await T.views(app)).filter((v) => v.visible).length;
  await ui.mouse.up();
  w = await T.ws(ui);
  check('drag moves the divider (ratio shrinks)', during.drag && w.split.ratio < 0.4 && Math.abs(mid.leftW - 418) < 12, 'ratio ' + w.split.ratio + ' leftW ' + mid.leftW + ' liveViewsDuringDrag ' + midViews);
  a = await aligned('after drag left', 2);
  // fast drag: down, one move, up with no pauses
  d = await div();
  await ui.mouse.move(d.x, d.y); await ui.mouse.down(); await ui.mouse.move(900, d.y); await ui.mouse.up();
  a = await aligned('after fast drag right', 2);
  w = await T.ws(ui);
  check('fast drag took effect', w.split.ratio > 0.55, 'ratio ' + w.split.ratio);
  // a plain click on the divider (no move) must not break anything
  d = await div(); await ui.mouse.click(d.x, d.y); await aligned('after click on divider', 2);
  // clamp
  d = await div(); await ui.mouse.move(d.x, d.y); await ui.mouse.down(); await ui.mouse.move(5, d.y, { steps: 5 }); await ui.mouse.up();
  w = await T.ws(ui); check('drag clamps at the left limit', Math.abs(w.split.ratio - 0.2) < 0.001, String(w.split.ratio));
  a = await aligned('clamped left', 2);
  d = await div(); await ui.mouse.move(d.x, d.y); await ui.mouse.down(); await ui.mouse.move(1435, d.y, { steps: 5 }); await ui.mouse.up();
  w = await T.ws(ui); check('drag clamps at the right limit', Math.abs(w.split.ratio - 0.8) < 0.001, String(w.split.ratio));
  a = await aligned('clamped right', 2);
  T.rootShot('32-split-clamped-right');
  d = await div(); await ui.mouse.dblclick(d.x, d.y);
  w = await T.ws(ui); check('double-click centres the divider', w.split.ratio === 0.5, String(w.split.ratio));
  a = await aligned('centred', 2);
  // drag released outside the window bounds / over the rail
  d = await div(); await ui.mouse.move(d.x, d.y); await ui.mouse.down(); await ui.mouse.move(700, 20, { steps: 3 }); await ui.mouse.up();
  a = await aligned('drag released over the toolbar', 2);
  await ui.mouse.dblclick((await div()).x, (await div()).y); await sleep(200);

  // ---- drawer while split
  await ui.click('#rail .rail-btn[data-panel=notes]');
  a = await aligned('drawer open while split', 2);
  const dr = await ui.$eval('#drawer', (e) => e.getBoundingClientRect().left);
  check('views stay left of the drawer', a.vs.every((v) => v.bounds.x + v.bounds.width <= Math.round(dr) + 1), 'drawer x ' + dr);
  T.rootShot('33-split-with-drawer');
  await ui.evaluate(() => { FD.pin('alexander'); FD.pin('caesar'); FD.openPanel('compare'); });
  a = await aligned('compare drawer while split', 2);
  T.rootShot('34-split-with-compare');
  console.log('  pane widths with compare drawer @1440:', a.vs.map((v) => v.bounds.width).join(', '));
  await T.setWindow(app, 1100, 700);
  a = await aligned('compare drawer while split @1100x700', 2);
  T.rootShot('34-split-with-compare-1100');
  console.log('  pane widths with compare drawer @1100:', a.vs.map((v) => v.bounds.width).join(', '));
  check('split + compare @1100: each page keeps a usable width (>=240px)', a.vs.every((v) => v.bounds.width >= 240), a.vs.map((v) => v.bounds.width).join(','));
  await ui.click('#rail-btn');
  a = await aligned('rail collapsed while split @1100', 2);
  const iw = await ui.evaluate(() => innerWidth);
  check('collapsed rail: pages use the full width', Math.max(...a.vs.map((v) => v.bounds.x + v.bounds.width)) >= iw - 2, 'innerWidth ' + iw);
  await ui.click('#rail-btn');
  await T.setWindow(app, 1440, 900);
  a = await aligned('after resize back', 2);
  await ui.evaluate(() => FD.openPanel('compare')); await sleep(200);

  // ---- which pane a tab click goes to, pane close buttons
  await ui.click('#pane-right .pane-head'); await sleep(200);
  await ui.click('#tabs .tab:nth-child(3)'); await sleep(700);
  w = await T.ws(ui);
  check('tab click with right pane focused loads it on the right', w.split.right === w.tabs[2].id, JSON.stringify(w.split));
  a = await aligned('after choosing right tab', 2);
  // drag to 0.35 for the restart test
  d = await div(); await ui.mouse.move(d.x, d.y); await ui.mouse.down(); await ui.mouse.move(500, d.y, { steps: 6 }); await sleep(200); await ui.mouse.up(); await sleep(500);
  const saved = await T.ws(ui);
  await app.close();

  // ---- restart
  ({ app, ui } = await T.launch(prof)); await sleep(1500);
  w = await T.ws(ui);
  check('restart: split still on, same ratio, same tabs on each side', w.split.on && Math.abs(w.split.ratio - saved.split.ratio) < 1e-6 && w.split.right === saved.split.right && w.active === saved.active, JSON.stringify(w.split) + ' vs ' + JSON.stringify(saved.split));
  a = await aligned('restart split', 2);
  check('restart: both pages loaded again', a.vs.length === 2 && a.vs.every((v) => v.url.startsWith(base)), JSON.stringify(a.vs.map((v) => v.url)));
  // ---- off
  await ui.click('#pane-right .pane-x'); await sleep(500);
  w = await T.ws(ui);
  check('pane × on the right closes split and keeps the left page', !w.split.on && w.active === saved.active, JSON.stringify({ on: w.split.on, active: w.active, was: saved.active }));
  a = await aligned('split off', 1);
  check('tabs all kept when split closes', w.tabs.length === 3);
  await app.evaluate(({ Menu }) => { let hit; const walk = (m) => m.items.forEach((i) => { if (i.label === 'Toggle Split View') hit = i; if (i.submenu) walk(i.submenu); }); walk(Menu.getApplicationMenu()); hit.click(); });
  await sleep(600);
  check('menu/shortcut toggles split back on', (await T.ws(ui)).split.on);
  a = await aligned('split via shortcut', 2);
  await ui.click('#pane-left .pane-x'); await sleep(500);
  w = await T.ws(ui);
  check('pane × on the left keeps the right page', !w.split.on && (await T.views(app)).filter((v) => v.visible).length === 1);
  // split with a single tab
  await ui.evaluate(() => { const w = FD.ws(); w.tabs.slice(1).forEach((t) => FD.closeTab(t.id)); }); await sleep(300);
  await ui.click('#split-btn'); await sleep(500);
  w = await T.ws(ui);
  check('split with one tab opens a second (new tab) pane', w.split.on && w.tabs.length === 2, JSON.stringify(w.tabs.map((t) => t.url)));
  T.rootShot('35-split-one-tab');
  await app.close();
});
