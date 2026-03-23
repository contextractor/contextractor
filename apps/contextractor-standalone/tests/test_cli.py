"""Tests for CLI interface using typer CliRunner."""

from unittest.mock import AsyncMock, patch

from typer.testing import CliRunner

from contextractor_cli.main import app

runner = CliRunner()


def _mock_run_crawl():
    """Patch run_crawl to avoid real HTTP requests."""
    return patch("contextractor_cli.main.run_crawl", new_callable=AsyncMock)


def test_single_url():
    with _mock_run_crawl() as mock_crawl:
        result = runner.invoke(app, ["https://example.com"])
        assert result.exit_code == 0
        assert "1 URL(s)" in result.output
        cfg = mock_crawl.call_args[0][0]
        assert cfg.urls == ["https://example.com"]


def test_multiple_urls():
    with _mock_run_crawl() as mock_crawl:
        result = runner.invoke(app, ["https://a.com", "https://b.com"])
        assert result.exit_code == 0
        assert "2 URL(s)" in result.output
        cfg = mock_crawl.call_args[0][0]
        assert cfg.urls == ["https://a.com", "https://b.com"]


def test_config_file(tmp_path):
    config_file = tmp_path / "config.yaml"
    config_file.write_text("urls:\n  - https://example.com\nmaxPages: 5\n")
    with _mock_run_crawl() as mock_crawl:
        result = runner.invoke(app, ["--config", str(config_file)])
        assert result.exit_code == 0
        cfg = mock_crawl.call_args[0][0]
        assert cfg.urls == ["https://example.com"]
        assert cfg.max_pages == 5


def test_config_file_with_extra_urls(tmp_path):
    config_file = tmp_path / "config.yaml"
    config_file.write_text("urls:\n  - https://from-file.com\n")
    with _mock_run_crawl() as mock_crawl:
        result = runner.invoke(app, ["--config", str(config_file), "https://extra.com"])
        assert result.exit_code == 0
        cfg = mock_crawl.call_args[0][0]
        # Positional URLs override config urls
        assert cfg.urls == ["https://extra.com"]


def test_cli_overrides_config(tmp_path):
    config_file = tmp_path / "config.yaml"
    config_file.write_text("urls:\n  - https://example.com\nmaxPages: 5\noutputFormat: txt\n")
    with _mock_run_crawl() as mock_crawl:
        result = runner.invoke(app, [
            "--config", str(config_file),
            "--max-pages", "10",
            "--precision",
            "--format", "json",
        ])
        assert result.exit_code == 0
        cfg = mock_crawl.call_args[0][0]
        assert cfg.max_pages == 10
        assert cfg.output_format == "json"
        assert cfg.extraction.favor_precision is True


def test_no_args_shows_error():
    with _mock_run_crawl():
        result = runner.invoke(app, [])
        assert result.exit_code == 1
        assert "No URLs" in result.output


def test_no_urls_error():
    with _mock_run_crawl():
        result = runner.invoke(app, ["--max-pages", "5"])
        assert result.exit_code == 1
        assert "No URLs" in result.output


def test_format_and_output_dir():
    with _mock_run_crawl() as mock_crawl:
        result = runner.invoke(app, [
            "https://example.com",
            "--format", "json",
            "--output-dir", "./out",
        ])
        assert result.exit_code == 0
        cfg = mock_crawl.call_args[0][0]
        assert cfg.output_format == "json"
        assert cfg.output_dir == "./out"


def test_extraction_flags():
    with _mock_run_crawl() as mock_crawl:
        result = runner.invoke(app, [
            "https://example.com",
            "--fast",
            "--no-links",
            "--no-comments",
            "--deduplicate",
            "--target-language", "en",
        ])
        assert result.exit_code == 0
        cfg = mock_crawl.call_args[0][0]
        assert cfg.extraction.fast is True
        assert cfg.extraction.include_links is False
        assert cfg.extraction.include_comments is False
        assert cfg.extraction.deduplicate is True
        assert cfg.extraction.target_language == "en"


def test_bool_flag_pairs():
    with _mock_run_crawl() as mock_crawl:
        result = runner.invoke(app, [
            "https://example.com",
            "--no-tables",
            "--no-formatting",
            "--no-metadata",
            "--no-headless",
        ])
        assert result.exit_code == 0
        cfg = mock_crawl.call_args[0][0]
        assert cfg.extraction.include_tables is False
        assert cfg.extraction.include_formatting is False
        assert cfg.extraction.with_metadata is False
        assert cfg.headless is False
