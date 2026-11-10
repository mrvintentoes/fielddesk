#!/usr/bin/env node
'use strict';
// Validates app/js/figures/*.js and writes a contact sheet to test/out/figures.html.
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'app', 'js', 'figures');
const out = path.join(__dirname, '..', 'test', 'out');
const figs = {}; const problems = [];
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.js')).sort()) {
  let id = null, svg = null;
  try { new Function('FD', fs.readFileSync(path.join(dir, file), 'utf8'))({ defineFigure: (i, s) => { id = i; svg = s; } }); } catch (e) { problems.push(file + ': ' + e.message); continue; }
  const bad = (m) => problems.push(file + ': ' + m);
  if (!id || !svg) { bad('did not call FD.defineFigure(id, svg)'); continue; }
  if (file !== id + '.js') bad('file name should be ' + id + '.js');
  if (!/^<svg[^>]*viewBox="0 0 240 360"/.test(svg)) bad('needs viewBox="0 0 240 360"');
  if (/<svg[^>]*\s(width|height)=/.test(svg)) bad('no width/height on the svg element');
  for (const [re, what] of [[/\sid=/, 'id attributes'], [/<text/, '<text>'], [/<style/, '<style>'], [/<script/, '<script>'], [/href/, 'href'], [/url\(/, 'url()'], [/<image/, '<image>'], [/<use/, '<use>'], [/Gradient/, 'gradients'], [/filter/, 'filters'], [/<animate/, '<animate>'], [/\son\w+=/, 'event handlers']]) if (re.test(svg)) bad('must not contain ' + what);
  for (const cls of ['fig-breathe', 'fig-eyes']) if (!svg.includes('class="' + cls + '"')) bad('missing <g class="' + cls + '">');
  const n = (svg.match(/<(path|rect|circle|ellipse|polygon|polyline|line)\b/g) || []).length;
  if (n < 40) bad('only ' + n + ' shapes: too sparse'); if (n > 220) bad(n + ' shapes: too heavy');
  if (svg.length > 30000) bad('over 30 KB');
  figs[id] = svg;
}
fs.mkdirSync(out, { recursive: true });
const cell = (id, w) => '<figure style="margin:0;text-align:center;font:12px sans-serif"><div style="width:' + w + 'px">' + figs[id] + '</div>' + id + '</figure>';
fs.writeFileSync(path.join(out, 'figures.html'), '<!doctype html><meta charset="utf-8"><body style="background:#f4ecdd;margin:20px"><div style="display:flex;flex-wrap:wrap;gap:18px;align-items:flex-end">' +
  Object.keys(figs).map((id) => cell(id, 150)).join('') + '</div><hr><div style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end">' + Object.keys(figs).map((id) => cell(id, 90)).join('') + '</div></body>');
console.log(Object.keys(figs).length + ' figures: ' + Object.keys(figs).join(', '));
if (problems.length) { console.log('\nPROBLEMS\n' + problems.map((p) => '  ' + p).join('\n')); process.exit(1); }
