# `from __future__ import annotations` Status

Still valid and recommended for Python 3.12+. All production code in this project uses it.

PEP 649/749 (deferred evaluation without stringization) ships in Python 3.14. Until then, `from __future__ import annotations` remains the standard approach.

After 3.14 ships, PEP 563 will be deprecated but not removed. No action needed for at least 1+ years.
