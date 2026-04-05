# Contextractor Enhancement Prompt: Add Missing Playwright Scraper Features

## Overview

Enhance the Contextractor actor (`/Users/miroslavsekera/r/contextractor/apps/contextractor/`) to include missing features from the Playwright Scraper actor (`/Users/miroslavsekera/r/playwright-scraper-apify/`).

## Reference Implementation

Check the Playwright Scraper implementation at `/Users/miroslavsekera/r/playwright-scraper-apify/` for how these features are implemented in the original actor. Key files to review:
- `INPUT_SCHEMA.json` - Input schema definitions
- `src/` - Source code implementation

## Files to Modify

- `.actor/input_schema.json` - Add new input fields
- `src/main.py` - Implement the new functionality

---

## Missing Input Schema Fields

Add the following fields to `.actor/input_schema.json`:

### 1. Crawler Settings Section (existing)

Add after `excludes`:

```json
"pseudoUrls": {
    "title": "Pseudo-URLs",
    "type": "array",
    "description": "Pseudo-URLs to match links in the page that you want to enqueue. Alternative to glob patterns. Combine with Link selector to tell the scraper where to find links.",
    "editor": "pseudoUrls",
    "default": []
},
"keepUrlFragments": {
    "title": "Keep URL fragments",
    "type": "boolean",
    "description": "URL fragments (the parts of URL after a #) are not considered when the scraper determines whether a URL has already been visited. Turn this on to treat URLs with different fragments as different pages.",
    "default": false
},
"respectRobotsTxtFile": {
    "title": "Respect robots.txt",
    "type": "boolean",
    "description": "If enabled, the crawler will consult the robots.txt file for each domain before crawling pages.",
    "default": false
},
"maxCrawlingDepth": {
    "title": "Max crawling depth",
    "type": "integer",
    "description": "Maximum link depth from Start URLs. Pages discovered further from start URLs than this limit will not be crawled. 0 means unlimited.",
    "default": 0,
    "minimum": 0
},
"maxResultsPerCrawl": {
    "title": "Max results",
    "type": "integer",
    "description": "Maximum number of results that will be saved to dataset. The scraper will terminate after reaching this number. 0 means unlimited.",
    "default": 0,
    "minimum": 0,
    "unit": "results"
}
```

### 2. Proxy Configuration Section (new section after Crawler settings)

Add `sectionCaption` to `proxyConfiguration` and add after it:

```json
"proxyConfiguration": {
    "sectionCaption": "Proxy configuration",
    "title": "Proxy configuration",
    "type": "object",
    "description": "Enables loading websites from IP addresses in specific geographies and to circumvent blocking.",
    "editor": "proxy"
},
"proxyRotation": {
    "title": "Proxy rotation",
    "type": "string",
    "description": "Proxy rotation strategy. RECOMMENDED automatically picks the best proxies. PER_REQUEST uses a new proxy for each request. UNTIL_FAILURE uses one proxy until it fails.",
    "default": "RECOMMENDED",
    "editor": "select",
    "enum": ["RECOMMENDED", "PER_REQUEST", "UNTIL_FAILURE"],
    "enumTitles": ["Recommended", "Rotate per request", "Use until failure"]
},
"sessionPoolName": {
    "title": "Session pool name",
    "type": "string",
    "description": "Name for sharing sessions across Actor runs. Sessions store IP and cookies to emulate real users. Use alphanumeric characters, dashes, and underscores only.",
    "editor": "textfield",
    "minLength": 3,
    "maxLength": 200,
    "pattern": "[0-9A-Za-z-_]"
},
"initialCookies": {
    "title": "Initial cookies",
    "type": "array",
    "description": "Cookies to pre-set on all pages. Useful for authentication or bypassing certain protections.",
    "default": [],
    "editor": "json"
}
```

### 3. Browser Configuration Section (rename HTML processing section)

Update existing `pageLoadTimeoutSecs` section and add new fields:

```json
"pageLoadTimeoutSecs": {
    "sectionCaption": "Browser configuration",
    "title": "Page load timeout",
    ...
},
```

Add after `headless`:

```json
"ignoreCorsAndCsp": {
    "title": "Ignore CORS and CSP",
    "type": "boolean",
    "description": "Ignore Content Security Policy and Cross-Origin Resource Sharing restrictions. Enables free XHR/Fetch requests from pages.",
    "default": false
},
```

### 4. Advanced Configuration Section (new section)

Add before Output settings section:

```json
"debugLog": {
    "title": "Debug log",
    "type": "boolean",
    "description": "Include debug messages in the log output.",
    "default": false
},
"browserLog": {
    "title": "Browser log",
    "type": "boolean",
    "description": "Include browser console messages in the log. May flood logs with errors at high concurrency.",
    "default": false
}
```

### 5. Output Settings Section (add storage name options)

Add after the existing save* options:

```json
"datasetName": {
    "title": "Dataset name",
    "type": "string",
    "description": "Name or ID of the dataset for storing results. Leave empty to use the default run dataset.",
    "editor": "textfield"
},
"keyValueStoreName": {
    "title": "Key-value store name",
    "type": "string",
    "description": "Name or ID of the key-value store for content files. Leave empty to use the default store.",
    "editor": "textfield"
},
"requestQueueName": {
    "title": "Request queue name",
    "type": "string",
    "description": "Name of the request queue for pending URLs. Leave empty to use the default queue.",
    "editor": "textfield"
}
```

---

## Implementation in main.py

### 1. Update config dictionary (around line 31)

Add new config fields:

```python
config = {
    # Existing fields...
    'save_raw_html': actor_input.get('saveRawHtmlToKeyValueStore', False),
    'save_text': actor_input.get('saveExtractedTextToKeyValueStore', False),
    'save_json': actor_input.get('saveExtractedJsonToKeyValueStore', False),
    'save_markdown': actor_input.get('saveExtractedMarkdownToKeyValueStore', True),
    'save_xml': actor_input.get('saveExtractedXmlToKeyValueStore', False),
    'save_xmltei': actor_input.get('saveExtractedXmlTeiToKeyValueStore', False),
    'extraction_mode': actor_input.get('extractionMode', 'BALANCED'),
    'globs': actor_input.get('globs', []),
    'excludes': actor_input.get('excludes', []),
    'link_selector': actor_input.get('linkSelector', ''),
    # New fields
    'pseudo_urls': actor_input.get('pseudoUrls', []),
    'keep_url_fragments': actor_input.get('keepUrlFragments', False),
    'max_crawling_depth': actor_input.get('maxCrawlingDepth', 0),
}
```

### 2. Open named storages if specified (around line 26)

```python
# Open KVS for storing content
kvs_name = actor_input.get('keyValueStoreName') or 'content'
kvs = await Actor.open_key_value_store(name=kvs_name)

# Open named dataset if specified
dataset_name = actor_input.get('datasetName')
if dataset_name:
    dataset = await Actor.open_dataset(name=dataset_name)
else:
    dataset = None  # Use default via push_data

# Open named request queue if specified
rq_name = actor_input.get('requestQueueName')
if rq_name:
    request_queue = await Actor.open_request_queue(name=rq_name)
else:
    request_queue = None
```

### 3. Configure debug logging (before crawler creation)

```python
# Enable debug logging if requested
if actor_input.get('debugLog', False):
    import logging
    logging.getLogger('crawlee').setLevel(logging.DEBUG)
    logging.getLogger('apify').setLevel(logging.DEBUG)
```

### 4. Update PlaywrightCrawler initialization (around line 52)

```python
# Build browser launch options
browser_launch_options = {
    'args': ['--disable-gpu'],
}
if actor_input.get('ignoreSslErrors', False):
    browser_launch_options['ignore_https_errors'] = True

# Build browser context options
browser_context_options = {}
if actor_input.get('ignoreCorsAndCsp', False):
    browser_context_options['bypass_csp'] = True

max_pages = actor_input.get('maxPagesPerCrawl', 0)
max_results = actor_input.get('maxResultsPerCrawl', 0)

crawler = PlaywrightCrawler(
    headless=actor_input.get('headless', True),
    browser_type=actor_input.get('launcher', 'CHROMIUM').lower(),
    max_requests_per_crawl=max_pages if max_pages > 0 else None,
    max_request_retries=actor_input.get('maxRequestRetries', 3),
    request_handler_timeout=timedelta(seconds=actor_input.get('pageLoadTimeoutSecs', 60)),
    proxy_configuration=proxy_cfg,
    browser_launch_options=browser_launch_options,
    browser_new_context_options=browser_context_options,
    respect_robots_txt=actor_input.get('respectRobotsTxtFile', False),
    session_pool_options={
        'persist_state_key': actor_input.get('sessionPoolName'),
    } if actor_input.get('sessionPoolName') else None,
    # Note: initial cookies, max_crawling_depth, keep_url_fragments need additional handling
)
```

### 5. Add browser console logging (in handler if browserLog enabled)

```python
@crawler.router.default_handler
async def handler(context: PlaywrightCrawlingContext) -> None:
    url = context.request.url
    Actor.log.info(f'Processing {url}')

    # Enable browser console logging if requested
    if actor_input.get('browserLog', False):
        context.page.on('console', lambda msg: Actor.log.info(f'[Browser] {msg.type}: {msg.text}'))
```

### 6. Update push_data to use named dataset

```python
# At the end of handler, replace:
# await context.push_data(data)
# With:
if dataset:
    await dataset.push_data(data)
else:
    await context.push_data(data)
```

### 7. Update enqueue_links to support pseudo_urls

```python
# In handler, update enqueue_links section:
link_selector = handler_config.get('link_selector', '')
if link_selector:
    globs = handler_config.get('globs', [])
    excludes = handler_config.get('excludes', [])
    pseudo_urls = handler_config.get('pseudo_urls', [])

    await context.enqueue_links(
        selector=link_selector,
        globs=[g.get('glob') for g in globs if g.get('glob')] if globs else None,
        exclude_globs=[e.get('glob') for e in excludes if e.get('glob')] if excludes else None,
        # Note: pseudo_urls support depends on crawlee version - check docs
    )
```

### 8. Handle initial cookies

```python
# Before crawler.run(), set up initial cookies in pre-navigation hook:
initial_cookies = actor_input.get('initialCookies', [])
if initial_cookies:
    # Add to browser context options
    pass  # Implementation depends on crawlee API
```

---

## Notes

1. **Not implementing `pageFunction`**: Contextractor's purpose is trafilatura-based extraction, not custom JS functions. The `pageFunction` from playwright-scraper is its core feature, while contextractor has its own extraction pipeline.

2. **Proxy rotation**: Check if crawlee Python supports `proxyRotation` modes. May need custom `ProxyConfiguration` setup.

3. **Session pool**: Verify crawlee Python session pool API matches the configuration options.

4. **maxResultsPerCrawl**: Requires tracking results count and calling `crawler.stop()` when limit reached.

5. **maxCrawlingDepth**: Pass as user_data and increment on enqueue_links.

6. **keepUrlFragments**: Check crawlee configuration options.

---

## Priority Order

1. **High Priority** (most commonly needed):
   - `maxResultsPerCrawl` - Essential for limiting output
   - `initialCookies` - Auth/bypass scenarios
   - `datasetName`/`keyValueStoreName`/`requestQueueName` - Storage flexibility

2. **Medium Priority**:
   - `maxCrawlingDepth` - Crawl scope control
   - `proxyRotation` - Better proxy management
   - `debugLog`/`browserLog` - Debugging support
   - `respectRobotsTxtFile` - Compliance

3. **Lower Priority** (edge cases):
   - `pseudoUrls` - Globs usually sufficient
   - `keepUrlFragments` - Rare use case
   - `ignoreCorsAndCsp` - Specific scraping needs
   - `sessionPoolName` - Cross-run optimization

---

# Push and Get Working

Automated workflow to push code directly to Apify platform, wait for build, fix any build errors until the build succeeds, and then run a test crawl to verify the actor works.

**Actor location:** `apps/contextractor/`

## Step 0: Run Local Tests (REQUIRED)

Before anything else, run local unit tests to catch issues early:

```
/local-tests:prompt
```

If any tests fail, fix the issues before proceeding. Do NOT continue with the push if tests fail.

---

## Pre-flight Checks (REQUIRED)

### 1. Verify Apify CLI Login

```bash
apify info
```

If not logged in, stop and inform the user to run `apify login` first.

### 2. Verify Actor Target

The `apify push` command uses:
- **Actor name** from `apps/contextractor/.actor/actor.json` (`name` field)
- **Logged-in user** to form `<username>/<actor-name>`

Check the current actor configuration:

```bash
cat apps/contextractor/.actor/actor.json | grep '"name"'
apify info
```

Proceed automatically with the push. Only ask for confirmation if there's a critical issue (e.g., not logged in).

### 3. Check Git Integration

If `apify info` shows the actor source is "Git repository", proceed anyway - the user invoked this command intentionally.

## Workflow

Execute this loop until the build succeeds:

### 1. Validate Locally First

Validate Python code compiles before pushing:

```bash
python3 -m compileall -q apps/contextractor/src/
```

If local validation fails, fix Python errors before proceeding.

### 2. Push to Apify

Deploy directly to Apify platform from the actor directory:

```bash
cd apps/contextractor && apify push
```

This uploads source code and triggers a build on Apify infrastructure.

### 3. Wait for Build

Poll build status:

```bash
# Wait for build to start processing
sleep 5

# Check build status
apify builds ls
```

Keep polling every 10-15 seconds until the latest build shows "Succeeded" or "Failed".

### 4. Check Build Result

If **SUCCEEDED**: Proceed to step 5 (Run Test Crawl).

If **FAILED**:
1. Fetch build log using the build ID from `apify builds ls`:
   ```bash
   apify builds log <BUILD_ID>
   ```

2. Analyze the error type:
   - Schema validation errors → Fix `apps/contextractor/.actor/*_schema.json` files
   - Dockerfile errors → Fix `apps/contextractor/Dockerfile`
   - Dependency errors → Fix `apps/contextractor/requirements.txt`, run `pip install -r apps/contextractor/requirements.txt`
   - Python syntax errors → Fix source files, run `python3 -m compileall -q apps/contextractor/src/`
   - Import errors → Check dependencies in `apps/contextractor/requirements.txt`

3. Apply fix locally

4. **Repeat from step 1** (validate locally and push again)

### 5. Run Test Crawl

After a successful build, run the actor with a single test URL to verify it works:

```bash
# Call the actor on the platform with test input
apify call --input '{"startUrls": [{"url": "https://en.wikipedia.org/wiki/List_of_sovereign_states"}], "maxPagesPerCrawl": 1}'
```

Wait for the run to complete. The `apify call` command will wait and show the output.

If **RUN SUCCEEDED**:
1. Check the dataset output:
   ```bash
   apify runs ls
   # Get the latest run ID, then:
   apify datasets get-items <DATASET_ID>
   ```
2. Report success with run URL and sample output to user.

If **RUN FAILED**:
1. Fetch run log:
   ```bash
   apify runs ls
   apify runs log <RUN_ID>
   ```
2. Analyze the error and fix the source code
3. **Repeat from step 1** (push and rebuild)

## Error Type Reference

| Error Pattern | Fix Location |
|--------------|--------------|
| `Invalid input schema` | `apps/contextractor/.actor/input_schema.json` |
| `Invalid output schema` | `apps/contextractor/.actor/output_schema.json` |
| `Invalid dataset schema` | `apps/contextractor/.actor/dataset_schema.json` |
| `COPY failed` | `apps/contextractor/Dockerfile` |
| `pip ERR` | `apps/contextractor/requirements.txt` |
| `SyntaxError:` | Python source files in `apps/contextractor/src/` |
| `IndentationError:` | Python source files in `apps/contextractor/src/` |
| `ModuleNotFoundError:` | Missing dependency in `apps/contextractor/requirements.txt` |
| `ImportError:` | Missing dependency or wrong import |

## Apify CLI Commands Reference

```bash
# Check login status and actor info
apify info

# Login to Apify (if needed)
apify login

# Push to Apify from actor directory (triggers build)
cd apps/contextractor && apify push

# Push to specific actor (override actor.json name)
cd apps/contextractor && apify push --actor-id <username>/<actor-name>

# List recent builds
apify builds ls

# Get build log
apify builds log <BUILD_ID>

# Run the actor locally
cd apps/contextractor && apify run

# Call the actor on platform (waits for completion)
apify call --input '{"startUrls": [{"url": "https://en.wikipedia.org/wiki/List_of_sovereign_states"}], "maxPagesPerCrawl": 1}'

# List recent runs
apify runs ls

# Get run log
apify runs log <RUN_ID>

# Get dataset items from a run
apify datasets get-items <DATASET_ID>
```

## Success Criteria

The workflow completes when:
- Pre-flight checks pass (logged in)
- Local `python3 -m compileall -q apps/contextractor/src/` passes
- `apify push` succeeds
- Build status is `SUCCEEDED`
- No errors in build log
- Test crawl run completes successfully
- Dataset contains at least one item with extracted content

Report the final URLs to the user:
- Build: `https://console.apify.com/actors/<actorId>/builds/<buildId>`
- Run: `https://console.apify.com/actors/<actorId>/runs/<runId>`

## Restoring Git Integration

If you need to restore Git integration after using this command:
1. Go to Apify Console → Actor Settings → Source
2. Change source type back to "Git repository"
3. Re-link the repository URL and branch

---

# Test Suites Management

## Step 1: Review Existing Test Suites

Check `/Users/miroslavsekera/r/contextractor/tools/platform-test-runner/test-suites` and remove any test suites that aren't applicable for this actor.

## Step 2: Add Test Suites for New Functionality

Add new test suites for the new functionality you added during implementation.

## Step 3: Comprehensive Test Coverage

Check again the input schema and functionality. Add test suites for each input field and feature to ensure comprehensive coverage.

## Constraints

Do NOT add any expensive tests such as:
- Testing through residential proxy
- Downloading high number of pages
- Any tests that would incur significant platform costs
