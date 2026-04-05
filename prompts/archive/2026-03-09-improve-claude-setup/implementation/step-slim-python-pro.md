# Step: Slim Down python-pro Agent

**TLDR:** Replace the ~120-line generic body of `/Users/miroslavsekera/r/contextractor/.claude/agents/dev/python-pro.md` with a focused ~30-line version. Change model from opus to sonnet.

**References:**
- `improve-claude-setup-notes/python-future-annotations.md` — confirms `from __future__ import annotations` is still valid

## Changes

### Frontmatter
Change `model: opus` → `model: sonnet`

### Body
Replace everything below the frontmatter `---` with a focused version covering only:

1. **Stack:** Python 3.12+, uv (package manager), ruff (linter+formatter, replaces black/flake8/isort), pyproject.toml, Pydantic v2
2. **Async:** Prefer `asyncio.TaskGroup` for structured concurrency (Python 3.11+). `asyncio.gather` is still valid for simple fan-out returning values.
3. **Testing:** pytest + pytest-asyncio. AAA pattern (Arrange/Act/Assert). Shared fixtures in `conftest.py`.
4. **Type hints:** `str | None` not `Optional[str]`. Use `from __future__ import annotations`.
5. **This project:** uv workspace at project root. Run tests with `uv run pytest`. Packages in `packages/`, apps in `apps/`.

Target: ~30 lines of body text. No code examples. No generic Python knowledge dumps.
