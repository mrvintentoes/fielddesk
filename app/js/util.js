'use strict';
window.FD = window.FD || {};

(function () {
  const PROPS = new Set(['value', 'checked', 'disabled', 'selected', 'hidden']);

  // Tiny DOM builder. Text always goes in as text nodes, so clipped passages and page
  // titles from the web can never become markup. `html` is for our own static SVG only.
  FD.h = function (tag, attrs, ...kids) {
    const el = document.createElement(tag);
    const later = [];
    if (attrs) {
      for (const k of Object.keys(attrs)) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (PROPS.has(k)) later.push([k, v]);
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    const add = (kid) => {
      if (kid == null || kid === false) return;
      if (Array.isArray(kid)) kid.forEach(add);
      else el.appendChild(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    };
    kids.forEach(add);
    later.forEach(([k, v]) => { el[k] = v; });
    return el;
  };

  FD.uid = (p) => (p || 'x') + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  FD.clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); return el; };
  FD.isInternal = (u) => /^fielddesk:\/\//i.test(u || '');
  FD.isWeb = (u) => /^https?:\/\//i.test(u || '');

  FD.host = function (u) {
    if (FD.isInternal(u)) return 'Field Desk';
    try { return new URL(u).hostname.replace(/^www\./, ''); } catch (_) { return ''; }
  };

  FD.ENGINES = {
    ddg: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
    google: { name: 'Google', url: 'https://www.google.com/search?q=' },
    bing: { name: 'Bing', url: 'https://www.bing.com/search?q=' },
    wikipedia: { name: 'Wikipedia', url: 'https://en.wikipedia.org/w/index.php?search=' }
  };
  FD.searchUrl = (q, engine) => (FD.ENGINES[engine] || FD.ENGINES.ddg).url + encodeURIComponent(q);

  // Decide whether address-bar input is a place to go or something to search for.
  FD.toUrl = function (input, engine) {
    const s = String(input || '').trim();
    if (!s) return null;
    if (FD.isInternal(s)) return s.toLowerCase();
    if (/^https?:\/\//i.test(s)) return /\s/.test(s) ? encodeURI(s) : s;
    if (/^[a-z][a-z0-9+.-]*:/i.test(s) && !/^localhost(:|$)/i.test(s) && !/^[\w.-]+:\d+/.test(s)) return FD.searchUrl(s, engine);
    if (!/\s/.test(s)) {
      if (/^(localhost|\d{1,3}(\.\d{1,3}){3}|\[[0-9a-f:]+\])(:\d+)?([/?#].*)?$/i.test(s)) return 'http://' + s;
      if (/^[\p{L}\p{N}-]+(\.[\p{L}\p{N}-]+)+(:\d+)?([/?#].*)?$/u.test(s) && /\.[\p{L}]{2,}(:\d+)?([/?#]|$)/u.test(s)) return 'https://' + s;
      if (/^[\w-]+(:\d+)?\/.*$/.test(s)) return 'http://' + s;          // intranet/wiki
    } else if (/^[\w-]+(\.[\w-]+)+\/\S/.test(s)) {
      return 'https://' + encodeURI(s);                               // example.com/a b
    }
    return FD.searchUrl(s, engine);
  };

  FD.fmtDate = function (ts) {
    if (!ts) return '';
    return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  };
  FD.ago = function (ts) {
    const s = Math.max(0, (Date.now() - ts) / 1000);
    if (s < 90) return 'just now';
    if (s < 3600) return Math.round(s / 60) + ' min ago';
    if (s < 86400) return Math.round(s / 3600) + ' h ago';
    if (s < 86400 * 14) return Math.round(s / 86400) + ' d ago';
    return FD.fmtDate(ts);
  };
  FD.trunc = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; };

  // Link to the passage itself where the browser supports text fragments.
  FD.sourceLink = function (url, text) {
    if (!FD.isWeb(url) || url.includes('#')) return url;
    const words = String(text || '').replace(/\s+/g, ' ').trim().split(' ').slice(0, 8).join(' ');
    if (words.length < 12 || /[-,&]/.test(words)) return url;
    return url + '#:~:text=' + encodeURIComponent(words);
  };

  // The "open in a new tab" modifier: Cmd on a Mac (where Ctrl+click is a right-click), Ctrl elsewhere.
  FD.isMac = () => document.documentElement.dataset.platform === 'darwin';
  FD.newTabClick = (e) => (FD.isMac() ? e.metaKey : e.ctrlKey);

  // Drop the text-fragment directive we add when reopening a clip's source.
  FD.cleanUrl = (u) => String(u || '').replace(/#:~:text=[^#]*$/, '');

  FD.debounce = function (fn, ms) {
    let t = null;
    const d = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
    d.flush = (...a) => { clearTimeout(t); fn(...a); };
    return d;
  };
})();
