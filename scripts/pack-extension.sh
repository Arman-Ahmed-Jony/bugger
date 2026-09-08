#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/packages/extension/dist"
OUT_DIR="$ROOT/packages/app/public"
OUT_ZIP="$OUT_DIR/bugger-extension.zip"

if [[ ! -d "$DIST" ]]; then
  echo "Extension dist missing. Run: pnpm --filter @bugger/extension build" >&2
  exit 1
fi

if [[ ! -f "$DIST/manifest.json" ]]; then
  echo "Extension dist incomplete (no manifest.json)." >&2
  exit 1
fi

mkdir -p "$OUT_DIR"
rm -f "$OUT_ZIP"

# Zip contents of dist/ so unpacking yields manifest.json at the root
(
  cd "$DIST"
  zip -r -q "$OUT_ZIP" .
)

echo "Wrote $OUT_ZIP ($(du -h "$OUT_ZIP" | awk '{print $1}'))"
