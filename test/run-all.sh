#!/bin/sh
# Every automated check, one after another, each with a time limit. Linux: run under Xvfb, e.g.
#   xvfb-run -a -s "-screen 0 1440x900x24" sh test/run-all.sh
# Prints one line per file and the failing checks, then a total.
cd "$(dirname "$0")/.." || exit 1
LOG="${FD_SCRATCH:-test/out}/logs"; mkdir -p "$LOG"; bad=0
for t in test/restart.js test/portraits.js test/browsing/t0[1-7]-*.js test/research/t[0-9]*.js; do
  name=$(basename "$t" .js)
  timeout -k 3 300 node "$t" > "$LOG/$name.log" 2>&1; code=$?
  pkill -f "electron.*fielddesk" 2>/dev/null
  fails=$(grep -cE "^ *FAIL |EXCEPTION|TimeoutError" "$LOG/$name.log")
  if [ "$code" -ne 0 ] && [ "$code" -ne 1 ] || [ "$fails" -gt 0 ] || [ "$code" -eq 1 ]; then bad=$((bad + 1)); echo "FAIL  $name (exit $code, $fails failing lines)"; grep -E "^ *FAIL |EXCEPTION|TimeoutError" "$LOG/$name.log" | cut -c1-220 | head -6
  else echo "ok    $name ($(grep -cE '^ *ok ' "$LOG/$name.log") checks)"; fi
done
echo; [ "$bad" -eq 0 ] && echo "All test files passed" || echo "$bad test file(s) failing"
[ "$bad" -eq 0 ]
