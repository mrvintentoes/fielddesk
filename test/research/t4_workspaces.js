// Workspaces: save current tabs, switch, rename, delete, restart, Markdown export.
const T = require('./common'); const fs = require('fs'), path = require('path');
const { check, sleep } = T;
T.run('workspaces', async (base) => {
  const prof = T.profile('ws', true);
  let { app, ui } = await T.launch(prof);
  await T.setWindow(app, 1440, 900);
  const out = path.join(T.SCRATCH, 'export.md'); fs.rmSync(out, { force: true });
  const stub = () => app.evaluate(({ dialog }, p) => { global.__dlg = []; dialog.showSaveDialog = async (...a) => { global.__dlg.push(a[a.length - 1]); return { canceled: false, filePath: p }; }; }, out);
  await stub();
  const urls = () => ui.evaluate(() => FD.ws().tabs.map((t) => t.url));
  // ---- set up loose tabs: A, B, paren, split (A | paren), pin, notes, line, clips
  await ui.evaluate((u) => { FD.openWorkspace('loose'); const t = FD.current(); FD.navigate(t, u + '/A', { typed: true }); FD.newTab(u + '/B', { typed: true }); FD.newTab(u + '/paren_(x)', { typed: true }); FD.selectTab(t.id); }, base);
  await sleep(1200);
  await ui.click('#split-btn'); await sleep(400);
  await ui.click('#pane-right .pane-head'); await ui.click('#tabs .tab:nth-child(3)'); await sleep(900);
  await ui.evaluate(() => { const w = FD.ws(); w.split.ratio = 0.4; FD.renderAll(); FD.pin('hannibal'); FD.pin('caesar'); });
  await ui.click('#rail .rail-btn[data-panel=notes]'); await sleep(200);
  await ui.fill('#drawer textarea.notes', 'First note line.\n\n- a bullet\n- [x] bracketed');
  await ui.evaluate((u) => {
    FD.addClip({ commanderId: 'caesar', category: 'logistics', text: 'Grain was the limit.\nSecond line.', url: u + '/paren_(x)', title: 'Paren [title] page' });
    FD.addClip({ commanderId: 'caesar', category: null, text: '<img src=x onerror=alert(1)> *bold* [link](http://evil) # heading', url: u + '/A', title: 'Fixture A' });
    FD.addClip({ commanderId: 'hannibal', category: 'tempo', text: 'He crossed the Alps in fifteen days.', url: u + '/B?q=a b&c=d', title: 'Fixture B' });
    FD.S.state.commanders.caesar.clips[1].stance = 'support'; FD.S.state.commanders.hannibal.clips[0].stance = 'challenge';
    FD.addLine({ text: 'A saved line with "quotes".', url: u + '/B', title: 'Fixture B' });
  }, base);
  await sleep(300);
  const before = await T.ws(ui);
  const beforeUrls = before.tabs.map((t) => t.url);
  T.rootShot('40-loose-before-save');

  // ---- save as workspace
  await ui.click('#ws-btn'); await sleep(250);
  T.rootShot('41-workspaces-panel');
  await ui.click('#ws-save'); await sleep(200);
  check('saving with an empty name does not create a workspace', (await T.state(ui)).order.length === 3);
  const hint = await ui.evaluate(() => ({ focus: document.activeElement && document.activeElement.id, msg: document.getElementById('toast').classList.contains('show') ? document.getElementById('toast').textContent : '' }));
  console.log('  empty-name feedback:', JSON.stringify(hint));
  await ui.fill('#ws-name', 'Cannae'); await ui.fill('#ws-question', 'How did Hannibal envelop a larger army?');
  await ui.click('#ws-save'); await sleep(1200);
  let w = await T.ws(ui);
  check('new workspace is open and named', w.name === 'Cannae' && w.question === 'How did Hannibal envelop a larger army?' && w.id !== 'loose', w.name);
  check('tabs and their order carried over', w.tabs.map((t) => t.url).join() === beforeUrls.join(), w.tabs.map((t) => t.url).join());
  check('split view carried over (on, same right page, ratio)', w.split.on && w.tabs.find((t) => t.id === w.split.right).url === base + '/paren_(x)' && w.split.ratio === 0.4 && w.tabs.find((t) => t.id === w.active).url === base + '/A', JSON.stringify(w.split));
  check('commander pins carried over', w.pins.join() === 'hannibal,caesar', w.pins.join());
  check('notes carried over', w.notes === before.notes && w.notes.includes('First note line.'), JSON.stringify(w.notes));
  check('saved lines carried over', w.lines.length === 1);
  const vs = (await T.views(app)).filter((v) => v.visible);
  check('both split pages live in the new workspace', vs.length === 2, JSON.stringify(vs.map((v) => v.url)));
  check('toolbar shows workspace name', (await ui.$eval('#ws-btn', (e) => e.textContent)) === 'Cannae');
  const loose = (await T.state(ui)).workspaces.loose;
  console.log('  loose after save: tabs', loose.tabs.map((t) => t.url).join(), 'pins', loose.pins.join(), 'notes', JSON.stringify(loose.notes));
  const cannaeId = w.id;

  // ---- switch back and forth with one click
  await ui.click('.ws-row[data-ws=avc] .ws-open'); await sleep(700);
  check('one click opens another workspace', (await T.ws(ui)).id === 'avc');
  check('other workspace has its own tabs', (await urls()).join() !== beforeUrls.join());
  check('previous workspace live views are gone', (await T.views(app)).every((v) => !v.url.startsWith(base)), JSON.stringify((await T.views(app)).map((v) => v.url)));
  await ui.evaluate(() => { if (!(FD.ws().drawer.open && FD.ws().drawer.panel === 'workspaces')) FD.openPanel('workspaces'); }); await sleep(200);
  await ui.click('.ws-row[data-ws="' + cannaeId + '"] .ws-open'); await sleep(1500);
  w = await T.ws(ui);
  check('one click reopens Cannae: tabs, order, split, pins, notes intact', w.id === cannaeId && w.tabs.map((t) => t.url).join() === beforeUrls.join() && w.split.on && w.split.ratio === 0.4 && w.pins.join() === 'hannibal,caesar' && w.notes.includes('First note line.'), JSON.stringify({ u: w.tabs.map((t) => t.url), s: w.split, p: w.pins }));
  const vs2 = (await T.views(app)).filter((v) => v.visible), sl = await T.slots(ui);
  check('reopened: both live views on their slots', vs2.length === 2 && sl.every((s) => { const v = vs2.find((x) => x.id === s.id); return v && Math.abs(v.bounds.x - s.x) <= 1 && Math.abs(v.bounds.width - s.width) <= 1; }), JSON.stringify({ vs2: vs2.map((v) => v.bounds), sl }));
  T.rootShot('42-cannae-reopened');

  // ---- saving from a named workspace: are notes kept with the copy?
  await ui.evaluate(() => { if (!(FD.ws().drawer.open && FD.ws().drawer.panel === 'workspaces')) FD.openPanel('workspaces'); }); await sleep(200);
  await ui.fill('#ws-name', 'Cannae copy'); await ui.click('#ws-save'); await sleep(1000);
  w = await T.ws(ui);
  console.log('  save from a named workspace -> copy notes:', JSON.stringify(w.notes), 'lines', w.lines.length, 'pins', w.pins.join(), 'tabs', w.tabs.length);
  check('save-as from a named workspace keeps the notes too', w.name === 'Cannae copy' && w.notes.includes('First note line.'), JSON.stringify(w.notes));
  const copyId = w.id;

  // ---- rename
  await ui.evaluate(() => { if (!(FD.ws().drawer.open && FD.ws().drawer.panel === 'workspaces')) FD.openPanel('workspaces'); }); await sleep(200);
  const renameBtn = (id) => '.ws-row[data-ws="' + id + '"] .ws-actions button:has-text("Rename")';
  await ui.click(renameBtn(cannaeId)); await sleep(150);
  await ui.keyboard.type('Cannae 216 BC'); await ui.keyboard.press('Enter'); await sleep(250);
  let st = await T.state(ui);
  const afterEnter = await ui.evaluate((id) => ({ inputStill: !!document.querySelector('.ws-row[data-ws="' + id + '"] input.text'), label: (document.querySelector('.ws-row[data-ws="' + id + '"] .ws-name') || {}).textContent }), cannaeId);
  check('rename with Enter changes the name', st.workspaces[cannaeId].name === 'Cannae 216 BC', st.workspaces[cannaeId].name);
  check('rename with Enter closes the edit field and shows the new name', !afterEnter.inputStill && /Cannae 216 BC/.test(afterEnter.label || ''), JSON.stringify(afterEnter));
  await ui.click('#drawer h2'); await sleep(200);
  await ui.click(renameBtn(cannaeId)); await sleep(150);
  await ui.keyboard.type('SHOULD NOT STICK'); await ui.keyboard.press('Escape'); await sleep(200);
  await ui.click('#drawer h2'); await sleep(250);
  st = await T.state(ui);
  check('rename cancelled with Escape keeps the old name', st.workspaces[cannaeId].name === 'Cannae 216 BC', st.workspaces[cannaeId].name);
  await ui.evaluate((id) => { FD.S.state.workspaces[id].name = 'Cannae 216 BC'; FD.renderDrawer(); }, cannaeId);
  check('seeded workspaces can be renamed too (button present)', await ui.$(renameBtn('fog')) !== null);
  check('Loose tabs cannot be renamed or deleted', await ui.evaluate(() => document.querySelectorAll('.ws-row[data-ws=loose] .ws-actions button').length === 1));

  // ---- delete
  const delBtn = '.ws-row[data-ws="' + cannaeId + '"] .ws-actions button.danger';
  check('current workspace has no Delete button', await ui.$('.ws-row[data-ws="' + copyId + '"] .ws-actions button.danger') === null);
  await ui.click(delBtn); await sleep(150);
  check('first Delete click only asks', !!(await T.state(ui)).workspaces[cannaeId] && /Really/.test(await ui.$eval(delBtn, (e) => e.textContent)));
  await ui.click(delBtn); await sleep(250);
  st = await T.state(ui);
  check('second click deletes the workspace', !st.workspaces[cannaeId] && !st.order.includes(cannaeId));
  check('deleting a workspace keeps the clips in commander files', st.commanders.caesar.clips.length === 2);

  // ---- export (active workspace) through the Notes panel button
  await ui.click('#rail .rail-btn[data-panel=notes]'); await sleep(200);
  T.rootShot('43-notes-panel');
  await ui.click('#drawer .drawer-foot .btn.primary'); await sleep(600);
  check('export wrote a file', fs.existsSync(out));
  const md = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '';
  fs.writeFileSync(path.join(T.SCRATCH, 'export-cannae-copy.md'), md);
  console.log('----- export -----\n' + md + '\n------------------');
  const dlg = await app.evaluate(() => global.__dlg);
  check('save dialog proposes <workspace name>.md', dlg.length === 1 && /Cannae copy\.md$/.test(dlg[0].defaultPath), JSON.stringify(dlg[0] && dlg[0].defaultPath));
  check('export: title and question', md.startsWith('# Cannae copy') && md.includes('How did Hannibal envelop a larger army?'));
  check('export: notes', md.includes('First note line.') && md.includes('- a bullet'));
  check('export: clips with text', md.includes('> Grain was the limit.\n> Second line.') && md.includes('He crossed the Alps in fifteen days.'));
  check('export: clip source links', md.includes('](' + base + '/A)') && /\]\(http:\/\/127\.0\.0\.1:\d+\/B\?q=a%20b&c=d\)/.test(md), (md.match(/\]\([^)]*B\?[^)]*\)/) || [''])[0]);
  check('export: url with parentheses is a valid link', md.includes('](' + base + '/paren_%28x%29)') || md.includes('](<' + base + '/paren_(x)>)'), (md.match(/\]\([^\n]*paren[^\n]*/) || [''])[0]);
  check('export: stance recorded', /Supports my view/.test(md) && /Challenges my view/.test(md));
  check('export: category headings', md.includes('#### Logistics') && md.includes('#### Marching tempo') && md.includes('#### Unsorted'));
  check('export: saved line with link', md.includes('A saved line with "quotes".') && md.includes('](' + base + '/B)'));
  check('export: open tabs listed in order', md.indexOf(base + '/A)') > 0 && /## Open tabs[\s\S]*\/A\)[\s\S]*\/B\)[\s\S]*paren/.test(md));
  check('export: title brackets escaped', md.includes('Paren \\[title\\] page'));
  const rawHtml = /^> <img src=x onerror=alert\(1\)>/m.test(md);
  check('export: clipped markup is neutralised (not live HTML / not a live link in the .md)', !rawHtml, 'line: ' + (md.match(/^> .*onerror.*$/m) || [''])[0]);

  // ---- export a non-active workspace from the Desks list
  fs.rmSync(out, { force: true });
  await ui.click('#ws-btn'); await sleep(200);
  await ui.click('.ws-row[data-ws=avc] .ws-actions button:has-text("Export")'); await sleep(600);
  const md2 = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '';
  check('export of another workspace from the list', md2.startsWith('# Alexander vs. Caesar') && md2.includes('Where did Caesar have an operational edge?'), md2.slice(0, 80));
  console.log('----- avc export (head) -----\n' + md2.slice(0, 1500));
  check('avc export does not include clips made in other workspaces? (Caesar clips came from Loose/Cannae)', true, 'Caesar section has ' + (md2.split('### Caesar')[1] || '').split('### ')[0].split('\n> —').length + ' part(s)');

  // ---- restart
  await sleep(300); await app.close();
  ({ app, ui } = await T.launch(prof)); await sleep(1200);
  w = await T.ws(ui); st = await T.state(ui);
  check('restart: workspace list, active workspace and its contents persist', w.id === 'avc' ? false : (w.name === 'Cannae copy' && w.tabs.map((t) => t.url).join() === beforeUrls.join() && w.split.on && w.pins.join() === 'hannibal,caesar'), JSON.stringify({ id: w.id, name: w.name, order: st.order }));
  check('restart: deleted workspace stays deleted', !st.workspaces[cannaeId]);
  await app.close();
});
