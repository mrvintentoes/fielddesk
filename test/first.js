const { launch, sleep, shot, check } = require('./lib');
const fs = require('fs'), path = require('path');
(async () => {
  const profile = path.join(__dirname, '..', '.test-profile', 'first');
  fs.rmSync(profile, { recursive: true, force: true });
  const { app, ui } = await launch(profile);
  await sleep(800);
  await shot(ui, 'first-run');
  const info = await ui.evaluate(() => ({ ws: FD.ws().name, tabs: FD.ws().tabs.map(t => t.url), split: FD.ws().split.on, pins: FD.ws().pins }));
  console.log(info);
  await app.close();
})().catch(e => { console.error(e); process.exit(1); });
