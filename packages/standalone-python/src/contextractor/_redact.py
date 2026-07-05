"""Redaction helpers — proxy URLs carry credentials and must never leak.

Used on any child-process stderr surfaced to the caller and on argv before it is
ever logged. See ``.claude/rules/security.md``.
"""

from __future__ import annotations

import re
from collections.abc import Iterable, Sequence

# Matches the ``user:pass@`` userinfo of a URL so credentials can be masked while
# keeping the scheme/host for debuggability. Greedy up to the LAST ``@`` before a
# ``/`` or whitespace, so a credential containing a literal ``@`` (e.g. a child
# process echoing the password URL-decoded) is masked in full, never partially.
_USERINFO_RE = re.compile(r"(?P<scheme>[a-zA-Z][a-zA-Z0-9+.\-]*://)[^/\s]+@")

_PROXY_FLAGS = ("--proxy",)


def redact(text: str, secrets: Iterable[str] = ()) -> str:
    """Mask known secret strings and any URL userinfo in ``text``."""
    for secret in secrets:
        if secret:
            text = text.replace(secret, "***")
    return _USERINFO_RE.sub(lambda m: f"{m.group('scheme')}***@", text)


def redact_argv(argv: Sequence[str]) -> list[str]:
    """Return a copy of ``argv`` with every proxy value fully masked."""
    masked: list[str] = []
    mask_next = False
    for arg in argv:
        if mask_next:
            masked.append("***")
            mask_next = False
            continue
        if arg in _PROXY_FLAGS:
            masked.append(arg)
            mask_next = True
            continue
        if arg.startswith("--proxy="):
            masked.append("--proxy=***")
            continue
        masked.append(redact(arg))
    return masked
