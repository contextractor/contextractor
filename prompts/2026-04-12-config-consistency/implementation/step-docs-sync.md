# Step 4: Documentation Sync

## TLDR

Update all READMEs to remove `--format` references, add `--save-markdown` and `--save-jsonl` to output toggles, update config file examples. Run sync commands.

## Files to update

- `README.md` (repo root)
- `apps/contextractor-standalone/npm/README.md`
- `apps/contextractor-standalone/README.md` (PyPI)

## Changes

### CLI Options section
- Remove `--format, -f` line from "Crawl Settings"
- Add `--save-markdown` and `--save-jsonl` to "Output Toggles"
- Update `--save-markdown` to note it's default: true

### Config file example
- Remove `"outputFormat": "markdown"` from JSON example
- Add `"saveMarkdown": true` to example

### Config tables
- Remove `outputFormat` row from Crawl Settings table
- Add `saveMarkdown` (bool, default: true) to Output Toggles table
- Add `saveJsonl` (bool, default: false) to Output Toggles table

### Usage examples
- Replace `--format json` with `--save-json`
- Replace `--format markdown` with just the default (no flag needed)

## Sync commands

After manual updates, run:
```
/sync:docs
/sync:gui
```

## Update docs version timestamp
```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```
