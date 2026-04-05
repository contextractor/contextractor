# Step 5: Review, test, and autofix

## TLDR
Final review of all changes from steps 1-4. Run tests, verify against requirements, fix any issues.

## Review checklist

### 1. Run `git diff` to capture all changes

### 2. Verify against user requirements
- See `user-entry-log/entry-initial-prompt.md` — original request
- See `user-entry-log/entry-qa-goal-and-scope.md` — confirmed: CLI-first, config optional
- Verify: `contextractor https://example.com` works with zero config
- Verify: `contextractor --config file.yaml` still works
- Verify: CLI flags override config file values
- Verify: all 30 settings have CLI flag equivalents

### 3. Check each step's implementation
- **step-refactor-config.md**: CrawlConfig works without file, merge() method exists and handles extraction sub-keys
- **step-add-cli-flags.md**: All flags added, URLs are positional, --config is optional, precedence is correct
- **step-update-npm-wrapper.md**: New flags translated, backward compat for file path first arg
- **step-tests.md**: All test cases pass, no real HTTP requests

### 4. Run tests
```bash
cd apps/contextractor-standalone && pytest -v
```

### 5. Check for issues
- Type errors or missing imports
- Typer flag conflicts (duplicate short flags)
- Default value mismatches between CrawlConfig and CLI flags
- Missing None checks in merge logic
- npm wrapper edge cases

### 6. Autofix all discovered issues
- Fix code quality problems
- Fix test failures
- Fix missing edge cases
- Fix any deviations from user intent

### 7. Run tests again after fixes
```bash
cd apps/contextractor-standalone && pytest -v
```
