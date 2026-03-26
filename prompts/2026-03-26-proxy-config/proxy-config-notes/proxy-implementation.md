# Proxy Implementation Notes

## Apify Actor (existing)

File: `apps/contextractor-apify/src/main.py` (lines 89-93)
- Calls `Actor.create_proxy_configuration(actor_proxy_input=proxy_settings)`
- Uses Apify platform proxy infrastructure
- `proxyRotation` enum: RECOMMENDED, PER_REQUEST, UNTIL_FAILURE

## Standalone CLI (to implement)

Crawlee Python `ProxyConfiguration` supports:
- `proxy_urls` — list of proxy URLs (http://user:pass@host:port)
- `tiered_proxy_urls` — escalation tiers
- `new_url_function` — custom rotation logic

### Config file format (proposed)

```yaml
proxy:
  urls:
    - http://user:pass@host:port
    - socks5://host:port
  rotation: recommended  # recommended | per_request | until_failure
```

### CLI flags (proposed)

```
--proxy-urls          Comma-separated proxy URLs
--proxy-rotation      Rotation strategy (recommended|per_request|until_failure)
```

## Free Proxy Testing Resources

See: `/Users/miroslavsekera/r/contextractor/prompts/free-proxies-for-web-scraping-testing.md`

Best options for testing:
- Webshare: 10 rotating proxies, 1 GB/month, no CC
- ScraperAPI: 1,000 credits/month
- TheSpeedX/PROXY-List: 6,900+ free proxies (GitHub, auto-updating)
- ProxyScrape API: GET request returns IP:PORT pairs

Caveats: Only ~34.5% of free proxies are active. ~10% exhibit malicious behavior. Always use HTTPS.
