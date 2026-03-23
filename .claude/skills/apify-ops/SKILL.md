---
name: apify-ops
description: Apify platform operations including builds, runs, storage, and deployment. Use for managing Actor builds, monitoring runs, accessing datasets/key-value stores, and diagnosing errors on the Apify platform.
---

# Apify Platform Operations

Comprehensive workflows for managing Actors on the Apify platform using MCP tools, CLI, and API.

## Tool Selection Guide

| Operation | Best Tool | Why |
|-----------|-----------|-----|
| Run Actors | MCP | Direct integration, structured output |
| Monitor runs | MCP | Real-time status, logs |
| Access datasets | MCP | Pagination, field selection |
| Access KV stores | MCP | Direct record access |
| Manage builds | CLI/API | No MCP build tools available |
| Local testing | CLI | `apify run` for development |
| Deploy | CLI | `apify push` for quick deploy |

## Get Actor Identity

Read actor name from `.actor/actor.json`. Use `apify whoami` to get username for full actor ID (`username/actor-name`).

## MCP Tools (Preferred for Runs & Storage)

See [references/mcp-tools.md](references/mcp-tools.md) for complete MCP tool reference.

**Quick reference:**
- `call-actor` - Run any Actor (two-step: info → call)
- `get-actor-run` / `get-actor-run-list` - Monitor runs
- `get-actor-log` - Get run logs
- `get-dataset*` - Dataset operations
- `get-key-value-store*` - Key-value store operations
- `search-actors` / `fetch-actor-details` - Discover Actors
- `search-apify-docs` / `fetch-apify-docs` - Documentation

## CLI Commands (Preferred for Builds)

See [references/cli-commands.md](references/cli-commands.md) for complete CLI reference.

**Quick reference:**
```bash
# Builds
apify builds ls --limit 5
apify builds log <buildId>
apify builds create --tag latest --log

# Development
apify run                    # Run locally
apify push                   # Deploy to platform

# Identity
apify whoami
```

## API Endpoints (Alternative/Fallback)

See [references/api-endpoints.md](references/api-endpoints.md) for complete API reference.

Use API when:
- CLI is not installed
- Scripting/automation needed
- More control over request parameters

## Common Workflows

### Fix Build Errors (Git-based)

1. **Commit and push** - Stage, commit, and push changes to Git
2. **Wait for auto-build** - Apify webhook triggers build from Git
3. **Check build status** - Poll until build completes
4. **If failed:** Analyze error, fix locally, repeat from step 1

### Diagnose Failed Run

1. **Get run info** - Use `get-actor-run` with runId
2. **Check logs** - Use `get-actor-log` for error details
3. **Review input** - Check key-value store for INPUT record
4. **Analyze output** - Check dataset for partial results

### Access Run Output

1. **Get run details** - Obtain `datasetId` from run info
2. **Fetch items** - Use `get-dataset-items` or `get-actor-output`
3. **Filter fields** - Use `fields` parameter for specific data

## Common Error Types

| Error Type | Location | Fix |
|------------|----------|-----|
| Schema validation | `*_schema.json` | Check JSON Schema format |
| Dataset schema | `dataset_schema.json` | Ensure `fields` is JSON Schema |
| Dockerfile | `Dockerfile` | Check base image, dependencies |
| Dependencies | `requirements.txt` | Verify versions, run `pip install -r requirements.txt` |
| Python syntax | `src/*.py` | Fix syntax errors, run `python3 -m compileall -q src/` |
| Import errors | `src/*.py` | Check imports and dependencies |

## Prerequisites

- `APIFY_TOKEN` environment variable must be set
- Apify CLI installed (`npm install -g apify-cli`) for build operations
- MCP server configured for run/storage operations
