const T = require('./common'); const { sleep } = T;
// A clip made while the drawer's question field still has DOM focus must still show up in the drawer.
T.run('drawer-stale', async (base) => {
  const { app, ui } = await T.launch(T.profile('stale', true));
  await T.setWindow(app, 1440, 900);
  await ui.evaluate(() => FD.openWorkspace('avc')); await sleep(300);
  await ui.evaluate((u) => FD.navigate(FD.current(), u + '/A', { typed: true }), base); await sleep(1500);
  const id = (await T.views(app)).find((v) => v.url.includes('/A')).id;
  const p = await T.viewPage(app, '/A');
  const sel = async () => p.evaluate(() => { const el = document.querySelector('#p1'); const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); const b = el.getBoundingClientRect(); return { x: Math.round(b.left + 20), y: Math.round(b.top + 8) }; });
  for (const mode of ['plain', 'ui-textarea-focused', 'ui-textarea-focused+real-left-click-in-page']) {
    if (mode !== 'plain') { await ui.click('#drawer textarea.question'); await sleep(200); }
    if (mode.includes('real-left')) { await app.evaluate(({}, id) => { const wc = global.__fieldDesk.tabs.get(id).view.webContents; wc.sendInputEvent({ type: 'mouseDown', button: 'left', x: 400, y: 30, clickCount: 1 }); wc.sendInputEvent({ type: 'mouseUp', button: 'left', x: 400, y: 30, clickCount: 1 }); }, id); await sleep(300); }
    const b = await sel(); await sleep(200);
    const foc = await app.evaluate(({}, id) => global.__fieldDesk.tabs.get(id).view.webContents.isFocused(), id);
    const items = await T.rightClick(app, id, b.x, b.y);
    const fresh = await app.evaluate(() => global.__fieldDesk.lastContextMenu() !== global.__fdBefore);
    const n0 = await ui.evaluate(() => FD.S.state.commanders.caesar.clips.length);
    await T.menuClick(app, 'clip:caesar:tempo'); await sleep(500);
    const r = await ui.evaluate(() => ({ st: FD.S.state.commanders.caesar.clips.length, dom: document.querySelectorAll('#drawer .cat[data-col=caesar][data-cat=tempo] .clip').length, active: document.activeElement.tagName + '.' + document.activeElement.className, hasFocus: document.hasFocus() }));
    T.check(mode + ': new clip is rendered in the drawer', r.dom === r.st - 0 && r.st === n0 + 1 && r.dom === r.st, JSON.stringify(r));
    console.log(mode, { viewFocused: foc, freshMenu: fresh, first: items && items[0] && items[0].label, before: n0, ...r });
  }
  await app.close();
});
