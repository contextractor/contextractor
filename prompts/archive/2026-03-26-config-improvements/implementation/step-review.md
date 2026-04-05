# Step 6: Review, Test, Autofix

## TLDR

Final review step. Verify all improvements from Steps 1-5, run tests, and automatically fix issues.

## Process

### 1. Capture Full Diff

```bash
git diff main
```

Review every changed file against its corresponding step.

### 2. Verify Against Requirements

Read `prompts/2026-03-26-config-review/user-entry-log/entry-initial-prompt.md` and `entry-qa-scope.md`:

- [ ] Stealth Chromium flag added (`--disable-blink-features=AutomationControlled`)
- [ ] Tiered proxy support via `proxy.tiered` config key
- [ ] `--user-agent` CLI option added and wired
- [ ] Test coverage for all new config options (unit tests pass)
- [ ] JSONL output mode works end-to-end
- [ ] All docs updated for new options
- [ ] Changes consistent across standalone CLI, Apify Actor, npm wrapper

### 3. Run Tests

```bash
pytest -v --ignore=tools/
```

All new tests must pass. Zero regressions.

### 4. Config Consistency Check

Compare config options across:
- `apps/contextractor-apify/.actor/input_schema.json`
- `apps/contextractor-standalone/src/contextractor_cli/main.py`
- `apps/contextractor-standalone/npm/index.js`
- All documentation files

### 5. Autofix

Automatically fix any issues found.

### 6. Commit and push both repos
