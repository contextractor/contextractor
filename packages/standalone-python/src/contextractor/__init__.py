"""Contextractor — drive the Node crawler/extractor from Python.

``extract`` (sync) and ``aextract`` (async) spawn the bundled Node CLI to crawl
URLs and write clean main-content text (txt/markdown/json/html) to a directory,
then return an :class:`ExtractSummary` of per-status counts. ``extract_one``
and ``aextract_one`` crawl exactly one URL and return the extracted content as
values (a ``str`` for one format, a ``dict[str, str]`` for several). Python
loads no JavaScript and no native ``.node`` — Node does. Provision browsers
once with ``python -m contextractor install``.
"""

from __future__ import annotations

from importlib.metadata import PackageNotFoundError, version

from ._errors import (
    ContextractorError,
    MissingBrowserError,
    NodeRuntimeError,
    ProxySchemeError,
)
from ._install import install
from ._manifest import ExtractSummary
from ._options import ExtractOneOptions, ExtractOptions
from ._run import aextract, aextract_one, extract, extract_one

try:
    __version__ = version("contextractor")
except PackageNotFoundError:  # pragma: no cover - source checkout without install
    __version__ = "0+unknown"

__all__ = [
    "ContextractorError",
    "ExtractOneOptions",
    "ExtractOptions",
    "ExtractSummary",
    "MissingBrowserError",
    "NodeRuntimeError",
    "ProxySchemeError",
    "__version__",
    "aextract",
    "aextract_one",
    "extract",
    "extract_one",
    "install",
]
