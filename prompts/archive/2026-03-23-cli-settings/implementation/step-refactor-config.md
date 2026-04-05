# Step 1: Refactor CrawlConfig for CLI-first use

## TLDR
Decouple CrawlConfig from requiring a file. Add a method to merge CLI args dict into config. Keep `from_file()` working for backward compat.

## Context
- See `cli-settings-notes/current-settings-inventory.md` for full settings list
- Current code: `apps/contextractor-standalone/src/contextractor_cli/config.py`
- CrawlConfig currently requires `from_file()` — make it work with just defaults + overrides

## Changes

### In `config.py`

1. Keep `from_file()` and `from_dict()` as-is (backward compat)

2. Remove `apply_cli_overrides()` — its logic moves into the merge step in `main.py`

3. Add a `merge()` method that takes a partial dict and overlays non-None values:

```python
def merge(self, overrides: dict[str, Any]) -> None:
    """Merge non-None overrides into this config."""
```

This handles both config file values and CLI args uniformly. The caller controls precedence by calling merge in order: defaults → file → CLI.

4. Extraction sub-options should be settable via flat keys like `include_links`, `favor_precision`, etc. — the merge method should route `extraction.*` keys into the TrafilaturaConfig object.

## Constraints
- Do NOT change TrafilaturaConfig in the engine package — it's shared with Apify
- Keep camelCase support in `from_dict()` for YAML/JSON files
- CLI args will use snake_case (typer convention)
