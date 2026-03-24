# Contextractor

Extract clean, readable content from any website using [Trafilatura](https://trafilatura.readthedocs.io/).

Available as: [npm CLI](#install) | [Docker](#docker) | [Apify actor](https://apify.com/shortc/contextractor) | [Web app](https://contextractor.com)

## Install

```bash
npm install -g contextractor
```

Requires Node.js 18+. Playwright Chromium is installed automatically.

## Usage

```bash
contextractor https://example.com
```

Works with zero config. Pass URLs directly, or use a config file for complex setups:

```bash
contextractor https://example.com --precision --format json -o ./results
contextractor --config config.yaml --max-pages 10
```

### CLI Options

```
contextractor [OPTIONS] [URLS...]

Options:
  --config, -c          Path to YAML or JSON config file
  --output-dir, -o      Output directory
  --format, -f          Output format (txt, markdown, json, xml, xmltei)
  --max-pages           Max pages to crawl (0 = unlimited)
  --crawl-depth         Max link depth from start URLs (0 = start only)
  --headless/--no-headless  Browser headless mode (default: headless)
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
  --verbose, -v         Enable verbose logging
```

CLI flags override config file settings. Merge order: `defaults → config file → CLI args`

### Config File (optional)

```yaml
urls:
  - https://example.com
  - https://docs.example.com
outputFormat: markdown
outputDir: ./output
crawlDepth: 1

extraction:
  favorPrecision: true
  includeLinks: true
  includeTables: true
  deduplicate: true
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `urls` | array | `[]` | URLs to extract content from |
| `maxPages` | int | 0 | Max pages to crawl (0 = unlimited) |
| `outputFormat` | string | `"markdown"` | `txt`, `markdown`, `json`, `xml`, `xmltei` |
| `outputDir` | string | `"./output"` | Directory for extracted content |
| `crawlDepth` | int | 0 | How deep to follow links (0 = start URLs only) |
| `headless` | bool | true | Browser headless mode |
| `extraction` | object | `{}` | Trafilatura extraction options (see below) |

### Extraction Options

All options go under the `extraction` key in config files, or use the equivalent CLI flags:

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

All CLI flags work the same inside Docker.

## Output

One file per crawled page, named from the URL slug (e.g. `example-com-page.md`). Metadata (title, author, date) is included in the output header when available.

## Platforms

- npm: macOS arm64, Linux (x64, arm64), Windows x64
- Docker: linux/amd64, linux/arm64

## License

MIT
