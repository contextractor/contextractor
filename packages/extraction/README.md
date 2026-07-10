# `@contextractor/extraction`

Pure TypeScript content-extraction package.

Contextractor is built on
[Trafilatura Core](https://www.trafilatura.dev/) (the `trafilaturacore` npm
package — a hybrid Rust + TypeScript port of Trafilatura that ships its own
native addon) and [Crawlee](https://crawlee.dev/) (TypeScript crawler driving
Playwright); this package wraps Trafilatura Core's `clean()` plus small pure
helpers, while browser crawling lives in `@contextractor/crawler` and format
rendering in `@contextractor/conversion`.

## Public API

```ts
import {
  ContentExtractor,
  DEFAULT_CONFIG,
  type ExtractionResult,
  type Metadata,
  type OutputFormat,
  type PageExtraction,
  type TrafilaturaConfig,
  getDefaultConfig,
  computeContentInfo,
  projectMetadata,
} from '@contextractor/extraction';

const extractor = new ContentExtractor({ favorPrecision: true });

// Clean once, render every requested format (the crawler's call):
const page = await extractor.extractPage(html, { url, formats: ['markdown', 'json'] });

// Or a single format / metadata only (all methods are async):
const result = await extractor.extract(html, { url, format: 'markdown' });
const metadata = await extractor.extractMetadata(html, url);
const all = await extractor.extractAllFormats(html, { url });

// Content hash and byte length (MD5 over UTF-8)
const info = computeContentInfo(html); // { hash: string, length: number }

// Project raw Metadata to a flat DatasetMetadata shape
const meta = projectMetadata(await extractor.extractMetadata(html, url));
```

`ContentExtractor` methods (all **async** — the engine's `clean()` loads its
native addon lazily and runs on the libuv threadpool):

- `extractPage(html, opts: { url?: string; formats?: OutputFormat[] })` — clean
  once and render every requested format. Returns `PageExtraction`
  (`{ metadata, formats, pageType, confidence, messages }`) — the call a crawler
  should make, since it pays for a single engine pass.
- `extract(html, opts: { url?: string; format?: OutputFormat })` — single
  format. Returns `ExtractionResult | null`.
- `extractMetadata(html, url?)` — metadata-only projection.
- `extractAllFormats(html, opts: { url?: string; formats?: OutputFormat[] })`
  — all four formats keyed by name.
- `getConfig()` — read-only view of the resolved config.

Top-level helper exports:

- `computeContentInfo(content)` — stable hash + byte length helper.
- `projectMetadata(meta)` — dataset-oriented metadata projection.
- `getDefaultConfig()` — fresh mutable copy of `DEFAULT_CONFIG`.

## Supported output formats

`txt`, `markdown`, `json`, `html`. XML and XML-TEI are not exposed —
`@contextractor/conversion` renders these four formats only.

## `TrafilaturaConfig`

| Field           | Type           | Default | Description                                                                |
| --------------- | -------------- | ------- | -------------------------------------------------------------------------- |
| favorPrecision  | boolean        | `false` | High precision, less noise (engine `boilerplate: 'precision'`)             |
| favorRecall     | boolean        | `false` | High recall, more content (engine `boilerplate: 'recall'`)                 |
| includeComments | boolean        | `true`  | Soft no-op — accepted, but the page-type profile decides comment retention |
| includeTables   | boolean        | `true`  | Include tables                                                             |
| includeImages   | boolean        | `false` | Include images                                                             |
| includeLinks    | boolean        | `true`  | Include links                                                              |
| targetLanguage  | string \| null | `null`  | Keep only content whose **declared** language matches this subtag          |

## Local prerequisites

- **Node 22+**, **pnpm 10+**. The extraction engine ships prebuilt native
  binaries via the `trafilaturacore` dependency, so no Rust toolchain is needed.

## Pitfalls

- **Trafilatura Core's metadata title heuristic differs from Python
  Trafilatura.** Tests asserting metadata should match a regex / substring,
  not exact strings.
- **Every `ContentExtractor` method is async.** `clean()` loads its native addon
  lazily, so `await` the calls; the only `null`/empty result is a page the
  declared-language filter rejected.
- **`vitest run` exits 1 on zero tests.** Apps with no tests pass
  `--passWithNoTests` so recursive `pnpm test` does not break.

## XML / XML-TEI

Trafilatura's Python original could emit `xml` / `xmltei`; Contextractor does
not. `@contextractor/conversion` renders `txt`, `markdown`, `json`, and `html`
only, and there is no plan to add the XML formats.
