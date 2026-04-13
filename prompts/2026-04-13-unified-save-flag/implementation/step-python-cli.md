# Step 2: Update Python CLI Flags

## TLDR

Remove 7 boolean output toggle parameters from the typer CLI function. Add single `--save` string parameter. Update cli_overrides dict to pass the parsed list.

## Changes

### `apps/contextractor-standalone/src/contextractor_cli/main.py`

**Remove CLI parameters** (lines 144-172): Delete all 7 save_* parameters:
- `save_markdown`, `save_raw_html`, `save_text`, `save_json`, `save_jsonl`, `save_xml`, `save_xml_tei`

**Add new parameter** in the same section:
```python
save: Annotated[
    Optional[str],
    typer.Option("--save", help="Output formats, comma-separated: markdown,html,text,json,jsonl,xml,xml-tei,all (default: markdown)"),
] = None,
```

**Update cli_overrides** (lines 282-288): Replace the 7 boolean entries with:
```python
"save": validate_save_formats([s.strip() for s in save.split(",")]) if save else None,
```

Import `validate_save_formats` from config module.

**Help text group**: The `# -- Output toggles --` comment section should now contain just the single `--save` param.

## Expected CLI behavior

```
contextractor https://example.com                      # saves markdown (default)
contextractor --save xml,json https://example.com      # saves xml and json only
contextractor --save all https://example.com           # saves all formats
contextractor --save markdown,html https://example.com # saves markdown and html
```
