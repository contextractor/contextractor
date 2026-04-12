# Step 2: Universal Case Acceptance + Fix npm Docs

## TLDR

Accept both `snake_case` and `camelCase` for ALL config keys and enum values across JSON configs, YAML configs, and CLI switches (except Apify input schema — leave that as-is). Centralize the case normalization in one place. Fix npm-facing docs to show camelCase conventions.

See: `../docs-pypi-and-config-case-notes/config-case-conventions.md`, `../user-entry-log/entry-qa-config-case-scope.md`

## Existing Infrastructure

`packages/contextractor_engine/src/contextractor_engine/utils.py` already has:
- `to_snake_case(key)` — converts camelCase → snake_case
- `to_camel_case(key)` — converts snake_case → camelCase
- `normalize_config_keys(config)` — normalizes a dict's keys to snake_case

This is the foundation. Extend and reuse it.

## Tasks

### 1. Add value normalization to the engine utils

File: `packages/contextractor_engine/src/contextractor_engine/utils.py`

Add a function to normalize enum/string values (not just keys). For example, proxy rotation values like `perRequest` → `per_request`, `untilFailure` → `until_failure`. This should be a general-purpose `normalize_value` or similar that converts camelCase string values to snake_case.

### 2. Update CLI config parser to accept both cases

File: `apps/contextractor-standalone/src/contextractor_cli/config.py`

The `from_dict` method currently hardcodes camelCase key lookups (e.g., `data.get("maxPages", 0)`). Change it to:

1. Normalize the incoming dict keys to snake_case first (using `normalize_config_keys`)
2. Then use snake_case lookups throughout

This way, BOTH of these work:
```json
{"maxPages": 10, "outputDir": "./out"}
{"max_pages": 10, "output_dir": "./out"}
```

Also normalize string enum values like proxy rotation:
```json
{"proxy": {"rotation": "perRequest"}}
{"proxy": {"rotation": "per_request"}}
```

Both must resolve to `per_request` internally.

**Important:** Handle nested dicts too (e.g., `proxy`, `trafilaturaConfig`/`trafilatura_config`). The `trafilaturaConfig` key itself should also be accepted as `trafilatura_config`.

### 3. Update the `merge()` method

File: `apps/contextractor-standalone/src/contextractor_cli/config.py`

The `merge()` method receives CLI overrides (already snake_case from typer). No changes needed unless there are edge cases. Verify it works with snake_case keys.

### 4. Update npm wrapper to accept both cases

File: `apps/contextractor-standalone/npm/index.js`

The npm wrapper passes config values to the Python CLI. Add conversion so both camelCase and snake_case enum values are accepted. Convert camelCase values to snake_case before passing to CLI args. A simple map is fine:

```
perRequest → per_request
untilFailure → until_failure
```

### 5. Update npm-facing docs to show camelCase

Files:
- `apps/contextractor-standalone/npm/README.md`
- `README.md` (synced with npm README)

Change proxy rotation enum values from `per_request`/`until_failure` to `perRequest`/`untilFailure` in:
- CLI options sections
- Config reference tables
- JSON config examples

### 6. Do NOT change

- **Apify input schema** (`apps/contextractor-apify/.actor/input_schema.json`) — uses its own conventions (`PER_REQUEST`, `UPPER_SNAKE`), too complicated to dual-case
- **Apify config** (`apps/contextractor-apify/src/config.py`) — receives input from platform schema, keeps camelCase lookups
- **Python CLI help text** (`main.py`) — keeps snake_case as the documented Python convention
- **Docs verbosity** — do not extensively document the dual-case acceptance; just make it work silently

### 7. Add tests for dual-case config acceptance

File: `apps/contextractor-standalone/tests/test_config.py`

Add test cases verifying that `from_dict` accepts both:
- camelCase keys (`maxPages`, `outputDir`, `crawlDepth`)
- snake_case keys (`max_pages`, `output_dir`, `crawl_depth`)
- Mixed case keys in the same config
- camelCase enum values (`perRequest`, `untilFailure`)
- snake_case enum values (`per_request`, `until_failure`)
