# contextractor (Python) — Specification

A library-only PyPI package that drives the Contextractor Node CLI from Python. It
**reimplements nothing**: `extract`/`aextract` spawn the bundled `dist/cli.js`,
translate snake_case options to CLI flags, let the CLI write to disk, then read the
export `manifest.json` back; `extract_one`/`aextract_one` spawn a single
`extract-one` child and return the content as values. Python loads no JavaScript
and no napi `.node` — Node does, when it runs `cli.js`. Standalone hatchling
package; **not** a pnpm/turbo workspace member.

## Status

**Alpha / experimental** — not fully tested or officially supported, though still
maintained. Deliberately unadvertised on the website (off the homepage / About;
reachable only from its own `/help/pypi/` page and the `/help/` hub link). See the
repo-overview note in `@/SPEC.md`.

## Public API

`src/contextractor/__init__.py` exports:

- `extract(urls, *, output_dir=None, storage_dir=None, timeout=None, **opts) -> ExtractSummary` — sync, primary.
- `aextract(urls, *, output_dir=None, storage_dir=None, timeout=None, **opts) -> ExtractSummary` — async (one crawl per child process via `asyncio.create_subprocess_exec`).
- `extract_one(url, *, formats=None, timeout=None, **opts) -> str | dict[str, str]` — sync single-page extraction: crawls exactly one URL (no link-following) and returns the content as values. `formats` defaults to `"markdown"`; one requested format returns a `str`, several return a `dict[str, str]` keyed by format. Nothing is persisted. Raises `ContextractorError` when the page cannot be extracted.
- `aextract_one(url, *, formats=None, timeout=None, **opts) -> str | dict[str, str]` — async counterpart of `extract_one`.
- `install(browser="chromium") -> None` — provision a Playwright browser via the bundled engine. Also reachable as `python -m contextractor install [browser]`.
- `ExtractOptions` — `TypedDict(total=False)` of all crawl options (the typed surface for `extract`'s `**opts`).
- `ExtractOneOptions` — `TypedDict(total=False)` of the single-page option subset (the typed surface for `extract_one`'s `**opts`).
- `ExtractSummary` — frozen dataclass: `total`, `succeeded`, `failed`, `skipped`, `output_dir`, `manifest_path`.
- Errors: `ContextractorError` (base), `ProxySchemeError`, `NodeRuntimeError`, `MissingBrowserError`.
- `__version__` — read via `importlib.metadata.version("contextractor")`.

`urls` accepts a single string or a list. `output_dir` defaults to
`./contextractor-output` (resolved against the CWD). `storage_dir` defaults to a
private temp dir that is removed after the call so the manifest reflects only the
current run; an explicitly-passed `storage_dir` is preserved.

## Orchestration (two invocations)

The CLI `extract` subcommand writes only to Crawlee storage and exits `2` on
partial failure; the separate `export` subcommand writes `<output_dir>/manifest.json`.
So each `extract()`/`aextract()` runs **two** child processes:

1. `node cli.js extract <urls> --storage <STORAGE> <mapped flags>`
2. `node cli.js export --storage <STORAGE> --output-dir <OUTPUT_DIR>`

then `read_summary(<OUTPUT_DIR>/manifest.json)`. One `--storage` path fully
identifies a run's storage (the CLI always uses the `default` buckets), so export
reads exactly what extract wrote — no bucket names are threaded.

### Exit-code semantics (`_run.py`)

- extract `0` → continue; `2` → partial success, continue (do **not** raise); `1`/other → raise `ContextractorError`.
- extract-one `0` → success; `2` → partial (a requested format yielded no content — see the single-page section); `1`/other → raise.
- export `0` → read manifest; non-zero → raise.
- Both runners (`_run_sync` / `_run_async`) capture raw bytes and decode stdout/stderr as UTF-8 with `errors="replace"` — never the locale codec (Windows cp1252/cp932 mojibake) and never universal-newline translation (which would corrupt `original` raw HTML).
- Playwright "Executable doesn't exist" in stderr → `MissingBrowserError` pointing at `python -m contextractor install`.
- Child stderr is redacted before being surfaced — proxy URLs, header values (e.g. `Authorization` tokens), and cookie values (each ≥ 4 chars) are all registered as secrets; argv is never echoed when it carries a proxy.
- A `timeout` (sync or async) raises `ContextractorError("contextractor timed out")` — never the raw `subprocess.TimeoutExpired`, whose `cmd` would leak the `--proxy` argv. Cancelling the surrounding task in the async path also kills and reaps the child — it is never orphaned.

## Single-page orchestration (`extract_one`)

`extract_one()`/`aextract_one()` run **one** child process and return the content
as values — nothing is persisted, and no save/output/file/stdout options are
exposed; the wrapper drives the CLI `extract-one` subcommand internally:

- One requested format → `node cli.js extract-one <url> <mapped flags> --save <fmt>-stdout`; the child's stdout is the raw content (diagnostics go to stderr) and is returned as a `str`.
- Several formats → one `--save <fmt>-file` per format plus `--output <tempdir>/page`; the wrapper reads the files back into a `dict[str, str]` keyed by format, then removes the temp dir.
- Read-back names follow the CLI's multi-format `--output` prefix: `page.txt`, `page.md`, `page.json`, `page.html`; `original` lands at `page.original.html` only when `html` is also requested (the CLI's collision tag), else at `page.html`.
- `formats` accepts a string or a sequence, defaults to `"markdown"`, and deduplicates preserving order; an unknown format raises before spawn.
- Exit `0` → success. Exit `2` → partial: a requested format yielded no content (the CLI warns on stderr and skips that output). The multi-format dict simply omits that format's key — the npm library's `Partial<Record<…>>` semantics; the single-format route raises `ContextractorError("extract-one produced no <fmt> output")`, since a `str` cannot represent absence. Exit `1`/other → raise (hard failure).

## Option mapping (`_options.py`)

A single data-driven table, `OPTION_SPECS`, applied immediately before spawn.
`ExtractOptions` keys must equal
`OPTION_SPECS` keys (enforced by `tests/test_options.py`). Categories:

- **scalar** → `--flag <value>` (e.g. `max_crawl_depth`, `mode`, `start_urls_file`, …).
- **bool-pair** → `--flag` / `--no-flag`: `headless`, `block_media`, `images`, `close_cookie_modals`.
- **negation-only** (default include; `False` emits the `--no-` flag): `links`, `comments`, `tables`.
- **bare-switch** (`True` emits the flag): `purge`, `ignore_cors_and_csp`, `ignore_https_errors`, `keep_url_fragment`, `use_sitemaps`, `respect_robots_txt`, `store_skipped_urls`, `verbose` (`-v`).
- **repeatable** (one flag per item): `proxy`, `globs`, `exclude`, `save` (`format-destination` tokens, e.g. `markdown-kvs`).
- **json** (`--flag <json.dumps>`): `cookies`, `headers`.

`storage_dir`, `output_dir`, `timeout` are explicit parameters, not in the table.
`dataset` / `key_value_store` / `request_queue` are intentionally absent — the
CLI always uses the `default` buckets under `--storage`.
`apify_proxy` / `groups` / `use_apify_proxy` are intentionally absent — the CLI
accepts only `http`/`https`/`socks4`/`socks5` proxies; unknown keys raise, and bad
proxy schemes raise `ProxySchemeError` before spawn.

`ExtractOneOptions` is the single-page subset of `ExtractOptions` (the proxy,
session, rendering, network, content, and verbosity knobs only).
`EXTRACT_ONE_OPTION_KEYS` (frozen from its annotations; enforced by
`tests/test_options.py` to stay a subset of `OPTION_SPECS`) gates
`build_extract_one_args`, which raises `ContextractorError` for every
`extract`-only key (crawl-frontier/storage/output options such as `globs`,
`selector`, `max_crawl_depth`, `save`, `purge`, plus `session_pool_name` —
cross-run session sharing needs persisted session-pool state under
`--storage`, which `extract-one` never touches) before delegating to
`build_extract_args`.

## Runtime resolution (`_runtime.py`)

- `resolve_node()` — `CONTEXTRACTOR_NODE_PATH` override, else the `nodejs-wheel-binaries` binary at `nodejs_wheel.executable.ROOT_DIR` (`bin/node` on POSIX, `node.exe` on Windows). Restores the exec bit (POSIX) if a wheel ZIP dropped it.
- `vendor_cli_dir()` — context manager that materializes the staged `_vendor/cli` tree as a real directory via `importlib.resources.as_file()` (a no-op yielding the on-disk path for a normal wheel; extracts to a temp dir, removed on exit, when imported from a zip/pex/shiv). Stays open across the whole subprocess run so the tree outlives the child.
- `cli_js(cli_dir)` / `playwright_cli_js(cli_dir)` — resolve `dist/cli.js` and `node_modules/playwright/cli.js` inside that materialized tree; raise `NodeRuntimeError` if assets were not staged.

## Asset bundling

The Node CLI ships **un-bundled** (plain `tsc` output; Crawlee/Playwright/commander
resolve assets via `__dirname`, so esbuild/ncc/SEA are forbidden). At wheel-build
time `scripts/stage_vendor.py` copies a `pnpm deploy --prod --config.node-linker=hoisted`
tree (npm-style real files — wheels can't carry pnpm's symlink store) into
`src/contextractor/_vendor/cli/`, restores `"type": "module"` (pnpm deploy strips
it), prunes every non-build-platform `.node` — both the bundled
`dist/native/contextractor-extraction-native.*.node` prebuilds and any
`node_modules/@contextractor/extraction-native-*` packages (defensive only:
`@contextractor/*` are devDependencies, so `pnpm deploy --prod` does not
carry them) — and seeds an `__init__.py` in every subdir (for
`importlib.resources`).
`_vendor/cli` is gitignored and force-included via the wheel `artifacts` glob. The
Node runtime itself is **not** bundled (it comes from `nodejs-wheel-binaries`);
browsers are never bundled (`python -m contextractor install`).

## Packaging & distribution

- Backend: hatchling + `hatch_build.py` (`pure_python=False`; explicit `tag = py3-none-{platform}`, pinned via `CONTEXTRACTOR_WHEEL_PLATFORM` in CI, inferred locally) → `py3-none-{platform}` wheels. Forbid maturin / scikit-build-core / uv_build.
- `version` is static in `pyproject.toml` (the `/projects:contextractor:release` and `/projects:contextractor:publish:pypi` bump target); `__version__` is read from installed metadata.
- `readme = "README.md"` → the PyPI project page; included in the sdist.
- Wheel matrix: `macosx_*_arm64`, `macosx_*_x86_64`, `manylinux_2_28_x86_64`, `manylinux_2_28_aarch64`, `win_amd64`, plus an sdist. **musl is unsupported** — the napi loader throws a clear import error rather than ship a broken `.node`.
- CI: `.github/workflows/release-pypi.yml` (cibuildwheel; `CIBW_BEFORE_ALL` stages `_vendor`; auditwheel/delocate repair disabled — there is no ELF Python extension; publish via PyPI Trusted Publishing / OIDC). It is sequenced **after** the napi-refresh PR opened by `build-napi.yml` for a `v*` tag, so wheels bundle current `.node` files — the gate is encoded in `/projects:contextractor:publish:pypi`.

## Tests

`pytest` + `pytest-asyncio` (subprocess boundary mocked; no network): argv mapping
per category, manifest tally, exit-2-is-partial (for both `extract` and
`extract-one`, incl. the partial multi-format dict and the single-format raise),
exit-1/other raise, UTF-8/CRLF byte fidelity through the sync runner, async path,
proxy redaction (incl. the sync-timeout path), node/CLI resolution + exec-bit
restore, and the Windows-napi consistency check. Two non-mocked layers:
`tests/test_integration_real_cli.py` drives the repo-built
`packages/standalone/dist/cli.js` with the system `node` through a multi-format
`extract_one` against a local `http.server` page (guards the file-naming
contract the fake CLI re-implements; auto-skips when `node` or the built CLI is
absent), and one env-gated real e2e (`CONTEXTRACTOR_E2E`).
