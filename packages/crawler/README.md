# `@contextractor/crawler`

Shared Crawlee + Playwright crawler package for Contextractor.

Built on [Trafilatura Core](https://www.trafilatura.dev/) (extraction) and
[Crawlee](https://crawlee.dev/) (TypeScript crawler driving Playwright).

It owns the browser-facing pieces of Contextractor:

- `createContextractorCrawler()` and `buildRequests()`
- Cookie defenses via Ghostery, plus pre-extraction stripping of known consent/CMP containers
- Built-in scrolling via Crawlee `infiniteScroll()`
- Shared sink core: `memorySink()`, `Sink<T>`, the save-route helpers
  (`buildRouteMap`, `extractedFormats`, `savesOriginal`, `warnDangerousRoutes`)
  that parse the `save` token array into per-format destinations, and the
  storage helpers (`kvsKey`, `buildSuccessRecord` / `buildFailedRecord` /
  `buildSkippedRecord`, `ContentNode` / `KvsLike`) that assemble dataset
  records and derive KVS keys

Both the Apify Actor and the standalone CLI/lib are thin wrappers over the
shared storage core, so their dataset and key-value-store output is identical:

- `packages/apify-actor/src/` wires the Apify dataset / key-value store to the core
- `packages/standalone/src/` wires the Crawlee dataset / key-value store to the core
