---
description: Verify contextractor package consistency (no cross-repo sync)
allowed-tools: Bash(*), Read(*), Edit(*), Write(*), Glob(*), Grep(*)
---

# Verify Package Consistency

Verify that the contextractor package internals are consistent — config fields, output formats, CLI flags, and engine models all agree with each other.

**Scope:** This command only verifies and fixes files within `/Users/miroslavsekera/r/contextractor`. For syncing to the tools repo (site GUI, API, engine wheel), use `/projects/contextractor/sync:gui` in the tools repo.

## Step READ: Read Current State from Source

Read the source-of-truth files:

- `apps/contextractor-standalone/src/contextractor_cli/config.py` — `CrawlConfig` fields
- `apps/contextractor-standalone/src/contextractor_cli/crawler.py` — `FORMAT_EXTENSIONS`
- `apps/contextractor-standalone/src/contextractor_cli/main.py` — CLI flags
- `packages/contextractor_engine/contextractor_engine/models.py` — `TrafilaturaConfig`
- `apps/contextractor-apify/.actor/input_schema.json` — Apify input schema

## Step VERIFY: Cross-Check Internal Consistency

Verify that:
- All `CrawlConfig` fields in `config.py` have corresponding CLI flags in `main.py`
- `TrafilaturaConfig` fields in `models.py` match the extraction-related subset of `CrawlConfig`
- `FORMAT_EXTENSIONS` in `crawler.py` covers all formats referenced in CLI flags
- Apify `input_schema.json` fields match `CrawlConfig` (camelCase)
- Default values are consistent across all files

Report any inconsistencies found and fix them.

## Step COMMIT: Commit if Changed

```bash
cd /Users/miroslavsekera/r/contextractor
git diff --stat
# Only commit if there are changes:
git add -A && git commit -m "Fix internal package consistency" && git push
```
