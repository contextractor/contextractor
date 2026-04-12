# Sync Commands

Two sync commands must run after all changes:

1. **`/sync/docs`** — Syncs READMEs within the repo. Source of truth:
   - `main.py` (CLI options)
   - `config.py` (CrawlConfig dataclass)
   - `crawler.py` (FORMAT_EXTENSIONS)
   - `input_schema.json` (Apify schema)
   
   Target READMEs: root, npm, apify

2. **`/sync/gui`** — Verifies internal consistency:
   - CrawlConfig fields vs CLI flags
   - TrafilaturaConfig fields
   - FORMAT_EXTENSIONS coverage
   - Apify input_schema vs CrawlConfig
   - Default values consistency
