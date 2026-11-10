// Pins, the rail, the single-commander drawer, the compare drawer, restart.
const T = require('./common');
const { check, sleep } = T;
T.run('pins', async (base) => {
  const prof = T.profile('pins', true);
  let { app, ui } = await T.launch(prof);
  await T.setWindow(app, 1440, 900);
  const pins = () => ui.evaluate(() => FD.ws().pins.slice());
  const railPins = () => ui.$$eval('#rail .pin', (els) => els.map((e) => e.dataset.commander));

  // ---- fog: one pin, small portrait + name
  check('fog starts with Turenne pinned', (await pins()).join() === 'turenne');
  const pinBox = await ui.$eval('#rail .pin', (e) => { const b = e.getBoundingClientRect(); return { w: b.width, h: b.height, name: e.querySelector('.pin-name').textContent, svg: !!e.querySelector('svg') }; });
  check('pin is small: portrait and name', pinBox.w <= 64 && pinBox.h <= 80 && pinBox.name === 'Turenne' && pinBox.svg, JSON.stringify(pinBox));
  check('drawer closed at first', await ui.$eval('#drawer', (e) => e.hidden));
  await ui.click('#rail .pin[data-commander=turenne]');
  await sleep(300);
  const d1 = await ui.evaluate(() => ({ hidden: document.getElementById('drawer').hidden, q: (document.querySelector('#drawer textarea.question') || {}).value, decisions: document.querySelectorAll('#drawer .decision').length,
    srcs: [...document.querySelectorAll('#drawer .decision .clip-src')].map((a) => a.title), text: document.getElementById('drawer').innerText }));
  check('click pin opens drawer', !d1.hidden);
  check('drawer shows working question', d1.q === (await ui.evaluate(() => FD.ws().question)), d1.q);
  check('drawer shows a few decisions with source links', d1.decisions >= 2 && d1.srcs.every((u) => /^https?:/.test(u)), d1.decisions + ' ' + d1.srcs.join(' '));
  check('drawer has saved passages section', /Saved passages/i.test(d1.text));
  console.log('--- turenne drawer text (fog, before any Ulm stage):\n' + d1.text.slice(0, 1800));
  T.rootShot('10-fog-turenne-drawer-1440');
  await T.setWindow(app, 1100, 700); T.rootShot('10-fog-turenne-drawer-1100'); await T.setWindow(app, 1440, 900);
  await ui.click('#rail .pin[data-commander=turenne]'); await sleep(200);
  check('click pin again closes drawer', await ui.$eval('#drawer', (e) => e.hidden));

  // ---- pin list: pin/unpin each, two-pin limit
  await ui.click('#rail .rail-btn[title="Pin a commander"]'); await sleep(200);
  const rows = await ui.$$eval('#drawer [data-pin]', (els) => els.map((e) => e.dataset.pin + ':' + e.textContent));
  check('all five commanders offered', ['alexander', 'hannibal', 'caesar', 'napoleon', 'turenne'].every((c) => rows.some((r) => r.startsWith(c))), rows.join(','));
  T.rootShot('11-pin-list');
  await ui.click('#drawer [data-pin=turenne]'); await sleep(150);
  check('unpin turenne', (await pins()).length === 0 && (await railPins()).length === 0);
  for (const c of ['alexander', 'hannibal', 'caesar', 'napoleon', 'turenne']) {
    await ui.click('#drawer [data-pin=' + c + ']'); await sleep(120);
    check('pin ' + c + ' -> on rail', (await railPins()).includes(c));
    await ui.click('#drawer [data-pin=' + c + ']'); await sleep(120);
    check('unpin ' + c + ' -> off rail', !(await railPins()).includes(c));
  }
  await ui.click('#drawer [data-pin=alexander]'); await ui.click('#drawer [data-pin=hannibal]'); await sleep(150);
  check('two pinned', (await pins()).join() === 'alexander,hannibal');
  const toastBefore = await ui.$eval('#toast', (e) => e.textContent);
  await ui.click('#drawer [data-pin=turenne]'); await sleep(200);
  const p3 = await pins();
  const toastAfter = await ui.$eval('#toast', (e) => e.classList.contains('show') ? e.textContent : '');
  console.log('  third pin result:', p3, 'toast:', JSON.stringify(toastAfter));
  check('two-pin limit holds', p3.length === 2);
  check('third pin: user is told what happened (refused, or which pin was replaced)', p3.join() === 'alexander,hannibal' ? true : /replac|unpinn|limit|two/i.test(toastAfter), 'pins now ' + p3.join() + ', toast "' + toastAfter + '"');

  // ---- pins follow tab switches
  await ui.evaluate(() => { FD.ws().pins = ['napoleon']; FD.pushPins(); FD.renderAll(); });
  const tabsEls = await ui.$$('#tabs .tab');
  await tabsEls[1].click(); await sleep(200);
  check('pin still on rail after tab switch', (await railPins()).join() === 'napoleon');
  await ui.click('#newtab-btn'); await sleep(300);
  check('pin still on rail on a new tab', (await railPins()).join() === 'napoleon');
  await ui.evaluate((u) => FD.navigate(FD.current(), u + '/A'), base); await sleep(1200);
  check('pin still on rail on a web page', (await railPins()).join() === 'napoleon');
  const v = (await T.views(app)).find((x) => x.url.endsWith('/A'));
  const railBox = await ui.$eval('#rail', (e) => { const b = e.getBoundingClientRect(); return { x: b.left, w: b.width }; });
  check('live view does not cover the rail', v && v.bounds.x + v.bounds.width <= Math.round(railBox.x) + 1, JSON.stringify(v && v.bounds) + ' rail ' + JSON.stringify(railBox));

  // ---- per workspace
  await ui.click('#ws-btn'); await sleep(200);
  await ui.click('.ws-row[data-ws=avc] .ws-open'); await sleep(600);
  check('avc pins are its own', (await pins()).join() === 'alexander,caesar');
  const cmp = await ui.evaluate(() => ({ panel: FD.ws().drawer.panel, open: !document.getElementById('drawer').hidden, q: (document.querySelector('#drawer textarea.question') || {}).value,
    cols: [...document.querySelectorAll('#drawer .col-head')].map((c) => { const cells = [...document.querySelectorAll('#drawer .cat[data-col=' + c.dataset.col + ']')]; return { id: c.dataset.col, cats: cells.map((x) => x.querySelector('h4').childNodes[0].textContent), decisions: cells.reduce((n, x) => n + x.querySelectorAll('.decision').length, 0), srcs: cells.flatMap((x) => [...x.querySelectorAll('.decision .clip-src')].map((a) => a.title)) }; }),
    tally: (document.querySelector('.tally') || {}).textContent, dw: document.getElementById('drawer').getBoundingClientRect().width }));
  console.log('  compare:', JSON.stringify(cmp).slice(0, 900));
  check('avc opens with compare drawer', cmp.open && cmp.panel === 'compare');
  check('avc question seeded', cmp.q === 'Where did Caesar have an operational edge?', cmp.q);
  check('two columns alexander | caesar', cmp.cols.map((c) => c.id).join() === 'alexander,caesar');
  check('each column has the four headings in order', cmp.cols.every((c) => c.cats.join('|') === 'Intelligence|Marching tempo|Logistics|Recovery after setbacks'), JSON.stringify(cmp.cols.map((c) => c.cats)));
  check('each column: source-linked decision per heading', cmp.cols.every((c) => c.decisions === 4 && c.srcs.every((u) => /^https?:/.test(u))));
  T.rootShot('12-avc-compare-1440');
  await ui.$eval('#drawer', (e) => { e.scrollTop = 500; }); await sleep(150); T.rootShot('12-avc-compare-1440-scrolled');
  await T.setWindow(app, 1100, 700); await sleep(300); T.rootShot('12-avc-compare-1100');
  const small = await ui.evaluate(() => ({ dw: document.getElementById('drawer').getBoundingClientRect().width, pane: document.getElementById('panes').getBoundingClientRect().width, overflowX: document.getElementById('drawer').scrollWidth > document.getElementById('drawer').clientWidth + 1,
    colW: [...document.querySelectorAll('#drawer .col-head')].map((c) => Math.round(c.getBoundingClientRect().width)) }));
  console.log('  1100x700 compare:', JSON.stringify(small));
  check('compare at 1100: no horizontal overflow in drawer', !small.overflowX);
  check('compare at 1100: page area keeps >= 400px', small.pane >= 400, 'page area ' + small.pane);
  await T.setWindow(app, 880, 560); await sleep(300); T.rootShot('12-avc-compare-880');
  const tiny = await ui.evaluate(() => ({ dw: document.getElementById('drawer').getBoundingClientRect().width, pane: document.getElementById('panes').getBoundingClientRect().width }));
  console.log('  880x560 (min window) compare:', JSON.stringify(tiny));
  await T.setWindow(app, 1440, 900);

  // segmented: single commander <-> compare
  await ui.click('#drawer .segmented .seg:nth-child(2)'); await sleep(200);
  check('segmented switch to Caesar file', await ui.evaluate(() => FD.ws().drawer.panel === 'commander' && FD.ws().drawer.commander === 'caesar'));
  T.rootShot('13-avc-caesar-file');
  await ui.click('#rail .pin[data-commander=alexander]'); await sleep(200);
  check('pin click while one file open -> that commander file', await ui.evaluate(() => FD.ws().drawer.panel === 'commander' && FD.ws().drawer.commander === 'alexander'));
  await ui.click('#drawer .segmented .seg:nth-child(3)'); await sleep(200);
  check('segmented back to Compare', await ui.evaluate(() => FD.ws().drawer.panel === 'compare'));
  // decision cite opens source
  const nTabs = await ui.evaluate(() => FD.ws().tabs.length);
  await ui.click('#drawer .cat[data-col=caesar] .decision .clip-src'); await sleep(500);
  const after = await ui.evaluate(() => ({ n: FD.ws().tabs.length, cur: FD.current().url }));
  check('decision source link opens the source', /^https?:/.test(after.cur), JSON.stringify(after) + ' before ' + nTabs);
  // unpin from the commander file drops compare
  await ui.click('#drawer .segmented .seg:nth-child(1)'); await sleep(150);
  await ui.click('#drawer .drawer-foot .btn.quiet'); await sleep(200);
  check('unpin from file footer', (await pins()).join() === 'caesar', (await pins()).join());
  await ui.evaluate(() => { FD.pin('alexander'); FD.ws().pins = ['alexander', 'caesar']; FD.pushPins(); FD.openPanel('compare'); if (FD.ws().drawer.panel !== 'compare' || !FD.ws().drawer.open) FD.openPanel('compare'); });
  await ui.evaluate(() => { FD.ws().view = 'Caesar was faster to recover.'; FD.ws().notes = 'avc note'; FD.touch(); });
  await sleep(500);

  // ---- restart
  await app.close();
  ({ app, ui } = await T.launch(prof));
  await sleep(600);
  check('restart: active workspace is avc', await ui.evaluate(() => FD.ws().id === 'avc'));
  check('restart: avc pins persist', (await pins()).join() === 'alexander,caesar', (await pins()).join());
  check('restart: rail shows them', (await railPins()).join() === 'alexander,caesar');
  check('restart: compare drawer still open', await ui.evaluate(() => !document.getElementById('drawer').hidden && FD.ws().drawer.panel === 'compare'));
  check('restart: current view text persists', await ui.evaluate(() => (document.querySelector('#drawer textarea.view') || {}).value === 'Caesar was faster to recover.'));
  await ui.evaluate(() => FD.openWorkspace('fog')); await sleep(400);
  check('restart: fog pin persists (napoleon, set earlier in this test)', (await pins()).join() === 'napoleon', (await pins()).join());
  await app.close();
});
