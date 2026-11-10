#!/usr/bin/env node
'use strict';
/*
 * Regenerates app/js/commanders-index.js from the per-commander files in app/js/commanders/.
 * Run after adding or editing a commander:  node tools/build-commanders.js
 * The index holds only what the app needs at startup; everything else stays in the per-commander file.
 */
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'app', 'js', 'commanders');
const ORDER = ['alexander', 'hannibal', 'scipio', 'caesar', 'belisarius', 'khalid', 'saladin', 'genghis', 'subutai', 'yi',
  'gustavus', 'turenne', 'marlborough', 'frederick', 'suvorov', 'napoleon', 'wellington', 'nelson', 'bolivar', 'grant'];
const CATS = ['intelligence', 'tempo', 'logistics', 'recovery'];
const VARS = ['--paper', '--paper-2', '--paper-3', '--card', '--ink', '--ink-2', '--ink-3', '--rule', '--accent', '--accent-soft', '--green', '--green-soft', '--brass', '--amber-soft', '--blue'];
const TOPICS = ['maps', 'encyclopedia', 'news', 'shopping', 'social', 'video', 'mail', 'code', 'search', 'weather', 'money', 'travel', 'sport', 'history', 'self', 'rival', 'any'];

const lum = (hex) => { const n = parseInt(hex.slice(1), 16); const c = [n >> 16 & 255, n >> 8 & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

const found = {}; const problems = [];
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.js'))) {
  let data = null;
  const FD = { defineCommander: (d) => { data = d; } };
  try { new Function('FD', 'window', fs.readFileSync(path.join(dir, file), 'utf8'))(FD, { FD }); } catch (e) { problems.push(file + ': ' + e.message); continue; }
  if (!data) { problems.push(file + ': did not call FD.defineCommander'); continue; }
  const bad = (m) => problems.push(data.id + ': ' + m);
  if (file !== data.id + '.js') bad('file name should be ' + data.id + '.js');
  for (const k of ['name', 'full', 'dates', 'epithet', 'era', 'tone', 'portrait']) if (!data[k]) bad('missing ' + k);
  if ((data.decisions || []).map((d) => d.category).join() !== CATS.join()) bad('needs one decision per category, in order');
  (data.decisions || []).forEach((d) => { for (const k of ['id', 'title', 'when', 'summary', 'cite', 'url']) if (!d[k]) bad('decision missing ' + k); if (!/^https:\/\//.test(d.url || '')) bad('decision url must be https'); if (d.id !== data.id + '-' + d.category) bad('decision id ' + d.id); });
  if (!(data.quotes || []).length) bad('needs quotes');
  (data.quotes || []).forEach((q) => { if (!q.text || !q.source || !['attested', 'attributed', 'disputed'].includes(q.status)) bad('quote needs text, source and status'); });
  if ((data.remarks || []).length < 10) bad('needs at least 10 remarks');
  (data.remarks || []).forEach((r) => { if (!TOPICS.includes(r.on) || !r.text) bad('remark topic ' + r.on); if (r.text && r.text.length > 150) bad('remark too long: ' + r.text.slice(0, 30)); });
  if (!(data.remarks || []).some((r) => r.on === 'any')) bad('needs remarks for topic "any"');
  const t = data.theme || {}; const v = t.vars || {};
  if (!t.label) bad('theme needs a label');
  for (const k of VARS) if (!/^#[0-9a-f]{6}$/i.test(v[k] || '')) bad('theme var ' + k + ' must be a 6-digit hex colour');
  if (!problems.some((p) => p.startsWith(data.id + ': theme var'))) {
    if (lum(v['--paper']) < 0.72) bad('theme paper too dark (keep the reading room light)');
    for (const bg of ['--paper', '--card', '--paper-2']) {
      if (contrast(v['--ink'], v[bg]) < 9) bad('ink on ' + bg + ' contrast ' + contrast(v['--ink'], v[bg]).toFixed(1) + ' < 9');
      if (contrast(v['--ink-2'], v[bg]) < 5) bad('ink-2 on ' + bg + ' contrast < 5');
      if (contrast(v['--accent'], v[bg]) < 4.5) bad('accent on ' + bg + ' contrast ' + contrast(v['--accent'], v[bg]).toFixed(1) + ' < 4.5');
      if (contrast(v['--blue'], v[bg]) < 4.5) bad('blue (link colour) on ' + bg + ' contrast < 4.5');
      if (contrast(v['--green'], v[bg]) < 4.5) bad('green on ' + bg + ' contrast < 4.5');
    }
    if (contrast(v['--ink-3'], v['--paper']) < 3) bad('ink-3 on paper contrast < 3');
    if (contrast('#ffffff', v['--accent']) < 4.5) bad('white on accent contrast < 4.5');
    if (contrast('#ffffff', v['--green']) < 4.5) bad('white on green contrast < 4.5');
  }
  if (/<script|href=|url\(|\sid=|<text|\swidth=|\sheight="\d+"\s*viewBox/i.test(data.portrait || '')) bad('portrait must have no script, links, ids, text or fixed size');
  found[data.id] = data;
}
const ids = ORDER.filter((id) => found[id]).concat(Object.keys(found).filter((id) => !ORDER.includes(id)));
const index = ids.map((id) => { const d = found[id]; return { id, name: d.name, full: d.full, dates: d.dates, epithet: d.epithet, era: d.era, tone: d.tone, selfWords: d.selfWords || [d.name], rivalWords: d.rivalWords || [], theme: d.theme }; });
fs.writeFileSync(path.join(dir, '..', 'commanders-index.js'),
  "'use strict';\n// GENERATED by tools/build-commanders.js from app/js/commanders/*.js. Do not edit by hand.\nwindow.FD = window.FD || {};\nFD.COMMANDER_INDEX = " + JSON.stringify(index, null, 1) + ';\n');
console.log(ids.length + ' commanders: ' + ids.join(', '));
if (problems.length) { console.log('\nPROBLEMS\n' + problems.map((p) => '  ' + p).join('\n')); process.exit(1); }
