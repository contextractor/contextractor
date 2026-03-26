---
description: Sync contextractor package changes into contextractor-site GUI
allowed-tools: Bash(*), Read(*), Edit(*), Write(*), Glob(*), Grep(*)
---

# Sync GUI Functionality

Sync changes from the contextractor package (config options, output formats, extraction settings) into the contextractor-site GUI in the tools repo.

**IMPORTANT:** This is a fully automated workflow. Do NOT ask for confirmation at any step.

## Repos

- **contextractor**: `/Users/miroslavsekera/r/contextractor`
- **tools**: `/Users/miroslavsekera/r/tools`

## Step 1: Read Current State from Source

Read the source-of-truth files:

```
/Users/miroslavsekera/r/contextractor/apps/contextractor-standalone/src/contextractor_cli/config.py    → CrawlConfig fields
/Users/miroslavsekera/r/contextractor/apps/contextractor-standalone/src/contextractor_cli/crawler.py   → FORMAT_EXTENSIONS
/Users/miroslavsekera/r/contextractor/apps/contextractor-standalone/src/contextractor_cli/main.py      → CLI flags
/Users/miroslavsekera/r/contextractor/packages/contextractor_engine/contextractor_engine/models.py     → TrafilaturaConfig
```

## Step 2: Sync contextractor-engine

The engine package is distributed as a wheel to the tools repo. If the engine has changed:

1. Build the engine:
   ```bash
   cd /Users/miroslavsekera/r/contextractor && .venv/bin/python -m build packages/contextractor_engine
   ```

2. Copy the built wheel and source files to tools:
   ```bash
   cp packages/contextractor_engine/contextractor_engine/*.py \
      /Users/miroslavsekera/r/tools/distributed-packages/contextractor-engine/contextractor_engine/
   ```

3. Update the dist-info if version changed:
   ```bash
   cp -r packages/contextractor_engine/dist/*.whl \
      /Users/miroslavsekera/r/tools/distributed-packages/contextractor-engine/
   ```

If the engine has NOT changed (check `git diff packages/contextractor_engine/`), skip this step.

## Step 3: Sync TypeScript Types

Update `/Users/miroslavsekera/r/tools/apps/contextractor-api/types.ts` to match the current Python models:

- `OutputFormat` type — must include all formats from `FORMAT_EXTENSIONS` that apply to the web app (excludes `jsonl` which is CLI-only batch format)
- `OUTPUT_FORMATS` array — same as `OutputFormat`
- `TrafilaturaConfig` interface — must match Python `TrafilaturaConfig` fields
- `DEFAULT_TRAFILATURA_CONFIG` — must match Python `TrafilaturaConfig.balanced()` defaults

## Step 4: Sync Output Format Helpers

Update `/Users/miroslavsekera/r/tools/apps/contextractor-site/helpers/output-formats.ts`:

- `OUTPUT_FORMAT_EXTENSIONS` — file extension per format
- `OUTPUT_FORMAT_LABELS` — display label per format

These must cover all web-app-relevant formats from `OutputFormat`.

## Step 5: Sync Command Generators

Update `/Users/miroslavsekera/r/tools/apps/contextractor-site/helpers/generate-commands.ts`:

- `fmtToCliValue()` — format name to CLI `--format` value mapping
- `buildApifyInput()` → `formatToStoreKey` — format to Apify store key mapping
- `buildCliFlags()` — verify all TrafilaturaConfig fields are mapped to CLI flags
- Verify Docker command format matches current `ghcr.io/contextractor/contextractor` image

## Step 6: Sync GUI Components

Check and update if needed:

### `apps/contextractor-site/app/components/trafilatura-settings.tsx`
- Verify all `TrafilaturaConfig` fields have GUI toggles
- Verify field labels and defaults match

### `apps/contextractor-site/app/components/format-checkboxes.tsx`
- Verify it renders all output formats from `OUTPUT_FORMATS`

### `apps/contextractor-site/contexts/process-html-options-context.tsx`
- Verify `DEFAULT_TRAFILATURA_CONFIG` import is used correctly
- Verify state shape matches current types

## Step 7: Sync API Backend

Check `/Users/miroslavsekera/r/tools/apps/contextractor-api/`:

- Verify `processString` and `processFile` routes accept all current `OutputFormat` values
- Verify the API uses the same contextractor-engine version as the main repo

## Step 8: Verify and Commit

```bash
cd /Users/miroslavsekera/r/tools
# Check what changed
git diff --stat

# Commit if there are changes
git add apps/contextractor-api/ apps/contextractor-site/ distributed-packages/
git commit -m "Sync contextractor GUI with latest package changes"
git push
```

## What This Command Does NOT Do

- Does NOT update documentation/help pages (use `/sync:docs` for that)
- Does NOT publish anything (use `/publish:all` for that)
- Does NOT modify the contextractor repo itself
