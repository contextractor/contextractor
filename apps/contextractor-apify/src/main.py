"""Contextractor - Web content extraction using trafilatura."""

from __future__ import annotations

import logging
from datetime import timedelta

from apify import Actor
from crawlee import Request
from crawlee.crawlers import PlaywrightCrawler

from .config import (
    build_browser_context_options,
    build_browser_launch_options,
    build_crawl_config,
)
from .handler import ResultsCounter, create_request_handler


async def main() -> None:
    """Main entry point for the Contextractor actor."""
    async with Actor:
        actor_input = await Actor.get_input() or {}

        # Enable debug logging if requested
        if actor_input.get('debugLog', False):
            logging.getLogger('crawlee').setLevel(logging.DEBUG)
            logging.getLogger('apify').setLevel(logging.DEBUG)

        # Get start URLs
        start_urls = [url.get('url') for url in actor_input.get('startUrls', [])]
        if not start_urls:
            Actor.log.info('No URLs provided')
            return

        # Open storages
        kvs = await _open_key_value_store(actor_input)
        dataset = await _open_dataset(actor_input)

        # Build configuration
        config = build_crawl_config(actor_input)

        # Create crawler
        crawler = await _create_crawler(actor_input)

        # Set up request handler
        results_counter = ResultsCounter(actor_input.get('maxResultsPerCrawl', 0))
        browser_log_enabled = actor_input.get('browserLog', False)

        handler = create_request_handler(
            kvs=kvs,
            dataset=dataset,
            results_counter=results_counter,
            browser_log_enabled=browser_log_enabled,
        )
        crawler.router.default_handler(handler)

        # Run crawler
        keep_fragments = config.get('keep_url_fragments', False)
        requests = [
            Request.from_url(
                url,
                user_data={'config': config, 'depth': 0},
                keep_url_fragment=keep_fragments,
            )
            for url in start_urls
        ]
        await crawler.run(requests)


async def _open_key_value_store(actor_input: dict) -> object:
    """Open key-value store for content storage."""
    kvs_name = actor_input.get('keyValueStoreName')
    if kvs_name:
        return await Actor.open_key_value_store(name=kvs_name)
    return await Actor.open_key_value_store()


async def _open_dataset(actor_input: dict) -> object | None:
    """Open named dataset if specified."""
    dataset_name = actor_input.get('datasetName')
    if dataset_name:
        return await Actor.open_dataset(name=dataset_name)
    return None


async def _create_crawler(actor_input: dict) -> PlaywrightCrawler:
    """Create and configure PlaywrightCrawler."""
    # Configure proxy
    proxy_settings = actor_input.get('proxyConfiguration')
    proxy_cfg = None
    if proxy_settings:
        proxy_cfg = await Actor.create_proxy_configuration(actor_proxy_input=proxy_settings)

    # Build options
    browser_launch_options = build_browser_launch_options(actor_input)
    browser_context_options = build_browser_context_options(actor_input)

    # Create crawler
    max_pages = actor_input.get('maxPagesPerCrawl', 0)
    return PlaywrightCrawler(
        headless=actor_input.get('headless', True),
        browser_type=actor_input.get('launcher', 'CHROMIUM').lower(),
        max_requests_per_crawl=max_pages if max_pages > 0 else None,
        max_request_retries=actor_input.get('maxRequestRetries', 3),
        request_handler_timeout=timedelta(seconds=actor_input.get('pageLoadTimeoutSecs', 60)),
        proxy_configuration=proxy_cfg,
        browser_launch_options=browser_launch_options,
        browser_new_context_options=browser_context_options,
    )
