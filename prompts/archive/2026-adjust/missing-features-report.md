# Missing Features Report: Contextractor vs Website Content Crawler

This report compares Contextractor's input schema with the Website Content Crawler input schema and identifies features that are present in WCC but missing from Contextractor.

## Changes Implemented

### Renamed Fields
| Old Name | New Name |
|----------|----------|
| `exportHtml` | `saveRawHtmlToKeyValueStore` |
| `exportText` | `saveExtractedTextToKeyValueStore` |
| `exportJson` | `saveExtractedJsonToKeyValueStore` |
| `exportMarkdown` | `saveExtractedMarkdownToKeyValueStore` |
| `exportXml` | `saveExtractedXmlToKeyValueStore` |
| `exportXmlTei` | `saveExtractedXmlTeiToKeyValueStore` |

### Removed Fields (Hardcoded Behavior)
| Field | Hardcoded Value | Reason |
|-------|-----------------|--------|
| `downloadMedia` | `false` | Never download media |
| `downloadCss` | `false` | Never download CSS |
| `includeMetadata` | `true` | Always include metadata |

### Organized into Sections
- **Start URLs** (no section caption)
- **Crawler settings** - URL filtering, concurrency, retries
- **HTML processing** - Page load, browser, scrolling
- **Content extraction** - Extraction mode
- **Output settings** - Save to key-value store options

---

## Missing Features from Website Content Crawler

### High Priority - URL Discovery & Crawling

| Feature | Description | Priority |
|---------|-------------|----------|
| `useSitemaps` | Load URLs from Sitemaps automatically | High |
| `useLlmsTxt` | Crawl /llms.txt and Markdown files | High |
| `respectRobotsTxtFile` | Respect robots.txt directives | High |
| `maxCrawlDepth` | Limit recursive link following depth | High |
| `keepUrlFragments` | Treat URL #fragments as unique pages | Medium |
| `ignoreCanonicalUrl` | Ignore canonical URL and use actual URL | Medium |

### Medium Priority - Crawler Configuration

| Feature | Description | Priority |
|---------|-------------|----------|
| `crawlerType` | Select between adaptive, browser, raw HTTP | Medium |
| `initialConcurrency` | Starting number of parallel browsers | Low |
| `initialCookies` | Pre-set cookies for authenticated pages | High |
| `customHttpHeaders` | Add custom HTTP headers (auth, etc.) | High |
| `maxSessionRotations` | Session rotation limit on CAPTCHAs | Medium |
| `minFileDownloadSpeedKBps` | Abort slow downloads | Low |

### Medium Priority - HTML Processing

| Feature | Description | Priority |
|---------|-------------|----------|
| `dynamicContentWaitSecs` | Wait time for dynamic content | Medium |
| `waitForSelector` | Wait for specific CSS selector | High |
| `softWaitForSelector` | Optional wait for selector (no fail) | Medium |
| `keepElementsCssSelector` | Preserve specific HTML elements | High |
| `removeElementsCssSelector` | Remove specific HTML elements | High |
| `removeCookieWarnings` | Use browser extension to remove cookie dialogs | Medium |
| `blockMedia` | Block loading images/fonts/videos | Medium |
| `expandIframes` | Extract content from iframes | Medium |
| `clickElementsCssSelector` | Expand collapsed sections | Medium |
| `stickyContainerCssSelector` | Prevent DOM child deletion | Low |

### Medium Priority - Content Transformation

| Feature | Description | Priority |
|---------|-------------|----------|
| `htmlTransformer` | Choose algorithm (Readability, Extractus, Defuddle, None) | High |
| `readableTextCharThreshold` | Minimum article length threshold | Low |
| `aggressivePrune` | Remove duplicate text lines | Medium |

### Low Priority - Debugging & Advanced

| Feature | Description | Priority |
|---------|-------------|----------|
| `debugMode` | Store all transformer outputs | Low |
| `storeSkippedUrls` | Store skipped URLs in KVS | Low |
| `debugLog` | Include debug messages in logs | Low |
| `pageFunction` | Custom JS function for each page | Low |
| `signHttpRequests` | Sign requests for Cloudflare | Low |

### Low Priority - File Downloads

| Feature | Description | Priority |
|---------|-------------|----------|
| `saveFiles` | Download linked files (PDF, DOC, etc.) | Medium |
| `saveContentTypes` | Download files by Content-Type | Medium |
| `saveScreenshots` | Save screenshot of each page | Low |
| `maxResults` | Limit total stored results | Medium |

### Low Priority - Adaptive Crawling

| Feature | Description | Priority |
|---------|-------------|----------|
| `clientSideMinChangePercentage` | Threshold for client-side rendering detection | Low |
| `renderingTypeDetectionPercentage` | How often to detect page rendering type | Low |

---

## Summary

**Total missing features: ~35**

### Recommended Next Steps (by priority)

1. **Add URL discovery features** - `useSitemaps`, `respectRobotsTxtFile`, `maxCrawlDepth`
2. **Add authentication support** - `initialCookies`, `customHttpHeaders`
3. **Add HTML processing controls** - `waitForSelector`, `keepElementsCssSelector`, `removeElementsCssSelector`
4. **Add HTML transformer options** - `htmlTransformer` with multiple algorithms
5. **Add file download options** - `saveFiles`, `saveContentTypes`

### Notes

- Some WCC features are specific to their crawler implementation (e.g., adaptive crawling, Cheerio support)
- Contextractor uses trafilatura for content extraction, which may have different capabilities than WCC's Readability-based approach
- Consider whether all features are needed or if trafilatura's approach is sufficient
