# Step 1: Create Standalone Dockerfile

## TLDR
Create `apps/contextractor-standalone/Dockerfile` that builds the CLI with Playwright + Chromium. Image should accept CLI args directly.

## Context
- See `docker-notes/architecture.md` — base image options, architecture
- Standalone CLI entry: `contextractor_cli.main:app`
- Dependencies: crawlee[playwright], contextractor-engine (workspace), typer, pyyaml

## Dockerfile design

Base: `mcr.microsoft.com/playwright/python:v1.50.0-noble` (Python 3.12, Chromium pre-installed)

Build steps:
1. Install uv
2. Copy workspace root `pyproject.toml` + `uv.lock`
3. Copy `packages/contextractor_engine/`
4. Copy `apps/contextractor-standalone/`
5. `uv sync --frozen --no-dev --directory apps/contextractor-standalone`
6. Install Playwright browsers: `uv run playwright install chromium`

Entrypoint: `uv run contextractor`
Working dir: project root (so workspace resolution works)
Default output dir: `/output` (users mount a volume)

## Usage examples
```
docker run ghcr.io/contextractor/contextractor https://example.com
docker run -v ./output:/output ghcr.io/contextractor/contextractor https://example.com -o /output
docker run -v ./config.yaml:/config.yaml ghcr.io/contextractor/contextractor --config /config.yaml
```

## Build context
The Dockerfile lives in `apps/contextractor-standalone/` but needs the full workspace as build context (for engine package + uv.lock). Build with: `docker build -f apps/contextractor-standalone/Dockerfile .`

## Constraints
- Do NOT modify the root `Dockerfile` (it's for Apify)
- Do NOT modify `apps/contextractor-apify/Dockerfile`
- Keep image size reasonable — avoid installing unnecessary browsers (only Chromium)
- Default output dir should be `/output` so volume mounting is clean
