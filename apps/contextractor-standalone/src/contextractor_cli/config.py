"""Configuration loading from YAML/JSON files."""

from __future__ import annotations

import json
from dataclasses import dataclass, field, fields as dataclass_fields
from pathlib import Path
from typing import Any

import yaml

from contextractor_engine import TrafilaturaConfig


# TrafilaturaConfig field names for routing in merge()
_EXTRACTION_FIELDS = {f.name for f in dataclass_fields(TrafilaturaConfig)}


@dataclass
class CrawlConfig:
    """Configuration for a crawl run."""

    # Core
    urls: list[str] = field(default_factory=list)
    max_pages: int = 0
    output_format: str = "markdown"
    output_dir: str = "./output"
    crawl_depth: int = 0
    headless: bool = True
    extraction: TrafilaturaConfig = field(default_factory=TrafilaturaConfig.balanced)

    # Proxy
    proxy_urls: list[str] = field(default_factory=list)
    proxy_rotation: str = "recommended"
    proxy_tiered: list[list[str | None]] = field(default_factory=list)

    # Browser
    launcher: str = "chromium"
    wait_until: str = "load"
    page_load_timeout: int = 60
    ignore_cors: bool = False
    close_cookie_modals: bool = True
    max_scroll_height: int = 5000
    ignore_ssl_errors: bool = False
    user_agent: str = ""

    # Crawl filtering
    globs: list[str] = field(default_factory=list)
    excludes: list[str] = field(default_factory=list)
    link_selector: str = ""
    keep_url_fragments: bool = False
    respect_robots_txt: bool = False

    # Cookies & headers
    cookies: list[dict[str, Any]] = field(default_factory=list)
    headers: dict[str, str] = field(default_factory=dict)

    # Concurrency & retries
    max_concurrency: int = 50
    max_retries: int = 3
    max_results: int = 0

    # Output toggles
    save_raw_html: bool = False
    save_text: bool = False
    save_json: bool = False
    save_xml: bool = False
    save_xml_tei: bool = False

    @classmethod
    def from_file(cls, path: Path) -> CrawlConfig:
        """Load config from a YAML or JSON file."""
        text = path.read_text(encoding="utf-8")
        if path.suffix in (".yaml", ".yml"):
            data = yaml.safe_load(text) or {}
        elif path.suffix == ".json":
            data = json.loads(text)
        else:
            # Try YAML first, fall back to JSON
            try:
                data = yaml.safe_load(text) or {}
            except yaml.YAMLError:
                data = json.loads(text)
        return cls.from_dict(data)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> CrawlConfig:
        """Create config from a dictionary."""
        extraction = TrafilaturaConfig.from_json_dict(data.get("extraction"))

        # Parse proxy section (nested object or flat keys)
        proxy_section = data.get("proxy", {})
        proxy_urls = proxy_section.get("urls", []) if isinstance(proxy_section, dict) else []
        proxy_rotation = proxy_section.get("rotation", "recommended") if isinstance(proxy_section, dict) else "recommended"

        # Parse cookies/headers (can be nested or flat)
        cookies = data.get("initialCookies", data.get("cookies", []))
        headers = data.get("customHttpHeaders", data.get("headers", {}))

        return cls(
            urls=data.get("urls", []),
            max_pages=data.get("maxPages", 0),
            output_format=data.get("outputFormat", "markdown"),
            output_dir=data.get("outputDir", "./output"),
            crawl_depth=data.get("crawlDepth", 0),
            headless=data.get("headless", True),
            extraction=extraction,
            # Proxy
            proxy_urls=proxy_urls,
            proxy_rotation=proxy_rotation,
            proxy_tiered=proxy_section.get("tiered", []) if isinstance(proxy_section, dict) else [],
            # Browser
            launcher=data.get("launcher", "chromium").lower(),
            wait_until=data.get("waitUntil", "load").lower(),
            page_load_timeout=data.get("pageLoadTimeoutSecs", data.get("pageLoadTimeout", 60)),
            ignore_cors=data.get("ignoreCorsAndCsp", data.get("ignoreCors", False)),
            close_cookie_modals=data.get("closeCookieModals", True),
            max_scroll_height=data.get("maxScrollHeightPixels", data.get("maxScrollHeight", 5000)),
            ignore_ssl_errors=data.get("ignoreSslErrors", False),
            user_agent=data.get("userAgent", ""),
            # Crawl filtering
            globs=data.get("globs", []),
            excludes=data.get("excludes", []),
            link_selector=data.get("linkSelector", ""),
            keep_url_fragments=data.get("keepUrlFragments", False),
            respect_robots_txt=data.get("respectRobotsTxtFile", data.get("respectRobotsTxt", False)),
            # Cookies & headers
            cookies=cookies,
            headers=headers,
            # Concurrency & retries
            max_concurrency=data.get("maxConcurrency", 50),
            max_retries=data.get("maxRequestRetries", data.get("maxRetries", 3)),
            max_results=data.get("maxResultsPerCrawl", data.get("maxResults", 0)),
            # Output toggles
            save_raw_html=data.get("saveRawHtml", False),
            save_text=data.get("saveText", False),
            save_json=data.get("saveJson", False),
            save_xml=data.get("saveXml", False),
            save_xml_tei=data.get("saveXmlTei", False),
        )

    def merge(self, overrides: dict[str, Any]) -> None:
        """Merge non-None overrides into this config.

        Keys matching TrafilaturaConfig fields are routed to self.extraction.
        Keys matching CrawlConfig fields are set directly.
        Unknown keys are ignored.
        """
        crawl_fields = {f.name for f in dataclass_fields(self)} - {"extraction"}

        for key, value in overrides.items():
            if value is None:
                continue
            if key in crawl_fields:
                setattr(self, key, value)
            elif key in _EXTRACTION_FIELDS:
                setattr(self.extraction, key, value)
