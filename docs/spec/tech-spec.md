# Contextractor - Technical Specification

## Stack

- Python 3.12+
- uv workspace monorepo with hatchling build system
- Crawlee for Python with PlaywrightCrawler
- Apify SDK (Apify actor only)
- contextractor-engine library (Trafilatura wrapper)
- Typer CLI (standalone app)
- npm package with PyInstaller binaries (standalone distribution)
- Docker image on GHCR (standalone distribution)

## Architecture

Three-package monorepo:
- `packages/contextractor_engine/` - Library package, depends on trafilatura only
- `apps/contextractor-apify/` - Apify Actor application, depends on engine + apify + crawlee
- `apps/contextractor-standalone/` - Standalone CLI, depends on engine + crawlee (no Apify)

### Apify Actor
```
Input URLs → PlaywrightCrawler → ContentExtractor → KVS (blobs) + Dataset (metadata)
```

### Standalone CLI
```
Config file (JSON) → PlaywrightCrawler → ContentExtractor → Output files (one per page)
```

### npm Distribution
```
npm install contextractor → postinstall downloads platform binary from GitHub releases
                          → npx contextractor https://example.com
```

GitHub Actions builds PyInstaller binaries for 4 platforms (linux-x64, linux-arm64, darwin-arm64, win-x64) and uploads to GitHub releases. macOS x64 users run the arm64 binary via Rosetta. The npm package (`contextractor` on npmjs.com) is a ~2KB wrapper that downloads the correct binary at install time.

## Key Implementation Details

### Apify Actor Handler Pattern

Handler must be defined inside `async with Actor:` context. Config passed via `Request.user_data`:

```python
async with Actor:
    kvs = await Actor.open_key_value_store(name='content')
    crawler = PlaywrightCrawler(...)

    @crawler.router.default_handler
    async def handler(ctx: PlaywrightCrawlingContext) -> None:
        config = ctx.request.user_data.get('config', {})
        trafilatura_config_raw = config.get('trafilatura_config_raw', {})
        trafilatura_config = TrafilaturaConfig.from_json_dict(trafilatura_config_raw)

        extractor = ContentExtractor(config=trafilatura_config)
        html = await ctx.page.content()
        # extract and save...

    requests = [Request.from_url(url, user_data={'config': config}) for url in start_urls]
    await crawler.run(requests)
```

### Standalone CLI

CLI args / Config file (optional) → `CrawlConfig` → crawlee PlaywrightCrawler → output files.

```bash
# Zero-config with URL
contextractor https://example.com

# With flags
contextractor https://example.com --precision --save-json -o ./results

# With config file
contextractor --config config.json --max-pages 10
```

Config merge order: `defaults → config file (if provided) → CLI args`

All CrawlConfig and TrafilaturaConfig fields have CLI flag equivalents. URLs are positional args, config file is optional via `--config`.

### Content-Type Headers

All content-type headers must include charset: `text/html; charset=utf-8`

### Public URLs

Use `await kvs.get_public_url(key)` to get download URLs.

### TrafilaturaConfig

Replaces the old `extractionMode` enum. Dataclass mapping to trafilatura.extract() parameters:

```python
from contextractor_engine import ContentExtractor, TrafilaturaConfig

# Factory methods for common configurations
config = TrafilaturaConfig.balanced()   # Default balanced extraction
config = TrafilaturaConfig.precision()  # favor_precision=True
config = TrafilaturaConfig.recall()     # favor_recall=True

# Or customize directly
config = TrafilaturaConfig(
    favor_precision=True,
    include_links=False,
    target_language="en",
)

extractor = ContentExtractor(config=config)
result = extractor.extract(html, url=url, output_format="markdown")
metadata = extractor.extract_metadata(html, url=url)
```

Formats: `txt`, `json`, `markdown`, `xml`, `xmltei`

### Key Generation

MD5 hash of URL, first 16 characters: `hashlib.md5(url.encode()).hexdigest()[:16]`

### Browser Context Options

Custom headers and cookies are passed to the PlaywrightCrawler via `browser_new_context_options`:

```python
options = {}
if initial_cookies:
    options['storage_state'] = {'cookies': initial_cookies}
if custom_headers:
    options['extra_http_headers'] = custom_headers
```

This applies headers to all HTTP requests and pre-sets cookies on all browser contexts.

## Dependencies

Engine package (`packages/contextractor_engine/`):
```
trafilatura>=2.0.0
```

Apify Actor (`apps/contextractor-apify/`):
```
apify>=2.0.0,<4.0.0
crawlee[playwright]>=0.4.0
contextractor-engine (workspace)
browserforge<1.2.4
```

Standalone CLI (`apps/contextractor-standalone/`):
```
crawlee[playwright]>=0.4.0
contextractor-engine (workspace)
typer>=0.15.0
pyyaml>=6.0
browserforge<1.2.4
```

## Build

Build engine wheel for distribution:
```bash
./scripts/build-engine.sh
# or
uv build --package contextractor-engine --out-dir dist/
```

Build standalone CLI binary (current platform):
```bash
uv run python apps/contextractor-standalone/build.py
# Output: apps/contextractor-standalone/dist/contextractor-{platform}-{arch}
```

## Docker

### Apify Actor (root Dockerfile)

uv-based install with frozen lockfile:
```dockerfile
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
COPY pyproject.toml uv.lock ./
COPY packages/contextractor_engine/ ./packages/contextractor_engine/
COPY apps/contextractor-apify/ ./apps/contextractor-apify/
RUN uv sync --frozen --no-dev --directory apps/contextractor-apify
```

### Standalone CLI (`apps/contextractor-standalone/Dockerfile`)

Public Docker image for end users. Base: `mcr.microsoft.com/playwright/python:v1.50.0-noble` (Python 3.12, Chromium pre-installed).

Registry: `ghcr.io/contextractor/contextractor`

Build context must be the repo root (needs engine package + uv.lock):
```bash
docker build -f apps/contextractor-standalone/Dockerfile -t contextractor .
```

Multi-platform: linux/amd64, linux/arm64. Built and pushed to GHCR by the `publish-docker` job in `release.yml`, parallel to `publish-npm`.

## npm Distribution

Package: `contextractor` on npmjs.com
Repository: `https://github.com/contextractor/contextractor`

The npm package is a lightweight wrapper (~2KB) that downloads the correct platform binary from GitHub releases during `postinstall`. CI builds binaries for all 5 platforms via GitHub Actions and uploads them to GitHub releases.

```bash
npm install -g contextractor   # Install globally
npx contextractor https://example.com  # Or run via npx
```

### Release flow
1. Run `/git:release` (or manually push a `v*` tag)
2. GitHub Actions (`release.yml`) builds binaries on 4 platforms
3. Binaries uploaded to GitHub release
4. npm package published via OIDC trusted publishing (no tokens needed)
5. Docker image built and pushed to GHCR (multi-platform: linux/amd64, linux/arm64)

### Platforms
- linux-x64
- linux-arm64
- darwin-arm64 (macOS x64 runs via Rosetta)
- win-x64

### Publishing
npm publishing uses OIDC trusted publishing — GitHub Actions authenticates directly with npmjs.com, no NPM_TOKEN secret required. Configured at https://www.npmjs.com/package/contextractor/access.
