# Apify Actor — Contextractor

## What is this Actor for?
Read `README.md`

## Commands

```bash
apify run                              # Run Actor locally
python -m src                          # Run directly with Python
apify login                            # Authenticate account
apify push                             # Deploy to Apify platform
apify help                             # List all commands
```

## Git Rules

- NEVER add `Co-Authored-By`, `Signed-off-by`, or any other trailer attributing Claude/AI to commit messages
- Keep commit messages clean — just the subject and optional body, no footers about AI authorship

## Safety and Permissions

Allowed without prompt:

- read files with `await Actor.get_value()`
- push data with `await Actor.push_data()`
- set values with `await Actor.set_value()`
- enqueue requests to RequestQueue
- run locally with `apify run`

Ask first:

- pip package installations
- apify push (deployment to cloud)
- proxy configuration changes (requires paid plan)
- Dockerfile changes affecting builds
- deleting datasets or key-value stores

**Production Protection:**

- By default, push to the test actor `glueo/contextractor-test`
- Only push to production `glueo/contextractor` when explicitly requested with `--production` flag
- Use `/platform:push-and-get-working --production` for production deployments

## Project Structure

```
packages/
└── contextractor_engine/   # Shared extraction engine (TrafilaturaConfig, ContentExtractor)
apps/
├── contextractor-apify/    # Apify Actor (cloud platform)
│   ├── .actor/             # Actor config, schemas
│   └── src/                # Actor entry point and handlers
├── contextractor-standalone/  # Standalone CLI (no Apify dependency)
│   ├── src/contextractor_cli/ # CLI app (typer + crawlee)
│   ├── npm/                # npm package wrapper (JS + binaries)
│   └── build.py            # PyInstaller build script
Dockerfile               # Container image for Apify Actor
CLAUDE.md                # AI agent instructions (this file)
```

## Active Skills

When working in this project, these skills should be active:
- `apify-ops` - Platform operations, builds, runs, storage
- `apify-schemas` - Input/output schema definitions

## Testing

```bash
pytest                   # Run all tests
pytest -v                # Run tests with verbose output
pytest --cov=src         # Run tests with coverage
pytest -k "test_name"    # Run specific test
```

Tests in `tests/` or `src/tests/` should cover: Actor logic, data extraction, input validation, error handling.

## MCP Servers

Apify MCP server is configured in `.mcp.json` (native integration) and via `mcpc` CLI (scripted usage).

Native MCP tools: `search-apify-docs`, `fetch-apify-docs`

CLI usage (for skills and scripts):
- `mcpc @apify tools-list` — list available tools
- `mcpc @apify tools-call <tool> arg:=value` — call a tool
- `mcpc --json @apify tools-call ...` — JSON output for scripting

## Resources

- [docs.apify.com/llms.txt](https://docs.apify.com/llms.txt) - Quick reference
- [docs.apify.com/llms-full.txt](https://docs.apify.com/llms-full.txt) - Complete docs
- [crawlee.dev/python](https://crawlee.dev/python) - Crawlee for Python documentation
- [docs.apify.com/sdk/python](https://docs.apify.com/sdk/python) - Apify Python SDK docs
- [whitepaper.actor](https://raw.githubusercontent.com/apify/actor-whitepaper/refs/heads/master/README.md) - Complete Actor specification
