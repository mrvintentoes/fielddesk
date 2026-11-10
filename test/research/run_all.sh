#!/bin/sh
# Runs every research-feature check in its own Xvfb. FD_SCRATCH overrides where profiles/screenshots go.
cd "$(dirname "$0")/../.." || exit 1
for t in t1_pins t2_clip t2b_drawer_stale t3_split t4_workspaces t5_trail t6_ulm t7_layouts t8_rail_misc; do
  echo "=== $t"; xvfb-run -a -s "-screen 0 1440x900x24" node test/research/$t.js 2>&1 | grep -E "FAIL|EXCEPTION|failing checks"
done
