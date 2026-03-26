"""Configuration building from actor input."""

from __future__ import annotations

from typing import Any

from contextractor_engine import TrafilaturaConfig


def build_trafilatura_config(raw: dict[str, Any] | None) -> TrafilaturaConfig:
    """Build TrafilaturaConfig from raw dict.

    Accepts both camelCase (from JSON API) and snake_case keys.
    """
    return TrafilaturaConfig.from_json_dict(raw)


def build_crawl_config(actor_input: dict[str, Any]) -> dict[str, Any]:
    """Build crawl configuration from actor input.

    Note: trafilatura_config_raw is passed as dict for JSON serialization in user_data.
    The TrafilaturaConfig object is built in the handler.

    Args:
        actor_input: Raw actor input dictionary.

    Returns:
        Normalized configuration dictionary for the request handler.
    """
    return {
        'save_raw_html': actor_input.get('saveRawHtmlToKeyValueStore', False),
        'save_text': actor_input.get('saveExtractedTextToKeyValueStore', False),
        'save_json': actor_input.get('saveExtractedJsonToKeyValueStore', False),
        'save_markdown': actor_input.get('saveExtractedMarkdownToKeyValueStore', True),
        'save_xml': actor_input.get('saveExtractedXmlToKeyValueStore', False),
        'save_xmltei': actor_input.get('saveExtractedXmlTeiToKeyValueStore', False),
        'trafilatura_config_raw': actor_input.get('trafilaturaConfig', {}),  # Raw dict for JSON serialization
        'globs': actor_input.get('globs', []),
        'excludes': actor_input.get('excludes', []),
        'link_selector': actor_input.get('linkSelector', ''),
        'pseudo_urls': actor_input.get('pseudoUrls', []),
        'keep_url_fragments': actor_input.get('keepUrlFragments', False),
        'max_crawling_depth': actor_input.get('maxCrawlingDepth', 0),
    }


def build_browser_launch_options(actor_input: dict[str, Any]) -> dict[str, Any]:
    """Build browser launch options from actor input.

    Args:
        actor_input: Raw actor input dictionary.

    Returns:
        Browser launch options for PlaywrightCrawler.
    """
    options: dict[str, Any] = {
        'args': ['--disable-gpu', '--disable-blink-features=AutomationControlled'],
    }
    if actor_input.get('ignoreSslErrors', False):
        options['ignore_https_errors'] = True
    return options


def build_browser_context_options(actor_input: dict[str, Any]) -> dict[str, Any] | None:
    """Build browser context options from actor input.

    Args:
        actor_input: Raw actor input dictionary.

    Returns:
        Browser context options or None if no options needed.
    """
    options: dict[str, Any] = {}

    if actor_input.get('ignoreCorsAndCsp', False):
        options['bypass_csp'] = True

    initial_cookies = actor_input.get('initialCookies', [])
    if initial_cookies:
        options['storage_state'] = {'cookies': initial_cookies}

    custom_headers = actor_input.get('customHttpHeaders', {})
    if custom_headers:
        options['extra_http_headers'] = custom_headers

    return options if options else None
