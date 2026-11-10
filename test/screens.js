'use strict';
// Captures a set of real-window screenshots (Linux with Xvfb and ImageMagick).
// Usage: xvfb-run -a -s "-screen 0 1440x900x24" node test/screens.js [outDir]
const fs = require('fs'); const path = require('path'); const { execSync } = require('child_process');
const { launch, sleep } = require('./lib');
const out = process.argv[2] || path.join(__dirname, 'out');
const profile = path.join(__dirname, '..', '.test-profile', 'screens');
const snap = (name) => execSync('import -window root -crop 1380x880+30+10 +repage ' + JSON.stringify(path.join(out, name + '.png')));
(async () => {
  fs.mkdirSync(out, { recursive: true }); fs.rmSync(profile, { recursive: true, force: true });
  const { app, ui } = await launch(profile);
  await sleep(1200); snap('1-first-run-ulm');
  await ui.evaluate(() => FD.openWorkspace('loose')); await sleep(600); snap('2-new-tab');
  await ui.evaluate(() => { FD.navigate(FD.current(), 'https://pkg.go.dev/net/http', { typed: true }); FD.newTab('https://github.com/electron/electron', { background: true }); FD.pin('caesar'); });
  await sleep(7000);
  await ui.evaluate(() => { FD.addClip({ commanderId: 'caesar', text: 'Package http provides HTTP client and server implementations.', url: 'https://pkg.go.dev/net/http', title: 'http package - net/http - Go Packages' }); FD.openPanel('commander', 'caesar'); });
  await sleep(1200); snap('3-real-page-caesar-pinned');
  await ui.evaluate(() => { FD.toggleDrawer(); FD.command('split'); }); await sleep(6000); snap('4-split-view-two-live-pages');
  await ui.evaluate(() => { FD.command('split'); FD.maybeRemark(FD.current().id, true); }); await sleep(900); snap('5-remark');
  await ui.evaluate(() => { FD.openWorkspace('avc'); }); await sleep(2500); snap('6-alexander-vs-caesar-compare');
  await ui.evaluate(() => { FD.openPanel('pin'); }); await sleep(1500); snap('7-pin-chooser');
  await ui.evaluate(() => { FD.openWorkspace('loose'); FD.unpin('caesar'); FD.pin('napoleon'); FD.openPanel('commander', 'napoleon'); }); await sleep(2500); snap('8-napoleon-file');
  await ui.evaluate(() => { FD.unpin('napoleon'); FD.pin('yi'); FD.openPanel('commander', 'yi'); FD.newTab(); }); await sleep(2500); snap('9-yi-new-tab');
  await app.close();
})().catch((e) => { console.error(e); process.exit(1); });
