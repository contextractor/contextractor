"""``python -m contextractor install [browser]`` — browser provisioning only.

This is the package's module entry point, NOT a console script: the package is
library-only and declares no ``[project.scripts]``.
"""

from __future__ import annotations

import sys

from ._install import install


def main(argv: list[str] | None = None) -> int:
    args = sys.argv[1:] if argv is None else argv
    if not args or args[0] != "install":
        sys.stderr.write("usage: python -m contextractor install [browser]\n")
        return 2
    browser = args[1] if len(args) > 1 else "chromium"
    install(browser)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
