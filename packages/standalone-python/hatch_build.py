"""Hatchling build hook forcing a platform-tagged wheel.

The wheel bundles a flattened Node CLI tree plus the build platform's native
`.node` addon, so it must be tagged `py3-none-{platform}` rather than
`py3-none-any`. The assets themselves are staged into
``src/contextractor/_vendor/`` before the build by ``scripts/stage_vendor.py``
(driven by ``CIBW_BEFORE_ALL`` in CI); this hook sets the wheel tag and
force-includes the attribution NOTICE.

``CONTEXTRACTOR_WHEEL_PLATFORM`` pins the platform tag explicitly (e.g.
``manylinux_2_28_x86_64``). CI sets it per matrix row because auditwheel/delocate
repair is disabled — there is no ELF Python extension to relabel a bare
``linux_x86_64`` wheel into a PyPI-acceptable ``manylinux`` tag. When unset (e.g. a
local ``python -m build`` on the native platform), the tag is inferred.

The hook also force-includes the third-party attribution ``NOTICE`` (Ghostery
MPL-2.0) through the build hook (not a static ``force-include`` table). After the
engine un-nest both layouts are symmetric — the tools engine workspace
(``projects/contextractor-engine/``) and the public mirror each place ``NOTICE`` at
the workspace root, ``../../NOTICE`` relative to this package — mirroring how
``tsup.config.ts`` resolves its NOTICE/LICENSE.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from hatchling.builders.hooks.plugin.interface import BuildHookInterface

_HERE = Path(__file__).resolve().parent
# After the engine un-nest, NOTICE sits at the workspace root in both layouts
# (tools engine workspace and the public mirror), two levels up from this package.
_NOTICE_CANDIDATES = (_HERE.parent.parent / "NOTICE",)


class CustomBuildHook(BuildHookInterface):
    def initialize(self, version: str, build_data: dict[str, Any]) -> None:
        # Platform-specific (bundles a .node) but ABI-agnostic: the package is pure
        # Python with no CPython extension, so it runs on any Python 3.x →
        # py3-none-{platform}, not cp312-cp312-{platform}.
        build_data["pure_python"] = False
        build_data["tag"] = f"py3-none-{self._platform()}"
        self._force_include_notice(build_data)

    def _force_include_notice(self, build_data: dict[str, Any]) -> None:
        # Inject the NOTICE dynamically instead of a static `force-include` table so
        # the path resolves in both the tools and mirror layouts. Both standard and
        # editable (`pip install -e`) wheel builds consult this map.
        for notice in _NOTICE_CANDIDATES:
            if notice.is_file():
                build_data["force_include"][str(notice)] = "contextractor/NOTICE"
                return
        raise FileNotFoundError(
            "NOTICE not found in either layout; tried "
            + ", ".join(str(candidate) for candidate in _NOTICE_CANDIDATES)
        )

    def _platform(self) -> str:
        # CI pins the platform tag per matrix row; locally infer it (auditwheel
        # repair is disabled, so the tag must be correct at build time).
        pinned = os.environ.get("CONTEXTRACTOR_WHEEL_PLATFORM")
        if pinned:
            return pinned
        from packaging.tags import sys_tags

        return next(iter(sys_tags())).platform
