# Add JSON Config Export to contextractor-engine

Add functions to export TrafilaturaConfig as JSON and create config from JSON for API/GUI consumption.

## Requirements

Add to `contextractor_engine`:
- `get_default_config()` - returns default TrafilaturaConfig as dict (camelCase keys for JSON)
- `config_to_json()` - converts TrafilaturaConfig instance to JSON-serializable dict

## Implementation

### Update `models.py`

Add methods to TrafilaturaConfig:

```python
def to_json_dict(self) -> dict[str, Any]:
    """Convert config to JSON-serializable dict with camelCase keys.

    Used for API responses and GUI defaults.
    Excludes None values and non-serializable types (sets converted to lists).
    """
    result: dict[str, Any] = {
        "fast": self.fast,
        "favorPrecision": self.favor_precision,
        "favorRecall": self.favor_recall,
        "includeComments": self.include_comments,
        "includeTables": self.include_tables,
        "includeImages": self.include_images,
        "includeFormatting": self.include_formatting,
        "includeLinks": self.include_links,
        "deduplicate": self.deduplicate,
        "withMetadata": self.with_metadata,
        "onlyWithMetadata": self.only_with_metadata,
        "teiValidation": self.tei_validation,
    }
    # Include optional fields only if set
    if self.target_language is not None:
        result["targetLanguage"] = self.target_language
    if self.prune_xpath is not None:
        result["pruneXpath"] = self.prune_xpath
    if self.url_blacklist is not None:
        result["urlBlacklist"] = list(self.url_blacklist)
    if self.author_blacklist is not None:
        result["authorBlacklist"] = list(self.author_blacklist)
    if self.date_extraction_params is not None:
        result["dateExtractionParams"] = self.date_extraction_params
    return result

@classmethod
def get_default_json(cls) -> dict[str, Any]:
    """Get default config as JSON-serializable dict with camelCase keys."""
    return cls().to_json_dict()
```

### Update `__init__.py`

Export new function:

```python
from .models import TrafilaturaConfig

# Add convenience function
def get_default_config() -> dict[str, Any]:
    """Get default TrafilaturaConfig as JSON dict (camelCase keys)."""
    return TrafilaturaConfig.get_default_json()

__all__ = [
    "ContentExtractor",
    "TrafilaturaConfig",
    "ExtractionResult",
    "MetadataResult",
    "normalize_config_keys",
    "get_default_config",  # New export
]
```

### Add Tests

In `tests/test_models.py`:

```python
def test_to_json_dict_defaults():
    """Test that default config exports correctly."""
    config = TrafilaturaConfig()
    json_dict = config.to_json_dict()

    assert json_dict["fast"] == False
    assert json_dict["favorPrecision"] == False
    assert json_dict["includeComments"] == True
    assert json_dict["includeTables"] == True
    assert "targetLanguage" not in json_dict  # None values excluded

def test_to_json_dict_with_options():
    """Test config with custom options."""
    config = TrafilaturaConfig(
        favor_precision=True,
        target_language="en",
        url_blacklist={"spam.com", "ads.com"}
    )
    json_dict = config.to_json_dict()

    assert json_dict["favorPrecision"] == True
    assert json_dict["targetLanguage"] == "en"
    assert set(json_dict["urlBlacklist"]) == {"spam.com", "ads.com"}

def test_get_default_json():
    """Test module-level default export."""
    from contextractor_engine import get_default_config

    defaults = get_default_config()
    assert isinstance(defaults, dict)
    assert defaults["includeFormatting"] == True
```

## Expected Default JSON Output

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
  "withMetadata": true,
  "onlyWithMetadata": false,
  "teiValidation": false
}
```

## Verification

```bash
cd /Users/miroslavsekera/r/contextractor
uv run pytest packages/contextractor_engine/tests/ -v
uv run python -c "from contextractor_engine import get_default_config; import json; print(json.dumps(get_default_config(), indent=2))"
```
