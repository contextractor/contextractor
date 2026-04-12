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
    config_file.write_text("urls:\n  - https://example.com\nmaxPages: 5\nsaveJson: true\n")
    with _mock_run_crawl() as mock_crawl:
        result = runner.invoke(app, [
            "--config", str(config_file),
            "--max-pages", "10",
            "--precision",
            "--no-save-markdown",
            "--save-text",
        ])
        assert result.exit_code == 0
        cfg = mock_crawl.call_args[0][0]
        assert cfg.max_pages == 10
        assert cfg.save_markdown is False
        assert cfg.save_text is True
        assert cfg.save_json is True
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


def test_save_toggles_and_output_dir():
    with _mock_run_crawl() as mock_crawl:
        result = runner.invoke(app, [
            "https://example.com",
            "--save-json",
            "--output-dir", "./out",
        ])
        assert result.exit_code == 0
        cfg = mock_crawl.call_args[0][0]
        assert cfg.save_json is True
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


# --- Tests for v0.3.0+ CLI flags ---


def test_proxy_flags():
    with _mock_run_crawl() as mock_crawl:
        result = runner.invoke(app, [
            "https://example.com",
            "--proxy-urls", "http://p1:8080,http://p2:8080",
            "--proxy-rotation", "per_request",
        ])
        assert result.exit_code == 0
        cfg = mock_crawl.call_args[0][0]
        assert cfg.proxy_urls == ["http://p1:8080", "http://p2:8080"]
        assert cfg.proxy_rotation == "per_request"


def test_browser_flags():
    with _mock_run_crawl() as mock_crawl:
        result = runner.invoke(app, [
            "https://example.com",
            "--launcher", "firefox",
            "--wait-until", "networkidle",
            "--page-load-timeout", "120",
        ])
        assert result.exit_code == 0
        cfg = mock_crawl.call_args[0][0]
        assert cfg.launcher == "firefox"
        assert cfg.wait_until == "networkidle"
        assert cfg.page_load_timeout == 120


def test_user_agent_flag():
    with _mock_run_crawl() as mock_crawl:
        result = runner.invoke(app, [
            "https://example.com",
            "--user-agent", "Mozilla/5.0 Custom",
        ])
        assert result.exit_code == 0
        cfg = mock_crawl.call_args[0][0]
        assert cfg.user_agent == "Mozilla/5.0 Custom"


def test_crawl_filter_flags():
    with _mock_run_crawl() as mock_crawl:
        result = runner.invoke(app, [
            "https://example.com",
            "--globs", "*.html,*.htm",
            "--excludes", "*.pdf,*.zip",
        ])
        assert result.exit_code == 0
        cfg = mock_crawl.call_args[0][0]
        assert cfg.globs == ["*.html", "*.htm"]
        assert cfg.excludes == ["*.pdf", "*.zip"]


def test_cookie_header_flags():
    with _mock_run_crawl() as mock_crawl:
        result = runner.invoke(app, [
            "https://example.com",
            "--cookies", '[{"name":"s","value":"v","domain":".example.com"}]',
            "--headers", '{"Authorization":"Bearer tok"}',
        ])
        assert result.exit_code == 0
        cfg = mock_crawl.call_args[0][0]
        assert cfg.cookies == [{"name": "s", "value": "v", "domain": ".example.com"}]
        assert cfg.headers == {"Authorization": "Bearer tok"}


def test_output_toggle_flags():
    with _mock_run_crawl() as mock_crawl:
        result = runner.invoke(app, [
            "https://example.com",
            "--save-raw-html",
            "--save-text",
            "--save-json",
            "--save-jsonl",
            "--save-xml",
            "--save-xml-tei",
        ])
        assert result.exit_code == 0
        cfg = mock_crawl.call_args[0][0]
        assert cfg.save_raw_html is True
        assert cfg.save_text is True
        assert cfg.save_json is True
        assert cfg.save_jsonl is True
        assert cfg.save_xml is True
        assert cfg.save_xml_tei is True


def test_save_markdown_default():
    with _mock_run_crawl() as mock_crawl:
        result = runner.invoke(app, ["https://example.com"])
        assert result.exit_code == 0
        cfg = mock_crawl.call_args[0][0]
        assert cfg.save_markdown is True


def test_disable_markdown():
    with _mock_run_crawl() as mock_crawl:
        result = runner.invoke(app, [
            "https://example.com",
            "--no-save-markdown",
            "--save-json",
        ])
        assert result.exit_code == 0
        cfg = mock_crawl.call_args[0][0]
        assert cfg.save_markdown is False
        assert cfg.save_json is True
