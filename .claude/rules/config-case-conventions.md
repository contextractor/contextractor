# Config Case Conventions

All config keys and enum values silently accept both `camelCase` and `snake_case`. Normalization is centralized in `packages/contextractor_engine/src/contextractor_engine/utils.py` (`to_snake_case`, `normalize_config_keys`).

## Documentation Conventions

- **npm-facing docs** (root `README.md`, `npm/README.md`): use `camelCase` for config keys and enum values (`perRequest`, `untilFailure`, `maxPages`)
- **Python-facing docs** (standalone `README.md`, CLI `--help`): use `snake_case` (`per_request`, `until_failure`, `max_pages`)
- **Apify docs** (`apps/contextractor-apify/`): use Apify's own conventions (`PER_REQUEST`, `UPPER_SNAKE`)
- **Config file examples** in all docs: use `camelCase` keys (JSON convention)

## Code Conventions

- Internal Python code always uses `snake_case`
- The `from_dict()` method normalizes all incoming keys to `snake_case` via `normalize_config_keys()`
- Proxy rotation values go through `to_snake_case()` to accept both `perRequest` and `per_request`
- npm `index.js` converts camelCase values to snake_case before passing to Python CLI
