# Step 3: Update npm wrapper

## TLDR
Update `npm/index.js` to support the new CLI interface where URLs are positional args and config is optional via `--config`.

## Context
- Current code: `apps/contextractor-standalone/npm/index.js`
- NPM wrapper spawns the compiled binary and translates JS options to CLI flags

## Changes

### Update `extract()` function signature

Current: `extract(configPath, options = {})`
New: `extract(urls, options = {})`

Where `urls` can be:
- A string (single URL)
- An array of strings (multiple URLs)
- Omitted if `options.config` is provided

### New option keys to support

Add translations for all new CLI flags:
- `maxPages` → `--max-pages`
- `crawlDepth` → `--crawl-depth`
- `headless` → `--headless` / `--no-headless`
- `fast` → `--fast`
- `includeTables` → `--include-tables` / `--no-tables`
- `includeImages` → `--include-images`
- `deduplicate` → `--deduplicate`
- `targetLanguage` → `--target-language`
- `config` → `--config`

### Backward compat
- If first arg is a file path (not a URL), treat it as `--config` for backward compat
- Detect by checking if it starts with `http://` or `https://`

## Constraints
- Keep the wrapper thin — no validation, just flag translation
- Update JSDoc / type comments to reflect new API
