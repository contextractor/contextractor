# Step 1: CLI Config Parity with Apify Actor

## TLDR

Add all missing Apify Actor configuration options to the standalone CLI app. This touches `apps/contextractor-standalone/src/contextractor_cli/main.py` (CLI flags), `config.py` (config file parsing), and `example-config.yaml`.

## Reference

- Apify Actor input schema (source of truth): `apps/contextractor-apify/.actor/input_schema.json`
- Current CLI: `apps/contextractor-standalone/src/contextractor_cli/main.py`
- Config loader: `apps/contextractor-standalone/src/contextractor_cli/config.py`
- Config gaps analysis: `proxy-config-notes/config-consistency-gaps.md`
- Proxy implementation notes: `proxy-config-notes/proxy-implementation.md`

## Settings to Add

### Proxy (new)
- `--proxy-urls` — comma-separated proxy URLs (http://user:pass@host:port or socks5://host:port)
- `--proxy-rotation` — rotation strategy: `recommended`, `per_request`, `until_failure` (default: recommended)
- Config file key: `proxy.urls` (array), `proxy.rotation` (string)

### Browser settings (new)
- `--launcher` — browser engine: `chromium`, `firefox` (default: chromium)
- `--wait-until` — page load event: `networkidle`, `load`, `domcontentloaded` (default: networkidle)
- `--page-load-timeout` — timeout in seconds (default: 60)
- `--ignore-cors` — disable CORS/CSP (default: false)
- `--close-cookie-modals` — auto-dismiss cookie banners (default: false)
- `--max-scroll-height` — max scroll height in pixels (default: 5000)
- `--ignore-ssl-errors` — skip SSL verification (default: false)

### Crawl filtering (new)
- `--globs` — comma-separated glob patterns to include
- `--excludes` — comma-separated glob patterns to exclude
- `--link-selector` — CSS selector for links to follow
- `--keep-url-fragments` — preserve URL fragments (default: false)
- `--respect-robots-txt` — honor robots.txt (default: false)

### Cookies & headers (new)
- `--cookies` — JSON string of initial cookies
- `--headers` — JSON string of custom HTTP headers

### Concurrency & retries (new)
- `--max-concurrency` — max parallel requests
- `--max-retries` — max request retries
- `--max-results` — max results per crawl (0 = unlimited)

### Output toggles (new)
- `--save-raw-html` — save raw HTML to output (default: false)
- `--save-text` — save extracted text (default: false)
- `--save-json` — save extracted JSON (default: false)
- `--save-xml` — save extracted XML (default: false)
- `--save-xml-tei` — save extracted XML-TEI (default: false)

## Implementation

1. Add new fields to `CrawlConfig` dataclass in `config.py`
2. Add corresponding Typer options in `main.py`
3. Update `merge()` method to route new fields correctly
4. Update `from_dict()` to parse new config file keys
5. Wire proxy into Crawlee's `ProxyConfiguration` in the crawler setup
6. Wire browser settings into Crawlee's `PlaywrightCrawler` options
7. Update `example-config.yaml` with all new options (commented out)
