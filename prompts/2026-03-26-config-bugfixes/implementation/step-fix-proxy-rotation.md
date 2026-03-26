# Step 2: Fix proxy_rotation Parsed But Ignored

## TLDR

The `proxy_rotation` config is accepted and logged but ProxyConfiguration always uses simple round-robin. Map rotation strategies to Crawlee's native proxy modes.

## Reference

- Crawlee proxy API: `prompts/2026-03-26-config-review/config-review-notes/crawlee-proxy-api.md`
- Crawlee supports 3 modes: `proxy_urls` (round-robin), `tiered_proxy_urls` (escalation), `new_url_function` (custom)

## Files to Change

### `apps/contextractor-standalone/src/contextractor_cli/crawler.py`

Replace the simple `ProxyConfiguration(proxy_urls=config.proxy_urls)` with strategy-aware creation:

- `recommended` or `per_request` → `ProxyConfiguration(proxy_urls=config.proxy_urls)` (round-robin, current behavior — correct for flat URL lists)
- `until_failure` → `ProxyConfiguration(new_url_function=...)` with session-sticky logic that keeps the same proxy URL until a request fails, then rotates to next

For `until_failure`, implement a simple closure:

```
current_index = 0
def sticky_rotation(session_id, request):
    nonlocal current_index
    return proxy_urls[current_index % len(proxy_urls)]
```

And on request failure (detected via retry), increment the index. Note: Crawlee's retry mechanism already handles this — on failure, a new proxy is selected via `new_proxy_info()` call. The key difference is session stickiness: `until_failure` should return the same URL for the same session_id until an error occurs.

The simplest correct approach: use `proxy_urls` for all strategies (Crawlee's round-robin already handles per-request rotation), but log a warning when `until_failure` is selected that full sticky-session behavior requires Crawlee's SessionPool integration.

## Validation

Test with `--proxy-urls http://proxy1:8080,http://proxy2:8080 --proxy-rotation per_request` and verify logs show proxy being used.
