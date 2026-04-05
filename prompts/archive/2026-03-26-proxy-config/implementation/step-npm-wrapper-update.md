# Step 2: Update NPM Wrapper

## TLDR

Update the npm package's JavaScript wrapper (`index.js`) to support all new CLI options added in Step 1. This ensures the JS API passes new options correctly to the CLI binary.

## Reference

- NPM wrapper: `apps/contextractor-standalone/npm/index.js`
- CLI entry: `apps/contextractor-standalone/npm/cli.js`
- New CLI flags: see `step-cli-config-parity.md`

## Implementation

1. Read `apps/contextractor-standalone/npm/index.js` — find the `extract(urls, options)` function
2. Add mappings from camelCase JS option names to kebab-case CLI flags for all new options:
   - `proxyUrls` → `--proxy-urls`
   - `proxyRotation` → `--proxy-rotation`
   - `launcher` → `--launcher`
   - `waitUntil` → `--wait-until`
   - `pageLoadTimeout` → `--page-load-timeout`
   - `ignoreCors` → `--ignore-cors`
   - `closeCookieModals` → `--close-cookie-modals`
   - `maxScrollHeight` → `--max-scroll-height`
   - `ignoreSslErrors` → `--ignore-ssl-errors`
   - `globs` → `--globs`
   - `excludes` → `--excludes`
   - `linkSelector` → `--link-selector`
   - `keepUrlFragments` → `--keep-url-fragments`
   - `respectRobotsTxt` → `--respect-robots-txt`
   - `cookies` → `--cookies`
   - `headers` → `--headers`
   - `maxConcurrency` → `--max-concurrency`
   - `maxRetries` → `--max-retries`
   - `maxResults` → `--max-results`
   - `saveRawHtml` → `--save-raw-html`
   - `saveText` → `--save-text`
   - `saveJson` → `--save-json`
   - `saveXml` → `--save-xml`
   - `saveXmlTei` → `--save-xml-tei`
3. Handle array values (proxyUrls, globs, excludes) — join with commas
4. Handle JSON values (cookies, headers) — JSON.stringify before passing
5. Handle boolean flags — only pass flag when true (no value needed)
