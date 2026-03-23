---
description: Generate pytest unit tests from platform test runner results
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, WebFetch
model: sonnet
---

# Generate Unit Tests Command

Generate self-contained pytest unit tests from platform test runner results.

## Process

### Phase 0: Check Prerequisites

Verify `tools/platform-test-runner/test-suites-output/` exists and contains test results.

If directory is missing or empty, **STOP** and tell the user:

> Test output not found. Run `/platform-tests:run-and-fix` first to generate test results.

### Phase 1: Collect Test Data

For each test suite in `tools/platform-test-runner/test-suites-output/`:

1. Read `result.json` to get test case status
2. Read `dataset-item.json` to get:
   - `rawHtml.url` - URL to fetch raw HTML (required for unit test)
   - `extractedMarkdown` - expected markdown output
   - `metadata` - expected metadata

3. Read corresponding `tools/platform-test-runner/test-suites/{suite}/settings.json` for extraction options

Skip test cases that:
- Have status "error"
- Don't have `rawHtml.url` (raw HTML not saved with `exportHtml: true`)

### Phase 2: Setup Test Directory

Create test directory structure at `tools/generated-unit-tests/`:

```
tools/generated-unit-tests/
├── conftest.py          # Shared fixtures
├── fixtures/            # Raw HTML fixtures
│   └── {suite}/
│       └── {test-case}.html
└── tests/
    └── test_{suite}.py  # Test file per suite
```

### Phase 3: Generate Fixtures

For each valid test case:
1. Fetch raw HTML from `rawHtml.url` using WebFetch
2. Save to `tools/generated-unit-tests/fixtures/{suite}/{test-case}.html`

### Phase 4: Generate Test Files

Create `tools/generated-unit-tests/conftest.py`:

```python
import pytest
from pathlib import Path

FIXTURES_DIR = Path(__file__).parent / "fixtures"

@pytest.fixture
def fixtures_dir():
    return FIXTURES_DIR
```

For each suite, create `tools/generated-unit-tests/tests/test_{suite}.py`:

```python
import pytest
import trafilatura
from pathlib import Path

FIXTURES_DIR = Path(__file__).parent.parent / "fixtures"


class TestSuiteName:
    """Tests for {suite} configuration."""

    def test_case_name_metadata(self):
        """Test metadata extraction for {test-case}."""
        html_path = FIXTURES_DIR / "{suite}" / "{test-case}.html"
        html = html_path.read_text(encoding="utf-8")

        result = trafilatura.bare_extraction(html, url="{url}", with_metadata=True)

        assert result is not None
        assert result.title == "{expected_title}"
        # Add more assertions based on expected metadata

    def test_case_name_content(self):
        """Test content extraction for {test-case}."""
        html_path = FIXTURES_DIR / "{suite}" / "{test-case}.html"
        html = html_path.read_text(encoding="utf-8")

        markdown = trafilatura.extract(html, output_format="markdown", url="{url}")

        assert markdown is not None
        assert len(markdown) > 1000  # Sanity check for content length
```

### Phase 5: Map Settings to Trafilatura Options

Map actor input settings to trafilatura extraction options:

| Actor Setting | Trafilatura Option |
|---------------|-------------------|
| `extractionMode: FAVOR_PRECISION` | `favor_precision=True` |
| `extractionMode: FAVOR_RECALL` | `favor_recall=True` |
| `extractionMode: BALANCED` | (default) |
| `includeMetadata` | `with_metadata=True` |

### Phase 6: Create pyproject.toml

Create `tools/generated-unit-tests/pyproject.toml`:

```toml
[project]
name = "contextractor-unit-tests"
version = "0.1.0"
requires-python = ">=3.10"
dependencies = [
    "pytest>=8.0.0",
    "trafilatura>=2.0.0",
]

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
```

### Phase 7: Run Tests

```bash
cd tools/unit-tests && pip install -e . && pytest -v
```

### Phase 8: Fix Errors

If tests fail:
1. Analyze failure messages
2. Adjust expected values or test logic
3. Re-run tests

## Notes

- Raw HTML is stored as fixture files, not inline constants
- The `rawHtml.url` has a signature that may expire; fetch during generation
- Focus on metadata extraction tests - content matching is too brittle
- Use `assert result.title == expected` for exact matches
- Use `assert expected_substring in result.text` for partial content checks

## Enabling More Test Cases

Currently only test suites with `exportHtml: true` can generate unit tests.

To enable more tests:
1. Add `"exportHtml": true` to `tools/platform-test-runner/test-suites/{suite}/settings.json`
2. Re-run platform tests: `cd tools/platform-test-runner && npm run test:run:all`
3. Re-run this command to generate unit tests from the new data
