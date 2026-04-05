# Crawlee Python SDK Proxy API (v1.3.1)

## ProxyConfiguration modes

1. **Simple round-robin** (`proxy_urls`): List of URLs rotated sequentially
2. **Tiered escalation** (`tiered_proxy_urls`): Auto-escalation based on domain errors
3. **Custom function** (`new_url_function`): Full control over rotation

Exactly ONE must be specified. Raises `ValueError` otherwise.

## Rotation strategy mapping

Crawlee has NO native rotation strategy enums. The Apify strategies must be mapped:

- `RECOMMENDED` → `tiered_proxy_urls` (automatic fallback) or simple `proxy_urls` when only one tier
- `PER_REQUEST` → `proxy_urls` (round-robin, already the default)
- `UNTIL_FAILURE` → custom `new_url_function` with session-sticky logic

## Current bug: proxy_rotation parsed but never used

In `crawler.py` line 96, the rotation strategy is logged but the ProxyConfiguration is always created as simple round-robin regardless of the strategy value.

## Session stickiness

- `session_id` parameter ensures same proxy per session
- Stored in `_used_proxy_urls[session_id]`
- Auto-generated for tiered proxies

## PlaywrightCrawler integration flow

1. BasicCrawler calls `_get_proxy_info(request, session)`
2. Returns `ProxyInfo` from `proxy_configuration.new_proxy_info()`
3. ProxyInfo passed to `BrowserPool.new_page(proxy_info=...)`
4. PlaywrightBrowserController converts to Playwright `ProxySettings` object

## Important: explicit proxy_info overrides browser_new_context_options.proxy

If both are set, Crawlee logs a warning and uses the ProxyConfiguration value.
