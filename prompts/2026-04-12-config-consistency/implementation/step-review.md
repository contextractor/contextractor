# Step 5: Review, Test, Autofix

## TLDR

Run all tests, verify consistency across channels, check user requirements, autofix any issues.

## References

- `user-entry-log/entry-initial-prompt.md` — original requirements
- `user-entry-log/entry-qa-format-flags.md` — format flag decisions
- `user-entry-log/entry-qa-jsonl.md` — JSONL decision
- `config-consistency-notes/full-audit.md` — complete change list

## Steps

1. Run `git diff` to capture all changes.

2. Run tests:
   ```bash
   .venv/bin/python -m pytest apps/contextractor-standalone/tests/ -v
   ```

3. Verify each requirement from initial prompt:
   - [ ] `--save-*` toggles kept and consistent
   - [ ] No redundant settings remain
   - [ ] Config files use JSON in docs (YAML undocumented but supported)
   - [ ] npm package, Python package, Docker all updated
   - [ ] Apify actor NOT modified
   - [ ] All channels follow Apify actor settings

4. Cross-check:
   - All `--save-*` CLI flags exist in `CrawlConfig`
   - All `CrawlConfig` save fields parsed in `from_dict()`
   - All save flags mapped in `index.js` JS API
   - All save flags documented in all READMEs
   - Apify `input_schema.json` unchanged

5. Run `/sync:gui` to verify internal consistency.

6. If any test fails or inconsistency found, fix and re-run.

7. Commit all changes:
   ```bash
   git add -A && git commit -m "Align CLI config with Apify: replace --format with --save-* toggles"
   ```
