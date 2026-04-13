# Q&A: Unified --save Flag Design Decisions

## Q1: Default behavior when --save is specified
**Answer**: Explicit overrides all.
- `--save xml,json` saves ONLY xml and json (no markdown)
- No `--save` at all = markdown only (current default)
- `--save all` saves everything

## Q2: Backward compatibility of old boolean CLI flags
**Answer**: Remove completely.
- Only `--save` exists in CLI
- Old `--save-markdown`, `--save-json`, etc. flags are removed
- No deprecation period, clean break

## Q3: Format names in --save value list
**Answer**: Short names.
- markdown, html, text, json, jsonl, xml, xml-tei, all
- `html` instead of `raw-html`
- `text` instead of `txt` (on CLI surface)

## Q4: Config file format
**Answer**: New format only.
- Config files must use `"save": ["markdown", "xml"]`
- Old boolean keys (`saveMarkdown`, `save_markdown`) are rejected
- Clean break, no backward compat for old boolean config keys
