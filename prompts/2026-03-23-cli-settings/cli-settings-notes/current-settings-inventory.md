# Current Settings Inventory

## CLI (contextractor-standalone) — ~30 total settings

### CLI flags (8)
Config file path (required positional arg), --precision, --recall, --no-links, --no-comments, --verbose, --output-dir, --format

### Config file settings (7)
urls, maxPages, outputFormat, outputDir, crawlDepth, headless, extraction (object)

### TrafilaturaConfig extraction settings (15)
fast, favorPrecision, favorRecall, includeComments, includeTables, includeImages, includeFormatting, includeLinks, deduplicate, targetLanguage, withMetadata, onlyWithMetadata, teiValidation, pruneXpath, urlBlacklist, authorBlacklist, dateExtractionParams

## Current architecture
- Config file (YAML/JSON) is **required** — positional argument
- CLI flags override specific config values
- Merge order: defaults → config file → CLI flags
- camelCase in JSON/YAML, snake_case internally

## Apify actor — 54 input properties
Much larger surface area including proxy, browser config, storage names, crawler settings not in CLI.

## Key files
- `apps/contextractor-standalone/src/contextractor_cli/main.py` — CLI options
- `apps/contextractor-standalone/src/contextractor_cli/config.py` — Config file structure
- `packages/contextractor_engine/src/contextractor_engine/models.py` — TrafilaturaConfig
