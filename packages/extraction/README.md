# `@contextractor/extraction`

Pure TypeScript content-extraction package.

Contextractor is built on
[`rs-trafilatura`](https://github.com/Murrough-Foley/rs-trafilatura)
(Rust port of Trafilatura, accessed via a napi-rs binding) and
[Crawlee](https://crawlee.dev/) (TypeScript crawler driving Playwright); this
package wraps the napi-rs binding plus small pure helpers, while browser
crawling lives in `@contextractor/crawler`.

## Public API

```ts
import {
  ContentExtractor,
  DEFAULT_CONFIG,
  type ExtractionResult,
  type Metadata,
  type OutputFormat,
  type TrafilaturaConfig,
  getDefaultConfig,
  computeContentInfo,
  projectMetadata,
} from '@contextractor/extraction';

const extractor = new ContentExtractor({ favorPrecision: true });
const result = extractor.extract(html, { url, format: 'markdown' });
const metadata = extractor.extractMetadata(html, url);
const all = extractor.extractAllFormats(html, { url });

// Content hash and byte length (MD5 over UTF-8)
const info = computeContentInfo(html); // { hash: string, length: number }

// Project raw Metadata to a flat DatasetMetadata shape
const meta = projectMetadata(extractor.extractMetadata(html, url));
```

`ContentExtractor` methods:

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

`txt`, `markdown`, `json`, `html`. XML and XML-TEI are temporarily unsupported
pending upstream `rs-trafilatura` work — the Python source supported them via
Trafilatura.

## `TrafilaturaConfig`

| Field             | Type           | Default | Description                           |
| ----------------- | -------------- | ------- | ------------------------------------- |
| fast              | boolean        | `false` | Fast mode (less thorough)             |
| favorPrecision    | boolean        | `false` | High precision, less noise            |
| favorRecall       | boolean        | `false` | High recall, more content             |
| includeComments   | boolean        | `true`  | Include comments                      |
| includeTables     | boolean        | `true`  | Include tables                        |
| includeImages     | boolean        | `false` | Include images                        |
| includeFormatting | boolean        | `true`  | Preserve formatting                   |
| includeLinks      | boolean        | `true`  | Include links                         |
| deduplicate       | boolean        | `false` | Deduplicate content                   |
| targetLanguage    | string \| null | `null`  | Target language code                  |
| withMetadata      | boolean        | `true`  | Forward-compat — always extracted     |
| onlyWithMetadata  | boolean        | `false` | Only return if metadata found         |
| teiValidation     | boolean        | `false` | Forward-compat — accepted but ignored |

## Local prerequisites

- **Rust toolchain** via `rustup` (cargo + rustc on PATH for napi build).
- **Node 22+**, **pnpm 10+**.

## Pitfalls

- **rs-trafilatura's metadata title heuristic differs from Python
  Trafilatura.** Tests asserting metadata should match a regex / substring,
  not exact strings.
- **napi-rs `Result<T>` type alias.** `#[napi]` macros read return-type
  tokens literally; never alias `napi::bindgen_prelude::Result` (it leaks
  into the generated `.d.ts`).
- **`exactOptionalPropertyTypes` is incompatible with napi-rs-generated
  optional fields.** The root `tsconfig.json` keeps it `false`.
- **Empty Cargo workspace `members = []` fails `cargo metadata`.** The
  napi-rs crate must exist as soon as the workspace is created.
- **`vitest run` exits 1 on zero tests.** Apps with no tests pass
  `--passWithNoTests` so recursive `pnpm test` does not break.

## XML / XML-TEI gap

`rs-trafilatura` 0.2.x has no `xml` / `xmltei` output formats, so the TS
package does not expose them. When upstream support lands, both formats can be
added without breaking the existing surface.
