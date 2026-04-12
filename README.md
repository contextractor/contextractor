# Contextractor

Extract clean, readable content from any website using [Trafilatura](https://trafilatura.readthedocs.io/).

Available as: [pip](#install) | [npm](#install) | [Docker](#docker) | [Apify actor](https://apify.com/glueo/contextractor)

Try the [Playground](https://contextractor.com) to configure extraction settings and preview commands before running.

## Install

```bash
pip install contextractor
```

or

```bash
npm install -g contextractor
```

Requires Python 3.12+ (pip) or Node.js 18+ (npm). Playwright Chromium is installed automatically.

## Usage

```bash
contextractor https://example.com
```

Works with zero config. Pass URLs directly, or use a config file for complex setups:

```bash
contextractor https://example.com --precision --save-json -o ./results
contextractor --config config.json --max-pages 10
```

### CLI Options

```
contextractor [OPTIONS] [URLS...]

Crawl Settings:
  --config, -c          Path to JSON config file
  --output-dir, -o      Output directory
  --max-pages           Max pages to crawl (0 = unlimited)
  --crawl-depth         Max link depth from start URLs (0 = start only)
  --headless/--no-headless  Browser headless mode (default: headless)
  --max-concurrency     Max parallel requests (default: 50)
  --max-retries         Max request retries (default: 3)
  --max-results         Max results per crawl (0 = unlimited)

Proxy:
  --proxy-urls          Comma-separated proxy URLs (http://user:pass@host:port)
  --proxy-rotation      Rotation: recommended, per_request, until_failure

Browser:
  --launcher            Browser engine: chromium, firefox (default: chromium)
  --wait-until          Page load event: load, networkidle, domcontentloaded (default: load)
  --page-load-timeout   Timeout in seconds (default: 60)
  --ignore-cors         Disable CORS/CSP restrictions
  --close-cookie-modals Auto-dismiss cookie banners
  --max-scroll-height   Max scroll height in pixels (default: 5000)
  --ignore-ssl-errors   Skip SSL certificate verification
  --user-agent          Custom User-Agent string

Crawl Filtering:
  --globs               Comma-separated glob patterns to include
  --excludes            Comma-separated glob patterns to exclude
  --link-selector       CSS selector for links to follow
  --keep-url-fragments  Preserve URL fragments
  --respect-robots-txt  Honor robots.txt

Cookies & Headers:
  --cookies             JSON array of cookie objects
  --headers             JSON object of custom HTTP headers

Output Toggles:
  --save-markdown/--no-save-markdown  Save extracted markdown (default: true)
  --save-raw-html       Save raw HTML to output
  --save-text           Save extracted text
  --save-json           Save extracted JSON
  --save-jsonl          Save all pages as JSONL (single file)
  --save-xml            Save extracted XML
  --save-xml-tei        Save extracted XML-TEI

Content Extraction:
  --precision           High precision mode (less noise)
  --recall              High recall mode (more content)
  --fast                Fast extraction mode (less thorough)
  --no-links            Exclude links from output
  --no-comments         Exclude comments from output
  --include-tables/--no-tables  Include tables (default: include)
  --include-images      Include image descriptions
  --include-formatting/--no-formatting  Preserve formatting (default: preserve)
  --deduplicate         Deduplicate extracted content
  --target-language     Filter by language (e.g. "en")
  --with-metadata/--no-metadata  Extract metadata (default: with)
  --prune-xpath         XPath patterns to remove from content

Diagnostics:
  --verbose, -v         Enable verbose logging
```

CLI flags override config file settings. Merge order: `defaults → config file → CLI args`

### Config File (optional)

Use a JSON config file to set options:

```json
{
  "urls": ["https://example.com", "https://docs.example.com"],
  "saveMarkdown": true,
  "outputDir": "./output",
  "crawlDepth": 1,
  "proxy": {
    "urls": ["http://user:pass@host:port"],
    "rotation": "recommended"
  },
  "trafilaturaConfig": {
    "favorPrecision": true,
    "includeLinks": true,
    "includeTables": true,
    "deduplicate": true
  }
}
```

### Crawl Settings

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `urls` | array | `[]` | URLs to extract content from |
| `maxPages` | int | 0 | Max pages to crawl (0 = unlimited) |
| `outputDir` | string | `"./output"` | Directory for extracted content |
| `crawlDepth` | int | 0 | How deep to follow links (0 = start URLs only) |
| `headless` | bool | true | Browser headless mode |
| `maxConcurrency` | int | 50 | Max parallel browser pages |
| `maxRetries` | int | 3 | Max retries for failed requests |
| `maxResults` | int | 0 | Max results per crawl (0 = unlimited) |

### Proxy Configuration

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `proxy.urls` | array | `[]` | Proxy URLs (`http://user:pass@host:port` or `socks5://host:port`) |
| `proxy.rotation` | string | `"recommended"` | `recommended`, `per_request`, `until_failure` |
| `proxy.tiered` | array | `[]` | Tiered proxy escalation (config-file only) |

### Browser Settings

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `launcher` | string | `"chromium"` | Browser engine: `chromium`, `firefox` |
| `waitUntil` | string | `"load"` | Page load event: `load`, `networkidle`, `domcontentloaded` |
| `pageLoadTimeout` | int | 60 | Page load timeout in seconds |
| `ignoreCors` | bool | false | Disable CORS/CSP restrictions |
| `closeCookieModals` | bool | true | Auto-dismiss cookie consent banners |
| `maxScrollHeight` | int | 5000 | Max scroll height in pixels (0 = disable) |
| `ignoreSslErrors` | bool | false | Skip SSL certificate verification |
| `userAgent` | string | `""` | Custom User-Agent string |

### Crawl Filtering

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `globs` | array | `[]` | Glob patterns for URLs to include |
| `excludes` | array | `[]` | Glob patterns for URLs to exclude |
| `linkSelector` | string | `""` | CSS selector for links to follow |
| `keepUrlFragments` | bool | false | Treat URLs with different fragments as different pages |
| `respectRobotsTxt` | bool | false | Honor robots.txt |

### Cookies & Headers

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `cookies` | array | `[]` | Initial cookies (`[{"name": "...", "value": "...", "domain": "..."}]`) |
| `headers` | object | `{}` | Custom HTTP headers (`{"Authorization": "Bearer token"}`) |

### Output Toggles

Each toggle saves its format independently. Multiple can be enabled at once:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `saveMarkdown` | bool | true | Save extracted markdown |
| `saveRawHtml` | bool | false | Save raw HTML |
| `saveText` | bool | false | Save extracted plain text |
| `saveJson` | bool | false | Save extracted JSON |
| `saveJsonl` | bool | false | Save all pages as JSONL (single file) |
| `saveXml` | bool | false | Save extracted XML |
| `saveXmlTei` | bool | false | Save extracted XML-TEI |

### Content Extraction

All options go under the `trafilaturaConfig` key in config files, or use the equivalent CLI flags:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `favorPrecision` | bool | false | High precision, less noise |
| `favorRecall` | bool | false | High recall, more content |
| `includeComments` | bool | true | Include comments |
| `includeTables` | bool | true | Include tables |
| `includeImages` | bool | false | Include images |
| `includeFormatting` | bool | true | Preserve formatting |
| `includeLinks` | bool | true | Include links |
| `deduplicate` | bool | false | Deduplicate content |
| `withMetadata` | bool | true | Extract metadata (title, author, date) |
| `targetLanguage` | string | null | Filter by language (e.g. `"en"`) |
| `fast` | bool | false | Fast mode (less thorough) |
| `pruneXpath` | array | null | XPath patterns to remove from content |

## Docker

```bash
docker run ghcr.io/contextractor/contextractor https://example.com
```

Save output to your local machine:

```bash
docker run -v ./output:/output ghcr.io/contextractor/contextractor https://example.com -o /output
```

Use a config file:

```bash
docker run -v ./config.json:/config.json ghcr.io/contextractor/contextractor --config /config.json
```

All CLI flags work the same inside Docker.

## Output

One file per crawled page, named from the URL slug (e.g. `example-com-page.md`). Metadata (title, author, date) is included in the output header when available.

## Platforms

- npm: macOS arm64, Linux (x64, arm64), Windows x64
- Docker: linux/amd64, linux/arm64

## License

Apache-2.0

## Docs version
2026-04-12T20:08:32Z
