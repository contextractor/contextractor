# Step 1: CLI Refactor — Remove --format, Add Save Toggles

## TLDR

Remove `--format` / `-f` from CLI. Add `--save-markdown` (default: true) and `--save-jsonl`. Update `CrawlConfig`, `main.py`, and `crawler.py`. Markdown is the default output when no `--save-*` flag is specified.

See: `config-consistency-notes/full-audit.md` for complete change list.

## Files to modify

- `apps/contextractor-standalone/src/contextractor_cli/main.py`
- `apps/contextractor-standalone/src/contextractor_cli/config.py`
- `apps/contextractor-standalone/src/contextractor_cli/crawler.py`

## Changes

### main.py

1. Remove the `output_format` / `--format` / `-f` parameter
2. Add `--save-markdown` boolean flag (default: True — matching Apify's `saveExtractedMarkdownToKeyValueStore: true`)
3. Add `--save-jsonl` boolean flag (default: False)
4. Update `cli_overrides` dict: remove `output_format`, add `save_markdown` and `save_jsonl`
5. Update the output summary line (currently prints format name)

### config.py

1. Remove `output_format: str = "markdown"` from `CrawlConfig`
2. Add `save_markdown: bool = True` to output toggles section
3. Add `save_jsonl: bool = False` to output toggles section
4. Update `from_dict()`: remove `outputFormat` parsing, add `saveMarkdown`/`saveJsonl` parsing
5. Accept Apify-style long keys: `saveExtractedMarkdownToKeyValueStore` → `save_markdown`, etc.

### crawler.py

1. Remove primary format logic — no single "primary format" anymore
2. Each `--save-*` flag produces its own output file(s)
3. `save_markdown` → `.md` files (one per page)
4. `save_text` → `.txt` files
5. `save_json` → `.json` files
6. `save_jsonl` → single `output.jsonl` file (all pages appended)
7. `save_xml` → `.xml` files
8. `save_xml_tei` → `.tei.xml` files
9. `save_raw_html` → `.html` files
10. Keep `FORMAT_EXTENSIONS` dict for extension mapping
11. If no `--save-*` is true, default to `save_markdown = True`

## Tests

After changes, run:
```bash
.venv/bin/python -m pytest apps/contextractor-standalone/tests/ -v
```

Tests will need updating to remove `--format` references and add `--save-*` test cases.
