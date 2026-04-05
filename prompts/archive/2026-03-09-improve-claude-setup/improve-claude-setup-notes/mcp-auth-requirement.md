# Apify MCP Server Authentication

The `.mcp.json` config in the prompt uses `"url": "https://mcp.apify.com"` which is correct.

However, the Apify MCP server **requires authentication** via `APIFY_TOKEN`. The codebase already stores this token in `.claude/settings.local.json` as an environment variable.

The proposed `.mcp.json` config may work if Claude Code automatically passes env vars to MCP servers. If not, the config needs an `authorization` or `headers` field. Skill files reference:
```bash
mcpc --json mcp.apify.com --header "Authorization: Bearer $APIFY_TOKEN" ...
```

The SSE/streamable HTTP transport in Claude Code `.mcp.json` supports `"url"` format. Authentication may be handled automatically via the `APIFY_TOKEN` env var if configured in settings.
