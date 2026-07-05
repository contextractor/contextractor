"""Drive the Node CLI: ``extract`` (-> private storage) then ``export`` (-> manifest).

The CLI ``extract`` subcommand writes only to Crawlee storage and exits ``2`` on
partial failure; the separate ``export`` subcommand reads that storage and writes
``<output_dir>/manifest.json``. So one Python ``extract()`` runs two child
processes, then reads the manifest. ``extract_one()`` runs a single
``extract-one`` child process and returns its output as values. See
packages/standalone-python/SPEC.md.
"""

from __future__ import annotations

import asyncio
import shutil
import subprocess
import tempfile
from collections.abc import Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Unpack

from ._errors import ContextractorError, MissingBrowserError
from ._manifest import ExtractSummary, read_summary
from ._options import (
    ExtractOneOptions,
    ExtractOptions,
    build_extract_args,
    build_extract_one_args,
)
from ._redact import redact
from ._runtime import cli_js, resolve_node, vendor_cli_dir

_DEFAULT_OUTPUT_DIR = "./contextractor-output"
# extract exits 0 on full success, 2 on partial failure (failedCount > 0);
# extract-one exits 2 when a requested format yielded no content. Both are
# non-fatal — the results that were produced are still read back.
_PARTIAL_OK_CODES = frozenset({0, 2})
_PARTIAL_STAGES = frozenset({"extract", "extract-one"})
_BROWSER_MISSING_MARKERS = ("Executable doesn't exist", "playwright install")


@dataclass(frozen=True, slots=True)
class _Plan:
    urls: list[str]
    extract_flags: list[str]
    output_dir: Path
    storage_dir: Path
    owns_storage: bool
    secrets: tuple[str, ...]


def _normalize_urls(urls: list[str] | str) -> list[str]:
    return [urls] if isinstance(urls, str) else list(urls)


def _collect_secrets(opts: dict[str, Any]) -> tuple[str, ...]:
    """Everything the child could echo back in stderr: proxy URLs, header
    values (e.g. Authorization tokens), and cookie values. Values shorter than
    4 chars are skipped — they are not meaningful secrets and replacing them
    literally would mangle the error detail."""
    headers = opts.get("headers") or {}
    cookies = opts.get("cookies") or []
    return (
        *(opts.get("proxy") or ()),
        *(v for v in headers.values() if isinstance(v, str) and len(v) >= 4),
        *(
            c["value"]
            for c in cookies
            if isinstance(c, dict) and isinstance(c.get("value"), str) and len(c["value"]) >= 4
        ),
    )


def _build_plan(
    urls: list[str] | str,
    output_dir: str | None,
    storage_dir: str | None,
    opts: dict[str, Any],
) -> _Plan:
    url_list = _normalize_urls(urls)
    if not url_list and "start_urls_file" not in opts:
        raise ContextractorError("no URLs provided")

    # build_extract_args validates proxy schemes before any spawn.
    extract_flags = build_extract_args(opts)

    out_dir = Path(output_dir or _DEFAULT_OUTPUT_DIR).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    owns_storage = storage_dir is None
    store_dir = (
        Path(storage_dir).resolve()
        if storage_dir
        else Path(tempfile.mkdtemp(prefix="contextractor-storage-"))
    )

    return _Plan(
        urls=url_list,
        extract_flags=extract_flags,
        output_dir=out_dir,
        storage_dir=store_dir,
        owns_storage=owns_storage,
        secrets=_collect_secrets(opts),
    )


def _build_argv(plan: _Plan, node: str, cli: str) -> tuple[list[str], list[str]]:
    """Compose the extract + export argv once ``node``/``cli`` are resolved.

    One ``--storage`` path fully identifies a run's storage (always the
    ``default`` buckets), so export reads exactly what extract wrote.
    """
    extract_argv = [
        node,
        cli,
        "extract",
        *plan.urls,
        "--storage",
        str(plan.storage_dir),
        *plan.extract_flags,
    ]
    export_argv = [
        node,
        cli,
        "export",
        "--storage",
        str(plan.storage_dir),
        "--output-dir",
        str(plan.output_dir),
    ]
    return extract_argv, export_argv


def _raise_child_error(stage: str, code: int, stderr: str, secrets: Sequence[str]) -> None:
    if any(marker in (stderr or "") for marker in _BROWSER_MISSING_MARKERS):
        raise MissingBrowserError(
            "Playwright browser is not installed. "
            "Run `python -m contextractor install` (honors PLAYWRIGHT_BROWSERS_PATH)."
        )
    detail = redact(stderr or "", secrets).strip()
    raise ContextractorError(f"contextractor {stage} failed (exit {code}): {detail}")


def _check(stage: str, code: int | None, stderr: str, secrets: Sequence[str]) -> None:
    ok = _PARTIAL_OK_CODES if stage in _PARTIAL_STAGES else frozenset({0})
    if code not in ok:
        _raise_child_error(stage, code if code is not None else -1, stderr, secrets)


def _cleanup(plan: _Plan) -> None:
    if plan.owns_storage:
        shutil.rmtree(plan.storage_dir, ignore_errors=True)


def extract(
    urls: list[str] | str,
    *,
    output_dir: str | None = None,
    storage_dir: str | None = None,
    timeout: float | None = None,
    **opts: Unpack[ExtractOptions],
) -> ExtractSummary:
    """Crawl ``urls`` and write extracted content + a manifest to ``output_dir``.

    Returns an :class:`ExtractSummary` with per-status counts. Partial failures
    (some URLs failed) do not raise — they are reflected in ``summary.failed``.
    Validation/config errors and real crawl failures raise
    :class:`ContextractorError`. Missing browsers raise
    :class:`MissingBrowserError` pointing at ``python -m contextractor install``.

    ``output_dir`` defaults to ``./contextractor-output``; pass distinct paths for
    concurrent calls. ``storage_dir`` defaults to a private temp dir (cleaned up)
    so the manifest reflects only this run.
    """
    plan = _build_plan(urls, output_dir, storage_dir, dict(opts))
    try:
        with vendor_cli_dir() as cli_dir:
            extract_argv, export_argv = _build_argv(plan, resolve_node(), str(cli_js(cli_dir)))
            code, _out, stderr = _run_sync(extract_argv, timeout)
            _check("extract", code, stderr, plan.secrets)
            code, _out, stderr = _run_sync(export_argv, timeout)
            _check("export", code, stderr, plan.secrets)
            return read_summary(plan.output_dir / "manifest.json", plan.output_dir)
    finally:
        _cleanup(plan)


async def aextract(
    urls: list[str] | str,
    *,
    output_dir: str | None = None,
    storage_dir: str | None = None,
    timeout: float | None = None,
    **opts: Unpack[ExtractOptions],
) -> ExtractSummary:
    """Async counterpart of :func:`extract` (one crawl per child process)."""
    plan = _build_plan(urls, output_dir, storage_dir, dict(opts))
    try:
        with vendor_cli_dir() as cli_dir:
            extract_argv, export_argv = _build_argv(plan, resolve_node(), str(cli_js(cli_dir)))
            code, _out, stderr = await _run_async(extract_argv, timeout)
            _check("extract", code, stderr, plan.secrets)
            code, _out, stderr = await _run_async(export_argv, timeout)
            _check("export", code, stderr, plan.secrets)
            return read_summary(plan.output_dir / "manifest.json", plan.output_dir)
    finally:
        _cleanup(plan)


def _run_sync(argv: list[str], timeout: float | None) -> tuple[int | None, str, str]:
    """Run one child process; capture bytes, decode UTF-8 with ``errors="replace"``.

    The exact sync mirror of :func:`_run_async`. Capturing bytes (no ``text=True``)
    avoids the locale codec (mojibake/``UnicodeDecodeError`` on Windows cp1252/cp932)
    and universal-newline translation, which would corrupt ``original`` raw HTML.
    """
    try:
        proc = subprocess.run(argv, capture_output=True, timeout=timeout, check=False)
    except subprocess.TimeoutExpired:
        # TimeoutExpired.cmd carries the full argv (incl. --proxy creds); never let it
        # surface. Mirror the async path's redacted error.
        raise ContextractorError("contextractor timed out") from None
    out, err = proc.stdout.decode(errors="replace"), proc.stderr.decode(errors="replace")
    return proc.returncode, out, err


async def _run_async(argv: list[str], timeout: float | None) -> tuple[int | None, str, str]:
    proc = await asyncio.create_subprocess_exec(
        *argv,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    try:
        async with asyncio.timeout(timeout):
            out, err = await proc.communicate()
    except TimeoutError:
        raise ContextractorError("contextractor timed out") from None
    finally:
        # Reap the child whenever communicate() did not finish — timeout or
        # cancellation of the surrounding task — so the Node crawler is never orphaned.
        if proc.returncode is None:
            proc.kill()
            await proc.wait()
    return proc.returncode, out.decode(errors="replace"), err.decode(errors="replace")


# ---------------------------------------------------------------------------
# extract-one (single page -> values)
# ---------------------------------------------------------------------------

# Mirrors the CLI's `extForKind` mapping (markdown -> .md, original -> .html).
_EXTRACT_ONE_EXTS = {
    "txt": "txt",
    "markdown": "md",
    "json": "json",
    "html": "html",
    "original": "html",
}


@dataclass(frozen=True, slots=True)
class _OnePlan:
    url: str
    formats: list[str]
    flags: list[str]
    secrets: tuple[str, ...]


def _normalize_formats(formats: Sequence[str] | str | None) -> list[str]:
    if formats is None:
        items = ["markdown"]
    else:
        items = [formats] if isinstance(formats, str) else list(formats)
    if not items:
        raise ContextractorError("formats must list at least one format")
    out: list[str] = []
    for fmt in items:
        if fmt not in _EXTRACT_ONE_EXTS:
            raise ContextractorError(
                f"unknown format {fmt!r}; valid: {', '.join(_EXTRACT_ONE_EXTS)}"
            )
        if fmt not in out:
            out.append(fmt)
    return out


def _build_one_plan(
    url: str, formats: Sequence[str] | str | None, opts: dict[str, Any]
) -> _OnePlan:
    # build_extract_one_args validates keys and proxy schemes before any spawn.
    flags = build_extract_one_args(opts)
    return _OnePlan(
        url=url,
        formats=_normalize_formats(formats),
        flags=flags,
        secrets=_collect_secrets(opts),
    )


def _build_one_argv(plan: _OnePlan, node: str, cli: str, tempdir: Path | None) -> list[str]:
    """Compose the extract-one argv.

    One format streams over stdout (raw content); several go to files under a
    private temp dir via the CLI's multi-format `--output` prefix (`page.md`,
    `page.html`, `page.original.html`, ...), which this wrapper reads back.
    """
    argv = [node, cli, "extract-one", plan.url, *plan.flags]
    if tempdir is None:
        argv += ["--save", f"{plan.formats[0]}-stdout"]
    else:
        for fmt in plan.formats:
            argv += ["--save", f"{fmt}-file"]
        argv += ["--output", str(tempdir / "page")]
    return argv


def _one_file(tempdir: Path, fmt: str, formats: Sequence[str]) -> Path:
    # `original` is tagged `.original.html` only when `html` is also written
    # (the CLI's collision rule).
    if fmt == "original" and "html" in formats:
        return tempdir / "page.original.html"
    return tempdir / f"page.{_EXTRACT_ONE_EXTS[fmt]}"


def _read_one_outputs(tempdir: Path, plan: _OnePlan) -> dict[str, str]:
    """Read the per-format files back; formats the page yielded no content for
    were skipped by the CLI (exit 2 partial), so their keys are simply absent —
    the npm library's ``Partial<Record<...>>`` semantics."""
    contents: dict[str, str] = {}
    for fmt in plan.formats:
        file = _one_file(tempdir, fmt, plan.formats)
        try:
            contents[fmt] = file.read_text(encoding="utf-8")
        except FileNotFoundError:
            continue
    return contents


def _single_result(fmt: str, code: int | None, out: str) -> str:
    """Return the single-format stdout content.

    Exit ``2`` (partial) with an empty stdout means the one requested format
    yielded no content; a ``str`` return cannot represent absence, so raise.
    """
    if code == 2 and not out:
        raise ContextractorError(f"extract-one produced no {fmt} output")
    return out


def extract_one(
    url: str,
    *,
    formats: Sequence[str] | str | None = None,
    timeout: float | None = None,
    **opts: Unpack[ExtractOneOptions],
) -> str | dict[str, str]:
    """Extract a single URL (no link-following) and return the content.

    Mirrors the npm library's ``extractOne``: one requested format (default
    ``markdown``) returns a ``str``; several return a ``dict[str, str]`` keyed
    by format. Nothing is persisted and no output routing is exposed — the
    wrapper drives the CLI ``extract-one`` subprocess internally.

    When the page yields no content for a requested format (CLI exit ``2``,
    partial), the multi-format dict simply omits that format's key — the npm
    library's partial-map semantics. The single-format route instead raises
    :class:`ContextractorError` (``extract-one produced no <fmt> output``),
    since a ``str`` cannot represent absence. Hard failures (the crawl failed,
    invalid options; CLI exit ``1``) raise :class:`ContextractorError`.
    """
    plan = _build_one_plan(url, formats, dict(opts))
    with vendor_cli_dir() as cli_dir:
        node, cli = resolve_node(), str(cli_js(cli_dir))
        if len(plan.formats) == 1:
            argv = _build_one_argv(plan, node, cli, None)
            code, out, stderr = _run_sync(argv, timeout)
            _check("extract-one", code, stderr, plan.secrets)
            return _single_result(plan.formats[0], code, out)
        with tempfile.TemporaryDirectory(prefix="contextractor-one-") as tmp:
            tempdir = Path(tmp)
            argv = _build_one_argv(plan, node, cli, tempdir)
            code, _out, stderr = _run_sync(argv, timeout)
            _check("extract-one", code, stderr, plan.secrets)
            return _read_one_outputs(tempdir, plan)


async def aextract_one(
    url: str,
    *,
    formats: Sequence[str] | str | None = None,
    timeout: float | None = None,
    **opts: Unpack[ExtractOneOptions],
) -> str | dict[str, str]:
    """Async counterpart of :func:`extract_one` (one child process).

    Same partial semantics: a format the page yielded no content for is absent
    from the multi-format dict; the single-format route raises
    :class:`ContextractorError`.
    """
    plan = _build_one_plan(url, formats, dict(opts))
    with vendor_cli_dir() as cli_dir:
        node, cli = resolve_node(), str(cli_js(cli_dir))
        if len(plan.formats) == 1:
            argv = _build_one_argv(plan, node, cli, None)
            code, out, stderr = await _run_async(argv, timeout)
            _check("extract-one", code, stderr, plan.secrets)
            return _single_result(plan.formats[0], code, out)
        with tempfile.TemporaryDirectory(prefix="contextractor-one-") as tmp:
            tempdir = Path(tmp)
            argv = _build_one_argv(plan, node, cli, tempdir)
            code, _out, stderr = await _run_async(argv, timeout)
            _check("extract-one", code, stderr, plan.secrets)
            return _read_one_outputs(tempdir, plan)
