# Codebase Impact Analysis

## Files requiring changes

### Python CLI (apps/contextractor-standalone/)
- `src/contextractor_cli/main.py:144-172` — Remove 7 boolean flag params, add `--save` string param
- `src/contextractor_cli/main.py:282-288` — Update cli_overrides mapping to translate `--save` list to config
- `src/contextractor_cli/config.py:63-70` — Replace 7 boolean fields with `save: list[str]` field (default `["markdown"]`)
- `src/contextractor_cli/config.py:144-151` — Update `from_dict()` to parse `save` list, remove old boolean key handling
- `src/contextractor_cli/crawler.py:231-293` — Replace `if config.save_markdown:` checks with `if "markdown" in config.save:`
- `tests/test_cli.py:208-247` — Rewrite output toggle tests
- `tests/test_config.py:180-225` — Rewrite config parsing tests

### npm CLI (apps/contextractor-standalone/npm/)
- `index.js:135-183` — Replace individual `saveMarkdown`, `saveJson` etc. options with `save: string[]`, map to `--save` flag
- `cli.js` — No changes (passthrough)
- Type definitions / README — Update JS API docs

### Apify Actor (apps/contextractor-apify/)
- `src/config.py:30-37` — Update mapping: translate Apify long boolean names → `save` list
- `.actor/input_schema.json` — NO changes (user requirement)
- `src/handler.py:185-201` — Update to use `save` list instead of individual config keys

### Shared engine (packages/contextractor_engine/)
- `extractor.py` — NO changes (already uses per-call `output_format` string)
- `models.py` — NO changes

### Documentation (all README.md files)
- Root README, standalone README, npm README, Apify README — Update output format sections

## Key mapping: format name → internal output_format string → file extension

| --save name | trafilatura output_format | file extension |
|-------------|--------------------------|----------------|
| markdown    | "markdown"               | .md            |
| html        | N/A (raw html, no extraction) | .html     |
| text        | "txt"                    | .txt           |
| json        | "json"                   | .json          |
| jsonl       | "markdown" (then wrapped) | .jsonl        |
| xml         | "xml"                    | .xml           |
| xml-tei     | "xmltei"                 | .tei.xml       |

## Apify Actor mapping layer
Apify schema uses `saveExtractedMarkdownToKeyValueStore` (boolean).
`apps/contextractor-apify/src/config.py` must translate these to `save: ["markdown", ...]`.
No schema change needed — only the internal mapping function.
