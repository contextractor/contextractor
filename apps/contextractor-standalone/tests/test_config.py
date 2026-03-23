"""Tests for CrawlConfig."""

from contextractor_cli.config import CrawlConfig


def test_default_config_has_sensible_defaults():
    cfg = CrawlConfig()
    assert cfg.urls == []
    assert cfg.max_pages == 0
    assert cfg.output_format == "markdown"
    assert cfg.output_dir == "./output"
    assert cfg.crawl_depth == 0
    assert cfg.headless is True
    assert cfg.extraction.favor_precision is False
    assert cfg.extraction.include_links is True


def test_merge_overlays_crawl_fields():
    cfg = CrawlConfig()
    cfg.merge({"max_pages": 10, "output_format": "json", "output_dir": "/tmp/out"})
    assert cfg.max_pages == 10
    assert cfg.output_format == "json"
    assert cfg.output_dir == "/tmp/out"


def test_merge_routes_extraction_fields():
    cfg = CrawlConfig()
    cfg.merge({"favor_precision": True, "include_links": False, "deduplicate": True})
    assert cfg.extraction.favor_precision is True
    assert cfg.extraction.include_links is False
    assert cfg.extraction.deduplicate is True


def test_merge_skips_none_values():
    cfg = CrawlConfig()
    cfg.merge({"max_pages": None, "output_format": None, "favor_precision": None})
    assert cfg.max_pages == 0
    assert cfg.output_format == "markdown"
    assert cfg.extraction.favor_precision is False


def test_merge_ignores_unknown_keys():
    cfg = CrawlConfig()
    cfg.merge({"unknown_key": "value", "another_unknown": 42})
    # Should not raise


def test_from_file_still_works(tmp_path):
    config_file = tmp_path / "config.yaml"
    config_file.write_text(
        "urls:\n  - https://example.com\nmaxPages: 5\noutputFormat: json\n"
        "extraction:\n  favorPrecision: true\n"
    )
    cfg = CrawlConfig.from_file(config_file)
    assert cfg.urls == ["https://example.com"]
    assert cfg.max_pages == 5
    assert cfg.output_format == "json"
    assert cfg.extraction.favor_precision is True


def test_file_values_then_merge_precedence(tmp_path):
    config_file = tmp_path / "config.yaml"
    config_file.write_text(
        "urls:\n  - https://example.com\nmaxPages: 5\noutputFormat: json\n"
    )
    cfg = CrawlConfig.from_file(config_file)
    cfg.merge({"max_pages": 20, "output_format": "txt"})
    assert cfg.max_pages == 20
    assert cfg.output_format == "txt"
    # Unmerged fields keep file values
    assert cfg.urls == ["https://example.com"]
