# Step 5: Test All Platforms

## TLDR

Test proxy config and full config parity across Docker, npm CLI, and Apify Actor (local + platform). Use free proxies for integration testing.

## Reference

- Free proxy research: `/Users/miroslavsekera/r/contextractor/prompts/free-proxies-for-web-scraping-testing.md`
- Proxy notes: `proxy-config-notes/proxy-implementation.md`

## Free Proxy Sources for Testing

1. **Webshare** — 10 rotating proxies, 1 GB/month, no CC (best for daily testing)
2. **ProxyScrape API** — GET `https://api.proxyscrape.com/v4/free-proxy-list/get?request=display_proxies&proxy_format=protocolipport&format=text` for bulk proxy list
3. **TheSpeedX/PROXY-List** — GitHub auto-updating list

## Test Matrix

### Standalone CLI
1. `contextractor --proxy-urls http://proxy1:port,http://proxy2:port https://example.com`
2. Config file with proxy section
3. All new browser/crawl/output options via CLI flags
4. All new options via config file (both JSON and YAML)
5. Merge order test: config file sets proxy, CLI overrides rotation

### NPM Package (JS API)
1. `const { extract } = require('contextractor')`
2. Call `extract(['https://example.com'], { proxyUrls: ['http://proxy:port'] })`
3. Verify all new options pass through to CLI binary

### Docker
1. Build Docker image: `docker build -t contextractor .`
2. Run with proxy config via mounted config file
3. Verify extraction works through proxy

### Apify Actor (local)
1. `apify run` with proxy config in input
2. Verify `proxyConfiguration` and `proxyRotation` work
3. Test all extraction options

### Apify Actor (platform)
1. Push to test actor: `apify push` (defaults to `shortc/contextractor-test`)
2. Run on platform with Apify proxy
3. Verify results in dataset

## Validation

- Each test must produce extracted content (not empty/error)
- Proxy tests: verify requests go through proxy (check logs for proxy connection messages)
- Config parity: same config file should produce same results on CLI and Docker
