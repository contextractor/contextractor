"""Shared pytest fixtures for contextractor unit tests."""

import pytest
from pathlib import Path

FIXTURES_DIR = Path(__file__).parent / "fixtures"


@pytest.fixture
def fixtures_dir() -> Path:
    """Return the fixtures directory path."""
    return FIXTURES_DIR


def load_html_fixture(suite: str, test_case: str) -> str:
    """Load an HTML fixture file."""
    fixture_path = FIXTURES_DIR / suite / f"{test_case}.html"
    return fixture_path.read_text(encoding="utf-8")
