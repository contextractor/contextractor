# Step: Add Python Library API to README

## TLDR

Add a "Python API" section to `README.md` showing how to use `contextractor_engine` programmatically for content extraction.

References: `add-library-api-docs-notes/current-docs-inventory.md`

## Instructions

### Read the actual API source

Read these files to get exact signatures:
- `/packages/contextractor_engine/src/contextractor_engine/__init__.py` — exports
- `/packages/contextractor_engine/src/contextractor_engine/extractor.py` — `ContentExtractor` class
- `/packages/contextractor_engine/src/contextractor_engine/models.py` — `TrafilaturaConfig`, `ExtractionResult`, `MetadataResult`

### Add section to README.md

After the "Node.js API" section, add a "## Python API" section covering:

- Install: `pip install contextractor-engine`
- Basic extraction:
  ```python
  from contextractor_engine import ContentExtractor
  extractor = ContentExtractor()
  result = extractor.extract(html, output_format="markdown")
  ```
- With config:
  ```python
  from contextractor_engine import ContentExtractor, TrafilaturaConfig
  config = TrafilaturaConfig(favor_precision=True, include_tables=True)
  extractor = ContentExtractor(config=config)
  ```
- Metadata extraction: `extractor.extract_metadata(html, url=url)`
- Available output formats: `txt`, `markdown`, `json`, `xml`, `xmltei`
- Link to the `contextractor_engine` package README for full API reference
