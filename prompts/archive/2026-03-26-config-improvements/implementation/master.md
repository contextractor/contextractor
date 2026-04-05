# Master: Full Config Improvements

## TLDR

After bugfixes are applied (see `prompts/2026-03-26-config-bugfixes/`), add industry-standard improvements: stealth Chromium flags, tiered proxy support, user-agent option, test coverage for all new config options, and JSONL output mode.

## Shared Context

- Industry practices research: `prompts/2026-03-26-config-review/config-review-notes/industry-practices.md`
- Crawlee proxy API details: `prompts/2026-03-26-config-review/config-review-notes/crawlee-proxy-api.md`
- User scope decision: `prompts/2026-03-26-config-review/user-entry-log/entry-qa-scope.md`
- PREREQUISITE: Run `prompts/2026-03-26-config-bugfixes/` first
- SCOPE: contextractor in both repos

## Steps

1. **step-stealth-flags.md** — Add anti-detection Chromium args to default browser launch options
2. **step-tiered-proxies.md** — Add tiered proxy support (`proxy.tiered` config key)
3. **step-user-agent.md** — Add `--user-agent` CLI option for custom or rotating User-Agent
4. **step-test-coverage.md** — Add tests for all 24+ new config options (config parsing, CLI flags, merge logic)
5. **step-jsonl-output.md** — Add JSONL output mode for pipeline-friendly multi-URL output
6. **step-review.md** — Review all changes, run tests, verify consistency, autofix issues
