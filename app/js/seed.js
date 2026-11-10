'use strict';
window.FD = window.FD || {};

// The state a brand-new install starts with. Everything here is ordinary user data
// afterwards: workspaces can be renamed, emptied or deleted.
FD.STATE_VERSION = 1;

FD.newWorkspace = function (o) {
  const id = o.id || FD.uid('w');
  const tabs = (o.tabs && o.tabs.length ? o.tabs : [{ url: 'fielddesk://newtab' }]).map((t) => ({ id: FD.uid('t'), url: t.url, title: t.title || '', favicon: null }));
  return {
    id, name: o.name || 'Untitled', question: o.question || '', view: '', kind: o.kind || 'desk',
    tabs, active: tabs[o.activeIndex || 0].id,
    split: { on: !!o.split, right: o.split ? tabs[o.split.rightIndex].id : null, ratio: (o.split && o.split.ratio) || 0.5 },
    pins: o.pins || [], drawer: { open: !!o.drawerOpen, panel: o.panel || 'notes', commander: (o.pins || [])[0] || null },
    railCollapsed: false, notes: o.notes || '', lines: [], cardStance: {},
    rabbit: o.rabbit !== false, trail: { nodes: [], cur: {} },
    speech: { points: '', attempts: [] },
    createdAt: Date.now(), updatedAt: Date.now()
  };
};

FD.seedState = function () {
  const fog = FD.newWorkspace({
    id: 'fog', name: 'Fog of War', kind: 'ulm',
    question: 'Ulm, October 1805: what should Mack do once the French are behind him?',
    tabs: [{ url: 'fielddesk://ulm', title: 'Fog of War: Ulm 1805' }, { url: 'fielddesk://sources/ulm', title: 'Reading room: Ulm 1805' }],
    split: { rightIndex: 1, ratio: 0.58 }, pins: ['napoleon']
  });
  const avc = FD.newWorkspace({
    id: 'avc', name: 'Alexander vs. Caesar',
    question: 'Where did Caesar have an operational edge?',
    tabs: [
      { url: 'https://en.wikipedia.org/wiki/Commentarii_de_Bello_Gallico', title: 'Caesar, Commentarii de Bello Gallico' },
      { url: 'https://en.wikipedia.org/wiki/Anabasis_of_Alexander', title: 'Arrian, Anabasis of Alexander' },
      { url: 'https://en.wikipedia.org/wiki/Battle_of_Dyrrhachium_(48_BC)', title: 'Battle of Dyrrhachium' }
    ],
    pins: ['alexander', 'caesar'], panel: 'compare', drawerOpen: true
  });
  const loose = FD.newWorkspace({ id: 'loose', name: 'Loose tabs', kind: 'loose', rabbit: false });
  const commanders = {};
  FD.COMMANDERS.forEach((c) => { commanders[c.id] = { clips: [] }; });
  return {
    v: FD.STATE_VERSION,
    settings: { engine: 'ddg' },
    bookmarks: [],
    pinnedSites: [
      { title: 'Wikipedia', url: 'https://en.wikipedia.org/' },
      { title: 'Wikisource', url: 'https://en.wikisource.org/' },
      { title: 'Perseus Library', url: 'https://www.perseus.tufts.edu/hopper/' },
      { title: 'LacusCurtius', url: 'https://penelope.uchicago.edu/Thayer/E/Roman/home.html' },
      { title: 'Internet Archive', url: 'https://archive.org/' },
      { title: 'Project Gutenberg', url: 'https://www.gutenberg.org/' }
    ],
    history: [], closed: [],
    order: ['fog', 'avc', 'loose'],
    workspaces: { fog, avc, loose },
    activeWs: 'fog', lastWs: 'avc',
    commanders,
    ulm: { stage: 1, choice: null, why: '', changeMind: '', committed: false, reflection: '', runs: [] }
  };
};

// Bring a loaded state file up to the shape this version expects, without discarding anything.
FD.repairState = function (s) {
  if (!s || typeof s !== 'object' || !s.workspaces) return FD.seedState();
  const seed = FD.seedState();
  for (const k of Object.keys(seed)) if (s[k] == null) s[k] = seed[k];
  FD.COMMANDERS.forEach((c) => { if (!s.commanders[c.id]) s.commanders[c.id] = { clips: [] }; });
  s.order = (s.order || []).filter((id) => s.workspaces[id]);
  Object.keys(s.workspaces).forEach((id) => { if (!s.order.includes(id)) s.order.push(id); });
  if (!s.workspaces.loose) { s.workspaces.loose = FD.newWorkspace({ id: 'loose', name: 'Loose tabs', kind: 'loose', rabbit: false }); s.order.push('loose'); }
  if (!s.workspaces[s.activeWs]) s.activeWs = s.order[0];
  for (const w of Object.values(s.workspaces)) {
    const blank = FD.newWorkspace({ id: w.id });
    for (const k of Object.keys(blank)) if (w[k] == null) w[k] = blank[k];
    if (!w.tabs.length) w.tabs = blank.tabs;
    w.tabs.forEach((t) => { delete t.webUrl; if (t.favicon && !/^data:image\//.test(t.favicon)) t.favicon = null; });
    if (!w.tabs.some((t) => t.id === w.active)) w.active = w.tabs[0].id;
    w.pins = (w.pins || []).filter((id) => FD.commander(id)).slice(0, 2);
  }
  return s;
};
