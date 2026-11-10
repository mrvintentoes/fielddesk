'use strict';
/* Field Desk core: the tab model, panes and split view, the address bar, commands. */
(function () {
  const h = FD.h;
  const $ = (id) => document.getElementById(id);
  const NEWTAB = 'fielddesk://newtab';

  const S = FD.S = {
    state: null,
    rt: {},              // per-tab runtime facts that are not saved: loading, error, whether a live view exists
    focus: 'left',       // which pane the toolbar talks to
    pageCache: new Map(),// rendered built-in pages, so they keep their scroll position
    slots: {},
    frozen: 0,
    lastLayout: null,
    openerOf: {},        // tab id -> tab that opened it (this session only)
    autoTab: null,       // tab created only to fill the second pane
    typed: {},           // tab id -> the next navigation was typed in the address bar
    pendingParent: {},   // tab id -> trail node that opened this tab
    addrFocus: false,
    sugg: [], suggIndex: 0
  };

  // ------------------------------------------------------------ state access
  FD.ws = () => S.state.workspaces[S.state.activeWs];
  FD.save = FD.debounce(() => window.fd.invoke('state:save', S.state), 150);
  FD.touch = () => { FD.ws().updatedAt = Date.now(); FD.save(); };
  FD.tab = (id) => FD.ws().tabs.find((t) => t.id === id) || null;
  FD.rt = (id) => S.rt[id] || (S.rt[id] = { loading: false, canBack: false, canFwd: false, made: false, error: null });
  FD.paneTab = (pane) => {
    const w = FD.ws();
    return pane === 'right' ? (w.split.on ? FD.tab(w.split.right) : null) : FD.tab(w.active);
  };
  FD.current = () => FD.paneTab(S.focus) || FD.tab(FD.ws().active);

  const INTERNAL_TITLES = {
    'fielddesk://newtab': 'New tab',
    'fielddesk://ulm': 'Fog of War: Ulm 1805',
    'fielddesk://sources/ulm': 'Reading room: Ulm 1805',
    'fielddesk://speech': 'Sixty seconds',
    'fielddesk://about': 'About Field Desk'
  };
  FD.internalTitle = (u) => INTERNAL_TITLES[u] || 'Field Desk';
  const mkTab = (url) => ({ id: FD.uid('t'), url, title: FD.isInternal(url) ? FD.internalTitle(url) : '', favicon: null });

  function normalize() {
    const w = FD.ws();
    if (!w.tabs.length) w.tabs.push(mkTab(NEWTAB));
    if (!FD.tab(w.active)) w.active = w.tabs[0].id;
    if (w.split.on) {
      if (!FD.tab(w.split.right) || w.split.right === w.active) {
        const i = w.tabs.findIndex((t) => t.id === w.active);
        const other = w.tabs[i + 1] || w.tabs.find((t) => t.id !== w.active);
        if (other) w.split.right = other.id;
        else { const t = mkTab(NEWTAB); w.tabs.push(t); w.split.right = t.id; S.autoTab = t.id; }
      }
    } else {
      w.split.right = null;
      S.focus = 'left';
    }
  }

  // ------------------------------------------------------------ tabs
  // Changing tab or workspace abandons whatever was half-typed in the address bar or find bar.
  function leaveAddress() {
    if (FD.hideSuggest) FD.hideSuggest();
    S.addrTab = null;
    if (FD.closeFind) FD.closeFind(true);
  }
  FD.newTab = function (url, opts) {
    opts = opts || {};
    url = url || NEWTAB;
    const w = FD.ws();
    const t = mkTab(url);
    const openerIndex = opts.openerId ? w.tabs.findIndex((x) => x.id === opts.openerId) : -1;
    if (openerIndex >= 0) {
      // After the opener and after any tabs it has already opened, as other browsers do.
      let at = openerIndex + 1;
      while (w.tabs[at] && S.openerOf[w.tabs[at].id] === opts.openerId) at++;
      w.tabs.splice(at, 0, t); S.openerOf[t.id] = opts.openerId;
    } else if (opts.index != null) w.tabs.splice(Math.min(opts.index, w.tabs.length), 0, t);
    else w.tabs.push(t);
    if (!opts.background) leaveAddress();
    if (opts.openerId && w.trail.cur[opts.openerId]) S.pendingParent[t.id] = w.trail.cur[opts.openerId];
    if (opts.typed) S.typed[t.id] = true;
    if (opts.split) {
      if (!w.split.on) { w.split.on = true; }
      w.split.right = t.id; S.focus = 'right';
    } else if (!opts.background) {
      if (S.focus === 'right' && w.split.on) w.split.right = t.id; else w.active = t.id;
    }
    if (opts.background && FD.isWeb(url)) ensureView(t); // load quietly in the background, like any browser
    FD.renderAll(); FD.touch();
    if (!opts.background && url === NEWTAB) FD.focusAddress();
    return t;
  };

  FD.closeTab = function (id) {
    const w = FD.ws();
    const i = w.tabs.findIndex((t) => t.id === id);
    if (i < 0) return;
    const t = w.tabs[i];
    leaveAddress();
    const closedUrl = t.url === NEWTAB && t.webUrl ? t.webUrl : t.url;
    if (closedUrl !== NEWTAB) {
      S.state.closed.push({ url: closedUrl, title: t.url === closedUrl ? t.title : (t.webMeta && t.webMeta.title) || '', ws: w.id, index: i });
      if (S.state.closed.length > 30) S.state.closed.shift();
    }
    if (FD.rt(id).made) window.fd.invoke('tab:destroy', { id });
    delete S.rt[id]; S.pageCache.delete(id); delete w.trail.cur[id];
    w.tabs.splice(i, 1);
    const near = (skip) => [w.tabs[i], w.tabs[i - 1], ...w.tabs].find((x) => x && x.id !== skip) || null;
    if (w.split.on && (id === w.active || id === w.split.right)) {
      const otherId = id === w.active ? w.split.right : w.active;
      const cand = near(otherId);
      if (cand) { if (id === w.active) w.active = cand.id; else w.split.right = cand.id; }
      else { w.split.on = false; w.active = otherId; S.focus = 'left'; }
    } else if (id === w.active) {
      const n = near(w.split.on ? w.split.right : null);
      w.active = n ? n.id : null;
    }
    FD.renderAll(); FD.touch();
  };

  FD.reopenTab = function () {
    const closed = S.state.closed; const here = FD.ws().id;
    let at = -1;
    for (let i = closed.length - 1; i >= 0; i--) if (closed[i].ws === here) { at = i; break; }
    if (at < 0) { FD.toast(closed.length ? 'No closed tab in this workspace' : 'No closed tab to reopen'); return; }
    const c = closed.splice(at, 1)[0];
    const t = FD.newTab(c.url, { index: c.index });
    t.title = c.title || t.title;
    FD.renderTabs();
  };

  FD.selectTab = function (id) {
    const w = FD.ws();
    if (!FD.tab(id)) return;
    leaveAddress();
    if (w.split.on) {
      if (id === w.active) S.focus = 'left';
      else if (id === w.split.right) S.focus = 'right';
      else if (S.focus === 'right') w.split.right = id; else w.active = id;
    } else w.active = id;
    FD.renderAll(); FD.touch(); FD.focusPage();
  };

  FD.navigate = function (t, url, opts) {
    if (!t || !url) return;
    opts = opts || {};
    const r = FD.rt(t.id);
    r.error = null;
    if (FD.isInternal(url)) {
      if (t.url !== url) t.iback = { url: t.url, title: t.title, favicon: t.favicon };
      t.url = url; t.title = FD.internalTitle(url); t.favicon = null; t.origin = null; t.webUrl = null;
      S.pageCache.delete(t.id);
    } else {
      if (FD.isInternal(t.url)) {
        t.origin = t.url;
        // Leaving a built-in page for a new site: drop the old view so its history
        // (pages already backed out of) cannot come back under the Back button.
        if (r.made) { window.fd.invoke('tab:destroy', { id: t.id }); r.made = false; r.canBack = false; r.canFwd = false; }
      }
      t.iback = null; t.webUrl = null; t.webMeta = null; t.url = url; t.title = ''; t.favicon = null; r.loading = true; r.pending = url;
      if (opts.typed) S.typed[t.id] = true;
      if (r.made) window.fd.invoke('tab:navigate', { id: t.id, url });
    }
    FD.renderAll(); FD.touch();
  };

  FD.back = function (t) {
    t = t || FD.current(); const r = FD.rt(t.id);
    if (FD.isInternal(t.url)) {
      const p = t.iback; if (!p) return;
      t.iback = null; t.url = p.url; t.title = p.title || FD.internalTitle(p.url); t.favicon = p.favicon || null; t.webUrl = null;
      S.pageCache.delete(t.id); FD.renderAll(); FD.touch(); return;
    }
    if (r.error && r.made && r.canBack) { r.error = null; window.fd.invoke('tab:action', { id: t.id, action: 'back' }); FD.renderAll(); return; }
    if (r.canBack && r.made) window.fd.invoke('tab:action', { id: t.id, action: 'back' });
    else if (t.origin) { t.webUrl = t.url; t.webMeta = { title: t.title, favicon: t.favicon }; t.url = t.origin; t.title = FD.internalTitle(t.url); t.favicon = null; r.error = null; FD.renderAll(); FD.touch(); }
  };
  FD.forward = function (t) {
    t = t || FD.current(); const r = FD.rt(t.id);
    if (FD.isInternal(t.url)) {
      if (t.webUrl) { const u = t.webUrl; const m = t.webMeta || {}; t.origin = t.url; t.webUrl = null; t.webMeta = null; t.url = u; t.title = m.title || ''; t.favicon = m.favicon || null; if (!r.made) r.loading = true; FD.renderAll(); FD.touch(); window.fd.invoke('tab:action', { id: t.id, action: 'focus' }); }
    } else if (r.canFwd) window.fd.invoke('tab:action', { id: t.id, action: 'forward' });
  };
  FD.reload = function (t, hard) {
    t = t || FD.current(); const r = FD.rt(t.id);
    if (FD.isInternal(t.url)) { S.pageCache.delete(t.id); FD.renderPanes(); return; }
    if (r.error) { r.error = null; r.loading = true; if (r.made) window.fd.invoke('tab:navigate', { id: t.id, url: t.url }); FD.renderAll(); return; }
    if (r.loading && !hard) { window.fd.invoke('tab:action', { id: t.id, action: 'stop' }); return; }
    if (r.made) window.fd.invoke('tab:action', { id: t.id, action: hard ? 'hard-reload' : 'reload' });
  };
  FD.canBack = (t) => (FD.isInternal(t.url) ? !!t.iback : (FD.rt(t.id).canBack || !!t.origin));
  FD.canFwd = (t) => (FD.isInternal(t.url) ? !!t.webUrl : FD.rt(t.id).canFwd);

  FD.toggleSplit = function () {
    const w = FD.ws();
    if (w.split.on) {
      if (S.focus === 'right' && FD.tab(w.split.right)) w.active = w.split.right;
      w.split.on = false; S.focus = 'left';
      const auto = S.autoTab && FD.tab(S.autoTab);
      if (auto && auto.url === NEWTAB && auto.id !== w.active) w.tabs.splice(w.tabs.indexOf(auto), 1);
      S.autoTab = null;
    } else { w.split.on = true; w.split.right = null; }
    FD.renderAll(); FD.touch();
  };
  FD.splitTab = function (id) {
    const w = FD.ws();
    if (w.split.on && (id === w.active || id === w.split.right)) {
      if (id === w.active) w.active = w.split.right;
      w.split.on = false; S.focus = 'left';
    } else {
      if (id === w.active) {
        let other = w.tabs.find((x) => x.id !== id);
        if (!other) { other = mkTab(NEWTAB); w.tabs.push(other); }
        w.active = other.id;
      }
      w.split.on = true; w.split.right = id; S.focus = 'right';
    }
    FD.renderAll(); FD.touch();
  };

  function ensureView(t) {
    const r = FD.rt(t.id);
    if (r.made || !FD.isWeb(t.url)) return;
    r.made = true; r.loading = true; r.pending = t.url;
    window.fd.invoke('tab:create', { id: t.id, url: t.url }).then(() => { S.lastLayout = null; syncLayout(); });
  }

  // ------------------------------------------------------------ bookmarks, history, trail
  FD.isBookmarked = (url) => S.state.bookmarks.some((b) => b.url === url);
  FD.toggleBookmark = function () {
    const t = FD.current();
    if (!FD.isWeb(t.url)) { FD.toast('Only web pages can be bookmarked'); return; }
    const i = S.state.bookmarks.findIndex((b) => b.url === t.url);
    if (i >= 0) { S.state.bookmarks.splice(i, 1); FD.toast('Bookmark removed'); }
    else { S.state.bookmarks.unshift({ id: FD.uid('b'), url: t.url, title: t.title || FD.host(t.url), ts: Date.now() }); FD.toast('Bookmarked'); }
    FD.renderToolbar(); FD.renderDrawer(); FD.save();
  };

  function recordHistory(url) {
    if (!FD.isWeb(url)) return;
    S.state.history = [{ url, title: '', ts: Date.now() }].concat(S.state.history.filter((x) => x.url !== url)).slice(0, 400);
  }

  function recordTrail(id, url) {
    const w = FD.ws();
    const typed = S.typed[id]; delete S.typed[id];
    const opened = S.pendingParent[id]; delete S.pendingParent[id];
    if (!w.rabbit) { delete w.trail.cur[id]; return; }
    if (!FD.isWeb(url)) return;
    url = FD.cleanUrl(url);
    const tr = w.trail;
    const cur = tr.nodes.find((n) => n.id === tr.cur[id]) || null;
    if (cur && cur.url === url) return;                       // a reload, or a restored tab
    let parent = typed ? null : (cur ? cur.id : (opened || null));
    if (!typed && cur) {                                      // back or forward along the trail
      const step = tr.nodes.find((n) => n.url === url && (n.id === cur.parent || n.parent === cur.id));
      if (step) { tr.cur[id] = step.id; step.ts = Date.now(); return; }
    }
    const same = tr.nodes.find((n) => n.parent === parent && n.url === url);
    if (same) { tr.cur[id] = same.id; same.ts = Date.now(); return; }
    const node = { id: FD.uid('n'), url, title: '', parent, ts: Date.now() };
    tr.nodes.push(node);
    if (tr.nodes.length > 500) {
      const drop = tr.nodes.shift();
      tr.nodes.forEach((n) => { if (n.parent === drop.id) n.parent = null; });
    }
    tr.cur[id] = node.id;
  }

  // ------------------------------------------------------------ rendering: tabs and toolbar
  let dragId = null;
  FD.renderTabs = function () {
    const w = FD.ws();
    const focusId = (FD.current() || {}).id;
    const strip = FD.clear($('tabs'));
    w.tabs.forEach((t) => {
      const r = FD.rt(t.id);
      const shown = t.id === w.active || (w.split.on && t.id === w.split.right);
      const icon = r.loading && !FD.isInternal(t.url)
        ? h('span', { class: 'tab-spin' })
        : (t.favicon && /^data:image\//.test(t.favicon) ? h('img', { class: 'tab-icon', src: t.favicon, alt: '', onerror: (e) => { e.target.style.visibility = 'hidden'; } })
          : h('span', { class: 'tab-glyph' }, FD.isInternal(t.url) ? '✦' : '◦'));
      const el = h('div', {
        class: 'tab' + (t.id === focusId ? ' active' : '') + (shown && t.id !== focusId ? ' shown' : ''),
        role: 'tab', draggable: 'true', title: (t.title || t.url) + (FD.isWeb(t.url) ? '\n' + t.url : ''), 'data-id': t.id,
        onclick: () => FD.selectTab(t.id),
        onauxclick: (e) => { if (e.button === 1) { e.preventDefault(); FD.closeTab(t.id); } },
        oncontextmenu: (e) => {
          e.preventDefault();
          window.fd.invoke('menu:tab', { id: t.id, canReopen: S.state.closed.length > 0, inSplit: w.split.on && shown });
        },
        ondragstart: (e) => { dragId = t.id; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', t.id); },
        ondragover: (e) => { if (dragId && dragId !== t.id) { e.preventDefault(); el.classList.add('drop'); } },
        ondragleave: () => el.classList.remove('drop'),
        ondrop: (e) => {
          e.preventDefault();
          const from = w.tabs.findIndex((x) => x.id === dragId), to = w.tabs.findIndex((x) => x.id === t.id);
          if (from >= 0 && to >= 0 && from !== to) { const [m] = w.tabs.splice(from, 1); w.tabs.splice(to, 0, m); FD.renderTabs(); FD.touch(); }
          dragId = null;
        },
        ondragend: () => { dragId = null; }
      },
      icon,
      h('span', { class: 'tab-title' }, t.title || (FD.isWeb(t.url) ? FD.host(t.url) : 'New tab')),
      h('button', { class: 'tab-close', title: 'Close tab', onclick: (e) => { e.stopPropagation(); FD.closeTab(t.id); } }, '×'));
      strip.appendChild(el);
    });
    strip.classList.toggle('crowded', w.tabs.length > 12);
    strip.classList.toggle('packed', w.tabs.length > 20);
    const act = strip.querySelector('.tab.active'); if (act && act.scrollIntoView) act.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };

  FD.renderToolbar = function () {
    const t = FD.current(); if (!t) return;
    const w = FD.ws(); const r = FD.rt(t.id);
    $('back-btn').disabled = !FD.canBack(t);
    $('fwd-btn').disabled = !FD.canFwd(t);
    $('reload-btn').textContent = r.loading && !FD.isInternal(t.url) ? '×' : '↻';
    $('reload-btn').title = r.loading ? 'Stop' : 'Reload';
    if (!S.addrFocus || S.addrTab !== t.id) { $('address').value = t.url === NEWTAB ? '' : t.url; if (S.addrFocus) $('address').select(); }
    S.addrTab = t.id;
    const marked = FD.isBookmarked(t.url);
    $('star-btn').textContent = marked ? '★' : '☆';
    $('star-btn').classList.toggle('on', marked);
    $('split-btn').classList.toggle('on', w.split.on);
    $('ws-btn').textContent = FD.trunc(w.name, 26);
    $('ws-btn').title = 'Workspace: ' + w.name + (w.question ? '\n' + w.question : '');
    $('rail-btn').classList.toggle('on', !w.railCollapsed);
    document.title = (t.title || 'New tab') + ' · Field Desk';
  };

  // ------------------------------------------------------------ rendering: panes
  function errorPage(t, err) {
    return h('div', { class: 'page page-error' },
      h('div', { class: 'page-inner narrow' },
        h('p', { class: 'eyebrow' }, 'This page did not arrive'),
        h('h1', null, FD.host(t.url) || 'Page unavailable'),
        h('p', null, 'Field Desk could not load ', h('span', { class: 'mono' }, FD.trunc(t.url, 90)), '.'),
        h('p', { class: 'muted' }, (err.desc || 'Unknown error') + (err.code ? ' (' + err.code + ')' : '')),
        h('p', null,
          h('button', { class: 'btn primary', onclick: () => FD.reload(t) }, 'Try again'), ' ',
          FD.canBack(t) ? h('button', { class: 'btn', onclick: () => FD.back(t) }, 'Go back') : null)));
  }

  function renderPane(pane) {
    const w = FD.ws();
    const el = $('pane-' + pane);
    const head = FD.clear(el.querySelector('.pane-head'));
    const body = el.querySelector('.pane-body');
    const t = FD.paneTab(pane);
    el.classList.toggle('focused', w.split.on && S.focus === pane);
    if (!t) { FD.clear(body); return; }
    if (w.split.on) {
      head.append(
        h('span', { class: 'pane-title' }, t.title || FD.host(t.url) || 'New tab'),
        h('span', { class: 'pane-host' }, FD.isWeb(t.url) ? FD.host(t.url) : ''),
        h('button', { class: 'pane-x', title: 'Close split view and keep the other side', onclick: (e) => { e.stopPropagation(); S.focus = pane === 'left' ? 'right' : 'left'; FD.toggleSplit(); } }, '×'));
    }
    const r = FD.rt(t.id);
    let node;
    if (FD.isInternal(t.url)) {
      const key = t.id + '|' + t.url;
      node = S.pageCache.get(t.id);
      if (!node || node.dataset.key !== key) {
        node = FD.renderPage(t);
        node.dataset.key = key;
        S.pageCache.set(t.id, node);
      }
    } else if (r.error) {
      node = errorPage(t, r.error);
    } else {
      ensureView(t);
      node = S.slots[pane] || (S.slots[pane] = h('div', { class: 'webslot' }));
      node.dataset.tab = t.id;
    }
    if (body.firstChild !== node || body.childNodes.length !== 1) { FD.clear(body); body.appendChild(node); }
  }

  FD.renderPanes = function () {
    normalize();
    const w = FD.ws();
    $('panes').classList.toggle('split', w.split.on);
    $('pane-left').style.flex = w.split.on ? w.split.ratio + ' 1 0px' : '1 1 0px';
    $('pane-right').style.flex = (1 - w.split.ratio) + ' 1 0px';
    renderPane('left');
    if (w.split.on) renderPane('right'); else FD.clear($('pane-right').querySelector('.pane-body'));
    scheduleLayout();
  };

  function syncLayout() {
    const w = FD.ws();
    const panes = [];
    for (const pane of ['left', 'right']) {
      if (pane === 'right' && !w.split.on) continue;
      const slot = $('pane-' + pane).querySelector('.webslot');
      if (!slot) continue;
      const b = slot.getBoundingClientRect();
      if (b.width < 2 || b.height < 2) continue;
      panes.push({ id: slot.dataset.tab, x: b.left, y: b.top, w: b.width, h: b.height });
    }
    const key = JSON.stringify(panes);
    if (key === S.lastLayout) return;
    S.lastLayout = key;
    window.fd.invoke('layout:set', { panes });
  }
  let layoutQueued = false;
  function scheduleLayout() {
    if (layoutQueued) return;
    layoutQueued = true;
    requestAnimationFrame(() => { layoutQueued = false; syncLayout(); });
  }
  FD.scheduleLayout = scheduleLayout;

  FD.renderAll = function () {
    normalize();
    FD.renderTabs(); FD.renderToolbar(); FD.renderRail(); FD.renderDrawer(); FD.renderPanes();
  };

  // Stills of the live pages, so app surfaces can be drawn across the page area.
  FD.freeze = async function () {
    if (S.frozen++ > 0) return;
    const shots = await window.fd.invoke('view:freeze');
    if (S.frozen === 0) return;
    document.querySelectorAll('.webslot').forEach((s) => {
      const src = shots[s.dataset.tab];
      s.style.backgroundImage = src ? 'url("' + src + '")' : '';
      s.style.backgroundSize = Math.round(s.getBoundingClientRect().width) + 'px auto';
      s.classList.add('frozen');
    });
  };
  FD.unfreeze = async function () {
    if (S.frozen === 0) return;
    if (--S.frozen > 0) return;
    S.lastLayout = null; syncLayout();
    await window.fd.invoke('view:unfreeze');
    const slots = new Set([...document.querySelectorAll('.webslot'), ...Object.values(S.slots)]);
    slots.forEach((s) => { s.style.backgroundImage = ''; s.style.backgroundSize = ''; s.classList.remove('frozen'); });
  };

  FD.focusPage = function () {
    const t = FD.current(); if (!t) return;
    if (FD.isWeb(t.url) && FD.rt(t.id).made && !FD.rt(t.id).error) window.fd.invoke('tab:action', { id: t.id, action: 'focus' });
  };
  FD.focusAddress = function () {
    window.fd.invoke('ui:focus').then(() => { const a = $('address'); const t = FD.current(); a.focus(); a.value = t.url === NEWTAB ? '' : t.url; a.select(); });
  };

  let toastTimer = null;
  FD.toast = function (msg) {
    const el = $('toast');
    el.textContent = msg; el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
  };

  // ------------------------------------------------------------ workspaces
  FD.pushPins = function () {
    const w = FD.ws();
    window.fd.invoke('pins:set', {
      pinned: w.pins.map((id) => ({ id, name: FD.commander(id).name })),
      all: FD.COMMANDERS.map((c) => ({ id: c.id, name: c.name }))
    });
  };

  FD.openWorkspace = function (id) {
    if (!S.state.workspaces[id] || id === S.state.activeWs) return;
    leaveAddress();
    const old = FD.ws();
    old.tabs.forEach((t) => { if (FD.rt(t.id).made) window.fd.invoke('tab:destroy', { id: t.id }); delete t.webUrl; });
    S.rt = {}; S.pageCache.clear(); S.typed = {}; S.pendingParent = {};
    S.state.lastWs = old.id; S.state.activeWs = id; S.focus = 'left'; S.lastLayout = null;
    FD.ws().updatedAt = Date.now();
    FD.ensureCommanders(FD.ws().pins);
    FD.renderAll(); FD.pushPins(); FD.save();
    FD.toast('Opened ' + FD.ws().name);
  };

  FD.resumeTarget = function () {
    const s = S.state;
    if (s.lastWs && s.workspaces[s.lastWs] && s.lastWs !== s.activeWs && s.lastWs !== 'loose') return s.workspaces[s.lastWs];
    return s.order.map((id) => s.workspaces[id]).filter((w) => w && w.id !== s.activeWs && w.kind !== 'loose')
      .sort((a, b) => b.updatedAt - a.updatedAt)[0] || null;
  };

  // ------------------------------------------------------------ address bar
  function suggestionsFor(q) {
    const out = []; const seen = new Set();
    const ql = q.toLowerCase();
    const engine = S.state.settings.engine;
    const direct = FD.toUrl(q, engine);
    const isSearch = direct.startsWith(FD.ENGINES[engine].url);
    const add = (type, title, url, id) => { if (out.length >= 7 || seen.has(type + url)) return; seen.add(type + url); out.push({ type, title, url, id }); };
    add(isSearch ? 'search' : 'go', q, direct);
    const hit = (x) => (x.title || '').toLowerCase().includes(ql) || (x.url || '').toLowerCase().includes(ql);
    FD.ws().tabs.filter((t) => t.id !== FD.current().id && FD.isWeb(t.url) && hit(t)).slice(0, 2).forEach((t) => add('tab', t.title || t.url, t.url, t.id));
    S.state.bookmarks.filter(hit).slice(0, 3).forEach((b) => add('bookmark', b.title, b.url));
    S.state.history.filter(hit).slice(0, 4).forEach((x) => add('history', x.title || x.url, x.url));
    if (!isSearch) add('search', q, FD.searchUrl(q, engine));
    return out;
  }

  const LABEL = { go: 'Go to', search: 'Search', tab: 'Switch to tab', bookmark: 'Bookmark', history: 'Visited' };
  function renderSuggest() {
    const box = $('suggest');
    FD.clear(box);
    S.sugg.forEach((s, i) => {
      box.appendChild(h('div', {
        class: 'sugg' + (i === S.suggIndex ? ' sel' : ''),
        onmousedown: (e) => { e.preventDefault(); pick(s); }
      },
      h('span', { class: 'sugg-kind' }, LABEL[s.type]),
      h('span', { class: 'sugg-title' }, s.type === 'search' ? s.title + ' · ' + FD.ENGINES[S.state.settings.engine].name : s.title),
      s.type === 'search' || s.type === 'go' ? null : h('span', { class: 'sugg-url' }, FD.host(s.url))));
    });
  }
  function showSuggest() {
    const box = $('suggest');
    if (box.hidden) { box.hidden = false; FD.freeze(); }
    const wrap = $('address-wrap').getBoundingClientRect();
    box.style.left = wrap.left + 'px'; box.style.width = wrap.width + 'px';
    renderSuggest();
  }
  FD.hideSuggest = hideSuggest;
  function hideSuggest() {
    const box = $('suggest');
    if (!box.hidden) { box.hidden = true; FD.unfreeze(); }
    S.sugg = [];
  }
  function pick(s) {
    const t = FD.current();
    hideSuggest();
    $('address').blur();
    if (s.type === 'tab' && FD.tab(s.id)) { FD.selectTab(s.id); return; }
    FD.navigate(t, s.url, { typed: true });
    setTimeout(FD.focusPage, 60);
  }

  function wireAddress() {
    const a = $('address');
    a.addEventListener('focus', () => { S.addrFocus = true; const t = FD.current(); a.value = t.url === NEWTAB ? '' : t.url; a.select(); });
    a.addEventListener('blur', () => { S.addrFocus = false; hideSuggest(); FD.renderToolbar(); });
    a.addEventListener('input', () => {
      const q = a.value.trim();
      if (!q) { hideSuggest(); return; }
      S.sugg = suggestionsFor(q); S.suggIndex = 0; showSuggest();
    });
    a.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!S.sugg.length) return;
        e.preventDefault();
        S.suggIndex = (S.suggIndex + (e.key === 'ArrowDown' ? 1 : S.sugg.length - 1)) % S.sugg.length;
        const s = S.sugg[S.suggIndex];
        a.value = s.type === 'search' ? s.title : s.url;
        renderSuggest();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const q = a.value.trim(); if (!q) return;
        const s = S.sugg[S.suggIndex];
        if (s && S.suggIndex > 0) pick(s);
        else pick({ type: 'go', url: FD.toUrl(q, S.state.settings.engine) });
      } else if (e.key === 'Escape') {
        e.preventDefault(); hideSuggest(); a.blur(); FD.focusPage();
      }
    });
  }

  // ------------------------------------------------------------ find in page
  function wireFind() {
    const bar = $('findbar'), input = $('find-input');
    // Built-in pages are part of this window, so they get their own highlighter
    // (the CSS Highlight API) instead of Chromium's find-in-page.
    let hits = [], hitAt = -1;
    const clearHits = () => { hits = []; hitAt = -1; if (window.CSS && CSS.highlights) { CSS.highlights.delete('fd-find'); CSS.highlights.delete('fd-find-current'); } };
    const pageEl = () => { const p = S.focus === 'right' ? 'right' : 'left'; return $('pane-' + p).querySelector('.page'); };
    const findInternal = (text, forward, next) => {
      const root = pageEl();
      if (!next || !hits.length) {
        clearHits();
        if (!root || !text) return;
        const needle = text.toLowerCase();
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        for (let n = walker.nextNode(); n && hits.length < 500; n = walker.nextNode()) {
          if (!n.parentElement || n.parentElement.closest('textarea, script, style')) continue;
          const hay = n.data.toLowerCase();
          for (let i = hay.indexOf(needle); i >= 0; i = hay.indexOf(needle, i + needle.length)) {
            const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + needle.length); hits.push(r);
          }
        }
        hitAt = hits.length ? 0 : -1;
      } else hitAt = (hitAt + (forward ? 1 : hits.length - 1)) % hits.length;
      if (window.CSS && CSS.highlights && hits.length) {
        CSS.highlights.set('fd-find', new Highlight(...hits));
        CSS.highlights.set('fd-find-current', new Highlight(hits[hitAt]));
        const el = hits[hitAt].startContainer.parentElement; if (el) el.scrollIntoView({ block: 'center' });
      }
      $('find-count').textContent = hits.length ? (hitAt + 1) + ' of ' + hits.length : 'No matches';
    };
    const run = (forward, next) => {
      const t = FD.current(); const text = input.value;
      if (!text) { $('find-count').textContent = ''; clearHits(); if (FD.isWeb(t.url) && FD.rt(t.id).made) window.fd.invoke('tab:action', { id: t.id, action: 'stop-find' }); return; }
      if (FD.isWeb(t.url)) window.fd.invoke('tab:find', { id: t.id, text, forward, next });
      else findInternal(text, forward, next);
    };
    FD.openFind = () => { bar.hidden = false; window.fd.invoke('ui:focus').then(() => { input.focus(); input.select(); }); scheduleLayout(); };
    FD.findStep = (forward) => { if (bar.hidden) FD.openFind(); else run(forward, true); };
    FD.closeFind = (quiet) => {
      if (bar.hidden) return;
      bar.hidden = true; $('find-count').textContent = ''; clearHits();
      const t = FD.current();
      if (t && FD.isWeb(t.url) && FD.rt(t.id).made) window.fd.invoke('tab:action', { id: t.id, action: 'stop-find' });
      scheduleLayout(); if (quiet !== true) FD.focusPage();
    };
    input.addEventListener('input', () => run(true, false));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); run(!e.shiftKey, true); }
      if (e.key === 'Escape') { e.preventDefault(); FD.closeFind(); }
    });
    $('find-next').onclick = () => run(true, true);
    $('find-prev').onclick = () => run(false, true);
    $('find-close').onclick = () => FD.closeFind();
  }

  // ------------------------------------------------------------ divider
  function wireDivider() {
    const d = $('divider');
    d.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      const w = FD.ws(); const box = $('panes').getBoundingClientRect();
      document.body.classList.add('dragging');
      FD.freeze();
      const move = (ev) => {
        w.split.ratio = Math.min(0.8, Math.max(0.2, (ev.clientX - box.left) / box.width));
        $('pane-left').style.flex = w.split.ratio + ' 1 0px';
        $('pane-right').style.flex = (1 - w.split.ratio) + ' 1 0px';
      };
      const up = () => {
        window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up);
        document.body.classList.remove('dragging');
        FD.unfreeze(); FD.touch();
      };
      window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
    });
    d.addEventListener('dblclick', () => { FD.ws().split.ratio = 0.5; FD.renderPanes(); FD.touch(); });
  }

  // ------------------------------------------------------------ commands (menus, shortcuts, buttons)
  FD.command = function (name, p) {
    p = p || {};
    const w = FD.ws(); const t = (p.id && FD.tab(p.id)) || FD.current();
    const cycle = (d) => { const i = w.tabs.findIndex((x) => x.id === FD.current().id); FD.selectTab(w.tabs[(i + d + w.tabs.length) % w.tabs.length].id); };
    const act = (action) => { if (FD.isWeb(t.url) && FD.rt(t.id).made) window.fd.invoke('tab:action', { id: t.id, action }); };
    switch (name) {
      case 'new-tab': FD.newTab(NEWTAB); break;
      case 'close-tab': FD.closeTab(t.id); break;
      case 'close-others': w.tabs.filter((x) => x.id !== t.id).forEach((x) => FD.closeTab(x.id)); break;
      case 'duplicate-tab': FD.newTab(t.url, { openerId: t.id }); break;
      case 'reopen-tab': FD.reopenTab(); break;
      case 'focus-address': FD.focusAddress(); break;
      case 'reload': case 'reload-tab': FD.reload(t); break;
      case 'hard-reload': FD.reload(t, true); break;
      case 'back': FD.back(t); break;
      case 'forward': FD.forward(t); break;
      case 'next-tab': cycle(1); break;
      case 'prev-tab': cycle(-1); break;
      case 'tab-index': { const x = p.index < 0 ? w.tabs[w.tabs.length - 1] : w.tabs[p.index]; if (x) FD.selectTab(x.id); break; }
      case 'bookmark': FD.toggleBookmark(); break;
      case 'find': FD.openFind(); break;
      case 'find-next': FD.findStep(true); break;
      case 'find-prev': FD.findStep(false); break;
      case 'zoom-in': case 'zoom-out': case 'zoom-reset':
        if (FD.isInternal(t.url)) {
          S.pageZoom = name === 'zoom-reset' ? 1 : Math.min(2, Math.max(0.6, (S.pageZoom || 1) + (name === 'zoom-in' ? 0.1 : -0.1)));
          document.documentElement.style.setProperty('--page-zoom', String(S.pageZoom));
        } else act(name);
        break;
      case 'devtools': act(name); break;
      case 'split': FD.toggleSplit(); break;
      case 'split-tab': FD.splitTab(t.id); break;
      case 'toggle-rail': FD.toggleRail(); break;
      case 'toggle-drawer': FD.toggleDrawer(); break;
      case 'export': FD.exportMarkdown(); break;
      case 'save-line': FD.saveSelection(); break;
      default: break;
    }
  };

  // ------------------------------------------------------------ wiring
  FD.wire = function () {
    wireAddress(); wireFind(); wireDivider();
    $('newtab-btn').onclick = () => FD.command('new-tab');
    $('back-btn').onclick = () => FD.command('back');
    $('fwd-btn').onclick = () => FD.command('forward');
    $('reload-btn').onclick = () => FD.command('reload');
    $('star-btn').onclick = () => FD.command('bookmark');
    $('split-btn').onclick = () => FD.command('split');
    $('ws-btn').onclick = () => FD.openPanel('workspaces');
    $('rail-btn').onclick = () => FD.command('toggle-rail');
    $('tabs').addEventListener('dblclick', (e) => { if (e.target === $('tabs')) FD.command('new-tab'); });

    for (const pane of ['left', 'right']) {
      const el = $('pane-' + pane);
      el.addEventListener('mousedown', () => {
        if (FD.ws().split.on && S.focus !== pane) { S.focus = pane; FD.renderTabs(); FD.renderToolbar(); $('pane-left').classList.toggle('focused', pane === 'left'); $('pane-right').classList.toggle('focused', pane === 'right'); }
      }, true);
      // Right-click inside built-in pages gets the same clip menu as the web.
      el.querySelector('.pane-body').addEventListener('contextmenu', (e) => {
        const t = FD.paneTab(pane); if (!t || !FD.isInternal(t.url)) return;
        if (e.target.closest('input, textarea')) return;
        const selection = String(window.getSelection() || '').trim();
        const a = e.target.closest('a[data-url]');
        if (!selection && !a) return;
        e.preventDefault();
        window.fd.invoke('menu:page', { url: t.url, title: t.title, selection, linkURL: a ? a.dataset.url : '' });
      });
    }
    new ResizeObserver(scheduleLayout).observe($('panes'));
    new ResizeObserver(scheduleLayout).observe($('pane-left'));
    window.addEventListener('resize', scheduleLayout);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !e.defaultPrevented && !$('findbar').hidden && document.activeElement !== $('address')) FD.closeFind();
    });

    const on = window.fd.on;
    on('tab:update', (u) => {
      const t = FD.tab(u.id); if (!t) return;
      const r = FD.rt(u.id);
      r.loading = u.loading; r.canBack = u.canBack; r.canFwd = u.canFwd;
      if (FD.isInternal(t.url)) { if (FD.isWeb(u.url) && t.webUrl) t.webUrl = u.url; }
      else if (!r.error && !r.pending) {
        if (FD.isWeb(u.url)) t.url = FD.cleanUrl(u.url);
        if (u.title && !/^about:blank/.test(u.title)) t.title = u.title;
        t.favicon = (u.favicon && /^data:image\//.test(u.favicon)) ? u.favicon : (u.loading ? t.favicon : null);
        const hi = S.state.history.find((x) => x.url === t.url); if (hi && t.title) hi.title = t.title;
        const node = FD.ws().trail.nodes.find((n) => n.id === FD.ws().trail.cur[t.id]); if (node && node.url === t.url && t.title) node.title = t.title;
      }
      FD.renderTabs(); FD.renderToolbar(); FD.updatePaneHeads(); FD.save();
      if (FD.ws().drawer.open && FD.ws().drawer.panel === 'trail' && !u.loading) FD.renderDrawer();
    });
    on('tab:navigated', (u) => {
      const t = FD.tab(u.id); if (!t) return;
      const r = FD.rt(u.id);
      const hadError = !!r.error; r.error = null; r.pending = null;
      u.url = FD.cleanUrl(u.url);
      if (!FD.isInternal(t.url)) t.url = u.url;
      recordHistory(u.url); recordTrail(u.id, u.url);
      clearTimeout(S.remarkTimer); S.remarkTimer = setTimeout(() => FD.maybeRemark(u.id), 2200);
      if (hadError) FD.renderPanes();
      FD.touch();
    });
    on('tab:fail', (u) => {
      const t = FD.tab(u.id); if (!t) return;
      const r = FD.rt(u.id);
      r.error = { code: u.code, desc: u.desc, url: u.url }; r.loading = false; r.pending = null;
      if (FD.isWeb(u.url) && !FD.isInternal(t.url)) t.url = u.url;
      if (!t.title) t.title = FD.host(t.url);
      FD.renderAll();
    });
    on('tab:open', (u) => {
      const url = u.url || (u.search ? FD.searchUrl(u.search, S.state.settings.engine) : null);
      if (url) FD.newTab(url, { openerId: u.openerId, background: !!u.background, split: !!u.split });
    });
    on('tab:focused', (u) => {
      const w = FD.ws(); let pane = null;
      if (w.split.on && u.id === w.split.right) pane = 'right'; else if (u.id === w.active) pane = 'left';
      if (pane && pane !== S.focus) { S.focus = pane; FD.renderTabs(); FD.renderToolbar(); FD.updatePaneHeads(); }
    });
    on('tab:found', (u) => { $('find-count').textContent = u.matches ? u.active + ' of ' + u.matches : 'No matches'; });
    on('tab:fullscreen', (u) => { document.body.classList.toggle('page-fullscreen', !!u.on); scheduleLayout(); });
    on('tab:target', (u) => {
      const el = $('status'); const cur = FD.current();
      if (!cur || u.id !== cur.id) return;
      el.textContent = u.url || ''; el.classList.toggle('show', !!u.url);
    });
    on('tab:slept', (u) => { const r = S.rt[u.id]; if (r) { r.made = false; r.loading = false; r.canBack = false; r.canFwd = false; } });
    on('clip', (c) => FD.addClip(c));
    on('line', (l) => FD.addLine(l));
    on('cmd', (c) => FD.command(c.name, c));
  };

  FD.updatePaneHeads = function () {
    const w = FD.ws();
    for (const pane of ['left', 'right']) {
      const el = $('pane-' + pane); const t = FD.paneTab(pane);
      el.classList.toggle('focused', w.split.on && S.focus === pane);
      if (!t || !w.split.on) continue;
      const title = el.querySelector('.pane-title'), host = el.querySelector('.pane-host');
      if (title) title.textContent = t.title || FD.host(t.url) || 'New tab';
      if (host) host.textContent = FD.isWeb(t.url) ? FD.host(t.url) : '';
    }
  };

  // Links inside built-in pages behave like links on the web.
  FD.link = function (t, url, label, cls) {
    return h('a', {
      href: '#', class: cls || 'link', 'data-url': url, title: url,
      onclick: (e) => {
        e.preventDefault();
        if (FD.newTabClick(e)) FD.newTab(url, { background: true, openerId: t && t.id });
        else if (t && FD.tab(t.id)) FD.navigate(t, url); else FD.newTab(url);
      },
      onauxclick: (e) => { if (e.button === 1) { e.preventDefault(); FD.newTab(url, { background: true, openerId: t && t.id }); } }
    }, label);
  };

  // Open a clip's source: switch to a tab already on that page, otherwise open one.
  FD.openSource = function (url, text) {
    if (!url) return;
    const w = FD.ws();
    const have = w.tabs.find((t) => t.url === url || t.url.split('#')[0] === url.split('#')[0]);
    if (have) { FD.selectTab(have.id); return have; }
    return FD.newTab(FD.isWeb(url) ? FD.sourceLink(url, text) : url);
  };
})();
