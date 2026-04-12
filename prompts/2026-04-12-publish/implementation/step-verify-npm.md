# Step 5: Verify npm Package

## TLDR

Install `contextractor` from npm globally, test CLI and JS API, verify all output formats work.

See: `publish-notes/test-matrix.md` for test URLs and format list.

## Steps

1. Install from npm into isolated prefix:
   ```bash
   npm install -g contextractor --prefix /tmp/test-npm
   export PATH="/tmp/test-npm/bin:$PATH"
   ```

2. Verify CLI:
   ```bash
   contextractor --help
   ```

3. Test extraction (smoke test):
   ```bash
   contextractor https://example.com --format markdown -o /tmp/test-npm/output --max-pages 1
   ```
   Verify output file exists and has content.

4. Test all output formats:
   ```bash
   for fmt in txt markdown json jsonl xml xmltei; do
     contextractor https://example.com --format $fmt -o /tmp/test-npm/output-$fmt --max-pages 1
   done
   ```

5. Test JS API:
   ```bash
   node -e "
     const { extract } = require('/tmp/test-npm/lib/node_modules/contextractor');
     extract('https://example.com', { format: 'markdown', outputDir: '/tmp/test-npm/output-api', maxPages: 1 })
       .then(() => console.log('JS API OK'))
       .catch(e => { console.error(e); process.exit(1); });
   "
   ```

6. Test extraction options:
   ```bash
   contextractor https://en.wikipedia.org/wiki/Web_scraping \
     --precision --no-links --format json -o /tmp/test-npm/output-options --max-pages 1
   ```

7. Cleanup:
   ```bash
   rm -rf /tmp/test-npm
   ```

## On Failure

If any test fails, diagnose the root cause, fix the code, commit, and proceed to step-review.md for re-release.
