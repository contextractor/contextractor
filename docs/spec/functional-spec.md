# Contextractor - Functional Specification

## Overview

Contextractor crawls websites and extracts clean, readable content using Trafilatura. Available as:

1. **Apify Actor** — cloud platform, content stored in Key-Value Store + Dataset
2. **Standalone CLI** — local tool, content saved as files to disk
3. **npm package** (`contextractor`) — installs the CLI via npm/npx
4. **Docker** — `docker run ghcr.io/contextractor/contextractor https://example.com`

---

## Standalone CLI

### Installation

```bash
# Via npm
npm install -g contextractor
# Or run directly
npx contextractor https://example.com
```

### CLI Usage

```bash
contextractor [OPTIONS] [URLS...]
```

Works with zero config — just pass URLs directly:

```bash
contextractor https://example.com
contextractor https://example.com --precision --format json -o ./results
contextractor --config config.json --max-pages 10
```

| Option | Description |
|--------|-------------|
| `--config`, `-c` | Path to JSON config file (optional) |
| `--output-dir`, `-o` | Output directory |
| `--format`, `-f` | Output format (txt, markdown, json, xml, xmltei) |
| `--max-pages` | Max pages to crawl (0 = unlimited) |
| `--crawl-depth` | Max link depth from start URLs (0 = start only) |
| `--headless` / `--no-headless` | Browser headless mode (default: headless) |
| `--precision` | High precision mode (less noise) |
| `--recall` | High recall mode (more content) |
| `--fast` | Fast extraction mode (less thorough) |
| `--no-links` | Exclude links from output |
| `--no-comments` | Exclude comments from output |
| `--include-tables` / `--no-tables` | Include tables (default: include) |
| `--include-images` | Include image descriptions |
| `--include-formatting` / `--no-formatting` | Preserve formatting (default: preserve) |
| `--deduplicate` | Deduplicate extracted content |
| `--target-language` | Filter by language (e.g. "en") |
| `--with-metadata` / `--no-metadata` | Extract metadata (default: with) |
| `--prune-xpath` | XPath patterns to remove from content |
| `--verbose`, `-v` | Enable verbose logging |

### Config File (optional, JSON)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| urls | array | [] | URLs to extract content from |
| maxPages | integer | 0 | Max pages to crawl (0 = unlimited) |
| outputFormat | string | "markdown" | Output format: txt, markdown, json, xml, xmltei |
| outputDir | string | "./output" | Directory for extracted content |
| crawlDepth | integer | 0 | How deep to follow links (0 = start URLs only) |
| headless | boolean | true | Browser headless mode |
| extraction | object | {} | TrafilaturaConfig options (see below) |

Config merge order: `defaults → config file (if provided) → CLI args`

### Output

One file per crawled page, named from URL slug (e.g. `example-com-page.md`). Metadata header (title, author, date, URL) included when available.

---

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
docker run -v ./config.yaml:/config.yaml ghcr.io/contextractor/contextractor --config /config.yaml
```

All CLI flags work the same inside Docker. Available for linux/amd64 and linux/arm64.

---

## Apify Actor

### Input

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| startUrls | array | required | URLs to extract content from |
| linkSelector | string | "" | CSS selector for links to enqueue |
| globs | array | [] | Glob patterns to match enqueued links |
| excludes | array | [] | Glob patterns to exclude |
| maxPagesPerCrawl | integer | 0 | Max pages (0 = unlimited) |
| exportHtml | boolean | false | Save raw HTML |
| exportText | boolean | false | Extract plain text |
| exportJson | boolean | false | Extract JSON with metadata |
| exportMarkdown | boolean | true | Extract Markdown |
| exportXml | boolean | false | Extract XML |
| exportXmlTei | boolean | false | Extract XML-TEI scholarly format |
| trafilaturaConfig | object | {} | Trafilatura extraction options (see below) |
| includeMetadata | boolean | true | Include title, author, date |
| initialCookies | array | [] | Pre-set cookies for authentication (encrypted) |
| customHttpHeaders | object | {} | Custom HTTP headers for all requests |

### trafilaturaConfig / extraction

Shared extraction options used by both the Apify Actor (`trafilaturaConfig` key) and standalone CLI (`extraction` key in config file). When empty `{}` or omitted, uses balanced defaults.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| fast | boolean | false | Fast mode (less thorough) |
| favorPrecision | boolean | false | High precision, less noise |
| favorRecall | boolean | false | High recall, more content |
| includeComments | boolean | true | Include comments |
| includeTables | boolean | true | Include tables |
| includeImages | boolean | false | Include images |
| includeFormatting | boolean | true | Preserve formatting |
| includeLinks | boolean | true | Include links |
| deduplicate | boolean | false | Deduplicate content |
| targetLanguage | string | null | Target language code |
| withMetadata | boolean | true | Extract metadata |
| onlyWithMetadata | boolean | false | Only return if metadata found |
| teiValidation | boolean | false | Validate TEI output |
| pruneXpath | string/array | null | XPath expressions to prune |

**Backward compatibility:**
- `{}` or omitted = previous `BALANCED` mode
- `{"favorPrecision": true}` = previous `FAVOR_PRECISION` mode
- `{"favorRecall": true}` = previous `FAVOR_RECALL` mode

**Note:** Keys accept both camelCase (JSON convention) and snake_case (Python convention). camelCase is converted to snake_case internally.

### Output

#### Dataset Entry

```json
{
  "loadedUrl": "https://example.com/page",
  "rawHtml": {
    "hash": "...",
    "length": 89898,
    "key": "abc123-raw.html",
    "url": "https://api.apify.com/v2/key-value-stores/{id}/records/abc123-raw.html"
  },
  "extractedMarkdown": {
    "key": "abc123.md",
    "url": "...",
    "hash": "...",
    "length": 6887
  },
  "loadedAt": "2026-01-28T18:58:36.534Z",
  "metadata": {
    "title": "Page Title",
    "author": null,
    "publishedAt": "2024-01-15",
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

#### Key-Value Store

Named `content`. Files stored with MD5-based keys:
- `{hash}-raw.html` - Raw HTML
- `{hash}.txt` - Plain text
- `{hash}.json` - JSON with metadata
- `{hash}.md` - Markdown
- `{hash}.xml` - XML
- `{hash}.tei.xml` - XML-TEI
