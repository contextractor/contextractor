# Step 7: Update Documentation

## TLDR

Update all README files and help text to document the new `--save` flag. Remove all references to old boolean toggle flags.

## Files to update

### Root README (`README.md`)
- Replace "Output Toggles" section showing 7 boolean flags with single `--save` flag documentation
- Update config file examples to use `"save": ["markdown", "xml"]`
- Update CLI usage examples

### Standalone README (`apps/contextractor-standalone/README.md`)
- Same changes as root README — output toggles section, config examples, CLI examples

### npm README (`apps/contextractor-standalone/npm/README.md`)
- Update JS library API examples to use `save: ["markdown", "json"]`
- Update CLI examples to use `--save markdown,json`
- Update config file examples

### Apify README (`apps/contextractor-apify/README.md`)
- Apify schema docs stay the same (boolean toggles in Apify UI)
- If there's a section showing CLI-style usage or config file format, update it

### Engine README (`packages/contextractor_engine/README.md`)
- Likely no changes needed (library uses per-call `output_format` string)
- Verify no references to save boolean flags

## Documentation format for --save

```
Output Format:
  --save TEXT  Output formats, comma-separated (default: markdown)
              Valid: markdown, html, text, json, jsonl, xml, xml-tei, all
```

## Config file example (JSON only per project rules)

```json
{
  "urls": ["https://example.com"],
  "save": ["markdown", "json"],
  "maxPages": 10
}
```
