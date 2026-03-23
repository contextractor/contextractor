# Step 2: Add CLI flags for all settings

## TLDR
Restructure the typer command so URLs are positional args, config file is `--config`, and all CrawlConfig + TrafilaturaConfig fields have CLI flag equivalents. `contextractor https://example.com` works with zero config.

## Context
- See `cli-settings-notes/current-settings-inventory.md` for the full settings list
- See `user-entry-log/entry-qa-goal-and-scope.md` — user confirmed CLI-first, config optional
- Current code: `apps/contextractor-standalone/src/contextractor_cli/main.py`

## Changes to `main.py`

### Command signature

```
contextractor [OPTIONS] [URLS...]
```

- `URLS` — variadic positional args (0 or more URLs)
- `--config` / `-c` — optional path to YAML/JSON config file

### New flags to add

**CrawlConfig fields:**
- `--max-pages` (int, default 0)
- `--crawl-depth` (int, default 0)
- `--headless / --no-headless` (bool, default True)

**TrafilaturaConfig fields (currently config-file-only):**
- `--fast` (bool flag)
- `--include-tables / --no-tables` (bool, default True)
- `--include-images` (bool flag)
- `--include-formatting / --no-formatting` (bool, default True)
- `--deduplicate` (bool flag)
- `--target-language` (str, e.g. "en")
- `--with-metadata / --no-metadata` (bool, default True)
- `--prune-xpath` (str, can be repeated)

**Keep existing flags:**
- `--precision`, `--recall`, `--no-links`, `--no-comments`
- `--verbose` / `-v`, `--output-dir` / `-o`, `--format` / `-f`

### Logic flow

1. Start with default CrawlConfig
2. If `--config` provided, load file and merge into config
3. Collect all CLI args that are not None into a dict
4. Merge CLI dict into config (CLI wins over file)
5. If URLs provided as positional args, they extend/override config urls
6. Validate: at least one URL required (from either source)

### No-args behavior
- `contextractor` with no args and no config → show help (keep `no_args_is_help=True`)
- But `contextractor https://example.com` works immediately

## Constraints
- Use `Optional[X]` for all flags so None = "not specified" (distinguishable from explicit False)
- For bool pairs like `--headless / --no-headless`, use typer's bool flag pair syntax
- Keep the command name as `extract` (typer default command)
