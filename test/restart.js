'use strict';
/*
 * The acceptance check from the brief:
 *   open two real pages, pin Caesar, clip a passage to his file, restart the app,
 *   and verify the pin, the clip and the tabs come back.
 *
 * Run:  xvfb-run -a -s "-screen 0 1440x900x24" node test/restart.js   (Linux, headless)
 *       node test/restart.js                                           (macOS, Windows, Linux desktop)
 * PAGE_A / PAGE_B override the two pages.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { launch, sleep, shot, check, OUT, failures } = require('./lib');

const PAGE_A = process.env.PAGE_A || 'https://github.com/electron/electron';
const PAGE_B = process.env.PAGE_B || 'https://pkg.go.dev/net/http';
const profile = path.join(__dirname, '..', '.test-profile', 'restart');

function rootShot(name) {
  if (process.platform !== 'linux' || !process.env.DISPLAY) return;
  try { execSync('import -window root ' + JSON.stringify(path.join(OUT, name + '.png')), { stdio: 'ignore' }); } catch (_) {}
}
const views = (app) => app.evaluate(() => [...global.__fieldDesk.tabs.entries()].map(([id, t]) => ({
  id, url: t.view.webContents.getURL(), title: t.view.webContents.getTitle(), loading: t.view.webContents.isLoading(), visible: t.view.getVisible(), bounds: t.view.getBounds()
})));
async function waitLoaded(app, ui, id, ms) {
  const end = Date.now() + (ms || 45000);
  while (Date.now() < end) {
    const v = (await views(app)).find((x) => x.id === id);
    if (v && !v.loading && /^https?:/.test(v.url)) {
      const err = await ui.evaluate((tid) => (FD.rt(tid).error || null), id);
      if (err) { console.log('  load error', JSON.stringify(err)); return null; }
      return v;
    }
    await sleep(300);
  }
  return null;
}

(async () => {
  fs.rmSync(profile, { recursive: true, force: true });

  console.log('First session');
  let { app, ui } = await launch(profile);
  await ui.evaluate(() => FD.openWorkspace('loose'));
  // Two real pages, opened the way a person does: type in the address bar, press Enter.
  await ui.click('#address'); await ui.fill('#address', PAGE_A); await ui.keyboard.press('Enter');
  const idA = await ui.evaluate(() => FD.current().id);
  const a = await waitLoaded(app, ui, idA);
  check('first real page loaded: ' + PAGE_A, !!a, a && a.title);
  await ui.click('#newtab-btn');
  await ui.fill('#address', PAGE_B); await ui.keyboard.press('Enter');
  const idB = await ui.evaluate(() => FD.current().id);
  const b = await waitLoaded(app, ui, idB);
  check('second real page loaded: ' + PAGE_B, !!b, b && b.title);

  // Pin Caesar from the rail.
  await ui.click('#rail .rail-btn[title="Pin a commander"]');
  await ui.click('#drawer button[data-pin="caesar"]');
  check('Caesar is pinned on the rail', await ui.locator('#rail .pin[data-commander="caesar"]').count() === 1);
  await ui.click('#drawer .x.big');

  // Select a real passage on the second page and right-click it.
  await sleep(500);
  const page = app.windows().find((w) => w.url() === b.url);
  const passage = await page.evaluate(() => {
    const p = [...document.querySelectorAll('p')].find((x) => x.innerText.trim().length > 60 && x.getBoundingClientRect().width > 100);
    p.scrollIntoView({ block: 'center' });
    const r = document.createRange(); r.selectNodeContents(p);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    const box = p.getBoundingClientRect();
    return { text: String(s).trim(), x: Math.round(box.left + 20), y: Math.round(box.top + 8) };
  });
  await sleep(300);
  await app.evaluate((_e, { id, x, y }) => {
    const wc = global.__fieldDesk.tabs.get(id).view.webContents;
    wc.sendInputEvent({ type: 'mouseDown', button: 'right', x, y, clickCount: 1 });
    wc.sendInputEvent({ type: 'mouseUp', button: 'right', x, y, clickCount: 1 });
  }, { id: idB, x: passage.x, y: passage.y });
  await sleep(800);
  rootShot('restart-1-context-menu');
  // A native menu cannot be clicked by automation, so choose its item directly.
  const labels = await app.evaluate(() => {
    const m = global.__fieldDesk.lastContextMenu();
    if (!m) return null;
    const out = m.items.map((i) => i.label);
    const item = m.getMenuItemById('clip:caesar');
    if (item) item.click();
    m.closePopup();
    return out;
  });
  check('right-click on the selection offers “Clip to Caesar’s file”', !!labels && labels.includes("Clip to Caesar's file"), labels && labels.slice(0, 4).join(' | '));
  await sleep(500);
  const clip1 = await ui.evaluate(() => FD.S.state.commanders.caesar.clips[0] || null);
  check('the passage is in Caesar’s file with its source', !!clip1 && clip1.text === passage.text && clip1.url === b.url, clip1 && JSON.stringify(clip1.text.slice(0, 60)));
  await ui.click('#rail .pin[data-commander="caesar"]');
  await sleep(400);
  await shot(ui, 'restart-2-caesar-file');
  rootShot('restart-2-window');
  await ui.click('#rail .pin[data-commander="caesar"]');
  const before = await ui.evaluate(() => ({ ws: FD.S.state.activeWs, tabs: FD.ws().tabs.map((t) => t.url), active: FD.current().url, pins: FD.ws().pins }));
  await sleep(400);
  await app.close();

  console.log('Second session, after restart');
  ({ app, ui } = await launch(profile));
  await sleep(500);
  const after = await ui.evaluate(() => ({ ws: FD.S.state.activeWs, tabs: FD.ws().tabs.map((t) => t.url), titles: FD.ws().tabs.map((t) => t.title), active: FD.current().url, pins: FD.ws().pins }));
  check('same workspace is open', after.ws === before.ws, after.ws);
  check('both tabs are back in the same order', JSON.stringify(after.tabs) === JSON.stringify(before.tabs), after.tabs.join(' , '));
  check('the same tab is active', after.active === before.active, after.active);
  check('Caesar is still pinned', after.pins.includes('caesar') && await ui.locator('#rail .pin[data-commander="caesar"]').count() === 1);
  const clip2 = await ui.evaluate(() => FD.S.state.commanders.caesar.clips[0] || null);
  check('the clip is still in Caesar’s file', !!clip2 && clip2.text === passage.text && clip2.url === clip1.url);
  const idActive = await ui.evaluate(() => FD.current().id);
  const live = await waitLoaded(app, ui, idActive);
  check('the active tab reloaded its real page', !!live && live.visible, live && live.title);
  // The other tab should load when it is selected.
  await ui.click('#tabs .tab:first-child');
  const idFirst = await ui.evaluate(() => FD.current().id);
  const live2 = await waitLoaded(app, ui, idFirst);
  check('the other tab loads when selected', !!live2 && live2.visible, live2 && live2.title);
  // Open the drawer and click the clip: it should take us back to its source tab.
  await ui.click('#rail .pin[data-commander="caesar"]');
  await sleep(300);
  const shown = await ui.locator('#drawer .clip .clip-text').first().innerText();
  check('the drawer shows the saved passage', shown.trim() === passage.text.trim());
  await ui.click('#drawer .clip .clip-text');
  await sleep(500);
  check('clicking the clip opens its source', (await ui.evaluate(() => FD.current().url)) === clip1.url);
  await shot(ui, 'restart-3-after-restart');
  rootShot('restart-3-window');
  await app.close();

  console.log(failures() ? '\n' + failures() + ' check(s) FAILED' : '\nAll checks passed');
  process.exit(failures() ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
