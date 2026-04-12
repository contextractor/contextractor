# Step 2: Fix Config Case Conventions for npm Package

## TLDR

Change proxy rotation enum values from snake_case (`per_request`, `until_failure`) to camelCase (`perRequest`, `untilFailure`) in all npm/JS-facing docs. Update `index.js` to accept camelCase values and convert to snake_case for the Python CLI. Python-side docs and code keep snake_case.

See: `../docs-pypi-and-config-case-notes/config-case-conventions.md`, `../user-entry-log/entry-qa-config-case-scope.md`

## Tasks

### 1. Update npm wrapper code (`index.js`)

File: `apps/contextractor-standalone/npm/index.js`

Around line 133 where `proxyRotation` is passed to CLI args, add a conversion map:

```
camelCase → snake_case
perRequest → per_request
untilFailure → until_failure
recommended → recommended (unchanged)
```

Accept both camelCase and snake_case for backwards compatibility. Convert camelCase to snake_case before passing to CLI.

### 2. Update npm README

File: `apps/contextractor-standalone/npm/README.md`

- Line ~53: Change `per_request, until_failure` to `perRequest, untilFailure` in CLI options section
- Line ~146: Change enum values in config reference table
- Any JSON config examples showing rotation values

### 3. Update root README (npm-facing sections only)

File: `README.md`

Same changes as npm README — these should be identical per sync rules. Change rotation value references from snake_case to camelCase in:
- CLI options section
- Config reference table

**Do NOT change:**
- Python CLI help text in `main.py` (keeps snake_case)
- Python config in `config.py` (keeps snake_case)
- Python tests (keep snake_case)
- Apify input_schema.json (uses UPPER_SNAKE: `PER_REQUEST`, `UNTIL_FAILURE` — different convention)

### 4. Verify JSON config file handling

File: `apps/contextractor-standalone/src/contextractor_cli/config.py`

Check if the JSON config parser (`normalize_config_keys` or equivalent) needs to handle camelCase rotation values. If a user writes `"rotation": "perRequest"` in their JSON config, the Python side should accept it. Add conversion if needed in config parsing.
