#!/usr/bin/env bash
# Builds store-ready zips: dist/renderspace-chrome-edge.zip and dist/renderspace-firefox.zip
set -euo pipefail
cd "$(dirname "$0")"
FILES="background.js render.html render.js options.html options.js popup.html popup.js style.css icon-16.png icon-32.png icon-48.png icon-128.png"
rm -rf dist && mkdir -p dist/chrome dist/firefox
for f in $FILES; do cp "$f" dist/chrome/; cp "$f" dist/firefox/; done
cp manifest.json dist/chrome/manifest.json
# Firefox: background scripts instead of a service worker, plus a gecko id and data declaration.
node -e '
const m = require("./manifest.json")
m.background = { scripts: ["background.js"] }
m.browser_specific_settings = { gecko: { id: "render@renderspace.ai", strict_min_version: "121.0", data_collection_permissions: { required: ["websiteContent"] } } }
require("fs").writeFileSync("dist/firefox/manifest.json", JSON.stringify(m, null, 2))
'
(cd dist/chrome && zip -qr ../renderspace-chrome-edge.zip .)
(cd dist/firefox && zip -qr ../renderspace-firefox.zip .)
ls -la dist/*.zip
