// First run: Fog of War / Ulm 1805 end to end, stage gating, restart, export, play again.
const T = require('./common'); const fs = require('fs'), path = require('path');
const { check, sleep } = T;
const SPOIL = [/capitulat/i, /surrender/i, /17 October/i, /20(th)? October|on the 20th/i, /shut in/i, /court martial/i, /Elchingen.*14 October|14 October/i, /Auffenberg/i, /Wertingen.*(caught|destr|loses)/i, /Donauw\S+rth.*(cross|force)|force crossings/i, /deceiv/i, /hid the real line/i, /behind them/i, /revised his plans/i];
const hits = (text, res) => (res || SPOIL).filter((r) => r.test(text)).map((r) => { const m = text.match(r); const i = m.index; return String(r) + ' → “…' + text.slice(Math.max(0, i - 60), i + 80).replace(/\s+/g, ' ') + '…”'; });
T.run('ulm', async (base) => {
  const prof = T.profile('ulm', true);
  let { app, ui } = await T.launch(prof);
  await T.setWindow(app, 1440, 900);
  const L = '#pane-left .page-ulm', R = '#pane-right';
  const u = () => ui.evaluate(() => JSON.parse(JSON.stringify(FD.S.state.ulm)));
  const viewN = () => ui.$eval(L + ' .step.on .step-n', (e) => +e.textContent);
  const leftText = () => ui.$eval(L, (e) => e.innerText);
  const leftAll = () => ui.$eval(L, (e) => e.textContent);     // includes collapsed <details> and the SVG map
  const rightAll = () => ui.$eval(R + ' .pane-body', (e) => e.textContent);

  // ---- first run shape
  let w = await T.ws(ui);
  check('first run opens the Fog of War workspace', w.id === 'fog' && w.name === 'Fog of War');
  check('split: decision on the left, sources on the right', w.split.on && w.tabs.find((t) => t.id === w.active).url === 'fielddesk://ulm' && w.tabs.find((t) => t.id === w.split.right).url === 'fielddesk://sources/ulm');
  check('map present in decision pane', await ui.$(L + ' figure.map svg') !== null);
  const mapBox = await ui.$eval(L + ' figure.map svg', (e) => { const b = e.getBoundingClientRect(), p = e.closest('.pane-body').getBoundingClientRect(); return { w: Math.round(b.width), h: Math.round(b.height), paneW: Math.round(p.width), fits: b.right <= p.right + 1 }; });
  check('map fits its pane', mapBox.fits, JSON.stringify(mapBox));
  check('starts at stage 1', (await u()).stage === 1 && (await viewN()) === 1);
  T.rootShot('60-ulm-stage1-1440');
  await ui.$eval(L, (e) => { e.scrollTop = 520; }); await sleep(150); T.rootShot('60-ulm-stage1-1440-scrolled');
  await T.setWindow(app, 1100, 700); await ui.$eval(L, (e) => { e.scrollTop = 0; }); await sleep(200); T.rootShot('60-ulm-stage1-1100');
  await ui.$eval(L, (e) => { e.scrollTop = 560; }); await sleep(150); T.rootShot('60-ulm-stage1-1100-scrolled');
  await T.setWindow(app, 1440, 900); await ui.$eval(L, (e) => { e.scrollTop = 0; });

  // ---- labels and sources at stage 1
  const intel = await ui.$$eval(L + ' .intel-item', (els) => els.map((e) => ({ tag: (e.querySelector('.tag') || {}).textContent, refs: e.querySelectorAll('.ref').length, sourced: e.classList.contains('sourced') })));
  check('every stage-1 item is labelled Sourced or Scenario assumption', intel.length > 0 && intel.every((i) => i.tag === 'Sourced' || i.tag === 'Scenario assumption'), JSON.stringify(intel));
  check('every Sourced item carries at least one source number', intel.filter((i) => i.tag === 'Sourced').every((i) => i.refs > 0));

  // ---- gating at stage 1
  for (const n of [2, 3, 4]) { await ui.click(L + ' .step:nth-child(' + n + ')'); await sleep(100); }
  check('clicking locked steps does nothing at stage 1', (await viewN()) === 1 && (await u()).stage === 1);
  const s1 = { vis: await leftText(), all: await leftAll(), right: await rightAll(), map: await ui.$eval(L + ' figure.map', (e) => e.textContent) };
  console.log('  map labels @stage1:', s1.map.replace(/\s+/g, ' ').slice(0, 600));
  const h1 = hits(s1.vis); check('stage 1 decision pane (visible text) shows nothing from later stages', h1.length === 0, h1.join('\n      '));
  const h1b = hits(s1.all.replace(s1.vis, '')); const h1all = hits(s1.all.replace(s1.map, ''));
  check('stage 1 decision pane incl. collapsed “What this scenario assumes” shows nothing from later', h1all.length === 0, h1all.join('\n      '));
  const hr = hits(s1.right); check('stage 1 SOURCES pane as first shown reveals nothing Mack could not know', hr.length === 0, '\n      ' + hr.join('\n      '));
  const hm = hits(s1.map); check('stage 1 map shows nothing from later stages', hm.length === 0, hm.join('; '));
  // the commander pinned in this workspace by default
  await ui.evaluate(() => { FD.pin('napoleon'); const d = FD.ws().drawer; d.open = true; d.panel = 'commander'; d.commander = 'napoleon'; FD.renderDrawer(true); }); await sleep(900);
  const dtext = await ui.$eval('#drawer', (e) => e.textContent);
  const hd = hits(dtext); check('stage 1: the pinned Napoleon drawer does not give the ending away', hd.length === 0, '\n      ' + hd.join('\n      '));
  await ui.evaluate(() => { FD.toggleDrawer(); FD.unpin('napoleon'); }); await sleep(150);
  const md0 = await ui.evaluate(() => FD.buildMarkdown());
  check('stage 1: export gives nothing away', hits(md0).length === 0, hits(md0).join('; '));
  const mapsByStage = await ui.evaluate(() => [1, 2, 3, 4].map((s) => { const d = document.createElement('div'); d.innerHTML = FD.ULM.map(s, null); return [...d.querySelectorAll('text')].map((t) => t.textContent).join(' | '); }));
  mapsByStage.forEach((m, i) => console.log('  map text stage ' + (i + 1) + ': ' + m));

  // ---- advance
  await ui.click('#ulm-next'); await sleep(200);
  check('Next → stage 2', (await viewN()) === 2 && (await u()).stage === 2);
  await ui.click(L + ' .step:nth-child(3)'); await ui.click(L + ' .step:nth-child(4)'); await sleep(100);
  check('stage 2: steps 3 and 4 still locked', (await viewN()) === 2);
  const s2 = await leftText(); const h2 = hits(s2, SPOIL.slice(0, 7)); check('stage 2 shows no outcome', h2.length === 0, h2.join('; '));
  await ui.click(L + ' .step:nth-child(1)'); await sleep(100); check('can step back to stage 1', (await viewN()) === 1);
  await ui.click(L + ' .step:nth-child(2)'); await sleep(100);
  T.rootShot('61-ulm-stage2');
  // restart mid-way
  await sleep(300); await app.close(); ({ app, ui } = await T.launch(prof)); await sleep(600);
  check('restart at stage 2: stage kept, still gated', (await u()).stage === 2 && (await viewN()) === 2);
  await ui.click(L + ' .step:nth-child(4)'); check('restart: step 4 still locked', (await viewN()) === 2);
  await ui.click('#ulm-next'); await sleep(200);
  check('Next → stage 3 (decide)', (await viewN()) === 3);
  const opts = await ui.$$eval(L + ' .option strong', (els) => els.map((e) => e.textContent));
  check('four moves offered', opts.length === 4, opts.join(' | '));
  const s3 = await leftText(); const h3 = hits(s3, SPOIL.slice(0, 7)); check('stage 3 shows no outcome before commit', h3.length === 0, h3.join('; '));
  await ui.$eval(L, (e) => { e.scrollTop = e.scrollHeight; }); await sleep(150); T.rootShot('62-ulm-stage3-commit');

  // ---- commit requires a choice and the change-my-mind text
  const dis = () => ui.$eval('#ulm-commit', (e) => e.disabled);
  check('commit disabled with nothing entered', await dis());
  await ui.fill('#ulm-change', 'A report that the north bank is empty.'); check('commit disabled with text but no choice', await dis());
  await ui.fill('#ulm-change', ''); await ui.click(L + ' .option:nth-child(2) input'); await sleep(150);
  check('commit disabled with choice but no change-my-mind text', await dis());
  await ui.fill('#ulm-change', '   \n  '); check('commit disabled with only spaces', await dis());
  await ui.click('#ulm-commit', { force: true }).catch(() => {}); check('clicking the disabled button does nothing', !(await u()).committed);
  await ui.click('#ulm-why'); await ui.keyboard.type('Cut across their march before they close up.', { delay: 5 });
  await ui.click(L + ' .option:nth-child(3) input'); await sleep(100); await ui.click(L + ' .option:nth-child(2) input'); await sleep(100);
  check('changing the choice keeps what was typed', await ui.$eval('#ulm-why', (e) => e.value === 'Cut across their march before they close up.'));
  await ui.click('#ulm-change'); await ui.keyboard.type('Certain news that Ney holds the north bank in strength.', { delay: 5 });
  check('commit enabled once both are given', !(await dis()));
  check('gate still shut before commit', (await ui.$$(L + ' .step.locked')).length === 1);
  // restart with the draft typed but not committed
  await sleep(300); await app.close(); ({ app, ui } = await T.launch(prof)); await sleep(600);
  let st = await u();
  check('restart before commit: draft reasoning kept, not committed', !st.committed && st.choice === 'north' && /Ney holds/.test(st.changeMind) && /Cut across/.test(st.why), JSON.stringify(st));
  check('restart before commit: commit button enabled from saved draft', !(await dis()));
  await ui.click('#ulm-commit'); await sleep(300);

  // ---- reveal
  st = await u();
  check('commit reveals what happened', st.committed && (await viewN()) === 4 && st.runs.length === 1);
  const out = await leftText();
  check('outcome names the surrender', /capitulat|surrender/i.test(out));
  check('outcome shows my move, my reasons and what would change my mind', /cross to the north bank/i.test(out) && out.includes('Cut across their march') && out.includes('Certain news that Ney holds'), '');
  const tl = await ui.$$eval(L + ' .timeline li', (els) => els.map((e) => ({ refs: e.querySelectorAll('.ref').length, assumption: !!e.querySelector('.tag.amber') })));
  check('every timeline claim is sourced or labelled an assumption', tl.length > 0 && tl.every((x) => x.refs > 0 || x.assumption), JSON.stringify(tl));
  check('verdict on my move is labelled', await ui.$(L + ' .verdict .tag') !== null);
  T.rootShot('63-ulm-outcome-top');
  await ui.$eval(L, (e) => { e.scrollTop = 700; }); await sleep(150); T.rootShot('63-ulm-outcome-mid');
  await ui.$eval(L, (e) => { e.scrollTop = e.scrollHeight; }); await sleep(150); T.rootShot('63-ulm-outcome-bottom');
  check('reading room notice changes after commit', /You have committed/.test(await rightAll()));
  // a source number opens in the other pane
  await ui.click(L + ' .timeline .ref'); await sleep(900);
  w = await T.ws(ui);
  const rightTab = w.tabs.find((t) => t.id === w.split.right);
  check('source number opens that source in the other pane, decision stays', /^https:\/\//.test(rightTab.url) && w.tabs.find((t) => t.id === w.active).url === 'fielddesk://ulm', rightTab.url);
  await ui.click('#pane-right .pane-head'); await sleep(150); await ui.click('#back-btn'); await sleep(400);
  w = await T.ws(ui);
  check('Back in the sources pane returns to the reading room', w.tabs.find((t) => t.id === w.split.right).url === 'fielddesk://sources/ulm', w.tabs.find((t) => t.id === w.split.right).url);
  await ui.click('#pane-left .pane-head'); await sleep(150);
  // locked stage 3 after commit
  await ui.click(L + ' .step:nth-child(3)'); await sleep(150);
  check('after commit the choice cannot be changed', await ui.$$eval(L + ' .option input', (els) => els.every((e) => e.disabled)) && await ui.$eval('#ulm-change', (e) => e.disabled) && await ui.$('#ulm-commit') === null);
  await ui.click(L + ' .step:nth-child(4)'); await sleep(150);
  // reflection
  await ui.click('#ulm-reflection'); await ui.keyboard.type('The report never came; I would have marched anyway.', { delay: 5 });
  await sleep(500);
  check('reflection saved with the attempt', (await u()).runs[0].reflection === 'The report never came; I would have marched anyway.');
  // export via the page button
  const file = path.join(T.SCRATCH, 'ulm-export.md'); fs.rmSync(file, { force: true });
  await app.evaluate(({ dialog }, p) => { dialog.showSaveDialog = async () => ({ canceled: false, filePath: p }); }, file);
  await ui.click(L + ' .actions .btn:not(.quiet)'); await sleep(600);
  const md = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  console.log('----- ulm export -----\n' + md + '\n-----');
  check('export has the move, why, change-my-mind and reflection', md.includes('Cross to the north bank') && md.includes('Cut across their march') && md.includes('Certain news that Ney holds') && md.includes('The report never came'));
  check('export lists the scenario sources with links', /\[Ulm campaign\]\(https:\/\/en\.wikipedia\.org\/wiki\/Ulm_campaign\)/.test(md) && md.includes('Chandler'));
  console.log('  note: export carries outcome/verdict text: ' + /capitulat|what happened/i.test(md));

  // ---- restart after commit
  await sleep(300); await app.close(); ({ app, ui } = await T.launch(prof)); await sleep(600);
  st = await u();
  check('restart: reasoning still saved', st.committed && st.runs.length === 1 && st.runs[0].choice === 'north' && /Ney holds/.test(st.runs[0].changeMind) && /never came/.test(st.runs[0].reflection));
  check('restart: page reopens on the outcome with the reflection', (await viewN()) === 4 && await ui.$eval('#ulm-reflection', (e) => /never came/.test(e.value)));

  // ---- play again
  await ui.click('#ulm-again'); await sleep(300);
  st = await u();
  check('play again resets to stage 1 and keeps the earlier attempt', st.stage === 1 && !st.committed && st.choice === null && st.runs.length === 1 && (await viewN()) === 1);
  await ui.click(L + ' .step:nth-child(4)'); await sleep(100);
  check('play again: outcome locked again', (await viewN()) === 1);
  check('play again: reading room warning is back', /lifts the fog/.test(await rightAll()));
  await ui.click('#ulm-next'); await ui.click('#ulm-next'); await sleep(150);
  check('play again: fields empty', await ui.$eval('#ulm-why', (e) => e.value === '') && await ui.$eval('#ulm-change', (e) => e.value === '') && await dis());
  await ui.click(L + ' .option:nth-child(4) input'); await ui.fill('#ulm-change', 'Russians reported turned back.'); await ui.click('#ulm-commit'); await sleep(300);
  st = await u();
  check('second attempt saved alongside the first', st.runs.length === 2 && st.runs[1].choice === 'stand' && st.runs[0].choice === 'north');
  check('page says attempt 2', /Attempt 2/.test(await leftText()));
  const md2 = await ui.evaluate(() => FD.buildMarkdown());
  check('export lists both attempts', /### Attempt 1[\s\S]*### Attempt 2/.test(md2));
  await ui.click('#ulm-again'); await sleep(200);
  // reload the page tab mid-run
  await ui.click('#ulm-next'); await sleep(100);
  await ui.click('#reload-btn'); await sleep(300);
  check('reload keeps the stage', (await viewN()) === 2);
  await app.close();
});
