# @contextractor/crawler — Specification

Shared Crawlee + Playwright crawler factory used by both the Apify Actor and the standalone CLI.

## Public API

### `createContextractorCrawler(opts)`

Returns one of the three concrete Crawlee crawlers — the declared return type is the union `CheerioCrawler | AdaptivePlaywrightCrawler | PlaywrightCrawler`. Which one depends on `crawlerType`:

- `'playwright-adaptive'` (default) — `AdaptivePlaywrightCrawler`, handler via `createAdaptiveHandler`
- `'playwright-chromium'` / `'playwright-firefox'` — `PlaywrightCrawler`, handler via `createHandler`
- `'cheerio'` — `CheerioCrawler`, handler via `createCheerioHandler`

### `buildRequests(startUrls, keepUrlFragment?)`

Maps URL strings to `Request[]` for `crawler.run()`.

### Sink pattern

```ts
type Sink<T> = (result: T) => Promise<void>;
```

`createContextractorCrawler` accepts a `sink: Sink<ExtractionResult>`. The sink fires only on a **successful** extraction; failed requests fire `onFailedRequest` and URLs skipped during link enqueueing fire `onSkippedUrl`; pages dropped by deduplication are skipped silently (log line only). Built-in sink:

- `memorySink()` — accumulates results in memory. Used by tests and wrapped by the standalone library's `createExtractor().run()` (via an `html`-stripping adapter) to return in-memory results.

### Shared storage sink core (`sinks/storage.ts`)

Record assembly and key-value-store key derivation shared by the Apify Actor and the standalone CLI/lib, so their dataset records and KVS output are identical (the only difference is `ContentNode.url`, present only where a public KVS URL exists). Exports:

- `kvsKey(kind, url)` — deterministic KVS key `{keyPrefix}{md5(url)}.{ext}`, where `keyPrefix` is the per-kind prefix (`txt-`, `markdown-`, `json-`, `html-`, `original-`) for `txt | markdown | json | html | original` (so `original` produces `original-{md5}.html`, not a format-named key)
- `extForKind(kind)` — file extension for a content kind (`txt`, `md`, `json`, `html`; `original` → `html`)
- `buildSuccessRecord(result, { kvs, routes })` — assembles the `status: 'success'` record, driven by the per-format destination `routes` map. A content field (`txt`/`markdown`/`json`/`html`) is written only when its format has a destination in `routes`; each is a `ContentNode` (`hash` + `bytes` always present) with inline `content` when the format targets the dataset, `key` + `url` when it targets the key-value store, or **both at once** when routed to both. `original` is always present (at least `{ hash, bytes }`); its raw HTML is included only when `routes.original` selects a destination
- `buildFailedRecord(info)` / `buildSkippedRecord(url, skipReason)` — the `failed` / `skipped` records
- types `ContentNode`, `KvsLike` (`{ setValue(key, value, { contentType? }); getPublicUrl?(key) }` — `getPublicUrl` is present only where the store exposes public URLs, e.g. the Apify platform, and is what populates `ContentNode.url`), `ContentKind`, `BuildSuccessRecordOpts`, `FailedRequestInfo`

### Save-route helper (`sinks/routes.ts`)

Pure parsing of the `save` token array into a per-format destination map, shared by the sink, the Apify Actor, and the standalone CLI/lib. Exports:

- `buildRouteMap(tokens)` — parse `format-destination` tokens (e.g. `markdown-dataset`, `original-kvs`) into a `RouteMap` (`Record<SaveFormat, { toKvs, toDataset }>`). A format listed against both destinations ORs to `{ toKvs: true, toDataset: true }`. Throws on an unknown token
- `extractedFormats(map)` — the formats with any destination, excluding `original` (raw HTML, not an extraction); may be empty
- `savesOriginal(map)` — whether any `original-*` token is present
- `warnDangerousRoutes(map)` — emits a single Crawlee `log.warning` when `original`/`html` route to the dataset (out-of-memory risk on large pages); call once at sink construction, not per page
- types `SaveFormat`, `FormatRoute`, `RouteMap`, and the `SAVE_FORMATS` constant (`SaveFormat` and `SAVE_FORMATS` are also re-exported from the `contextractor` npm package root)

### `ExtractionResult` (sink input)

`url` (original request URL), `loadedUrl` (final URL after redirects), `html`, `rawHtmlHash`, `rawHtmlLength`, `formats: Partial<Record<OutputFormat, string>>`, `metadata: DatasetMetadata` (the flattened/projected metadata shape from `@contextractor/extraction`, produced by `projectMetadata()`, not the raw `Metadata`), `crawlDepth: number` (link distance from start URL; 0 for start URLs), `referrerUrl: string | null` (URL of the linking page; `null` for start URLs).

`crawlDepth` and `referrerUrl` are read from `request.userData` at handler entry and propagated via `enqueueLinks` `userData: { depth, referrerUrl }` so every enqueued child carries the correct values.

### Re-exported helpers and types

Re-exported from the package root for consumers: `ProxyConfiguration`, `SitemapRequestList`, and the `RequestProvider` type (from Crawlee); the browser helpers `getBlocker`, `installCookieDefences` (Ghostery ad/tracker blocking, in `browser/cookies.ts`), and `autoScroll` (with its `ScrollConfig` type). All consent/CMP handling lives in `browser/consent.ts` and stays internal to the package — the strip helpers (`CONSENT_SELECTORS`, `stripConsentFromCheerio`, `stripConsentFromPage`), the wall detection (`CONSENT_WALL_SELECTORS`, `hasConsentWall`, `acceptConsentWall`), and the handler orchestrators (`recoverConsentWallOnPage`, `recoverConsentWallAdaptive`) are consumed by the handlers, not re-exported.

## Handler factories

- `createHandler(opts)` — `RequestHandler<PlaywrightCrawlingContext>` for `PlaywrightCrawler` paths
- `createAdaptiveHandler(opts)` — `(ctx: LoadedContext<AdaptivePlaywrightCrawlerContext>) => Promise<void>`; uses `parseWithCheerio()` to get HTML. Delegates consent handling to `recoverConsentWallAdaptive`, which accesses `page` only when the parsed HTML is a content-replacing consent wall (`hasConsentWall`) and `stripConsent` is on — reading `context.page` throws in an HTTP-only run, which Crawlee turns into a browser re-run so the wall can be accepted; otherwise it never touches `page`
- `createCheerioHandler(opts)` — `RequestHandler<CheerioCrawlingContext>`; gets HTML via `$('html').prop('outerHTML')`; no scroll

## Browser behaviour

- **Cookie consent** (`cookieStrategy`): `'ghostery'` (default) or `'none'`. `'ghostery'` installs `@ghostery/adblocker-playwright` as a pre-navigation hook (network/cosmetic blocking; browser paths only) and gates two consent behaviours behind the `stripConsent` handler flag:
  - **Accept content-replacing walls** (browser paths; `browser/consent.ts`). When a site serves a CMP consent wall _in place of_ the article — e.g. idnes.cz's server-side 302 to `/nastaveni-souhlasu` (the `#payorok` consent-or-pay gate) — stripping cannot recover content that was never sent. Before scrolling/waiting/capture, `acceptConsentWall` invokes the wall's own "accept all" (Didomi `setUserAgreeToAll`, OneTrust `AllowAll`, or a visible accept button for Cookiebot/Quantcast), re-navigates to the article, and **verifies recovery** — returning `recovered` (article re-fetched, `loadedUrl` updated), `none` (not a content wall), or `blocked` (still walled). It is general across CMPs (not idnes-specific). On `blocked` the handler throws (`CONSENT_WALL_NOT_BYPASSED`) rather than letting the strip mask the wall as scraps, so Crawlee retries and ultimately surfaces the URL as a failure. In the adaptive path this escalates an HTTP-only request to a browser render (the `cheerio` crawler has no JS and cannot accept JS-gated walls).
  - **Strip residual consent/CMP containers** from the captured DOM before extraction — applied in place on **every** handler including `cheerio`, so an inline consent banner overlaid on a present article (and any disclaimer text) is removed and never selected as main content.

  Both mutate the single captured `html`, so the `original` output, `rawHtmlHash`, metadata, and extracted formats are all consent-free when on, and the raw page when off (`'none'`). `'none'` does neither.

- **Auto-scroll**: optional `ScrollConfig` for infinite-scroll pages; only applies to `PlaywrightCrawler` path
- **Session pool**: enabled by default; persists cookies per session

## Key options (`ContextractorCrawlerOptions`)

`startUrls`, `sink`, `formats`, `mode` (`'precision' | 'balanced' | 'recall'`; translated to `favorPrecision`/`favorRecall` in `TrafilaturaConfig`), `includeComments`, `includeTables`, `includeImages`, `includeLinks`, `languageCode` (mapped to `TrafilaturaConfig.targetLanguage` at the extraction boundary), `scroll`, `cookieStrategy`, `sessionPool`, `sessionPoolName` (string; if set, used as `persistStateKey` in `sessionPoolOptions` to persist the session pool across runs), `maxSessionRotations` (int; default `10`; maps to Crawlee `maxSessionRotations`; controls how many times a session can be rotated per request on block detection), `maxRequestsPerCrawl` (passed straight to Crawlee's `BasicCrawlerOptions.maxRequestsPerCrawl`; applied when > 0), `maxRetries`, `initialConcurrency` (maps to Crawlee `minConcurrency`; only applied when > 0), `maxConcurrency`, `navigationTimeoutSecs`, `waitUntil` (`'load' | 'domcontentloaded' | 'networkidle' | 'commit'`; Playwright paths only — forwarded to `gotoOptions.waitUntil` via a `preNavigationHook`; when undefined Playwright's `'load'` default applies), `blockMedia`, `headless`, `crawlerType`, `renderingTypeDetectionRatio` (0–1; passed straight to the adaptive crawler), `ignoreHttpsErrors`, `bypassCSP`, `initialCookies`, `extraHTTPHeaders`, `userAgent`, `selector`, `maxCrawlDepth`, `maxResults`, `globs`, `exclude`, `keepUrlFragment`, `proxyConfiguration`, `proxyRotation` (`'recommended' | 'per-request' | 'until-failure'`; default `'recommended'`; see Proxy Configuration), `requestQueue`, `requestList` (`SitemapRequestList`; passed through to all three crawler types when set), `configuration` (Crawlee `Configuration`; passed as the crawler constructor's second argument so a run can bind to an isolated config — e.g. a non-persisting storage client — instead of the mutable global one; when undefined the global config applies), `respectRobotsTxt`, `onFailedRequest`, `onSkippedUrl`, `waitForDynamicContentSecs` (Playwright only; seconds to wait for network idle after navigation before extraction; also doubles as the timeout for `waitForSelector`/`softWaitForSelector` (falls back to `30` s when the option is unset); 0 disables the network-idle wait; no package-level default (schema default `0`)), `waitForSelector` (Playwright only; CSS selector to await before extraction; request fails on timeout), `softWaitForSelector` (Playwright only; like `waitForSelector` but continues on timeout).

- `onFailedRequest?: (info: { url, loadedUrl, errorMessages, retryCount }) => Promise<void>` — called after all retries are exhausted for a request
- `onSkippedUrl?: (url: string, reason: string) => void` — called synchronously during `enqueueLinks` when a URL is skipped (glob filter, robots.txt, or the enqueue/request limit; depth-limited pages are dropped by the handler before `enqueueLinks` without firing it)
- `deduplication?: 'minimal' | 'standard' | 'aggressive'` (default `'standard'`) — controls post-fetch deduplication layered on top of Crawlee's built-in URL dedup. `createContextractorCrawler` initialises shared `seenCanonicals: Set<string>` and `seenContentHashes: Set<string>` and passes them to all three handler factories. `'minimal'`: no additional dedup beyond Crawlee URL dedup. `'standard'`: skips pages whose `<link rel="canonical">` was already seen and differs from the current URL; applies to all three handler types. `'aggressive'`: additionally skips pages whose extracted text content hash was already seen.
- `blockMedia?: boolean` — when `true`, blocks images, stylesheets, fonts, PDFs, and ZIPs. The schema default is `true` (cuts browser memory/bandwidth, helping avoid out-of-memory on large pages). Only effective with `playwright-chromium` and `playwright-adaptive`.
- `blockMediaExplicit?: boolean` — whether the caller actually set `blockMedia` (vs inheriting the default). The "blockMedia has no effect with crawlerType" `log.warning` for `cheerio`/`playwright-firefox` fires only when `blockMedia` is **explicitly** enabled, so the default-`true` value does not warn on every non-Chromium run. Entry points set it from the raw input (Actor) or the CLI flag / library options object (standalone).
- `maxConcurrency?` — maximum browser pages in parallel; schema default `3` (browser-safe). Crawlee's autoscaler cannot abort in-flight pages, so this is the only hard cap on peak memory for large pages. Raise it for lightweight pages or the `cheerio` crawler.

## Proxy Configuration

Pass proxy URLs via `proxyConfiguration: new ProxyConfiguration({ proxyUrls: [...] })`.

Rotation mode is controlled by `proxyRotation`, which maps to Crawlee `sessionPoolOptions` via `SESSION_MAX_USAGE_COUNTS` and only takes effect when `proxyConfiguration` is set:

- `'recommended'` (default) — session `maxUsageCount` left at Crawlee's default reuse
- `'per-request'` — `sessionOptions.maxUsageCount = 1`; the session is retired after one request (new browser context per request)
- `'until-failure'` — `sessionOptions.maxUsageCount = 1000` and `maxPoolSize: 1`; a single-session pool stays on one proxy URL until the session retires from errors

In handler context, proxy metadata is available via `request.proxyInfo` (when a proxy was used):

```ts
const { hostname, port, url } = context.request.proxyInfo;
```

Properties: `hostname` (proxy server hostname), `port` (proxy server port), `url` (full proxy URL as configured).

Proxy info is available in all handler types (`PlaywrightCrawlingContext`, `CheerioCrawlingContext`, `AdaptivePlaywrightCrawlerContext`) when a proxy is active.
