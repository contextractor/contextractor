# Master: Critical Config Bugfixes

## TLDR

Fix 4 bugs found in the config parity implementation: `wait_until` not wired to Playwright, `proxy_rotation` parsed but ignored, `crawl_depth` double-handled, npm `homepage` URL wrong. All are regressions from the v0.3.0 release.

## Shared Context

- Crawlee Python SDK v1.3.1 — see `config-review-notes/crawlee-proxy-api.md` in `prompts/2026-03-26-config-review/`
- Commit review findings — see `config-review-notes/commit-review-findings.md`
- Both repos need changes: `contextractor` and `tools` (if docs affected)
- SCOPE: contextractor in both repos

## Steps

1. **step-fix-wait-until.md** — Wire `wait_until` config to PlaywrightCrawler's `goto_options`
2. **step-fix-proxy-rotation.md** — Map `proxy_rotation` strategies to Crawlee ProxyConfiguration modes
3. **step-fix-crawl-depth.md** — Remove manual depth tracking, use Crawlee's native `max_crawl_depth`
4. **step-fix-npm-homepage.md** — Change npm package.json `homepage` to `https://www.contextractor.com/`
5. **step-review.md** — Review all changes, run tests, verify consistency, autofix issues
