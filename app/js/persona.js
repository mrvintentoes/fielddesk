'use strict';
/*
 * What a pinned commander brings besides a file: a look for the whole app, a few sourced
 * quotes, and the occasional in-character remark about the page in front of you.
 *
 * Remarks are chosen here, on this computer, from lines that ship with the app, by looking
 * only at the page's address and title. Nothing about the page is sent anywhere.
 */
(function () {
  const h = FD.h;
  const S = FD.S;
  const $ = (id) => document.getElementById(id);

  // ------------------------------------------------------------ lead commander and theme
  FD.lead = function () {
    const w = FD.ws();
    if (!w.pins.length) return null;
    return FD.commander(w.pins.includes(w.lead) ? w.lead : w.pins[0]);
  };

  let themeKey = null;
  FD.applyTheme = function () {
    const c = S.state.settings.themes === false ? null : FD.lead();
    const theme = c && c.theme && c.theme.vars ? c.theme : null;
    const key = theme ? c.id : 'default';
    if (key === themeKey) return;
    const root = document.documentElement;
    const prev = themeKey && themeKey !== 'default' ? FD.commander(themeKey) : null;
    if (prev && prev.theme) Object.keys(prev.theme.vars).forEach((k) => root.style.removeProperty(k));
    if (theme) Object.keys(theme.vars).forEach((k) => { if (/^--[a-z0-9-]+$/.test(k) && /^#[0-9a-f]{6}$/i.test(theme.vars[k])) root.style.setProperty(k, theme.vars[k]); });
    root.dataset.theme = key;
    const band = $('band');
    band.style.background = theme && theme.band ? theme.band : '';
    band.title = theme ? theme.label + ' theme, from ' + c.name + '. Change it under Pins.' : '';
    themeKey = key;
    if (S.lastRemark && (!c || S.lastRemark.commander !== c.id)) FD.hideRemark();
  };

  // ------------------------------------------------------------ quotes
  const STATUS = {
    attested: ['Attested', 'green', 'In their own writing or orders, or recorded by a witness'],
    attributed: ['Attributed', '', 'Put in their mouth by a later historian or by tradition'],
    disputed: ['Disputed', 'amber', 'Often repeated, but doubtful']
  };
  FD.quoteCard = function (q, compact) {
    const st = STATUS[q.status] || STATUS.attributed;
    return h('figure', { class: 'quote' + (compact ? ' compact' : '') },
      h('blockquote', null, '“' + q.text + '”'),
      h('figcaption', null,
        q.url ? h('a', { href: '#', class: 'clip-src', title: q.url, onclick: (e) => { e.preventDefault(); FD.openSource(q.url); } }, q.source) : h('span', null, q.source),
        ' ', h('span', { class: 'tag ' + st[1], title: st[2] }, st[0]),
        q.note && !compact ? h('div', { class: 'muted small' }, q.note) : null));
  };
  FD.randomQuote = function (c) {
    if (!c || !c.quotes || !c.quotes.length) return null;
    return c.quotes[Math.floor(Math.random() * c.quotes.length)];
  };

  // ------------------------------------------------------------ remarks
  // Which kind of page is this? Decided from the address and title alone.
  const TOPICS = [
    ['maps', /(^|\.)(maps\.google|openstreetmap|maps\.apple|bing\.com\/maps|mapquest|here\.com|waze)\b|\/maps(\/|$)|\bmaps?\b.*\b(directions|route)\b/i],
    ['encyclopedia', /wikipedia\.org|wikisource\.org|britannica\.com|wiktionary\.org|perseus\.tufts\.edu|penelope\.uchicago\.edu|archive\.org|gutenberg\.org|encyclopedia|livius\.org|worldhistory\.org/i],
    ['mail', /mail\.google|outlook\.(live|office)|mail\.proton|fastmail|mail\.yahoo|\binbox\b|webmail/i],
    ['video', /youtube\.com|youtu\.be|vimeo\.com|twitch\.tv|netflix\.com|dailymotion/i],
    ['social', /(^|\.)(x\.com|twitter\.com|facebook\.com|instagram\.com|reddit\.com|threads\.net|bsky\.app|mastodon|tiktok\.com|linkedin\.com)/i],
    ['code', /github\.com|gitlab\.com|stackoverflow\.com|developer\.mozilla|npmjs\.com|pypi\.org|pkg\.go\.dev|docs\.rs|nodejs\.org|readthedocs/i],
    ['shopping', /amazon\.|ebay\.|etsy\.com|walmart\.com|aliexpress|\b(cart|checkout|basket)\b|shop\./i],
    ['money', /bank|paypal\.com|finance\.yahoo|bloomberg\.com|\b(stocks?|portfolio|markets?)\b|coinbase|wise\.com/i],
    ['weather', /weather|meteo|forecast|accuweather|windy\.com/i],
    ['travel', /booking\.com|airbnb\.|expedia|tripadvisor|kayak\.|skyscanner|\b(flights?|hotels?|itinerary)\b|rail|trainline/i],
    ['sport', /espn\.|bbc\.co\.uk\/sport|\b(football|soccer|cricket|nba|nfl|premier league|formula 1|tennis|olympics)\b/i],
    ['news', /news|nytimes\.com|theguardian\.com|bbc\.(com|co\.uk)|reuters\.com|apnews\.com|washingtonpost|lemonde|spiegel|aljazeera|ft\.com|economist\.com/i],
    ['search', /duckduckgo\.com\/\?|google\.[a-z.]+\/search|bing\.com\/search|search\.brave|[?&](q|query|search)=/i],
    ['history', /\b(battle|siege|campaign|legion|army|war|general|admiral|empire|cavalry|infantry|fortress)\b/i]
  ];
  const wordHit = (words, text) => (words || []).some((w) => w && text.includes(String(w).toLowerCase()));

  FD.classifyPage = function (c, url, title) {
    const text = (String(url) + ' ' + String(title || '')).toLowerCase();
    const out = [];
    if (wordHit(c.selfWords, text)) out.push('self');
    if (wordHit(c.rivalWords, text)) out.push('rival');
    for (const [topic, re] of TOPICS) if (re.test(text)) out.push(topic);
    return out;
  };

  const said = new Set();
  let lastAt = 0, hideTimer = null;

  FD.pickRemark = function (c, url, title, force) {
    if (!c || !c.remarks || !c.remarks.length) return null;
    const topics = FD.classifyPage(c, url, title);
    const fresh = (list) => { const f = list.filter((r) => !said.has(c.id + r.text)); return f.length ? f : list; };
    for (const topic of topics) {
      const pool = c.remarks.filter((r) => r.on === topic);
      if (!pool.length) continue;
      const chance = topic === 'self' || topic === 'rival' ? 0.9 : 0.4;
      if (force || Math.random() < chance) { const f = fresh(pool); return f[Math.floor(Math.random() * f.length)]; }
      break; // the first matching topic gets one roll; otherwise fall through to a general remark
    }
    const any = c.remarks.filter((r) => r.on === 'any');
    if (any.length && (force || Math.random() < 0.12)) { const f = fresh(any); return f[Math.floor(Math.random() * f.length)]; }
    return null;
  };

  FD.showRemark = function (c, remark) {
    const el = $('remark');
    FD.clear(el);
    el.append(
      h('span', { class: 'remark-portrait', html: FD.portrait(c.id) }),
      h('div', { class: 'remark-body' },
        h('div', { class: 'remark-text' }, remark.text),
        h('div', { class: 'remark-by' }, c.name + ', in character. Written for Field Desk, not a quotation.')),
      h('button', { class: 'x', title: 'Dismiss. Remarks can be turned off under Pins.', onclick: () => FD.hideRemark() }, '×'));
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add('show'));
    said.add(c.id + remark.text);
    S.lastRemark = { commander: c.id, text: remark.text, at: Date.now() };
    clearTimeout(hideTimer);
    hideTimer = setTimeout(FD.hideRemark, 11000);
  };
  FD.hideRemark = function () {
    const el = $('remark');
    el.classList.remove('show');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => { el.hidden = true; }, 250);
  };

  // Called a moment after a page arrives in the tab you are looking at.
  FD.maybeRemark = async function (tabId, force) {
    if (S.state.settings.remarks === 'off' && !force) return null;
    const t = FD.tab(tabId); const cur = FD.current();
    if (!t || !cur || cur.id !== tabId || !FD.isWeb(t.url)) return null;
    if (!force && Date.now() - lastAt < 40000) return null;
    const lead = FD.lead(); if (!lead) return null;
    const c = await FD.ensureCommander(lead.id);
    const remark = FD.pickRemark(c, t.url, t.title, force);
    if (!remark) return null;
    lastAt = Date.now();
    FD.showRemark(c, remark);
    return remark;
  };
})();
