# Step 2: Update Site Help Page

## TLDR
Add CLI (full reference) and Docker sections to `/Users/miroslavsekera/r/tools/apps/contextractor-site/content/automatic/help/help.md`. Update `help-blurb.md` to mention all 4 usage modes. Run the site to visually verify.

## Context
- See `docs-update-notes/research-findings.md` — current help page only covers web app + Apify
- See `user-entry-log/entry-qa-decisions.md` — full CLI reference, Docker docs, delete logos
- Site is Next.js at `/Users/miroslavsekera/r/tools/apps/contextractor-site/`

## Changes to `help.md`

Add sections after the web app section:

### CLI section
- Installation: `npm install -g contextractor`
- Basic usage: `contextractor https://example.com`
- Full command signature: `contextractor [OPTIONS] [URLS...]`
- All CLI flags (complete reference table):
  - Config: `--config`, `-c`
  - Output: `--output-dir`, `--format`
  - Crawl: `--max-pages`, `--crawl-depth`, `--headless/--no-headless`
  - Extraction: `--precision`, `--recall`, `--fast`, `--no-links`, `--no-comments`, `--include-tables/--no-tables`, `--include-images`, `--include-formatting/--no-formatting`, `--deduplicate`, `--target-language`, `--with-metadata/--no-metadata`, `--prune-xpath`
  - Diagnostics: `--verbose`
- Config file (optional): YAML/JSON format reference
- Extraction options table
- Merge order: defaults → config file → CLI args

### Docker section
- Image: `ghcr.io/contextractor/contextractor`
- Basic usage: `docker run ghcr.io/contextractor/contextractor https://example.com`
- Output with volume mount: `docker run -v ./output:/output ghcr.io/contextractor/contextractor https://example.com -o /output`
- Config file: `docker run -v ./config.yaml:/config.yaml ghcr.io/contextractor/contextractor --config /config.yaml`
- Note: all CLI flags work the same inside Docker

### Apify section
- Already exists, keep as-is

## Changes to `help-blurb.md`
Update to mention all 4 modes: web app, CLI, Docker, Apify actor.

## Verification
Run the site locally to verify the help page renders correctly:
```bash
cd /Users/miroslavsekera/r/tools/apps/contextractor-site && npm run dev
```
Open `http://localhost:3000/help/` and visually check.
