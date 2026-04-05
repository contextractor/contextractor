# Step: Trim CLAUDE.md

**TLDR:** Rewrite `/Users/miroslavsekera/r/contextractor/CLAUDE.md` from 170 lines to under 100 by removing generic Apify content (covered by `apify-actor-development` skill) and compressing remaining sections.

**References:**
- `improve-claude-setup-notes/claude-md-line-budget.md` — detailed line budget analysis
- `user-entry-log/entry-qa-line-target.md` — user confirmed "compress all to hit <100"

## Changes

### Remove entirely
- "What are Apify Actors?" section (lines 5-8)
- "Core Concepts" section (lines 13-19)
- "Do" list (lines 21-38)
- "Don't" list (lines 40-50)
- The `generatedBy` instruction paragraph at line 3

### Compress
- **Commands section:** Remove `pip install -r requirements.txt` and `pip freeze > requirements.txt` lines. Project uses uv workspace.
- **Testing section:** Remove the `### Writing Tests` subsection with its code example. Keep `### Commands` and `### Test Structure` as compact bullet lists.

### Keep unchanged
- "What is this Actor for?" → README.md
- Safety and Permissions (all of it — project-critical)
- Project Structure tree
- Active Skills
- MCP Servers (will be rewritten by step-add-mcp-json.md — just keep the section header for now)
- Resources

### Verify
Count final lines. Must be under 100.
