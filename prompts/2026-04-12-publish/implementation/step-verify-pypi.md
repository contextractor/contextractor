# Step 4: Verify PyPI Package

## TLDR

Install `contextractor` from PyPI in an isolated venv, test CLI entry point and library import, verify all output formats work.

See: `publish-notes/test-matrix.md` for test URLs and format list.

## Steps

1. Create isolated test environment:
   ```bash
   uv venv /tmp/test-pypi --python 3.12
   /tmp/test-pypi/bin/pip install contextractor
   ```

2. Verify CLI entry point:
   ```bash
   /tmp/test-pypi/bin/contextractor --help
   ```

3. Verify engine is bundled (library import):
   ```bash
   /tmp/test-pypi/bin/python -c "from contextractor_engine import ContentExtractor, TrafilaturaConfig; print('OK')"
   ```

4. Test all output formats against `https://example.com`:
   ```bash
   for fmt in txt markdown json jsonl xml xmltei; do
     /tmp/test-pypi/bin/contextractor https://example.com --format $fmt -o /tmp/test-pypi/output-$fmt --max-pages 1
   done
   ```
   Verify each output directory has a non-empty file.

5. Test extraction options:
   ```bash
   /tmp/test-pypi/bin/contextractor https://en.wikipedia.org/wiki/Web_scraping \
     --precision --no-links --no-tables --format json -o /tmp/test-pypi/output-options --max-pages 1
   ```
   Verify output exists and JSON is valid.

6. Test metadata extraction:
   ```bash
   /tmp/test-pypi/bin/contextractor https://blog.apify.com/what-is-web-scraping/ \
     --with-metadata --format markdown -o /tmp/test-pypi/output-meta --max-pages 1
   ```
   Verify output contains `Title:` and `URL:` headers.

7. Cleanup:
   ```bash
   rm -rf /tmp/test-pypi
   ```

## On Failure

If any test fails, diagnose the root cause, fix the code, commit, and proceed to step-review.md for re-release.
