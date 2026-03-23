"""Content extraction using contextractor-engine."""

from __future__ import annotations

import hashlib
import re
from typing import Any

from contextractor_engine import ContentExtractor


def extract_metadata(html: str, url: str, extractor: ContentExtractor) -> dict[str, Any]:
    """Extract metadata from HTML.

    Args:
        html: Raw HTML content.
        url: Source URL for context.
        extractor: ContentExtractor instance with configured options.

    Returns:
        Dictionary with extracted metadata fields.
    """
    result = extractor.extract_metadata(html, url=url)
    metadata: dict[str, Any] = {
        'title': result.title,
        'author': result.author,
        'publishedAt': result.date,
        'description': result.description,
        'siteName': result.sitename,
        'lang': result.language,
    }

    # Fallback: extract lang from <html lang="..."> if not found
    if not metadata['lang']:
        lang_match = re.search(r'<html[^>]*\slang=["\']([^"\']+)["\']', html, re.IGNORECASE)
        if lang_match:
            metadata['lang'] = lang_match.group(1)

    return metadata


def extract_format(
    html: str,
    output_format: str,
    extractor: ContentExtractor,
    url: str | None = None,
) -> str | None:
    """Extract content in specified format.

    Args:
        html: Raw HTML content.
        output_format: One of txt, json, markdown, xml, xmltei.
        extractor: ContentExtractor instance with configured options.
        url: Optional source URL.

    Returns:
        Extracted content or None if extraction failed.
    """
    result = extractor.extract(html, url=url, output_format=output_format)
    return result.content if result else None


def compute_content_info(content: str | bytes) -> dict[str, Any]:
    """Compute hash and length for content.

    Args:
        content: String or bytes content.

    Returns:
        Dictionary with hash and length.
    """
    if isinstance(content, str):
        content = content.encode('utf-8')
    return {
        'hash': hashlib.md5(content).hexdigest(),
        'length': len(content),
    }


async def save_content_to_kvs(
    kvs: Any,
    key: str,
    content: str,
    content_type: str,
) -> dict[str, Any]:
    """Save content to key-value store and return info dict.

    Args:
        kvs: Key-value store instance.
        key: Storage key.
        content: Content to save.
        content_type: MIME type.

    Returns:
        Dictionary with key, url, hash, and length.
    """
    await kvs.set_value(key, content, content_type=content_type)
    content_bytes = content.encode('utf-8')
    return {
        'key': key,
        'url': await kvs.get_public_url(key),
        'hash': hashlib.md5(content_bytes).hexdigest(),
        'length': len(content_bytes),
    }
