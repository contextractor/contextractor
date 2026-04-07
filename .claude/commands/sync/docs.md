---
description: Sync all docs — READMEs within the contextractor repo
allowed-tools: Bash(*), Read(*), Edit(*), Write(*), Glob(*), Grep(*)
---

# Sync Contextractor Repo Documentation

Ensure all documentation within the contextractor repo is consistent with the current state of the codebase. This covers CLI help, config tables, format lists, and READMEs.

**Scope:** This command only updates files within `/Users/miroslavsekera/r/contextractor`. For syncing to the tools repo (site, API, engine), use `/projects/contextractor/sync:docs` or `/projects/contextractor/sync:gui` in the tools repo.

## Source of Truth

The CLI code is the source of truth for options and formats:
- **CLI options**: `apps/contextractor-standalone/src/contextractor_cli/main.py` (all `typer.Option` definitions)
- **Config fields**: `apps/contextractor-standalone/src/contextractor_cli/config.py` (`CrawlConfig` dataclass)
- **Output formats**: `apps/contextractor-standalone/src/contextractor_cli/crawler.py` (`FORMAT_EXTENSIONS` dict)
- **Apify input schema**: `apps/contextractor-apify/.actor/input_schema.json`

## Step EXTRACT: Extract Current State

Read the source-of-truth files listed above. Build a complete inventory of:
- All CLI flags (name, type, default, help text)
- All config file fields (camelCase name, type, default, description)
- All output formats
- All proxy options (flat + tiered)

## Step SYNC: Update READMEs

### `README.md` (repo root)
- CLI reference section (all flags in help text format)
- Config file reference tables (Crawl Settings, Proxy, Browser, Crawl Filtering, Cookies & Headers, Output Toggles, Extraction)
- Format lists

### `apps/contextractor-standalone/npm/README.md`
- Same structure as root README — must be identical for CLI reference and config tables

### `apps/contextractor-apify/README.md`
- Apify-specific docs — verify feature list mentions all supported formats
- Verify output format descriptions match

## Step VERSION: Update Docs Version

Update the docs version timestamp in `README.md`:
```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```
Set this in the "Docs version" section at the end of `README.md`.

## Step VERIFY: Verify Consistency

Cross-check that:
- All CLI flags in `main.py` appear in all READMEs
- All config fields in `CrawlConfig` appear in all config tables
- Format lists match `FORMAT_EXTENSIONS` everywhere
- No stale/removed options are still documented

Report any inconsistencies found and fix them.

## Step COMMIT: Commit

```bash
cd /Users/miroslavsekera/r/contextractor
git add README.md apps/contextractor-standalone/npm/README.md apps/contextractor-apify/README.md
git commit -m "Sync documentation with current CLI and config state"
git push
```
