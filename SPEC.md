# Contextractor — Specification

## Overview

Contextractor crawls websites and extracts clean, readable main-content text. Built on **`rs-trafilatura`** (Rust port of Trafilatura, accessed via a napi-rs binding) and **[Crawlee](https://crawlee.dev/)** (TypeScript crawler; adaptive Playwright by default, with Chromium / Firefox / Cheerio engines).

Available as:

- **Apify Actor** — `glueo/contextractor` on the Apify platform; output saved to the run's Key-Value Store + Dataset
- **Standalone CLI** (`contextractor`) — local TypeScript CLI; output written to disk and/or Crawlee storage (Dataset / KeyValueStore)
- **Extraction library** (`@contextractor/extraction`) — embedded engine used by both surfaces above
- **Python wrapper** (`contextractor` on PyPI) — `packages/standalone-python/`; drives the standalone CLI as a subprocess (bundles a Node runtime via `nodejs-wheel`); see `packages/standalone-python/SPEC.md`

> **Note — PyPI package is alpha:** The `contextractor` PyPI package (`packages/standalone-python/`) is an **alpha**, experimental release — not yet fully tested or officially supported, though still maintained. It must stay documented here and ships its own registry README, but must **not** be advertised or promoted on the website homepage / About or in other packages' distribution lists. Its only user-facing surfaces are its own help page (`/help/pypi/`) and the link to it from the `/help/` hub (kept by design).

Supported output formats: `txt | markdown | json | html | original`.

## Architecture

```
packages/extraction/        TypeScript engine + napi-rs Rust crate
packages/crawler/           Shared Crawlee crawler factory (adaptive Playwright / Chromium / Firefox / Cheerio)
packages/schema/            Zod 4 single source of truth for input
packages/apify-actor/       Apify Actor  (depends on crawler + schema; extraction via crawler)
packages/standalone/        Standalone CLI + npm library (bundles crawler + schema + extraction into dist via tsup)
packages/standalone-python/ PyPI wrapper library (drives dist/cli.js; not a pnpm/turbo member)
```

Data flow:

```
Input URLs → [SitemapRequestList (optional)] → Crawlee crawler (adaptive Playwright by default) → ContentExtractor (TS) → sink
                                                                                           ├── KVS + Dataset (Actor)
                                                                                           ├── KVS + Dataset (CLI)
                                                                                           └── memorySink adapter → ResultDataset (library run); optional combineSinks → KVS + Dataset
```

The standalone library's `createExtractor(...).run(urls)` collects results in memory via a `memorySink` adapter (raw `html` excluded by default) and returns a `ResultDataset` handle plus a `statistics` subset of Crawlee's `FinalStatistics`; setting `storageDir` fans out to the disk sink as well. Its sibling `extractOne(url, options)` crawls exactly one URL (no link-following, nothing persisted — a non-persisting in-memory storage client) and resolves to a `format → string` map keyed by the requested `formats` (default `['markdown']`).

The **Python wrapper** (`packages/standalone-python/`) is an out-of-process CLI consumer: `extract()`/`aextract()` spawn `node dist/cli.js extract …` (writes to a private Crawlee storage dir) then `node dist/cli.js export …` (writes `<output_dir>/manifest.json`), and return per-status counts read from that manifest. `extract_one()`/`aextract_one()` spawn a single `node dist/cli.js extract-one …` and return the extracted content directly. Python loads no JS and no napi `.node` — Node does.

When `useSitemaps` is enabled, `SitemapRequestList.open()` fetches `sitemap.xml` at each start URL's domain root and feeds discovered URLs into the crawler alongside the explicit start URLs.

### Native binding

```
TS engine → require('@contextractor/extraction-native')
         → loader picks @contextractor/extraction-native-<platform>
         → loads contextractor-extraction-native.<platform>.node
         → calls into rs-trafilatura via napi-rs
```

Platform prebuilds (`darwin-arm64`, `darwin-x64`, `linux-x64-gnu`, `linux-arm64-gnu`, `win32-x64-msvc`) are committed under `packages/extraction/native/npm/<platform>/` and refreshed by CI on tag pushes. musl/Alpine is unsupported — the loader throws a clear import error rather than load a glibc `.node`. The `.node` files ship via `optionalDependencies` — no Rust toolchain needed in the production image.

The published `contextractor` npm package carries no `@contextractor/*` runtime dependencies: tsup bundles the internal packages into `dist` (they are devDependencies of the published package) and stages the napi-rs loader plus all five `.node` prebuilds under `dist/native/`; typings ship as one self-contained `dist/index.d.ts` (tsc declaration emit bundled by api-extractor).

## Stack

- **TypeScript 6.x** — all app logic
- **Rust 1.85+ (Edition 2024)** — only the `napi-rs` wrapper around `rs-trafilatura`; no other Rust crates
- **`rs-trafilatura` 0.2.x** — Rust port of Trafilatura; drives all extraction
- **Crawlee 3.x** — selectable crawler engine via `crawlerType`: `AdaptivePlaywrightCrawler` (default), `PlaywrightCrawler` (chromium/firefox), or `CheerioCrawler` (raw HTTP, no JS)
- **Apify SDK 3.x** (Actor only)
- **commander** for the standalone CLI
- **Zod 4** for input schema and validation
- **vitest** — TypeScript unit tests; **cargo test** — Rust crate tests
- **Biome** — TypeScript lint + format
- **pnpm 10** workspace + **Cargo workspace** at the repo root
- **knip** — dead-code and unused-export analysis; `examples/` is excluded via `knip.json` (examples are not workspace packages and have no `workspace:*` deps)

## Tools

Internal tooling under `tools/` for development, testing, and code generation:

- **`gen-input-schema`** — generates the four `packages/apify-actor/.actor/*.json` files **and** the canonical npm-package artifacts under `packages/standalone/schema/` (library-input, shared output, CLI config, CLI surface) plus the `field-presentation.json` presentation artifact from the one Zod schema
- **`gen-md-regions`** — auto-regenerates markdown sections in READMEs from schemas and JSON outputs
- **`platform-test-runner`** — orchestrates integration tests against Apify Platform
- **`proxy-simulator`** — mock HTTP proxy server for testing proxy rotation
- **`proxy-rotation-tester`** — comprehensive test suite for proxy rotation across all entry points
- **`consent-corpus-tester`** — multilingual crawl corpus (~90 real sites) exercising consent-wall handling and main-content extraction; a diagnostic regression harness, not a green-on-every-site gate

See individual tool README.md files for usage details.

## Input Schema

Canonical definition: `packages/schema/src/source-of-truth/input.ts` (`ContextractorInput` Zod schema). There is exactly ONE schema; every surface (Apify Actor, npm library, CLI) consumes a derived projection of it, never a hand-maintained copy. Apify-only UI hints live in `apifyRegistry` (a `z.registry()`), not inline `.meta()`, so the Zod source — and every JSON Schema derived from it via `z.toJSONSchema()` — is Apify-agnostic; the Apify generators join the registry back in at build time.

`packages/apify-actor/.actor/input_schema.json` is generated at build time by `@contextractor/gen-input-schema`, which also emits the canonical, non-Apify npm-package schemas under `packages/standalone/schema/`: the per-surface library/CLI inputs (`library-input.schema.json`, `cli-input.schema.json`), the single shared output (`output.schema.json`), and the CLI field↔flag map (`cli-surface.json`). The input table in `packages/apify-actor/README.md` and the CLI flags table in `packages/standalone/README.md` are auto-rebuilt from the same source by `@contextractor/gen-md-regions`.

Alongside the canonical schemas, the generator emits `packages/standalone/schema/field-presentation.json` — a **presentation artifact** (one entry per `ContextractorInput` field: `title`, `description`, `default`, `enumValues`, `enumTitles`, `cliFlags`, `apifyKey`, `section`). Like `OutputViews`, it is explicitly Apify-aware (it MAY carry `enumTitles`/`section`) and is NOT subject to the no-dialect guard. It exists so an external form UI (the contextractor-site playground) can source field labels, enum titles, defaults, CLI flags, and Apify keys from one import (`contextractor/schema/field-presentation.json`) instead of hand-maintained copies. Built by `packages/schema/src/presentation/to-field-presentation.ts`; snapshot-locked by `packages/schema/test/to-field-presentation.test.ts`.

### Content extraction fields

The public input surface exposes first-class top-level extraction fields rather than a nested `trafilaturaConfig` object:

- `mode` — `'precision' | 'balanced' | 'recall'` (default `'balanced'`)
- `includeComments` — boolean, default `true`
- `includeTables` — boolean, default `true`
- `includeImages` — boolean, default `false`
- `includeLinks` — boolean, default `true`
- `languageCode` — string, default `''` (empty means accept any language)

Internal binding-only knobs (`favorPrecision`, `favorRecall`, `includeFormatting`, `withMetadata`, `onlyWithMetadata`, `teiValidation`, `deduplicate`, `fast`) remain inside `@contextractor/extraction` / `@contextractor/crawler` and are not part of the user-facing schema.

### Standalone CLI config file

The CLI accepts an optional JSON config file with the same camelCase shape as the Apify input schema; its canonical contract is the published `packages/standalone/schema/cli-input.schema.json`, which authors associate via a `$schema` key (tolerated and stripped by `loadConfigFile`) for editor validation/hover. CLI-only flags (no schema equivalent) include `-c, --config-file`, `--purge`, `--proxy`, `-v, --verbose`, `--storage`, and `--start-urls-file`. Beyond `extract`, the CLI also defines `extract-one` (crawl exactly one URL, no link-following, output to file(s)/stdout via `<format>-file`/`<format>-stdout` save tokens and `-o, --output`), `export`, and `purge` subcommands. Shared schema fields like `save` are honored from config; the named-bucket fields `datasetName`, `keyValueStoreName`, and `requestQueueName` remain in the schema but are Apify-Actor-only — the CLI parses and ignores them, always using the `default` buckets, so one `--storage` path fully identifies a run's storage.

Config merge order: `schema defaults → config file → explicit CLI args`.

## Output Schema

### Apify Actor — Dataset entry

**`save: ["original-kvs", "markdown-kvs", "txt-kvs"]` (key-value-store blobs; `markdown-kvs` is the default)**

```json
{
  "url": "https://example.com/page",
  "status": "success",
  "metadata": {
    "title": "Page Title",
    "author": null,
    "publishedAt": "2024-01-15",
    "description": "Meta description",
    "siteName": "Example Site",
    "languageCode": "en"
  },
  "crawl": {
    "loadedUrl": "https://example.com/page",
    "loadedTime": "2026-04-27T18:58:36Z",
    "httpStatusCode": 200,
    "depth": 0,
    "referrerUrl": null
  },
  "original": {
    "hash": "d41d8cd98f00b204e9800998ecf8427e",
    "bytes": 89898,
    "key": "original-abc123.html",
    "url": "https://api.apify.com/v2/key-value-stores/{id}/records/original-abc123.html"
  },
  "markdown": { "hash": "...", "bytes": 6887, "key": "markdown-abc123.md", "url": "..." },
  "txt": { "hash": "...", "bytes": 5200, "key": "txt-abc123.txt", "url": "..." }
}
```

**`save: ["original-dataset", "markdown-dataset", "txt-dataset"]` (inline in the dataset record)**

```json
{
  "url": "https://example.com/page",
  "status": "success",
  "metadata": { "title": "Page Title", "author": null, "publishedAt": "2024-01-15", "description": "Meta description", "siteName": "Example Site", "languageCode": "en" },
  "crawl": { "loadedUrl": "https://example.com/page", "loadedTime": "2026-04-27T18:58:36Z", "httpStatusCode": 200, "depth": 0, "referrerUrl": null },
  "original": { "hash": "d41d8cd98f00b204e9800998ecf8427e", "bytes": 89898 },
  "markdown": { "hash": "5d41402abc4b2a76b9719d911017c592", "bytes": 6887, "content": "# Page Title\n\nContent..." },
  "txt": { "hash": "7215ee9c7d9dc229d2921a40e899ec5f", "bytes": 5200, "content": "Page Title\n\nContent..." }
}
```

Rules:

- every content field is a `ContentNode` object: `hash` (32-char MD5) and `bytes` (UTF-8 byte length) are always present; the inline content is under `content` when the format targets the dataset (a `*-dataset` token), while `key` + `url` reference the stored blob when it targets the key-value store (a `*-kvs` token). A format routed to both carries `content` AND `key`/`url`
- `original`: always present (at least `{ hash, bytes }`); its raw HTML is included (as `content`, or `key`/`url`) only when an `"original-*"` token is in `save`
- `markdown`, `txt`, `json`, `html`: present per format when extracted
- crawl provenance is nested under `crawl`: `loadedUrl`, `loadedTime`, `httpStatusCode`, `depth`, `referrerUrl` (the `failed` record's `crawl` holds only `loadedUrl`). Crawl-EVENT timestamps use `*Time` (`crawl.loadedTime`, failed `crawledTime`); content-metadata dates use `*At` (`metadata.publishedAt`)
- `metadata`: extracted via the napi-rs binding from `rs-trafilatura`; `languageCode` is the detected ISO 639 code

### Apify Actor — Key-Value Store

Storage keys are `{format}-{md5(url)}.{ext}` — the content format, the full 32-char MD5 hex of the request URL, and the format's extension. The same scheme is used by the standalone CLI/lib (shared `@contextractor/crawler` sink core) and groups into the `key_value_store_schema.json` collections by format prefix:

- `original-{md5}.html` — raw HTML (when an `original-kvs` token is present)
- `txt-{md5}.txt` — plain text
- `json-{md5}.json` — JSON
- `markdown-{md5}.md` — Markdown
- `html-{md5}.html` — extracted HTML

### Standalone CLI — output

Output is identical in shape to the Apify Actor (shared sink core). Controlled by the `save` `format-destination` tokens (`--save`, default `markdown-kvs`): KVS blobs (a `*-kvs` token) use the same `{format}-{md5(url)}.{ext}` keys; a dataset record is pushed per page with `url`, `status: 'success'`, nested `metadata`, `crawl` (`loadedUrl`, `loadedTime`, `httpStatusCode`, `depth`, `referrerUrl`), `original`, and per-format content — each content field a `ContentNode` (`hash` + `bytes` always present; `key`/`url` for a `*-kvs` token, inline `content` for a `*-dataset` token, both when routed to both). `status: 'failed'` records are pushed for exhausted retries, and optional `status: 'skipped'` records when `--store-skipped-urls` is set. The local key-value store has no public URL, so `ContentNode.url` is absent (it is present on the Apify platform).

`--purge` purges the storage at `--storage` before extraction begins — it wipes all three bucket type dirs (`datasets/`, `key_value_stores/`, `request_queues/`) at that location.

The standalone CLI's `extract` exits with code `2` when at least one request fails after retries, while still flushing dataset/KVS output for the rest of the crawl. `extract-one` follows the same convention: `0` on full success, `1` on hard failure, `2` when the page was extracted but a requested format yielded no content (partial). Its stdout carries only the raw content of the single `-stdout` save token (all diagnostics go to stderr); the write is flushed before exit and an early-closing reader (EPIPE) ends the stream quietly.

## Build

```bash
pnpm --filter @contextractor/extraction-native build:rebuild  # Host-platform .node
pnpm build                                                      # TypeScript packages (turbo) + regen .actor schemas and @generated docs
cargo build --workspace                                         # Rust crate
```

Cross-platform `.node` prebuilds (CI runs the equivalent matrix):

```bash
pnpm --filter @contextractor/extraction-native exec -- napi build --platform --release --target aarch64-apple-darwin
pnpm --filter @contextractor/extraction-native exec -- napi build --platform --release --target x86_64-apple-darwin
pnpm --filter @contextractor/extraction-native exec -- napi build --platform --release --target x86_64-unknown-linux-gnu --cross-compile
pnpm --filter @contextractor/extraction-native exec -- napi build --platform --release --target aarch64-unknown-linux-gnu --cross-compile
pnpm --filter @contextractor/extraction-native exec -- napi build --platform --release --target x86_64-pc-windows-msvc
```

## Docker (Apify Actor)

Multi-stage Dockerfile at `packages/apify-actor/Dockerfile`:

- **Builder stage** (`apify/actor-node-playwright-chrome:24 AS builder`): runs `pnpm install`, builds the five packages in dependency order (`@contextractor/schema`, `@contextractor/extraction`, `@contextractor/crawler`, `contextractor`, `@contextractor/apify`), then `pnpm --filter @contextractor/apify --prod deploy /deploy` to produce a self-contained bundle and rewrites the deployed `package.json` to set `"type": "module"`.
- **Runtime stage** (`apify/actor-node-playwright-chrome:24`): copies `/deploy` to `/usr/src/app`, runs `node dist/main.js`.

`actor.json` sets `"dockerContextDir": "../../.."` so the Docker build context is the repo root, exposing all `packages/`. Production deploys go through a **Git-connected build** in Apify Console — `apify push` does not honor `dockerContextDir` for contexts above the actor directory.

`actor.json` also declares the run memory: `minMemoryMbytes: 2048`, `defaultMemoryMbytes: 4096`, `maxMemoryMbytes: 8192`. Because this is a Chromium/Playwright actor, peak memory scales with concurrent browser pages; the schema `maxConcurrency` default is a browser-safe `3` (Crawlee's autoscaler cannot abort in-flight pages, so concurrency is the only hard memory cap) and `blockMedia` defaults to `true` to reduce browser memory. The resolved default propagates to memory-less runs but must be confirmed in the Console on the Git-connected build.

## CI

`.github/workflows/build-napi.yml` builds all five `.node` prebuilds (darwin arm64/x64, linux gnu x64/arm64, win32-x64-msvc) on release tags (`v*`) and opens a PR refreshing `packages/extraction/native/npm/<platform>/`.

`.github/workflows/release-pypi.yml` (manual `workflow_dispatch`) builds the `contextractor` PyPI wheels via cibuildwheel (`macosx_*_arm64`/`x86_64`, `manylinux_2_28_x86_64`/`aarch64`, `win_amd64`) plus an sdist and publishes via PyPI Trusted Publishing (OIDC). It bundles the current `.node` prebuilds, so it must run **after** the `build-napi.yml` refresh PR for the tag is merged — that ordering gate is enforced by the release process in the tools dev repo.

`.github/workflows/release-npm.yml` (manual `workflow_dispatch`) builds the `contextractor` npm tarball (`pnpm exec turbo run build --filter=contextractor`) and publishes it to npmjs.com via npm Trusted Publishing (OIDC, `npm publish --provenance`; npm ≥ 11.5.1). It gates on version consistency (the `vX.Y.Z` tag must be an ancestor of the dispatched ref; the version must not already exist on npm) and on tarball contents (`dist/cli.js` plus one `.node` per committed platform prebuild). Like the PyPI workflow it must run **after** the `build-napi.yml` refresh PR for the tag is merged — that ordering gate, and the release cut itself (version bump, commit, tag, push), are owned by the release process in the tools dev repo.
