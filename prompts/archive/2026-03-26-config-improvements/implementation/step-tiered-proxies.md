# Step 2: Add Tiered Proxy Support

## TLDR

Add `proxy.tiered` config key for Crawlee's native tiered proxy escalation. This lets users define proxy tiers (e.g., no proxy → datacenter → residential) with automatic escalation on blocking.

## Reference

- Crawlee API: `prompts/2026-03-26-config-review/config-review-notes/crawlee-proxy-api.md`
- Crawlee `ProxyConfiguration(tiered_proxy_urls=[[tier0], [tier1], ...])` — auto-escalates on domain errors

## Config Format

```json
{
  "proxy": {
    "tiered": [
      [null],
      ["http://datacenter-proxy:8080"],
      ["http://user:pass@residential:8080"]
    ]
  }
}
```

CLI: Not practical as a single flag. Tiered proxies should be config-file only.

When `proxy.tiered` is present, it takes precedence over `proxy.urls`. They are mutually exclusive.

## Files to Change

### 1. Config (`apps/contextractor-standalone/src/contextractor_cli/config.py`)

- Add `proxy_tiered: list[list[str | None]]` field to CrawlConfig (default: empty list)
- Parse `proxy.tiered` in `from_dict()`

### 2. Crawler (`apps/contextractor-standalone/src/contextractor_cli/crawler.py`)

- If `config.proxy_tiered` is set, use `ProxyConfiguration(tiered_proxy_urls=config.proxy_tiered)`
- If `config.proxy_urls` is set (and no tiered), use `ProxyConfiguration(proxy_urls=config.proxy_urls)`
- Only one can be active at a time

### 3. Documentation

- Add `proxy.tiered` to config file docs (all READMEs and site help)
- Add example showing tiered escalation

### 4. npm wrapper (`apps/contextractor-standalone/npm/index.js`)

- Not needed for CLI flag (config-file only)
- But add `proxyTiered` option for JS API that writes a temp config file or passes as JSON

## Validation

Test with a tiered config and verify Crawlee logs show tier escalation behavior.
