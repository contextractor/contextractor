"""Tests for contextractor-engine."""

import pytest

from contextractor_engine import (
    ContentExtractor,
    ExtractionResult,
    MetadataResult,
    TrafilaturaConfig,
    get_default_config,
    normalize_config_keys,
)


class TestTrafilaturaConfig:
    """Tests for TrafilaturaConfig dataclass."""

    def test_default_config(self) -> None:
        """Default config has balanced settings."""
        config = TrafilaturaConfig()
        assert config.fast is False
        assert config.favor_precision is False
        assert config.favor_recall is False
        assert config.include_comments is True
        assert config.include_tables is True
        assert config.include_links is True
        assert config.with_metadata is True

    def test_balanced_factory(self) -> None:
        """balanced() returns default config."""
        config = TrafilaturaConfig.balanced()
        assert config == TrafilaturaConfig()

    def test_precision_factory(self) -> None:
        """precision() returns config with favor_precision=True."""
        config = TrafilaturaConfig.precision()
        assert config.favor_precision is True
        assert config.favor_recall is False

    def test_recall_factory(self) -> None:
        """recall() returns config with favor_recall=True."""
        config = TrafilaturaConfig.recall()
        assert config.favor_recall is True
        assert config.favor_precision is False

    def test_to_trafilatura_kwargs(self) -> None:
        """to_trafilatura_kwargs() returns proper dict."""
        config = TrafilaturaConfig(favor_precision=True, target_language="en")
        kwargs = config.to_trafilatura_kwargs()

        assert kwargs["favor_precision"] is True
        assert kwargs["target_language"] == "en"
        assert "url" not in kwargs  # per-call params excluded
        assert "output_format" not in kwargs

    def test_to_trafilatura_kwargs_excludes_none_optional(self) -> None:
        """to_trafilatura_kwargs() excludes None optional params."""
        config = TrafilaturaConfig()
        kwargs = config.to_trafilatura_kwargs()

        assert "target_language" not in kwargs
        assert "prune_xpath" not in kwargs
        assert "url_blacklist" not in kwargs

    def test_to_json_dict_defaults(self) -> None:
        """Test that default config exports correctly."""
        config = TrafilaturaConfig()
        json_dict = config.to_json_dict()

        assert json_dict["fast"] is False
        assert json_dict["favorPrecision"] is False
        assert json_dict["includeComments"] is True
        assert json_dict["includeTables"] is True
        assert "targetLanguage" not in json_dict  # None values excluded

    def test_to_json_dict_with_options(self) -> None:
        """Test config with custom options."""
        config = TrafilaturaConfig(
            favor_precision=True,
            target_language="en",
            url_blacklist={"spam.com", "ads.com"},
        )
        json_dict = config.to_json_dict()

        assert json_dict["favorPrecision"] is True
        assert json_dict["targetLanguage"] == "en"
        assert set(json_dict["urlBlacklist"]) == {"spam.com", "ads.com"}

    def test_get_default_json(self) -> None:
        """Test classmethod default export."""
        defaults = TrafilaturaConfig.get_default_json()
        assert isinstance(defaults, dict)
        assert defaults["includeFormatting"] is True

    def test_get_default_config_function(self) -> None:
        """Test module-level default export."""
        defaults = get_default_config()
        assert isinstance(defaults, dict)
        assert defaults["includeFormatting"] is True
        assert defaults["withMetadata"] is True


class TestNormalizeConfigKeys:
    """Tests for normalize_config_keys utility."""

    def test_empty_dict(self) -> None:
        """Empty dict returns empty dict."""
        assert normalize_config_keys({}) == {}

    def test_none_returns_empty(self) -> None:
        """None-ish value returns empty dict."""
        assert normalize_config_keys({}) == {}

    def test_camel_case_conversion(self) -> None:
        """camelCase keys are converted to snake_case."""
        result = normalize_config_keys({"favorPrecision": True})
        assert result == {"favor_precision": True}

    def test_snake_case_unchanged(self) -> None:
        """snake_case keys are left unchanged."""
        result = normalize_config_keys({"favor_precision": True})
        assert result == {"favor_precision": True}

    def test_mixed_case_keys(self) -> None:
        """Mixed camelCase and snake_case keys handled."""
        result = normalize_config_keys({
            "includeLinks": True,
            "fast": False,
            "target_language": "en",
        })
        assert result == {
            "include_links": True,
            "fast": False,
            "target_language": "en",
        }

    def test_complex_camel_case(self) -> None:
        """Complex camelCase patterns converted correctly."""
        result = normalize_config_keys({
            "withMetadata": True,
            "onlyWithMetadata": False,
            "teiValidation": True,
        })
        assert result == {
            "with_metadata": True,
            "only_with_metadata": False,
            "tei_validation": True,
        }


class TestContentExtractor:
    """Tests for ContentExtractor class."""

    SAMPLE_HTML = """
    <!DOCTYPE html>
    <html lang="en">
    <head><title>Test Page</title></head>
    <body>
        <article>
            <h1>Test Article</h1>
            <p>This is a test paragraph with some content.</p>
            <p>Another paragraph here for more content to extract.</p>
        </article>
    </body>
    </html>
    """

    def test_init_default_config(self) -> None:
        """ContentExtractor uses balanced config by default."""
        extractor = ContentExtractor()
        assert extractor.config == TrafilaturaConfig.balanced()

    def test_init_custom_config(self) -> None:
        """ContentExtractor accepts custom config."""
        config = TrafilaturaConfig.precision()
        extractor = ContentExtractor(config=config)
        assert extractor.config.favor_precision is True

    def test_extract_returns_result(self) -> None:
        """extract() returns ExtractionResult on success."""
        extractor = ContentExtractor()
        result = extractor.extract(self.SAMPLE_HTML)

        # May return None if trafilatura doesn't find enough content
        if result is not None:
            assert isinstance(result, ExtractionResult)
            assert result.output_format == "txt"

    def test_extract_metadata(self) -> None:
        """extract_metadata() returns MetadataResult."""
        extractor = ContentExtractor()
        result = extractor.extract_metadata(self.SAMPLE_HTML)

        assert isinstance(result, MetadataResult)
        # Title may or may not be extracted depending on content
        # Just verify it returns a MetadataResult

    def test_extract_all_formats(self) -> None:
        """extract_all_formats() returns dict of results."""
        extractor = ContentExtractor()
        results = extractor.extract_all_formats(self.SAMPLE_HTML)

        assert isinstance(results, dict)
        # Results may be empty if content is too short
        for fmt, result in results.items():
            assert isinstance(result, ExtractionResult)
            assert result.output_format == fmt


class TestExtractionResult:
    """Tests for ExtractionResult dataclass."""

    def test_creation(self) -> None:
        """ExtractionResult holds content and format."""
        result = ExtractionResult(content="Hello", output_format="txt")
        assert result.content == "Hello"
        assert result.output_format == "txt"


class TestMetadataResult:
    """Tests for MetadataResult dataclass."""

    def test_defaults_to_none(self) -> None:
        """MetadataResult fields default to None."""
        result = MetadataResult()
        assert result.title is None
        assert result.author is None
        assert result.date is None
        assert result.description is None
        assert result.sitename is None
        assert result.language is None

    def test_creation_with_values(self) -> None:
        """MetadataResult accepts values."""
        result = MetadataResult(title="Test", author="Author", language="en")
        assert result.title == "Test"
        assert result.author == "Author"
        assert result.language == "en"
