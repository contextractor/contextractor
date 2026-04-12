# Config Case Conventions Across Ecosystems

## Current State

| Ecosystem | Keys | Enum Values | Example |
|-----------|------|-------------|---------|
| Python CLI flags | kebab-case | snake_case | `--proxy-rotation per_request` |
| JSON config | dot-path | snake_case | `"rotation": "per_request"` |
| Apify input_schema | camelCase | UPPER_SNAKE | `"proxyRotation": "PER_REQUEST"` |
| npm wrapper (JS API) | camelCase | snake_case | `proxyRotation: "per_request"` |

## Problems

1. The npm package at npmjs.com/package/contextractor documents proxy rotation enum values in snake_case (`per_request`, `until_failure`), which is a Python convention. For an npm package, these should be camelCase (`perRequest`, `untilFailure`).

2. The CLI config parser (`from_dict`) only accepts camelCase keys. Users writing JSON/YAML configs in snake_case (e.g., `max_pages` instead of `maxPages`) get silently ignored values. Both conventions must be accepted.

## Affected Files

**Documentation (snake_case values appear):**
- `README.md` lines 53, 146
- `apps/contextractor-standalone/README.md` lines 53, 146
- `apps/contextractor-standalone/npm/README.md` lines 53, 146

**Python source (canonical snake_case):**
- `apps/contextractor-standalone/src/contextractor_cli/main.py` line 59
- `apps/contextractor-standalone/src/contextractor_cli/config.py` lines 33, 95, 110
- `apps/contextractor-standalone/src/contextractor_cli/crawler.py` lines 107-110

**npm wrapper:**
- `apps/contextractor-standalone/npm/index.js` line 133 — passes value directly to CLI

**Tests:**
- `apps/contextractor-standalone/tests/test_config.py` lines 84, 89
- `apps/contextractor-standalone/tests/test_cli.py` lines 148, 153

## Key Decisions

1. If npm docs show `perRequest`, the npm wrapper (`index.js`) must convert camelCase values to snake_case before passing to the Python CLI. The Python CLI will continue accepting snake_case internally.

2. Both `snake_case` and `camelCase` must be accepted for ALL config keys and enum values in JSON/YAML configs and CLI. Normalization happens centrally via `normalize_config_keys` in `packages/contextractor_engine/src/contextractor_engine/utils.py`.

3. Apify input schema stays as-is (own conventions, too complex to dual-case).

4. Do not extensively document dual-case — it just works silently.
