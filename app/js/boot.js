'use strict';
(async function () {
  const S = FD.S;
  let loaded = null;
  try { loaded = await window.fd.invoke('state:load'); } catch (e) { console.error(e); }
  S.firstRun = !loaded;
  S.state = FD.repairState(loaded);
  try { const info = await window.fd.invoke('app:info'); document.documentElement.dataset.platform = info.platform; } catch (_) {}
  FD.onCommanderLoaded = FD.debounce(() => { FD.renderRail(); FD.renderDrawer(); FD.applyTheme(); FD.refreshPages('fielddesk://newtab'); }, 30);
  await FD.ensureCommanders(FD.ws().pins);   // only the pinned commanders' files are read at startup
  FD.wire();
  FD.pushPins();
  FD.renderAll();
  FD.save();
  window.addEventListener('beforeunload', () => window.fd.saveSync(S.state));
  window.addEventListener('blur', () => document.body.classList.add('blurred'));
  window.addEventListener('focus', () => document.body.classList.remove('blurred'));
  document.documentElement.classList.add('ready');
})();
