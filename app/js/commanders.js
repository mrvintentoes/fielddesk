'use strict';
window.FD = window.FD || {};
/*
 * Commander registry. A light index (names, dates, themes) is loaded with the app; each
 * commander's file (decisions, quotes, remarks, portrait) is fetched from disk only when
 * that commander is pinned or opened.
 */
(function () {
  FD.CATEGORIES = [
    { id: 'intelligence', label: 'Intelligence' },
    { id: 'tempo', label: 'Marching tempo' },
    { id: 'logistics', label: 'Logistics' },
    { id: 'recovery', label: 'Recovery after setbacks' }
  ];
  FD.COMMANDERS = (FD.COMMANDER_INDEX || []).map((c) => Object.assign({ decisions: [], quotes: [], remarks: [], portrait: '', loaded: false }, c));
  const byId = new Map(FD.COMMANDERS.map((c) => [c.id, c]));
  const pending = new Map();

  FD.commander = (id) => byId.get(id) || null;

  // Called by each file in js/commanders/.
  FD.defineCommander = function (data) {
    const c = byId.get(data.id);
    if (!c) return;
    c.decisions = data.decisions || []; c.quotes = data.quotes || []; c.remarks = data.remarks || []; c.portrait = data.portrait || '';
    c.loaded = true;
  };

  FD.ensureCommander = function (id) {
    const c = byId.get(id);
    if (!c) return Promise.resolve(null);
    if (c.loaded) return Promise.resolve(c);
    if (pending.has(id)) return pending.get(id);
    const p = new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = 'js/commanders/' + id + '.js';
      s.onload = () => { pending.delete(id); resolve(c); if (FD.onCommanderLoaded) FD.onCommanderLoaded(c); };
      s.onerror = () => { pending.delete(id); resolve(c); };
      document.head.appendChild(s);
    });
    pending.set(id, p);
    return p;
  };
  FD.ensureCommanders = (ids) => Promise.all((ids || []).map(FD.ensureCommander));

  // Standing figures: one small file each, read only when that commander's file is opened.
  const figures = new Map(); const figPending = new Set();
  const fillFigures = (id) => document.querySelectorAll('[data-figure="' + id + '"]').forEach((el) => { if (el.classList.contains('has-painting')) return; el.innerHTML = figures.get(id); el.classList.add('has-figure'); });
  FD.defineFigure = function (id, svg) { if (byId.has(id) && /^<svg[\s>]/.test(svg)) { figures.set(id, svg); fillFigures(id); } };
  FD.figure = function (id) {
    if (figures.has(id)) return figures.get(id);
    if (byId.has(id) && !figPending.has(id)) {
      figPending.add(id);
      const s = document.createElement('script');
      s.src = 'js/figures/' + id + '.js';
      s.onerror = () => {};
      document.head.appendChild(s);
    }
    return '';
  };
  // A painting or photograph, if one has been downloaded for this commander (see src/portraits.js).
  const paintings = new Map();   // id -> { dataUrl, credit } | null (none) ; absent = not asked yet
  const usePaintings = () => !(FD.S && FD.S.state && FD.S.state.settings.portraits === false);
  function showPainting(el, p) {
    el.textContent = '';
    const img = document.createElement('img');
    img.src = p.dataUrl; img.alt = p.credit.title || ''; img.draggable = false;
    el.appendChild(img);
    el.classList.add('has-painting'); el.classList.remove('has-figure');
  }
  function creditText(c) {
    return [c.title, c.artist, c.date && c.date.length < 40 ? c.date : '', c.licence].filter(Boolean).join(' · ');
  }
  function fillCredit(el, p) {
    el.textContent = '';
    if (!p) { el.hidden = true; return; }
    const a = document.createElement('a');
    a.href = '#'; a.className = 'clip-src'; a.title = p.credit.source; a.textContent = creditText(p.credit);
    a.onclick = (e) => { e.preventDefault(); FD.openSource(p.credit.source); };
    el.append(a, document.createTextNode(' · Wikimedia Commons' + (p.credit.note ? '. ' + p.credit.note : '')));
    el.hidden = false;
  }
  function applyPainting(id) {
    const p = paintings.get(id);
    if (!p || !usePaintings()) return;
    document.querySelectorAll('[data-figure="' + id + '"]').forEach((el) => showPainting(el, p));
    document.querySelectorAll('[data-credit="' + id + '"]').forEach((el) => fillCredit(el, p));
  }
  FD.askPainting = function (id, again) {
    if (!usePaintings() || (paintings.has(id) && !again)) return;
    paintings.set(id, paintings.get(id) || null);
    window.fd.invoke('portrait:get', id).then((p) => { if (p && p.dataUrl) { paintings.set(id, p); applyPainting(id); } }).catch(() => {});
  };
  FD.creditEl = function (id) {
    const el = document.createElement('p');
    el.className = 'file-credit'; el.dataset.credit = id; el.hidden = true;
    const p = usePaintings() && paintings.get(id);
    if (p) fillCredit(el, p);
    return el;
  };

  // A slot for the commander's picture: the painting if there is one, otherwise the drawn
  // figure, otherwise the medallion until the drawing arrives.
  FD.figureEl = function (id, cls) {
    const el = document.createElement('div');
    el.className = 'figure ' + (cls || '');
    el.dataset.figure = id;
    const p = usePaintings() && paintings.get(id);
    if (p) { showPainting(el, p); return el; }
    const svg = FD.figure(id);
    if (svg) el.classList.add('has-figure');
    el.innerHTML = svg || FD.portrait(id);
    FD.askPainting(id);
    return el;
  };

  // Until a commander's own portrait is loaded, show a plain medallion with their initial.
  FD.portrait = function (id) {
    const c = byId.get(id);
    if (!c) return '';
    if (c.portrait) return c.portrait;
    return '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="32" fill="' + (c.tone || '#7b2d26') + '"/>' +
      '<circle cx="32" cy="32" r="27" fill="none" stroke="#f4ecdd" stroke-opacity=".55" stroke-width="1.5"/>' +
      '<text x="32" y="42" text-anchor="middle" font-family="Georgia, serif" font-size="28" fill="#f4ecdd">' + c.name.slice(0, 1) + '</text></svg>';
  };
})();
