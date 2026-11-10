// Right-click clipping, stance, category, delete, open source, typing under title updates.
const T = require('./common');
const { check, sleep } = T;
T.run('clip', async (base) => {
  const prof = T.profile('clip', true);
  let { app, ui } = await T.launch(prof);
  await T.setWindow(app, 1440, 900);
  const clips = (c) => ui.evaluate((c) => JSON.parse(JSON.stringify(FD.S.state.commanders[c].clips)), c);
  const tabIdFor = async (part) => (await T.views(app)).find((v) => v.url.includes(part)).id;
  // select an element's text in the view and right-click in the middle of it
  async function selectAndMenu(part, sel) {
    const p = await T.viewPage(app, part);
    const box = await p.evaluate((sel) => { const el = document.querySelector(sel); el.scrollIntoView({ block: 'center' }); const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); const b = el.getBoundingClientRect(); return { x: Math.round(b.left + 20), y: Math.round(b.top + 8), text: String(s) }; }, sel);
    await sleep(150);
    const items = await T.rightClick(app, await tabIdFor(part), box.x, box.y);
    return { items, text: box.text };
  }
  await ui.evaluate(() => FD.openWorkspace('avc')); await sleep(300);
  await ui.evaluate((u) => FD.navigate(FD.current(), u + '/A', { typed: true }), base); await sleep(1500);

  // ---- direct clip to pinned commander
  let m = await selectAndMenu('/A', '#p1');
  const ids = m.items.map((i) => i.id).filter(Boolean);
  console.log('  menu:', m.items.filter((i) => i.type !== 'separator').map((i) => i.label).join(' | '));
  check('menu offers direct clip to both pinned commanders', ids.includes('clip:alexander') && ids.includes('clip:caesar'));
  check('direct clip items are top-level (not in a submenu)', m.items.some((i) => i.id === 'clip:caesar' && !i.label.includes(' > ')));
  check('menu offers each category for a pinned commander', ['intelligence', 'tempo', 'logistics', 'recovery'].every((c) => ids.includes('clip:caesar:' + c)));
  await T.menuClick(app, 'clip:caesar'); await sleep(400);
  let cc = await clips('caesar');
  check('clip saved to Caesar with text, url, title', cc.length === 1 && cc[0].text === m.text.trim() && cc[0].url === base + '/A' && cc[0].title === 'Fixture A', JSON.stringify(cc[0]));
  check('toast confirms clip', /Clipped to Caesar/.test(await ui.$eval('#toast', (e) => e.textContent)));
  check('clip appears in Caesar column under Unsorted', await ui.evaluate(() => !!document.querySelector('#drawer .col[data-col=caesar] .cat[data-cat=unsorted] .clip')));
  check('pin count badge shows 1', (await ui.$eval('#rail .pin[data-commander=caesar] .pin-count', (e) => e.textContent).catch(() => '')) === '1');

  // ---- clip under a category; quotes
  m = await selectAndMenu('/A', '#p2');
  await T.menuClick(app, 'clip:caesar:logistics'); await sleep(400);
  cc = await clips('caesar');
  check('clip under logistics, quotes and & kept', cc[0].category === 'logistics' && cc[0].text === 'He said "veni, vidi, vici" & meant it; the legions\' supply wagons followed.', JSON.stringify(cc[0].text));
  check('shown under Logistics in Caesar column', await ui.evaluate(() => document.querySelectorAll('#drawer .col[data-col=caesar] .cat[data-cat=logistics] .clip').length === 1));

  // ---- markup-like text
  m = await selectAndMenu('/A', '#p3');
  await T.menuClick(app, 'clip:alexander:intelligence'); await sleep(400);
  let ca = await clips('alexander');
  const inj = await ui.evaluate(() => ({ img: document.querySelectorAll('#drawer .clip img, #drawer .clip script').length, pwn: window.__pwn, txt: document.querySelector('#drawer .col[data-col=alexander] .cat[data-cat=intelligence] .clip-text').textContent }));
  check('markup-like text stays text (no injected elements)', inj.img === 0 && inj.pwn === undefined && inj.txt.includes('<img src=x onerror=alert(1)>'), JSON.stringify(inj));
  check('markup text stored verbatim', ca[0].text === m.text.trim(), JSON.stringify(ca[0].text));

  // ---- newlines
  m = await selectAndMenu('/A', '#p4');
  await T.menuClick(app, 'clip:alexander'); await sleep(400);
  ca = await clips('alexander');
  console.log('  newline selection:', JSON.stringify(m.text), '-> stored', JSON.stringify(ca[0].text));
  check('newlines preserved in clip', ca[0].text.split('\n').length >= 3 && /Line one of a block\nLine two of a block/.test(ca[0].text), JSON.stringify(ca[0].text));

  // ---- very long selection
  m = await selectAndMenu('/A', '#long');
  await T.menuClick(app, 'clip:alexander:tempo'); await sleep(500);
  ca = await clips('alexander');
  const toast = await ui.$eval('#toast', (e) => e.textContent);
  console.log('  long selection', m.text.length, 'chars -> stored', ca[0].text.length, '; toast:', toast);
  check('very long selection is stored (maybe truncated)', ca[0].text.length >= 6000 && m.text.startsWith(ca[0].text.slice(0, 5000)));
  check('truncation of a long clip is signalled to the user', ca[0].text.length === m.text.trim().length || /…$|\.\.\.$/.test(ca[0].text) || /trunc|shorten|first/i.test(toast), 'selected ' + m.text.length + ', kept ' + ca[0].text.length + ', toast "' + toast + '"');
  const longBox = await ui.$eval('#drawer .col[data-col=alexander] .cat[data-cat=tempo] .clip-text', (e) => ({ h: e.getBoundingClientRect().height, sh: e.scrollHeight }));
  console.log('  long clip card height', JSON.stringify(longBox));
  T.rootShot('20-compare-with-clips');
  await ui.$eval('#drawer', (e) => { e.scrollTop = 420; }); await sleep(150); T.rootShot('20-compare-with-clips-scrolled');
  await T.setWindow(app, 1100, 700); T.rootShot('20-compare-with-clips-1100'); await T.setWindow(app, 1440, 900);

  // ---- stance + tally
  const tally = () => ui.$eval('.tally', (e) => e.textContent);
  check('tally starts 0/0', (await tally()) === '0 supporting · 0 challenging', await tally());
  const firstClip = '#drawer .col[data-col=caesar] .cat[data-cat=logistics] .clip';
  await ui.click(firstClip + ' .stance.support'); await sleep(150);
  check('mark supporting -> tally 1/0', (await tally()) === '1 supporting · 0 challenging', await tally());
  check('stance stored', (await clips('caesar')).find((k) => k.category === 'logistics').stance === 'support');
  await ui.click(firstClip + ' .stance.challenge'); await sleep(150);
  check('switch to challenging -> tally 0/1', (await tally()) === '0 supporting · 1 challenging', await tally());
  await ui.click('#drawer .col[data-col=alexander] .cat[data-cat=intelligence] .clip .stance.support'); await sleep(150);
  await ui.click('#drawer .col[data-col=alexander] .cat[data-cat=logistics] .decision .stance.support'); await sleep(150);
  check('clip + decision card supporting -> tally 2/1', (await tally()) === '2 supporting · 1 challenging', await tally());
  await ui.click(firstClip + ' .stance.challenge'); await sleep(150);
  check('click active stance clears it -> 2/0', (await tally()) === '2 supporting · 0 challenging', await tally());
  await ui.click(firstClip + ' .stance.challenge'); await sleep(150);
  check('stance click did not open the source / change tab', await ui.evaluate((b) => FD.current().url === b + '/A', base));

  // ---- change category
  await ui.selectOption('#drawer .col[data-col=caesar] .cat[data-cat=unsorted] .clip .cat-select', 'recovery'); await sleep(200);
  check('category change moves the clip to Recovery', await ui.evaluate(() => document.querySelectorAll('#drawer .col[data-col=caesar] .cat[data-cat=recovery] .clip').length === 1 && !document.querySelector('#drawer .col[data-col=caesar] .cat[data-cat=unsorted]')));
  check('category select shows current category', await ui.$eval('#drawer .col[data-col=caesar] .cat[data-cat=recovery] .clip .cat-select', (e) => e.value === 'recovery'));
  check('stance kept across category change', (await tally()) === '2 supporting · 1 challenging', await tally());

  // ---- click a clip opens/focuses the source
  await ui.click('#tabs .tab:nth-child(2)'); await sleep(400);
  const before = await ui.evaluate(() => ({ n: FD.ws().tabs.length, cur: FD.current().url }));
  await ui.click('#drawer .col[data-col=caesar] .cat[data-cat=recovery] .clip .clip-text'); await sleep(500);
  let after = await ui.evaluate(() => ({ n: FD.ws().tabs.length, cur: FD.current().url }));
  check('click clip focuses the existing source tab (no duplicate)', after.cur === base + '/A' && after.n === before.n, JSON.stringify({ before, after }));
  const vis = (await T.views(app)).filter((v) => v.visible);
  check('source view visible after click', vis.length === 1 && vis[0].url === base + '/A', JSON.stringify(vis));
  // close the source tab, click the clip's source link -> reopened
  await ui.evaluate(() => FD.closeTab(FD.current().id)); await sleep(300);
  await ui.click('#drawer .col[data-col=caesar] .cat[data-cat=recovery] .clip .clip-src'); await sleep(1500);
  after = await ui.evaluate(() => ({ n: FD.ws().tabs.length, cur: FD.current().url }));
  check('click clip source link reopens a closed source', after.cur.startsWith(base + '/A'), JSON.stringify(after));
  const vp = await T.viewPage(app, '/A');
  console.log('  reopened source url:', after.cur, ' view url:', vp.url(), ' scrollY', await vp.evaluate(() => scrollY));
  await ui.click('#drawer .col[data-col=caesar] .cat[data-cat=recovery] .clip .clip-text'); await sleep(500);
  const again = await ui.evaluate(() => FD.ws().tabs.length);
  check('clicking the clip again does not open a second copy', again === after.n, again + ' vs ' + after.n);
  // long clip (text fragment path): go to another tab and click it
  await ui.click('#tabs .tab:nth-child(1)'); await sleep(300);
  await ui.click('#drawer .col[data-col=alexander] .cat[data-cat=tempo] .clip .clip-text'); await sleep(500);
  check('click long clip focuses source', await ui.evaluate((b) => FD.current().url.startsWith(b + '/A'), base));

  // ---- delete
  const nA = (await clips('alexander')).length;
  await ui.click('#drawer .col[data-col=alexander] .cat[data-cat=tempo] .clip .x'); await sleep(200);
  check('delete removes the clip', (await clips('alexander')).length === nA - 1 && await ui.evaluate(() => !document.querySelector('#drawer .col[data-col=alexander] .cat[data-cat=tempo] .clip')));
  check('pin badge updated after delete', (await ui.$eval('#rail .pin[data-commander=alexander] .pin-count', (e) => e.textContent)) === String(nA - 1));

  // ---- drawer keeps up when the question field has focus (user typed there, then went to the page)
  await ui.click('#drawer textarea.question'); await sleep(100);
  const p = await T.viewPage(app, '/A');
  await p.click('h1'); await sleep(150);          // real click into the page: focus moves to the web view
  m = await selectAndMenu('/A', '#p1');
  await T.menuClick(app, 'clip:caesar:tempo'); await sleep(500);
  const shown = await ui.evaluate(() => ({ dom: document.querySelectorAll('#drawer .col[data-col=caesar] .cat[data-cat=tempo] .clip').length, st: FD.S.state.commanders.caesar.clips.filter((k) => k.category === 'tempo').length, active: document.activeElement && document.activeElement.className }));
  check('clip made after typing in the question field shows up in the drawer at once', shown.dom === shown.st && shown.st === 1, JSON.stringify(shown));
  await ui.click('#drawer h2'); await ui.evaluate(() => { document.activeElement.blur && document.activeElement.blur(); FD.renderDrawer(); }); await sleep(100);

  // ---- typing in the working question while page-title updates arrive
  await ui.evaluate((u) => FD.navigate(FD.current(), u + '/titles'), base); await sleep(1200);
  await ui.click('#drawer textarea.question');
  await ui.keyboard.press('Control+A');
  const typed = 'Did Caesar recover faster than Alexander after a setback, and why?';
  await ui.keyboard.type(typed, { delay: 25 });
  const q = await ui.evaluate(() => ({ v: document.querySelector('#drawer textarea.question').value, focused: document.activeElement === document.querySelector('#drawer textarea.question'), st: FD.ws().question, title: FD.current().title }));
  check('typing during title updates: text intact and focus kept', q.v === typed && q.focused && q.st === typed, JSON.stringify(q));
  check('title updates were in fact arriving', /^Tick \d+/.test(q.title), q.title);
  // same for "my current view" and notes
  await ui.click('#drawer textarea.view'); await ui.keyboard.type('Caesar recovers faster.', { delay: 25 });
  check('typing in current view intact', await ui.evaluate(() => FD.ws().view.endsWith('Caesar recovers faster.') && document.activeElement.classList.contains('view')));
  await ui.click('#drawer h2');

  // ---- clip to an unpinned commander while two are pinned
  await ui.evaluate((u) => FD.navigate(FD.current(), u + '/B'), base); await sleep(1200);
  m = await selectAndMenu('/B', '#p1');
  const other = m.items.find((i) => i.id === 'clip:hannibal');
  check('unpinned commanders offered in a submenu', !!other && other.label.includes(' > '), other && other.label);
  await T.menuClick(app, 'clip:hannibal'); await sleep(400);
  const h = await ui.evaluate(() => ({ n: FD.S.state.commanders.hannibal.clips.length, pins: FD.ws().pins, toast: document.getElementById('toast').textContent }));
  check('clip to third commander saved, pins unchanged', h.n === 1 && h.pins.join() === 'alexander,caesar', JSON.stringify(h));

  // ---- save line
  m = await selectAndMenu('/B', '#p2');
  await T.menuClick(app, 'line'); await sleep(300);
  check('save line to workspace notes', await ui.evaluate((b) => FD.ws().lines.length === 1 && FD.ws().lines[0].url === b + '/B', base));

  // ---- no selection: no clip items
  const pB = await T.viewPage(app, '/B'); await pB.evaluate(() => getSelection().removeAllRanges());
  const noSel = await T.rightClick(app, await tabIdFor('/B'), 300, 500);
  check('no selection -> no clip items', !(noSel || []).some((i) => (i.id || '').startsWith('clip:')));
  await T.menuClose(app);

  // ---- nothing pinned (loose workspace)
  await ui.evaluate(() => FD.openWorkspace('loose')); await sleep(300);
  await ui.evaluate((u) => FD.navigate(FD.current(), u + '/C', { typed: true }), base); await sleep(1500);
  check('loose: nothing pinned', await ui.evaluate(() => FD.ws().pins.length === 0));
  m = await selectAndMenu('/C', '#p1');
  console.log('  menu with nothing pinned:', m.items.filter((i) => i.type !== 'separator').map((i) => i.label).slice(0, 8).join(' | '));
  check('nothing pinned: can still clip to a commander', m.items.some((i) => i.id === 'clip:turenne'));
  await T.menuClick(app, 'clip:turenne'); await sleep(400);
  const lo = await ui.evaluate(() => ({ pins: FD.ws().pins, n: FD.S.state.commanders.turenne.clips.length, rail: [...document.querySelectorAll('#rail .pin')].map((e) => e.dataset.commander), drawer: !document.getElementById('drawer').hidden, toast: document.getElementById('toast').textContent }));
  console.log('  after clipping with nothing pinned:', JSON.stringify(lo));
  check('nothing pinned: clip saved', lo.n === 1);
  // rail collapsed then clip
  await ui.click('#rail-btn'); await sleep(200);
  check('rail collapsed', await ui.$eval('#rail', (e) => e.hidden));
  m = await selectAndMenu('/C', '#p2');
  await T.menuClick(app, m.items.find((i) => (i.id || '').startsWith('clip:turenne')).id); await sleep(400);
  const col = await ui.evaluate(() => ({ collapsed: FD.ws().railCollapsed, n: FD.S.state.commanders.turenne.clips.length }));
  console.log('  clip while rail collapsed:', JSON.stringify(col), '(rail re-expands = ' + !col.collapsed + ')');
  check('clip while rail collapsed is saved', col.n === 2);
  T.rootShot('21-loose-after-clip');

  // ---- built-in page: fog / ulm
  await ui.evaluate(() => FD.openWorkspace('fog')); await sleep(500);
  const para = await ui.$('#pane-left .page-ulm .lede');
  await para.click({ clickCount: 3 }); await sleep(150);
  const sel = await ui.evaluate(() => String(getSelection()));
  const bb = await para.boundingBox();
  await app.evaluate(() => { global.__fdBefore = global.__fieldDesk.lastContextMenu(); });
  await ui.mouse.click(bb.x + 30, bb.y + 10, { button: 'right' }); await sleep(500);
  const bi = await T.menuItems(app);
  const fresh = await app.evaluate(() => global.__fieldDesk.lastContextMenu() !== global.__fdBefore);
  check('built-in page: right-click on selection opens clip menu', fresh && (bi || []).some((i) => i.id === 'clip:napoleon'), JSON.stringify((bi || []).map((i) => i.label).slice(0, 6)));
  await T.menuClick(app, 'clip:napoleon:intelligence'); await sleep(400);
  const nc = await clips('napoleon');
  check('built-in page clip saved with fielddesk url', nc.length === 1 && nc[0].url === 'fielddesk://ulm' && nc[0].text === sel.trim(), JSON.stringify(nc[0]));
  await ui.click('#rail .pin[data-commander=napoleon]'); await sleep(300);
  T.rootShot('22-fog-napoleon-file-with-clip');
  await ui.click('#tabs .tab:nth-child(2)'); await sleep(200);
  await ui.click('#drawer .clip .clip-text'); await sleep(300);
  check('built-in clip click focuses the Ulm tab', await ui.evaluate(() => FD.current().url === 'fielddesk://ulm'));

  // ---- persistence of clips, stance, category
  await sleep(400); await app.close();
  ({ app, ui } = await T.launch(prof)); await sleep(500);
  const st = await T.state(ui);
  check('restart: clips persist', st.commanders.caesar.clips.length === 3 && st.commanders.napoleon.clips.length === 1 && st.commanders.turenne.clips.length === 2, JSON.stringify(Object.fromEntries(Object.entries(st.commanders).map(([k, v]) => [k, v.clips.length]))));
  check('restart: stance and category persist', st.commanders.caesar.clips.some((k) => k.category === 'logistics' && k.stance === 'challenge') && st.commanders.caesar.clips.some((k) => k.category === 'recovery'));
  check('restart: question persisted', st.workspaces.avc.question === typed, st.workspaces.avc.question);
  await app.close();
});
