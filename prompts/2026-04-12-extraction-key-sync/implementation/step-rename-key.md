# Step 1: Rename `extraction` → `trafilaturaConfig`

## TLDR

Rename the `extraction` field to `trafilaturaConfig` in CrawlConfig dataclass, `from_dict()`, `merge()`, and crawler. Hard rename — no backward compat alias.

See: `extraction-key-sync-notes/extraction-key-locations.md` for complete location list.
See: `user-entry-log/entry-qa-config-key.md` for user decision on hard rename.

## Files to modify

- `apps/contextractor-standalone/src/contextractor_cli/config.py`
- `apps/contextractor-standalone/src/contextractor_cli/crawler.py`

## Changes

### config.py

1. Rename field: `extraction: TrafilaturaConfig` → `trafilatura_config: TrafilaturaConfig`
2. Update `from_dict()`: `data.get("extraction")` → `data.get("trafilaturaConfig")`
3. Update `merge()`: change `{"extraction"}` exclusion set to `{"trafilatura_config"}`
4. Update `_EXTRACTION_FIELDS` reference in `merge()` to route to `self.trafilatura_config`

### crawler.py

1. Update all `config.extraction` → `config.trafilatura_config`

## Tests

After changes, run:
```bash
.venv/bin/python -m pytest apps/contextractor-standalone/tests/ -v
```

Tests referencing `extraction` field will need updating to `trafilatura_config`.
