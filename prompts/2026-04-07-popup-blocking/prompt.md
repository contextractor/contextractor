# Fix popup blocking + make settings consistent across all deployments

## Problem

1. Scraping idnes.cz produces cookie consent popup text instead of page content (Didomi CMP)
2. Settings are inconsistent across the 3 deployment targets (Standalone CLI, Apify Actor, npm/Docker)

## Part 1: Fix Cookie Consent Popup Blocking

### Root Cause

- idnes.cz uses Didomi CMP — overlay blocks real content
- `--close-cookie-modals` exists but is off by default, only has basic generic selectors
- See broken output: `/Users/miroslavsekera/r/testing-contextractor/npm-test/output-multi/www-idnes-cz-ekonomika.md`

### Fix

**Standalone** (`apps/contextractor-standalone/src/contextractor_cli/`):

- `config.py` — change `close_cookie_modals` default to `True` (both dataclass and `from_dict`)
- `crawler.py:167-184` — replace JS dismiss with CMP-aware logic:
  1. Didomi: `window.Didomi?.setUserAgreeToAll()`
  2. OneTrust: click `#onetrust-accept-btn-handler`
  3. CookieBot: click `#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll`
  4. Quantcast/TCF: click `.qc-cmp2-summary-buttons button[mode="primary"]`
  5. Generic fallback selectors
- Add `await context.page.wait_for_timeout(1000)` after dismiss

**Apify actor** (`apps/contextractor-apify/`):

- `.actor/input_schema.json` — change `closeCookieModals` default to `true`
- `src/config.py` — add `close_cookie_modals` to `build_crawl_config()` (currently schema field exists but is never read)
- `src/handler.py` — add same CMP-aware dismiss logic before `html = await context.page.content()` (line 74)

**npm wrapper** (`apps/contextractor-standalone/npm/index.js`):

- Update JSDoc default for `closeCookieModals`

**Didomi API ref:** `window.Didomi.setUserAgreeToAll()` — https://developers.didomi.io/cmp/web-sdk/reference/api

## Part 2: Make ALL Settings Consistent Across Deployments

Audit found these inconsistencies — fix them all:

### Missing settings

| Setting | Missing in | Action |
|---|---|---|
| `user_agent` | Apify actor | Add to input schema + `build_browser_context_options()` |
| `close_cookie_modals` usage | Apify actor | Schema exists but code never reads it — wire it up |

### Default value inconsistencies

| Setting | CLI default | Apify default | Fix |
|---|---|---|---|
| `close_cookie_modals` | `False` → `True` | `false` → `true` | Change both |

### Naming differences (acceptable, don't change — just document awareness)

These are acceptable platform-specific conventions, do NOT rename:
- Apify uses uppercase enums (`CHROMIUM`, `LOAD`) — converted to lowercase in code
- Apify uses verbose keys (`maxRequestRetries`, `initialCookies`, `customHttpHeaders`)
- Apify storage settings (`datasetName`, `keyValueStoreName`) are platform-specific

### Unused schema fields

| Field | Location | Action |
|---|---|---|
| `closeCookieModals` | Apify input schema | Wire it up in code (Part 1 covers this) |

## Part 3: Test All Deployments

### Local standalone test (before publishing)

```bash
# Section page (was broken)
uv run contextractor https://www.idnes.cz/ekonomika --max-pages 1 -f markdown -o /tmp/test-popup

# Article page
uv run contextractor "https://www.idnes.cz/technet/vesmir/astronauti-v-orionu-vstoupili-do-sfery-lunarniho-vlivu-brzy-posunou-hranice-lidstva.A260406_082334_tec_vesmir_jan" --max-pages 1 -f markdown -o /tmp/test-article

# Multi-page crawl
uv run contextractor https://www.idnes.cz/ --max-pages 5 --crawl-depth 1 -f markdown -o /tmp/test-multi

# Non-Czech site
uv run contextractor https://www.bbc.com/news --max-pages 2 --crawl-depth 1 -f markdown -o /tmp/test-bbc
```

Verify for each:
- NO popup/consent text in output
- YES actual page content (headlines, article body)
- `--no-close-cookie-modals` makes popup text reappear

Run unit tests: `uv run pytest --ignore=tools/`

### Publish all channels

**npm + Docker** — via release workflow:
- Use `/git:release` to bump version, tag, push
- GitHub Actions builds binaries, publishes npm, pushes Docker to GHCR

**Apify actor:**
- `apify push glueo/contextractor-test`
- Test on platform
- Only push to production `glueo/contextractor` when explicitly asked with `--production`

### Post-publish verification on each channel

**npm:**
```bash
cd /Users/miroslavsekera/r/testing-contextractor/npm-test
npm install contextractor@latest
npx contextractor https://www.idnes.cz/ekonomika --max-pages 1 -f markdown -o ./test-npm
npx contextractor "https://www.idnes.cz/technet/vesmir/astronauti-v-orionu-vstoupili-do-sfery-lunarniho-vlivu-brzy-posunou-hranice-lidstva.A260406_082334_tec_vesmir_jan" --max-pages 1 -f markdown -o ./test-npm-article
```

**Docker:**
```bash
docker pull ghcr.io/contextractor/contextractor:latest
docker run --rm ghcr.io/contextractor/contextractor:latest https://www.idnes.cz/ekonomika --max-pages 1
docker run --rm ghcr.io/contextractor/contextractor:latest "https://www.idnes.cz/technet/vesmir/astronauti-v-orionu-vstoupili-do-sfery-lunarniho-vlivu-brzy-posunou-hranice-lidstva.A260406_082334_tec_vesmir_jan" --max-pages 1
```

**Apify actor:**
- Run test actor on platform with idnes.cz URLs
- Verify dataset output has real content

For ALL channels verify: no popup text, real content extracted, multiple pages work.

## Key Files

| File | What to change |
|---|---|
| `apps/contextractor-standalone/src/contextractor_cli/config.py` | Default `close_cookie_modals = True` |
| `apps/contextractor-standalone/src/contextractor_cli/crawler.py` | CMP-aware JS dismiss + 1s wait |
| `apps/contextractor-apify/.actor/input_schema.json` | Default `closeCookieModals: true`, add `userAgent` |
| `apps/contextractor-apify/src/config.py` | Read `closeCookieModals`, `userAgent` |
| `apps/contextractor-apify/src/handler.py` | Add dismiss logic before extraction |
| `apps/contextractor-standalone/npm/index.js` | Update JSDoc defaults |
| `apps/contextractor-standalone/tests/test_config.py` | Update default assertions |
