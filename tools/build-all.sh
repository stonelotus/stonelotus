#!/usr/bin/env bash
# Rebuild every SVG, render-check each one, and preview the README through GitHub's renderer.
#   tools/build-all.sh            # build + lint + README preview
#   tools/build-all.sh --no-check # build only
set -euo pipefail
cd "$(dirname "$0")/.."
for f in hero quests about stack connect; do node "build/dungeon/$f.mjs"; done
node scripts/build-dashboard.mjs
[[ "${1:-}" == "--no-check" ]] && exit 0
fail=0
for s in hero quests about-life stack id-dashboard connect connect-linkedin connect-email connect-endspec connect-github; do
  node tools/render-check.mjs "$s.svg" --times 0,1,3,6 --width 846 --out "_check/all/$s" | grep -E "PROBLEM|lint ok|KB" || fail=1
done
node tools/preview-readme.mjs --widths 846,390 --wait 5000
exit $fail
