# Step 4: Add and update tests

## TLDR
Test the new CLI-first interface: zero-config with URL args, config file via `--config`, CLI overrides config file values, error on missing URLs.

## Context
- See `user-entry-log/entry-qa-goal-and-scope.md` — confirmed implementation scope
- Tests live in `apps/contextractor-standalone/tests/` or `apps/contextractor-standalone/src/tests/`

## Test cases

### CrawlConfig tests
1. Default CrawlConfig has sensible defaults (no file needed)
2. `merge()` overlays non-None values correctly
3. `merge()` routes extraction sub-keys to TrafilaturaConfig
4. `from_file()` still works (backward compat)
5. File values + merge = correct precedence

### CLI integration tests (typer CliRunner)
1. `contextractor https://example.com` — works with just a URL
2. `contextractor https://a.com https://b.com` — multiple URLs
3. `contextractor --config test.yaml` — config file mode
4. `contextractor --config test.yaml https://extra.com` — URLs extend config
5. `contextractor --config test.yaml --precision --max-pages 10` — CLI overrides config
6. `contextractor` (no args) — shows help
7. `contextractor --max-pages 5` (no URLs) — error: no URLs
8. `contextractor https://example.com --format json --output-dir ./out` — format and dir flags work

### NPM wrapper tests (if test infrastructure exists)
- Verify flag translation for new options
- Verify URL detection vs config path detection

## Constraints
- Mock `run_crawl` in CLI tests — don't make real HTTP requests
- Use typer's `CliRunner` for integration tests
- Check existing test structure before adding new files
