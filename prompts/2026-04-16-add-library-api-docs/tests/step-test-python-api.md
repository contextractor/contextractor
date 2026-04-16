# Test: Python API Section

References: `implementation/step-add-python-api.md`

## Review

- Read `packages/contextractor_engine/src/contextractor_engine/extractor.py` and `models.py`
- Cross-check every class name, method name, and parameter in the README examples
- Verify `TrafilaturaConfig` field names use snake_case (Python convention)
- Verify `ExtractionResult` and `MetadataResult` field access patterns are correct
- Check that the engine README expansion matches the actual API

## Autofix

Fix any wrong class names, method signatures, or field names.
