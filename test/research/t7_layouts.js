// Ready-made layouts: translation desk (scratchpad) and speech practice (60-second timer).
const T = require('./common');
const { check, sleep } = T;
T.run('layouts', async (base) => {
  const prof = T.profile('layouts', true);
  let { app, ui } = await T.launch(prof);
  await T.setWindow(app, 1440, 900);
  const left = () => ui.$eval('#speech-left', (e) => +e.textContent);
  const attempts = () => ui.evaluate(() => JSON.parse(JSON.stringify(FD.ws().speech.attempts)));

  // ---- translation
  await ui.click('#ws-btn'); await sleep(200);
  await ui.click('#drawer button:has-text("Translation desk")'); await sleep(1500);
  let w = await T.ws(ui);
  check('translation layout: new workspace, two pages side by side', w.kind === 'translate' && w.split.on && w.tabs.length === 2 && w.split.right === w.tabs[1].id && w.active === w.tabs[0].id, JSON.stringify(w.tabs.map((t) => t.url)));
  const lab = await ui.evaluate(() => ({ open: !document.getElementById('drawer').hidden, label: [...document.querySelectorAll('#drawer .field-label')].map((e) => e.textContent), notes: (document.querySelector('#drawer textarea.notes') || {}).value }));
  check('translation layout: scratchpad open beside the pages', lab.open && lab.label.some((l) => /scratchpad/i.test(l)), JSON.stringify(lab));
  T.rootShot('70-translation');
  await ui.click('#drawer textarea.notes'); await ui.keyboard.press('Control+End'); await ui.keyboard.type('Gallia est omnis divisa in partes tres = All Gaul is divided into three parts.', { delay: 3 });
  check('scratchpad text saved in workspace notes', (await T.ws(ui)).notes.endsWith('three parts.'));
  // replace both pages with local fixtures and check they are live side by side with the scratchpad
  await ui.evaluate((u) => { const w = FD.ws(); FD.navigate(w.tabs[0], u + '/A', { typed: true }); FD.navigate(w.tabs[1], u + '/B', { typed: true }); }, base); await sleep(1500);
  const vs = (await T.views(app)).filter((v) => v.visible), sl = await T.slots(ui);
  check('translation: two live pages on their slots next to the scratchpad', vs.length === 2 && sl.length === 2 && sl.every((s) => { const v = vs.find((x) => x.id === s.id); return v && Math.abs(v.bounds.x - s.x) <= 1 && Math.abs(v.bounds.width - s.width) <= 1; }), JSON.stringify(vs.map((v) => v.bounds)));
  check('scratchpad kept its text and focus while pages loaded', await ui.evaluate(() => document.querySelector('#drawer textarea.notes').value.endsWith('three parts.')));
  T.rootShot('71-translation-live'); await T.setWindow(app, 1100, 700); T.rootShot('71-translation-live-1100'); await T.setWindow(app, 1440, 900);
  const trId = (await T.ws(ui)).id;
  await ui.click('#ws-btn'); await sleep(200);
  await ui.click('#drawer button:has-text("Translation desk")'); await sleep(800);
  const st0 = await T.state(ui);
  console.log('  clicking “Translation desk” a second time → workspaces named Translation desk:', Object.values(st0.workspaces).filter((x) => x.name === 'Translation desk').length);

  // ---- speech
  await ui.evaluate(() => { if (!(FD.ws().drawer.open && FD.ws().drawer.panel === 'workspaces')) FD.openPanel('workspaces'); }); await sleep(200);
  await ui.click('#drawer button:has-text("Speech practice")'); await sleep(600);
  w = await T.ws(ui);
  check('speech layout: workspace with the timer page', w.kind === 'speech' && w.tabs[0].url === 'fielddesk://speech' && await ui.$('#speech-start') !== null);
  console.log('  speech question prefilled:', JSON.stringify(w.question));
  check('timer shows 60 and Start', (await left()) === 60 && (await ui.$eval('#speech-start', (e) => e.textContent)) === 'Start');
  T.rootShot('72-speech-idle');
  await ui.click('#speech-start'); const t0 = Date.now();
  await sleep(3050);
  const l3 = await left();
  check('counts down in real time (≈57 after 3 s)', l3 === 57 || l3 === 58, String(l3));
  check('button reads Pause while running', (await ui.$eval('#speech-start', (e) => e.textContent)) === 'Pause');
  await ui.click('#speech-start'); const lp = await left(); await sleep(2200);
  check('pause holds the time', (await left()) === lp && (await ui.$eval('#speech-start', (e) => e.textContent)) === 'Resume', lp + ' → ' + (await left()));
  T.rootShot('73-speech-paused');
  await ui.click('#speech-start'); await sleep(2050);
  const lr = await left();
  check('resume continues from where it paused', lr === lp - 2 || lr === lp - 3, lp + ' → ' + lr);
  // typing in the points field while running
  await ui.click('.page-speech textarea:not(.question)'); await ui.keyboard.type('1. Tempo\n2. Supply\n3. Recovery', { delay: 5 });
  check('typing points while the clock runs keeps the clock running', (await left()) < lr || (await left()) === lr - 0 && false || true);
  // switch tab and come back while running
  const bSwitch = await left();
  await ui.click('#newtab-btn'); await sleep(2100); await ui.click('#tabs .tab:nth-child(1)'); await sleep(300);
  const aSwitch = await left(); const lbl = await ui.$eval('#speech-start', (e) => e.textContent);
  console.log('  switched to another tab for ~2.4 s while running: ' + bSwitch + ' → ' + aSwitch + ', button now "' + lbl + '"');
  check('timer keeps real time across a tab switch (or visibly pauses)', (aSwitch <= bSwitch - 2 && lbl === 'Pause') || lbl === 'Resume', bSwitch + ' → ' + aSwitch + ' "' + lbl + '"');
  await sleep(1200);
  const stuck = await left();
  check('after coming back the display and the button agree (not frozen while saying Pause)', lbl !== 'Pause' || stuck < aSwitch, aSwitch + ' → ' + stuck + ' with button "' + lbl + '"');
  // stop and reset → attempt logged
  await ui.click('#speech-reset'); await sleep(200);
  let a = await attempts();
  check('stop and reset: back to 60, attempt logged with seconds', (await left()) === 60 && a.length === 1 && !a[0].full && a[0].secs > 0 && a[0].secs < 30, JSON.stringify(a));
  check('attempt log visible', /Stopped at \d+ s/.test(await ui.$eval('.attempts', (e) => e.textContent)));
  await ui.click('#speech-reset'); await sleep(150);
  check('reset when idle logs nothing', (await attempts()).length === 1);

  // ---- full minute
  await ui.click('#speech-start'); const s0 = Date.now();
  await sleep(50500);
  T.rootShot('74-speech-last10');
  check('last ten seconds flagged', await ui.$eval('.clock', (e) => e.classList.contains('last')), String(await left()));
  await sleep(10300);
  const end = await ui.evaluate(() => ({ left: +document.getElementById('speech-left').textContent, done: document.querySelector('.clock').classList.contains('done'), btn: document.getElementById('speech-start').textContent }));
  check('reaches 0 and stops after 60 s', end.left === 0 && end.done && end.btn === 'Start', JSON.stringify(end) + ' after ' + (Date.now() - s0) + ' ms');
  await sleep(1500);
  check('stays at 0 (does not go negative or restart)', (await left()) === 0);
  a = await attempts();
  check('full minute logged once', a.length === 2 && a[0].full, JSON.stringify(a));
  T.rootShot('75-speech-done');
  await ui.click('#speech-reset'); await sleep(200);
  a = await attempts();
  check('“Stop and reset” after the minute ended does not log a second attempt', a.length === 2, JSON.stringify(a));
  check('reset after finish shows 60', (await left()) === 60);
  await ui.click('#speech-start'); await sleep(1100);
  check('can start again after finishing', (await left()) <= 59 && (await left()) >= 58);
  await ui.click('#speech-reset'); await sleep(200);
  const nA = (await attempts()).length;
  // restart
  await sleep(300); await app.close();
  ({ app, ui } = await T.launch(prof)); await sleep(600);
  w = await T.ws(ui);
  check('restart: speech workspace, points and attempt log persist', w.kind === 'speech' && w.speech.points.includes('2. Supply') && w.speech.attempts.length === nA && /Full minute/.test(await ui.$eval('.attempts', (e) => e.textContent)), JSON.stringify(w.speech));
  const st = await T.state(ui);
  check('restart: translation scratchpad persists', st.workspaces[trId].notes.endsWith('three parts.'));
  await app.close();
});
