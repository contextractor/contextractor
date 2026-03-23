"""Crawling and content extraction using crawlee."""

from __future__ import annotations

import hashlib
import logging
import os
import re
from datetime import timedelta
from pathlib import Path

from crawlee import Request
from crawlee.crawlers import PlaywrightCrawler, PlaywrightCrawlingContext

from contextractor_engine import ContentExtractor

from .config import CrawlConfig

logger = logging.getLogger("contextractor")

FORMAT_EXTENSIONS = {
    "txt": ".txt",
    "markdown": ".md",
    "json": ".json",
    "xml": ".xml",
    "xmltei": ".tei.xml",
}


def _url_to_filename(url: str) -> str:
    """Convert a URL to a safe filename slug."""
    # Remove protocol
    slug = re.sub(r"^https?://", "", url)
    # Replace non-alphanumeric chars with hyphens
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", slug)
    # Remove leading/trailing hyphens
    slug = slug.strip("-")
    # Truncate and add hash for uniqueness
    if len(slug) > 100:
        url_hash = hashlib.md5(url.encode()).hexdigest()[:8]
        slug = f"{slug[:100]}-{url_hash}"
    return slug


async def run_crawl(config: CrawlConfig) -> None:
    """Run the crawl with the given configuration."""
    output_dir = Path(config.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    extractor = ContentExtractor(config=config.extraction)
    ext = FORMAT_EXTENSIONS.get(config.output_format, ".txt")
    pages_extracted = 0

    # Disable Chromium sandbox in Docker (set CONTEXTRACTOR_NO_SANDBOX=1)
    browser_launch_options: dict[str, object] = {}
    if os.environ.get("CONTEXTRACTOR_NO_SANDBOX"):
        browser_launch_options["args"] = ["--no-sandbox"]

    crawler = PlaywrightCrawler(
        headless=config.headless,
        browser_type="chromium",
        browser_launch_options=browser_launch_options,
        max_requests_per_crawl=config.max_pages if config.max_pages > 0 else None,
        request_handler_timeout=timedelta(seconds=60),
    )

    @crawler.router.default_handler
    async def handler(context: PlaywrightCrawlingContext) -> None:
        nonlocal pages_extracted
        url = context.request.url
        logger.info(f"Processing {url}")

        html = await context.page.content()

        # Extract content
        result = extractor.extract(html, url=url, output_format=config.output_format)
        if result is None:
            logger.warning(f"No content extracted from {url}")
            return

        # Extract metadata for header
        metadata = extractor.extract_metadata(html, url=url)

        # Build output content with metadata header
        output_parts = []
        if metadata.title or metadata.author or metadata.date:
            if config.output_format in ("markdown", "txt"):
                if metadata.title:
                    output_parts.append(f"Title: {metadata.title}")
                if metadata.author:
                    output_parts.append(f"Author: {metadata.author}")
                if metadata.date:
                    output_parts.append(f"Date: {metadata.date}")
                output_parts.append(f"URL: {url}")
                output_parts.append("")
                output_parts.append("---")
                output_parts.append("")

        output_parts.append(result.content)
        content = "\n".join(output_parts)

        # Write to file
        filename = _url_to_filename(url) + ext
        filepath = output_dir / filename
        filepath.write_text(content, encoding="utf-8")
        logger.info(f"Saved {filepath}")

        pages_extracted += 1

        # Enqueue links if crawl depth allows
        current_depth = context.request.user_data.get("depth", 0)
        if config.crawl_depth > 0 and current_depth < config.crawl_depth:
            await context.enqueue_links(
                user_data={"depth": current_depth + 1},
            )

    # Build requests
    requests = [
        Request.from_url(url, user_data={"depth": 0})
        for url in config.urls
    ]

    await crawler.run(requests)
    logger.info(f"Done. Extracted {pages_extracted} pages to {output_dir}")
