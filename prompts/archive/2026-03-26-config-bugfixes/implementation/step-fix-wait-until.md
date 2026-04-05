# Step 1: Fix wait_until Not Wired to Playwright

## TLDR

The `wait_until` config option is accepted by CLI and config files but never passed to PlaywrightCrawler. Users setting `--wait-until load` see no effect. Wire it through `goto_options` in the crawler setup.

## Reference

- Bug details: `prompts/2026-03-26-config-review/config-review-notes/commit-review-findings.md`
- Crawlee docs: PlaywrightCrawler accepts `goto_options` parameter with `wait_until` field

## Files to Change

### 1. Standalone CLI crawler (`apps/contextractor-standalone/src/contextractor_cli/crawler.py`)

Add `goto_options` to the PlaywrightCrawler kwargs. Crawlee uses the `GotoOptions` class or a dict:

```
"goto_options": GotoOptions(wait_until=config.wait_until)
```

The `wait_until` value must match Playwright's expected enum: `"networkidle"`, `"load"`, `"domcontentloaded"`, `"commit"`.

Import `GotoOptions` from `crawlee.crawlers` or pass as dict.

### 2. Default value change

Change the default `wait_until` from `"networkidle"` to `"load"` in:
- `apps/contextractor-standalone/src/contextractor_cli/config.py` — CrawlConfig dataclass default
- `apps/contextractor-standalone/src/contextractor_cli/config.py` — `from_dict()` default value
- `apps/contextractor-apify/.actor/input_schema.json` — default enum value
- All 5 documentation files — update default listed in tables

Reason: `networkidle` causes 30s timeouts on sites with persistent connections (analytics, chat widgets). Industry standard default is `load`. See `config-review-notes/industry-practices.md`.

### 3. Apify Actor (`apps/contextractor-apify/src/main.py` and `src/config.py`)

Verify `waitUntil` is extracted from actor input and passed to PlaywrightCrawler via `goto_options`. Check if the Apify Actor already handles this or has the same bug.
