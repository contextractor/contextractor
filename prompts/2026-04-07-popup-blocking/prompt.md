# Fix cookie consent popups polluting extracted content

## Problem

Scraping idnes.cz via npm/Docker/standalone produces cookie consent popup text instead of page content.
See `/Users/miroslavsekera/r/testing-contextractor/npm-test/output-multi/www-idnes-cz-ekonomika.md` — entire file is Didomi CMP consent text (47 lines of GDPR boilerplate, zero news content).

## Root Cause

- idnes.cz uses Didomi CMP — shows a consent overlay on first visit, blocks real content
- Trafilatura extracts popup DOM text instead of article content
- `--close-cookie-modals` flag exists but is off by default and only has basic generic selectors that don't handle Didomi

## What To Do

### 1. Improve cookie dismiss JS and enable by default

**Standalone** (`apps/contextractor-standalone/src/contextractor_cli/`):

- `config.py:42` — change `close_cookie_modals: bool = False` to `True`
- `config.py:117` — change `closeCookieModals` default from `False` to `True`
- `crawler.py:167-184` — replace JS dismiss with CMP-aware logic:
  1. Didomi: `window.Didomi?.setUserAgreeToAll()`
  2. OneTrust: click `#onetrust-accept-btn-handler`
  3. CookieBot: click `#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll`
  4. Quantcast/TCF: click `.qc-cmp2-summary-buttons button[mode="primary"]`
  5. Generic fallback: `[class*="cookie"] button[class*="accept"]`, `[class*="consent"] button`, etc.
- Add `await context.page.wait_for_timeout(1000)` after dismiss for page re-render

**Apify actor** (`apps/contextractor-apify/`):

- `.actor/input_schema.json:222-227` — change `closeCookieModals` default from `false` to `true`
- `src/config.py` — add `close_cookie_modals` to `build_crawl_config()` return dict
- `src/handler.py` — add the same CMP-aware dismiss logic before `html = await context.page.content()` (line 74), reading `close_cookie_modals` from handler config. Currently the Apify actor has the schema field but never reads or uses it.

**npm wrapper** (`apps/contextractor-standalone/npm/index.js`):

- Update JSDoc: `closeCookieModals` default description to say default is true

### 2. Update tests

- `tests/test_config.py:121` — if it asserts `close_cookie_modals is True`, keep it; if `False`, update
- `tests/test_cli.py` — verify `--no-close-cookie-modals` flag still works (typer supports it via `--close-cookie-modals` option)

### 3. Test on real pages

Test the fix locally with `uv run contextractor` before publishing:

```bash
# Section page (was broken — showed popup text)
uv run contextractor https://www.idnes.cz/ekonomika --max-pages 1 -f markdown -o /tmp/test-popup

# Actual article page
uv run contextractor "https://www.idnes.cz/technet/vesmir/astronauti-v-orionu-vstoupili-do-sfery-lunarniho-vlivu-brzy-posunou-hranice-lidstva.A260406_082334_tec_vesmir_jan" --max-pages 1 -f markdown -o /tmp/test-article

# Multi-page crawl
uv run contextractor https://www.idnes.cz/ --max-pages 5 --crawl-depth 1 -f markdown -o /tmp/test-multi
```

Verify:
- NO Didomi/consent popup text ("iDNES a reklama", "souhlas s reklamou", "Podrobné nastavení")
- YES actual news content (headlines, article text)
- `--no-close-cookie-modals` flag makes popup text reappear

Run unit tests: `uv run pytest --ignore=tools/`

### 4. Publish all three distribution channels

**npm** — needs a new release since the binary bundles the Python code:
- Use `/git:release` to bump version, tag, push — triggers GitHub Actions
- Actions builds binaries, publishes npm, builds+pushes Docker
- After publish: `npm install contextractor@latest` in test folder, test on idnes.cz

**Docker** — built and pushed by the same release workflow
- After publish: `docker pull ghcr.io/contextractor/contextractor:latest && docker run --rm ghcr.io/contextractor/contextractor:latest https://www.idnes.cz/ekonomika --max-pages 1`

**Apify actor** — push to test actor first:
- `apify push glueo/contextractor-test`
- Test on platform, verify output
- Only push to `glueo/contextractor` production if explicitly asked

### 5. Final verification

After all publishes, verify each channel produces clean content (no popup text) from idnes.cz.

## Key Files

| File | What to change |
|---|---|
| `apps/contextractor-standalone/src/contextractor_cli/config.py` | Default `close_cookie_modals = True` |
| `apps/contextractor-standalone/src/contextractor_cli/crawler.py` | CMP-aware JS dismiss + wait |
| `apps/contextractor-apify/.actor/input_schema.json` | Default `closeCookieModals: true` |
| `apps/contextractor-apify/src/config.py` | Read and pass `closeCookieModals` |
| `apps/contextractor-apify/src/handler.py` | Add dismiss logic before extraction |
| `apps/contextractor-standalone/npm/index.js` | Update JSDoc default |

## Research Notes

- Didomi API: `window.Didomi.setUserAgreeToAll()` — https://developers.didomi.io/cmp/web-sdk/reference/api
- IDCAC extension is unmaintained since Nov 2023, not recommended
- Crawlee JS has a `closeCookieModals` context helper (PR #1927) but Python Crawlee does not
- Apify blog on approach: https://blog.apify.com/how-to-block-cookie-modals/
