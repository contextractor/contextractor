# Step 3: Add User-Agent Option

## TLDR

Add `--user-agent` CLI option to set a custom User-Agent string. Default Playwright UAs are easily detected. Users should be able to set a Chrome UA for better stealth.

## Reference

- Industry research: `prompts/2026-03-26-config-review/config-review-notes/industry-practices.md`
- ScraperAPI best UA list 2026

## Files to Change

### 1. Config (`apps/contextractor-standalone/src/contextractor_cli/config.py`)

- Add `user_agent: str = ""` field to CrawlConfig
- Parse `userAgent` in `from_dict()`

### 2. CLI (`apps/contextractor-standalone/src/contextractor_cli/main.py`)

- Add `--user-agent` flag (string, optional)

### 3. Crawler (`apps/contextractor-standalone/src/contextractor_cli/crawler.py`)

- If `config.user_agent` is set, add it to browser context options as `user_agent`
- Playwright's `browser.new_context(user_agent=...)` sets the UA for all pages in that context

### 4. npm wrapper

- Add `userAgent` → `--user-agent` mapping

### 5. Documentation

- Add to all config tables and CLI option lists

## Note

Do NOT add built-in UA rotation or a UA list — keep it simple. Users who want rotation can use proxy providers that handle UA rotation server-side, or pass different UAs via config files for different crawls.
