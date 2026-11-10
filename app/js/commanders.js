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
