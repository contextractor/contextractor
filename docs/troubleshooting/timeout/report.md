# Timeout Investigation Report

**Date**: 2026-01-14
**Issue**: Actor timed out with message "The Actor timed out. You can resurrect it with a longer timeout to continue where you left off."

## Summary

The timeout was caused by **user input configuration**, not a code bug. The input explicitly set `waitUntil: "networkidle"` which causes navigation timeouts on news sites that have continuous network activity.

## Timed-Out Runs

### Run 1: eIy3CCwQpNs0HBuhP
- **Duration**: 5 minutes (300s timeout)
- **Build**: 1.0.3
- **Status**: TIMED-OUT
- **URLs**: 30 diverse URLs (news, blogs, docs, e-commerce, forums)

### Run 2: iKH5V7Q4veuFaK5jP
- **Duration**: 10 minutes (600s timeout)
- **Build**: 1.0.3
- **Status**: TIMED-OUT
- **URLs**: 6 news sites only

## Root Cause Analysis

### Primary Cause: `waitUntil: "networkidle"` on News Sites

The input configuration used:
```json
{
  "waitUntil": "networkidle",
  "pageLoadTimeoutSecs": 60
}
```

**Problem**: `networkidle` waits for all network activity to stop for 500ms. News sites have:
- Continuous ad loading
- Analytics tracking pings
- Social media widgets refreshing
- Video player heartbeats
- Real-time content updates

These never stop, causing every page to hit the 60-second timeout.

### Secondary Cause: Retry Cascade

With `maxRequestRetries: 3` (default), each failing page:
1. First attempt: 60s timeout
2. Second attempt: 60s timeout
3. Third attempt: 60s timeout
4. Fourth attempt: 60s timeout (final)

Each news URL consumes 240 seconds before being marked failed.

### Evidence from Logs

```
WARN  PlaywrightCrawler: Navigation timed out after 60 seconds.
  {"url":"https://www.nytimes.com/section/technology","retryCount":1}
  {"url":"https://www.bbc.com/news/world","retryCount":1}
  {"url":"https://www.theguardian.com/environment/climate-crisis","retryCount":1}
  {"url":"https://medium.com/tag/technology","retryCount":1}
```

All navigation timeouts occurred at exactly 60 seconds (matching `pageLoadTimeoutSecs`).

### Memory Pressure (Contributing Factor)

```
WARN  Memory is critically overloaded. Using 974 MB of 1024 MB (95%).
```

The 1GB memory limit combined with:
- 30 URLs
- `maxConcurrency: 10`
- Playwright browser processes

Caused memory pressure that slowed processing further.

## What Worked vs What Failed

### Successful with `networkidle`
- Blog posts (Cloudflare, Meta, Netflix, GitHub, web.dev)
- Wikipedia pages
- Technical documentation
- Some e-commerce pages

### Failed with `networkidle`
- News sites (BBC, NYTimes, Guardian, Wired, Ars Technica, Reuters)
- Medium (endless scroll + tracking)
- Discord forums (heavy JavaScript)
- Reddit (403 blocked, not timeout)

## Resolution

### No Code Fix Needed

The source code already has correct defaults:
```json
// .actor/input_schema.json
{
  "waitUntil": {
    "prefill": "domcontentloaded",
    "default": "domcontentloaded"
  },
  "pageLoadTimeoutSecs": {
    "default": 30
  }
}
```

### User Action Required

The timeout occurred because the user explicitly overrode defaults with:
```json
"waitUntil": "networkidle",
"pageLoadTimeoutSecs": 60
```

### Recommended Configuration for News Sites

```json
{
  "waitUntil": "domcontentloaded",
  "pageLoadTimeoutSecs": 30,
  "maxConcurrency": 3,
  "closeCookieModals": true
}
```

## Verification

After the timed-out runs, successful runs completed with blog URLs:
- Run `qPYpPzO4TPfpTe8om`: 5 blog URLs with `networkidle` - SUCCEEDED
- Confirms: `networkidle` works for blogs, fails for news sites

## Lessons Learned

1. **`networkidle` is dangerous for news/media sites** - Use `domcontentloaded` instead
2. **Document anti-patterns clearly** - Users need warnings about site categories
3. **Memory limits matter** - 1GB is insufficient for 30 concurrent Playwright pages
4. **Retry cascade compounds timeouts** - 30 URLs × 60s timeout × 4 attempts = 2+ hours potential

## Recommendations

### For Users
1. Use `domcontentloaded` for all sites (default)
2. Only use `networkidle` for specific sites you've tested
3. Use lower concurrency (3-5) with more memory
4. Set shorter `pageLoadTimeoutSecs` (30s) to fail fast

### For Documentation
1. Add warning about `networkidle` + news sites
2. Recommend memory settings per concurrency level
3. List known site categories that work/fail with each setting

### For Prompts
1. Update step-3-get-working.md to warn about `networkidle`
2. Add site category guidance to README

## Fix Verification

### Test Run with Correct Settings

**Run ID**: QNaTc2onh9ng8qnfa
**Date**: 2026-01-14
**Status**: SUCCEEDED

**Input**:
```json
{
  "startUrls": [
    {"url": "https://www.bbc.com/news/world"},
    {"url": "https://www.nytimes.com/section/technology"}
  ],
  "waitUntil": "domcontentloaded",
  "pageLoadTimeoutSecs": 30,
  "maxConcurrency": 2
}
```

**Result**: Both news sites processed successfully in ~60 seconds total.

```
PlaywrightCrawler: Finished! Total 2 requests: 2 succeeded, 0 failed.
```

**Comparison**:
| Setting | Time per page | Result |
|---------|--------------|--------|
| `networkidle` | 60s timeout → retry → timeout | FAILED |
| `domcontentloaded` | ~30s average | SUCCESS |

### Conclusion

The fix is **configuration, not code**:
- Source code defaults are already correct (`domcontentloaded`)
- User must not override with `networkidle` for news/media sites
- Documentation updated to warn about this pattern
