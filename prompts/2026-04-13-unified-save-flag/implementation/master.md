# Unified --save Flag

## TLDR

Replace 7 individual boolean output flags (`--save-markdown`, `--save-json`, etc.) with a single `--save` flag accepting a comma-separated list of format names. Applies to Python CLI, npm CLI/library, Docker, config files, and Apify Actor internal mapping. Apify Actor input schema is NOT changed.

## Design decisions (from [entry-qa-design-decisions.md](../user-entry-log/entry-qa-design-decisions.md))

- Explicit `--save` overrides all defaults: `--save xml,json` saves ONLY xml and json
- No `--save` flag = markdown only (current default preserved)
- `--save all` expands to all 7 formats
- Old boolean CLI flags removed completely (no deprecation)
- Config files: new `"save": [...]` format only, old boolean keys removed
- Format names: `markdown`, `html`, `text`, `json`, `jsonl`, `xml`, `xml-tei`, `all`

## Valid format names

| Name | trafilatura format | Extension | Notes |
|------|--------------------|-----------|-------|
| `markdown` | `"markdown"` | `.md` | Default when no `--save` |
| `html` | N/A (raw) | `.html` | Was `raw-html` |
| `text` | `"txt"` | `.txt` | |
| `json` | `"json"` | `.json` | |
| `jsonl` | `"markdown"` (wrapped) | `.jsonl` | Single file, all pages |
| `xml` | `"xml"` | `.xml` | |
| `xml-tei` | `"xmltei"` | `.tei.xml` | |

## Shared context

- Apify Actor input schema (`input_schema.json`) must NOT be modified
- Apify config.py must translate old Apify booleans → new `save` list internally
- Engine library (`contextractor_engine`) needs NO changes — uses per-call `output_format` string
- Docker needs no code changes (CLI args pass through)
- See [codebase-impact.md](../unified-save-flag-notes/codebase-impact.md) for file-level impact

## Steps

1. [step-config-model.md](step-config-model.md) — Update CrawlConfig dataclass and from_dict parsing
2. [step-python-cli.md](step-python-cli.md) — Replace boolean CLI flags with --save, update overrides
3. [step-crawler.md](step-crawler.md) — Update crawler to use save list instead of boolean checks
4. [step-npm-cli.md](step-npm-cli.md) — Update npm JS wrapper: library API and CLI flag mapping
5. [step-apify-mapping.md](step-apify-mapping.md) — Update Apify Actor config mapping and handler
6. [step-tests.md](step-tests.md) — Update all tests for new save list interface
7. [step-docs.md](step-docs.md) — Update all READMEs and help text
8. [step-review.md](step-review.md) — Review all changes, run tests, verify consistency, autofix
