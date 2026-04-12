# Test Matrix for Published Packages

## Test URLs
- Simple page: `https://en.wikipedia.org/wiki/Web_scraping` (text-heavy, tables, links)
- Blog: `https://blog.apify.com/what-is-web-scraping/` (metadata-rich, images)
- Minimal: `https://example.com` (basic HTML, sanity check)

## Output Formats (from FORMAT_EXTENSIONS)
`txt`, `markdown`, `json`, `jsonl`, `xml`, `xmltei`

## Key CLI Flags to Verify
- `--format` (all 6 formats)
- `--precision` / `--recall`
- `--max-pages 1`
- `--output-dir`
- `--no-links`
- `--include-tables` / `--no-tables`
- `--with-metadata` / `--no-metadata`
- `--verbose`

## Per-Channel Specifics

### PyPI (`pip install contextractor`)
- Verify `contextractor` CLI entry point works
- Verify `from contextractor_engine import ContentExtractor` import works (bundled in wheel)
- Verify `trafilatura` dependency resolved

### npm (`npm install -g contextractor`)
- Verify binary downloaded during postinstall
- Verify Playwright Chromium installed
- Verify `contextractor --help` works
- Verify `const { extract } = require("contextractor")` works (JS API)

### Docker (`docker run ghcr.io/contextractor/contextractor`)
- Verify `--help` works
- Verify extraction with volume mount (`-v ./output:/output`)
- Verify non-root user runs correctly

### Apify (`glueo/contextractor-test`)
- Already tested by existing publish flow (test crawl)
