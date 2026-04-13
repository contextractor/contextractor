# Step 5: Update Apify Actor Internal Mapping

## TLDR

Update Apify Actor's `config.py` to translate individual Apify boolean inputs into the new `save` list format. Update handler to use `save` list. Apify input schema (`input_schema.json`) is NOT modified.

## Changes

### `apps/contextractor-apify/src/config.py`

**`build_crawl_config()` (lines 30-37)**: Replace the 6 individual boolean mappings:
```python
'save_raw_html': actor_input.get('saveRawHtmlToKeyValueStore', False),
'save_text': actor_input.get('saveExtractedTextToKeyValueStore', False),
...
```

With a `save` list builder:
```python
save_formats = []
format_mapping = {
    'saveExtractedMarkdownToKeyValueStore': 'markdown',
    'saveRawHtmlToKeyValueStore': 'html',
    'saveExtractedTextToKeyValueStore': 'text',
    'saveExtractedJsonToKeyValueStore': 'json',
    'saveExtractedXmlToKeyValueStore': 'xml',
    'saveExtractedXmlTeiToKeyValueStore': 'xml-tei',
}
for apify_key, format_name in format_mapping.items():
    if actor_input.get(apify_key, format_name == 'markdown'):  # markdown defaults True
        save_formats.append(format_name)
config['save'] = save_formats or ['markdown']
```

### `apps/contextractor-apify/src/handler.py`

**Lines 185-201**: Update format iteration to use `save` list from config instead of individual boolean keys. The handler currently iterates over a list of tuples `(config_key, output_format, data_key, content_type)` — update the config_key check to use `format_name in config['save']`.

### `.actor/input_schema.json`

**NO CHANGES.** Schema stays with individual boolean fields. The mapping layer handles translation.

## Validation

- Apify input `{"saveExtractedMarkdownToKeyValueStore": true, "saveExtractedXmlToKeyValueStore": true}` → internal `save: ["markdown", "xml"]`
- Apify input `{}` (all defaults) → internal `save: ["markdown"]`
- Apify input with all booleans false → internal `save: []` (no output)
