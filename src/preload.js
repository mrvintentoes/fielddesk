'use strict';
// The only bridge between the Field Desk window and the main process.
// It is loaded for the app's own UI only; web pages get no preload at all.
const { contextBridge, ipcRenderer } = require('electron');

const INVOKE = new Set([
  'state:load', 'state:save', 'tab:create', 'tab:navigate', 'tab:destroy', 'tab:action',
  'layout:set', 'view:freeze', 'view:unfreeze', 'menu:tab', 'menu:page', 'pins:set',
  'export:markdown', 'tab:find', 'tab:selection', 'ui:focus', 'app:info'
]);
const EVENTS = new Set([
  'tab:update', 'tab:open', 'tab:navigated', 'tab:fail', 'tab:focused', 'tab:found',
  'tab:fullscreen', 'tab:target', 'tab:slept', 'clip', 'line', 'cmd'
]);

contextBridge.exposeInMainWorld('fd', {
  invoke(channel, payload) {
    if (!INVOKE.has(channel)) return Promise.reject(new Error('blocked channel ' + channel));
    return ipcRenderer.invoke(channel, payload);
  },
  on(channel, fn) {
    if (!EVENTS.has(channel)) return;
    ipcRenderer.on(channel, (_e, payload) => fn(payload));
  },
  saveSync(state) {
    try { ipcRenderer.sendSync('state:save-sync', state); } catch (_) {}
  }
});
