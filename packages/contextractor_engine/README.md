# contextractor-engine

Trafilatura extraction wrapper with configurable options. Used by [contextractor](https://pypi.org/project/contextractor/) CLI and [Apify actor](https://apify.com/glueo/contextractor).

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

## License

Apache-2.0
