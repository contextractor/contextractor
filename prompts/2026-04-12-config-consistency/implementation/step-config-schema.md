# Step 3: Config File Schema Update

## TLDR

Remove `outputFormat` from JSON config schema. Add `saveMarkdown` and `saveJsonl` fields. Accept both short names (`saveMarkdown`) and Apify-style long names (`saveExtractedMarkdownToKeyValueStore`).

## File to modify

- `apps/contextractor-standalone/src/contextractor_cli/config.py`

## Changes to `from_dict()`

1. Remove: `output_format=data.get("outputFormat", "markdown")`
2. Add: `save_markdown=data.get("saveMarkdown", data.get("saveExtractedMarkdownToKeyValueStore", True))`
3. Add: `save_jsonl=data.get("saveJsonl", False)`
4. Ensure all existing `save_*` fields also accept Apify-style long names:
   - `saveRawHtml` / `saveRawHtmlToKeyValueStore`
   - `saveText` / `saveExtractedTextToKeyValueStore`
   - `saveJson` / `saveExtractedJsonToKeyValueStore`
   - `saveXml` / `saveExtractedXmlToKeyValueStore`
   - `saveXmlTei` / `saveExtractedXmlTeiToKeyValueStore`

## Config file example (for docs)

```json
{
  "urls": ["https://example.com"],
  "saveMarkdown": true,
  "saveJson": true,
  "outputDir": "./output"
}
```

This replaces the old `"outputFormat": "markdown"` pattern.
