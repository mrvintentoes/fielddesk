#!/bin/sh
# Stage-1 browsing checks. Linux: needs xvfb-run, ImageMagick `import` (screenshots) and python3 + libXtst (t06/t07 real key presses).
cd "$(dirname "$0")/../.." || exit 1
for t in test/browsing/t0[1-7]-*.js; do
  echo "== $t"
  timeout 420 xvfb-run -a -s "-screen 0 1440x900x24" node "$t" 2>&1 | grep -v "xvfb-run: error"
done
