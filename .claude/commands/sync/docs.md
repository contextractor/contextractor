---
description: Sync all docs — help pages, READMEs, about, between both repos
allowed-tools: Bash(*), Read(*), Edit(*), Write(*), Glob(*), Grep(*)
---

# Sync All Documentation

Ensure all documentation across both repos is consistent with the current state of the codebase. This covers CLI help, config tables, format lists, and site content.

**IMPORTANT:** This is a fully automated workflow. Do NOT ask for confirmation at any step.

## Source of Truth

The CLI code is the source of truth for options and formats:
- **CLI options**: `apps/contextractor-standalone/src/contextractor_cli/main.py` (all `typer.Option` definitions)
- **Config fields**: `apps/contextractor-standalone/src/contextractor_cli/config.py` (`CrawlConfig` dataclass)
- **Output formats**: `apps/contextractor-standalone/src/contextractor_cli/crawler.py` (`FORMAT_EXTENSIONS` dict)
- **Apify input schema**: `apps/contextractor-apify/.actor/input_schema.json`

## Repos

- **contextractor**: `/Users/miroslavsekera/r/contextractor`
- **tools**: `/Users/miroslavsekera/r/tools`

## Step 1: Extract Current State

Read the source-of-truth files listed above. Build a complete inventory of:
- All CLI flags (name, type, default, help text)
- All config file fields (camelCase name, type, default, description)
- All output formats
- All proxy options (flat + tiered)

## Step 2: Sync contextractor Repo Docs

Update these files to match the current CLI/config state:

### `README.md` (repo root)
- CLI reference section (all flags in help text format)
- Config file reference tables (Crawl Settings, Proxy, Browser, Crawl Filtering, Cookies & Headers, Output Toggles, Extraction)
- Format lists

### `apps/contextractor-standalone/npm/README.md`
- Same structure as root README — must be identical for CLI reference and config tables

### `apps/contextractor-apify/README.md`
- Apify-specific docs — verify feature list mentions all supported formats
- Verify output format descriptions match

## Step 3: Sync tools Repo Site Docs

Update these files in `/Users/miroslavsekera/r/tools/apps/contextractor-site/`:

### `content/automatic/help/cli/cli.md`
- CLI command reference tables (Crawl settings, Proxy, Browser, Crawl filtering, etc.)
- Config file reference tables
- Config file JSON example

### `content/automatic/help/web/web.md`
- Output formats list

### `content/automatic/help/docker/docker.md`
- Verify examples are up to date

### `content/automatic/about/about.md`
- Verify feature descriptions match current capabilities

### After updating `content/`, copy to `dist-content/`:
```bash
# For each changed content file:
cp content/automatic/help/cli/cli.md dist-content/automatic/help/cli/cli.md
cp content/automatic/help/web/web.md dist-content/automatic/help/web/web.md
cp content/automatic/help/docker/docker.md dist-content/automatic/help/docker/docker.md
# Only copy about if changed:
cp content/automatic/about/about.md dist-content/automatic/about/about.md
```

## Step 4: Update Docs Version

Update the docs version timestamp in `README.md`:
```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```
Set this in the "Docs version" section at the end of `README.md`.

## Step 5: Verify Consistency

Cross-check that:
- All CLI flags in `main.py` appear in all docs
- All config fields in `CrawlConfig` appear in all config tables
- Format lists match `FORMAT_EXTENSIONS` everywhere
- No stale/removed options are still documented
- `dist-content/` files match `content/` files

Report any inconsistencies found and fix them.

## Step 6: Commit Both Repos

Commit contextractor repo:
```bash
cd /Users/miroslavsekera/r/contextractor
git add README.md apps/contextractor-standalone/npm/README.md apps/contextractor-apify/README.md
git commit -m "Sync documentation with current CLI and config state"
git push
```

Commit tools repo:
```bash
cd /Users/miroslavsekera/r/tools
git add apps/contextractor-site/content/ apps/contextractor-site/dist-content/
git commit -m "Sync contextractor site docs with latest CLI options"
git push
```
