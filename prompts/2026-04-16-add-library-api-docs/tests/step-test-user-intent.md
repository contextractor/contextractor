# Test: User Intent Validation

References: `user-entry-log/entry-initial-prompt.md`

## Requirements from initial prompt

- **"add into the docs (all md files) also info how to call actual lib methods"** → Verify:
  - Root README has Node.js API section with `extract()` usage
  - Root README has Python API section with `ContentExtractor` usage
  - Engine README expanded with more examples
  - Standalone README synced with root
- **"how to call docker via the api"** → Verify:
  - Docker section expanded with Node.js subprocess example
  - Docker section expanded with Python subprocess example

## Validation

For each requirement, grep the README files to confirm the sections exist and contain working code examples.

## Autofix

Fix any gaps — add missing sections or examples.
