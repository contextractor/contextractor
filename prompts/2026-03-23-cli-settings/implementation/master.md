# CLI-First with Optional Config File

## TLDR
Make contextractor CLI work without a config file by adding CLI flags for all settings (URLs as positional args, extraction options as flags). Config file becomes optional. Zero-config `contextractor https://example.com` must work. Touches `main.py`, `config.py`, npm wrapper `index.js`, and tests.

## Research context
- See `cli-settings-notes/current-settings-inventory.md` — full inventory of 30 settings
- See `cli-settings-notes/cli-only-vs-config-analysis.md` — why CLI-first + optional config is the right pattern
- See `user-entry-log/entry-qa-goal-and-scope.md` — confirmed: CLI-first, config optional, with implementation

## Precedence order (lowest → highest)
1. Built-in defaults (CrawlConfig dataclass defaults)
2. Config file (if `--config` provided or auto-discovered)
3. CLI arguments (always wins)

## Steps

1. **step-refactor-config.md** — Make CrawlConfig constructable without a file. Add `from_cli_args()` class method.
2. **step-add-cli-flags.md** — Add typer flags for all CrawlConfig + TrafilaturaConfig settings. Make URLs a positional variadic arg. Make config file an optional `--config` flag.
3. **step-update-npm-wrapper.md** — Update npm `index.js` to support new CLI flags and pass URLs as positional args.
4. **step-tests.md** — Add/update tests for: CLI-only invocation, config file invocation, CLI overrides config, missing URLs error.
5. **step-review.md** — Review all changes against requirements, run tests, autofix issues.
