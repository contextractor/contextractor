# Contextractor

Python Apify Actor: crawl websites, extract text with trafilatura.

## Source

Port from `/Users/miroslavsekera/r/playwright-scraper-apify/INPUT_SCHEMA.json` to `/Users/miroslavsekera/r/contextractor/`

**Exclude:** `useChrome`, `preNavigationHooks`, `postNavigationHooks`, `pageFunction`

## Key Points

- `PlaywrightCrawler` from crawlee[playwright]
- Define handler inside `async with Actor:` context
- Use `Request.from_url()` for requests with user_data
- All `content_type` must include `; charset=utf-8`
- Use `await kvs.get_public_url(key)` for download URLs (async method)
- Enums: `SCREAMING_SNAKE_CASE`
- KVS name: `content`

## Data Flow

1. **Key-Value Store (`content`)**: All extracted text (large blobs)
2. **Dataset**: Minimal metadata + download URLs for each page

## Input Schema

```json
{
  "title": "Contextractor",
  "type": "object",
  "schemaVersion": 1,
  "properties": {
    "startUrls": { "type": "array", "editor": "requestListSources" },
    "globs": { "type": "array", "editor": "globs", "default": [] },
    "excludes": { "type": "array", "editor": "globs", "default": [] },
    "linkSelector": { "type": "string", "editor": "textfield", "default": "" },
    "maxPagesPerCrawl": { "type": "integer", "default": 0 },
    "maxConcurrency": { "type": "integer", "default": 50 },
    "maxRequestRetries": { "type": "integer", "default": 3 },
    "pageLoadTimeoutSecs": { "type": "integer", "default": 60 },
    "waitUntil": { "type": "string", "enum": ["NETWORKIDLE", "LOAD", "DOMCONTENTLOADED"], "default": "NETWORKIDLE" },
    "launcher": { "type": "string", "enum": ["CHROMIUM", "FIREFOX"], "default": "CHROMIUM" },
    "headless": { "type": "boolean", "default": true },
    "closeCookieModals": { "type": "boolean", "default": false },
    "maxScrollHeightPixels": { "type": "integer", "default": 5000 },
    "ignoreSslErrors": { "type": "boolean", "default": false },
    "downloadMedia": { "type": "boolean", "default": true },
    "downloadCss": { "type": "boolean", "default": true },
    "proxyConfiguration": { "type": "object", "editor": "proxy" },
    "exportHtml": { "type": "boolean", "default": false },
    "exportText": { "type": "boolean", "default": false },
    "exportJson": { "type": "boolean", "default": false },
    "exportMarkdown": { "type": "boolean", "default": true },
    "exportXml": { "type": "boolean", "default": false },
    "exportXmlTei": { "type": "boolean", "default": false },
    "extractionMode": { "type": "string", "enum": ["FAVOR_PRECISION", "BALANCED", "FAVOR_RECALL"], "default": "BALANCED" },
    "includeMetadata": { "type": "boolean", "default": true }
  },
  "required": ["startUrls"]
}
```

## Dataset Entry Structure

```json
{
  "loadedUrl": "https://example.com/page",
  "rawHtml": {
    "key": "abc123-raw.html",
    "url": "https://api.apify.com/v2/key-value-stores/{storeId}/records/abc123-raw.html",
    "hash": "ef5de602cbfbb3280f018192152b0de4",
    "length": 89898
  },
  "extractedMarkdown": {
    "key": "abc123.md",
    "url": "https://api.apify.com/v2/key-value-stores/{storeId}/records/abc123.md",
    "hash": "a1b2c3d4e5f6...",
    "length": 6887
  },
  "loadedAt": "2026-01-28T18:58:36.534Z",
  "metadata": {
    "title": "Page Title",
    "author": null,
    "publishedAt": null,
    "description": "Meta description",
    "siteName": "Example Site",
    "lang": "en"
  },
  "httpStatus": 200
}
```

**Rules:**
- `rawHtml`: always has `hash` + `length`; adds `key` + `url` only if `exportHtml` enabled
- `extractedMarkdown`, `extractedText`, etc.: entire object only present if that export is enabled
- `metadata`: extracted from trafilatura

## Handler Pattern

```python
import hashlib
from datetime import datetime, timezone

async def main() -> None:
    async with Actor:
        input = await Actor.get_input() or {}
        kvs = await Actor.open_key_value_store(name='content')

        crawler = PlaywrightCrawler(...)

        @crawler.router.default_handler
        async def handler(ctx: PlaywrightCrawlingContext) -> None:
            url = ctx.request.url
            html = await ctx.page.content()
            key_base = hashlib.md5(url.encode()).hexdigest()[:16]

            # rawHtml: always hash+length, key+url only if exportHtml
            html_bytes = html.encode('utf-8')
            raw_html_info = {
                'hash': hashlib.md5(html_bytes).hexdigest(),
                'length': len(html_bytes)
            }
            if config.get('export_html'):
                html_key = f'{key_base}-raw.html'
                await kvs.set_value(html_key, html, content_type='text/html; charset=utf-8')
                raw_html_info['key'] = html_key
                raw_html_info['url'] = await kvs.get_public_url(html_key)

            data = {
                'loadedUrl': url,
                'rawHtml': raw_html_info,
                'loadedAt': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
                'metadata': {...},  # from trafilatura
                'httpStatus': 200
            }

            if config.get('export_markdown'):
                md = trafilatura.extract(html, output_format='markdown', ...)
                if md:
                    md_key = f'{key_base}.md'
                    await kvs.set_value(md_key, md, content_type='text/markdown; charset=utf-8')
                    data['extractedMarkdown'] = {
                        'key': md_key,
                        'url': await kvs.get_public_url(md_key),
                        'hash': hashlib.md5(md.encode()).hexdigest(),
                        'length': len(md.encode('utf-8'))
                    }

            await ctx.push_data(data)

        requests = [Request.from_url(url, user_data={'config': config}) for url in start_urls]
        await crawler.run(requests)
```

## Trafilatura

```python
trafilatura.extract(html, output_format='markdown', url=url,
    with_metadata=True, include_tables=True,
    favor_precision=(mode == 'FAVOR_PRECISION'),
    favor_recall=(mode == 'FAVOR_RECALL'))
```

Formats: `txt`, `json`, `markdown`, `xml`, `xmltei`

## Dependencies

```
apify>=2.0.0,<4.0.0
crawlee[playwright]>=0.4.0
trafilatura>=2.0.0
```
