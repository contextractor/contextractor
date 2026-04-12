# Full Settings Audit

## Changes Required

### 1. Remove `--format` / `-f` CLI flag
- Remove from `main.py` (lines 50-54)
- Remove `output_format` from `CrawlConfig` in `config.py`
- Remove `FORMAT_EXTENSIONS` usage for primary format selection in `crawler.py`
- Remove from `index.js` JS API (`options.format`)
- Remove from all READMEs

### 2. Add `--save-markdown` CLI flag
- Add to `main.py` alongside other `--save-*` flags
- Add `save_markdown` field to `CrawlConfig` (default: true, matching Apify's default)
- Update `crawler.py` to handle markdown as a save toggle
- Add to `index.js` JS API
- Update READMEs

### 3. Change default behavior
- When no `--save-*` flag is specified, default to `--save-markdown` (matching Apify's `saveExtractedMarkdownToKeyValueStore: true`)
- Output files named by URL slug with appropriate extension
- Multiple `--save-*` flags = multiple output files per page

### 4. Remove `--output-format` from config file
- Remove `outputFormat` from JSON config schema
- Config file uses `saveMarkdown`, `saveText`, `saveJson`, etc. (matching Apify naming)

### 5. JSONL handling
- Remove `jsonl` as a format option (it was `--format jsonl`)
- JSONL is a dataset concept (Apify) — not applicable as a save toggle
- If users need JSONL, they can post-process JSON output
- OR: keep `--save-jsonl` as a special toggle that appends all pages to one file
- Decision: Remove JSONL — it's not in Apify and is a CLI-specific hack

### 6. Config file field name alignment
Align config file JSON keys with Apify input schema:

| Current config key | Apify key | Action |
|---|---|---|
| `outputFormat` | (none) | Remove |
| `outputDir` | (none) | Keep (CLI-only) |
| `saveRawHtml` | `saveRawHtmlToKeyValueStore` | Accept both |
| `saveText` | `saveExtractedTextToKeyValueStore` | Accept both |
| `saveJson` | `saveExtractedJsonToKeyValueStore` | Accept both |
| `saveXml` | `saveExtractedXmlToKeyValueStore` | Accept both |
| `saveXmlTei` | `saveExtractedXmlTeiToKeyValueStore` | Accept both |
| (missing) | `saveExtractedMarkdownToKeyValueStore` | Add `saveMarkdown` |

### 7. JS API (`index.js`) updates
- Remove `format` option
- Add `saveMarkdown` option (default: true)
- Ensure all `--save-*` flags mapped

### 8. Dockerfile
- No config changes needed (passes through CLI args)
- Update ENTRYPOINT if default behavior changes

### 9. npm README, root README, standalone README
- Remove `--format` from CLI help
- Add `--save-markdown` to output toggles
- Update examples that use `--format`

## Settings to keep as-is (no changes)
- All crawl settings (max-pages, crawl-depth, etc.)
- All proxy settings
- All browser settings
- All crawl filtering settings
- All cookies & headers settings
- All concurrency settings
- All extraction/trafilatura settings
- `--verbose` / `-v`
- `--config` / `-c`
- `--output-dir` / `-o`
