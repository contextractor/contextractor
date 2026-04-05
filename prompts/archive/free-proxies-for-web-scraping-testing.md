# Free proxies for web scraping development and testing

**Webshare, Oxylabs, and ScraperAPI all offer permanent free tiers sufficient for local Crawlee/Apify actor testing — start there before touching unreliable public proxy lists.** For quick-and-dirty testing, GitHub-hosted proxy lists from TheSpeedX and Proxifly are updated every few minutes and can be fetched as raw text files directly into Crawlee's `ProxyConfiguration`. The ecosystem of npm packages, Docker tools, and open-source scrapers is mature enough that a developer can build a fully functional local proxy rotation setup in under an hour with zero cost.

This report covers every practical option: commercial free tiers, public proxy APIs, GitHub-hosted lists, npm packages, Docker setups, and Crawlee integration patterns — all verified as active in early 2026.

## Commercial free tiers are the safest starting point

Three providers stand out with **permanent, no-credit-card-required free tiers** that are far more reliable than public proxy lists:

- **Webshare** (webshare.io/features/free-proxy) offers **10 rotating datacenter proxies** with 1 GB/month bandwidth, forever free. HTTP and SOCKS5 supported, with full API access and dashboard. Geo-targeting is limited to roughly 4 countries on the free plan, but for local testing this is more than adequate. This is the single best option for a developer who just needs working proxies without friction.

- **Oxylabs** (oxylabs.io/products/free-proxies) provides **5 free US-based datacenter proxies** with a 5 GB/month traffic limit, no credit card required. They also offer a 7-day trial with residential and datacenter access for verified users, and their Web Scraper API has an unlimited free trial capped at 2,000 results.

- **ScraperAPI** (scraperapi.com) gives **1,000 API credits/month permanently** with up to 5 concurrent connections. This is an API-first service — you make requests to their endpoint and they handle proxy selection, rotation, and CAPTCHA solving automatically. Credits multiply for premium features (JS rendering costs 10 credits per request), but 1,000 credits handles meaningful test runs.

For short-term trials requiring residential IPs, **Bright Data** offers $25–50 in free credits (credit card and KYC required), while **Smartproxy/Decodo** provides 100 MB of residential proxy traffic over 3 days (credit card required, auto-converts). **Zyte** offers a 14-day free trial of their API. Reserve these trials for validating your scraper against anti-bot systems right before going to production.

## Public proxy APIs that return fresh lists programmatically

When you need bulk proxy lists rather than managed proxy access, several free APIs deliver fresh proxies without authentication:

**ProxyScrape's API** is the most developer-friendly option. A single GET request to `https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all` returns a plain-text list of `IP:PORT` pairs. Filter by protocol (HTTP, SOCKS4, SOCKS5), timeout, country, SSL support, and anonymity level. No rate limits are documented. Lists update every **5 minutes**.

**GeoNode's API** at `https://proxylist.geonode.com/api/proxy-list?limit=500&page=1&sort_by=lastChecked&sort_type=desc` returns rich JSON including IP, port, country, city, speed, uptime, protocols, and anonymity level. Supports pagination up to 500 results per page with filtering by protocol, speed, and country. No authentication required.

**Proxifly** (proxifly.dev) offers both an API and an npm module (`npm install proxifly`). CDN-hosted raw lists are available at `https://cdn.jsdelivr.net/gh/proxifly/free-proxy-list@main/proxies/all/data.txt`, segmented by protocol and country. Updated every 5 minutes with roughly **3,800+ working proxies** across 76 countries. The npm module lets you call `proxifly.getProxy({ protocol: 'http', country: 'US' })` directly in TypeScript.

**PubProxy** (pubproxy.com/api/proxy) returns JSON with detailed proxy metadata including speed, anonymity, and HTTPS/POST/GET support flags. The free tier is limited to **50 requests/day** and 5 proxies per request — enough for testing but not bulk fetching.

## GitHub repos with auto-updating proxy lists

For the simplest possible integration — fetching a raw text URL and parsing it — these repos are actively updated via GitHub Actions:

| Repository | Stars | Protocols | Update frequency | Proxy count |
|---|---|---|---|---|
| **TheSpeedX/PROXY-List** | 5,300+ | HTTP, SOCKS4, SOCKS5 | Multiple times daily | ~6,900+ |
| **proxifly/free-proxy-list** | 4,300+ | HTTP, SOCKS4, SOCKS5 | Every 5 minutes | ~3,800+ |
| **monosans/proxy-list** | 1,400+ | HTTP, SOCKS4, SOCKS5 | Every hour | Varies |
| **clarketm/proxy-list** | 2,400+ | HTTP, HTTPS | Daily | Varies |
| **hookzof/socks5_list** | 825+ | SOCKS5 only | Daily | Varies |

TheSpeedX is the largest and most popular. Fetch raw lists directly:
```
https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/http.txt
https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/socks4.txt
https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/socks5.txt
```

monosans/proxy-list is notable for including **geolocation data** (country, city, coordinates) in its JSON output — useful if you need geo-targeted testing. All repos confirmed active with commits in March 2026.

## npm packages and tools for the Crawlee/Node.js ecosystem

**Crawlee's built-in `ProxyConfiguration`** is the integration point for all of these sources. Three configuration patterns cover every scenario:

The simplest approach uses `proxyUrls` — pass an array of proxy strings and Crawlee rotates them round-robin. The `tieredProxyUrls` option is particularly powerful for testing: define tiers from no-proxy to free proxies to premium proxies, and Crawlee auto-escalates on a per-domain basis when it detects blocking. The `newUrlFunction` option accepts an async function that returns a proxy URL per request, enabling dynamic integration with any proxy source or API.

**proxy-chain** (`npm install proxy-chain`, ~502,000 weekly downloads) is Apify's own package for running a local proxy server in Node.js. Its killer feature is `anonymizeProxy()`, which creates a local unauthenticated proxy endpoint that forwards to an authenticated upstream proxy. This solves the common problem of **Puppeteer and Playwright not supporting proxy authentication natively** — essential for browser-based Crawlee crawlers using paid proxies.

**proxifly** (`npm install proxifly`) is the best npm package for fetching free proxies directly in code. It wraps the Proxifly API and CDN-hosted lists with a clean TypeScript interface.

For proxy validation, **proxy-check** (~5,800 weekly downloads) provides simple promise-based liveness checking: `await proxyCheck({ host: '1.2.3.4', port: 3128 })`. The **proxy-verifier** package tests protocol support, anonymity level, and tunneling capabilities. Both are useful for pre-filtering free proxy lists before feeding them to Crawlee.

On the Python side, **ProxyBroker2** (github.com/bluet/proxybroker2) deserves special mention. It scrapes **~50 sources** to find 7,000+ working proxies, validates them, and can **run as a local rotating proxy server**: `proxybroker serve --host 127.0.0.1 --port 8888 --types HTTP HTTPS --lvl High`. Point Crawlee at `http://127.0.0.1:8888` as a single proxy URL and ProxyBroker2 handles all rotation internally. This is arguably the most reliable free proxy setup for local testing.

**monosans/proxy-scraper-checker** (github.com/monosans/proxy-scraper-checker, rewritten in Rust) is the fastest open-source proxy scraper-validator. It scrapes many sources, validates proxies with anonymity detection and geolocation, and outputs categorized files. Docker-supported via `docker compose up`.

## Docker-based local proxy setups

For persistent local proxy infrastructure, **39ff/docker-rotating-proxy** (github.com/39ff/docker-rotating-proxy) wraps Squid in Docker Compose with automatic rotation across a configurable upstream proxy list. Add free proxies in `IP:Port:Type` format, run `docker-compose up`, and use `http://127.0.0.1:3128` in Crawlee. Supports HTTP, HTTPS, SOCKS5, and even OpenVPN upstreams.

For a simpler local forward proxy (useful for debugging), **mitmproxy** (`docker run -p 8080:8080 mitmproxy/mitmproxy`) provides interactive HTTPS inspection. **ubuntu/squid** from Canonical offers a zero-config caching proxy with up to 5 years of security maintenance.

**Tor** works as a free-forever rotating proxy via SOCKS5 on `localhost:9150`. Docker images like `rotating-tor-http-proxy` run 50+ concurrent Tor circuits for a pool of rotating IPs. The tradeoffs are significant: **2–10+ seconds per request**, only ~6,000 exit nodes total, and Tor exit IPs are aggressively blocked by most major websites. It's useful for learning and privacy testing, not practical scraping.

## Practical Crawlee integration in under 10 lines

The fastest path from zero to working proxy rotation in Crawlee:

```typescript
import { CheerioCrawler, ProxyConfiguration } from 'crawlee';

const res = await fetch('https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/http.txt');
const proxyUrls = (await res.text()).split('\n').filter(Boolean).map(p => `http://${p.trim()}`);

const proxyConfiguration = new ProxyConfiguration({
  tieredProxyUrls: [
    [undefined],                    // try without proxy first
    proxyUrls.slice(0, 50),         // fall back to free proxies
  ],
});

const crawler = new CheerioCrawler({ proxyConfiguration, /* ... */ });
```

For Webshare's free tier, replace the fetch logic with Webshare's API endpoint and use their authenticated proxy URLs directly. For ProxyBroker2, run the server process and point `proxyUrls` at `['http://127.0.0.1:8888']`.

## Security and reliability caveats are real

A 2024 academic study testing **640,600 free proxies** over 30 months found only **34.5% were ever active**. Among those that worked, roughly 16,900 manipulated content (ad injection, TLS interception), and ~2,000 enabled privilege escalation on host devices. About **10% exhibited overtly malicious behavior**.

For local development testing, this risk profile is manageable with discipline: **never send credentials or sensitive data through free proxies**, always use HTTPS to prevent traffic interception, and isolate your testing environment from authenticated browsing sessions. Monitor scraped data for anomalies that could indicate proxy-side content injection.

On the legal side, proxy use itself is lawful, but scraping through proxies doesn't change the legality of the scraping itself. Respect `robots.txt`, comply with GDPR/CCPA when handling personal data, and review target site terms of service. Free proxy IPs carry poor reputation scores — shared among many users including bad actors — so expect elevated CAPTCHA rates and faster blocking compared to clean residential IPs.

## Conclusion

The practical recommendation for a Crawlee/Apify developer is a layered approach. Use **Webshare's free 10-proxy tier** as your daily-driver testing proxies — they're reliable, API-accessible, and require no credit card. Supplement with **ScraperAPI's 1,000 monthly credits** when you need to test against anti-bot systems. Pull from **TheSpeedX or Proxifly GitHub lists** for bulk proxy testing or load simulation. Run **ProxyBroker2 as a local proxy server** when you need hands-off rotation without managing lists. Reserve commercial trials from Bright Data or Oxylabs for pre-production validation with residential IPs. Crawlee's `tieredProxyUrls` feature ties everything together elegantly — start requests without a proxy, escalate to free proxies on failure, and escalate to premium proxies only when necessary.
