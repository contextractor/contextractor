# Extraction Key Locations

All places where `extraction` is used as a config key (to be renamed to `trafilaturaConfig`):

## Code

- `apps/contextractor-standalone/src/contextractor_cli/config.py:29` — `extraction: TrafilaturaConfig` field name in `CrawlConfig` dataclass
- `apps/contextractor-standalone/src/contextractor_cli/config.py:90` — `data.get("extraction")` in `from_dict()`
- `apps/contextractor-standalone/src/contextractor_cli/config.py:107` — `extraction=extraction` in constructor call
- `apps/contextractor-standalone/src/contextractor_cli/config.py:147-159` — `merge()` method routes extraction fields, references `{"extraction"}` set
- `apps/contextractor-standalone/src/contextractor_cli/crawler.py:96` — `config.extraction` access

## Docs

- `README.md:119` — `"extraction": {` in config file example
- `README.md:195` — "under the `extraction` key in config files"
- `apps/contextractor-standalone/npm/README.md` — same as root README (identical)
- `docs/spec/functional-spec.md:71,127` — `extraction | object` in config table, `trafilaturaConfig` key in Apify section
- `docs/spec/tech-spec.md` — references `extraction` key

## Test Suites

- Platform test runner settings files use `extraction` key

## Apify Actor (DO NOT MODIFY)

- `apps/contextractor-apify/.actor/input_schema.json:105` — `trafilaturaConfig`
- `apps/contextractor-apify/src/config.py:37` — `actor_input.get('trafilaturaConfig', {})`
