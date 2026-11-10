'use strict';
// Shared helpers for the automated checks. They drive the real app through Playwright's Electron driver.
const path = require('path');
const fs = require('fs');
const { _electron } = require('playwright');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(__dirname, 'out');

async function launch(profile) {
  fs.mkdirSync(OUT, { recursive: true });
  const args = [ROOT];
  if (process.platform === 'linux' && process.getuid && process.getuid() === 0) args.unshift('--no-sandbox');
  const app = await _electron.launch({
    executablePath: require('electron'), args,
    env: Object.assign({}, process.env, { FIELDDESK_NO_FETCH: '1', FIELDDESK_USER_DATA: profile }, process.env.FD_TEST_ENV ? JSON.parse(process.env.FD_TEST_ENV) : {})
  });
  const ui = await app.firstWindow();
  await ui.waitForSelector('html.ready', { timeout: 20000 });
  ui.on('pageerror', (e) => console.log('  [ui error]', e.message));
  ui.on('console', (m) => { if (m.type() === 'error') console.log('  [ui console]', m.text()); });
  return { app, ui };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function shot(ui, name) { await ui.screenshot({ path: path.join(OUT, name + '.png') }); }
let failures = 0;
function check(label, ok, detail) {
  console.log((ok ? '  ok   ' : '  FAIL ') + label + (detail ? '  (' + detail + ')' : ''));
  if (!ok) failures++;
}
module.exports = { launch, sleep, shot, check, OUT, ROOT, failures: () => failures };
