'use strict';
/* The desk rail (pinned commanders) and its drawer: commander files, compare, notes, workspaces, trail, bookmarks. */
(function () {
  const h = FD.h;
  const $ = (id) => document.getElementById(id);
  const S = FD.S;
  const catLabel = (id) => (FD.CATEGORIES.find((c) => c.id === id) || {}).label || 'Unsorted';
  const clipsOf = (id) => S.state.commanders[id].clips;

  // ------------------------------------------------------------ open, close, collapse
  FD.openPanel = function (panel, commander) {
    const w = FD.ws(); const d = w.drawer;
    const same = d.open && d.panel === panel && (panel !== 'commander' || d.commander === commander);
    if (same) d.open = false;
    else { d.open = true; d.panel = panel; if (commander) d.commander = commander; }
    w.railCollapsed = false;
    FD.renderRail(); FD.renderDrawer(); FD.renderToolbar(); FD.scheduleLayout(); FD.touch();
  };
  FD.toggleDrawer = function () {
    const w = FD.ws();
    w.drawer.open = !w.drawer.open;
    if (w.drawer.open) w.railCollapsed = false;
    FD.renderRail(); FD.renderDrawer(); FD.renderToolbar(); FD.scheduleLayout(); FD.touch();
  };
  // Collapse everything on the right edge at once, for plain browsing.
  FD.toggleRail = function () {
    const w = FD.ws();
    w.railCollapsed = !w.railCollapsed;
    if (w.railCollapsed) w.drawer.open = false;
    FD.renderRail(); FD.renderDrawer(); FD.renderToolbar(); FD.scheduleLayout(); FD.touch();
  };

  // ------------------------------------------------------------ pins
  FD.pin = function (id) {
    const w = FD.ws();
    if (w.pins.includes(id)) return;
    if (w.pins.length >= 2) w.pins.shift();
    w.pins.push(id);
    w.railCollapsed = false;
    FD.pushPins(); FD.renderRail(); FD.renderDrawer(); FD.touch();
  };
  FD.unpin = function (id) {
    const w = FD.ws();
    w.pins = w.pins.filter((x) => x !== id);
    if (w.drawer.panel === 'compare' && w.pins.length < 2) w.drawer.panel = w.pins.length ? 'commander' : 'pin';
    if (w.drawer.panel === 'commander' && w.drawer.commander === id) { if (w.pins.length) w.drawer.commander = w.pins[0]; else w.drawer.panel = 'pin'; }
    FD.pushPins(); FD.renderRail(); FD.renderDrawer(); FD.touch();
  };

  // ------------------------------------------------------------ clips and saved lines
  FD.addClip = function (c) {
    const text = String(c.text || '').replace(/\s+\n/g, '\n').trim();
    if (!text || !S.state.commanders[c.commanderId]) return;
    const w = FD.ws();
    const clip = { id: FD.uid('c'), text: text.slice(0, 6000), url: c.url || '', title: c.title || FD.host(c.url), ts: Date.now(), category: c.category || null, stance: null, ws: w.id };
    clipsOf(c.commanderId).unshift(clip);
    if (!w.pins.includes(c.commanderId) && w.pins.length < 2) { w.pins.push(c.commanderId); FD.pushPins(); }
    w.railCollapsed = false;
    S.flash = c.commanderId;
    FD.renderRail(); FD.renderDrawer(); FD.touch();
    FD.toast('Clipped to ' + FD.commander(c.commanderId).name + '’s file' + (clip.category ? ' under ' + catLabel(clip.category).toLowerCase() : ''));
    setTimeout(() => { S.flash = null; }, 1500);
    return clip;
  };
  FD.addLine = function (l) {
    const text = String(l.text || '').trim(); if (!text) return;
    FD.ws().lines.unshift({ id: FD.uid('l'), text: text.slice(0, 6000), url: l.url || '', title: l.title || FD.host(l.url), ts: Date.now() });
    FD.renderDrawer(); FD.touch();
    FD.toast('Line saved to notes');
  };
  FD.saveSelection = async function () {
    const t = FD.current();
    let text = '';
    if (FD.isWeb(t.url) && FD.rt(t.id).made) text = await window.fd.invoke('tab:selection', { id: t.id });
    else text = String(window.getSelection() || '');
    if (!text.trim()) { FD.toast('Select a line on the page first'); return; }
    FD.addLine({ text, url: t.url, title: t.title });
  };

  // ------------------------------------------------------------ Markdown export
  const mdEsc = (s) => String(s || '').replace(/([\[\]])/g, '\\$1');
  const mdLink = (title, url) => (url ? '[' + mdEsc(title || url) + '](' + String(url).replace(/\)/g, '%29').replace(/ /g, '%20') + ')' : mdEsc(title || ''));
  const mdQuote = (s) => String(s).split('\n').map((l) => '> ' + l).join('\n');

  FD.buildMarkdown = function (w) {
    w = w || FD.ws();
    const out = [];
    out.push('# ' + w.name, '');
    if (w.question) out.push('**Working question:** ' + w.question, '');
    if (w.view) out.push('**Current view:** ' + w.view, '');
    out.push('_Exported from Field Desk on ' + FD.fmtDate(Date.now()) + '._', '');
    if (w.notes && w.notes.trim()) out.push('## Notes', '', w.notes.trim(), '');
    if (w.lines.length) {
      out.push('## Saved lines', '');
      w.lines.forEach((l) => out.push(mdQuote(l.text), '>', '> — ' + mdLink(l.title, l.url), ''));
    }
    const withClips = FD.COMMANDERS.filter((c) => w.pins.includes(c.id) || clipsOf(c.id).some((k) => k.ws === w.id));
    if (withClips.length) {
      out.push('## Commander files', '');
      withClips.forEach((c) => {
        const mine = clipsOf(c.id).filter((k) => k.ws === w.id || w.pins.includes(c.id));
        out.push('### ' + c.name, '');
        if (!mine.length) { out.push('_No passages clipped yet._', ''); return; }
        [...FD.CATEGORIES, { id: null, label: 'Unsorted' }].forEach((cat) => {
          const group = mine.filter((k) => (k.category || null) === cat.id);
          if (!group.length) return;
          out.push('#### ' + cat.label, '');
          group.forEach((k) => {
            const stance = k.stance === 'support' ? '**Supports my view.** ' : k.stance === 'challenge' ? '**Challenges my view.** ' : '';
            out.push(mdQuote(k.text), '>', '> — ' + stance + mdLink(k.title, k.url) + ', clipped ' + FD.fmtDate(k.ts), '');
          });
        });
      });
    }
    if (w.kind === 'ulm' && S.state.ulm.runs.length) {
      out.push('## Fog of War: Ulm 1805', '');
      S.state.ulm.runs.forEach((r, i) => {
        const opt = FD.ULM.options.find((o) => o.id === r.choice);
        out.push('### Attempt ' + (i + 1) + ', ' + FD.fmtDate(r.ts), '',
          '- **My move:** ' + (opt ? opt.label : r.choice),
          '- **Why:** ' + (r.why || '(not recorded)'),
          '- **What would change my mind:** ' + (r.changeMind || '(not recorded)'),
          '- **Afterwards:** ' + (r.reflection || '(not recorded)'), '');
      });
      out.push('Sources for the scenario:', '');
      FD.ULM.sources.forEach((s) => out.push('- ' + (s.url ? mdLink(s.title, s.url) : mdEsc(s.title)) + (s.author ? ', ' + s.author : '') + (s.year ? ' (' + s.year + ')' : '')));
      out.push('');
    }
    const web = w.tabs.filter((t) => FD.isWeb(t.url));
    if (web.length) { out.push('## Open tabs', ''); web.forEach((t) => out.push('- ' + mdLink(t.title || FD.host(t.url), t.url))); out.push(''); }
    if (w.trail.nodes.length) {
      out.push('## Trail', '');
      const kids = (p) => w.trail.nodes.filter((n) => n.parent === p);
      const walk = (n, depth) => { out.push('  '.repeat(depth) + '- ' + mdLink(n.title || FD.host(n.url), n.url)); kids(n.id).forEach((k) => walk(k, depth + 1)); };
      kids(null).forEach((n) => walk(n, 0));
      out.push('');
    }
    return out.join('\n');
  };
  FD.exportMarkdown = async function (w) {
    w = w || FD.ws();
    const file = await window.fd.invoke('export:markdown', { name: w.name, content: FD.buildMarkdown(w) });
    if (file) FD.toast('Exported to ' + file);
    return file;
  };

  // ------------------------------------------------------------ the rail
  const ICONS = { notes: '✎', workspaces: '▤', trail: '⑂', bookmarks: '★' };
  FD.renderRail = function () {
    const w = FD.ws(); const d = w.drawer;
    const rail = FD.clear($('rail'));
    rail.hidden = !!w.railCollapsed;
    if (w.railCollapsed) return;
    const twoUp = w.pins.length === 2;
    w.pins.forEach((id) => {
      const c = FD.commander(id);
      const on = d.open && ((d.panel === 'commander' && d.commander === id) || d.panel === 'compare');
      rail.appendChild(h('button', {
        class: 'pin' + (on ? ' on' : '') + (S.flash === id ? ' flash' : ''), title: c.full + ': open file', 'data-commander': id,
        onclick: () => {
          if (twoUp && !(d.open && d.panel === 'commander')) FD.openPanel('compare');
          else FD.openPanel('commander', id);
        }
      },
      h('span', { class: 'pin-portrait', html: FD.portrait(id) }),
      h('span', { class: 'pin-name' }, c.name),
      clipsOf(id).length ? h('span', { class: 'pin-count' }, String(clipsOf(id).length)) : null));
    });
    rail.appendChild(h('button', { class: 'rail-btn' + (d.open && d.panel === 'pin' ? ' on' : ''), title: 'Pin a commander', onclick: () => FD.openPanel('pin') },
      h('span', { class: 'rail-ico' }, '+'), h('span', { class: 'rail-label' }, w.pins.length ? 'Pins' : 'Pin')));
    rail.appendChild(h('div', { class: 'rail-rule' }));
    [['notes', 'Notes'], ['workspaces', 'Desks'], ['trail', 'Trail'], ['bookmarks', 'Marks']].forEach(([p, label]) => {
      rail.appendChild(h('button', { class: 'rail-btn' + (d.open && d.panel === p ? ' on' : ''), title: label, 'data-panel': p, onclick: () => FD.openPanel(p) },
        h('span', { class: 'rail-ico' }, ICONS[p]), h('span', { class: 'rail-label' }, label)));
    });
    rail.appendChild(h('div', { class: 'rail-spring' }));
    rail.appendChild(h('button', { class: 'rail-btn', title: 'Collapse the rail and just browse', onclick: FD.toggleRail },
      h('span', { class: 'rail-ico' }, '»'), h('span', { class: 'rail-label' }, 'Hide')));
  };

  // ------------------------------------------------------------ shared pieces
  function questionField(w) {
    return h('label', { class: 'field' },
      h('span', { class: 'field-label' }, 'Working question'),
      h('textarea', {
        class: 'question', rows: '2', placeholder: 'What are you trying to find out?', value: w.question,
        oninput: (e) => { w.question = e.target.value; FD.touch(); FD.renderToolbar(); }
      }));
  }

  function stanceButtons(get, set) {
    const mk = (val, label, title) => h('button', {
      class: 'stance ' + val + (get() === val ? ' on' : ''), title,
      onclick: (e) => { e.stopPropagation(); set(get() === val ? null : val); FD.renderDrawer(); FD.touch(); }
    }, label);
    return h('span', { class: 'stances' }, mk('support', 'Supports', 'Supports my current view'), mk('challenge', 'Challenges', 'Challenges my current view'));
  }

  function clipCard(commanderId, k, opts) {
    opts = opts || {};
    const list = clipsOf(commanderId);
    return h('article', { class: 'clip' + (k.stance ? ' ' + k.stance : ''), 'data-clip': k.id },
      h('blockquote', { class: 'clip-text', title: 'Open the original source', onclick: () => FD.openSource(k.url, k.text) }, k.text),
      h('div', { class: 'clip-meta' },
        h('a', { href: '#', class: 'clip-src', title: k.url, onclick: (e) => { e.preventDefault(); FD.openSource(k.url, k.text); } }, FD.trunc(k.title || FD.host(k.url), 46)),
        h('span', { class: 'muted' }, ' · ' + FD.host(k.url) + ' · ' + FD.ago(k.ts))),
      h('div', { class: 'clip-tools' },
        stanceButtons(() => k.stance, (v) => { k.stance = v; }),
        h('select', {
          class: 'cat-select', title: 'File under', value: k.category || '',
          onchange: (e) => { k.category = e.target.value || null; FD.renderDrawer(); FD.touch(); }
        }, h('option', { value: '' }, 'Unsorted'), FD.CATEGORIES.map((c) => h('option', { value: c.id }, c.label))),
        h('button', { class: 'x', title: 'Remove this clip', onclick: () => { list.splice(list.indexOf(k), 1); FD.renderRail(); FD.renderDrawer(); FD.touch(); } }, '×')));
  }

  function decisionCard(w, d, compact) {
    return h('article', { class: 'decision' + (w.cardStance[d.id] ? ' ' + w.cardStance[d.id] : '') },
      h('div', { class: 'decision-head' },
        h('span', { class: 'decision-title' }, d.title), h('span', { class: 'decision-when' }, d.when)),
      h('p', { class: 'decision-text' }, d.summary),
      h('div', { class: 'clip-meta' },
        h('span', { class: 'tag' }, 'Field Desk summary'), ' ',
        h('a', { href: '#', class: 'clip-src', title: d.url, onclick: (e) => { e.preventDefault(); FD.openSource(d.url); } }, d.cite)),
      compact ? h('div', { class: 'clip-tools' }, stanceButtons(() => w.cardStance[d.id] || null, (v) => { if (v) w.cardStance[d.id] = v; else delete w.cardStance[d.id]; })) : null);
  }

  function segmented(w) {
    if (w.pins.length < 2) return null;
    const d = w.drawer;
    const btn = (label, on, fn) => h('button', { class: 'seg' + (on ? ' on' : ''), onclick: fn }, label);
    return h('div', { class: 'segmented' },
      w.pins.map((id) => btn(FD.commander(id).name, d.panel === 'commander' && d.commander === id, () => { d.panel = 'commander'; d.commander = id; FD.renderRail(); FD.renderDrawer(); FD.touch(); })),
      btn('Compare', d.panel === 'compare', () => { d.panel = 'compare'; FD.renderRail(); FD.renderDrawer(); FD.touch(); }));
  }

  function head(title, sub, extra) {
    return h('header', { class: 'drawer-head' },
      h('div', null, h('h2', null, title), sub ? h('p', { class: 'muted small' }, sub) : null),
      extra || null,
      h('button', { class: 'x big', title: 'Close the drawer', onclick: FD.toggleDrawer }, '×'));
  }

  // ------------------------------------------------------------ panels
  function panelCommander(w) {
    const c = FD.commander(w.drawer.commander) || FD.commander(w.pins[0]);
    if (!c) return panelPin(w);
    const clips = clipsOf(c.id);
    return [
      h('header', { class: 'drawer-head file-head' },
        h('span', { class: 'file-portrait', html: FD.portrait(c.id) }),
        h('div', null, h('h2', null, c.name), h('p', { class: 'muted small' }, c.full + ' · ' + c.dates), h('p', { class: 'epithet' }, c.epithet)),
        h('button', { class: 'x big', title: 'Close the drawer', onclick: FD.toggleDrawer }, '×')),
      segmented(w),
      questionField(w),
      h('section', null,
        h('h3', null, 'Decisions from the campaigns'),
        c.decisions.map((d) => h('div', null, h('p', { class: 'cat-label' }, catLabel(d.category)), decisionCard(w, d, false)))),
      h('section', null,
        h('h3', null, 'Saved passages', clips.length ? h('span', { class: 'count' }, String(clips.length)) : null),
        clips.length ? clips.map((k) => clipCard(c.id, k)) : h('p', { class: 'empty' }, 'Nothing in ' + c.name + '’s file yet. Select a passage on any page, right-click, and choose “Clip to ' + c.name + '’s file”.')),
      h('p', { class: 'drawer-foot' },
        w.pins.includes(c.id) ? h('button', { class: 'btn quiet', onclick: () => FD.unpin(c.id) }, 'Unpin ' + c.name) : h('button', { class: 'btn', onclick: () => FD.pin(c.id) }, 'Pin ' + c.name),
        w.pins.length < 2 ? h('button', { class: 'btn quiet', onclick: () => FD.openPanel('pin') }, 'Pin a second commander to compare') : null)
    ];
  }

  function panelCompare(w) {
    if (w.pins.length < 2) return panelPin(w);
    const cs = w.pins.map(FD.commander);
    let support = 0, challenge = 0;
    cs.forEach((c) => {
      clipsOf(c.id).forEach((k) => { if (k.stance === 'support') support++; if (k.stance === 'challenge') challenge++; });
      c.decisions.forEach((d) => { if (w.cardStance[d.id] === 'support') support++; if (w.cardStance[d.id] === 'challenge') challenge++; });
    });
    const column = (c) => h('div', { class: 'col', 'data-col': c.id },
      h('div', { class: 'col-head' },
        h('span', { class: 'col-portrait', html: FD.portrait(c.id) }),
        h('div', null, h('strong', null, c.name), h('div', { class: 'muted small' }, c.dates))),
      [...FD.CATEGORIES, { id: null, label: 'Unsorted clips' }].map((cat) => {
        const clips = clipsOf(c.id).filter((k) => (k.category || null) === cat.id);
        const card = cat.id ? c.decisions.find((d) => d.category === cat.id) : null;
        if (!cat.id && !clips.length) return null;
        return h('section', { class: 'cat', 'data-cat': cat.id || 'unsorted' },
          h('h4', null, cat.label, clips.length ? h('span', { class: 'count' }, String(clips.length)) : null),
          clips.map((k) => clipCard(c.id, k)),
          card ? decisionCard(w, card, true) : null,
          cat.id && !clips.length ? h('p', { class: 'empty small' }, 'No clips yet. Right-click a passage and choose “Clip to ' + c.name + ' under ' + cat.label + '”.') : null);
      }));
    return [
      head(cs[0].name + ' and ' + cs[1].name, 'Evidence side by side'),
      segmented(w),
      questionField(w),
      h('label', { class: 'field' },
        h('span', { class: 'field-label' }, 'My current view'),
        h('textarea', { class: 'view', rows: '2', placeholder: 'State your view in a sentence, then mark each piece of evidence as supporting or challenging it.', value: w.view, oninput: (e) => { w.view = e.target.value; FD.touch(); } })),
      h('p', { class: 'tally' },
        h('span', { class: 'tally-support' }, support + ' supporting'), ' · ', h('span', { class: 'tally-challenge' }, challenge + ' challenging')),
      h('div', { class: 'compare' }, column(cs[0]), column(cs[1]))
    ];
  }

  function panelPin(w) {
    return [
      head('Pin a commander', 'Up to two. A pin follows you across tabs and comes back after a restart.'),
      h('div', { class: 'pin-list' }, FD.COMMANDERS.map((c) => {
        const on = w.pins.includes(c.id);
        return h('div', { class: 'pin-row' + (on ? ' on' : '') },
          h('span', { class: 'pin-row-portrait', html: FD.portrait(c.id) }),
          h('div', { class: 'pin-row-text' }, h('strong', null, c.name), h('div', { class: 'muted small' }, c.full + ' · ' + c.dates), h('div', { class: 'small' }, c.epithet),
            h('div', { class: 'muted small' }, clipsOf(c.id).length + ' passage' + (clipsOf(c.id).length === 1 ? '' : 's') + ' on file')),
          h('div', { class: 'pin-row-actions' },
            h('button', { class: 'btn' + (on ? ' quiet' : ' primary'), 'data-pin': c.id, onclick: () => (on ? FD.unpin(c.id) : FD.pin(c.id)) }, on ? 'Unpin' : 'Pin'),
            h('button', { class: 'btn quiet', onclick: () => { w.drawer.panel = 'commander'; w.drawer.commander = c.id; FD.renderRail(); FD.renderDrawer(); } }, 'Open file')));
      })),
      w.pins.length === 2 ? h('p', null, h('button', { class: 'btn primary', onclick: () => FD.openPanel('compare') }, 'Compare ' + w.pins.map((id) => FD.commander(id).name).join(' and '))) : h('p', { class: 'muted small' }, 'Pin two to compare them in this drawer.')
    ];
  }

  function panelNotes(w) {
    return [
      head('Notes', w.name),
      questionField(w),
      h('label', { class: 'field' },
        h('span', { class: 'field-label' }, w.kind === 'translate' ? 'Translation scratchpad' : 'Notes and scratchpad'),
        h('textarea', { class: 'notes', rows: '10', placeholder: 'Think here. Notes stay on this computer and travel with the workspace.', value: w.notes, oninput: (e) => { w.notes = e.target.value; FD.touch(); } })),
      h('section', null,
        h('h3', null, 'Saved lines', w.lines.length ? h('span', { class: 'count' }, String(w.lines.length)) : null),
        h('p', null, h('button', { class: 'btn', onclick: FD.saveSelection }, 'Save the selected line'), ' ', h('span', { class: 'muted small' }, 'or right-click a selection on any page')),
        w.lines.length ? w.lines.map((l) => h('article', { class: 'clip' },
          h('blockquote', { class: 'clip-text', title: 'Open the original source', onclick: () => FD.openSource(l.url, l.text) }, l.text),
          h('div', { class: 'clip-meta' },
            h('a', { href: '#', class: 'clip-src', title: l.url, onclick: (e) => { e.preventDefault(); FD.openSource(l.url, l.text); } }, FD.trunc(l.title || FD.host(l.url), 46)),
            h('span', { class: 'muted' }, ' · ' + FD.ago(l.ts)),
            h('button', { class: 'x', title: 'Remove', onclick: () => { w.lines.splice(w.lines.indexOf(l), 1); FD.renderDrawer(); FD.touch(); } }, '×'))))
          : h('p', { class: 'empty' }, 'No lines saved in this workspace yet.')),
      h('p', { class: 'drawer-foot' }, h('button', { class: 'btn primary', onclick: () => FD.exportMarkdown() }, 'Export notes and clips as Markdown'))
    ];
  }

  function panelWorkspaces(w) {
    const s = S.state;
    let nameEl, qEl;
    const create = (fromTabs) => {
      const name = nameEl.value.trim(); if (!name) { nameEl.focus(); return; }
      const nw = FD.newWorkspace({ name, question: qEl.value.trim() });
      if (fromTabs) {
        // Move the tabs you have open into the new workspace, split view and pins included.
        const keep = w.tabs.map((t) => ({ id: FD.uid('t'), url: t.url, title: t.title, favicon: t.favicon }));
        const idx = (id) => w.tabs.findIndex((t) => t.id === id);
        nw.tabs = keep; nw.active = keep[Math.max(0, idx(w.active))].id;
        nw.split = { on: w.split.on, right: w.split.on ? keep[Math.max(0, idx(w.split.right))].id : null, ratio: w.split.ratio };
        nw.pins = w.pins.slice();
        if (w.kind === 'loose') { nw.notes = w.notes; nw.lines = w.lines; w.notes = ''; w.lines = []; w.tabs.forEach((t) => { if (FD.rt(t.id).made) window.fd.invoke('tab:destroy', { id: t.id }); }); w.tabs = []; w.split.on = false; w.pins = []; }
      }
      nw.drawer = { open: true, panel: 'workspaces', commander: nw.pins[0] || null };
      s.workspaces[nw.id] = nw; s.order.unshift(nw.id);
      FD.openWorkspace(nw.id);
    };
    const layout = (kind) => {
      let nw;
      if (kind === 'translate') {
        nw = FD.newWorkspace({
          name: 'Translation desk', kind: 'translate', question: 'What does the original actually say?',
          tabs: [{ url: 'https://www.thelatinlibrary.com/caesar/gall1.shtml', title: 'Caesar, De Bello Gallico I (Latin)' }, { url: 'https://en.wikisource.org/wiki/Commentaries_on_the_Gallic_War/Book_1', title: 'Gallic War, Book 1 (English)' }],
          split: { rightIndex: 1, ratio: 0.5 }, panel: 'notes', drawerOpen: true,
          notes: 'Original on the left, translation on the right. Replace either page with your own text.\n\nMy rendering:\n'
        });
      } else {
        nw = FD.newWorkspace({ name: 'Speech practice', kind: 'speech', question: w.question || 'Make the case in sixty seconds.', tabs: [{ url: 'fielddesk://speech', title: 'Sixty seconds' }], panel: 'notes' });
      }
      s.workspaces[nw.id] = nw; s.order.unshift(nw.id);
      FD.openWorkspace(nw.id);
    };
    return [
      head('Workspaces', 'A question, its tabs, split view, pins and notes.'),
      h('div', { class: 'ws-list' }, s.order.map((id) => s.workspaces[id]).filter(Boolean).map((x) => {
        const cur = x.id === s.activeWs;
        return h('div', { class: 'ws-row' + (cur ? ' on' : ''), 'data-ws': x.id },
          h('button', { class: 'ws-open', title: cur ? 'You are here' : 'Reopen this workspace', onclick: () => FD.openWorkspace(x.id) },
            h('span', { class: 'ws-name' }, x.name, cur ? h('span', { class: 'tag' }, 'open') : null),
            x.question ? h('span', { class: 'ws-q' }, x.question) : null,
            h('span', { class: 'muted small' },
              x.tabs.length + ' tab' + (x.tabs.length === 1 ? '' : 's') + (x.split.on ? ' · split' : '') +
              (x.pins.length ? ' · ' + x.pins.map((p) => FD.commander(p).name).join(' and ') : '') + ' · ' + FD.ago(x.updatedAt))),
          h('div', { class: 'ws-actions' },
            h('button', { class: 'btn quiet small', title: 'Export notes and clips as Markdown', onclick: () => FD.exportMarkdown(x) }, 'Export'),
            x.kind === 'loose' ? null : h('button', { class: 'btn quiet small', onclick: () => renameRow(x) }, 'Rename'),
            x.kind === 'loose' || cur ? null : h('button', { class: 'btn quiet small danger', onclick: (e) => {
              if (e.target.dataset.sure) { delete s.workspaces[x.id]; s.order = s.order.filter((o) => o !== x.id); if (s.lastWs === x.id) s.lastWs = null; FD.renderDrawer(); FD.save(); }
              else { e.target.dataset.sure = '1'; e.target.textContent = 'Really delete?'; }
            } }, 'Delete')));
      })),
      h('section', { class: 'ws-new' },
        h('h3', null, 'Save a workspace'),
        nameEl = h('input', { type: 'text', class: 'text', placeholder: 'Name, for example “Cannae”', id: 'ws-name' }),
        qEl = h('textarea', { class: 'question', rows: '2', placeholder: 'The question it answers', id: 'ws-question' }),
        h('p', null,
          h('button', { class: 'btn primary', id: 'ws-save', onclick: () => create(true) }, 'Save these tabs as a workspace'), ' ',
          h('button', { class: 'btn', onclick: () => create(false) }, 'Start empty'))),
      h('section', null,
        h('h3', null, 'Ready-made layouts'),
        h('p', null,
          h('button', { class: 'btn', onclick: () => layout('translate') }, 'Translation desk'), ' ',
          h('button', { class: 'btn', onclick: () => layout('speech') }, 'Speech practice')),
        h('p', { class: 'muted small' }, 'Translation: original and translation side by side with a scratchpad. Speech: a 60-second practice timer.'))
    ];
    function renameRow(x) {
      const row = document.querySelector('.ws-row[data-ws="' + x.id + '"] .ws-open'); if (!row) return;
      const input = h('input', { type: 'text', class: 'text', value: x.name });
      const done = () => { const v = input.value.trim(); if (v) x.name = v; FD.renderDrawer(); FD.renderToolbar(); FD.save(); };
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') done(); if (e.key === 'Escape') FD.renderDrawer(); });
      input.addEventListener('blur', done);
      row.replaceWith(input); input.focus(); input.select();
    }
  }

  function panelTrail(w) {
    const tr = w.trail;
    const openUrls = new Set(w.tabs.map((t) => t.url));
    const curIds = new Set(Object.values(tr.cur));
    const kids = (p) => tr.nodes.filter((n) => n.parent === p);
    const row = (n, depth) => {
      const children = kids(n.id);
      const state = curIds.has(n.id) ? 'here' : openUrls.has(n.url) ? 'open' : children.length ? 'passed' : 'left';
      return [h('div', { class: 'trail-row ' + state, style: { paddingLeft: (8 + depth * 16) + 'px' }, title: n.url, onclick: () => FD.openSource(n.url) },
        h('span', { class: 'trail-dot' }),
        h('span', { class: 'trail-title' }, FD.trunc(n.title || FD.host(n.url), 60)),
        h('span', { class: 'trail-host' }, FD.host(n.url)),
        state === 'left' ? h('span', { class: 'tag' }, 'abandoned') : state === 'here' ? h('span', { class: 'tag green' }, 'here') : null),
      children.map((k) => row(k, depth + 1))];
    };
    return [
      head('Rabbit Hole', 'Which source led to which page.'),
      h('label', { class: 'check' },
        h('input', { type: 'checkbox', checked: !!w.rabbit, onchange: (e) => { w.rabbit = e.target.checked; FD.renderDrawer(); FD.touch(); } }),
        ' Record a branching trail for this workspace'),
      tr.nodes.length
        ? h('div', { class: 'trail' }, kids(null).map((n) => row(n, 0)))
        : h('p', { class: 'empty' }, w.rabbit ? 'Nothing recorded yet. Follow a link and the trail starts here. Pages you type into the address bar start a new branch.' : 'Recording is off for this workspace.'),
      tr.nodes.length ? h('p', { class: 'muted small' }, 'Click any page to return to it. “Abandoned” marks a branch you left without following further.') : null,
      tr.nodes.length ? h('p', { class: 'drawer-foot' }, h('button', { class: 'btn quiet', onclick: (e) => {
        if (e.target.dataset.sure) { w.trail = { nodes: [], cur: {} }; FD.renderDrawer(); FD.touch(); } else { e.target.dataset.sure = '1'; e.target.textContent = 'Really clear the trail?'; }
      } }, 'Clear the trail')) : null
    ];
  }

  function panelBookmarks() {
    const s = S.state;
    const row = (x, remove) => h('div', { class: 'mark-row' },
      h('a', { href: '#', class: 'mark-link', title: x.url, onclick: (e) => { e.preventDefault(); if (e.ctrlKey || e.metaKey) FD.newTab(x.url, { background: true }); else FD.navigate(FD.current(), x.url, { typed: true }); } },
        h('span', { class: 'mark-title' }, FD.trunc(x.title || x.url, 52)), h('span', { class: 'mark-host' }, FD.host(x.url))),
      remove ? h('button', { class: 'x', title: 'Remove', onclick: remove }, '×') : null);
    return [
      head('Bookmarks and history', 'Kept on this computer only.'),
      h('section', null, h('h3', null, 'Bookmarks'),
        s.bookmarks.length ? s.bookmarks.map((b) => row(b, () => { s.bookmarks.splice(s.bookmarks.indexOf(b), 1); FD.renderDrawer(); FD.renderToolbar(); FD.save(); }))
          : h('p', { class: 'empty' }, 'Press the star in the address bar to keep a page here.')),
      h('section', null, h('h3', null, 'Recently visited'),
        s.history.length ? s.history.slice(0, 40).map((x) => row(x)) : h('p', { class: 'empty' }, 'Pages you visit will be listed here.'),
        s.history.length ? h('p', null, h('button', { class: 'btn quiet', onclick: () => { s.history = []; FD.renderDrawer(); FD.save(); } }, 'Clear history')) : null),
      h('section', null, h('h3', null, 'Search with'),
        h('select', { class: 'cat-select', value: s.settings.engine, onchange: (e) => { s.settings.engine = e.target.value; FD.save(); } },
          Object.keys(FD.ENGINES).map((k) => h('option', { value: k }, FD.ENGINES[k].name))))
    ];
  }

  const PANELS = { commander: panelCommander, compare: panelCompare, pin: panelPin, notes: panelNotes, workspaces: panelWorkspaces, trail: panelTrail, bookmarks: panelBookmarks };

  FD.renderDrawer = function () {
    const w = FD.ws(); const d = w.drawer;
    const el = $('drawer');
    const open = d.open && !w.railCollapsed;
    if (el.hidden === open) { el.hidden = !open; FD.scheduleLayout(); }
    if (!open) { FD.clear(el); return; }
    // Do not rebuild under someone who is typing in the drawer.
    const active = document.activeElement;
    if (active && el.contains(active) && /^(TEXTAREA|INPUT)$/.test(active.tagName) && el.dataset.panel === d.panel + ':' + (d.commander || '')) return;
    const scroll = el.dataset.panel === d.panel + ':' + (d.commander || '') ? el.scrollTop : 0;
    el.dataset.panel = d.panel + ':' + (d.commander || '');
    el.className = 'panel-' + d.panel;
    FD.clear(el);
    const kids = (PANELS[d.panel] || panelNotes)(w);
    kids.forEach((k) => { if (k) el.appendChild(k); });
    el.scrollTop = scroll;
  };
})();
