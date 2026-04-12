# Step 1: Add PyPI Link to CLI Help, Apify Actor, npm package.json

## TLDR

Add `https://pypi.org/project/contextractor/` to three locations that currently lack it: CLI `--help` output, Apify Actor description, and npm `package.json`. READMEs already have the link (commit f5b1f37).

See: `../docs-pypi-and-config-case-notes/pypi-link-status.md`, `../user-entry-log/entry-qa-pypi-locations.md`

## Tasks

### 1. CLI --help output

File: `apps/contextractor-standalone/src/contextractor_cli/main.py`

Add the PyPI link to the CLI app description or epilog so it appears in `--help` output. Place it alongside any existing links (npm, GitHub, etc.).

### 2. Apify Actor description

Files to check: `apps/contextractor-apify/.actor/actor.json`, `apps/contextractor-apify/.actor/input_schema.json`

Add the PyPI link to the Actor's description field so it's visible on the Apify platform page.

### 3. npm package.json

File: `apps/contextractor-standalone/npm/package.json`

Add the PyPI link. Check if there's a `homepage`, `repository`, or `keywords` field where it fits. If not, add a relevant field or include it in the description.
