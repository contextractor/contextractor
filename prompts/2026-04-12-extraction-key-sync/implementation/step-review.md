# Step 5: Review, Test, Autofix

## TLDR

Final review of all changes against user requirements. Verify consistency, run tests, autofix any gaps.

## References

- `user-entry-log/entry-initial-prompt.md` — original requirements
- `user-entry-log/entry-qa-config-key.md` — hard rename decision
- `user-entry-log/entry-qa-scope.md` — full publish+verify scope
- `extraction-key-sync-notes/extraction-key-locations.md` — all locations that needed changing

## Steps

1. Run `git diff` to capture all changes since before the rename.

2. Verify each requirement from initial prompt:
   - [ ] `trafilaturaConfig` key used consistently across CLI, npm, Docker, docs
   - [ ] `extraction` key fully removed (no references in code or docs)
   - [ ] No redundant settings remain
   - [ ] Config files use JSON in docs (YAML undocumented but supported)
   - [ ] Apify actor NOT modified
   - [ ] All channels published and verified

3. Cross-check:
   - `from_dict()` reads `trafilaturaConfig` (not `extraction`)
   - `CrawlConfig` field is `trafilatura_config`
   - `crawler.py` uses `config.trafilatura_config`
   - All READMEs show `trafilaturaConfig` in config examples
   - All spec docs use `trafilaturaConfig`
   - Apify `input_schema.json` unchanged

4. Run full test suite:
   ```bash
   .venv/bin/python -m pytest apps/contextractor-standalone/tests/ -v
   ```

5. Grep for any remaining `"extraction"` references (excluding Apify actor, prompts, and git history):
   ```bash
   grep -r '"extraction"' --include='*.py' --include='*.js' --include='*.md' --exclude-dir=prompts --exclude-dir=.git apps/ packages/ docs/ README.md
   ```

6. If any test fails or inconsistency found, fix and re-run.

7. If code was fixed, bump patch version and re-release per step-publish.md.
