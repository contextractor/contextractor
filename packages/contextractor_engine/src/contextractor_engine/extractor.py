"""Content extraction wrapper using trafilatura."""

import trafilatura

from .models import ExtractionResult, MetadataResult, TrafilaturaConfig


class ContentExtractor:
    """Trafilatura wrapper with configurable extraction."""

    DEFAULT_FORMATS = ["txt", "markdown", "json", "xml"]

    def __init__(self, config: TrafilaturaConfig | None = None) -> None:
        self.config = config or TrafilaturaConfig.balanced()

    def extract(
        self,
        html: str,
        url: str | None = None,
        output_format: str = "txt",
    ) -> ExtractionResult | None:
        """Extract content in specified format."""
        kwargs = self.config.to_trafilatura_kwargs()
        result = trafilatura.extract(
            html,
            url=url,
            output_format=output_format,
            **kwargs,
        )
        if result is None:
            return None
        return ExtractionResult(content=result, output_format=output_format)

    def extract_metadata(self, html: str, url: str | None = None) -> MetadataResult:
        """Extract metadata from HTML.

        Note: bare_extraction returns a Document object with attributes,
        not a dict. Use getattr() to access fields safely.
        """
        raw = trafilatura.bare_extraction(html, url=url, with_metadata=True)
        if not raw:
            return MetadataResult()  # All fields default to None
        # bare_extraction returns a Document object with attributes
        return MetadataResult(
            title=getattr(raw, "title", None),
            author=getattr(raw, "author", None),
            date=getattr(raw, "date", None),
            description=getattr(raw, "description", None),
            sitename=getattr(raw, "sitename", None),
            language=getattr(raw, "language", None),
        )

    def extract_all_formats(
        self,
        html: str,
        url: str | None = None,
        formats: list[str] | None = None,
    ) -> dict[str, ExtractionResult]:
        """Extract content in multiple formats at once.

        Default formats: ["txt", "markdown", "json", "xml"]
        Returns dict keyed by format name. Failed extractions are omitted.
        """
        formats = formats or self.DEFAULT_FORMATS
        results: dict[str, ExtractionResult] = {}
        for fmt in formats:
            result = self.extract(html, url=url, output_format=fmt)
            if result is not None:
                results[fmt] = result
        return results
