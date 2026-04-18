# Step: Review and Verify All Changes

**TLDR:** Review all changes from steps 1-4 against user intent, run tests, fix any issues found.

**References:**
- `user-entry-log/entry-initial-prompt.md` — original user prompt
- `user-entry-log/entry-qa-mcp-auth.md` — MCP auth decision
- `user-entry-log/entry-qa-line-target.md` — line target decision

## Review Process

### 1. Capture changes
Run `git diff` to see all modifications.

### 2. Verify each step

**Step 1 (CLAUDE.md):**
- Count lines: must be under 100
- Verify removed sections: "What are Apify Actors?", "Core Concepts", "Do", "Don't", `generatedBy` paragraph
- Verify compressed sections: Commands (no pip), Testing (no code example)
- Verify kept sections: Safety and Permissions, Project Structure, Active Skills, MCP Servers, Resources

**Step 2 (python-pro agent):**
- Frontmatter: `model: claude-opus-4-7` (not opus)
- Body: ~30 lines, no generic dumps
- Covers: stack, async, testing, type hints, project context

**Step 3 (.mcp.json + mcpc):**
- `.mcp.json` exists at repo root with valid JSON
- Native MCP connection tested (if auth failed, fallback applied)
- `mcpc` installed globally (`which mcpc` succeeds)
- OAuth session created (`mcpc @apify tools-list` works)
- CLAUDE.md MCP section documents both native and CLI usage

**Step 4 (local-tests command):**
- No `pip install` references
- Uses `uv run pytest` from workspace root
- `tools/generated-unit-tests` block unchanged

### 3. Run tests
```bash
cd /Users/miroslavsekera/r/contextractor
uv run pytest -v
```

### 4. Verify Q&A decisions
- MCP auth: verified or fallback applied per `entry-qa-mcp-auth.md`
- Line target: CLAUDE.md under 100 lines per `entry-qa-line-target.md`

### 5. Fix issues
Automatically fix any discovered issues: line count overruns, missing sections, test failures, deviations from user intent.
