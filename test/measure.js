'use strict';
// Rough weight check: time to a usable window and memory by process. Linux numbers; a Mac will differ.
const fs = require('fs'); const path = require('path');
const { launch, sleep } = require('./lib');
const profile = path.join(__dirname, '..', '.test-profile', 'measure');
const mem = (app) => app.evaluate(({ app }) => app.getAppMetrics().map((m) => ({ type: m.type, mb: Math.round(m.memory.workingSetSize / 1024), cpu: Math.round(m.cpu.percentCPUUsage * 10) / 10 })));
const sum = (ms) => ms.reduce((a, m) => a + m.mb, 0) + ' MB (' + ms.map((m) => m.type + ' ' + m.mb).join(', ') + ')';
(async () => {
  fs.rmSync(profile, { recursive: true, force: true });
  let t0 = Date.now();
  let { app, ui } = await launch(profile);
  console.log('first launch to usable window: ' + (Date.now() - t0) + ' ms');
  await sleep(3000);
  let m = await mem(app);
  console.log('idle on the first-run workspace (no web pages): ' + sum(m) + ' across ' + m.length + ' processes; CPU ' + m.map((x) => x.cpu).join(' / ') + ' %');
  await ui.evaluate(() => { FD.openWorkspace('loose'); FD.navigate(FD.current(), 'https://pkg.go.dev/net/http', { typed: true }); });
  await sleep(8000);
  m = await mem(app);
  console.log('one live page: ' + sum(m) + ' across ' + m.length + ' processes');
  await ui.evaluate(() => { for (let i = 0; i < 19; i++) FD.newTab('https://pkg.go.dev/net/http?tab=' + i, { background: false }); });
  await sleep(1000);
  for (let i = 0; i < 20; i++) { await ui.evaluate((i) => FD.selectTab(FD.ws().tabs[i].id), i); await sleep(1500); }
  await sleep(3000);
  m = await mem(app);
  const live = await app.evaluate(() => global.__fieldDesk.tabs.size);
  console.log('twenty tabs, each visited once: ' + sum(m) + ' across ' + m.length + ' processes; ' + live + ' pages kept live, the rest asleep');
  await sleep(5000);
  m = await mem(app);
  console.log('CPU after 5 s idle with twenty tabs: ' + m.map((x) => x.type + ' ' + x.cpu).join(', '));
  await app.close();
  t0 = Date.now();
  ({ app, ui } = await launch(profile));
  console.log('relaunch with twenty tabs to usable window: ' + (Date.now() - t0) + ' ms; pages loaded at start: ' + await app.evaluate(() => global.__fieldDesk.tabs.size));
  await app.close();
})().catch((e) => { console.error(e); process.exit(1); });
