# Commit Review Findings

## Commits analyzed

- `ac214cd` (contextractor) — Bump npm to v0.3.0, fix actor Dockerfile for engine v0.1.1
- `e912685` (contextractor) — Add full config parity (373 lines added)
- `969c9f87` (tools) — Update site help docs and engine to v0.1.1

## Bugs found

### Critical: `wait_until` accepted but never used

- CLI flag defined (`main.py:71-75`)
- Config parsed (`config.py:111`)
- Merged correctly
- **Never passed to PlaywrightCrawler** — missing `goto_options` parameter in `crawler.py`
- Also missing in Apify Actor (`main.py` and `config.py`)
- Users can set `--wait-until load` but it has zero effect

### Critical: `proxy_rotation` accepted but never used

- CLI flag defined, config parsed, merged
- ProxyConfiguration always created as simple round-robin regardless of strategy
- `crawler.py:96` logs it but ignores it

### Medium: `respect_robots_txt` wired in crawler but also duplicated

- Passed to Crawlee as `respect_robots_txt_file` in crawler kwargs
- But also handled via `enqueue_links` which may cause inconsistent behavior
- Crawlee's built-in `respect_robots_txt_file` is the correct approach

### Medium: `crawl_depth` potentially double-handled

- Passed to Crawlee as `max_crawl_depth` in crawler kwargs
- Also manually handled in the request handler via `user_data["depth"]`
- Could cause unexpected depth behavior

### Low: Missing anti-detection Chromium arg

- No `--disable-blink-features=AutomationControlled` in default browser args
- Easy fingerprinting for anti-bot systems

### Low: No new tests for 24 new config options

- test_config.py and test_cli.py unchanged
- Critical bugs like wait_until would have been caught with tests

## What works correctly

- All 24 new CrawlConfig fields defined and parsed
- All 24 CLI flags properly defined with correct types
- npm wrapper correctly maps all 24 new options
- Config file parsing handles both camelCase and snake_case
- Documentation comprehensive and consistent across all 5 docs
- Proxy, cookies, headers, globs, excludes, output toggles properly wired
- Cookie modal dismissal and scrolling work via page.evaluate()
- Engine v0.1.1 correctly imported to tools repo

## npm package.json issue

- `homepage` field points to GitHub: `https://github.com/contextractor/contextractor`
- Screenshot shows it should be: `https://www.contextractor.com/`
