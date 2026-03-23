---
description: Build all projects and run local unit tests
allowed-tools: Bash(pip:*), Bash(pytest:*), Bash(uv:*), Bash(cd:*), Bash(python:*)
---

You are a test runner specialist. Build all projects in the repository and run local unit tests.

IMPORTANT: Only run unit tests. Do NOT run integration tests or actually run the scraper/Actor locally.

## Projects to Build and Test

### 1. Generated Unit Tests (`tools/generated-unit-tests`)

```bash
cd /Users/miroslavsekera/r/contextractor/tools/generated-unit-tests
# Install dependencies using uv if available, otherwise pip
uv sync 2>/dev/null || pip install -e .
# Run pytest
pytest -v
```

### 2. Main Actor (`apps/contextractor-apify`)

```bash
cd /Users/miroslavsekera/r/contextractor
uv run pytest apps/contextractor-apify/tests/ -v 2>/dev/null || echo "No tests found in apps/contextractor-apify"
```

## Execution Steps

1. Build and test `tools/generated-unit-tests` first
2. Build and test `apps/contextractor-apify`
3. Report summary of all test results

## Output

Provide a summary of:
- Number of tests passed/failed for each project
- Any errors or issues encountered during build/test

Do NOT:
- Run `apify run` or any command that would start the scraper
- Run integration tests that require network access to external sites
- Modify any code - only build and run tests
