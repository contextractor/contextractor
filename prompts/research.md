# Building Python Apify Actors with Crawlee, Playwright, and Trafilatura

**Python Crawlee provides a modern async web scraping framework** that combines Playwright's browser automation with Apify's cloud infrastructure. This guide covers everything needed to build production-ready actors that extract clean text using trafilatura. The key pattern involves using `PlaywrightCrawler` for rendering JavaScript-heavy pages, storing HTML in Key-Value Stores, and processing content through trafilatura's extraction algorithms.

---

## Python Crawlee with Playwright fundamentals

The `PlaywrightCrawler` class manages browser instances, handles retries, and provides a clean context-based API for scraping. Unlike TypeScript Crawlee which uses callback methods, **Python Crawlee relies on decorator patterns** for registering request handlers.

### Core setup and imports

```python
import asyncio
from crawlee.crawlers import PlaywrightCrawler, PlaywrightCrawlingContext
from crawlee import Request

async def main() -> None:
    crawler = PlaywrightCrawler(
        headless=True,
        browser_type='chromium',
        max_requests_per_crawl=50,
        max_request_retries=3,
    )
    
    @crawler.router.default_handler
    async def request_handler(context: PlaywrightCrawlingContext) -> None:
        context.log.info(f'Processing {context.request.url}')
        title = await context.page.title()
        await context.push_data({'url': context.request.url, 'title': title})
    
    await crawler.run(['https://example.com'])

if __name__ == '__main__':
    asyncio.run(main())
```

### Configuration options for PlaywrightCrawler

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `headless` | `bool` | `True` | Run browser without visible window |
| `browser_type` | `str` | `'chromium'` | Options: `'chromium'`, `'firefox'`, `'webkit'` |
| `max_requests_per_crawl` | `int` | `None` | Limit total pages to prevent runaway crawls |
| `max_request_retries` | `int` | `3` | Retry attempts for failed requests |
| `navigation_timeout` | `timedelta` | `None` | Maximum wait for page navigation |
| `use_session_pool` | `bool` | `True` | Enable session management |
| `retry_on_blocked` | `bool` | `True` | Auto-retry when bot detection triggers |

### Label-based routing for different page types

```python
crawler = PlaywrightCrawler(max_requests_per_crawl=100)

@crawler.router.default_handler
async def homepage_handler(context: PlaywrightCrawlingContext) -> None:
    # Default handler processes unlabeled requests
    await context.enqueue_links(selector='a[href*="/article/"]', label='ARTICLE')

@crawler.router.handler('ARTICLE')
async def article_handler(context: PlaywrightCrawlingContext) -> None:
    # Labeled handler for specific page types
    html = await context.page.content()
    await context.push_data({
        'url': context.request.url,
        'html': html,
    })

# Start with labeled and unlabeled requests
await crawler.run([
    'https://news-site.com/',
    Request.from_url('https://news-site.com/article/123', label='ARTICLE'),
])
```

### Pre-navigation hooks for page setup

Python Crawlee uses the `@crawler.pre_navigation_hook` decorator instead of TypeScript's `preNavigationHooks` array. **Note that Python does NOT support `postNavigationHooks`**—handle post-navigation logic within request handlers instead.

```python
from crawlee.crawlers import PlaywrightPreNavCrawlingContext

@crawler.pre_navigation_hook
async def setup_page(context: PlaywrightPreNavCrawlingContext) -> None:
    context.page.set_default_navigation_timeout(60_000)
    await context.page.set_viewport_size({'width': 1280, 'height': 1024})
    
    # Block unnecessary resources for faster crawling
    await context.block_requests(
        extra_url_patterns=['*.png', '*.jpg', '*.css', '*google-analytics*', '*facebook*']
    )
```

---

## Apify Python SDK storage patterns

The Apify SDK provides two primary storage types: **Datasets for structured tabular data** (scraped results as rows) and **Key-Value Stores for arbitrary files** (HTML snapshots, images, JSON state). Understanding when to use each is critical for efficient actor design.

### Key-Value Store operations

```python
from apify import Actor
import re

async def main() -> None:
    async with Actor:
        # Open named store (persists indefinitely) vs default (7-day retention)
        kvs = await Actor.open_key_value_store(name='html-snapshots')
        
        # Save HTML with URL-based key
        url = 'https://example.com/page'
        safe_key = re.sub(r'[^a-zA-Z0-9\-_.]', '_', url)[:256]
        await kvs.set_value(
            key=f'{safe_key}.html',
            value=html_content,
            content_type='text/html; charset=utf-8'
        )
        
        # Retrieve stored content
        html = await kvs.get_value(f'{safe_key}.html')
        
        # Convenience methods for default store
        await Actor.set_value('my-key', {'data': 'value'})
        data = await Actor.get_value('my-key')
```

### Dataset vs Key-Value Store comparison

| Feature | Dataset | Key-Value Store |
|---------|---------|-----------------|
| Structure | Tabular rows with consistent schema | Key-file pairs with any MIME type |
| Mutability | Append-only (no updates/deletes) | Full read/write/delete |
| Data types | JSON objects only | HTML, images, PDFs, any binary |
| Export formats | JSON, CSV, XML, Excel | As stored |
| Best for | Scraped product listings, article data | HTML snapshots, screenshots, state |

### Actor.main() pattern and lifecycle

```python
import asyncio
from apify import Actor
from crawlee.crawlers import PlaywrightCrawler, PlaywrightCrawlingContext

# Define crawler OUTSIDE main to avoid re-initialization
crawler = PlaywrightCrawler(max_requests_per_crawl=50, headless=True)

@crawler.router.default_handler
async def handler(context: PlaywrightCrawlingContext) -> None:
    Actor.log.info(f'Scraping {context.request.url}')
    await context.push_data({
        'url': context.request.url,
        'title': await context.page.title(),
    })

async def main() -> None:
    async with Actor:  # Handles init and exit automatically
        actor_input = await Actor.get_input() or {}
        start_urls = [url.get('url') for url in actor_input.get('start_urls', [])]
        
        if not start_urls:
            Actor.log.info('No URLs provided, exiting')
            await Actor.exit()
            return
        
        await crawler.run(start_urls)

if __name__ == '__main__':
    asyncio.run(main())
```

### ProxyConfiguration in Python

```python
async with Actor:
    actor_input = await Actor.get_input() or {}
    proxy_settings = actor_input.get('proxyConfiguration')
    
    # Create from actor input (recommended)
    proxy_cfg = await Actor.create_proxy_configuration(
        actor_proxy_input=proxy_settings
    )
    
    # Or configure manually
    proxy_cfg = await Actor.create_proxy_configuration(
        groups=['RESIDENTIAL'],
        country_code='US',
    )
    
    if proxy_cfg:
        proxy_url = await proxy_cfg.new_url()  # Rotates automatically
```

---

## Trafilatura text extraction library

Trafilatura extracts **main content, metadata, and comments** from web pages using a combination of heuristics and fallback algorithms. It supports multiple output formats and provides fine-grained control over extraction precision versus recall.

### Installation and basic usage

```bash
pip install trafilatura
# Full installation with language detection
pip install trafilatura[all]
```

```python
from trafilatura import fetch_url, extract, bare_extraction

# Basic extraction
url = 'https://example.com/article'
downloaded = fetch_url(url)
text = extract(downloaded)

# Full extraction with all metadata
result = extract(
    downloaded,
    url=url,
    output_format='json',
    with_metadata=True,
    include_comments=True,
    include_tables=True,
)
```

### Complete extract() parameter reference

```python
trafilatura.extract(
    filecontent,                    # HTML string or LXML element (required)
    url=None,                       # Source URL for metadata
    output_format='txt',            # 'txt', 'json', 'xml', 'xmltei', 'markdown'
    with_metadata=False,            # Include metadata in output
    include_comments=True,          # Extract comments section
    include_tables=True,            # Process HTML tables
    include_links=False,            # Preserve hyperlinks (experimental)
    include_images=False,           # Include image info (experimental)
    include_formatting=False,       # Keep bold, italic, headings
    favor_precision=False,          # Less text, higher accuracy
    favor_recall=False,             # More text, may include noise
    fast=False,                     # Skip fallback algorithms for speed
    target_language=None,           # Filter by ISO 639-1 code (e.g., 'en')
    deduplicate=False,              # Remove duplicate segments
)
```

### Output format examples

**JSON output** returns structured data with all extracted fields:

```python
result = extract(html, output_format='json', with_metadata=True)
# Returns:
# {
#   "title": "Article Title",
#   "author": "John Doe",
#   "date": "2025-01-15",
#   "text": "Main article content...",
#   "comments": "User comments...",
#   "hostname": "example.com",
#   "categories": "Technology",
#   "tags": "python, web scraping"
# }
```

**Markdown output** preserves document structure:

```python
result = extract(html, output_format='markdown', include_formatting=True)
# Returns formatted markdown with headers, lists, emphasis
```

### Precision vs recall tradeoffs

- **`favor_precision=True`**: Returns less text but with higher confidence it's main content. Use when quality matters more than completeness.
- **`favor_recall=True`**: Returns more text including borderline content. Use when you need comprehensive extraction.
- **`fast=True`**: Skips fallback algorithms (jusText, readability). Faster but may miss content on unusual page layouts.

### Metadata extraction capabilities

```python
from trafilatura import extract_metadata, bare_extraction

# Direct metadata extraction
metadata = extract_metadata(html)
print(metadata.title, metadata.author, metadata.date)

# Full Document object with bare_extraction
doc = bare_extraction(html, with_metadata=True)
print(doc.title)       # Article title
print(doc.author)      # Author name(s)
print(doc.date)        # Publication date
print(doc.categories)  # Content categories
print(doc.tags)        # Keywords/tags
print(doc.sitename)    # Site name
print(doc.description) # Meta description
```

---

## Porting TypeScript Crawlee patterns to Python

The most significant difference between TypeScript and Python Crawlee is the **decorator-based handler registration** in Python versus method-based registration in TypeScript. Context objects also differ—Python requires accessing properties through `context.` prefix rather than destructuring.

### Handler registration comparison

**TypeScript:**
```typescript
router.addHandler('DETAIL', async ({ page, request, enqueueLinks }) => {
    const title = await page.title();
    await pushData({ url: request.url, title });
});
```

**Python:**
```python
@crawler.router.handler('DETAIL')
async def detail_handler(context: PlaywrightCrawlingContext) -> None:
    title = await context.page.title()
    await context.push_data({'url': context.request.url, 'title': title})
```

### Key syntax differences table

| Feature | TypeScript | Python |
|---------|------------|--------|
| Handler registration | `router.addHandler('LABEL', fn)` | `@router.handler('LABEL')` decorator |
| Default handler | `router.addDefaultHandler(fn)` | `@router.default_handler` decorator |
| Pre-nav hooks | `preNavigationHooks: [fn]` array | `@crawler.pre_navigation_hook` decorator |
| Post-nav hooks | `postNavigationHooks: [fn]` | Not available—use handler logic |
| Context access | Destructuring `{ page, request }` | Dot notation `context.page`, `context.request` |
| Parallel ops | `Promise.all([...])` | `asyncio.gather(...)` |
| Entry point | `main()` | `asyncio.run(main())` |

### Error handling in Python Crawlee

```python
from crawlee.crawlers import BasicCrawlingContext
from crawlee.errors import HttpStatusCodeError, SessionError

@crawler.error_handler
async def error_handler(context: BasicCrawlingContext, error: Exception) -> None:
    context.log.warning(f'Error on {context.request.url}: {error}')
    
    # Disable retries for non-network errors
    if not isinstance(error, (HttpStatusCodeError, SessionError)):
        context.request.no_retry = True

@crawler.failed_request_handler
async def failed_handler(context: BasicCrawlingContext, error: Exception) -> None:
    context.log.error(f'Permanently failed: {context.request.url}')
    await context.push_data({
        'failed_url': context.request.url,
        'error': str(error),
        'status': 'failed',
    })
```

### Input validation with Pydantic (Python equivalent to Zod)

```python
from pydantic import BaseModel, Field, field_validator
from typing import Optional

class ActorInput(BaseModel):
    start_urls: list[dict] = Field(default_factory=list)
    max_pages: int = Field(default=100, gt=0)
    output_format: str = Field(default='JSON')
    proxy_configuration: Optional[dict] = None
    
    @field_validator('output_format')
    @classmethod
    def validate_format(cls, v: str) -> str:
        allowed = ['JSON', 'CSV', 'MARKDOWN']
        if v not in allowed:
            raise ValueError(f'output_format must be one of {allowed}')
        return v

async def main() -> None:
    async with Actor:
        raw_input = await Actor.get_input() or {}
        try:
            config = ActorInput(**raw_input)
        except ValidationError as e:
            await Actor.fail(status_message=f'Invalid input: {e}')
            return
```

---

## Apify Actor deployment configuration

### Dockerfile for Python Playwright actors

All Apify Python images now use a **non-root user (`myuser`)** with working directory `/home/myuser`. Always use `--chown=myuser:myuser` in COPY commands.

```dockerfile
FROM apify/actor-python-playwright:3.12

# Copy dependencies first for Docker layer caching
COPY --chown=myuser:myuser requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY --chown=myuser:myuser . ./

CMD ["python", "-m", "src"]
```

### requirements.txt for Crawlee with Playwright

```txt
# Core packages
apify>=2.0.0
crawlee[playwright]>=0.4.0

# Text extraction
trafilatura>=2.0.0

# Optional: validation
pydantic>=2.0.0
```

### actor.json configuration

```json
{
    "actorSpecification": 1,
    "name": "web-content-extractor",
    "title": "Web Content Extractor",
    "version": "0.1",
    "buildTag": "latest",
    "defaultMemoryMbytes": 2048,
    "minMemoryMbytes": 1024,
    "maxMemoryMbytes": 8192,
    "dockerfile": "./Dockerfile",
    "readme": "./README.md",
    "input": "./input_schema.json"
}
```

**Memory recommendations**: Playwright actors require minimum **1024 MB** memory. Default to **2048 MB** for reliable operation with multiple browser contexts.

### Complete input_schema.json with enum patterns

```json
{
    "title": "Content Extractor Input",
    "description": "Configure the web content extraction settings",
    "type": "object",
    "schemaVersion": 1,
    "properties": {
        "startUrls": {
            "title": "Start URLs",
            "type": "array",
            "description": "URLs to extract content from",
            "editor": "requestListSources",
            "prefill": [{"url": "https://example.com"}]
        },
        "maxPagesPerCrawl": {
            "title": "Max pages",
            "type": "integer",
            "description": "Maximum number of pages to process",
            "default": 100,
            "minimum": 1,
            "maximum": 10000
        },
        "outputFormat": {
            "title": "Output Format",
            "type": "string",
            "description": "Format for extracted content",
            "editor": "select",
            "default": "JSON",
            "enum": ["JSON", "MARKDOWN", "PLAIN_TEXT", "XML"],
            "enumTitles": ["JSON with metadata", "Markdown", "Plain text", "XML structure"]
        },
        "extractionMode": {
            "title": "Extraction Mode",
            "type": "string",
            "description": "Balance between precision and recall",
            "editor": "select",
            "default": "BALANCED",
            "enum": ["FAVOR_PRECISION", "BALANCED", "FAVOR_RECALL"],
            "enumTitles": ["High precision (less noise)", "Balanced", "High recall (more content)"]
        },
        "includeMetadata": {
            "title": "Include Metadata",
            "type": "boolean",
            "description": "Extract title, author, date, and other metadata",
            "default": true
        },
        "proxyConfiguration": {
            "title": "Proxy Configuration",
            "type": "object",
            "description": "Configure proxy settings",
            "editor": "proxy",
            "prefill": {"useApifyProxy": true}
        }
    },
    "required": ["startUrls"]
}
```

### Enum conventions

- Use **SCREAMING_SNAKE_CASE** for enum values (`FAVOR_PRECISION`, `PLAIN_TEXT`)
- Provide human-readable **enumTitles** for UI display
- Set sensible **defaults** that work for most users
- Use **editor: "select"** to render as dropdown

---

## Complete project structure

```
my-content-extractor/
├── .actor/
│   ├── actor.json
│   └── input_schema.json
├── src/
│   ├── __init__.py
│   ├── __main__.py        # Entry: asyncio.run(main())
│   └── main.py            # Main actor logic
├── Dockerfile
├── requirements.txt
└── README.md
```

### Entry point (src/__main__.py)

```python
import asyncio
from .main import main

asyncio.run(main())
```

### Main actor with trafilatura integration (src/main.py)

```python
import asyncio
import re
from apify import Actor
from crawlee.crawlers import PlaywrightCrawler, PlaywrightCrawlingContext
import trafilatura

crawler = PlaywrightCrawler(headless=True)

@crawler.router.default_handler
async def handler(context: PlaywrightCrawlingContext) -> None:
    Actor.log.info(f'Processing {context.request.url}')
    
    # Get full page HTML
    html = await context.page.content()
    
    # Store HTML in Key-Value Store
    kvs = await Actor.open_key_value_store(name='html-snapshots')
    safe_key = re.sub(r'[^a-zA-Z0-9\-_.]', '_', context.request.url)[:200]
    await kvs.set_value(f'{safe_key}.html', html, content_type='text/html')
    
    # Extract content with trafilatura
    extracted = trafilatura.extract(
        html,
        url=context.request.url,
        output_format='json',
        with_metadata=True,
        include_tables=True,
        favor_precision=True,
    )
    
    if extracted:
        import json
        data = json.loads(extracted)
        data['source_url'] = context.request.url
        await context.push_data(data)

async def main() -> None:
    async with Actor:
        actor_input = await Actor.get_input() or {}
        start_urls = [url.get('url') for url in actor_input.get('startUrls', [])]
        max_pages = actor_input.get('maxPagesPerCrawl', 100)
        
        if not start_urls:
            Actor.log.info('No URLs provided')
            await Actor.exit()
            return
        
        crawler._max_requests_per_crawl = max_pages
        await crawler.run(start_urls)
```

---

## Conclusion

Building Python Apify Actors with Crawlee and trafilatura involves three interconnected systems. **PlaywrightCrawler** handles browser automation with decorator-based request handlers and pre-navigation hooks—notably different from TypeScript's callback arrays. **The Apify SDK** provides cloud-native storage through Key-Value Stores for HTML snapshots and Datasets for structured extraction results, with the `async with Actor` context manager handling lifecycle automatically. **Trafilatura** excels at extracting clean text from noisy HTML, with configurable precision/recall tradeoffs and comprehensive metadata extraction including author, date, and categories.

Key implementation decisions include: using labeled handlers for different page types, storing raw HTML before extraction for debugging, choosing `favor_precision=True` for cleaner output, and structuring input schemas with SCREAMING_SNAKE_CASE enums for clear user interfaces. Memory allocation should start at **2048 MB** for Playwright actors, and named storage ensures data persists beyond the default 7-day retention.
