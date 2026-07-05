#!/usr/bin/env python3
"""Stage the flattened standalone CLI tree into the wheel's ``_vendor`` dir.

The Python wrapper ships the Node CLI **un-bundled**: plain ``tsc`` output plus a
real-file ``node_modules`` tree (Crawlee / Playwright / commander resolve assets
via ``__dirname`` and break under single-file bundlers). Wheels cannot carry
symlinks, so the JS is flattened with ``pnpm deploy --config.node-linker=hoisted``
first, then copied here. The hoisted linker also lifts transitive deps to the
top-level ``node_modules`` so ``node_modules/playwright/cli.js`` (used by the
``install`` shim) resolves.

Pipeline (run from the repo root, per platform, before ``python -m build`` /
cibuildwheel):

    pnpm install
    pnpm --filter contextractor build
    pnpm --filter contextractor deploy --prod --config.node-linker=hoisted _cli_deploy
    python packages/standalone-python/scripts/stage_vendor.py \
        --deploy-dir _cli_deploy --keep-platform <napi-platform>

``--keep-platform`` (e.g. ``darwin-arm64``, ``win32-x64-msvc``) prunes every
other platform's prebuilt ``.node`` so each wheel carries only its own. pnpm
already installs only the os/cpu-matching optional dependency, so this is a
defensive net.
"""

from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

HERE = Path(__file__).resolve().parent
VENDOR = HERE.parent / "src" / "contextractor" / "_vendor"
CLI_DEST = VENDOR / "cli"
# Legacy layout: per-platform optionalDependency packages (defensive only —
# the bundled CLI no longer ships @contextractor/* under node_modules).
NATIVE_NPM_GLOB = "node_modules/@contextractor/extraction-native-*"
# Bundled layout: every platform's prebuild staged next to the napi loader.
NATIVE_DIST_GLOB = "dist/native/contextractor-extraction-native.*.node"


def stage(deploy_dir: Path, keep_platform: str | None) -> None:
    if not (deploy_dir / "dist" / "cli.js").is_file():
        raise SystemExit(
            f"deploy dir {deploy_dir} has no dist/cli.js — "
            "run `pnpm --filter contextractor build` and `pnpm deploy` first"
        )
    if CLI_DEST.exists():
        shutil.rmtree(CLI_DEST)
    # symlinks=False dereferences pnpm's virtual-store symlinks into real files —
    # wheels cannot carry symlinks.
    shutil.copytree(deploy_dir, CLI_DEST, symlinks=False)
    _ensure_esm(CLI_DEST / "package.json")
    if keep_platform:
        _prune_other_platforms(CLI_DEST, keep_platform)
    _seed_init_py(VENDOR)


def _ensure_esm(package_json: Path) -> None:
    # `pnpm deploy` rewrites package.json and drops `"type": "module"`; the CLI is
    # ESM, so restore it (Node resolves the nearest package.json for dist/cli.js).
    data = json.loads(package_json.read_text(encoding="utf-8"))
    if data.get("type") != "module":
        data["type"] = "module"
        package_json.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def _prune_other_platforms(root: Path, keep: str) -> None:
    keep_name = f"extraction-native-{keep}"
    for pkg_dir in root.glob(NATIVE_NPM_GLOB):
        if pkg_dir.name != keep_name:
            shutil.rmtree(pkg_dir, ignore_errors=True)
    keep_file = f"contextractor-extraction-native.{keep}.node"
    for node_file in root.glob(NATIVE_DIST_GLOB):
        if node_file.name != keep_file:
            node_file.unlink(missing_ok=True)


def _seed_init_py(root: Path) -> None:
    # importlib.resources requires an __init__.py in every resource subdir.
    root.mkdir(parents=True, exist_ok=True)
    dirs = [root, *(p for p in root.rglob("*") if p.is_dir())]
    for directory in dirs:
        init = directory / "__init__.py"
        if not init.exists():
            init.write_text("", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--deploy-dir", required=True, type=Path)
    parser.add_argument("--keep-platform", default=None)
    args = parser.parse_args()
    stage(args.deploy_dir.resolve(), args.keep_platform)


if __name__ == "__main__":
    main()
