"""Typed exceptions for the contextractor wrapper."""

from __future__ import annotations


class ContextractorError(Exception):
    """Base error for everything the wrapper raises."""


class ProxySchemeError(ContextractorError):
    """A proxy URL used a scheme other than http/https/socks4/socks5."""


class NodeRuntimeError(ContextractorError):
    """The bundled Node runtime or CLI could not be located or executed."""


class MissingBrowserError(ContextractorError):
    """Playwright's browser is not installed; run ``python -m contextractor install``."""
