'use strict';
(async function () {
  const S = FD.S;
  let loaded = null;
  try { loaded = await window.fd.invoke('state:load'); } catch (e) { console.error(e); }
  S.firstRun = !loaded;
  S.state = FD.repairState(loaded);
  try { const info = await window.fd.invoke('app:info'); document.documentElement.dataset.platform = info.platform; } catch (_) {}
  FD.wire();
  FD.pushPins();
  FD.renderAll();
  FD.save();
  window.addEventListener('beforeunload', () => window.fd.saveSync(S.state));
  document.documentElement.classList.add('ready');
})();
