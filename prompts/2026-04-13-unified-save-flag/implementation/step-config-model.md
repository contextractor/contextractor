# Step 1: Update CrawlConfig Model

## TLDR

Replace 7 boolean save fields in `CrawlConfig` with a single `save: list[str]` field. Update `from_dict()` to parse `"save": [...]` from config dicts. Add format name validation. Default: `["markdown"]`.

## Changes

### `apps/contextractor-standalone/src/contextractor_cli/config.py`

**Dataclass fields** (lines 63-70): Replace:
```python
save_markdown: bool = True
save_raw_html: bool = False
save_text: bool = False
save_json: bool = False
save_jsonl: bool = False
save_xml: bool = False
save_xml_tei: bool = False
```
With:
```python
save: list[str] = field(default_factory=lambda: ["markdown"])
```

**Add format validation constant** at module level:
```python
VALID_SAVE_FORMATS = {"markdown", "html", "text", "json", "jsonl", "xml", "xml-tei"}
```

**Add validation helper**:
```python
def validate_save_formats(formats: list[str]) -> list[str]:
    """Validate and normalize save format names. Expands 'all'."""
    result = []
    for fmt in formats:
        fmt = fmt.strip().lower()
        if fmt == "all":
            return sorted(VALID_SAVE_FORMATS)
        if fmt not in VALID_SAVE_FORMATS:
            raise ValueError(f"Unknown save format: '{fmt}'. Valid: {', '.join(sorted(VALID_SAVE_FORMATS))}")
        if fmt not in result:
            result.append(fmt)
    return result
```

**`from_dict()` method** (lines 144-151): Replace the 7 boolean `data.get()` calls with:
```python
save=validate_save_formats(data.get("save", ["markdown"])),
```

The `from_dict()` must handle the `save` key as a list. Remove all old boolean key handling (`save_markdown`, `save_raw_html`, `save_extracted_markdown_to_key_value_store`, etc.).

**`merge()` method**: Update to handle `save` key as a list override (not boolean merge). If `overrides["save"]` is not None, replace entirely.

## Validation

- `CrawlConfig()` → `save == ["markdown"]`
- `CrawlConfig(save=["xml", "json"])` → `save == ["xml", "json"]`
- `CrawlConfig.from_dict({"save": ["all"]})` → `save` contains all 7 formats
- `CrawlConfig.from_dict({"save": ["invalid"]})` → raises ValueError
- `CrawlConfig.from_dict({})` → `save == ["markdown"]`
