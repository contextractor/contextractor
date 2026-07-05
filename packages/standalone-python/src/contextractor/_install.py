"""Browser provisioning: run the bundled ``playwright install`` via bundled Node.

Browsers never ship in the wheel. ``python -m contextractor install`` invokes the
Playwright CLI bundled in ``_vendor/cli`` (pinned to the crawler's Playwright
version), so the browser revision always matches the shipped engine. Honors
``PLAYWRIGHT_BROWSERS_PATH`` via the inherited environment.
"""

from __future__ import annotations

import subprocess

from ._errors import ContextractorError
from ._runtime import playwright_cli_js, resolve_node, vendor_cli_dir


def install(browser: str = "chromium") -> None:
    """Download the Playwright ``browser`` (default chromium) for the bundled engine."""
    with vendor_cli_dir() as cli_dir:
        argv = [resolve_node(), str(playwright_cli_js(cli_dir)), "install", browser]
        proc = subprocess.run(argv, check=False)
    if proc.returncode != 0:
        raise ContextractorError(f"`playwright install {browser}` failed (exit {proc.returncode})")
