"""Configuration loading from JSON files (YAML also supported)."""

from __future__ import annotations

import json
from dataclasses import dataclass, field, fields as dataclass_fields
from pathlib import Path
from typing import Any

import yaml

from contextractor_engine import TrafilaturaConfig
from contextractor_engine.utils import normalize_config_keys, to_snake_case


# TrafilaturaConfig field names for routing in merge()
_EXTRACTION_FIELDS = {f.name for f in dataclass_fields(TrafilaturaConfig)}

VALID_SAVE_FORMATS = {"markdown", "html", "text", "json", "jsonl", "xml", "xml-tei"}


def validate_save_formats(formats: list[str]) -> list[str]:
    """Validate and normalize save format names. Expands 'all'."""
    result = []
    for fmt in formats:
        fmt = fmt.strip().lower()
        if fmt == "all":
            return sorted(VALID_SAVE_FORMATS)
        if fmt not in VALID_SAVE_FORMATS:
            raise ValueError(f"Unknown save format: '{fmt}'. Valid: {', '.join(sorted(VALID_SAVE_FORMATS))}")
        if fmt not in result:
            result.append(fmt)
    return result


@dataclass
class CrawlConfig:
    """Configuration for a crawl run."""

    # Core
    urls: list[str] = field(default_factory=list)
    max_pages: int = 0
    output_dir: str = "./output"
    crawl_depth: int = 0
    headless: bool = True
    trafilatura_config: TrafilaturaConfig = field(default_factory=TrafilaturaConfig.balanced)

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

    # Output formats
    save: list[str] = field(default_factory=lambda: ["markdown"])

    @classmethod
    def from_file(cls, path: Path) -> CrawlConfig:
        """Load config from a JSON (or YAML) file."""
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
        """Create config from a dictionary.

        Accepts both camelCase and snake_case keys. All keys are normalized
        to snake_case before lookup.
        """
        data = normalize_config_keys(data)

        trafilatura_config = TrafilaturaConfig.from_json_dict(data.get("trafilatura_config"))

        # Parse proxy section (nested object or flat keys)
        proxy_section = data.get("proxy", {})
        if isinstance(proxy_section, dict):
            proxy_section = normalize_config_keys(proxy_section)
        proxy_urls = proxy_section.get("urls", []) if isinstance(proxy_section, dict) else []
        proxy_rotation_raw = proxy_section.get("rotation", "recommended") if isinstance(proxy_section, dict) else "recommended"
        proxy_rotation = to_snake_case(proxy_rotation_raw)

        # Parse cookies/headers (can be nested or flat)
        cookies = data.get("initial_cookies", data.get("cookies", []))
        headers = data.get("custom_http_headers", data.get("headers", {}))

        return cls(
            urls=data.get("urls", []),
            max_pages=data.get("max_pages", 0),
            output_dir=data.get("output_dir", "./output"),
            crawl_depth=data.get("crawl_depth", 0),
            headless=data.get("headless", True),
            trafilatura_config=trafilatura_config,
            # Proxy
            proxy_urls=proxy_urls,
            proxy_rotation=proxy_rotation,
            proxy_tiered=proxy_section.get("tiered", []) if isinstance(proxy_section, dict) else [],
            # Browser
            launcher=data.get("launcher", "chromium").lower(),
            wait_until=data.get("wait_until", "load").lower(),
            page_load_timeout=data.get("page_load_timeout_secs", data.get("page_load_timeout", 60)),
            ignore_cors=data.get("ignore_cors_and_csp", data.get("ignore_cors", False)),
            close_cookie_modals=data.get("close_cookie_modals", True),
            max_scroll_height=data.get("max_scroll_height_pixels", data.get("max_scroll_height", 5000)),
            ignore_ssl_errors=data.get("ignore_ssl_errors", False),
            user_agent=data.get("user_agent", ""),
            # Crawl filtering
            globs=data.get("globs", []),
            excludes=data.get("excludes", []),
            link_selector=data.get("link_selector", ""),
            keep_url_fragments=data.get("keep_url_fragments", False),
            respect_robots_txt=data.get("respect_robots_txt_file", data.get("respect_robots_txt", False)),
            # Cookies & headers
            cookies=cookies,
            headers=headers,
            # Concurrency & retries
            max_concurrency=data.get("max_concurrency", 50),
            max_retries=data.get("max_request_retries", data.get("max_retries", 3)),
            max_results=data.get("max_results_per_crawl", data.get("max_results", 0)),
            # Output formats
            save=validate_save_formats(data.get("save", ["markdown"])),
        )

    def merge(self, overrides: dict[str, Any]) -> None:
        """Merge non-None overrides into this config.

        Keys matching TrafilaturaConfig fields are routed to self.trafilatura_config.
        Keys matching CrawlConfig fields are set directly.
        Unknown keys are ignored.
        """
        crawl_fields = {f.name for f in dataclass_fields(self)} - {"trafilatura_config"}

        for key, value in overrides.items():
            if value is None:
                continue
            if key in crawl_fields:
                setattr(self, key, value)
            elif key in _EXTRACTION_FIELDS:
                setattr(self.trafilatura_config, key, value)
