# packages/standalone — Specification

Standalone TypeScript CLI for local content extraction. Also exports a programmatic library API: a disk-backed `export` action, a Crawlee-shaped in-memory `createExtractor(...).run(urls)` facade, and a single-page `extractOne(url, options)` helper.

## Usage

```bash
contextractor extract [URLS...]
contextractor extract-one <url>
contextractor export [--output-dir <path>]
contextractor purge [--storage <path>]
```

Full flag reference: auto-generated table in `packages/standalone/README.md`. Every flag's `--help` text is sourced from the single `cliSurface` definition in `@contextractor/schema` (via `cliOptionDescription`), so the help, the README table, and `cli-surface.json` never drift.

## Subcommands

### `extract`

Extracts content from one or more URLs. Writes to Crawlee storage (Dataset and/or Key-Value Store), per the `--save` token destinations. Always the `default` buckets under `--storage` — one `--storage` path fully identifies a run's storage; different runs use different `--storage` dirs.

Options: all extraction flags (`--save`, `--max-requests-per-crawl`, `--headless`, `--crawler-type`, `--rendering-type-detection`, etc.) plus:

- `--start-urls-file <path>` — read start URLs line by line from a file
- `--save <token>` — repeatable `format-destination` token (e.g. `markdown-kvs`, `original-dataset`); default `markdown-kvs`. List a format twice to save to both destinations
- `--purge` — purge the storage at `--storage` before extracting; wipes all three bucket type dirs (`datasets/`, `key_value_stores/`, `request_queues/`), not just the default buckets
- `--storage <path>` — storage directory holding the `datasets`/`key_value_stores`/`request_queues` (default: `./storage` or the XDG data dir)
- `--use-sitemaps` — fetch `sitemap.xml` at each start URL domain root and enqueue matching URLs (filtered by `--globs` / `--exclude`) in addition to link-following
- `--store-skipped-urls` — push skipped URL records (`status: 'skipped'`) to the Crawlee dataset after the crawl
- `--initial-concurrency <n>` — initial parallel requests; Crawlee auto-scales up to `--max-concurrency`; `0` (default) lets Crawlee pick the starting concurrency
- `--block-media` / `--no-block-media` — block images, stylesheets, fonts, PDFs, and ZIPs (blocked by default; cuts browser memory/bandwidth; Chromium-only — no effect for `cheerio` or `playwright-firefox`)
- `--wait-for-dynamic-content <seconds>` — seconds to wait for network idle after navigation; also sets the timeout for `--wait-for-selector` / `--soft-wait-for-selector`; 0 disables (Playwright only)
- `--wait-for-selector <selector>` — CSS selector to wait for before extracting; request fails and is retried if selector does not appear within the timeout (Playwright only)
- `--soft-wait-for-selector <selector>` — like `--wait-for-selector` but continues extraction even if the selector does not appear (Playwright only)
- `--deduplication <level>` — deduplication level: `minimal` (Crawlee's built-in URL dedup only), `standard` (default, canonical URL dedup across all handler types), or `aggressive` (canonical URL + content hash dedup)
- `--session-pool-name <name>` — named session pool for cross-run session sharing (`persistStateKey`)
- `--max-session-rotations <n>` — max session rotations per request on block detection (default `10`)

### `extract-one`

Crawls exactly one URL (no link-following) and writes the extracted content to file(s) and/or stdout. Never touches Crawlee storage — nothing is persisted.

Shares every single-page flag with `extract` (`--headless`, `--proxy`, `--proxy-rotation`, `--max-session-rotations`, `--crawler-type`, `--rendering-type-detection`, `--wait-until`, `--navigation-timeout`, `--block-media`, `--ignore-cors-and-csp`, `--close-cookie-modals`, `--max-scroll-height`, `--ignore-https-errors`, `--user-agent`, `--respect-robots-txt`, `--cookies`, `--headers`, `--max-retries`, `--mode`, `--no-links`, `--no-comments`, `--no-tables`, `--images`, `--language`, `-v`/`--verbose`, `--wait-for-dynamic-content`, `--wait-for-selector`, `--soft-wait-for-selector`). The crawl-frontier, storage, and session-pool flags (`--globs`, `--exclude`, `--selector`, `--max-crawl-depth`, `--max-requests-per-crawl`, `--use-sitemaps`, `--keep-url-fragment`, `--initial-concurrency`, `--max-concurrency`, `--max-results`, `--deduplication`, `--store-skipped-urls`, `--session-pool-name`, `-c`/`--config-file`, `--start-urls-file`, `--storage`, `--purge`) stay on `extract` only — cross-run session sharing needs the persisted session-pool state under `--storage`, which `extract-one`'s non-persisting run never touches.

- `--save <token>` — repeatable `format-destination` token with the same grammar as `extract` but CLI-local destinations: format `txt|markdown|json|html|original`, destination `file|stdout` (`EXTRACT_ONE_TOKENS` in `extractOneOutput.ts`, derived as `SAVE_FORMATS` × `file|stdout` so a new canonical format flows in automatically — never in the shared schema or the Apify Actor). Default `markdown-stdout` (`DEFAULT_EXTRACT_ONE_SAVE`)
- At most one `-stdout` token — two or more is an error (exit `1`): the stdout stream carries one format's raw content only, never a JSON wrapper. All diagnostics (logs, progress, warnings) go to stderr (`StderrLoggerText` reroutes @apify/log), so stdout stays clean and pipeable
- The stdout write is awaited until the chunk is flushed to the OS before the process exits (pipe writes are asynchronous; exiting earlier would truncate at the pipe buffer), and EPIPE from a reader that closes early (`| head`) ends the stream quietly instead of crashing
- `-o, --output <path>` — file path for the `-file` tokens (ignored for `-stdout`):
  - exactly one `-file` format → literal path; the format's extension is appended only when the value has none (`report` → `report.md`; `report.md` → `report.md`; `report.txt` respected as-is)
  - two or more `-file` formats → base prefix; a trailing recognized extension (`.md`/`.html`/`.json`/`.txt`) is stripped and each format appends its own (`markdown`→`.md`, `html`→`.html`, `json`→`.json`, `txt`→`.txt`, `original`→`.html`)
  - a directory value (trailing slash or an existing dir) → URL-slug file names inside it (`slugify(host + pathname)`)
  - absent → URL-slug names in the cwd
  - when `html` and `original` are both written to files, `original` is tagged `.original.html` so they never overwrite

Exits `0` on full success, `1` on hard failure (crawl failed, invalid `--save` token, more than one `-stdout` token), `2` when the page was extracted but a requested format yielded no content (stderr warning per missing format; remaining `-file` outputs are still written). Backed by the library-callable `extractOne`.

### `export`

Exports stored extraction content to a user-facing output directory. The dataset is the record index; with the default `key-value-store` destination, content lives as KVS blobs that this command reads back. Only `success` records produce content files; every record (incl. failed/skipped) is written to `manifest.json`. Backed by the library-callable `runExportAction`.

- `--output-dir <path>` — output directory (default `./contextractor-output`)
- `--storage <path>` — storage directory to read from (always the `default` dataset and key-value store)

Readable file names are derived from `metadata.title` (falling back to the URL host/path, then `page`). Within a record, kinds are processed `markdown, txt, json, html, original` so the primary format keeps the clean `<slug>.<ext>` name; the `html`/`original` extension clash is resolved with a kind tag (`<slug>.original.html`), then a URL-hash suffix.

### `purge`

Takes `--storage <path>` and clears all three bucket type dirs (`datasets/`, `key_value_stores/`, `request_queues/`) at that location. One `--storage` = one storage — there is no multi-bucket root to sweep, so there is no `--all`.

## Config merge order

`schema defaults → config file (JSON) → explicit CLI args`

Config file: optional JSON file with the same camelCase shape as the Apify input schema. Its canonical contract is the published `schema/cli-input.schema.json` (a partial of `ContextractorInput` minus the named buckets) — authors associate it via a `$schema` key for editor validation/hover, and `loadConfigFile` strips that `$schema` key before merge. CLI-only flags (`--proxy`, `--storage`) are not accepted in the config file. Shared schema fields like `save` are honored from config. The named-bucket fields (`datasetName`, `keyValueStoreName`, `requestQueueName`) remain in the shared schema but are Apify-Actor-only — the CLI parses but ignores them and always uses the `default` buckets. Unknown keys are stripped by `ContextractorInput.parse()`.

## Output

Controlled by the `save` `format-destination` tokens (`--save`, default `markdown-kvs`). The output shape is identical to the Apify Actor's — record assembly and KVS key derivation come from the shared `@contextractor/crawler` sink core (`buildSuccessRecord`, `kvsKey`):

- **`*-kvs` token** — the content blob is written under a `{format}-{md5(url)}.{ext}` key (e.g. `txt-…txt`, `original-…html`), and the dataset record references it as a `ContentNode` (`{ hash, bytes, key }`; local storage has no public `url`)
- **`*-dataset` token** — content is inlined on the dataset record under that `ContentNode`'s `content` field
- **both** — listing a format against both destinations (`markdown-dataset markdown-kvs`) sets `content` AND `key`/`url` on the same node
- A dataset record is pushed for every page; all three crawl outcomes appear in the dataset index (and in `manifest.json` after `contextractor export`):
  - `status: 'success'` — `url`, `status`, nested `metadata`, `crawl: { loadedUrl, loadedTime, httpStatusCode, depth, referrerUrl }`, `original`, and per-format content — each a `ContentNode` (`hash` + `bytes` always present; inline `content` for a `*-dataset` token, `key`/`url` for a `*-kvs` token, both when routed to both)
  - `status: 'failed'` — always pushed; record has `url`, `crawl: { loadedUrl }`, `errors`, `retryCount`, `crawledTime` (ISO 8601)
  - `status: 'skipped'` — pushed only when `--store-skipped-urls` is set; record has `url` and `skipReason`

The CLI and the npm library always use the `default` Dataset, Key-Value Store, and Request Queue — the schema's `datasetName`/`keyValueStoreName`/`requestQueueName` are an Apify Actor concept and are not surfaced here.

Storage errors (write failures) are logged to stderr and do not abort extraction.

`extract` exits with code `2` when at least one request fails (partial failure); `0` on full success; `1` on fatal startup errors. `extract-one` follows the same convention: `0` on full success, `1` on hard failure, `2` when a requested format yielded no content (partial — stdout stays empty when the stdout-routed format is the missing one).

## Storage directory resolution

Five-level precedence (first match wins):

1. `--storage` CLI flag
2. `CONTEXTRACTOR_STORAGE_DIR` env var
3. `CRAWLEE_STORAGE_DIR` env var
4. `./storage` if `.actor/` or `./storage/` exists in the current working directory
5. `${XDG_DATA_HOME:-~/.local/share}/contextractor/storage`

## Testing

Proxy rotation is tested via the `/proxy-test` slash command, which verifies proxy configuration, rotation modes, and content extraction for this entry point alongside the Actor and library entry points.

See `tools/proxy-rotation-tester/README.md` for test documentation.

## Programmatic API

`contextractor` exports:

- `buildProgram()` — returns a configured Commander `Command` for programmatic use
- `runCli(program, argv)` — entry point used by the binary
- `isMainEntry(metaUrl)` — helper to detect if a module is the main entry
- `runExportAction(opts)` — library-callable `export` action; `ExportOpts` is `{ outputDir?: string; storageDir?: string }`; returns `ExportResult` (does not call `process.exit`)
- `runPurgeAction(opts)` — library-callable `purge` action; `PurgeOpts` is `{ storageDir?: string }`; resolves the storage dir and wipes the `datasets`, `key_value_stores`, and `request_queues` buckets; returns `PurgeResult` (`{ storageDir }`; does not call `process.exit`). The CLI `purge` subcommand and the `extract --purge` flag share this one implementation.
- `extractOne(url, options?)` — single-page extraction; see below
- `configureStorage(storageDir)` — sets Crawlee `localDataDirectory` and `purgeOnStart: false`
- `resolveStorageDir(flagValue?)` — five-level storage dir resolution
- `SAVE_FORMATS`, `SaveFormat` — the format vocabulary (`'txt' | 'markdown' | 'json' | 'html' | 'original'`), re-exported from `@contextractor/crawler`
- `Dataset`, `DatasetContent`, `KeyValueStore`, `Configuration` — re-exported from `crawlee`
- `ContextractorInput` / `ContextractorOutput` (+ `ContextractorInputType` / `ContextractorOutputType`) and `SAVE_ROUTE_TOKENS` / `SaveRoute` — the headline schema surface, re-exported from `@contextractor/schema`. The CLI and library validate with this SAME Zod object — there is no second schema.
- `getInputJsonSchema()` / `getOutputJsonSchema()` — the canonical draft-07 library-input and shared-output JSON Schemas, derived on demand from the Zod SoT (always in sync). The same projections are shipped as static files (next item).
- Schema artifacts: the published tarball ships `schema/library-input.schema.json`, `schema/output.schema.json`, `schema/cli-input.schema.json`, `schema/cli-surface.json`, `schema/field-presentation.json`, and `schema/format-presentation.json`, resolvable as the `contextractor/schema/library-input.json`, `contextractor/schema/output.json`, `contextractor/schema/cli-input.json`, `contextractor/schema/cli-surface.json`, `contextractor/schema/field-presentation.json`, and `contextractor/schema/format-presentation.json` subpaths (for `$schema`/SchemaStore association and non-TS consumers). `field-presentation.json` (per-field title/description/default/enum values+labels/CLI flags/Apify key/section) and `format-presentation.json` (per-output-format label + description) are Apify-aware presentation artifacts consumed by the contextractor-site playground form UI — not canonical schemas.

### Library run API

`createExtractor(options?)` returns `{ run(urls: string[]): Promise<RunResult> }` — a minimal Crawlee-shaped facade for running a crawl and getting results back in memory (construct-from-options, then `run(urls)`).

- `options: ContextractorOptions` — `Partial<Omit<ContextractorInputType, 'startUrls' | 'datasetName' | 'keyValueStoreName' | 'requestQueueName'>>` (camelCase field names matching the input schema exactly; the named-bucket fields are an Apify Actor concept — the library always uses the `default` buckets under `storageDir`) plus three **library-only** knobs that are intentionally NOT in the shared input schema (so they never leak into the Apify Actor input):
  - `includeHtml?: boolean` (default `false`) — when `false`, the returned records omit the raw `html` field (dropped at the TypeScript boundary, never in the native layer); `rawHtmlHash` / `rawHtmlLength` are retained regardless
  - `storageDir?: string` — when set, ALSO write full records to disk via `createCrawleeStorageSink` (dual-sink); in-memory results are returned either way
  - `logLevel?: 'off' | 'error' | 'warning' | 'info' | 'debug'` (default `warning`) — Crawlee log threshold for the run; the level is restored after `run()` resolves. Crawlee's `log` level is a process-global singleton, so `run()` is **not** safe to invoke concurrently with overlapping `run()` calls or other Crawlee usage — the threshold is shared.
- `run(urls)` resolves to `{ dataset: ResultDataset; statistics: RunStatistics }`:
  - `ResultDataset` (over in-memory `LibraryRecord[]`) — `count`, `getData()` / `export()` (fresh array copies), `forEach(iteratee)` (awaits async iteratees), `exportToJSON(key, store?)` / `exportToCSV(key, store?)` (write to a Crawlee key-value store; default store if omitted)
  - `LibraryRecord` = `Omit<ExtractionResult, 'html'> & { html?: string }`
  - `RunStatistics` = `{ requestsFinished, requestsFailed, requestsTotal }`, projected from Crawlee's `FinalStatistics`
- The in-memory dataset holds **successful extractions only**. Failed requests are counted in `statistics.requestsFailed`; skipped (deduped / over-limit) requests are **not** separately counted — they register as `requestsFinished` with no corresponding record. Neither failures nor skips appear in the in-memory dataset. When `storageDir` is set they are also pushed to the disk dataset as `status: 'failed'` / `status: 'skipped'` records, mirroring the CLI.
- `run()` **never throws on partial failure and never calls `process.exit()`** — counts surface in `statistics`. It throws only on invalid options (schema validation) or an unsupported/malformed proxy scheme.
- Proxy URLs are read from `proxyConfiguration.proxyUrls`; only `http/https/socks4/socks5` schemes are accepted; Apify Proxy (`useApifyProxy` / `groups`) is Actor-only and rejected. Proxy errors throw with credentials redacted from the message — proxy URLs/tokens never appear in returned records or `statistics`.
- The returned set is bounded by `maxResultsPerCrawl` (camelCase schema field; `0` = unlimited). In-memory results target small/medium crawls (guidance: < ~10k pages); for very large crawls use the disk/Apify sink.

### Single-page API

`extractOne(url, options?)` — sibling of `createExtractor` — crawls exactly one URL (no link-following) and resolves to `Partial<Record<SaveFormat, string>>` keyed by the requested formats.

- `options: ExtractOneOptions` — the single-page subset of `ContextractorOptions`. It DROPS `save`, `storageDir`, `includeHtml` (use `formats: ['original']` for the raw page HTML), `sessionPoolName` (cross-run session sharing needs persisted session-pool state; every `extractOne` run is isolated and non-persisting) and the crawl-frontier knobs — `maxCrawlDepth: 0` and `maxRequestsPerCrawl: 1` are hard-pinned; no `globs`/`exclude`/`selector`/`useSitemaps`/`keepUrlFragment`/`initialConcurrency`/`maxConcurrency`/`maxResultsPerCrawl`/`deduplication`/`storeSkippedUrls`. Adds `formats?: SaveFormat[]` (default `['markdown']`).
- Nothing is persisted: the run binds to an isolated, non-persisting Crawlee `Configuration` (the mutable global config is never touched, so concurrent `createExtractor` runs are unaffected) and a fresh per-run request queue (dropped afterwards).
- Throws when the single request fails (unlike `run()`, which never throws on partial failure).

## Sinks

- `createCrawleeStorageSink({ routes, kvs, dataset })` — writes to KVS and/or Dataset per the per-format `routes` map (a `RouteMap`); errors are caught and logged to stderr
- `combineSinks(...sinks)` — fan-out combinator; awaits each sink in order. The library run uses it for the dual-sink path, placing the disk sink first so it receives the full `ExtractionResult` (including `html`) before the in-memory adapter strips it.
- `toCrawlerOptions(cfg, runtime)` (in `config.ts`) — the single `CrawlConfig` → `ContextractorCrawlerOptions` projection shared by the CLI `extract` action and the library `run()`. `runtime` carries the result sink, optional proxy config/rotation, sitemap request list / request queue, and the failure/skip callbacks.

## Build and packaging

The published `contextractor` tarball carries **zero `@contextractor/*` runtime dependencies** — the internal packages are bundled into `dist` by tsup (`noExternal: [/^@contextractor\//]`); `@contextractor/crawler` and `@contextractor/schema` are `devDependencies` only. Runtime dependencies: `@ghostery/adblocker-playwright`, `commander`, `crawlee`, `playwright`, `zod`. The `files` allowlist is `["dist", "schema", "README.md"]` — `schema/` ships the four generated JSON Schema/CLI-surface artifacts plus the `field-presentation.json` and `format-presentation.json` presentation artifacts (committed, snapshot-tested in `@contextractor/schema`) exposed via the `./schema/*` `exports` subpaths.

- Build: `pnpm run fix && tsup && tsc -p tsconfig.dts.json && api-extractor run --local` (the dts pass typechecks src; the `test` script runs `tsc --noEmit` over the full project incl. tests before vitest)
- Native addon: an esbuild plugin redirects `@contextractor/extraction-native` to the external `./native/index.cjs`; `onSuccess` stages the napi-rs loader as `dist/native/index.cjs` plus one `dist/native/contextractor-extraction-native.<platform>.node` per platform directory found under `packages/extraction/native/npm/` (derived by readdir — a new prebuild ships automatically; an empty list fails the build) — the loader's `__dirname`-based local-file branch picks the right one at runtime
- Attribution: the package declares `"license": "Apache-2.0"` (matching the root `LICENSE` and the PyPI `pyproject.toml`); `onSuccess` also copies the repo-root `NOTICE` and `LICENSE` into `dist/` so the Apache-2.0 license text and third-party attribution (Ghostery MPL-2.0) ship in the tarball via the `dist` allowlist
- Typings: one self-contained `dist/index.d.ts` — `tsc -p tsconfig.dts.json` (`emitDeclarationOnly` into `dist-types/`) then api-extractor's dts rollup inlines the internal packages via `bundledPackages`
- Publishing: `.github/workflows/release-npm.yml` (manual `workflow_dispatch`; npm ≥ 11.5.1; npm Trusted Publishing / OIDC with `npm publish --provenance` — the `repository` field in `package.json` is required for the provenance/Sigstore check). The workflow strips `devDependencies` (their `workspace:*` specifiers must not reach the registry) and gates on tarball contents (`dist/cli.js` + one `.node` per committed platform) and version consistency before publishing. Sequenced after the `build-napi.yml` napi-refresh merge — the gate is encoded in `/projects:contextractor:publish:npmjs`
- Code splitting is ON: the two entries (`cli`, `index`) share the bundled internals via chunks in `dist/` instead of duplicating ~900 KB into each; `cli.ts`'s own top-level code (the `isMainEntry(import.meta.url)` bin check) stays in the `dist/cli.js` entry chunk, and a `createRequire` banner gives the bundled CJS code a working `require` in every emitted ESM file
- `engines.node >= 22` is declared (the bundle targets `node22`)
