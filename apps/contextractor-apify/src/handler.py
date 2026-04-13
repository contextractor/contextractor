"""Request handler for content extraction."""

from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from typing import Any

from apify import Actor
from crawlee.crawlers import PlaywrightCrawlingContext

from contextractor_engine import ContentExtractor, TrafilaturaConfig

from .extraction import (
    compute_content_info,
    extract_format,
    extract_metadata,
    save_content_to_kvs,
)


class ResultsCounter:
    """Thread-safe counter for tracking results."""

    def __init__(self, max_results: int) -> None:
        self.max_results = max_results
        self.count = 0

    def increment(self) -> int:
        """Increment and return new count."""
        self.count += 1
        return self.count

    def is_limit_reached(self) -> bool:
        """Check if max results limit is reached."""
        return self.max_results > 0 and self.count >= self.max_results


def create_request_handler(
    kvs: Any,
    dataset: Any | None,
    results_counter: ResultsCounter,
    browser_log_enabled: bool,
):
    """Create a request handler function.

    Args:
        kvs: Key-value store for content.
        dataset: Optional named dataset.
        results_counter: Counter for tracking results.
        browser_log_enabled: Whether to log browser console.

    Returns:
        Async handler function for PlaywrightCrawler.
    """

    async def handler(context: PlaywrightCrawlingContext) -> None:
        """Process a single page and extract content."""
        # Check if max results reached
        if results_counter.is_limit_reached():
            Actor.log.info(f'Max results ({results_counter.max_results}) reached, stopping')
            return

        url = context.request.url
        Actor.log.info(f'Processing {url}')

        # Enable browser console logging if requested
        if browser_log_enabled:
            context.page.on(
                'console',
                lambda msg: Actor.log.info(f'[Browser] {msg.type}: {msg.text}'),
            )

        # Auto-dismiss cookie modals (CMP-aware)
        handler_config = context.request.user_data.get('config', {})
        if handler_config.get('close_cookie_modals', True):
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

        html = await context.page.content()
        key_base = hashlib.md5(url.encode()).hexdigest()[:16]

        # Build TrafilaturaConfig from raw dict
        trafilatura_config_raw = handler_config.get('trafilatura_config_raw', {})
        trafilatura_config = TrafilaturaConfig.from_json_dict(trafilatura_config_raw)

        extractor = ContentExtractor(config=trafilatura_config)

        # Build raw HTML info
        html_bytes = html.encode('utf-8')
        raw_html_info = compute_content_info(html_bytes)

        save_formats = handler_config.get('save', ['markdown'])
        if 'html' in save_formats:
            html_key = f'{key_base}-raw.html'
            await kvs.set_value(html_key, html, content_type='text/html; charset=utf-8')
            raw_html_info['key'] = html_key
            raw_html_info['url'] = await kvs.get_public_url(html_key)

        # Extract metadata using ContentExtractor
        metadata = extract_metadata(html, url, extractor)

        # Build dataset entry
        data: dict[str, Any] = {
            'loadedUrl': url,
            'rawHtml': raw_html_info,
            'loadedAt': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
            'metadata': metadata,
            'httpStatus': 200,
        }

        # Save extracted formats
        await _save_extracted_formats(kvs, key_base, html, url, extractor, handler_config, data)

        # Push data to dataset
        if dataset:
            await dataset.push_data(data)
        else:
            await context.push_data(data)

        # Increment results count
        results_counter.increment()

        # Stop crawler if max results reached
        if results_counter.is_limit_reached():
            Actor.log.info(
                f'Max results ({results_counter.max_results}) reached, stopping crawler'
            )
            raise SystemExit(0)

        # Enqueue links if linkSelector is set
        await _enqueue_links(context, handler_config)

    return handler


async def _save_extracted_formats(
    kvs: Any,
    key_base: str,
    html: str,
    url: str,
    extractor: ContentExtractor,
    config: dict[str, Any],
    data: dict[str, Any],
) -> None:
    """Save extracted content in requested formats.

    Args:
        kvs: Key-value store.
        key_base: Base key for storage.
        html: Raw HTML content.
        url: Source URL.
        extractor: ContentExtractor instance.
        config: Handler configuration.
        data: Data dict to update with results.
    """
    save_formats = config.get('save', ['markdown'])
    format_configs = [
        ('text', 'txt', 'extractedText', 'text/plain; charset=utf-8'),
        ('json', 'json', 'extractedJson', 'application/json; charset=utf-8'),
        ('markdown', 'markdown', 'extractedMarkdown', 'text/markdown; charset=utf-8'),
        ('xml', 'xml', 'extractedXml', 'application/xml; charset=utf-8'),
        ('xml-tei', 'xmltei', 'extractedXmlTei', 'application/xml; charset=utf-8'),
    ]

    for format_name, output_format, data_key, content_type in format_configs:
        if format_name in save_formats:
            content = extract_format(html, output_format, extractor, url=url)
            if content:
                ext = 'tei.xml' if output_format == 'xmltei' else output_format
                if output_format == 'markdown':
                    ext = 'md'
                key = f'{key_base}.{ext}'
                data[data_key] = await save_content_to_kvs(kvs, key, content, content_type)


async def _enqueue_links(
    context: PlaywrightCrawlingContext,
    config: dict[str, Any],
) -> None:
    """Enqueue links from the page if configured.

    Args:
        context: Crawling context.
        config: Handler configuration.
    """
    link_selector = config.get('link_selector', '')
    if not link_selector:
        return

    current_depth = context.request.user_data.get('depth', 0)
    max_depth = config.get('max_crawling_depth', 0)

    if max_depth != 0 and current_depth >= max_depth:
        return

    globs = config.get('globs', [])
    excludes = config.get('excludes', [])
    new_config = {**config}
    new_depth = current_depth + 1

    await context.enqueue_links(
        selector=link_selector,
        globs=[g.get('glob') for g in globs if g.get('glob')] if globs else None,
        exclude_globs=[e.get('glob') for e in excludes if e.get('glob')] if excludes else None,
        keep_url_fragments=config.get('keep_url_fragments', False),
        user_data={'config': new_config, 'depth': new_depth},
    )
