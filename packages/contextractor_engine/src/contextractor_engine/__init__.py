"""Contextractor Engine - Trafilatura extraction wrapper with configurable options."""

from typing import Any

from .extractor import ContentExtractor
from .models import ExtractionResult, MetadataResult, TrafilaturaConfig
from .utils import normalize_config_keys


def get_default_config() -> dict[str, Any]:
    """Get default TrafilaturaConfig as JSON dict (camelCase keys)."""
    return TrafilaturaConfig.get_default_json()


__all__ = [
    "ContentExtractor",
    "TrafilaturaConfig",
    "ExtractionResult",
    "MetadataResult",
    "normalize_config_keys",
    "get_default_config",
]
