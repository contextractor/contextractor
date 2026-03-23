# Contextractor

Extract clean, readable content from any website using [Trafilatura](https://trafilatura.readthedocs.io/).

## Install

```bash
npm install -g contextractor
```

Requires Node.js 18+. Playwright Chromium is installed automatically.

## Usage

Create a config file (`config.yaml`):

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

Run:

```bash
contextractor config.yaml
```

### CLI Options

```
contextractor <config-file> [options]

Options:
  --precision       High precision mode (less noise)
  --recall          High recall mode (more content)
  --no-links        Exclude links from output
  --no-comments     Exclude comments from output
  --output-dir, -o  Override output directory
  --format, -f      Override output format (txt, markdown, json, xml, xmltei)
  --verbose, -v     Enable verbose logging
```

CLI flags override config file settings. Merge order: `defaults -> config file -> CLI flags`

### Config Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `urls` | array | required | URLs to extract content from |
| `maxPages` | int | 0 | Max pages to crawl (0 = unlimited) |
| `outputFormat` | string | `"markdown"` | `txt`, `markdown`, `json`, `xml`, `xmltei` |
| `outputDir` | string | `"./output"` | Directory for extracted content |
| `crawlDepth` | int | 0 | How deep to follow links (0 = start URLs only) |
| `headless` | bool | true | Browser headless mode |
| `extraction` | object | `{}` | Trafilatura extraction options (see below) |

### Extraction Options

All options go under the `extraction` key:

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
| `targetLanguage` | string | null | Filter by language (e.g. `"en"`) |
| `fast` | bool | false | Fast mode (less thorough) |

## Output

One file per crawled page, named from the URL slug (e.g. `example-com-page.md`). Metadata (title, author, date) is included in the output header when available.

## Platforms

Binaries are available for:
- macOS (x64, arm64)
- Linux (x64, arm64)
- Windows (x64)

## License

MIT
