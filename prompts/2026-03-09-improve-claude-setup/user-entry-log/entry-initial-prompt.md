# Improve Claude Code Setup

Improve the Claude Code configuration at `/Users/miroslavsekera/r/contextractor/`. Make all changes. Do not ask for confirmation.

---

## 1. Trim CLAUDE.md

`/Users/miroslavsekera/r/contextractor/CLAUDE.md` is too long and contains generic content already covered by skills. Rewrite it in-place:

**Remove:**
- "What are Apify Actors?" section — covered by `apify-actor-development` skill
- "Core Concepts" bullet list — same reason
- The generic Do/Don't lists (keep only project-specific items not found in any skill)

**Keep:**
- "What is this Actor for?" line pointing to README.md
- Commands block
- Safety and Permissions section
- Project Structure section
- Active Skills section
- Testing section
- MCP Servers section
- Resources section

**Target: under 100 lines.**

---

## 2. Slim down python-pro agent

`/Users/miroslavsekera/r/contextractor/.claude/agents/dev/python-pro.md` body is ~200 lines of generic Python knowledge. Replace the body (keep frontmatter) with a ~30-line focused version covering only:

- Stack: Python 3.12, uv, ruff (not black/flake8), pyproject.toml, Pydantic v2
- Async: prefer `asyncio.TaskGroup` over `asyncio.gather` (Python 3.11+)
- Testing: pytest + pytest-asyncio; AAA pattern; `conftest.py` for fixtures
- Type hints: `str | None` over `Optional[str]`; `from __future__ import annotations`
- This project: uv workspace at `/Users/miroslavsekera/r/contextractor/`; run tests with `uv run pytest`

Also change `model: opus` → `model: sonnet` in frontmatter. Opus is unnecessary for routine Python tasks.

---

## 3. Add .mcp.json

Create `/Users/miroslavsekera/r/contextractor/.mcp.json`. CLAUDE.md already references Apify MCP tools but the config file does not exist at the repo root:

```json
{
  "mcpServers": {
    "apify": {
      "url": "https://mcp.apify.com"
    }
  }
}
```

---

## 4. Fix local-tests command

`/Users/miroslavsekera/r/contextractor/.claude/commands/local-tests/prompt.md` has the `apps/contextractor` block using `pip install -r requirements.txt`, but the project uses uv workspace (no requirements.txt exists).

Replace the `apps/contextractor` block with:

```markdown
### 2. Main Actor (`apps/contextractor`)

```bash
cd /Users/miroslavsekera/r/contextractor
uv run pytest apps/contextractor/tests/ -v 2>/dev/null || echo "No tests found in apps/contextractor"
```
```

Keep the `tools/generated-unit-tests` block as-is — it works correctly.
