'use strict';
/* Field Desk's own pages: new tab, the Ulm decision, its reading room, speech practice, about. */
(function () {
  const h = FD.h;
  const S = FD.S;

  FD.refreshPages = function (urlPrefix) {
    FD.ws().tabs.forEach((t) => { if (t.url.startsWith(urlPrefix)) S.pageCache.delete(t.id); });
    FD.renderPanes();
  };

  const kindTag = (kind) => (kind === 'sourced'
    ? h('span', { class: 'tag green', title: 'A historical claim, with sources' }, 'Sourced')
    : h('span', { class: 'tag amber', title: 'A simplification or judgement made for this scenario' }, 'Scenario assumption'));

  // Open a numbered source in the other pane, so the decision stays in view.
  function openRef(t, n) {
    const src = FD.ULM.sources.find((s) => s.n === n); if (!src) return;
    if (!src.url) { FD.toast(src.title + (src.author ? ', ' + src.author : '') + (src.year ? ' (' + src.year + ')' : '') + ' is a printed book'); return; }
    const w = FD.ws();
    if (w.split.on) {
      const other = w.active === t.id ? FD.tab(w.split.right) : FD.tab(w.active);
      if (other && other.id !== t.id) { FD.navigate(other, src.url); return; }
    }
    FD.newTab(src.url, { split: true, openerId: t.id });
  }
  const refs = (t, list) => (list && list.length ? h('span', { class: 'refs' }, list.map((n) => {
    const src = FD.ULM.sources.find((s) => s.n === n);
    return h('a', { href: '#', class: 'ref', title: src ? src.title + (src.author ? ', ' + src.author : '') : '', onclick: (e) => { e.preventDefault(); openRef(t, n); } }, '[' + n + ']');
  })) : null);

  // ------------------------------------------------------------ new tab
  function pageNewTab(t) {
    const s = S.state; const w = FD.ws();
    const page = h('div', { class: 'page page-newtab' });
    const draw = () => {
      FD.clear(page);
      const resume = FD.resumeTarget();
      let adding = false;
      const go = (q) => { const url = FD.toUrl(q, s.settings.engine); if (url) FD.navigate(t, url, { typed: true }); };
      const search = h('input', {
        type: 'text', class: 'nt-search', placeholder: 'Search with ' + FD.ENGINES[s.settings.engine].name + ' or enter an address', spellcheck: 'false',
        onkeydown: (e) => { if (e.key === 'Enter' && e.target.value.trim()) go(e.target.value); }
      });
      const tiles = h('div', { class: 'nt-tiles' });
      const drawTiles = () => {
        FD.clear(tiles);
        s.pinnedSites.forEach((p, i) => tiles.appendChild(h('div', { class: 'tile' },
          FD.link(t, p.url, [h('span', { class: 'tile-mono' }, (p.title || FD.host(p.url)).slice(0, 1).toUpperCase()), h('span', { class: 'tile-title' }, p.title || FD.host(p.url)), h('span', { class: 'tile-host' }, FD.host(p.url))], 'tile-link'),
          h('button', { class: 'x tile-x', title: 'Unpin this site', onclick: () => { s.pinnedSites.splice(i, 1); drawTiles(); FD.save(); } }, '×'))));
        if (adding) {
          let nameEl, urlEl;
          const add = () => {
            const url = FD.toUrl(urlEl.value, s.settings.engine);
            if (!url || !FD.isWeb(url) || url.startsWith(FD.ENGINES[s.settings.engine].url)) { urlEl.focus(); return; }
            s.pinnedSites.push({ title: nameEl.value.trim() || FD.host(url), url }); adding = false; drawTiles(); FD.save();
          };
          tiles.appendChild(h('div', { class: 'tile tile-form' },
            urlEl = h('input', { type: 'text', class: 'text', placeholder: 'Address', onkeydown: (e) => { if (e.key === 'Enter') add(); } }),
            nameEl = h('input', { type: 'text', class: 'text', placeholder: 'Name (optional)', onkeydown: (e) => { if (e.key === 'Enter') add(); } }),
            h('div', null, h('button', { class: 'btn primary small', onclick: add }, 'Pin'), ' ', h('button', { class: 'btn quiet small', onclick: () => { adding = false; drawTiles(); } }, 'Cancel'))));
          setTimeout(() => urlEl.focus(), 0);
        } else {
          tiles.appendChild(h('button', { class: 'tile tile-add', onclick: () => { adding = true; drawTiles(); } }, h('span', { class: 'tile-mono' }, '+'), h('span', { class: 'tile-title' }, 'Pin a site')));
        }
      };
      drawTiles();
      const others = s.order.map((id) => s.workspaces[id]).filter((x) => x && x.id !== w.id && x.kind !== 'loose' && (!resume || x.id !== resume.id)).slice(0, 4);
      page.appendChild(h('div', { class: 'page-inner nt' },
        h('div', { class: 'nt-mark' }, 'Field Desk'),
        w.kind === 'loose' ? h('p', { class: 'nt-sub' }, 'One question, twenty tabs.') : h('p', { class: 'nt-sub' }, w.name + (w.question ? ': ' + w.question : '')),
        search,
        resume ? h('button', { class: 'nt-resume', id: 'resume-btn', title: 'Reopen this workspace with its tabs, split view, pins and notes', onclick: () => FD.openWorkspace(resume.id) },
          h('span', { class: 'nt-resume-label' }, 'Resume'),
          h('span', { class: 'nt-resume-name' }, resume.name),
          resume.question ? h('span', { class: 'nt-resume-q' }, resume.question) : null,
          h('span', { class: 'muted small' }, resume.tabs.length + ' tab' + (resume.tabs.length === 1 ? '' : 's') + ' · last open ' + FD.ago(resume.updatedAt))) : null,
        h('h3', { class: 'nt-h' }, 'Pinned sites'),
        tiles,
        others.length ? h('h3', { class: 'nt-h' }, 'Other workspaces') : null,
        others.length ? h('div', { class: 'nt-ws' }, others.map((x) => h('button', { class: 'nt-ws-row', onclick: () => FD.openWorkspace(x.id) },
          h('strong', null, x.name), x.question ? h('span', { class: 'muted' }, ' · ' + FD.trunc(x.question, 70)) : null))) : null,
        h('p', { class: 'nt-foot muted small' },
          'Pin a commander from the rail on the right. Select text on any page and right-click to clip it. ',
          FD.link(t, 'fielddesk://about', 'Shortcuts and privacy'))));
    };
    draw();
    return page;
  }

  // ------------------------------------------------------------ Ulm
  function pageUlm(t) {
    const U = FD.ULM; const u = S.state.ulm;
    const page = h('div', { class: 'page page-ulm' });
    let view = u.committed ? 4 : Math.min(u.stage, 3);
    const saveRun = () => { const run = u.runs[u.runs.length - 1]; if (run) run.reflection = u.reflection; FD.save(); };

    const draw = () => {
      const scroll = page.scrollTop;
      FD.clear(page);
      const maxStage = u.committed ? 4 : u.stage;
      const steps = U.stages.map((s, i) => ({ n: i + 1, label: s.label, date: s.date })).concat([{ n: 4, label: 'What happened', date: 'To 20 October 1805' }]);
      const inner = h('div', { class: 'page-inner ulm' });
      inner.append(
        h('p', { class: 'eyebrow' }, 'A playable decision'),
        h('h1', null, U.title),
        h('p', { class: 'lede' }, U.role),
        h('p', null, U.premise),
        h('p', { class: 'legend' }, kindTag('sourced'), ' a historical claim; the numbers open its source in the other pane. ', kindTag('assumption'), ' our simplification or judgement.'),
        h('ol', { class: 'stepper' }, steps.map((s) => h('li', {
          class: 'step' + (s.n === view ? ' on' : '') + (s.n > maxStage ? ' locked' : ''),
          title: s.n > maxStage ? 'Not yet known' : s.date,
          onclick: () => { if (s.n <= maxStage) { view = s.n; draw(); } }
        }, h('span', { class: 'step-n' }, String(s.n)), h('span', { class: 'step-label' }, s.label)))),
        h('figure', { class: 'map', html: U.map(view, u.choice) }));

      if (view <= 3) {
        const st = U.stages[view - 1];
        inner.append(
          h('h2', null, st.label, h('span', { class: 'h-date' }, st.date)),
          h('p', null, st.intro),
          h('ul', { class: 'intel' }, st.intel.map((it) => h('li', { class: 'intel-item ' + it.kind },
            h('div', null, it.text, ' ', refs(t, it.refs)),
            h('div', { class: 'intel-meta' }, kindTag(it.kind), it.note ? h('span', { class: 'muted small' }, ' ' + it.note) : null)))));
      }
      if (view < 3) {
        inner.append(h('p', { class: 'actions' }, h('button', { class: 'btn primary', id: 'ulm-next', onclick: () => { u.stage = Math.max(u.stage, view + 1); view += 1; FD.save(); draw(); page.scrollTop = 0; FD.refreshPages('fielddesk://sources'); } }, view === 1 ? 'Next: the reports of 7–8 October' : 'Next: decide')));
      }
      if (view === 3) {
        const locked = u.committed;
        inner.append(
          h('h2', null, 'Commit to a move'),
          h('div', { class: 'options' }, U.options.map((o) => h('label', { class: 'option' + (u.choice === o.id ? ' on' : '') + (locked ? ' locked' : '') },
            h('input', { type: 'radio', name: 'ulm-choice', value: o.id, checked: u.choice === o.id, disabled: locked, onchange: () => { u.choice = o.id; FD.save(); draw(); } }),
            h('div', null, h('strong', null, o.label), h('p', null, o.summary), h('p', { class: 'muted small' }, 'Risk: ' + o.risk))))),
          h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'Why this move?'),
            h('textarea', { rows: '3', id: 'ulm-why', disabled: locked, placeholder: 'What are you betting on?', value: u.why, oninput: (e) => { u.why = e.target.value; FD.save(); } })),
          h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'What would make you change your mind?'),
            h('textarea', { rows: '3', id: 'ulm-change', disabled: locked, placeholder: 'Name the report that would turn you around. You will be held to it.', value: u.changeMind, oninput: (e) => { u.changeMind = e.target.value; FD.save(); const b = page.querySelector('#ulm-commit'); if (b) b.disabled = !(u.choice && u.changeMind.trim()); } })),
          locked
            ? h('p', { class: 'actions' }, h('button', { class: 'btn primary', onclick: () => { view = 4; draw(); page.scrollTop = 0; } }, 'See what happened'))
            : h('p', { class: 'actions' },
              h('button', { class: 'btn primary', id: 'ulm-commit', disabled: !(u.choice && u.changeMind.trim()), onclick: () => {
                u.committed = true; u.stage = 4; u.reflection = '';
                u.runs.push({ ts: Date.now(), choice: u.choice, why: u.why.trim(), changeMind: u.changeMind.trim(), reflection: '' });
                view = 4; FD.touch(); draw(); page.scrollTop = 0; FD.refreshPages('fielddesk://sources');
              } }, 'Commit and reveal'),
              h('span', { class: 'muted small' }, ' Choose a move and say what would change your mind. There is no undo.')));
      }
      if (view === 4) {
        const O = U.outcome; const opt = U.options.find((o) => o.id === u.choice); const v = O.verdicts[u.choice];
        inner.append(
          h('h2', null, 'What happened', h('span', { class: 'h-date' }, 'To 20 October 1805')),
          h('p', { class: 'lede' }, O.summary),
          h('ol', { class: 'timeline' }, O.timeline.map((e) => h('li', null, h('span', { class: 'tl-date' }, e.date), h('span', null, e.text, ' ', refs(t, e.refs), ' ', e.kind === 'assumption' ? kindTag('assumption') : null)))),
          h('p', null, O.historicalChoice),
          h('h2', null, 'Your move'),
          h('div', { class: 'verdict' },
            h('p', { class: 'eyebrow' }, opt ? opt.label : ''),
            h('h3', null, v.headline, ' ', kindTag(v.kind)),
            h('p', null, v.text, ' ', refs(t, v.refs))),
          h('div', { class: 'recap' },
            h('p', null, h('strong', null, 'Why you chose it: '), u.why || 'not recorded'),
            h('p', null, h('strong', null, 'What you said would change your mind: '), u.changeMind || 'not recorded')),
          h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'Looking back: did that report ever come, and would you have acted on it?'),
            h('textarea', { rows: '4', id: 'ulm-reflection', placeholder: 'Your reasoning is saved with this workspace and goes into the Markdown export.', value: u.reflection, oninput: (e) => { u.reflection = e.target.value; saveRun(); } })),
          h('p', { class: 'muted small' }, 'Saved to the Fog of War workspace. Attempt ' + u.runs.length + '.'),
          h('details', { class: 'others' }, h('summary', null, 'The roads not taken'),
            U.options.filter((o) => o.id !== u.choice).map((o) => { const x = O.verdicts[o.id]; return h('div', { class: 'verdict small' }, h('p', { class: 'eyebrow' }, o.label), h('h3', null, x.headline, ' ', kindTag(x.kind)), h('p', null, x.text, ' ', refs(t, x.refs))); })),
          h('p', { class: 'actions' },
            h('button', { class: 'btn', onclick: () => FD.exportMarkdown() }, 'Export my reasoning as Markdown'), ' ',
            h('button', { class: 'btn quiet', id: 'ulm-again', onclick: () => { u.stage = 1; u.choice = null; u.why = ''; u.changeMind = ''; u.reflection = ''; u.committed = false; view = 1; FD.save(); draw(); page.scrollTop = 0; FD.refreshPages('fielddesk://sources'); } }, 'Play it again')));
      }
      inner.append(h('details', { class: 'assumptions' }, h('summary', null, 'What this scenario assumes'),
        h('ul', null, U.assumptions.map((a) => h('li', null, a)))));
      page.appendChild(inner);
      page.scrollTop = scroll;
    };
    draw();
    return page;
  }

  function pageUlmSources(t) {
    const U = FD.ULM; const u = S.state.ulm;
    return h('div', { class: 'page page-sources' }, h('div', { class: 'page-inner narrow' },
      h('p', { class: 'eyebrow' }, 'Reading room'),
      h('h1', null, 'Sources for Ulm, 1805'),
      u.committed
        ? h('p', { class: 'notice ok' }, 'You have committed. Read freely, and clip what you find to a commander’s file.')
        : h('p', { class: 'notice' }, 'These accounts cover the whole campaign, including how it ended. Opening one before you commit lifts the fog. That is your call to make.'),
      h('p', null, 'Each link opens here, in this pane, so the map and the decision stay beside it. Use Back to return to this list. Select any passage and right-click to clip it.'),
      h('ol', { class: 'sources' }, U.sources.map((s) => h('li', { class: 'source', value: String(s.n) },
        h('div', { class: 'source-title' }, s.url ? FD.link(t, s.url, s.title) : h('span', null, s.title),
          s.kind === 'print' ? h('span', { class: 'tag' }, 'print') : null),
        h('div', { class: 'muted small' }, [s.author, s.year].filter(Boolean).join(', ')),
        s.note ? h('div', { class: 'small' }, s.note) : null))),
      h('h2', null, 'What the scenario assumes'),
      h('ul', null, U.assumptions.map((a) => h('li', null, a))),
      h('p', { class: 'muted small' }, 'Summaries in the scenario are Field Desk’s own wording, not quotations. Figures are approximate and vary between accounts.')));
  }

  // ------------------------------------------------------------ speech practice
  function pageSpeech(t) {
    const w = FD.ws();
    const page = h('div', { class: 'page page-speech' });
    const TOTAL = 60;
    let left = TOTAL, timer = null, startedAt = 0, base = TOTAL;
    const R = 88, C = 2 * Math.PI * R;
    const clock = h('div', { class: 'clock' });
    clock.innerHTML = '<svg viewBox="0 0 200 200" aria-hidden="true"><circle class="ring-bg" cx="100" cy="100" r="' + R + '"/><circle class="ring" cx="100" cy="100" r="' + R + '" transform="rotate(-90 100 100)" stroke-dasharray="' + C + '" stroke-dashoffset="0"/></svg>';
    const num = h('div', { class: 'clock-num', id: 'speech-left' }, '60');
    clock.appendChild(num);
    const log = h('div', { class: 'attempts' });
    const startBtn = h('button', { class: 'btn primary', id: 'speech-start' }, 'Start');
    const paint = () => {
      num.textContent = String(Math.ceil(left));
      clock.querySelector('.ring').setAttribute('stroke-dashoffset', String(C * (1 - left / TOTAL)));
      clock.classList.toggle('last', left <= 10 && left > 0);
      clock.classList.toggle('done', left <= 0);
      startBtn.textContent = timer ? 'Pause' : (left < TOTAL && left > 0 ? 'Resume' : 'Start');
    };
    const drawLog = () => {
      FD.clear(log);
      const a = w.speech.attempts;
      log.appendChild(h('h3', null, 'Attempts', a.length ? h('span', { class: 'count' }, String(a.length)) : null));
      if (!a.length) log.appendChild(h('p', { class: 'empty' }, 'No attempts yet. Say it out loud; reading it silently does not count.'));
      a.slice(0, 8).forEach((x) => log.appendChild(h('div', { class: 'attempt' }, h('span', null, x.full ? 'Full minute' : 'Stopped at ' + x.secs + ' s'), h('span', { class: 'muted small' }, ' · ' + FD.ago(x.ts)))));
    };
    const beep = () => {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = 660; g.gain.setValueAtTime(0.12, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9);
        o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.9);
      } catch (_) {}
    };
    const stop = (record) => {
      clearInterval(timer); timer = null;
      if (record && left < TOTAL) { w.speech.attempts.unshift({ ts: Date.now(), secs: Math.round(TOTAL - left), full: left <= 0 }); w.speech.attempts = w.speech.attempts.slice(0, 50); FD.touch(); drawLog(); }
      paint();
    };
    const tick = () => {
      if (!page.isConnected) { clearInterval(timer); timer = null; return; }
      left = Math.max(0, base - (Date.now() - startedAt) / 1000);
      if (left <= 0) { stop(true); beep(); }
      paint();
    };
    startBtn.onclick = () => {
      if (timer) { clearInterval(timer); timer = null; paint(); return; }
      if (left <= 0) left = TOTAL;
      base = left; startedAt = Date.now(); timer = setInterval(tick, 100); paint();
    };
    page.appendChild(h('div', { class: 'page-inner narrow speech' },
      h('p', { class: 'eyebrow' }, 'Speech practice'),
      h('h1', null, 'Sixty seconds'),
      h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'The case you are making'),
        h('textarea', { class: 'question', rows: '2', value: w.question, placeholder: 'One sentence.', oninput: (e) => { w.question = e.target.value; FD.touch(); } })),
      clock,
      h('p', { class: 'actions centre' }, startBtn, ' ',
        h('button', { class: 'btn', id: 'speech-reset', onclick: () => { stop(true); left = TOTAL; paint(); } }, 'Stop and reset')),
      h('label', { class: 'field' }, h('span', { class: 'field-label' }, 'Three points, no more'),
        h('textarea', { rows: '5', value: w.speech.points, placeholder: '1.\n2.\n3.', oninput: (e) => { w.speech.points = e.target.value; FD.touch(); } })),
      log));
    paint(); drawLog();
    return page;
  }

  // ------------------------------------------------------------ about
  function pageAbout(t) {
    const mac = /Mac/.test(navigator.platform);
    const k = (s) => h('kbd', null, mac ? s.replace(/Ctrl\+/g, '⌘').replace(/Alt\+/g, '⌥').replace(/Shift\+/g, '⇧') : s);
    const rows = [
      ['New tab', 'Ctrl+T'], ['Close tab', 'Ctrl+W'], ['Reopen closed tab', 'Ctrl+Shift+T'], ['Address and search bar', 'Ctrl+L'],
      ['Next and previous tab', mac ? 'Ctrl+Tab, Ctrl+Shift+Tab' : 'Ctrl+Tab, Ctrl+Shift+Tab'], ['Jump to tab 1 to 8, last tab', 'Ctrl+1 … Ctrl+9'],
      ['Back and forward', mac ? 'Ctrl+[ , Ctrl+]' : 'Alt+Left, Alt+Right'], ['Reload', 'Ctrl+R'], ['Find in page', 'Ctrl+F'], ['Bookmark this page', 'Ctrl+D'],
      ['Zoom in, out, reset', 'Ctrl+= , Ctrl+- , Ctrl+0'], ['Split view', 'Ctrl+\\'], ['Collapse or show the desk rail', 'Ctrl+.'], ['Open or close the drawer', 'Ctrl+Shift+.'],
      ['Save the selected line to notes', 'Ctrl+Shift+L'], ['Export notes as Markdown', 'Ctrl+Shift+E']
    ];
    return h('div', { class: 'page' }, h('div', { class: 'page-inner narrow' },
      h('p', { class: 'eyebrow' }, 'About'),
      h('h1', null, 'Field Desk'),
      h('p', { class: 'lede' }, 'A browser for following one question across twenty tabs.'),
      h('h2', null, 'Shortcuts'),
      h('table', { class: 'keys' }, rows.map(([label, keys]) => h('tr', null, h('td', null, label), h('td', null, k(keys))))),
      h('p', { class: 'muted small' }, 'Hold ' + (mac ? '⌘' : 'Ctrl') + ' while clicking a link, or middle-click it, to open it in a new tab.'),
      h('h2', null, 'Where your things are kept'),
      h('p', null, 'Tabs, workspaces, notes, clips, bookmarks and history are stored in one file on this computer. Nothing is sent to a Field Desk server; there is none. Web pages run in their own sandboxed, isolated process with no access to your notes or to the app itself, and are refused camera, microphone, location and notification access.'),
      h('h2', null, 'A note on the history'),
      h('p', null, 'Commander decision cards and the Ulm scenario are Field Desk’s own summaries with a citation and a link, not quotations. Check them against the source before you rely on them.')));
  }

  const PAGES = {
    'fielddesk://newtab': pageNewTab, 'fielddesk://ulm': pageUlm, 'fielddesk://sources/ulm': pageUlmSources,
    'fielddesk://speech': pageSpeech, 'fielddesk://about': pageAbout
  };
  FD.renderPage = function (t) {
    const fn = PAGES[t.url];
    if (fn) return fn(t);
    return h('div', { class: 'page' }, h('div', { class: 'page-inner narrow' }, h('h1', null, 'No such page'), h('p', null, 'Field Desk has no page at ', h('span', { class: 'mono' }, t.url), '.'), h('p', null, FD.link(t, 'fielddesk://newtab', 'Open a new tab page'))));
  };
})();
