# Current Docs Inventory

## README files that need library API sections

### `/README.md` (root, also copied to `apps/contextractor-standalone/README.md`)
- Currently covers: Install (pip/npm), CLI usage, CLI options, config file, Docker run
- **Missing**: Node.js library API (`extract()` function), Python library API (`contextractor_engine`), Docker API usage

### `/packages/contextractor_engine/README.md`
- Currently covers: pip install, `ContentExtractor` usage with `TrafilaturaConfig`
- **OK as-is** — already documents the Python library API
- Could be expanded with more examples (multi-format, metadata extraction)

### `/apps/contextractor-apify/README.md`
- Apify actor README — separate concern, no library API needed

## APIs to document

### Node.js library API (npm package)
Source: `/apps/contextractor-standalone/npm/index.js`
- `extract(urls, options)` — Promise-based, spawns binary
- Exports: `{ getBinaryPath, getBinaryName, getBrowsersPath, extract }`
- Options are camelCase, matching CLI flags
- Returns `Promise<void>` — writes to stdout or `outputDir`
- All extraction options: `save`, `precision`, `recall`, `fast`, `noLinks`, `noComments`, `includeTables`, `includeImages`, `includeFormatting`, `deduplicate`, `targetLanguage`, `withMetadata`, `outputDir`, `maxPages`, `crawlDepth`, etc.

### Python library API (contextractor_engine)
Source: `/packages/contextractor_engine/src/contextractor_engine/`
- `ContentExtractor(config)` — main class
- `.extract(html, url, output_format)` → `ExtractionResult`
- `.extract_metadata(html, url)` → `MetadataResult`
- `TrafilaturaConfig` — config dataclass with `.balanced()` factory
- `ExtractionResult` — has `.content` and `.output_format`
- `MetadataResult` — has `.title`, `.author`, `.date`, `.description`, `.sitename`, `.language`, `.categories`, `.tags`

### Docker API usage
The Docker image runs the same binary as the CLI. "Docker via the API" means:
- Running Docker programmatically from Python (subprocess or docker-py)
- Running Docker programmatically from Node.js (child_process or dockerode)
- Using Docker in CI/CD pipelines
- Volume mounting for input/output
