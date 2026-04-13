# Step 8: Review, Test, and Autofix

## TLDR

Final review step. Verify all changes from steps 1-7 are correct, consistent, and complete. Run tests, check for missed references, and autofix any issues.

## Review checklist

### 1. Diff review
Run `git diff` to capture full changeset. For each prior step, verify the code matches its instructions:
- [step-config-model.md](step-config-model.md) — CrawlConfig uses `save: list[str]`, from_dict parses list, validation works
- [step-python-cli.md](step-python-cli.md) — Single `--save` flag, no old boolean flags remain
- [step-crawler.md](step-crawler.md) — All boolean checks replaced with set membership
- [step-npm-cli.md](step-npm-cli.md) — JS API uses `save: string[]`, passes `--save` to binary
- [step-apify-mapping.md](step-apify-mapping.md) — Apify booleans translated to save list, schema unchanged
- [step-tests.md](step-tests.md) — Tests cover new interface, old toggle tests removed
- [step-docs.md](step-docs.md) — All READMEs updated, no old flag references remain

### 2. Grep for stale references
Search entire codebase for remnants of old interface:
- `save_markdown`, `save_raw_html`, `save_text`, `save_json`, `save_jsonl`, `save_xml`, `save_xml_tei`
- `saveMarkdown`, `saveRawHtml`, `saveText`, `saveJson`, `saveJsonl`, `saveXml`, `saveXmlTei`
- `--save-markdown`, `--save-raw-html`, `--save-text`, `--save-json`, `--save-jsonl`, `--save-xml`, `--save-xml-tei`
- `--no-save-markdown`

**Allowed exceptions**: Apify Actor input_schema.json (intentionally unchanged), Apify config.py mapping keys (reads Apify input).

### 3. Consistency verification
- Format names in CLI help text match format names in config parsing match format names in validation constant
- Default behavior: no `--save` flag → `["markdown"]` across CLI, config file, and Apify Actor
- `--save all` expands to all 7 formats in every interface

### 4. Run tests
```bash
pytest -v
```
Fix any failures.

### 5. User intent verification
Cross-reference [entry-initial-prompt.md](../user-entry-log/entry-initial-prompt.md) and [entry-qa-design-decisions.md](../user-entry-log/entry-qa-design-decisions.md):
- [x] Single `--save` flag with comma-separated values
- [x] Consistent across Python CLI, npm CLI, Docker
- [x] Library interface consistent with CLI
- [x] Apify Actor schema NOT modified
- [x] Explicit `--save` overrides all defaults
- [x] Old boolean flags removed completely
- [x] Config files use new format only
- [x] Format names: markdown, html, text, json, jsonl, xml, xml-tei

### 6. Autofix
Fix all discovered issues — code quality problems, test failures, missing references, stale docs.
