#!/usr/bin/env bash
# Build the contextractor Python wrapper from source and run the examples.
#
# Builds a local platform wheel (which bundles the Node CLI), installs it into
# a throwaway .venv, provisions Chromium, and runs both example scripts —
# useful for testing unreleased changes. Released users only need:
#   pip install contextractor && python -m contextractor install
#
# Requirements: pnpm, uv, python3 — but NOT Node.js (the wheel bundles a Node
# runtime via nodejs-wheel-binaries).
set -euo pipefail

EXAMPLE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${EXAMPLE_DIR}/../.." && pwd)"
PY_PKG="${REPO_ROOT}/packages/standalone-python"

# Pick the napi prebuild to keep in the wheel (one per platform).
case "$(uname -s)-$(uname -m)" in
  Darwin-arm64)  NAPI_PLATFORM=darwin-arm64 ;;
  Darwin-x86_64) NAPI_PLATFORM=darwin-x64 ;;
  Linux-x86_64)  NAPI_PLATFORM=linux-x64-gnu ;;
  Linux-aarch64) NAPI_PLATFORM=linux-arm64-gnu ;;
  *) echo "Unsupported platform: $(uname -s)-$(uname -m)" >&2; exit 1 ;;
esac
echo ">>> platform: ${NAPI_PLATFORM}"

cd "${REPO_ROOT}"

echo ">>> [1/6] install workspace deps"
pnpm install

echo ">>> [2/6] build the standalone CLI (dist/cli.js)"
pnpm --filter contextractor build

echo ">>> [3/6] flatten the CLI tree (hoisted node-linker — npm-style real files,"
echo "          hoists transitive deps like Playwright to the top-level node_modules)"
rm -rf _cli_deploy
pnpm --filter contextractor deploy --prod --config.node-linker=hoisted _cli_deploy

echo ">>> [4/6] stage the bundled CLI assets into the wheel source tree"
python3 packages/standalone-python/scripts/stage_vendor.py \
  --deploy-dir _cli_deploy --keep-platform "${NAPI_PLATFORM}"

echo ">>> [5/6] build the platform wheel"
rm -rf "${PY_PKG}/dist"
( cd "${PY_PKG}" && uv build --wheel )
WHEEL="$(ls -t "${PY_PKG}"/dist/contextractor-*.whl | head -1)"
echo "    built ${WHEEL}"

echo ">>> [6/6] create .venv, install the wheel, provision Chromium"
cd "${EXAMPLE_DIR}"
rm -rf .venv
uv venv .venv
uv pip install --python .venv/bin/python "${WHEEL}"
.venv/bin/python -m contextractor install chromium

echo ">>> run main.py (sync extract)"
.venv/bin/python main.py

echo ">>> run async_example.py (async aextract)"
.venv/bin/python async_example.py

echo ">>> done"
