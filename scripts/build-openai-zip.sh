#!/usr/bin/env bash
# Builds the ChatGPT plugin ZIP for the OpenAI Platform (platform.openai.com/plugins).
#
#   scripts/build-openai-zip.sh                      # draft: demo video link optional
#   DEMO_URL=https://… scripts/build-openai-zip.sh   # ready to submit for review
#
# The ZIP root is the plugin root: plugin.json, mcp.json, skills/, assets/.
# Other clients' files (.claude-plugin/, .mcp.json) stay out. The demo link
# is added to the packaged plugin.json only, so the repo copy doesn't carry
# a private video URL. Output: dist/wavebrook-openai-<version>.zip
set -euo pipefail

cd "$(dirname "$0")/.."
SRC=plugins/wavebrook
VERSION=$(node -p "require('./$SRC/plugin.json').version")
OUT="dist/wavebrook-openai-$VERSION.zip"

node scripts/check.mjs

STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT
cp "$SRC/plugin.json" "$SRC/mcp.json" "$STAGE/"
cp -R "$SRC/skills" "$SRC/assets" "$STAGE/"

if [[ -n "${DEMO_URL:-}" ]]; then
  DEMO_URL="$DEMO_URL" node -e '
    const fs = require("fs");
    const f = process.argv[1];
    const j = JSON.parse(fs.readFileSync(f, "utf8"));
    j.extensions["com.openai"].review.demo_recording_url = process.env.DEMO_URL;
    fs.writeFileSync(f, JSON.stringify(j, null, 2) + "\n");
  ' "$STAGE/plugin.json"
  node scripts/openai-check.mjs "$STAGE" --require-demo
else
  node scripts/openai-check.mjs "$STAGE"
fi

mkdir -p dist
rm -f "$OUT"
# -X: no macOS extended attributes; find excludes Finder litter.
(cd "$STAGE" && find . -name .DS_Store -delete && zip -X -r -q "$OLDPWD/$OUT" .)

echo
unzip -l "$OUT"
echo "Built $OUT"
