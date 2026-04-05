# Step: Add MCP Config and mcpc CLI

**TLDR:** Create `.mcp.json` for native Claude Code MCP integration. Install and configure `mcpc` CLI with OAuth (used by 9 skills for scripted MCP calls).

**References:**
- `improve-claude-setup-notes/mcp-auth-requirement.md` — native MCP auth details
- `improve-claude-setup-notes/mcpc-setup.md` — mcpc CLI setup and OAuth flow
- `user-entry-log/entry-qa-mcp-auth.md` — user said to verify after creation

## Part A: Native MCP (.mcp.json)

Create `/Users/miroslavsekera/r/contextractor/.mcp.json`:

```json
{
  "mcpServers": {
    "apify": {
      "url": "https://mcp.apify.com"
    }
  }
}
```

**Verify:** Call an Apify MCP tool (e.g., `search-apify-docs`). If auth fails:

1. Confirm `APIFY_TOKEN` is set in `.claude/settings.local.json`
2. If still failing, add explicit auth:
   ```json
   {
     "mcpServers": {
       "apify": {
         "url": "https://mcp.apify.com",
         "headers": {
           "Authorization": "Bearer ${APIFY_TOKEN}"
         }
       }
     }
   }
   ```

## Part B: mcpc CLI Setup

9 Apify skills already use `mcpc` via Bash for dynamic schema fetching and Actor search. Install and set up OAuth:

```bash
# Install
npm install -g @apify/mcpc

# OAuth login (opens browser)
mcpc mcp.apify.com login

# Create persistent session
mcpc mcp.apify.com connect @apify
```

**Verify:** Run `mcpc @apify tools-list` and confirm it returns Apify MCP tools without requiring manual token headers.

## Part C: Update CLAUDE.md MCP Section

Update the MCP Servers section in CLAUDE.md to document both integration methods:

```markdown
## MCP Servers

Apify MCP server is configured in `.mcp.json` (native integration) and via `mcpc` CLI (scripted usage).

Native MCP tools: `search-apify-docs`, `fetch-apify-docs`

CLI usage (for skills and scripts):
- `mcpc @apify tools-list` — list available tools
- `mcpc @apify tools-call <tool> arg:=value` — call a tool
- `mcpc --json @apify tools-call ...` — JSON output for scripting
```
