const H = require('./helpers');
(async () => {
  const s = await H.startServer();
  const { app, ui } = await H.launch(H.freshProfile('smoke'));
  try {
    await H.loose(ui);
    await H.typeGo(ui, s.base + '/a');
    console.log('loaded', await H.loaded(ui, '/a'));
    await H.sleep(500);
    console.log(JSON.stringify(await H.tabsOf(ui), null, 1));
    const al = await H.aligned(app, ui); console.log(JSON.stringify(al));
    console.log(app.windows().map((w) => w.url()));
    console.log(JSON.stringify(await H.menuTable(app), null, 0));
    console.log(H.rootShot('smoke'));
    await H.shot(ui, 'browsing-smoke');
  } finally { await app.close(); await s.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
