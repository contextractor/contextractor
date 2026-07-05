"""Locate the bundled Node runtime and the shipped JS CLI.

Python never loads the napi ``.node`` — Node does, when it runs ``cli.js``. This
module only resolves filesystem paths:

* ``resolve_node`` — the Node binary from the ``nodejs-wheel-binaries`` dependency
  (or a ``CONTEXTRACTOR_NODE_PATH`` override).
* ``vendor_cli_dir`` — materializes the flattened CLI tree staged under
  ``_vendor/cli`` (see ``scripts/stage_vendor.py``) as a real directory via
  ``importlib.resources.as_file`` (a no-op on disk; extracts+cleans up from a zip).
* ``cli_js`` / ``playwright_cli_js`` — entry points inside that materialized tree.
"""

from __future__ import annotations

import os
from collections.abc import Iterator
from contextlib import contextmanager, suppress
from importlib import resources
from pathlib import Path

from ._errors import NodeRuntimeError

NODE_PATH_ENV = "CONTEXTRACTOR_NODE_PATH"


def resolve_node() -> str:
    """Return the path to the Node executable to spawn."""
    override = os.environ.get(NODE_PATH_ENV)
    if override:
        if not Path(override).is_file():
            raise NodeRuntimeError(f"{NODE_PATH_ENV}={override!r} does not point at a file")
        return _ensure_executable(override)
    try:
        import nodejs_wheel.executable as nw  # noqa: PLC0415
    except ImportError as exc:  # pragma: no cover - dependency always present in wheels
        raise NodeRuntimeError(
            "nodejs-wheel-binaries is not installed and "
            f"{NODE_PATH_ENV} is unset — cannot locate a Node runtime"
        ) from exc
    root = Path(nw.ROOT_DIR)
    candidate = root / "node.exe" if os.name == "nt" else root / "bin" / "node"
    if not candidate.is_file():
        raise NodeRuntimeError(f"bundled node binary not found at {candidate}")
    return _ensure_executable(str(candidate))


def _ensure_executable(path: str) -> str:
    """Restore the exec bit on a Node binary (POSIX only).

    Installing from a wheel ZIP can drop the executable bit; mirror each read bit
    to its matching exec bit so the spawn does not fail with ``PermissionError``.
    Idempotent and best-effort.
    """
    if os.name != "nt" and not os.access(path, os.X_OK):
        mode = os.stat(path).st_mode
        # best effort: spawn surfaces the real error if chmod is not permitted
        with suppress(OSError):
            os.chmod(path, mode | (mode & 0o444) >> 2)
    return path


@contextmanager
def vendor_cli_dir() -> Iterator[Path]:
    """Materialize the staged ``_vendor/cli`` tree as a real directory.

    Yields the on-disk path unchanged for a normally-installed wheel; extracts to
    a temp dir (removed on exit) when the package is imported from a zip
    (pex/shiv). Keep the context open across the whole subprocess run so the
    extracted tree outlives the child process.
    """
    traversable = resources.files(__package__).joinpath("_vendor", "cli")
    with resources.as_file(traversable) as path:
        yield Path(path)


def cli_js(cli_dir: Path) -> Path:
    """Return ``dist/cli.js`` inside a materialized ``_vendor/cli`` directory."""
    cli = cli_dir / "dist" / "cli.js"
    if not cli.is_file():
        raise NodeRuntimeError(
            f"bundled CLI not found at {cli}. The wheel was built without staged "
            "assets — run packages/standalone-python/scripts/stage_vendor.py for a dev checkout."
        )
    return cli


def playwright_cli_js(cli_dir: Path) -> Path:
    """Return the bundled Playwright CLI inside a materialized ``_vendor/cli`` directory."""
    pw = cli_dir / "node_modules" / "playwright" / "cli.js"
    if not pw.is_file():
        raise NodeRuntimeError(
            f"bundled Playwright CLI not found at {pw}. The wheel was built without staged assets."
        )
    return pw
