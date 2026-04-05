# TLDR

Review all changes from prior steps against the original user intent. Run tests. Autofix any issues.

**References:**
- `../user-entry-log/entry-initial-prompt.md` — original request

## Instructions

### 1. Capture all changes
```bash
git diff
git status
```

### 2. Verify each requirement

| Requirement | Covered by | Verify |
|---|---|---|
| Test npm `contextractor` on idnes.cz pages | step-test-npm | Output files exist with content |
| Use `/Users/miroslavsekera/r/testing-contextractor/` | step-test-npm | Test folder used correctly |
| Fix and re-publish npm if needed | step-fix-and-republish-npm | npm package works, version published |
| Commit and push everything | step-commit-push | Clean git status, pushed to remote |

### 3. Run tests
```bash
cd /Users/miroslavsekera/r/contextractor
pytest
```

### 4. Check for issues
- No secrets or credentials in committed code
- No test artifacts committed (output folders, storage dirs)
- README/docs updated if behavior changed

### 5. Autofix
Fix any issues found above. Re-run failing tests until green. Commit fixes.
