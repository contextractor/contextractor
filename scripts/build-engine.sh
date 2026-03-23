#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Building contextractor-engine..."
uv build --package contextractor-engine --out-dir dist/

echo "Done. Artifacts in dist/"
ls -la dist/
