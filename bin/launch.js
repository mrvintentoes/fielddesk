#!/usr/bin/env node
// Launches Field Desk. Chromium refuses to run sandboxed as root, so only in that
// case (containers, CI) do we pass --no-sandbox. Everyone else keeps the sandbox.
const { spawn } = require('child_process');
const path = require('path');
const electron = require('electron');
const args = [path.join(__dirname, '..')].concat(process.argv.slice(2));
if (process.platform === 'linux' && process.getuid && process.getuid() === 0) args.unshift('--no-sandbox');
const child = spawn(electron, args, { stdio: 'inherit' });
['SIGINT', 'SIGTERM'].forEach((sig) => process.on(sig, () => { if (!child.killed) child.kill(sig); }));
child.on('exit', (code) => process.exit(code == null ? 1 : code));
