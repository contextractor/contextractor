# Improve Claude Code Setup — Master

**TLDR:** Trim bloated config files, add missing MCP config, fix broken test command. Touches CLAUDE.md, python-pro agent, .mcp.json, and local-tests command.

## Steps

1. **step-trim-claude-md.md** — Remove generic Apify content and compress sections to <100 lines
2. **step-slim-python-pro.md** — Replace generic agent body with focused 30-line version, downgrade model
3. **step-add-mcp-json.md** — Create .mcp.json, install mcpc CLI with OAuth, update CLAUDE.md MCP section
4. **step-fix-local-tests.md** — Replace pip install with uv in local-tests command
5. **step-review.md** — Review all changes, run tests, verify against user intent

## Shared Context

- Project root: `/Users/miroslavsekera/r/contextractor/`
- Project uses uv workspace (pyproject.toml), not pip/requirements.txt
- The `apify-actor-development` skill covers all generic Actor guidance
- `APIFY_TOKEN` is configured in `.claude/settings.local.json`
