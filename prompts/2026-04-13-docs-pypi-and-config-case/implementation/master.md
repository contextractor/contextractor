# Master: Add PyPI Link Everywhere + Fix Config Case Conventions

## TLDR

Add the PyPI package link (`https://pypi.org/project/contextractor/`) to CLI help, Apify Actor description, and npm package.json. Accept both `snake_case` and `camelCase` for all config keys and enum values in JSON/YAML configs and CLI. Fix proxy rotation enum values in npm-facing docs to use camelCase. Run sync commands, commit, push.

## Shared Context

- PyPI URL: `https://pypi.org/project/contextractor/`
- npm wrapper: `apps/contextractor-standalone/npm/index.js`
- Python CLI: `apps/contextractor-standalone/src/contextractor_cli/main.py`
- Config: `apps/contextractor-standalone/src/contextractor_cli/config.py`
- Apify schema: `apps/contextractor-apify/.actor/input_schema.json`
- Apify actor config: `apps/contextractor-apify/.actor/actor.json`
- Research notes: `../docs-pypi-and-config-case-notes/`
- User Q&A: `../user-entry-log/entry-qa-*.md`

## Steps

1. **[step-pypi-links.md](step-pypi-links.md)** — Add PyPI link to CLI help, Apify Actor description, npm package.json
2. **[step-config-case.md](step-config-case.md)** — Accept both snake_case and camelCase in all configs; fix npm docs to show camelCase; centralize normalization in engine utils
3. **[step-sync-and-ship.md](step-sync-and-ship.md)** — Run `/sync/docs` and `/sync/gui`, then commit and push
4. **[step-review.md](step-review.md)** — Review all changes, run tests, verify consistency, autofix issues
