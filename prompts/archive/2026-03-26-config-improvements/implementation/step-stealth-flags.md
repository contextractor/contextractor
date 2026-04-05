# Step 1: Add Anti-Detection Chromium Flags

## TLDR

Add `--disable-blink-features=AutomationControlled` to default Chromium browser args. This prevents `navigator.webdriver=true` detection, which is the most common fingerprinting vector for Playwright-based scrapers.

## Reference

- Industry research: `prompts/2026-03-26-config-review/config-review-notes/industry-practices.md`
- ZenRows guide on disable-blink-features

## Files to Change

### 1. Standalone CLI (`apps/contextractor-standalone/src/contextractor_cli/crawler.py`)

In `_build_browser_launch_options()`, add to default Chromium args:
- `--disable-blink-features=AutomationControlled`

Only add for Chromium (not Firefox).

### 2. Apify Actor (`apps/contextractor-apify/src/config.py`)

In `build_browser_launch_options()`, add the same flag to the `args` list alongside `--disable-gpu`.

## Validation

Run the CLI and verify via browser console that `navigator.webdriver` returns `undefined` instead of `true`.
