# Test: Node.js API Section

References: `implementation/step-add-nodejs-api.md`

## Review

- Read `apps/contextractor-standalone/npm/index.js` and cross-check every option name in the README examples
- Verify `extract()` function signature matches: `extract(urls, options)` returns `Promise<void>`
- Verify import syntax is correct for both CJS and ESM
- Check that no non-existent options are documented

## Autofix

Fix any wrong option names, incorrect signatures, or misleading examples.
