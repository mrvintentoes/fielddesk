#!/usr/bin/env python3
"""Send real X11 key presses (XTest) so native menu accelerators fire. Usage: xkey.py ctrl+t [alt+Left ...]
Keys are X keysym names (t, Tab, Left, Prior, Next, F5, equal, minus, backslash, period, 1..9, Escape, Return)."""
import ctypes, sys, time
X = ctypes.CDLL('libX11.so.6'); T = ctypes.CDLL('libXtst.so.6')
X.XOpenDisplay.restype = ctypes.c_void_p
X.XStringToKeysym.restype = ctypes.c_ulong
X.XDefaultRootWindow.restype = ctypes.c_ulong
X.XDefaultRootWindow.argtypes = [ctypes.c_void_p]
X.XKeysymToKeycode.argtypes = [ctypes.c_void_p, ctypes.c_ulong]
X.XKeysymToKeycode.restype = ctypes.c_ubyte
T.XTestFakeKeyEvent.argtypes = [ctypes.c_void_p, ctypes.c_uint, ctypes.c_int, ctypes.c_ulong]
X.XFlush.argtypes = [ctypes.c_void_p]; X.XSync.argtypes = [ctypes.c_void_p, ctypes.c_int]
d = X.XOpenDisplay(None)
if not d: sys.exit('no display')
MODS = {'ctrl': 'Control_L', 'shift': 'Shift_L', 'alt': 'Alt_L', 'super': 'Super_L'}
def code(name):
    ks = X.XStringToKeysym(name.encode())
    kc = X.XKeysymToKeycode(d, ks)
    if not kc: sys.exit('no keycode for ' + name)
    return kc
for combo in sys.argv[1:]:
    if combo.startswith('type:'):
        for ch in combo[5:]:
            name = {' ': 'space', '.': 'period', '/': 'slash', ':': 'colon', '-': 'minus'}.get(ch, ch)
            shift = ch == ':' or ch.isupper()
            if shift: T.XTestFakeKeyEvent(d, code('Shift_L'), 1, 0)
            kc = code(name); T.XTestFakeKeyEvent(d, kc, 1, 0); T.XTestFakeKeyEvent(d, kc, 0, 0)
            if shift: T.XTestFakeKeyEvent(d, code('Shift_L'), 0, 0)
            X.XSync(d, 0); time.sleep(0.02)
        continue
    parts = combo.split('+')
    mods = [code(MODS[p.lower()]) for p in parts[:-1]]
    key = code(parts[-1])
    for m in mods: T.XTestFakeKeyEvent(d, m, 1, 0)
    T.XTestFakeKeyEvent(d, key, 1, 0); T.XTestFakeKeyEvent(d, key, 0, 0)
    for m in reversed(mods): T.XTestFakeKeyEvent(d, m, 0, 0)
    X.XSync(d, 0); time.sleep(0.05)
