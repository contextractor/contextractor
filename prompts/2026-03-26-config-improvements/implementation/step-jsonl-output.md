# Step 5: Add JSONL Output Mode

## TLDR

Add `jsonl` as an output format option. JSONL (one JSON object per line) is the standard pipeline-friendly format for multi-URL crawls, used by Firecrawl, ScrapingAnt, and other extraction tools.

## Reference

- Industry research: `prompts/2026-03-26-config-review/config-review-notes/industry-practices.md`

## Files to Change

### 1. Crawler (`apps/contextractor-standalone/src/contextractor_cli/crawler.py`)

- Add `"jsonl": ".jsonl"` to `FORMAT_EXTENSIONS`
- When format is `jsonl`, write one JSON line per page to a single output file (not per-page files)
- Each line: `{"url": "...", "title": "...", "content": "...", "author": "...", "date": "..."}`
- File name: `output.jsonl` (single file, not slugged)

### 2. Config

- Add `jsonl` to the `output_format` accepted values in CLI help text

### 3. Documentation

- Add `jsonl` to format lists in all CLI options and config tables
- Describe the JSONL format: one JSON object per line, suitable for `jq`, streaming, and LLM pipelines

### 4. npm wrapper

- No changes needed — format string is passed through

## Validation

Run `contextractor --format jsonl https://example.com` and verify output is valid JSONL.
