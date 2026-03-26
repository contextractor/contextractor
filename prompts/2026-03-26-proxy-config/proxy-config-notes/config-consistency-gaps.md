# Config Consistency Gaps Across Platforms

## Current State

| Component | Location | Config Format | Proxy Support | Config Options |
|-----------|----------|---------------|---------------|----------------|
| Apify Actor | `apps/contextractor-apify/` | JSON (input_schema.json) | Yes (proxyConfiguration, proxyRotation) | 54 properties |
| CLI Standalone | `apps/contextractor-standalone/src/` | YAML/JSON (--config) + CLI flags | Not yet | ~15 properties |
| Engine | `packages/contextractor_engine/` | TrafilaturaConfig dataclass | N/A | extraction only |
| NPM Package | `apps/contextractor-standalone/npm/` | wraps CLI | Not yet | same as CLI |
| GUI Site | `/Users/miroslavsekera/r/tools/apps/contextractor-site` | Next.js app | Not yet | subset |

## Key Gaps

### Proxy
- Apify Actor has `proxyConfiguration` (object, editor: "proxy") and `proxyRotation` (enum: RECOMMENDED, PER_REQUEST, UNTIL_FAILURE)
- CLI has no proxy flags or config file support
- No docs mention proxy configuration outside of Apify input schema

### CLI vs Apify Actor
Apify Actor has these settings that CLI lacks:
- Proxy (proxyConfiguration, proxyRotation)
- Browser settings (launcher, waitUntil, pageLoadTimeoutSecs, ignoreCorsAndCsp, closeCookieModals, maxScrollHeightPixels, ignoreSslErrors)
- Crawl filtering (globs, excludes, pseudoUrls, linkSelector, keepUrlFragments, respectRobotsTxtFile)
- Cookies/headers (initialCookies, customHttpHeaders)
- Storage names (datasetName, keyValueStoreName, requestQueueName)
- Output toggles (saveRawHtml, saveExtractedText, etc.)
- Concurrency (maxConcurrency, maxRequestRetries)

### Documentation
- Root README, npm README, site CLI help: ~15 options documented
- Apify README: mentions proxy/browser available but doesn't detail them
- Site help pages: no proxy docs at all

## Config Loading (CLI)

Three-tier system: `defaults → config file → CLI args`
- `CrawlConfig.from_file(path)` detects YAML/JSON by extension, falls back to YAML-first
- `merge()` routes overrides to correct field (CrawlConfig or TrafilaturaConfig)
- None values skipped in merges
