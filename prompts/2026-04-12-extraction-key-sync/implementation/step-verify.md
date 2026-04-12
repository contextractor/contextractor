# Step 4: Verify Published Artifacts

## TLDR

Download and test each published artifact (PyPI, npm, Docker). Autofix and re-release if any fail. Uses `--save-*` toggles (not `--format`).

See: `user-entry-log/entry-qa-scope.md` for scope decision.

## PyPI

1. Create isolated venv, install `contextractor==$VERSION`
2. Verify CLI: `contextractor --help`
3. Verify engine import: `from contextractor_engine import ContentExtractor, TrafilaturaConfig`
4. Test save toggles: `--save-markdown`, `--save-text`, `--save-json`, `--save-jsonl`, `--save-xml`, `--save-xml-tei`
5. Verify each output directory has non-empty files
6. Cleanup

## npm

1. Install `contextractor@$VERSION` in isolated prefix
2. Verify CLI: `contextractor --help`
3. Test extraction smoke test
4. Test JS API: `require('contextractor').extract()`
5. Verify output files
6. Cleanup

## Docker

1. Pull `ghcr.io/contextractor/contextractor:$VERSION`
2. Verify `--help`
3. Test extraction with volume mount
4. Verify output
5. Cleanup

## On Failure

If any test fails: diagnose root cause, fix code, commit, bump patch, re-release, re-verify only the failed channel.
