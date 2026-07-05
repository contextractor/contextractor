# @contextractor/extraction — Specification

TypeScript content-extraction engine wrapping `rs-trafilatura` via the napi-rs binding in `@contextractor/extraction-native`.

## Public API

### `ContentExtractor`

Accepts an optional `Partial<TrafilaturaConfig>` and merges it with `DEFAULT_CONFIG` (balanced defaults).

```ts
const extractor = new ContentExtractor({ favorPrecision: true });

extractor.extract(html, { url?, format? })              // ExtractionResult | null
extractor.extractMetadata(html, url?)                   // Metadata (never throws)
extractor.extractAllFormats(html, { url?, formats? })   // Record<OutputFormat, ExtractionResult>
extractor.getConfig()                                   // Readonly<TrafilaturaConfig>
```

### `OutputFormat`

`'txt' | 'markdown' | 'json' | 'html'`

XML and XML-TEI are not currently supported by `rs-trafilatura`.

### `TrafilaturaConfig`

Extraction configuration object; defaults live in `DEFAULT_CONFIG` and match `rs-trafilatura`'s balanced preset. Fields: `fast`, `favorPrecision`, `favorRecall`, `includeComments`, `includeTables`, `includeImages`, `includeFormatting`, `includeLinks`, `deduplicate`, `targetLanguage` (string | null), `onlyWithMetadata`, plus the forward-compat placeholders `withMetadata` and `teiValidation` (accepted by the binding but ignored by `rs-trafilatura`).

### `Metadata`

All fields nullable: `title`, `author`, `date` (ISO 8601), `description`, `sitename`, `language`, `hostname`, `url`, `categories`, `tags`, `license`, `image`, `pageType`.

### `ExtractionResult`

Single-format result: `{ content: string; format: OutputFormat }`. Returned by `extract()` (or `null`) and as the values of `extractAllFormats()`.

### Other exports

- `DEFAULT_CONFIG` — frozen balanced-defaults object
- `getDefaultConfig()` — returns a mutable copy of `DEFAULT_CONFIG`
- `computeContentInfo(content: string | Buffer)` — returns a `ContentInfo` (stable MD5 hash + byte length); strings are UTF-8 encoded before hashing/measuring, `Buffer`s are used as-is
- `ContentInfo` — `{ hash: string; length: number }`
- `projectMetadata(meta)` — projects `Metadata` to `DatasetMetadata`, renaming `date → publishedAt`, `sitename → siteName`, `language → languageCode` and dropping the rest
- `DatasetMetadata` — `{ title, author, publishedAt, description, siteName, languageCode }` (all `string | null`)

## Native binding

`@contextractor/extraction-native` is loaded at runtime. pnpm resolves the platform-matching optional package (`@contextractor/extraction-native-darwin-arm64`, etc.) via `os` + `cpu` selectors at install time.

## Error handling

- `extract()` returns `null` on any native error
- `extractMetadata()` returns an all-`null` `Metadata` on failure
- `extractAllFormats()` returns empty-content entries for failed formats; never throws
