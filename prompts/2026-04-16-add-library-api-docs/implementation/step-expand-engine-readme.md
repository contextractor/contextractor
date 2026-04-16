# Step: Expand Engine README

## TLDR

Add more examples to `packages/contextractor_engine/README.md` — metadata extraction, multiple formats, available config options.

References: `add-library-api-docs-notes/current-docs-inventory.md`

## Instructions

### Read current README

The engine README at `/packages/contextractor_engine/README.md` already has basic usage. Expand it with:

- Metadata extraction example: `extractor.extract_metadata(html, url=url)` with `MetadataResult` fields
- Multiple output formats example: extracting the same HTML as markdown, then json, then xml
- Full `TrafilaturaConfig` fields list with defaults (read from `models.py` `balanced()` method)
- Link back to main README for CLI/Docker usage
