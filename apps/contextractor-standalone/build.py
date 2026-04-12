"""Build platform-specific binary using PyInstaller."""

from __future__ import annotations

import os
import platform
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parent
DIST_DIR = ROOT / "dist"
NPM_BIN_DIR = ROOT / "npm" / "bin"

PLATFORM_MAP = {"Darwin": "darwin", "Linux": "linux", "Windows": "win"}
ARCH_MAP = {"x86_64": "x64", "AMD64": "x64", "aarch64": "arm64", "arm64": "arm64"}


def get_binary_name() -> str:
    plat = PLATFORM_MAP.get(platform.system())
    arch = ARCH_MAP.get(platform.machine())
    if not plat or not arch:
        print(f"Unsupported platform: {platform.system()}-{platform.machine()}")
        sys.exit(1)
    ext = ".exe" if platform.system() == "Windows" else ""
    return f"contextractor-{plat}-{arch}{ext}"


def build() -> None:
    binary_name = get_binary_name()
    print(f"Building {binary_name}...")

    # Ensure PyInstaller is available
    subprocess.run(
        ["uv", "pip", "install", "pyinstaller", "--python", sys.executable],
        check=True,
        capture_output=True,
    )

    # Build with PyInstaller
    entry_point = str(ROOT / "entry.py")
    src_path = str(ROOT / "src")
    subprocess.run(
        [
            sys.executable,
            "-m",
            "PyInstaller",
            "--onefile",
            "--name",
            binary_name.removesuffix(".exe"),
            "--distpath",
            str(DIST_DIR),
            "--workpath",
            str(ROOT / "build"),
            "--specpath",
            str(ROOT),
            "--paths",
            src_path,
            "--hidden-import",
            "contextractor_cli",
            "--hidden-import",
            "contextractor_cli.main",
            "--hidden-import",
            "contextractor_cli.config",
            "--hidden-import",
            "contextractor_cli.crawler",
            "--hidden-import",
            "contextractor_engine",
            "--hidden-import",
            "yaml",
            "--hidden-import",
            "typer",
            "--hidden-import",
            "trafilatura",
            "--hidden-import",
            "crawlee",
            "--collect-all",
            "trafilatura",
            "--collect-all",
            "justext",
            "--collect-all",
            "crawlee",
            "--collect-all",
            "typer",
            "--collect-all",
            "yaml",
            "--collect-all",
            "browserforge",
            "--collect-all",
            "apify_fingerprint_datapoints",
            "--collect-all",
            "certifi",
            "--collect-all",
            "playwright",
            "--clean",
            "--noconfirm",
            entry_point,
        ],
        check=True,
        cwd=str(ROOT),
    )

    # Copy to npm/bin/
    NPM_BIN_DIR.mkdir(parents=True, exist_ok=True)
    src = DIST_DIR / binary_name
    dst = NPM_BIN_DIR / binary_name
    shutil.copy2(src, dst)
    os.chmod(dst, 0o755)
    print(f"Binary ready: {dst}")


if __name__ == "__main__":
    build()
