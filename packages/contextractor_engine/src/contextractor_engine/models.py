"""Data models for contextractor-engine."""

from dataclasses import dataclass, field, fields
from typing import Any

from .utils import normalize_config_keys, to_camel_case


@dataclass
class TrafilaturaConfig:
    """Configuration for trafilatura extraction.

    Maps all non-deprecated trafilatura.extract() parameters.
    Excluded (deprecated): no_fallback, as_dict, max_tree_size, settingsfile, config, options.
    Excluded (per-call): url, record_id, output_format.
    """

    fast: bool = False
    favor_precision: bool = False
    favor_recall: bool = False
    include_comments: bool = True
    include_tables: bool = True
    include_images: bool = False
    include_formatting: bool = True
    include_links: bool = True
    deduplicate: bool = False
    target_language: str | None = None
    with_metadata: bool = True
    only_with_metadata: bool = False
    tei_validation: bool = False
    prune_xpath: str | list[str] | None = None
    url_blacklist: set[str] | None = field(default=None)
    author_blacklist: set[str] | None = field(default=None)
    date_extraction_params: dict[str, Any] | None = None

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
        Only includes optional params if they are set (not None).
        """
        return {
            f.name: getattr(self, f.name)
            for f in fields(self)
            if getattr(self, f.name) is not None
        }

    def to_json_dict(self) -> dict[str, Any]:
        """Convert config to JSON-serializable dict with camelCase keys.

        Used for API responses and GUI defaults.
        Excludes None values. Sets are converted to lists for JSON compatibility.
        """
        result: dict[str, Any] = {}
        for f in fields(self):
            value = getattr(self, f.name)
            if value is None:
                continue
            if isinstance(value, set):
                value = list(value)
            result[to_camel_case(f.name)] = value
        return result

    @classmethod
    def from_json_dict(cls, data: dict[str, Any] | None) -> "TrafilaturaConfig":
        """Create config from a camelCase (or snake_case) dict.

        This is the single canonical way to build a TrafilaturaConfig from
        external input (JSON, YAML, API). Handles key normalization, None
        filtering, and type coercion (lists → sets for blacklist fields).
        Unknown keys are ignored. Returns balanced defaults for empty/None input.
        """
        if not data:
            return cls.balanced()
        normalized = normalize_config_keys(data)
        valid_fields = {f.name for f in fields(cls)}
        kwargs: dict[str, Any] = {}
        for key, value in normalized.items():
            if key not in valid_fields or value is None:
                continue
            if isinstance(value, list):
                f = next(f for f in fields(cls) if f.name == key)
                if "set" in str(f.type):
                    value = set(value)
            kwargs[key] = value
        return cls(**kwargs)

    @classmethod
    def get_default_json(cls) -> dict[str, Any]:
        """Get default config as JSON-serializable dict with camelCase keys."""
        return cls().to_json_dict()


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
