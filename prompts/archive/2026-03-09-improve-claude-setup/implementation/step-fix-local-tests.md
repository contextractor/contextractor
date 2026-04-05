# Step: Fix local-tests Command

**TLDR:** Fix the `apps/contextractor` test block in `/Users/miroslavsekera/r/contextractor/.claude/commands/local-tests/prompt.md` to use uv instead of pip.

## Changes

In `/Users/miroslavsekera/r/contextractor/.claude/commands/local-tests/prompt.md`, replace the `### 2. Main Actor` block:

**Old:**
```markdown
### 2. Main Actor (`apps/contextractor`)

```bash
cd /Users/miroslavsekera/r/contextractor/apps/contextractor
# Install dependencies
pip install -r requirements.txt
# Run tests if they exist
pytest -v tests/ 2>/dev/null || echo "No tests found in apps/contextractor"
```
```

**New:**
```markdown
### 2. Main Actor (`apps/contextractor`)

```bash
cd /Users/miroslavsekera/r/contextractor
uv run pytest apps/contextractor/tests/ -v 2>/dev/null || echo "No tests found in apps/contextractor"
```
```

Keep the `tools/generated-unit-tests` block unchanged.
