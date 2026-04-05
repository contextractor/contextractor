# TLDR

If step-test-npm found issues, fix them in the contextractor source and re-publish to npm. If everything worked, skip this step.

**Touches:** `apps/contextractor-standalone/` (source code and npm wrapper)

## Instructions

### If npm package worked fine
Skip to step-commit-push.

### If issues were found

1. Diagnose the failure from the error output logged in step-test-npm
2. Fix the root cause in the appropriate file:
   - Binary/postinstall issues → `apps/contextractor-standalone/npm/postinstall.js`
   - CLI wrapper issues → `apps/contextractor-standalone/npm/cli.js` or `index.js`
   - Extraction/crawl issues → `apps/contextractor-standalone/src/contextractor_cli/`
   - Engine issues → `packages/contextractor_engine/`
3. Run local tests: `pytest` from `apps/contextractor-standalone/`
4. Re-test locally with the fix before publishing
5. To re-publish npm:
   - Bump version in `apps/contextractor-standalone/npm/package.json`
   - Use `/git:release` skill or manually tag and push to trigger the release workflow
   - Alternatively, for npm-only fix: `cd apps/contextractor-standalone/npm && npm publish --access public`
6. After publish, re-test with `npm install contextractor@latest` in the test folder
