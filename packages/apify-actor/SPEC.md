# packages/apify-actor — Specification

Apify Actor wrapping the Contextractor extraction engine.

## Data flow

```
Actor.getInput() → ContextractorInput.safeParse() → [SitemapRequestList.open() if useSitemaps]
                                                   → createContextractorCrawler()
                                                      └── ContentExtractor per page
                                                            └── createApifySink()
                                                                  ├── KVS (content blobs)
                                                                  └── Dataset (metadata + references)
```

When `useSitemaps` is `true`, `SitemapRequestList.open()` is called before the crawler is started. It fetches `sitemap.xml` at the origin of each start URL and enqueues matching URLs, filtered by `globs` and `exclude`. The explicit start URLs are still crawled via `crawler.run()`.

## Sinks

`createApifySink({ kvs, dataset, routes })` delegates record assembly and KVS key derivation to the shared `@contextractor/crawler` sink core (`buildSuccessRecord`, `kvsKey`), so the Actor and the standalone CLI/lib produce identical output. `routes` is the per-format destination map parsed from `input.save` via `buildRouteMap`; the sink also warns once (`warnDangerousRoutes`) when `original`/`html` route to the dataset. It saves:

- Every content field (`txt`, `json`, `markdown`, `html`, and `original`) as a `ContentNode` object — `hash` (MD5) + `bytes` (UTF-8 byte length) always present; inline `content` when the format targets the dataset (a `*-dataset` token), `key` + `url` referencing the stored blob when it targets the key-value store (a `*-kvs` token), or both at once when routed to both
- `original` is always present (at least `{ hash, bytes }`); its raw HTML is included only when an `"original-*"` token is in `save`
- One dataset item per page with `url`, `status: 'success'`, `metadata`, `crawl` (`loadedUrl`, `loadedTime`, `httpStatusCode`, `depth`, `referrerUrl`), `original`, and per-format content (each a `ContentNode`)

KVS keys are `{format}-{md5(url)}.{ext}` — the content format, the full 32-char MD5 hex of the request URL, and the format's extension (`txt-…txt`, `markdown-…md`, `json-…json`, `html-…html`, `original-…html`).

## Dataset record shapes

Every record has a `status` field. Three record shapes are possible:

- **success** — `{ url, status: 'success', metadata, crawl: { loadedUrl, loadedTime, httpStatusCode, depth, referrerUrl }, original, ...formats }`; produced by `createApifySink` for each successfully extracted page; every content field (incl. `original`) is a `ContentNode` (`hash` + `bytes` always present, plus inline `content` or `key`/`url` when stored); `url` is the original request URL, `crawl.loadedUrl` is the final URL after redirects; `crawl.depth` is the link distance from a start URL (0 for start URLs), `crawl.referrerUrl` is the linking page URL or `null` for start URLs. Crawl-event timestamps use `*Time`; content-metadata dates use `*At`
- **failed** — `{ url, status: 'failed', crawl: { loadedUrl }, errors, retryCount, crawledTime }`; pushed via `onFailedRequest` after all retries are exhausted
- **skipped** — `{ url, status: 'skipped', skipReason }`; pushed via `onSkippedUrl` when `storeSkippedUrls: true`; reason values: `'robotsTxt'`, `'limit'`, `'enqueueLimit'`, `'filters'`, `'redirect'`, `'depth'`

`.actor/dataset_schema.json`, `output_schema.json`, and `key_value_store_schema.json` are generated from the `ContextractorOutput` Zod union plus the `OutputViews` / `KvsCollections` presentation config in `@contextractor/schema` (via `@contextractor/gen-input-schema`); they are not hand-edited. `actor.json` stays hand-written.

## Config

`buildCrawlerOpts(input, sink, proxyConfig, requestQueue, proxyRotation?)` maps `ContextractorInputType` → `ContextractorCrawlerOptions`.

It derives the extracted `formats` from `input.save` via `extractedFormats(buildRouteMap(input.save))` — the formats present in the tokens, excluding `original` (raw HTML, not an extraction). This may be empty (e.g. `save: ['original-kvs']`), in which case nothing is extracted and only `original` is saved; the extraction engine accepts zero formats.

Most fields pass through directly (`mode`, `includeComments`, `includeTables`, `includeImages`, `includeLinks`, `languageCode`, `crawlerType`, `renderingTypeDetectionRatio`, `blockMedia`, `headless`, `initialConcurrency`, `maxConcurrency`, `maxRequestsPerCrawl`, `navigationTimeoutSecs`, `waitUntil`, `waitForDynamicContentSecs`, `deduplication`, `sessionPoolName`, `maxSessionRotations`, `keepUrlFragment`, `selector`, `maxCrawlDepth`, `ignoreHttpsErrors`, `initialCookies`), while several are renamed or transformed at the boundary: `closeCookieModals` → `cookieStrategy` (`'ghostery'`/`'none'`), `maxScrollHeight` → `scroll` (only when `> 0`), `ignoreCorsAndCsp` → `bypassCSP`, `respectRobotsTxtFile` → `respectRobotsTxt`, `maxRequestRetries` → `maxRetries`, `maxResultsPerCrawl` → `maxResults` (only when `> 0`), `customHttpHeaders` → `extraHTTPHeaders`, `userAgent`/`waitForSelector`/`softWaitForSelector` → `value || undefined` (empty string becomes `undefined`), and `globs`/`exclude` map from `{ glob }` objects to string arrays.

`run.ts` additionally sets `blockMediaExplicit` on the crawler options — `true` only when the raw Actor input actually contains a `blockMedia` key (vs inheriting the schema default). This gates the "blockMedia has no effect" warning so the default-`true` `blockMedia` does not warn on every non-Chromium (`cheerio`/`playwright-firefox`) run.

## Resource configuration (memory & concurrency)

The Actor is a Chromium/Playwright crawler, so peak memory is dominated by the number of browser pages rendered at once. `exit 137` (container OOM-kill) happens when concurrent large pages exceed the run's memory; Crawlee's autoscaler cannot abort in-flight pages, so concurrency is the only hard memory cap.

- **`actor.json` declares memory** (hand-written; not codegen): `minMemoryMbytes: 2048` (browser-safe floor), `defaultMemoryMbytes: 4096` (Apify's recommended "good middle ground" for browser actors), `maxMemoryMbytes: 8192` (cost guard / Free-plan run cap). The default propagates to memory-less runs (e.g. the platform-test-runner, which passes no `memory`); because the Actor deploys via a Git-connected build, the resolved default must be confirmed in the Console / run details.
- **`maxConcurrency` defaults to `3`** (schema default), a browser-safe ceiling for ~1 GB-class pages at 4096 MB. Raise it for lightweight pages or the HTTP (`cheerio`) crawler.
- **`blockMedia` defaults to `true`** — blocks images/CSS/fonts in Chromium, cutting browser memory substantially. It only has effect on `playwright-chromium`/`playwright-adaptive`.
- **Payload:** the default `save: ['markdown-kvs']` keeps large blobs out of dataset rows; routing `original`/`html` to the dataset triggers a one-time `warnDangerousRoutes` warning.

## Proxy

`run.ts` builds the proxy configuration before calling `buildCrawlerOpts`. If `input.proxyConfiguration` is set, calls `Actor.createProxyConfiguration(input.proxyConfiguration)`; otherwise `proxyConfig` is `undefined`.

## Entry point

`packages/apify-actor/src/main.ts` → `runActor()` in `src/run.ts`. Actor initializes with `Actor.init()` and exits with `Actor.exit()`. Input validation failure exits with code 1.

## Testing

Proxy rotation is tested via the `/proxy-test` slash command, which verifies proxy configuration, rotation modes, and content extraction for this entry point alongside the CLI and library entry points.

See `tools/proxy-rotation-tester/README.md` for test documentation.

## Deploy

Production deploys go through a Git-connected build in Apify Console (`glueo/contextractor`). `actor.json` sets `"dockerContextDir": "../../.."` so the Dockerfile sees all workspace packages. Test deploys target `glueo/contextractor-test` via `/projects:contextractor:publish:apify-deploy-and-test`.
