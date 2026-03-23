"""Tests for basic-sanitization suite - validates trafilatura extraction."""

import pytest
import trafilatura
from pathlib import Path

FIXTURES_DIR = Path(__file__).parent.parent / "fixtures" / "basic-sanitization"


class TestWikipediaWebScraping:
    """Tests for Wikipedia Web Scraping article."""

    @pytest.fixture
    def html(self) -> str:
        return (FIXTURES_DIR / "wikipedia-web-scraping.html").read_text(encoding="utf-8")

    @pytest.fixture
    def url(self) -> str:
        return "https://en.wikipedia.org/wiki/Web_scraping"

    def test_metadata_extraction(self, html: str, url: str):
        """Test metadata is correctly extracted."""
        result = trafilatura.bare_extraction(html, url=url, with_metadata=True)

        assert result is not None
        assert result.title == "Web scraping - Wikipedia"
        assert result.sitename == "Wikimedia Foundation, Inc."

    def test_markdown_extraction(self, html: str, url: str):
        """Test markdown content is extracted."""
        markdown = trafilatura.extract(html, output_format="markdown", url=url)

        assert markdown is not None
        assert len(markdown) > 5000  # Should have substantial content
        assert "web scraping" in markdown.lower()

    def test_text_extraction(self, html: str, url: str):
        """Test plain text content is extracted."""
        text = trafilatura.extract(html, output_format="txt", url=url)

        assert text is not None
        assert len(text) > 5000


class TestMdnJavascriptGuide:
    """Tests for MDN JavaScript Guide."""

    @pytest.fixture
    def html(self) -> str:
        return (FIXTURES_DIR / "mdn-javascript-guide.html").read_text(encoding="utf-8")

    @pytest.fixture
    def url(self) -> str:
        return "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide"

    def test_metadata_extraction(self, html: str, url: str):
        """Test metadata is correctly extracted."""
        result = trafilatura.bare_extraction(html, url=url, with_metadata=True)

        assert result is not None
        assert result.title == "JavaScript Guide"
        assert result.sitename == "developer.mozilla.org"
        assert "JavaScript" in (result.description or "")

    def test_markdown_extraction(self, html: str, url: str):
        """Test markdown content is extracted."""
        markdown = trafilatura.extract(html, output_format="markdown", url=url)

        assert markdown is not None
        assert len(markdown) > 500


class TestCrawleeIntro:
    """Tests for Crawlee Introduction page."""

    @pytest.fixture
    def html(self) -> str:
        return (FIXTURES_DIR / "crawlee-intro.html").read_text(encoding="utf-8")

    @pytest.fixture
    def url(self) -> str:
        return "https://crawlee.dev/docs/introduction"

    def test_metadata_extraction(self, html: str, url: str):
        """Test metadata is correctly extracted."""
        result = trafilatura.bare_extraction(html, url=url, with_metadata=True)

        assert result is not None
        assert "Introduction" in result.title or "Crawlee" in result.title
        assert result.description is not None

    def test_markdown_extraction(self, html: str, url: str):
        """Test markdown content is extracted."""
        markdown = trafilatura.extract(html, output_format="markdown", url=url)

        assert markdown is not None
        assert len(markdown) > 500
