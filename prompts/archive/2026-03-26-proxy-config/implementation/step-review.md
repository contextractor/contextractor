# Step 7: Review, Test, Autofix

## TLDR

Final review step. Verify all code changes from Steps 1-6 against original requirements, run tests, and automatically fix any issues found.

## Process

### 1. Capture Full Diff

```bash
git diff main
```

Review every changed file against its corresponding step.

### 2. Verify Against Original Requirements

Read `user-entry-log/entry-initial-prompt.md` and check each requirement:

- [ ] YAML and JSON config supported (JSON only in docs)
- [ ] Proxy configuration added to CLI and config file
- [ ] All configs consistent across Apify Actor, standalone CLI, and GUI site
- [ ] All docs updated: README.md (root), README.md (apify), README.md (npm), site help pages
- [ ] Docker, npm CLI, Apify Actor all working locally and on platform
- [ ] GUI site config consistent with apps
- [ ] contextractor-engine imported at tools/package.json
- [ ] Free proxies used for testing
- [ ] Everything published: Docker, Apify Actor, npm

### 3. Verify QA Decisions

Read `user-entry-log/entry-qa-scope.md`:

- [ ] Full parity implemented (not just proxy)
- [ ] GUI site included and updated
- [ ] Publish step completed

### 4. Run Tests

```bash
pytest -v
```

Verify no regressions.

### 5. Config Consistency Check

Compare config options across:
- `apps/contextractor-apify/.actor/input_schema.json`
- `apps/contextractor-standalone/src/contextractor_cli/main.py`
- `apps/contextractor-standalone/npm/index.js`
- Site help docs

Every option in the Apify Actor schema must have a corresponding CLI flag, npm wrapper mapping, and documentation entry.

### 6. Autofix

Automatically fix any issues found:
- Missing CLI flags → add them
- Missing npm wrapper mappings → add them
- Doc inconsistencies → update docs
- Test failures → fix code
- Missing config file support → add to from_dict/merge
