# Contextractor Actor: Add Custom Headers and Remove Session Pool

## Overview

Modify the Contextractor actor to:
1. Add `customHttpHeaders` field to input schema
2. Move `initialCookies` to "Crawler settings" section with enhanced configuration
3. Remove `sessionPoolName` from schema and functionality
4. Update documentation and specs

## Reference Files

### Input Schema References
- **Target Actor:** `/Users/miroslavsekera/r/contextractor/apps/contextractor/.actor/input_schema.json`
- **Website Content Crawler Reference:** `/Users/miroslavsekera/r/contextractor/prompts/2026-adjust3/website-content-crawler-input-schema.json`
- **Playwright Scraper Reference:** `/Users/miroslavsekera/r/playwright-scraper-apify/INPUT_SCHEMA.json`
- **UI Screenshot Reference:** `/Users/miroslavsekera/r/contextractor/prompts/2026-adjust3/headers.png`

### Actor Code
- **Main entry:** `/Users/miroslavsekera/r/contextractor/apps/contextractor/src/main.py`
- **Config builder:** `/Users/miroslavsekera/r/contextractor/apps/contextractor/src/config.py`
- **Request handler:** `/Users/miroslavsekera/r/contextractor/apps/contextractor/src/handler.py`

### Documentation
- **Functional Spec:** `/Users/miroslavsekera/r/contextractor/docs/spec/functional-spec.md`
- **Technical Spec:** `/Users/miroslavsekera/r/contextractor/docs/spec/tech-spec.md`
- **README:** `/Users/miroslavsekera/r/contextractor/apps/contextractor/README.md`

---

## Task 1: Update Input Schema

### 1.1 Add `customHttpHeaders` Field

Add the following field to `/Users/miroslavsekera/r/contextractor/apps/contextractor/.actor/input_schema.json` in the "Crawler settings" section (after `initialCookies`):

```json
"customHttpHeaders": {
    "title": "Custom HTTP headers",
    "type": "object",
    "description": "HTTP headers that will be added to all requests made by the crawler. This is useful for setting custom authentication headers or other headers required by the target website. The value is expected to be a JSON object with header names as keys and header values as values. For example: `{ \"Authorization\": \"Bearer token123\", \"X-Custom-Header\": \"value\" }`.",
    "default": {},
    "prefill": {},
    "editor": "json"
}
```

### 1.2 Move and Enhance `initialCookies` Field

Move `initialCookies` to the "Crawler settings" section and update it to match the Website Content Crawler style:

```json
"initialCookies": {
    "title": "Initial cookies",
    "type": "array",
    "description": "Cookies that will be pre-set to all pages the scraper opens. This is useful for pages that require login. The value is expected to be a JSON array of objects with `name` and `value` properties. For example: \n\n```json\n[\n  {\n    \"name\": \"cookieName\",\n    \"value\": \"cookieValue\",\n    \"path\": \"/\",\n    \"domain\": \".example.com\"\n  }\n]\n```\n\nYou can use the [EditThisCookie](https://docs.apify.com/academy/tools/edit-this-cookie) browser extension to copy browser cookies in this format, and paste it here.\n\nNote that the value is secret and encrypted to protect your login cookies.",
    "prefill": [],
    "default": [],
    "editor": "json",
    "isSecret": true
}
```

**Important:** The `isSecret: true` property will display a lock icon in the Apify Console UI.

### 1.3 Remove `sessionPoolName` Field

Remove the entire `sessionPoolName` property from the input schema:

```json
// REMOVE THIS ENTIRE BLOCK:
"sessionPoolName": {
    "title": "Session pool name",
    "type": "string",
    "description": "Name for sharing sessions across Actor runs. Sessions store IP and cookies to emulate real users. Use alphanumeric characters, dashes, and underscores only.",
    "editor": "textfield",
    "minLength": 3,
    "maxLength": 200,
    "pattern": "[0-9A-Za-z-_]"
}
```

### 1.4 Reorganize Field Order in "Crawler settings" Section

The "Crawler settings" section should have fields in this order:
1. `globs` (with `sectionCaption: "Crawler settings"`)
2. `excludes`
3. `pseudoUrls`
4. `linkSelector`
5. `keepUrlFragments`
6. `respectRobotsTxtFile`
7. `initialCookies` (moved here, with `isSecret: true`)
8. `customHttpHeaders` (new field)
9. `maxPagesPerCrawl`
10. `maxResultsPerCrawl`
11. `maxCrawlingDepth`
12. `maxConcurrency`
13. `maxRequestRetries`

---

## Task 2: Update Actor Code

### 2.1 Update `/Users/miroslavsekera/r/contextractor/apps/contextractor/src/config.py`

Add `customHttpHeaders` to the config builder:

```python
def build_crawl_config(actor_input: dict[str, Any]) -> dict[str, Any]:
    """Build crawl configuration from actor input."""
    return {
        # ... existing fields ...
        'custom_http_headers': actor_input.get('customHttpHeaders', {}),
        # Remove any reference to sessionPoolName
    }
```

### 2.2 Update `/Users/miroslavsekera/r/contextractor/apps/contextractor/src/main.py`

1. **Remove sessionPoolName handling** - Remove any code that reads or uses `sessionPoolName`

2. **Add custom headers to browser context options** in `build_browser_context_options()` or create a new function:

```python
def build_browser_context_options(actor_input: dict[str, Any]) -> dict[str, Any] | None:
    """Build browser context options from actor input."""
    options: dict[str, Any] = {}

    if actor_input.get('ignoreCorsAndCsp', False):
        options['bypass_csp'] = True

    initial_cookies = actor_input.get('initialCookies', [])
    if initial_cookies:
        options['storage_state'] = {'cookies': initial_cookies}

    # Add custom HTTP headers
    custom_headers = actor_input.get('customHttpHeaders', {})
    if custom_headers:
        options['extra_http_headers'] = custom_headers

    return options if options else None
```

### 2.3 Update Playwright Crawler Configuration

Ensure the custom HTTP headers are passed to the PlaywrightCrawler. The headers should be applied via:
- `browser_new_context_options` with `extra_http_headers` key

Example in `_create_crawler()`:

```python
async def _create_crawler(actor_input: dict) -> PlaywrightCrawler:
    """Create and configure PlaywrightCrawler."""
    # ... existing code ...

    browser_context_options = build_browser_context_options(actor_input)

    return PlaywrightCrawler(
        # ... existing parameters ...
        browser_new_context_options=browser_context_options,
    )
```

---

## Task 3: Update Documentation

### 3.1 Update `/Users/miroslavsekera/r/contextractor/apps/contextractor/README.md`

Add documentation for new fields in the Input table:

```markdown
| initialCookies | [] | Pre-set cookies for authentication (secret) |
| customHttpHeaders | {} | Custom HTTP headers for all requests |
```

Remove `sessionPoolName` from any documentation.

### 3.2 Update `/Users/miroslavsekera/r/contextractor/docs/spec/functional-spec.md`

Add functional requirements for:
- Custom HTTP headers support
- Enhanced cookie handling with secret encryption
- Remove session pool functionality description

### 3.3 Update `/Users/miroslavsekera/r/contextractor/docs/spec/tech-spec.md`

Update technical specifications:
- Add `customHttpHeaders` field specification
- Document how headers are passed to Playwright
- Remove `sessionPoolName` technical details

---

## Task 4: Test Suite Updates

### 4.1 Update Test Suites

Check and update any test suites in `/Users/miroslavsekera/r/contextractor/tools/platform-test-runner/test-suites/` that reference `sessionPoolName` - remove those references.

### 4.2 Verify No Breaking Changes

Ensure existing test suites still pass after schema changes.

---

## Verification Checklist

After implementation, verify:

- [ ] `customHttpHeaders` field appears in Apify Console under "Crawler settings"
- [ ] `initialCookies` field shows lock icon (secret) in Apify Console
- [ ] `sessionPoolName` field is removed from schema
- [ ] Custom headers are sent with all HTTP requests
- [ ] Initial cookies are properly set on browser context
- [ ] All existing test suites pass
- [ ] Documentation is updated
- [ ] Actor builds successfully on Apify platform

---

## Field Definitions Reference

### From Website Content Crawler (lines 126-141):

```json
"initialCookies": {
    "title": "Initial cookies",
    "type": "array",
    "description": "Cookies that will be pre-set to all pages the scraper opens. This is useful for pages that require login. The value is expected to be a JSON array of objects with `name` and `value` properties. For example: \n\n```json\n[\n  {\n    \"name\": \"cookieName\",\n    \"value\": \"cookieValue\",\n    \"path\": \"/\",\n    \"domain\": \".apify.com\"\n  }\n]\n```\n\nYou can use the [EditThisCookie](https://docs.apify.com/academy/tools/edit-this-cookie) browser extension to copy browser cookies in this format, and paste it here.\n\nNote that the value is secret and encrypted to protect your login cookies.",
    "prefill": [],
    "editor": "json",
    "isSecret": true
},
"customHttpHeaders": {
    "title": "Custom HTTP headers",
    "type": "object",
    "description": "HTTP headers that will be added to all requests made by the crawler. This is useful for setting custom authentication headers or other headers required by the target website. The value is expected to be a JSON object with `name` and `value` properties. For example: `{ \"name\": \"Authorization\", \"value\": \"Basic a1b2c3d4...\" }`.",
    "default": {},
    "prefill": {},
    "editor": "json"
}
```

---

## Notes

- The `isSecret: true` property ensures the field value is encrypted in the Apify platform
- Custom HTTP headers are applied at the browser context level, affecting all requests
- Session pool functionality is being removed as it's not commonly used and adds complexity
- The UI should match the screenshot at `/Users/miroslavsekera/r/contextractor/prompts/2026-adjust3/headers.png`
