'use strict';
// Checks the portrait download against a stand-in for Wikipedia and Commons on this machine.
// It proves the rules (which licences are accepted, what is refused, what is shown and credited);
// it does not prove that the real articles and files resolve. That needs the open internet.
// Usage: xvfb-run -a -s "-screen 0 1440x900x24" node test/portraits.js
const fs = require('fs'); const path = require('path'); const http = require('http');
const { launch, sleep, check, failures } = require('./lib');
const done = () => { console.log(failures() ? failures() + ' FAILED' : 'All checks passed'); process.exit(failures() ? 1 : 0); };
const profile = path.join(__dirname, '..', '.test-profile', 'portraits');
const img = fs.readFileSync(path.join(__dirname, 'fixtures', 'own-drawing.jpg')); // Field Desk's own drawing, used as the stand-in picture
const LICENCE = { Julius_Caesar: 'CC BY-SA 4.0', Frederick_the_Great: 'CC BY-SA 3.0', 'Ulysses_S._Grant': 'CC BY-NC 2.0', Gustavus_Adolphus: 'CC0' };
(async () => {
  fs.rmSync(profile, { recursive: true, force: true });
  let base = '';
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, base);
    const json = (o) => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(o)); };
    if (u.pathname.startsWith('/api/rest_v1/page/summary/')) {
      const art = decodeURIComponent(u.pathname.split('/').pop());
      if (art === 'Subutai') return json({ title: art });
      return json({ title: art, originalimage: { source: base + (art === 'Yi_Sun-sin' ? '/wikipedia/en/a/ab/' : '/wikipedia/commons/a/ab/') + encodeURIComponent(art) + '.jpg' } });
    }
    if (u.pathname === '/w/api.php') {
      const name = u.searchParams.get('titles').replace(/^File:/, ''); const art = name.replace(/\.jpg$/, '');
      return json({ query: { pages: { 1: { imageinfo: [{ thumburl: base + '/thumb/' + encodeURIComponent(name), descriptionurl: base + '/wiki/File:' + encodeURIComponent(name), mime: 'image/jpeg',
        extmetadata: { LicenseShortName: { value: LICENCE[art] || 'Public domain' }, Artist: { value: '<a href="x">A. Painter</a>' }, ObjectName: { value: 'Portrait of ' + art }, DateTimeOriginal: { value: '1812' } } }] } } } });
    }
    if (u.pathname.startsWith('/thumb/')) { res.setHeader('content-type', 'image/jpeg'); return res.end(img); }
    res.statusCode = 404; res.end();
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = 'http://127.0.0.1:' + server.address().port;
  process.env.FD_TEST_ENV = JSON.stringify({ FIELDDESK_NO_FETCH: '0', FIELDDESK_PORTRAIT_WIKI: base, FIELDDESK_PORTRAIT_COMMONS: base });
  let { app, ui } = await launch(profile);
  let st = null;
  for (let i = 0; i < 40; i++) { await sleep(500); st = await app.evaluate(() => global.__fieldDesk.portraits().status()); if (st.checkedAt) break; }
  check('public-domain pictures are kept', ['napoleon', 'wellington', 'alexander', 'nelson'].every((id) => st.have.includes(id)), st.have.join(','));
  check('CC0 is kept', st.have.includes('gustavus'));
  check('CC BY-SA is kept only for an ancient bust (Caesar yes, Frederick no)', st.have.includes('caesar') && !st.have.includes('frederick'), st.refused.frederick);
  check('a non-commercial licence is refused', !st.have.includes('grant') && /licence/.test(st.refused.grant || ''), st.refused.grant);
  check('a picture hosted as non-free on Wikipedia is refused', !st.have.includes('yi'), st.refused.yi);
  check('an article with no picture is skipped', !st.have.includes('subutai'), st.refused.subutai);
  check('no picture is ever fetched for Khalid', !st.have.includes('khalid') && !st.refused.khalid);
  await ui.evaluate(() => { FD.openWorkspace('loose'); FD.pin('napoleon'); FD.openPanel('commander', 'napoleon'); }); await sleep(1500);
  let d = await ui.evaluate(() => ({ img: !!document.querySelector('#drawer .file-figure.has-painting img'), credit: (document.querySelector('#drawer .file-credit') || {}).textContent || '', hidden: (document.querySelector('#drawer .file-credit') || {}).hidden }));
  check('the painting is shown in the commander’s file', d.img);
  check('the credit names title, artist, date and licence, with our note', !d.hidden && /Portrait of/.test(d.credit) && /A\. Painter/.test(d.credit) && /1812/.test(d.credit) && /Public domain/.test(d.credit) && /Jacques-Louis David/.test(d.credit), d.credit);
  await ui.evaluate(() => { FD.pin('grant'); FD.openPanel('commander', 'grant'); }); await sleep(1500);
  d = await ui.evaluate(() => ({ img: !!document.querySelector('#drawer .file-figure.has-painting'), fig: !!document.querySelector('#drawer .file-figure.has-figure svg') }));
  check('a commander without a picture keeps the drawn figure', !d.img && d.fig);
  await app.close();
  let hits = 0; server.on('request', () => hits++);
  ({ app, ui } = await launch(profile)); await sleep(6500);
  check('nothing is downloaded again on the next launch', hits === 0, hits + ' requests');
  await ui.evaluate(() => { const d = FD.ws().drawer; d.open = true; d.panel = 'commander'; d.commander = 'napoleon'; FD.renderDrawer(true); }); await sleep(1200);
  check('the painting is still there after a restart, from the local copy', await ui.evaluate(() => !!document.querySelector('#drawer .file-figure.has-painting img')));
  await ui.evaluate(() => { FD.S.state.settings.portraits = false; FD.renderDrawer(true); }); await sleep(600);
  check('turning paintings off brings the drawn figure back', await ui.evaluate(() => !document.querySelector('#drawer .has-painting') && !!document.querySelector('#drawer .file-figure svg')));
  await app.close(); server.close();
  done();
})().catch((e) => { console.error(e); process.exit(1); });
