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

    urls: list[str] = field(default_factory=list)
    max_pages: int = 0
    output_format: str = "markdown"
    output_dir: str = "./output"
    crawl_depth: int = 0
    headless: bool = True
    extraction: TrafilaturaConfig = field(default_factory=TrafilaturaConfig.balanced)

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
        return cls(
            urls=data.get("urls", []),
            max_pages=data.get("maxPages", 0),
            output_format=data.get("outputFormat", "markdown"),
            output_dir=data.get("outputDir", "./output"),
            crawl_depth=data.get("crawlDepth", 0),
            headless=data.get("headless", True),
            extraction=extraction,
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
