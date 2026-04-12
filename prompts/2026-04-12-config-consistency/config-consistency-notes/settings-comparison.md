# Settings Comparison: Apify Actor vs CLI

## Apify Actor (source of truth) — input_schema.json

### Output Format
- No `--format` equivalent — Apify uses per-format toggles:
  - `saveExtractedMarkdownToKeyValueStore` (default: true)
  - `saveRawHtmlToKeyValueStore` (default: false)
  - `saveExtractedTextToKeyValueStore` (default: false)
  - `saveExtractedJsonToKeyValueStore` (default: false)
  - `saveExtractedXmlToKeyValueStore` (default: false)
  - `saveExtractedXmlTeiToKeyValueStore` (default: false)

### CLI Standalone
- `--format` / `-f` — selects ONE primary format (txt, markdown, json, jsonl, xml, xmltei)
- `--save-raw-html` — additional raw HTML
- `--save-text` — additional plain text
- `--save-json` — additional JSON
- `--save-xml` — additional XML
- `--save-xml-tei` — additional XML-TEI

## Inconsistency Analysis

### 1. `--format` is CLI-only, not in Apify
Apify uses toggle-per-format. CLI has both `--format` (primary) AND `--save-*` (additional).
The `--format` flag is useful for CLI (one-file-per-page output to disk), but Apify doesn't need it (dataset + KV store).

**Decision needed:** Is `--format` redundant with `--save-*`? Or does it serve a different purpose (primary vs additional)?

### 2. JSONL format
- CLI has `jsonl` as a `--format` option
- Apify has no JSONL toggle (dataset IS the JSONL equivalent)
- `--save-*` toggles don't include `--save-jsonl`

### 3. `--save-text` vs `--save-markdown`
- CLI has `--save-text` but no `--save-markdown`
- Apify has both `saveExtractedTextToKeyValueStore` and `saveExtractedMarkdownToKeyValueStore`
- Missing: `--save-markdown` CLI flag

### 4. Naming inconsistencies
- Apify: `maxPagesPerCrawl` / CLI: `--max-pages` / Config: `maxPages`
- Apify: `maxCrawlingDepth` / CLI: `--crawl-depth` / Config: `crawlDepth`
- Apify: `maxRequestRetries` / CLI: `--max-retries` / Config: `maxRetries`
- Apify: `maxResultsPerCrawl` / CLI: `--max-results` / Config: `maxResults`
- Apify: `pageLoadTimeoutSecs` / CLI: `--page-load-timeout` / Config: `pageLoadTimeout`
- Apify: `ignoreCorsAndCsp` / CLI: `--ignore-cors` / Config: `ignoreCors`
- Apify: `maxScrollHeightPixels` / CLI: `--max-scroll-height` / Config: `maxScrollHeight`
- Apify: `respectRobotsTxtFile` / CLI: `--respect-robots-txt` / Config: `respectRobotsTxt`

These naming differences are already handled by `config.py`'s `from_dict()` which accepts both forms. Not a real inconsistency.

### 5. Apify-only settings (not in CLI)
- `pseudoUrls` — alternative to globs (Apify-specific)
- `datasetName` — Apify storage
- `keyValueStoreName` — Apify storage
- `requestQueueName` — Apify storage
- `proxyConfiguration` — Apify proxy editor
- `debugLog` — Apify diagnostics
- `browserLog` — Apify diagnostics

These are platform-specific and correctly omitted from CLI.

### 6. CLI-only settings (not in Apify)
- `--format` / `-f` — primary output format
- `--config` / `-c` — config file path
- `--output-dir` / `-o` — output directory
- `--verbose` / `-v` — verbose logging

These are correctly CLI-only.
