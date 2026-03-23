# Contextractor: Migrate to uv workspace monorepo

Restructure `/Users/miroslavsekera/r/contextractor/` from flat requirements.txt project into a **uv workspace** monorepo with two sub-projects.

## Target Structure

```
/Users/miroslavsekera/r/contextractor/
├── pyproject.toml              # Root workspace config
├── uv.lock                     # Unified lockfile
├── .python-version             # Pin Python 3.12
├── packages/
│   └── contextractor-engine/
│       ├── pyproject.toml      # Library package config
│       ├── src/
│       │   └── contextractor_engine/
│       │       ├── __init__.py
│       │       ├── extractor.py      # Core extraction wrapper
│       │       ├── models.py         # TrafilaturaConfig + result types
│       │       ├── utils.py          # Key normalization (camelCase → snake_case)
│       │       └── py.typed
│       └── tests/
│           └── test_extractor.py
├── apps/
│   └── contextractor/          # Existing actor (migrated)
│       ├── pyproject.toml      # Actor-specific deps + workspace ref
│       ├── .actor/             # Unchanged
│       ├── Dockerfile          # Updated for uv
│       └── src/                # Refactored to use engine
├── docs/
├── tools/
└── prompts/
```

## Phase 1: Root workspace setup

Create root `pyproject.toml`:

```toml
[project]
name = "contextractor-workspace"
version = "0.1.0"
requires-python = ">=3.12"

[tool.uv.workspace]
members = ["packages/*", "apps/*"]
```

Create `.python-version` with `3.12`.

Run `uv sync` to generate `uv.lock`.

## Phase 2: Engine package — `packages/contextractor-engine/`

### Package config

```toml
[project]
name = "contextractor-engine"
version = "0.1.0"
description = "Trafilatura extraction wrapper with configurable options"
requires-python = ">=3.12"
dependencies = [
    "trafilatura>=2.0.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/contextractor_engine"]
```

### TrafilaturaConfig model — `models.py`

Use a **dataclass** (not Pydantic — keep deps minimal for a library). Name: `TrafilaturaConfig` (library-specific, allows future additions like `ReadabilityConfig`).

Map all **non-deprecated** `trafilatura.extract()` parameters:

| Field | Type | Default | Trafilatura param |
|-------|------|---------|-------------------|
| `fast` | `bool` | `False` | `fast` |
| `favor_precision` | `bool` | `False` | `favor_precision` |
| `favor_recall` | `bool` | `False` | `favor_recall` |
| `include_comments` | `bool` | `True` | `include_comments` |
| `include_tables` | `bool` | `True` | `include_tables` |
| `include_images` | `bool` | `False` | `include_images` |
| `include_formatting` | `bool` | `True` | `include_formatting` |
| `include_links` | `bool` | `True` | `include_links` |
| `deduplicate` | `bool` | `False` | `deduplicate` |
| `target_language` | `str \| None` | `None` | `target_language` |
| `with_metadata` | `bool` | `True` | `with_metadata` |
| `only_with_metadata` | `bool` | `False` | `only_with_metadata` |
| `tei_validation` | `bool` | `False` | `tei_validation` |
| `prune_xpath` | `str \| list[str] \| None` | `None` | `prune_xpath` |
| `url_blacklist` | `set[str] \| None` | `None` | `url_blacklist` |
| `author_blacklist` | `set[str] \| None` | `None` | `author_blacklist` |
| `date_extraction_params` | `dict[str, Any] \| None` | `None` | `date_extraction_params` |

**Excluded (deprecated):** `no_fallback` (use `fast`), `as_dict` (use `.as_dict()`), `max_tree_size` (use settings.cfg), `settingsfile`, `config`, `options` (internal).

Also exclude from the config: `url` (passed per-call), `record_id` (passed per-call), `output_format` (determined by caller).

Provide **factory methods** for convenience:

```python
@dataclass
class TrafilaturaConfig:
    # ... fields above with defaults ...

    @classmethod
    def balanced(cls) -> "TrafilaturaConfig":
        """Default balanced extraction."""
        return cls()

    @classmethod
    def precision(cls) -> "TrafilaturaConfig":
        """High precision, less noise."""
        return cls(favor_precision=True)

    @classmethod
    def recall(cls) -> "TrafilaturaConfig":
        """High recall, more content."""
        return cls(favor_recall=True)

    def to_trafilatura_kwargs(self) -> dict[str, Any]:
        """Convert to trafilatura.extract() keyword arguments.
        Excludes url, record_id, output_format — those are per-call.
        Only includes optional params if they are set (not None)."""
        kwargs: dict[str, Any] = {
            "fast": self.fast,
            "favor_precision": self.favor_precision,
            "favor_recall": self.favor_recall,
            "include_comments": self.include_comments,
            "include_tables": self.include_tables,
            "include_images": self.include_images,
            "include_formatting": self.include_formatting,
            "include_links": self.include_links,
            "deduplicate": self.deduplicate,
            "with_metadata": self.with_metadata,
            "only_with_metadata": self.only_with_metadata,
            "tei_validation": self.tei_validation,
        }
        # Only include optional params if set
        if self.target_language is not None:
            kwargs["target_language"] = self.target_language
        if self.prune_xpath is not None:
            kwargs["prune_xpath"] = self.prune_xpath
        if self.url_blacklist is not None:
            kwargs["url_blacklist"] = self.url_blacklist
        if self.author_blacklist is not None:
            kwargs["author_blacklist"] = self.author_blacklist
        if self.date_extraction_params is not None:
            kwargs["date_extraction_params"] = self.date_extraction_params
        return kwargs
```

### Config key normalization utility — `utils.py`

Add a utility function to normalize config keys from camelCase (API/JSON convention) to snake_case (Python/trafilatura convention). This allows consumers to send either format.

```python
"""Utility functions for contextractor-engine."""

import re
from typing import Any


def normalize_config_keys(config: dict[str, Any]) -> dict[str, Any]:
    """Normalize config dictionary keys to snake_case.

    Accepts both camelCase (JSON/API convention) and snake_case (Python convention).
    Auto-detects the format and converts camelCase to snake_case.
    Keys already in snake_case are left unchanged.

    Examples:
        {"favorPrecision": True} -> {"favor_precision": True}
        {"favor_precision": True} -> {"favor_precision": True}
        {"includeLinks": True, "fast": False} -> {"include_links": True, "fast": False}

    Args:
        config: Dictionary with config keys in either camelCase or snake_case.

    Returns:
        Dictionary with all keys normalized to snake_case.
    """
    if not config:
        return {}

    def to_snake_case(key: str) -> str:
        """Convert camelCase to snake_case. Leave snake_case unchanged."""
        # If already contains underscore, assume it's snake_case
        if "_" in key:
            return key
        # Convert camelCase to snake_case
        # Insert underscore before uppercase letters and lowercase them
        return re.sub(r"(?<!^)(?=[A-Z])", "_", key).lower()

    return {to_snake_case(k): v for k, v in config.items()}
```

**Usage:**

```python
from contextractor_engine import normalize_config_keys, TrafilaturaConfig

# API receives camelCase JSON from frontend
raw_config = {"favorPrecision": True, "includeLinks": False}

# Normalize to snake_case for TrafilaturaConfig
normalized = normalize_config_keys(raw_config)
# Result: {"favor_precision": True, "include_links": False}

config = TrafilaturaConfig(**normalized)
```

Update `__init__.py` to export `normalize_config_keys`:

```python
from .extractor import ContentExtractor
from .models import TrafilaturaConfig, ExtractionResult, MetadataResult
from .utils import normalize_config_keys

__all__ = [
    "ContentExtractor",
    "TrafilaturaConfig",
    "ExtractionResult",
    "MetadataResult",
    "normalize_config_keys",
]
```

### Result types — also in `models.py`

```python
@dataclass
class ExtractionResult:
    """Result from a single format extraction."""
    content: str
    output_format: str  # "txt", "json", "markdown", "xml", "xmltei"

@dataclass
class MetadataResult:
    """Extracted metadata from HTML."""
    title: str | None = None
    author: str | None = None
    date: str | None = None
    description: str | None = None
    sitename: str | None = None
    language: str | None = None
```

### Core extractor — `extractor.py`

**Important:** `trafilatura.bare_extraction()` returns a `Document` object with attributes, NOT a dict. Use `getattr()` to access fields.

```python
class ContentExtractor:
    """Trafilatura wrapper with configurable extraction."""

    DEFAULT_FORMATS = ["txt", "markdown", "json", "xml"]

    def __init__(self, config: TrafilaturaConfig | None = None) -> None:
        self.config = config or TrafilaturaConfig.balanced()

    def extract(
        self,
        html: str,
        url: str | None = None,
        output_format: str = "txt",
    ) -> ExtractionResult | None:
        """Extract content in specified format."""
        kwargs = self.config.to_trafilatura_kwargs()
        result = trafilatura.extract(
            html,
            url=url,
            output_format=output_format,
            **kwargs,
        )
        if result is None:
            return None
        return ExtractionResult(content=result, output_format=output_format)

    def extract_metadata(self, html: str, url: str | None = None) -> MetadataResult:
        """Extract metadata from HTML.

        Note: bare_extraction returns a Document object with attributes,
        not a dict. Use getattr() to access fields safely.
        """
        raw = trafilatura.bare_extraction(html, url=url, with_metadata=True)
        if not raw:
            return MetadataResult()  # All fields default to None
        # bare_extraction returns a Document object with attributes
        return MetadataResult(
            title=getattr(raw, "title", None),
            author=getattr(raw, "author", None),
            date=getattr(raw, "date", None),
            description=getattr(raw, "description", None),
            sitename=getattr(raw, "sitename", None),
            language=getattr(raw, "language", None),
        )

    def extract_all_formats(
        self,
        html: str,
        url: str | None = None,
        formats: list[str] | None = None,
    ) -> dict[str, ExtractionResult]:
        """Extract content in multiple formats at once.
        Default formats: ["txt", "markdown", "json", "xml"]
        Returns dict keyed by format name. Failed extractions are omitted."""
        formats = formats or self.DEFAULT_FORMATS
        results: dict[str, ExtractionResult] = {}
        for fmt in formats:
            result = self.extract(html, url=url, output_format=fmt)
            if result is not None:
                results[fmt] = result
        return results
```

### Public API — `__init__.py`

```python
from .extractor import ContentExtractor
from .models import TrafilaturaConfig, ExtractionResult, MetadataResult
from .utils import normalize_config_keys

__all__ = [
    "ContentExtractor",
    "TrafilaturaConfig",
    "ExtractionResult",
    "MetadataResult",
    "normalize_config_keys",
]
```

## Phase 3: Actor migration — `apps/contextractor/`

### Actor package config

**Note:** Pin browserforge to avoid API compatibility issues with crawlee.

```toml
[project]
name = "contextractor"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "apify>=2.0.0,<4.0.0",
    "crawlee[playwright]>=0.4.0",
    "contextractor-engine",
    "browserforge<1.2.4",
]

[tool.uv.sources]
contextractor-engine = { workspace = true }

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src"]
```

Delete `requirements.txt`.

### Replace `extractionMode` with `trafilaturaConfig`

In `input_schema.json`, replace the `extractionMode` field with:

```json
"trafilaturaConfig": {
    "sectionCaption": "Content extraction",
    "title": "Trafilatura options",
    "type": "object",
    "description": "Trafilatura library extraction settings. Leave empty for balanced defaults. Keys: fast, favor_precision, favor_recall, include_comments, include_tables, include_images, include_formatting, include_links, deduplicate, target_language, with_metadata, only_with_metadata, tei_validation, prune_xpath.",
    "editor": "json",
    "default": {},
    "prefill": {}
}
```

The `trafilaturaConfig` object is **optional**. When empty `{}` or absent, defaults to `TrafilaturaConfig.balanced()`.

**Important:** The input accepts **camelCase** keys (JavaScript/JSON convention). The engine's `normalize_config_keys()` converts them to snake_case internally.

Supported JSON keys (camelCase for API, converted to snake_case internally):

```json
{
    "fast": false,
    "favorPrecision": false,
    "favorRecall": false,
    "includeComments": true,
    "includeTables": true,
    "includeImages": false,
    "includeFormatting": true,
    "includeLinks": true,
    "deduplicate": false,
    "targetLanguage": null,
    "withMetadata": true,
    "onlyWithMetadata": false,
    "teiValidation": false,
    "pruneXpath": null,
    "urlBlacklist": null,
    "authorBlacklist": null
}
```

### Refactor `src/config.py`

**Important:** Crawlee's `Request.user_data` must be JSON-serializable. Pass the raw config dict, not an `TrafilaturaConfig` object. Build the `TrafilaturaConfig` in the handler.

```python
from contextractor_engine import TrafilaturaConfig, normalize_config_keys

def build_trafilatura_config(raw: dict[str, Any] | None) -> TrafilaturaConfig:
    """Build TrafilaturaConfig from raw dict.

    Accepts both camelCase (from JSON API) and snake_case keys.
    """
    if not raw:
        return TrafilaturaConfig.balanced()
    # Normalize keys (camelCase → snake_case) and filter out None values
    normalized = normalize_config_keys(raw)
    filtered = {k: v for k, v in normalized.items() if v is not None}
    return TrafilaturaConfig(**filtered)

def build_crawl_config(actor_input: dict[str, Any]) -> dict[str, Any]:
    """Build crawl configuration from actor input.

    Note: trafilatura_config_raw is passed as dict for JSON serialization in user_data.
    The TrafilaturaConfig object is built in the handler.
    """
    return {
        'save_raw_html': actor_input.get('saveRawHtmlToKeyValueStore', False),
        'save_text': actor_input.get('saveExtractedTextToKeyValueStore', False),
        'save_json': actor_input.get('saveExtractedJsonToKeyValueStore', False),
        'save_markdown': actor_input.get('saveExtractedMarkdownToKeyValueStore', True),
        'save_xml': actor_input.get('saveExtractedXmlToKeyValueStore', False),
        'save_xmltei': actor_input.get('saveExtractedXmlTeiToKeyValueStore', False),
        'trafilatura_config_raw': actor_input.get('trafilaturaConfig', {}),  # Raw dict for JSON serialization
        'globs': actor_input.get('globs', []),
        'excludes': actor_input.get('excludes', []),
        'link_selector': actor_input.get('linkSelector', ''),
        'pseudo_urls': actor_input.get('pseudoUrls', []),
        'keep_url_fragments': actor_input.get('keepUrlFragments', False),
        'max_crawling_depth': actor_input.get('maxCrawlingDepth', 0),
    }
```

### Refactor `src/handler.py`

Build `TrafilaturaConfig` from raw dict in the handler:

```python
from contextractor_engine import ContentExtractor, TrafilaturaConfig, normalize_config_keys

# In handler:
handler_config = context.request.user_data.get('config', {})
trafilatura_config_raw = handler_config.get('trafilatura_config_raw', {})

if trafilatura_config_raw:
    # Normalize keys (camelCase → snake_case) and filter None values
    normalized = normalize_config_keys(trafilatura_config_raw)
    filtered = {k: v for k, v in normalized.items() if v is not None}
    trafilatura_config = TrafilaturaConfig(**filtered)
else:
    trafilatura_config = TrafilaturaConfig.balanced()

extractor = ContentExtractor(config=trafilatura_config)

# In extraction:
result = extractor.extract(html, url=url, output_format="markdown")
metadata = extractor.extract_metadata(html, url=url)
```

### Refactor `src/extraction.py`

Replace direct `trafilatura` calls with `ContentExtractor`:

```python
from contextractor_engine import ContentExtractor, TrafilaturaConfig

def extract_metadata(html: str, url: str, extractor: ContentExtractor) -> dict[str, Any]:
    """Extract metadata from HTML."""
    result = extractor.extract_metadata(html, url=url)
    metadata = {
        'title': result.title,
        'author': result.author,
        'publishedAt': result.date,
        'description': result.description,
        'siteName': result.sitename,
        'lang': result.language,
    }
    # Fallback: extract lang from <html lang="..."> if not found
    if not metadata['lang']:
        lang_match = re.search(r'<html[^>]*\slang=["\']([^"\']+)["\']', html, re.IGNORECASE)
        if lang_match:
            metadata['lang'] = lang_match.group(1)
    return metadata

def extract_format(
    html: str,
    output_format: str,
    extractor: ContentExtractor,
    url: str | None = None,
) -> str | None:
    """Extract content in specified format."""
    result = extractor.extract(html, url=url, output_format=output_format)
    return result.content if result else None
```

Remove `get_extraction_options()` — replaced by `TrafilaturaConfig.to_trafilatura_kwargs()`.
Keep `save_content_to_kvs()` and `compute_content_info()` in the actor (storage is actor-specific).

### Update Dockerfile for uv

```dockerfile
FROM apify/actor-python-playwright:3.14-1.57.0

USER myuser

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy workspace root files
COPY --chown=myuser:myuser pyproject.toml uv.lock ./

# Copy engine package
COPY --chown=myuser:myuser packages/contextractor-engine/ ./packages/contextractor-engine/

# Copy actor package
COPY --chown=myuser:myuser apps/contextractor/ ./apps/contextractor/

# Install dependencies
RUN uv sync --frozen --no-dev --directory apps/contextractor

# Compile
RUN python3 -m compileall -q apps/contextractor/src/

WORKDIR /home/myuser/apps/contextractor
CMD ["uv", "run", "python3", "-m", "src"]
```

Update `.actor/actor.json` dockerfile path: `"dockerfile": "../../Dockerfile"` — since the Dockerfile now lives at root level to access workspace. Alternatively, keep Dockerfile in `apps/contextractor/` with adjusted COPY paths that reference `../../packages/`. Choose the approach that works best with Apify's build system (which uses the actor directory as build context).

**Important**: Apify builds from the actor's directory as Docker context. If using monorepo source on Apify platform, the Git URL must point to repo root with the actor path specified. The Dockerfile must be relative to the build context. Consider keeping the Dockerfile in the actor directory and using `../../` relative paths, OR set the build context at repo root level.

## Phase 4: Build script for engine package

Add `scripts/build-engine.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Building contextractor-engine..."
uv build --package contextractor-engine --out-dir dist/

echo "Done. Artifacts in dist/"
ls -la dist/
```

This produces standard `.whl` and `.tar.gz` in `dist/` — pip-installable from anywhere:

```bash
pip install dist/contextractor_engine-0.1.0-py3-none-any.whl
```

Make executable: `chmod +x scripts/build-engine.sh`

## Phase 5: Update docs/spec

### `docs/spec/tech-spec.md`

Update to reflect:

- **Stack**: Add uv workspace, hatchling build system
- **Architecture**: Two-package monorepo — engine (library) + actor (app)
- **Dependencies**: Engine depends on trafilatura only; Actor depends on engine + apify + crawlee
- **Build**: `uv build --package contextractor-engine` for distribution
- **TrafilaturaConfig**: Replaces `extractionMode` enum. Dataclass mapping to trafilatura.extract() params.
- **Docker**: uv-based install with frozen lockfile
- Remove `requirements.txt` references

### `docs/spec/functional-spec.md`

Update to reflect:

- Replace `extractionMode` row with `trafilaturaConfig` (optional JSON object, defaults to balanced)
- Document available config fields with types and defaults
- Note backward compatibility: `{}` or omitted = same as previous `BALANCED` mode
- Mention that `favor_precision: true` = previous `FAVOR_PRECISION`, `favor_recall: true` = previous `FAVOR_RECALL`

## Execution Order

1. Initialize uv workspace at root (`pyproject.toml`, `.python-version`)
2. Create `packages/contextractor-engine/` with package structure
3. Implement `models.py` (TrafilaturaConfig, ExtractionResult, MetadataResult)
4. Implement `utils.py` (normalize_config_keys)
5. Implement `extractor.py` (ContentExtractor)
6. Write basic tests for engine
7. Migrate `apps/contextractor/` to use workspace dependency
8. Refactor actor to use `ContentExtractor` instead of direct trafilatura calls
9. Replace `extractionMode` with `trafilaturaConfig` in input schema
10. Update Dockerfile for uv
11. Create `scripts/build-engine.sh`
12. Run `uv sync` and verify everything resolves
13. Update `docs/spec/tech-spec.md` and `docs/spec/functional-spec.md`
14. Delete `apps/contextractor/requirements.txt`

## Phase 6: Testing

### Local Testing

Test the actor locally on a single page to verify basic functionality:

```bash
# Create test input
mkdir -p apps/contextractor/storage/key_value_stores/default
cat > apps/contextractor/storage/key_value_stores/default/INPUT.json << 'EOF'
{
    "startUrls": [{"url": "https://blog.apify.com/what-is-web-scraping/"}],
    "maxPagesPerCrawl": 1,
    "saveExtractedMarkdownToKeyValueStore": true,
    "trafilaturaConfig": {}
}
EOF

# Run locally
uv run --directory apps/contextractor python -m src
```

**Expected output:**
- Actor initializes and processes the URL
- Markdown file saved to key-value store
- Dataset entry with metadata (title, author, date, etc.)
- No errors in console

**Test with trafilaturaConfig options:**
```json
{
    "startUrls": [{"url": "https://example.com"}],
    "maxPagesPerCrawl": 1,
    "trafilaturaConfig": {
        "favorPrecision": true,
        "includeLinks": false
    }
}
```

### Platform Testing

After local testing passes, run the full platform test suite on Apify:

```bash
# Run the sync-and-test command
/platform-tests:sync-and-test
```

This command will:
1. Review actor configuration against test suites
2. Sync test suite settings with current input schema
3. Run all test suites on Apify platform
4. Analyze and fix any failures
5. Generate analysis report

**Test suites location:** `tools/platform-test-runner/test-suites/`

### Success Criteria

- [ ] Local test extracts content successfully
- [ ] Metadata extracted (title, author, date, etc.)
- [ ] trafilaturaConfig options are respected
- [ ] Platform tests pass on Apify
- [ ] No regressions in existing functionality

## Phase 7: Commit and Push

After all tests pass:

```bash
# Stage all changes
git add -A

# Commit with descriptive message
git commit -m "Migrate to uv workspace monorepo with contextractor-engine package

- Create packages/contextractor-engine/ with TrafilaturaConfig, ContentExtractor
- Add normalize_config_keys() for camelCase → snake_case conversion
- Replace extractionMode with trafilaturaConfig in actor input schema
- Update Dockerfile for uv-based installation
- Add build script for engine wheel distribution

Breaking change: extractionMode replaced with trafilaturaConfig JSON object.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

# Push to remote
git push
```

## Implementation Notes (from testing)

These notes were added after implementing and testing the migration:

1. **trafilatura.bare_extraction() returns Document object**: Not a dict. Use `getattr(raw, "field", None)` instead of `raw.get("field")`.

2. **Crawlee Request.user_data must be JSON-serializable**: Cannot pass `TrafilaturaConfig` dataclass directly. Store raw dict as `trafilatura_config_raw` and build `TrafilaturaConfig` in the handler.

3. **browserforge version compatibility**: crawlee's browserforge workaround may break with newer versions. Pin `browserforge<1.2.4` in actor dependencies.

4. **MetadataResult fields**: Use dataclass defaults (`= None`) so empty result can be instantiated with `MetadataResult()`.

5. **to_trafilatura_kwargs()**: Only include optional params (target_language, prune_xpath, etc.) if they're not None to avoid passing unnecessary None values to trafilatura.
