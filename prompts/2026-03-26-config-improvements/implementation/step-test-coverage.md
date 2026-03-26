# Step 4: Add Test Coverage for New Config Options

## TLDR

The v0.3.0 release added 24 new config options with zero new test cases. Add comprehensive tests for config parsing, CLI flag handling, and merge logic.

## Reference

- Bug found by review: `prompts/2026-03-26-config-review/config-review-notes/commit-review-findings.md`
- Existing tests: `apps/contextractor-standalone/tests/test_config.py`, `test_cli.py`

## Tests to Add

### `apps/contextractor-standalone/tests/test_config.py`

1. **test_from_dict_proxy_section** — Verify nested `proxy.urls` and `proxy.rotation` are parsed
2. **test_from_dict_browser_settings** — Verify `launcher`, `waitUntil`, `pageLoadTimeout`, `ignoreCors`, `closeCookieModals`, `maxScrollHeight`, `ignoreSslErrors`
3. **test_from_dict_crawl_filtering** — Verify `globs`, `excludes`, `linkSelector`, `keepUrlFragments`, `respectRobotsTxt`
4. **test_from_dict_cookies_headers** — Verify `initialCookies`/`cookies` and `customHttpHeaders`/`headers` aliases
5. **test_from_dict_concurrency** — Verify `maxConcurrency`, `maxRetries`, `maxResults` and their Apify aliases
6. **test_from_dict_output_toggles** — Verify `saveRawHtml`, `saveText`, `saveJson`, `saveXml`, `saveXmlTei`
7. **test_merge_new_crawl_fields** — Verify merge handles proxy_urls, launcher, globs, etc.
8. **test_from_dict_case_normalization** — Verify `CHROMIUM` → `chromium`, `NETWORKIDLE` → `networkidle`

### `apps/contextractor-standalone/tests/test_cli.py`

1. **test_proxy_flags** — Verify `--proxy-urls` comma-splitting and `--proxy-rotation`
2. **test_browser_flags** — Verify `--launcher`, `--wait-until`, `--page-load-timeout`
3. **test_crawl_filter_flags** — Verify `--globs`, `--excludes` comma-splitting
4. **test_cookie_header_flags** — Verify `--cookies` and `--headers` JSON parsing
5. **test_output_toggle_flags** — Verify `--save-raw-html`, `--save-text`, etc. are boolean flags

## Approach

Use the existing test patterns (create CrawlConfig, verify fields). Do not add integration tests requiring a browser — keep tests fast and unit-level.
