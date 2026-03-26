# Industry Practices for Web Scraping (2025-2026)

## Critical findings

### 1. Default `waitUntil` should be `load`, not `networkidle`

`networkidle` causes 30s timeouts on sites with persistent connections (analytics, chat widgets, websockets). Industry consensus: avoid as default. `load` is safer. `networkidle` should be opt-in for SPA-heavy sites.

### 2. Missing stealth flag

`--disable-blink-features=AutomationControlled` should be in default Chromium args. Prevents `navigator.webdriver=true` detection. Standard practice across all scraping frameworks.

### 3. Tiered proxy support

Major frameworks support tiered proxy escalation: start with no proxy → datacenter → residential. Crawlee natively supports this via `tiered_proxy_urls`. Current CLI only supports flat `proxy_urls`.

### 4. Patchright (stealth Playwright fork)

Drop-in replacement for Playwright. Patches CDP `Runtime.enable` leak. Considered undetectable by most anti-bot systems. API-compatible — minimal integration cost. Could be offered as `--stealth` flag.

### 5. Browser choice

Chromium remains the default choice (2025-2026). Firefox useful as fallback for sites that fingerprint Chromium automation. Current defaults are correct.

### 6. Markdown as primary format

Industry converged on Markdown for LLM/AI use cases. Current default of `markdown` is correct.

## Recommendations by priority

| Priority | Change |
|----------|--------|
| Critical | Fix `wait_until` — accepted but never passed to Playwright |
| High | Change default `wait_until` from `networkidle` to `load` |
| High | Add `--disable-blink-features=AutomationControlled` to default Chromium args |
| High | Implement proxy rotation strategies (currently parsed but ignored) |
| Medium | Add tiered proxy support |
| Medium | Add `--user-agent` option |
| Low | Add JSONL output mode |
| Low | Consider Patchright integration |

## Sources

- Crawlee Python proxy management docs
- ZenRows: Crawlee proxy setup 2026
- BrowserStack: Playwright waitUntil guide
- Evomi: Playwright web scraping proxies 2025
- ScraperAPI: Best user-agent list 2026
