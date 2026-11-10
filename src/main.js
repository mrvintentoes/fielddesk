'use strict';
/*
 * Field Desk main process.
 *
 * Security model
 *  - The app's own UI runs in the BrowserWindow with a small preload bridge (src/preload.js).
 *  - Every external page runs in its own WebContentsView: sandboxed, context-isolated,
 *    no Node, no preload, in a separate persistent session ("persist:web"). Web pages
 *    therefore have no route to the app's IPC or to the notes/state file.
 *  - All browsing data and notes stay on this machine, under the app's userData folder.
 */
const { app, BrowserWindow, WebContentsView, ipcMain, Menu, dialog, session, clipboard, shell, net } = require('electron');
let portraits = null;
const path = require('path');
const fs = require('fs');

app.setName('Field Desk');
// Lighter Chromium: no idle spare page process, no background fetches, a bounded disk cache.
app.commandLine.appendSwitch('disable-features', 'SpareRendererForSitePerProcess,MediaRouter,Translate,OptimizationHints,AutofillServerCommunication,InterestFeedContentSuggestions');
app.commandLine.appendSwitch('disable-background-networking');
app.commandLine.appendSwitch('disable-component-update');
app.commandLine.appendSwitch('disk-cache-size', String(120 * 1024 * 1024));
if (process.env.FIELDDESK_USER_DATA) app.setPath('userData', path.resolve(process.env.FIELDDESK_USER_DATA));

const isMac = process.platform === 'darwin';
const WEB_PARTITION = 'persist:web';
const CATEGORIES = [
  ['intelligence', 'Intelligence'], ['tempo', 'Marching tempo'],
  ['logistics', 'Logistics'], ['recovery', 'Recovery after setbacks']
];

let win = null;
const tabs = new Map();          // tab id -> { view, id }
let layout = { panes: [] };      // what the UI last asked to be visible
let frozen = false;
let freezeWanted = false;
let pinInfo = { pinned: [], all: [] };
let lastContextMenu = null;      // kept so tests can exercise the real menu

// ---------------------------------------------------------------- state file
const stateFile = () => path.join(app.getPath('userData'), 'field-desk.json');
const windowFile = () => path.join(app.getPath('userData'), 'window.json');
let pendingState = null;
let saveTimer = null;

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) {
    if (e.code !== 'ENOENT') { try { fs.renameSync(file, file + '.unreadable-' + Date.now()); } catch (_) {} }
    return null;
  }
}
function writeJson(file, data) {
  const tmp = file + '.tmp';
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(tmp, JSON.stringify(data));
  fs.renameSync(tmp, file);
}
function flushState() {
  clearTimeout(saveTimer); saveTimer = null;
  if (pendingState) { try { writeJson(stateFile(), pendingState); } catch (e) { console.error('save failed', e); } pendingState = null; }
}
function queueState(state) {
  pendingState = state;
  if (!saveTimer) saveTimer = setTimeout(flushState, 120);
}

// ---------------------------------------------------------------- helpers
const ui = () => (win && !win.isDestroyed() ? win.webContents : null);
function send(channel, payload) { const w = ui(); if (w && !w.isDestroyed()) w.send(channel, payload); }
function fromUi(e) {
  return !!win && !win.isDestroyed() && e.sender === win.webContents && (!e.senderFrame || e.senderFrame === win.webContents.mainFrame);
}
function handle(channel, fn) {
  ipcMain.handle(channel, (e, payload) => { if (!fromUi(e)) throw new Error('forbidden'); return fn(payload || {}); });
}
const isWebUrl = (u) => /^https?:\/\//i.test(u || '');
function tabIdOf(wc) { for (const t of tabs.values()) if (t.view.webContents === wc) return t.id; return null; }
function nav(wc) { return wc.navigationHistory || wc; }
function canBack(wc) { const n = nav(wc); return n.canGoBack ? n.canGoBack() : false; }
function canFwd(wc) { const n = nav(wc); return n.canGoForward ? n.canGoForward() : false; }

// Coalesce bursts (a page spinning document.title must not churn the UI or the disk).
function tabUpdate(id) {
  const t = tabs.get(id); if (!t || t.updateTimer) return;
  t.updateTimer = setTimeout(() => { t.updateTimer = null; tabUpdateNow(id); }, 40);
}
function tabUpdateNow(id) {
  const t = tabs.get(id); if (!t) return;
  const wc = t.view.webContents; if (wc.isDestroyed()) return;
  send('tab:update', {
    id, url: wc.getURL(), title: wc.getTitle(), loading: wc.isLoading(),
    canBack: canBack(wc), canFwd: canFwd(wc), favicon: t.favicon || null
  });
}

// Favicons are fetched here, inside the web session, and handed to the UI as inert data.
// The app's own window never requests anything from a site.
async function loadFavicon(t, icons) {
  const url = (icons || []).find(isWebUrl);
  t.faviconUrl = url || null;
  if (!url) { t.favicon = null; tabUpdate(t.id); return; }
  try {
    const res = await session.fromPartition(WEB_PARTITION).fetch(url, { credentials: 'omit' });
    const type = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    const buf = Buffer.from(await res.arrayBuffer());
    if (t.faviconUrl !== url || !tabs.has(t.id)) return;
    const ok = res.ok && buf.length > 0 && buf.length <= 24 * 1024 && /^image\/(png|x-icon|vnd\.microsoft\.icon|jpeg|gif|webp|svg\+xml)$/.test(type);
    t.favicon = ok ? 'data:' + type + ';base64,' + buf.toString('base64') : null;
  } catch (_) { t.favicon = null; }
  tabUpdate(t.id);
}

// ---------------------------------------------------------------- tab views
function createTab(id, url) {
  if (tabs.has(id)) return tabs.get(id);
  const view = new WebContentsView({
    webPreferences: {
      partition: WEB_PARTITION, sandbox: true, contextIsolation: true, nodeIntegration: false,
      backgroundThrottling: true, webSecurity: true, allowRunningInsecureContent: false, spellcheck: false, safeDialogs: true
    }
  });
  view.setBackgroundColor('#ffffff');
  view.setVisible(false);
  win.contentView.addChildView(view);
  const t = { id, view, favicon: null, lastShown: Date.now() };
  tabs.set(id, t);
  const wc = view.webContents;

  const opens = [];
  wc.setWindowOpenHandler((details) => {
    // A page may ask for a few new tabs, not a flood of them.
    const now = Date.now();
    while (opens.length && now - opens[0] > 4000) opens.shift();
    if (opens.length >= 5) return { action: 'deny' };
    opens.push(now);
    if (isWebUrl(details.url)) {
      send('tab:open', { url: details.url, openerId: id, background: details.disposition === 'background-tab' });
    }
    return { action: 'deny' };
  });
  wc.on('will-navigate', (e, navUrl) => { if (!isWebUrl(navUrl)) e.preventDefault(); });
  wc.on('did-start-loading', () => tabUpdate(id));
  wc.on('did-stop-loading', () => tabUpdate(id));
  wc.on('page-title-updated', () => tabUpdate(id));
  wc.on('page-favicon-updated', (_e, icons) => { loadFavicon(t, icons); });
  const bare = (u) => String(u || '').split('#')[0];
  wc.on('did-navigate', (_e, navUrl) => { t.favicon = null; t.faviconUrl = null; t.lastNav = bare(navUrl); send('tab:navigated', { id, url: navUrl }); tabUpdate(id); });
  // Single-page apps change the address without a full load; that still counts as visiting a page.
  wc.on('did-navigate-in-page', (_e, navUrl, isMainFrame) => {
    if (!isMainFrame) return;
    if (bare(navUrl) !== t.lastNav) { t.lastNav = bare(navUrl); send('tab:navigated', { id, url: navUrl }); }
    tabUpdate(id);
  });
  wc.on('did-fail-load', (_e, code, desc, failedUrl, isMainFrame) => {
    if (!isMainFrame || code === -3) return; // -3 = aborted (e.g. a newer navigation replaced it)
    send('tab:fail', { id, code, desc, url: failedUrl });
  });
  wc.on('render-process-gone', (_e, d) => send('tab:fail', { id, code: -1, desc: 'The page crashed (' + d.reason + ').', url: wc.getURL() }));
  wc.on('focus', () => send('tab:focused', { id }));
  wc.on('update-target-url', (_e, target) => send('tab:target', { id, url: target || '' }));
  wc.on('enter-html-full-screen', () => send('tab:fullscreen', { id, on: true }));
  wc.on('leave-html-full-screen', () => send('tab:fullscreen', { id, on: false }));
  // Escape stops a page that is still loading; the page still receives the key.
  wc.on('before-input-event', (_e, input) => { if (input.type === 'keyDown' && input.key === 'Escape' && wc.isLoading()) wc.stop(); });
  wc.on('found-in-page', (_e, r) => send('tab:found', { id, active: r.activeMatchOrdinal, matches: r.matches }));
  wc.on('context-menu', (_e, params) => popupPageMenu(buildPageMenu({
    tabId: id, url: wc.getURL(), title: wc.getTitle(), selection: params.selectionText,
    linkURL: params.linkURL, srcURL: params.mediaType === 'image' ? params.srcURL : '',
    editable: params.isEditable, editFlags: params.editFlags
  })));
  // No page gets camera, microphone, location, notifications and so on without us building a prompt for it.
  if (isWebUrl(url)) wc.loadURL(url).catch(() => {});
  return t;
}

function destroyTab(id) {
  const t = tabs.get(id); if (!t) return;
  tabs.delete(id);
  try { win.contentView.removeChildView(t.view); } catch (_) {}
  try { t.view.webContents.close(); } catch (_) {}
}

// Keep memory in hand. A loaded page costs 60 to 200 MB, so only a few stay loaded:
//  - at most MAX_LIVE pages at once; beyond that the one not looked at for longest goes to sleep;
//  - a page nobody has looked at for SLEEP_AFTER_MS goes to sleep whatever the count.
// Asleep means its view and process are released; the tab stays in the strip and reloads when
// selected. Pages on screen, playing sound, or with developer tools open are left alone.
const MAX_LIVE = Math.max(2, parseInt(process.env.FIELDDESK_MAX_LIVE, 10) || 4);
const SLEEP_AFTER_MS = (parseFloat(process.env.FIELDDESK_SLEEP_AFTER_MIN) || 10) * 60000;
function sleepIdleTabs() {
  if (tabs.size <= 1) return;
  const shown = new Set(layout.panes.map((p) => p.id));
  const now = Date.now();
  const idle = [...tabs.values()].filter((t) => {
    const wc = t.view.webContents;
    return !shown.has(t.id) && !wc.isCurrentlyAudible() && !wc.isDevToolsOpened();
  }).sort((a, b) => (a.lastShown || 0) - (b.lastShown || 0));
  while (idle.length && (tabs.size > MAX_LIVE || now - (idle[0].lastShown || 0) > SLEEP_AFTER_MS)) {
    const t = idle.shift();
    destroyTab(t.id);
    send('tab:slept', { id: t.id });
  }
}
setInterval(sleepIdleTabs, 60000).unref();

function applyLayout() {
  const shown = new Map(layout.panes.map((p) => [p.id, p]));
  for (const t of tabs.values()) {
    const p = shown.get(t.id);
    if (p && !frozen) {
      t.view.setBounds({ x: Math.round(p.x), y: Math.round(p.y), width: Math.max(0, Math.round(p.w)), height: Math.max(0, Math.round(p.h)) });
      t.view.setVisible(true);
      t.lastShown = Date.now();
    } else {
      t.view.setVisible(false);
    }
  }
}

// ---------------------------------------------------------------- context menus
function clipItems(ctx) {
  const items = [];
  const payload = (commanderId, category) => ({ commanderId, category: category || null, text: ctx.selection.trim(), url: ctx.url, title: ctx.title });
  const pinned = pinInfo.pinned || [];
  for (const c of pinned) {
    items.push({ id: 'clip:' + c.id, label: `Clip to ${c.name}'s file`, click: () => send('clip', payload(c.id)) });
  }
  for (const c of pinned) {
    items.push({
      label: `Clip to ${c.name} under`,
      submenu: CATEGORIES.map(([cid, label]) => ({ id: `clip:${c.id}:${cid}`, label, click: () => send('clip', payload(c.id, cid)) }))
    });
  }
  const others = (pinInfo.all || []).filter((c) => !pinned.some((p) => p.id === c.id));
  if (others.length) {
    items.push({
      label: pinned.length ? 'Clip to another commander' : 'Clip to a commander',
      submenu: others.map((c) => ({ id: 'clip:' + c.id, label: c.name, click: () => send('clip', payload(c.id)) }))
    });
  }
  items.push({ id: 'line', label: 'Save line to workspace notes', click: () => send('line', { text: ctx.selection.trim(), url: ctx.url, title: ctx.title }) });
  return items;
}

function buildPageMenu(ctx) {
  const tpl = [];
  const t = ctx.tabId ? tabs.get(ctx.tabId) : null;
  const wc = t ? t.view.webContents : null;
  if (ctx.linkURL && isWebUrl(ctx.linkURL)) {
    tpl.push(
      { id: 'link:new', label: 'Open link in new tab', click: () => send('tab:open', { url: ctx.linkURL, openerId: ctx.tabId, background: true }) },
      { id: 'link:split', label: 'Open link in split view', click: () => send('tab:open', { url: ctx.linkURL, openerId: ctx.tabId, split: true }) },
      { label: 'Copy link address', click: () => clipboard.writeText(ctx.linkURL) },
      { type: 'separator' }
    );
  }
  if (ctx.srcURL && isWebUrl(ctx.srcURL)) {
    tpl.push({ label: 'Open image in new tab', click: () => send('tab:open', { url: ctx.srcURL, openerId: ctx.tabId, background: true }) }, { type: 'separator' });
  }
  if (ctx.selection && ctx.selection.trim()) {
    tpl.push(...clipItems(ctx), { type: 'separator' });
    tpl.push({ label: 'Copy', role: wc ? undefined : 'copy', click: wc ? () => wc.copy() : undefined });
    const q = ctx.selection.trim().replace(/\s+/g, ' ');
    tpl.push({ label: `Search for “${q.length > 28 ? q.slice(0, 28) + '…' : q}”`, click: () => send('tab:open', { search: q, openerId: ctx.tabId }) });
    tpl.push({ type: 'separator' });
  }
  if (ctx.editable && wc) {
    tpl.push({ label: 'Cut', click: () => wc.cut() }, { label: 'Paste', click: () => wc.paste() }, { label: 'Select all', click: () => wc.selectAll() }, { type: 'separator' });
  }
  if (wc) {
    tpl.push(
      { label: 'Back', enabled: canBack(wc), click: () => send('cmd', { name: 'back' }) },
      { label: 'Forward', enabled: canFwd(wc), click: () => send('cmd', { name: 'forward' }) },
      { label: 'Reload', click: () => wc.reload() },
      { type: 'separator' },
      { label: 'Inspect', click: () => wc.openDevTools({ mode: 'detach' }) }
    );
  }
  while (tpl.length && tpl[tpl.length - 1].type === 'separator') tpl.pop();
  return tpl;
}

function popupPageMenu(tpl) {
  if (!tpl.length || !win) return;
  lastContextMenu = Menu.buildFromTemplate(tpl);
  lastContextMenu.popup({ window: win });
}

// ---------------------------------------------------------------- application menu and shortcuts
function buildAppMenu() {
  const cmd = (name, extra) => () => send('cmd', Object.assign({ name }, extra || {}));
  const item = (label, accelerator, name, extra) => ({ label, accelerator, click: cmd(name, extra) });
  // Second bindings for the same command. On macOS the menu bar is always visible, so they are
  // hidden there (hidden items keep their accelerators on macOS); pcOnly ones are left out entirely.
  const alias = (label, accelerator, name, extra) => Object.assign(item(label, accelerator, name, extra), isMac ? { visible: false } : {});
  const pcOnly = (...items) => (isMac ? [] : items);
  const tabNumbers = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => item('Tab ' + n, 'CmdOrCtrl+' + n, 'tab-index', { index: n - 1 }));
  const tpl = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: 'File',
      submenu: [
        item('New Tab', 'CmdOrCtrl+T', 'new-tab'),
        item('Close Tab', 'CmdOrCtrl+W', 'close-tab'),
        item('Reopen Closed Tab', 'CmdOrCtrl+Shift+T', 'reopen-tab'),
        { type: 'separator' },
        item('Open Location', 'CmdOrCtrl+L', 'focus-address'),
        ...pcOnly(item('Open Location (Alt+D)', 'Alt+D', 'focus-address')),
        ...pcOnly(item('Search the Web', 'Ctrl+K', 'focus-address')),
        { type: 'separator' },
        item('Export Notes as Markdown…', 'CmdOrCtrl+Shift+E', 'export'),
        { type: 'separator' },
        isMac ? { role: 'close', accelerator: 'CmdOrCtrl+Shift+W' } : { role: 'quit', accelerator: 'Ctrl+Q' }
      ]
    },
    { label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }, { type: 'separator' }, item('Find in Page', 'CmdOrCtrl+F', 'find'), item('Find Next', 'CmdOrCtrl+G', 'find-next'), item('Find Previous', 'CmdOrCtrl+Shift+G', 'find-prev'), ...pcOnly(item('Find Next (F3)', 'F3', 'find-next'))] },
    {
      label: 'View',
      submenu: [
        item('Reload', 'CmdOrCtrl+R', 'reload'),
        ...pcOnly(item('Reload (F5)', 'F5', 'reload')),
        item('Hard Reload', 'CmdOrCtrl+Shift+R', 'hard-reload'),
        { type: 'separator' },
        item('Zoom In', 'CmdOrCtrl+=', 'zoom-in'),
        alias('Zoom In (+)', 'CmdOrCtrl+Plus', 'zoom-in'),
        ...pcOnly(item('Zoom In (keypad)', 'Ctrl+numadd', 'zoom-in'), item('Zoom Out (keypad)', 'Ctrl+numsub', 'zoom-out')),
        item('Zoom Out', 'CmdOrCtrl+-', 'zoom-out'),
        item('Actual Size', 'CmdOrCtrl+0', 'zoom-reset'),
        { type: 'separator' },
        item('Toggle Split View', 'CmdOrCtrl+\\', 'split'),
        item('Collapse or Show the Desk Rail', 'CmdOrCtrl+.', 'toggle-rail'),
        item('Open or Close the Drawer', 'CmdOrCtrl+Shift+.', 'toggle-drawer'),
        { type: 'separator' },
        { role: 'togglefullscreen' },
        item('Developer Tools for Page', isMac ? 'Alt+Cmd+I' : 'Ctrl+Shift+I', 'devtools'),
        ...pcOnly(item('Developer Tools (F12)', 'F12', 'devtools'))
      ]
    },
    {
      label: 'History',
      submenu: [
        item('Back', isMac ? 'Cmd+[' : 'Alt+Left', 'back'),
        item('Forward', isMac ? 'Cmd+]' : 'Alt+Right', 'forward')
      ]
    },
    {
      label: 'Bookmarks',
      submenu: [item('Bookmark This Page', 'CmdOrCtrl+D', 'bookmark'), item('Save Selected Line to Notes', 'CmdOrCtrl+Shift+L', 'save-line')]
    },
    {
      label: 'Tabs',
      submenu: [
        item('Next Tab', 'Ctrl+Tab', 'next-tab'),
        item('Previous Tab', 'Ctrl+Shift+Tab', 'prev-tab'),
        ...pcOnly(item('Next Tab (Page Down)', 'Ctrl+PageDown', 'next-tab'), item('Previous Tab (Page Up)', 'Ctrl+PageUp', 'prev-tab')),
        ...(isMac ? [alias('Next Tab (Cmd+Opt+Right)', 'Alt+Cmd+Right', 'next-tab'), alias('Previous Tab (Cmd+Opt+Left)', 'Alt+Cmd+Left', 'prev-tab')] : []),
        { type: 'separator' },
        ...tabNumbers,
        item('Last Tab', 'CmdOrCtrl+9', 'tab-index', { index: -1 })
      ]
    },
    ...(isMac ? [{ role: 'windowMenu' }] : [])
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(tpl));
}

// ---------------------------------------------------------------- IPC
function registerIpc() {
  handle('state:load', () => readJson(stateFile()));
  handle('state:save', (state) => { queueState(state); return true; });
  ipcMain.on('state:save-sync', (e, state) => { if (fromUi(e)) { pendingState = state; flushState(); } e.returnValue = true; });
  handle('portrait:get', (id) => (portraits && typeof id === 'string' ? portraits.get(id) : null));
  handle('app:info', () => ({ platform: process.platform, version: app.getVersion(), userData: app.getPath('userData') }));

  handle('tab:create', ({ id, url }) => { createTab(String(id), url); return true; });
  handle('tab:navigate', ({ id, url }) => {
    const t = tabs.get(id); if (!t || !isWebUrl(url)) return false;
    t.view.webContents.loadURL(url).catch(() => {});
    return true;
  });
  handle('tab:destroy', ({ id }) => { destroyTab(id); return true; });
  handle('tab:action', ({ id, action }) => {
    const t = tabs.get(id); if (!t) return false;
    const wc = t.view.webContents;
    switch (action) {
      case 'back': if (canBack(wc)) nav(wc).goBack(); break;
      case 'forward': if (canFwd(wc)) nav(wc).goForward(); break;
      case 'reload': wc.reload(); break;
      case 'hard-reload': wc.reloadIgnoringCache(); break;
      case 'stop': wc.stop(); return { url: wc.getURL(), title: wc.getTitle() };
      case 'focus': wc.focus(); break;
      case 'zoom-in': wc.setZoomLevel(Math.min(wc.getZoomLevel() + 0.5, 4)); break;
      case 'zoom-out': wc.setZoomLevel(Math.max(wc.getZoomLevel() - 0.5, -3)); break;
      case 'zoom-reset': wc.setZoomLevel(0); break;
      case 'devtools': wc.openDevTools({ mode: 'detach' }); break;
      case 'stop-find': wc.stopFindInPage('clearSelection'); break;
      default: return false;
    }
    return true;
  });
  handle('tab:find', ({ id, text, forward, next }) => {
    const t = tabs.get(id); if (!t || !text) return false;
    t.view.webContents.findInPage(text, { forward: forward !== false, findNext: !!next });
    return true;
  });
  handle('tab:selection', async ({ id }) => {
    const t = tabs.get(id); if (!t) return '';
    // Runs in an isolated world, so the page cannot substitute its own getSelection, and is time-limited.
    try {
      const read = t.view.webContents.executeJavaScriptInIsolatedWorld(999, [{ code: 'String(window.getSelection())' }], false);
      const text = await Promise.race([read, new Promise((r) => setTimeout(() => r(''), 1500))]);
      return String(text || '').slice(0, 20000);
    } catch (_) { return ''; }
  });

  handle('layout:set', (next) => { layout = { panes: Array.isArray(next.panes) ? next.panes : [] }; applyLayout(); sleepIdleTabs(); return true; });
  // Freeze: hand the UI a still of each visible page and hide the live views, so app
  // surfaces (address suggestions, the divider drag) can draw over the page area.
  handle('view:freeze', async () => {
    const shots = {};
    freezeWanted = true;
    await Promise.all(layout.panes.map(async (p) => {
      const t = tabs.get(p.id); if (!t) return;
      try { const img = await t.view.webContents.capturePage(); if (!img.isEmpty()) shots[p.id] = 'data:image/jpeg;base64,' + img.toJPEG(72).toString('base64'); } catch (_) {}
    }));
    if (freezeWanted) { frozen = true; applyLayout(); }
    return shots;
  });
  handle('view:unfreeze', () => { freezeWanted = false; frozen = false; applyLayout(); return true; });
  handle('ui:focus', () => { if (ui()) ui().focus(); return true; });

  handle('pins:set', (info) => { pinInfo = { pinned: info.pinned || [], all: info.all || [] }; return true; });
  handle('menu:page', (ctx) => { popupPageMenu(buildPageMenu({ tabId: null, url: ctx.url, title: ctx.title, selection: ctx.selection || '', linkURL: ctx.linkURL || '' })); return true; });
  handle('menu:tab', ({ id, canReopen, inSplit }) => {
    const c = (name, extra) => () => send('cmd', Object.assign({ name, id }, extra || {}));
    Menu.buildFromTemplate([
      { label: 'New tab', click: c('new-tab') },
      { label: 'Duplicate', click: c('duplicate-tab') },
      { label: 'Reload', click: c('reload-tab') },
      { type: 'separator' },
      { label: inSplit ? 'Remove from split view' : 'Open in split view', click: c('split-tab') },
      { type: 'separator' },
      { label: 'Close tab', click: c('close-tab') },
      { label: 'Close other tabs', click: c('close-others') },
      { label: 'Reopen closed tab', enabled: !!canReopen, click: c('reopen-tab') }
    ]).popup({ window: win });
    return true;
  });

  handle('export:markdown', async ({ name, content }) => {
    const safe = String(name || 'field-desk-notes').replace(/[^\w .-]+/g, ' ').trim() || 'field-desk-notes';
    const res = await dialog.showSaveDialog(win, {
      title: 'Export notes and clips', defaultPath: path.join(app.getPath('documents'), safe + '.md'),
      filters: [{ name: 'Markdown', extensions: ['md'] }]
    });
    if (res.canceled || !res.filePath) return null;
    fs.writeFileSync(res.filePath, String(content), 'utf8');
    return res.filePath;
  });
}

// ---------------------------------------------------------------- window
function createWindow() {
  const saved = readJson(windowFile()) || {};
  win = new BrowserWindow({
    width: saved.width || 1380, height: saved.height || 880, x: saved.x, y: saved.y,
    minWidth: 880, minHeight: 560, show: false, title: 'Field Desk',
    backgroundColor: '#f4ecdd', autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, sandbox: true, nodeIntegration: false, spellcheck: false
    }
  });
  if (!isMac) win.setMenuBarVisibility(false);
  if (saved.maximized) win.maximize();

  // The app window only ever shows the app. It never navigates anywhere else.
  const appUrl = require('url').pathToFileURL(path.join(__dirname, '..', 'app', 'index.html')).href;
  win.webContents.on('will-navigate', (e, navUrl) => { if (navUrl !== appUrl) e.preventDefault(); });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.loadURL(appUrl);
  win.once('ready-to-show', () => win.show());

  const remember = () => {
    if (!win || win.isDestroyed()) return;
    const b = win.getNormalBounds();
    try { writeJson(windowFile(), { x: b.x, y: b.y, width: b.width, height: b.height, maximized: win.isMaximized() }); } catch (_) {}
  };
  win.on('close', () => { remember(); flushState(); });
  win.on('closed', () => { tabs.clear(); win = null; });
}

function hardenSessions() {
  const web = session.fromPartition(WEB_PARTITION);
  // Present as an ordinary Chrome so sites do not serve degraded pages.
  web.setUserAgent(web.getUserAgent().replace(/\s(?:Electron|FieldDesk|fielddesk|Field Desk)\/\S+/gi, ''));
  const allow = new Set(['fullscreen', 'clipboard-sanitized-write']);
  web.setPermissionRequestHandler((_wc, permission, cb) => cb(allow.has(permission)));
  web.setPermissionCheckHandler((_wc, permission) => allow.has(permission));
  // The UI session should never be asked for permissions at all.
  session.defaultSession.setPermissionRequestHandler((_wc, _p, cb) => cb(false));
}

// Any webContents we did not create ourselves (there should be none) may not attach webviews or open windows.
app.on('web-contents-created', (_e, wc) => {
  wc.on('will-attach-webview', (e) => e.preventDefault());
  wc.setWindowOpenHandler(() => ({ action: 'deny' })); // tab views replace this with their own handler
});
// Never offer a client certificate to a site on the user's behalf.
app.on('select-client-certificate', (e, _wc, _url, _list, cb) => { e.preventDefault(); cb(); });

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  app.whenReady().then(() => {
    hardenSessions();
    app.setAboutPanelOptions({ applicationName: 'Field Desk', applicationVersion: app.getVersion() });
    registerIpc();
    buildAppMenu();
    portraits = require('./portraits')({ app, net, onReady: (id) => send('portrait:ready', { id }) });
    createWindow();
    setTimeout(() => portraits.fetchMissing().catch((e) => console.error('portraits', e.message)), 4000);
    app.on('activate', () => { if (!win) createWindow(); });
  });
  app.on('before-quit', flushState);
  app.on('window-all-closed', () => { flushState(); app.quit(); });
}

// Exposed inside the main process only, for the automated checks in test/.
global.__fieldDesk = {
  tabs, buildPageMenu,
  lastContextMenu: () => lastContextMenu,
  stateFile,
  portraits: () => portraits
};
