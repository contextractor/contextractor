# @contextractor/schema — Specification

Zod 4 single source of truth for all Contextractor input. Both the Apify Actor and the standalone CLI feed raw input through `ContextractorInput.parse()`.

## Exports

- `ContextractorInput` — Zod schema; use `.parse()` or `.safeParse()` to validate and coerce input
- `ContextractorInputType` — TypeScript type inferred from the schema
- `SAVE_ROUTE_TOKENS` / `SaveRoute` — the const array of the 10 `format-destination` save tokens and its inferred string-literal union type
- `ContextractorOutput` — Zod schema for dataset output items
- `ContextractorOutputType` — TypeScript type inferred from the output schema
- `apifyRegistry` / `ApifyMeta` — the `z.registry<ApifyMeta>()` holding all Apify-only UI hints (keyed by field schema) and its hint type. The Zod source-of-truth keeps only vanilla JSON Schema keywords inline (`.describe()` and `.meta({ title })`); Apify hints attach via `.register(apifyRegistry, { … })`, so every JSON Schema derived with `z.toJSONSchema()` is Apify-agnostic. Look a field's hints up with `apifyRegistry.get(ContextractorInput.shape[name])`.
- `toApifyInputSchema(schema, opts?)` — converts a Zod object schema to Apify's `input_schema.json` format (joining `apifyRegistry` hints back in); call sites pass `ContextractorInput` explicitly
- `writeApifyInputSchema(schema, outPath, opts?)` — writes `input_schema.json` (called by `@contextractor/gen-input-schema`)
- `ApifyInputSchemaJSON`, `ToApifyInputSchemaOptions` — supporting types for the input-schema generator
- `KvsCollections`, `OutputViews` — Apify Console presentation config consumed by the dataset/output/KVS schema generators
- `toDatasetSchema` / `writeDatasetSchema`, `toKeyValueStoreSchema` / `writeKeyValueStoreSchema`, `toOutputSchema` / `writeOutputSchema` — generators for the dataset, key-value-store, and output schemas

### Canonical (non-Apify) projections

The library and CLI surfaces consume vanilla draft-07 JSON Schema derived from the SAME Zod SoT — never a hand-maintained copy. Input is per-surface; output is one shared schema across surfaces. All carry a stable `$id` and assert no Apify dialect leaks in.

- `ContextractorLibraryInput` — the library input Zod object (`ContextractorInput` − `startUrls`/`datasetName`/`keyValueStoreName`/`requestQueueName` + the library-only `includeHtml`/`storageDir`/`logLevel`); mirrors `ContextractorOptions` in the `contextractor` package
- `toLibraryInputSchema()` / `writeLibraryInputSchema(outPath)` — the library-input JSON Schema → `packages/standalone/schema/library-input.schema.json`
- `toSharedOutputSchema(schema?)` / `writeSharedOutputSchema(outPath)` — the SINGLE shared output schema (top-level `oneOf`) → `packages/standalone/schema/output.schema.json` (library + CLI)
- `toCliInputSchema()` / `writeCliInputSchema(outPath)` — the CLI config-file JSON Schema (a partial of `ContextractorInput` minus the named buckets) → `packages/standalone/schema/cli-input.schema.json`
- `cliSurface` / `CliSurfaceOption` / `cliOptionDescription(id)` / `toCliSurface()` / `writeCliSurface(outPath)` — the single CLI field↔flag↔kind↔subcommand definition; each option also carries an optional `defaultLabel` (the value exactly as `--help` renders it after `default:` — the custom label like `unlimited` where cliProgram uses one, else the JSON-rendered default), which the README `cli-flags` table appends as `(default: …)`; `cliProgram.ts` sources `--help` text via `cliOptionDescription`, and `cli-surface.json` serializes the map for external consumers
- `LIBRARY_INPUT_SCHEMA_ID` / `SHARED_OUTPUT_SCHEMA_ID` / `CLI_INPUT_SCHEMA_ID` — the stable `$id` URLs (versioning is done by changing the URL, not the payload)

### Presentation artifacts

Unlike the canonical projections above, the presentation artifacts are explicitly Apify-aware (like `OutputViews`) — they MAY carry `enumTitles`/`section` and are NOT subject to the no-dialect guard. They exist so an external form UI (the contextractor-site playground) renders fields, formats, and their help from a SINGLE import each. They are presentation artifacts, not canonical input schemas.

`field-presentation` joins the canonical JSON Schema metadata (`title`/`description`/`default`/`enumValues`) with `apifyRegistry` hints (`enumTitles`/`section`) and the `cliSurface` flag(s) for each field:

- `toFieldPresentation()` / `writeFieldPresentation(outPath)` — the per-field presentation document → `packages/standalone/schema/field-presentation.json` (iterates the Zod shape in declaration order, so the artifact's field order tracks the SoT)
- `FieldPresentation` / `FieldPresentationDocument` — one field entry (`field`, `title`, `description`, `default?`, `enumValues?`, `enumTitles?`, `cliFlags`, `apifyKey`, `section?`) and the wrapping document (`title`, `description`, `fields`)

`format-presentation` carries one entry per OUTPUT FORMAT for the playground's "Output" checkboxes' `?` help, derived from the SoT — the `label` from the `save` field's `enumTitles` (the text before the `→ destination`), the `description` from the output record's per-format `.describe(...)`:

- `toFormatPresentation()` / `writeFormatPresentation(outPath)` — the per-format presentation document → `packages/standalone/schema/format-presentation.json` (one entry per format in `SAVE_ROUTE_TOKENS` declaration order)
- `FormatPresentation` / `FormatPresentationDocument` — one format entry (`format`, `label`, `description`) and the wrapping document (`title`, `description`, `formats`)

## Schema structure

Fields are grouped into five Apify Console UI sections by `sectionCaption` boundaries (the form renders them in this order). `startUrls` is the first field and carries no caption:

- **Crawler settings** — `crawlerType` (enum: `playwright-adaptive|playwright-firefox|playwright-chromium|cheerio`, default `playwright-adaptive`; opens this section), `renderingTypeDetectionRatio` (number 0–1, default `0.1`; matches Crawlee's `AdaptivePlaywrightCrawlerOptions.renderingTypeDetectionRatio`), `globs`, `exclude`, `selector` (Crawlee `EnqueueLinksOptions` names), `keepUrlFragment`, `useSitemaps` (bool, default `false`; fetches sitemap.xml at each start URL domain root and enqueues matching URLs), `deduplication` (enum: `minimal|standard|aggressive`, default `'standard'`; `standard`: skip pages whose `<link rel="canonical">` was already extracted, across all handler types; `aggressive`: additionally skip pages whose extracted text content hash was already seen; `minimal`: only Crawlee's built-in URL dedup), `respectRobotsTxtFile`, `initialCookies` (array of cookie objects injected into the browser context), `customHttpHeaders` (object of extra HTTP headers), `maxRequestsPerCrawl` (int ≥ 0, default `0` = unlimited; passed straight to Crawlee's `BasicCrawlerOptions.maxRequestsPerCrawl`, counting handled page outcomes), `maxResultsPerCrawl`, `maxCrawlDepth`, `initialConcurrency` (int ≥ 0, default `0`; maps to Crawlee `minConcurrency`; `0` lets Crawlee pick the default), `maxConcurrency` (int ≥ 1, default `3`; browser-safe — Crawlee cannot abort in-flight pages, so concurrency is the only hard cap on peak memory; raise it for lightweight pages or the `cheerio` crawler), `maxRequestRetries`
- **Content extraction** — `mode` (enum: `precision|balanced|recall`, default `balanced`; opens this section), `includeComments` (bool, default `true`), `includeTables` (bool, default `true`), `includeImages` (bool, default `false`), `includeLinks` (bool, default `true`), `languageCode` (string, default `''`; empty = accept any language)
- **Output settings** — `save` (array of `format-destination` tokens: the cross-product of formats `txt|markdown|json|html|original` and destinations `dataset|kvs` — `txt-dataset txt-kvs markdown-dataset markdown-kvs json-dataset json-kvs html-dataset html-kvs original-dataset original-kvs`; at least one required, default `['markdown-kvs']`; opens this section. List a format twice to save to both destinations. Saving `original`/`html` to the dataset risks out-of-memory on large pages — prefer `kvs`. The exported `SaveRoute` string-literal union mirrors these 10 tokens), `datasetName`, `keyValueStoreName`, `requestQueueName` (Apify Actor only — the standalone CLI parses but ignores them and always uses the `default` buckets), `storeSkippedUrls` (bool, default `false`; pushes a dataset record for each skipped URL)
- **Proxy** — `proxyConfiguration` (opens this section), `proxyRotation` (enum: `recommended|per-request|until-failure`, default `recommended`), `sessionPoolName` (string `[0-9A-Za-z_-]` 3–200 chars, optional; persists the session pool across runs under this key), `maxSessionRotations` (int 0–20, default `10`; max session rotations per request on block detection)
- **Performance and limits** — `navigationTimeoutSecs` (int, default `60`; opens this section; maximum time to wait for page navigation in seconds), `blockMedia` (bool, default `true`; blocks images, stylesheets, fonts, PDFs, ZIPs to cut browser memory/bandwidth; Chromium-only — no effect for `cheerio` or `playwright-firefox`), `waitForSelector` (string, default `''`; CSS selector to await before extraction; request fails on timeout), `softWaitForSelector` (string, default `''`; like `waitForSelector` but continues on timeout), `waitForDynamicContentSecs` (int, default `0`; seconds to wait for network idle after navigation; also used as timeout for `waitForSelector`/`softWaitForSelector`; 0 disables), `waitUntil` (enum: `load|domcontentloaded|networkidle|commit`, default `load`), `headless` (bool, default `true`), `ignoreCorsAndCsp` (bool, default `false`), `closeCookieModals` (bool, default `true`), `maxScrollHeight` (int ≥ 0, default `5000`), `userAgent` (string, default `''`), `ignoreHttpsErrors` (bool, default `false`)

## Schema generation pipeline

`@contextractor/gen-input-schema` reads this package at build time and writes the four `packages/apify-actor/.actor/*.json` files (input, dataset, output, KVS) **plus** the four canonical npm-package artifacts under `packages/standalone/schema/` (`library-input.schema.json`, `output.schema.json`, `cli-input.schema.json`, `cli-surface.json`) **plus** the two presentation artifacts in the same directory (`field-presentation.json`, `format-presentation.json`). All ten derive from the one Zod SoT (joined with `apifyRegistry` for the Apify files and the presentation artifacts), are committed, and are snapshot-tested (`test/to-apify-schema.test.ts`, `test/to-dataset-schema.test.ts`, `test/to-library-schema.test.ts`, `test/to-cli-schema.test.ts`, `test/to-field-presentation.test.ts`, `test/to-format-presentation.test.ts`) so any SoT change that alters an export fails CI. `@contextractor/gen-md-regions` reads the generated schema/registry/CLI surface to rebuild the `@generated` README tables. Run them from the engine root: `pnpm --filter @contextractor/gen-input-schema start` and `pnpm -F @contextractor/gen-md-regions start` (always followed by `pnpm fix:md` to restore the published table formatting) — the slash commands `/projects:contextractor:docs:gen-schemas` and `/projects:contextractor:docs:gen-md-regions` wrap them.

## Output schema

`ContextractorOutput` is a Zod `discriminatedUnion('status', …)` over the three dataset record shapes — `success`, `failed`, `skipped`. Exported as `ContextractorOutput` (Zod schema) and `ContextractorOutputType` (the inferred 3-member union type). The dataset/output/key-value-store schema generators (`apify/to-dataset-schema.ts`, `apify/to-output-schema.ts`, `apify/to-kvs-schema.ts`) consume it alongside the `OutputViews` / `KvsCollections` presentation config (`apify/output-views.ts`) to emit all of `packages/apify-actor/.actor/dataset_schema.json`, `output_schema.json`, and `key_value_store_schema.json` via `@contextractor/gen-input-schema`.

`ContentNode` — object describing one piece of content (an extracted format or the raw original HTML):

- `hash` — MD5 hex digest of the content (always present)
- `bytes` — UTF-8 byte length (always present)
- `content` — inline content string (optional; present when the format targets the dataset via a `*-dataset` token)
- `key` — KVS key (optional; present when the format targets the key-value store via a `*-kvs` token)
- `url` — public URL to the KVS item (optional; present when a public KVS URL exists)
- `content` and `key`/`url` co-exist when a format targets both destinations

Record shapes:

- **`success`** — `url`, `status: 'success'`, `metadata` (object of nullable strings: `title`, `author`, `publishedAt`, `description`, `siteName`, `languageCode`), `crawl: { loadedUrl, loadedTime, httpStatusCode, depth, referrerUrl }`, `original` (a `ContentNode`, always present — at least `{ hash, bytes }`), and the optional content fields `txt` / `markdown` / `json` / `html` (each a `ContentNode`, present when a `<fmt>-*` token is in `save`). Every content field carries the inline `content` when its format targets the dataset (a `*-dataset` token), `key` + `url` when it targets the key-value store (a `*-kvs` token), or both at once when routed to both. Crawl-EVENT timestamps use `*Time` (`crawl.loadedTime`, `crawledTime`); content-metadata dates use `*At` (`metadata.publishedAt`).
- **`failed`** — `url`, `status: 'failed'`, `crawl: { loadedUrl (nullable) }`, `errors` (string array), `retryCount` (integer), `crawledTime` (ISO 8601).
- **`skipped`** — `url`, `status: 'skipped'`, `skipReason` (`'robotsTxt' | 'limit' | 'enqueueLimit' | 'filters' | 'redirect' | 'depth'`).
