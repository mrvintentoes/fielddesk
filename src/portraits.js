'use strict';
/*
 * Portraits. On first launch Field Desk downloads one painting, mosaic, photograph or bust per
 * commander from Wikimedia Commons, keeps it in the app's data folder, and never asks again
 * for the ones it has. Nothing about you is sent: each request names only the picture.
 *
 * Which picture: the lead image of a Wikipedia article chosen here (see LIST). Whether it may be
 * used is decided at download time from the licence Commons itself records for that file:
 *   - public domain or CC0: accepted;
 *   - CC BY / CC BY-SA: accepted only where LIST says `free: true` (photographs of ancient busts,
 *     where the sculpture is ancient but the photograph has an author), and credited as required;
 *   - anything else, or a file hosted on Wikipedia itself as non-free: refused.
 * The credit shown in the app (title, artist, date, licence, link) is what Commons returned.
 * A commander with no acceptable picture keeps the drawn figure.
 *
 * Set FIELDDESK_NO_FETCH=1 to never download.
 */
const fs = require('fs');
const path = require('path');

// `article` is an English Wikipedia title, or several to try in order. `note` is Field Desk's own caveat, shown with the credit.
const LIST = {
  alexander: { article: ['Alexander_Mosaic', 'Alexander_the_Great'], note: 'Roman mosaic of about 100 BC from Pompeii, after a lost Hellenistic painting. Not a life portrait.' },
  hannibal: { article: 'Hannibal', free: true, note: 'Lead image of the Wikipedia article; the Capuan bust is only reputedly Hannibal.' },
  scipio: { article: 'Scipio_Africanus', free: true, note: 'Lead image of the Wikipedia article; the identification of the bust is uncertain.' },
  caesar: { article: 'Julius_Caesar', free: true, note: 'Lead image of the Wikipedia article, expected to be the Tusculum portrait.' },
  belisarius: { article: ['Belisarius_Begging_for_Alms', 'Belisarius'], note: 'Jacques-Louis David, 1781. A later painting of a medieval legend, not a likeness.' },
  saladin: { article: 'Saladin', free: true, note: 'Lead image of the Wikipedia article. No life portrait is known.' },
  genghis: { article: 'Genghis_Khan', note: 'Lead image of the Wikipedia article: a later court portrait, not taken from life.' },
  subutai: { article: 'Subutai', note: 'Lead image of the Wikipedia article. No life portrait is known.' },
  yi: { article: 'Yi_Sun-sin', note: 'Lead image of the Wikipedia article. No life portrait is known.' },
  gustavus: { article: 'Gustavus_Adolphus' },
  turenne: { article: 'Henri_de_La_Tour_d%27Auvergne,_Viscount_of_Turenne' },
  marlborough: { article: 'John_Churchill,_1st_Duke_of_Marlborough' },
  frederick: { article: 'Frederick_the_Great' },
  suvorov: { article: 'Alexander_Suvorov' },
  napoleon: { article: ['The_Emperor_Napoleon_in_His_Study_at_the_Tuileries', 'Napoleon'], note: 'Jacques-Louis David, 1812. National Gallery of Art, Washington.' },
  wellington: { article: ['Portrait_of_the_Duke_of_Wellington_(Goya)', 'Arthur_Wellesley,_1st_Duke_of_Wellington'], note: 'Francisco de Goya, 1812 to 1814. National Gallery, London.' },
  nelson: { article: 'Horatio_Nelson,_1st_Viscount_Nelson' },
  bolivar: { article: 'Sim%C3%B3n_Bol%C3%ADvar', note: 'Lead image of the Wikipedia article; may be a posthumous portrait.' },
  grant: { article: 'Ulysses_S._Grant' }
  // Khalid ibn al-Walid: no likeness exists, and none is fetched.
};

const WIKI = process.env.FIELDDESK_PORTRAIT_WIKI || 'https://en.wikipedia.org';
const COMMONS = process.env.FIELDDESK_PORTRAIT_COMMONS || 'https://commons.wikimedia.org';
const UA = 'FieldDesk/0.1 (desktop app; one-time portrait download)';
const MAX_BYTES = 900 * 1024;
const RETRY_AFTER = 7 * 24 * 3600 * 1000;

const text = (v) => String((v && v.value) || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#0?39;/g, '\'').replace(/\s+/g, ' ').trim().slice(0, 240);

function licenceOk(name, allowFree) {
  const s = String(name || '').trim();
  if (/^(public domain|pd\b|cc0|cc-pd|no restrictions)/i.test(s)) return true;
  return !!allowFree && /^cc[ -]by(-sa)?[ -]\d/i.test(s);
}

module.exports = function createPortraits({ app, net, onReady }) {
  const dir = () => path.join(app.getPath('userData'), 'portraits');
  const indexFile = () => path.join(dir(), 'portraits.json');
  let index = null;
  const load = () => { if (!index) { try { index = JSON.parse(fs.readFileSync(indexFile(), 'utf8')); } catch (_) { index = { checkedAt: 0, items: {}, refused: {} }; } } return index; };
  const save = () => { try { fs.mkdirSync(dir(), { recursive: true }); fs.writeFileSync(indexFile(), JSON.stringify(index, null, 1)); } catch (e) { console.error('portraits: save failed', e.message); } };

  async function getJson(url) {
    const r = await net.fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' }, redirect: 'follow' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  async function fetchOne(id) {
    const want = LIST[id]; const errors = [];
    for (const article of [].concat(want.article)) {
      try { return await fetchFrom(id, want, article); } catch (e) { errors.push(article + ': ' + (e.message || e)); }
    }
    throw new Error(errors.join('; '));
  }
  async function fetchFrom(id, want, article) {
    const summary = await getJson(WIKI + '/api/rest_v1/page/summary/' + article);
    const src = summary && summary.originalimage && summary.originalimage.source;
    if (!src) throw new Error('article has no lead image');
    if (!/\/wikipedia\/commons\//.test(src)) throw new Error('lead image is not on Commons (probably non-free)');
    const name = decodeURIComponent(src.split('/').pop());
    const q = await getJson(COMMONS + '/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url%7Cmime%7Cextmetadata&iiurlwidth=640&titles=' + encodeURIComponent('File:' + name));
    const pages = q && q.query && q.query.pages; const page = pages && pages[Object.keys(pages)[0]];
    const info = page && page.imageinfo && page.imageinfo[0];
    if (!info || !info.thumburl) throw new Error('Commons has no such file');
    const meta = info.extmetadata || {};
    const licence = text(meta.LicenseShortName);
    if (!licenceOk(licence, want.free)) throw new Error('licence not accepted: ' + (licence || 'none recorded'));
    const mime = /png/i.test(info.thumbmime || info.mime || '') && /\.png$/i.test(info.thumburl) ? 'image/png' : 'image/jpeg';
    if (!/\.(jpe?g|png)$/i.test(info.thumburl)) throw new Error('unexpected image type');
    const r = await net.fetch(info.thumburl, { headers: { 'User-Agent': UA } });
    if (!r.ok) throw new Error('image HTTP ' + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 2000 || buf.length > MAX_BYTES) throw new Error('image size ' + buf.length + ' out of range');
    const jpeg = buf[0] === 0xff && buf[1] === 0xd8; const png = buf[0] === 0x89 && buf[1] === 0x50;
    if (!jpeg && !png) throw new Error('not an image');
    const file = id + (png ? '.png' : '.jpg');
    fs.mkdirSync(dir(), { recursive: true });
    fs.writeFileSync(path.join(dir(), file), buf);
    return {
      file, mime: png ? 'image/png' : mime,
      title: text(meta.ObjectName) || name.replace(/\.[a-z]+$/i, '').replace(/_/g, ' '),
      artist: text(meta.Artist), date: text(meta.DateTimeOriginal), credit: text(meta.Credit),
      licence, attribution: text(meta.Attribution),
      source: info.descriptionurl || (COMMONS + '/wiki/File:' + encodeURIComponent(name)),
      note: article === [].concat(want.article)[0] ? (want.note || '') : 'Lead image of the Wikipedia article.', article, fetchedAt: Date.now()
    };
  }

  let running = false;
  async function fetchMissing() {
    if (running || process.env.FIELDDESK_NO_FETCH === '1') return;
    const ix = load();
    const todo = Object.keys(LIST).filter((id) => !ix.items[id]);
    if (!todo.length || Date.now() - (ix.checkedAt || 0) < RETRY_AFTER) return;
    running = true;
    try {
      for (const id of todo) {
        try { ix.items[id] = await fetchOne(id); delete ix.refused[id]; save(); if (onReady) onReady(id); }
        catch (e) { ix.refused[id] = String(e.message || e).slice(0, 200); }
        await new Promise((r) => setTimeout(r, 350));
      }
      ix.checkedAt = Date.now(); save();
    } finally { running = false; }
  }

  function get(id) {
    const it = load().items[id];
    if (!it || !LIST[id]) return null;
    try {
      const buf = fs.readFileSync(path.join(dir(), path.basename(it.file)));
      return { dataUrl: 'data:' + (it.mime || 'image/jpeg') + ';base64,' + buf.toString('base64'), credit: { title: it.title, artist: it.artist, date: it.date, licence: it.licence, attribution: it.attribution, source: it.source, note: it.note } };
    } catch (_) { return null; }
  }

  return { fetchMissing, get, status: () => { const ix = load(); return { have: Object.keys(ix.items), refused: ix.refused, checkedAt: ix.checkedAt }; }, LIST };
};
module.exports.licenceOk = licenceOk;
