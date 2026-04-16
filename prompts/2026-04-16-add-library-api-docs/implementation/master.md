# Add Library API and Docker API Documentation

## TLDR

Add library usage sections to the main README and standalone README — showing how to call contextractor programmatically from Node.js and Python, and how to run Docker extraction from code. Currently the docs only cover CLI usage.

Touches: `/README.md`, `/apps/contextractor-standalone/README.md`, `/packages/contextractor_engine/README.md`

## Skills and Agents

- `python-pro` agent — verify Python code examples against actual API
- `python` skill — Python code conventions

## Steps

- `step-add-nodejs-api.md` — Add Node.js library API section to README
- `step-add-python-api.md` — Add Python library API section to README
- `step-add-docker-api.md` — Add Docker programmatic usage section to README
- `step-sync-standalone.md` — Keep `apps/contextractor-standalone/README.md` in sync with root README
- `step-expand-engine-readme.md` — Expand `packages/contextractor_engine/README.md` with more examples

## Shared Context

- Root `README.md` and `apps/contextractor-standalone/README.md` are identical — both must be updated
- Node.js API source: `/apps/contextractor-standalone/npm/index.js` — exports `extract(urls, options)`
- Python API source: `/packages/contextractor_engine/src/contextractor_engine/` — `ContentExtractor`, `TrafilaturaConfig`
- Docker image: `ghcr.io/contextractor/contextractor`
- Research notes: `add-library-api-docs-notes/current-docs-inventory.md`
