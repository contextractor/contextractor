# contextractor-engine

Trafilatura extraction wrapper with configurable options. Used by [contextractor](https://www.contextractor.com/help/pypi/) CLI and [Apify actor](https://www.contextractor.com/help/apify/).

## Install

```bash
pip install contextractor-engine
```

## Usage

```python
from contextractor_engine import ContentExtractor, TrafilaturaConfig

config = TrafilaturaConfig(favor_precision=True, include_tables=True)
extractor = ContentExtractor(config=config)

result = extractor.extract(html, url="https://example.com", output_format="markdown")
print(result.content)
```

### Metadata Extraction

```python
from contextractor_engine import ContentExtractor

extractor = ContentExtractor()
meta = extractor.extract_metadata(html, url="https://example.com")
print(meta.title)        # Page title
print(meta.author)       # Author name
print(meta.date)         # Publication date
print(meta.description)  # Meta description
print(meta.sitename)     # Site name
print(meta.language)     # Content language
```

### Multiple Output Formats

```python
results = extractor.extract_all_formats(html, url="https://example.com")
for fmt, result in results.items():
    print(f"--- {fmt} ---")
    print(result.content[:200])
```

Default formats: `txt`, `markdown`, `json`, `xml`. Pass a custom list:

```python
results = extractor.extract_all_formats(html, formats=["markdown", "json"])
```

### TrafilaturaConfig Options

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `fast` | bool | `False` | Fast mode (less thorough) |
| `favor_precision` | bool | `False` | High precision, less noise |
| `favor_recall` | bool | `False` | High recall, more content |
| `include_comments` | bool | `True` | Include comments |
| `include_tables` | bool | `True` | Include tables |
| `include_images` | bool | `False` | Include images |
| `include_formatting` | bool | `True` | Preserve formatting |
| `include_links` | bool | `True` | Include links |
| `deduplicate` | bool | `False` | Deduplicate content |
| `target_language` | str | `None` | Filter by language (e.g. `"en"`) |
| `with_metadata` | bool | `True` | Extract metadata |
| `only_with_metadata` | bool | `False` | Only return docs with metadata |
| `tei_validation` | bool | `False` | Validate TEI output |
| `prune_xpath` | str/list | `None` | XPath patterns to remove |

Factory methods: `TrafilaturaConfig.balanced()` (default), `TrafilaturaConfig.precision()`, `TrafilaturaConfig.recall()`

For CLI and Docker usage, see the [main README](https://github.com/contextractor/contextractor#readme).

## License

Apache-2.0
