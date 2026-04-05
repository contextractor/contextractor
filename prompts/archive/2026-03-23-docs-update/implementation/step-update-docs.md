# Step 1: Update Docs

## TLDR
Update `docs/spec/functional-spec.md`, `docs/spec/tech-spec.md`, and `README.md` to reflect the CLI-first refactor and add Docker as a distribution method. CLI now supports URLs as positional args, `--config` is optional, all settings have CLI flag equivalents. Docker image at `ghcr.io/contextractor/contextractor`.

## Context
- See `docs-update-notes/research-findings.md` — both specs are outdated
- See `user-entry-log/entry-qa-decisions.md` — full CLI reference requested
- Current CLI code: `apps/contextractor-standalone/src/contextractor_cli/main.py`

## Changes to `docs/spec/functional-spec.md`

### CLI Usage section
Old: `contextractor <config-file> [options]`
New: `contextractor [OPTIONS] [URLS...]`

Update the CLI options table to include ALL flags:
- `--config`, `-c` — optional config file path
- `--max-pages` — max pages to crawl
- `--crawl-depth` — max link depth
- `--headless / --no-headless` — browser mode
- `--fast` — fast extraction
- `--include-tables / --no-tables`
- `--include-images`
- `--include-formatting / --no-formatting`
- `--deduplicate`
- `--target-language`
- `--with-metadata / --no-metadata`
- `--prune-xpath`
- Keep existing: `--precision`, `--recall`, `--no-links`, `--no-comments`, `--output-dir`, `--format`, `--verbose`

### Config File section
- Mark config file as **optional** (not required)
- Update merge order: `defaults → config file (if provided) → CLI args`
- Add note: `contextractor https://example.com` works with zero config

## Changes to `docs/spec/tech-spec.md`

### Standalone CLI section
Update the command examples:
```
contextractor https://example.com
contextractor https://example.com --precision --format json -o ./results
contextractor --config config.yaml --max-pages 10
```

Update the architecture diagram text:
Old: `Config file (YAML/JSON) → PlaywrightCrawler → ...`
New: `CLI args / Config file (optional) → PlaywrightCrawler → ...`

Update config merge order text.

### npm Distribution section
Update example:
Old: `npx contextractor config.yaml`
New: `npx contextractor https://example.com`

## Changes to `docs/spec/functional-spec.md` — Docker section

Add Docker as 4th availability mode in the overview list:
4. **Docker** — `docker run ghcr.io/contextractor/contextractor https://example.com`

Add a Docker section after the npm section:
- Image: `ghcr.io/contextractor/contextractor`
- Basic usage: `docker run ghcr.io/contextractor/contextractor https://example.com`
- Volume mount for output: `-v ./output:/output ... -o /output`
- Volume mount for config: `-v ./config.yaml:/config.yaml ... --config /config.yaml`
- All CLI flags work the same inside Docker

## Changes to `docs/spec/tech-spec.md` — Docker section

Add Docker distribution section covering:
- Dockerfile at `apps/contextractor-standalone/Dockerfile`
- Base image: Microsoft Playwright Python image
- Build context: full workspace (needs engine package + uv.lock)
- CI/CD: `publish-docker` job in release.yml, GHCR registry
- Multi-platform: linux/amd64, linux/arm64
- Tagging: version tag + `latest`

## Changes to `README.md`

Add Docker as alternative usage method after the npm install section:
```
docker run ghcr.io/contextractor/contextractor https://example.com
docker run -v ./output:/output ghcr.io/contextractor/contextractor https://example.com -o /output
```

Update the overview to mention all 4 distribution methods: npm, Docker, Apify, web app.
