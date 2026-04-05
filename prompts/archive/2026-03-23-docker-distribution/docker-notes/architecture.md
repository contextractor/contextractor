# Docker Distribution Architecture

## Current state
- Root `Dockerfile` exists but is Apify-specific (base: `apify/actor-python-playwright`, installs Apify actor)
- `apps/contextractor-apify/Dockerfile` is the actor-specific Dockerfile
- No standalone Docker image exists yet
- No Docker build/publish in `release.yml`
- GitHub repo: `contextractor/contextractor` → GHCR would be `ghcr.io/contextractor/contextractor`

## What needs to be built
A standalone Docker image that:
- Includes the standalone CLI (not the Apify actor)
- Has Playwright + Chromium pre-installed for browser-based crawling
- Accepts CLI args directly: `docker run ghcr.io/contextractor/contextractor https://example.com`
- Supports volume mounts for output: `-v ./output:/output`
- Supports config files: `-v ./config.yaml:/config.yaml --config /config.yaml`

## Base image options
- `mcr.microsoft.com/playwright/python:v1.50.0-noble` — Microsoft's official Playwright image with browsers
- `python:3.12-slim` + manual Playwright install — more control but larger build
- Best option: Microsoft Playwright image (browsers pre-installed, tested)

## Dockerfile location
- New file: `apps/contextractor-standalone/Dockerfile` (next to the CLI code)
- Or rename/repurpose root `Dockerfile` — but root is currently Apify's

## CI/CD integration
- Add `publish-docker` job to `release.yml` (after `release`, parallel with `publish-npm`)
- Use `docker/build-push-action` with GHCR
- Tag with version + `latest`
- Multi-platform: linux/amd64, linux/arm64

## Registry
- GHCR (GitHub Container Registry): `ghcr.io/contextractor/contextractor`
- Requires `packages: write` permission in workflow
