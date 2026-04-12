# Step 4 (Final): Review, Test, Autofix

## TLDR

Review all changes from steps 1-3 against the original user intent. Run tests. Verify consistency across all ecosystems. Automatically fix any issues found.

## References

- Original prompt: `../user-entry-log/entry-initial-prompt.md`
- Q&A — PyPI locations: `../user-entry-log/entry-qa-pypi-locations.md`
- Q&A — Config case scope: `../user-entry-log/entry-qa-config-case-scope.md`
- Research — PyPI status: `../docs-pypi-and-config-case-notes/pypi-link-status.md`
- Research — Case conventions: `../docs-pypi-and-config-case-notes/config-case-conventions.md`
- Research — Sync commands: `../docs-pypi-and-config-case-notes/sync-commands.md`

## Review Checklist

### 1. Capture full diff

Run `git diff` to see all changes made by prior steps.

### 2. Verify each requirement from `entry-initial-prompt.md`

- [ ] PyPI link added to CLI help, Apify Actor description, npm package.json
- [ ] No snake_case enum values in npm-facing config docs (`per_request` → `perRequest`, `until_failure` → `untilFailure`)
- [ ] npm wrapper (`index.js`) accepts camelCase values and converts to snake_case for CLI
- [ ] Python-side docs and code unchanged (still use snake_case)
- [ ] `/sync/docs` ran successfully
- [ ] `/sync/gui` ran successfully
- [ ] Changes committed and pushed

### 3. Verify Q&A decisions

From `entry-qa-pypi-locations.md`:
- [ ] CLI --help shows PyPI link
- [ ] Apify Actor description has PyPI link
- [ ] npm package.json has PyPI link

From `entry-qa-config-case-scope.md`:
- [ ] npm docs use camelCase enum values
- [ ] Python docs still use snake_case
- [ ] index.js converts camelCase → snake_case

### 4. Run tests

```bash
pytest -v
```

Verify no test regressions. If tests reference enum values, confirm they still use the correct convention for their ecosystem.

### 5. Consistency checks

- Grep for `per_request` in npm README — should not appear (replaced by `perRequest`)
- Grep for `perRequest` in Python CLI help — should not appear (Python keeps snake_case)
- Verify root README and npm README are identical (sync rule)
- Check that `index.js` handles both camelCase and snake_case inputs gracefully

### 6. Autofix

Automatically fix all issues discovered above:
- Code quality problems
- Test failures
- Missing edge cases
- Deviations from user intent
- Inconsistencies between docs and code

After fixing, re-run tests and re-verify. Amend the commit if needed.
