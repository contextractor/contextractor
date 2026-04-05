# mcpc CLI Setup

Source: https://blog.apify.com/introducing-mcpc-universal-mcp-cli-client/

## What it is
`mcpc` is Apify's universal MCP CLI client. It lets AI coding agents call MCP server tools via shell commands. Already used by 9 skills in this project (apify-ultimate-scraper, apify-lead-generation, etc.) via `--header "Authorization: Bearer $APIFY_TOKEN"` pattern.

## Install
```bash
npm install -g @apify/mcpc
```

## Modern OAuth auth (replaces manual Bearer token)
```bash
mcpc mcp.apify.com login          # Opens browser for OAuth
mcpc mcp.apify.com connect @apify # Creates persistent session named @apify
```
OAuth tokens stored in OS keychain, reused across commands.

## Usage after OAuth
```bash
mcpc @apify tools-list                           # List tools
mcpc @apify tools-call search-actors keywords:="web scraper"  # Call tool
mcpc --json @apify tools-call ...                # JSON output for scripting
```

## Skills still using old pattern
All 9 apify-* skills use the verbose pattern:
```bash
export $(grep APIFY_TOKEN .env | xargs) && mcpc --json mcp.apify.com --header "Authorization: Bearer $APIFY_TOKEN" tools-call ...
```
After OAuth setup, these could be simplified to `mcpc --json @apify tools-call ...` but that's a separate task.

## Relationship to .mcp.json
- `.mcp.json` = Claude Code's native MCP integration (tools appear as MCP tools in Claude)
- `mcpc` = CLI tool Claude calls via Bash (used by skills for dynamic schema fetching)
- Both can coexist. `.mcp.json` is for native tool integration; mcpc is for scripted/skill usage.
