"""Crawling and content extraction using crawlee."""

from __future__ import annotations

import hashlib
import json
import logging
import os
import re
from datetime import timedelta
from pathlib import Path
from typing import Any

from crawlee import Request
from crawlee._autoscaling.autoscaled_pool import ConcurrencySettings
from crawlee.crawlers import PlaywrightCrawler, PlaywrightCrawlingContext
from crawlee.crawlers._playwright._types import GotoOptions
from crawlee.proxy_configuration import ProxyConfiguration

from contextractor_engine import ContentExtractor

from .config import CrawlConfig

logger = logging.getLogger("contextractor")

FORMAT_EXTENSIONS = {
    "txt": ".txt",
    "markdown": ".md",
    "json": ".json",
    "jsonl": ".jsonl",
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


def _build_browser_launch_options(config: CrawlConfig) -> dict[str, Any]:
    """Build browser launch options from config."""
    options: dict[str, Any] = {}
    args = []

    # Anti-detection: prevent navigator.webdriver=true (Chromium only)
    if config.launcher == "chromium":
        args.append("--disable-blink-features=AutomationControlled")

    # Disable Chromium sandbox in Docker (set CONTEXTRACTOR_NO_SANDBOX=1)
    if os.environ.get("CONTEXTRACTOR_NO_SANDBOX"):
        args.append("--no-sandbox")

    if args:
        options["args"] = args

    if config.ignore_ssl_errors:
        options["ignore_https_errors"] = True

    return options


def _build_browser_context_options(config: CrawlConfig) -> dict[str, Any] | None:
    """Build browser context options from config."""
    options: dict[str, Any] = {}

    if config.ignore_cors:
        options["bypass_csp"] = True

    if config.cookies:
        options["storage_state"] = {"cookies": config.cookies}

    if config.headers:
        options["extra_http_headers"] = config.headers

    if config.user_agent:
        options["user_agent"] = config.user_agent

    return options if options else None


async def run_crawl(config: CrawlConfig) -> None:
    """Run the crawl with the given configuration."""
    output_dir = Path(config.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    extractor = ContentExtractor(config=config.extraction)
    ext = FORMAT_EXTENSIONS.get(config.output_format, ".txt")
    pages_extracted = 0
    max_results = config.max_results

    # Configure proxy (tiered takes precedence over flat proxy_urls)
    proxy_cfg = None
    if config.proxy_tiered:
        proxy_cfg = ProxyConfiguration(tiered_proxy_urls=config.proxy_tiered)
        logger.info(f"Using tiered proxy with {len(config.proxy_tiered)} tier(s)")
    elif config.proxy_urls:
        proxy_cfg = ProxyConfiguration(proxy_urls=config.proxy_urls)
        logger.info(f"Using {len(config.proxy_urls)} proxy URL(s), rotation: {config.proxy_rotation}")
        if config.proxy_rotation == "until_failure":
            logger.warning(
                "proxy_rotation 'until_failure' uses round-robin rotation; "
                "full sticky-session behavior requires Crawlee SessionPool integration"
            )

    # Build browser options
    browser_launch_options = _build_browser_launch_options(config)
    browser_context_options = _build_browser_context_options(config)

    # Build crawler kwargs
    crawler_kwargs: dict[str, Any] = {
        "headless": config.headless,
        "browser_type": config.launcher,
        "browser_launch_options": browser_launch_options,
        "max_requests_per_crawl": config.max_pages if config.max_pages > 0 else None,
        "max_request_retries": config.max_retries,
        "request_handler_timeout": timedelta(seconds=config.page_load_timeout),
        "concurrency_settings": ConcurrencySettings(
            max_concurrency=config.max_concurrency,
            desired_concurrency=min(10, config.max_concurrency),
        ),
        "respect_robots_txt_file": config.respect_robots_txt,
        "max_crawl_depth": config.crawl_depth if config.crawl_depth > 0 else None,
        "goto_options": GotoOptions(wait_until=config.wait_until),
    }
    if proxy_cfg:
        crawler_kwargs["proxy_configuration"] = proxy_cfg
    if browser_context_options:
        crawler_kwargs["browser_new_context_options"] = browser_context_options

    crawler = PlaywrightCrawler(**crawler_kwargs)

    # Additional output formats to save alongside primary
    extra_formats: list[str] = []
    if config.save_raw_html:
        extra_formats.append("raw_html")
    if config.save_text:
        extra_formats.append("txt")
    if config.save_json:
        extra_formats.append("json")
    if config.save_xml:
        extra_formats.append("xml")
    if config.save_xml_tei:
        extra_formats.append("xmltei")

    @crawler.router.default_handler
    async def handler(context: PlaywrightCrawlingContext) -> None:
        nonlocal pages_extracted
        url = context.request.url
        logger.info(f"Processing {url}")

        # Check max results limit
        if max_results > 0 and pages_extracted >= max_results:
            logger.info(f"Reached max results limit ({max_results}), skipping {url}")
            return

        # Auto-dismiss cookie modals (CMP-aware)
        if config.close_cookie_modals:
            try:
                await context.page.evaluate("""
                    () => {
                        // 1. Didomi CMP
                        if (window.Didomi) {
                            try { window.Didomi.setUserAgreeToAll(); return; } catch {}
                        }
                        // 2. OneTrust
                        const onetrust = document.querySelector('#onetrust-accept-btn-handler');
                        if (onetrust) { onetrust.click(); return; }
                        // 3. CookieBot
                        const cookiebot = document.querySelector('#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll');
                        if (cookiebot) { cookiebot.click(); return; }
                        // 4. Quantcast / TCF
                        const quantcast = document.querySelector('.qc-cmp2-summary-buttons button[mode="primary"]');
                        if (quantcast) { quantcast.click(); return; }
                        // 5. Generic fallback selectors
                        const selectors = [
                            '[class*="cookie"] button', '[id*="cookie"] button',
                            '[class*="consent"] button', '[id*="consent"] button',
                            'button[class*="accept"]', 'button[id*="accept"]',
                        ];
                        for (const sel of selectors) {
                            const btn = document.querySelector(sel);
                            if (btn) { btn.click(); return; }
                        }
                    }
                """)
                await context.page.wait_for_timeout(1000)
            except Exception:
                pass  # Best effort

        # Scroll page to load dynamic content
        if config.max_scroll_height > 0:
            try:
                await context.page.evaluate(f"""
                    async () => {{
                        let scrolled = 0;
                        const maxScroll = {config.max_scroll_height};
                        while (scrolled < maxScroll) {{
                            window.scrollBy(0, 500);
                            scrolled += 500;
                            await new Promise(r => setTimeout(r, 100));
                        }}
                        window.scrollTo(0, 0);
                    }}
                """)
            except Exception:
                pass  # Best effort

        html = await context.page.content()

        # Extract primary format (jsonl extracts as markdown internally)
        extract_format = "markdown" if config.output_format == "jsonl" else config.output_format
        result = extractor.extract(html, url=url, output_format=extract_format)
        if result is None:
            logger.warning(f"No content extracted from {url}")
            return

        # Extract metadata for header
        metadata = extractor.extract_metadata(html, url=url)

        if config.output_format == "jsonl":
            # JSONL: append one JSON line per page to a single output file
            jsonl_path = output_dir / "output.jsonl"
            entry = {
                "url": url,
                "title": metadata.title or "",
                "author": metadata.author or "",
                "date": metadata.date or "",
                "content": result.content,
            }
            with open(jsonl_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")
            logger.info(f"Appended to {jsonl_path}")
        else:
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

            # Write primary format
            filename = _url_to_filename(url) + ext
            filepath = output_dir / filename
            filepath.write_text(content, encoding="utf-8")
            logger.info(f"Saved {filepath}")

        # Write extra output formats
        slug = _url_to_filename(url)
        for fmt in extra_formats:
            if fmt == "raw_html":
                extra_path = output_dir / f"{slug}.html"
                extra_path.write_text(html, encoding="utf-8")
            elif fmt == config.output_format:
                continue  # Already saved as primary
            else:
                extra_result = extractor.extract(html, url=url, output_format=fmt)
                if extra_result:
                    extra_ext = FORMAT_EXTENSIONS.get(fmt, f".{fmt}")
                    extra_path = output_dir / f"{slug}{extra_ext}"
                    extra_path.write_text(extra_result.content, encoding="utf-8")

        pages_extracted += 1

        # Enqueue links if crawl depth is configured (Crawlee handles depth limiting natively)
        if config.crawl_depth > 0:
            enqueue_kwargs: dict[str, Any] = {}
            if config.link_selector:
                enqueue_kwargs["selector"] = config.link_selector
            if config.globs:
                enqueue_kwargs["globs"] = config.globs
            if config.excludes:
                enqueue_kwargs["exclude_globs"] = config.excludes

            await context.enqueue_links(**enqueue_kwargs)

    # Build requests
    requests = [
        Request.from_url(
            url,
            keep_url_fragment=config.keep_url_fragments,
        )
        for url in config.urls
    ]

    await crawler.run(requests)
    logger.info(f"Done. Extracted {pages_extracted} pages to {output_dir}")
