# Step 3: Run Sync Commands, Commit, Push

## TLDR

Run the two sync commands to propagate changes across all READMEs and verify GUI consistency, then commit and push.

See: `../docs-pypi-and-config-case-notes/sync-commands.md`

## Tasks

### 1. Run docs sync

Execute: `/sync/docs`

This syncs READMEs within the contextractor repo using source-of-truth files (main.py, config.py, crawler.py, input_schema.json).

### 2. Run GUI sync

Execute: `/sync/gui`

This verifies internal consistency: CrawlConfig fields vs CLI flags, TrafilaturaConfig, FORMAT_EXTENSIONS, Apify input_schema, and default values.

### 3. Commit and push

Commit all changes with a descriptive message covering both PyPI link additions and config case convention fixes. Push to remote.
