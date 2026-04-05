# Master: Proxy & Full Config Parity

## TLDR

Add all missing Apify Actor config options (proxy, browser, cookies, headers, globs, concurrency) to the standalone CLI. Update all docs (3 READMEs + site help pages) to be consistent. Sync engine to GUI site. Test everything with free proxies. Publish Docker, Apify Actor, and npm.

## Shared Context

- Apify Actor input schema (`apps/contextractor-apify/.actor/input_schema.json`) is the source of truth for all settings (54 properties)
- CLI currently has ~15 settings; needs the remaining ~25+ from Apify Actor
- Config files support YAML and JSON; docs show JSON only
- Merge order: `defaults → config file → CLI args`
- Research notes: `proxy-config-notes/`
- User decisions: `user-entry-log/entry-qa-scope.md`

## Steps

1. **step-cli-config-parity.md** — Add all missing config options to CLI (proxy, browser, cookies, headers, globs, concurrency, output toggles)
2. **step-npm-wrapper-update.md** — Update npm JS wrapper (`index.js`) to pass new options to CLI binary
3. **step-docs-update.md** — Update all 3 READMEs and site help pages with consistent config documentation
4. **step-gui-site-sync.md** — Import contextractor-engine to tools repo, update GUI to support new config, verify consistency
5. **step-test-all.md** — Test Docker, npm CLI, Apify Actor (local + platform) using free proxies
6. **step-publish.md** — Publish Docker image, Apify Actor, npm package
7. **step-review.md** — Review all changes, run tests, verify consistency, autofix issues
