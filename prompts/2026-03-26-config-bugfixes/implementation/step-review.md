# Step 5: Review, Test, Autofix

## TLDR

Final review step. Verify all bugfixes from Steps 1-4 against requirements, run tests, and automatically fix issues.

## Process

### 1. Capture Full Diff

```bash
git diff main
```

Review every changed file against its corresponding step.

### 2. Verify Against Requirements

Read `prompts/2026-03-26-config-review/user-entry-log/entry-initial-prompt.md` and `entry-qa-scope.md`:

- [ ] `wait_until` correctly wired to PlaywrightCrawler via `goto_options`
- [ ] Default `wait_until` changed from `networkidle` to `load` everywhere
- [ ] `proxy_rotation` mapped to Crawlee ProxyConfiguration modes
- [ ] `crawl_depth` manual tracking removed, Crawlee native `max_crawl_depth` used
- [ ] npm `homepage` changed to `https://www.contextractor.com/`
- [ ] All docs updated with new `wait_until` default
- [ ] Apify Actor also fixed for `wait_until` if same bug exists

### 3. Run Tests

```bash
pytest -v --ignore=tools/
```

Verify no regressions.

### 4. Config Consistency Check

Compare the `wait_until` default across:
- `apps/contextractor-standalone/src/contextractor_cli/config.py`
- `apps/contextractor-apify/.actor/input_schema.json`
- All README files and site help docs

### 5. Autofix

Automatically fix any issues found:
- Missing wiring → add it
- Inconsistent defaults → align them
- Test failures → fix code
- Doc inconsistencies → update docs

### 6. Commit and push both repos
