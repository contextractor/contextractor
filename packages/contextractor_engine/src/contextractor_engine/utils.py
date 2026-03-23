"""Utility functions for contextractor-engine."""

import re
from typing import Any


def to_snake_case(key: str) -> str:
    """Convert camelCase to snake_case. Leave snake_case unchanged."""
    if "_" in key:
        return key
    return re.sub(r"(?<!^)(?=[A-Z])", "_", key).lower()


def to_camel_case(key: str) -> str:
    """Convert snake_case to camelCase. Leave camelCase unchanged."""
    parts = key.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


def normalize_config_keys(config: dict[str, Any]) -> dict[str, Any]:
    """Normalize config dictionary keys to snake_case.

    Accepts both camelCase (JSON/API convention) and snake_case (Python convention).
    Auto-detects the format and converts camelCase to snake_case.
    Keys already in snake_case are left unchanged.

    Examples:
        {"favorPrecision": True} -> {"favor_precision": True}
        {"favor_precision": True} -> {"favor_precision": True}
        {"includeLinks": True, "fast": False} -> {"include_links": True, "fast": False}
    """
    if not config:
        return {}
    return {to_snake_case(k): v for k, v in config.items()}
