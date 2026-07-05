"""Sync example: crawl a page and extract clean main-content text from Python.

This is exactly what a PyPI user writes after `pip install contextractor` and
`python -m contextractor install`. The library drives a bundled Node engine via
subprocess — no Node.js install is required, and Python never loads the native
`.node` module.

Run:  python main.py
"""

from __future__ import annotations

import json
from pathlib import Path

import contextractor

OUTPUT_DIR = Path(__file__).parent / "output"


def main() -> None:
    # `save` is a list of `format-destination` tokens. Here markdown is saved to
    # BOTH the dataset (inline) and the key-value store (a blob), json is inlined
    # in the dataset, and the raw page HTML is stored as a KVS blob. Options are
    # snake_case keyword arguments (see ExtractOptions / the package README).
    summary = contextractor.extract(
        ["https://example.com"],
        save=["markdown-dataset", "markdown-kvs", "json-dataset", "original-kvs"],
        output_dir=str(OUTPUT_DIR),
        max_requests_per_crawl=1,
    )

    # Partial failures do NOT raise — they are reflected in summary.failed.
    print("ExtractSummary:")
    print(f"  total     = {summary.total}")
    print(f"  succeeded = {summary.succeeded}")
    print(f"  failed    = {summary.failed}")
    print(f"  skipped   = {summary.skipped}")
    print(f"  output_dir    = {summary.output_dir}")
    print(f"  manifest_path = {summary.manifest_path}")

    # manifest.json is a JSON array of records, each tagged with a status. For a
    # successful record, every saved format is a node like {hash, bytes, content?}.
    records = json.loads(Path(summary.manifest_path).read_text(encoding="utf-8"))
    print(f"\nManifest has {len(records)} record(s).")
    first = records[0] if records else None
    if first:
        title = (first.get("metadata") or {}).get("title")
        formats = [
            k for k in ("markdown", "txt", "json", "html", "original") if k in first
        ]
        print(f"  url     = {first.get('url')!r}")
        print(f"  status  = {first.get('status')!r}")
        print(f"  title   = {title!r}")
        print(f"  formats = {formats}")
        markdown = first.get("markdown")
        if isinstance(markdown, dict) and isinstance(markdown.get("content"), str):
            snippet = markdown["content"].strip().splitlines()[:3]
            print("  markdown preview:")
            for line in snippet:
                print(f"    | {line}")

    # The export step also wrote human-named files next to the manifest.
    files = sorted(p.name for p in OUTPUT_DIR.iterdir() if p.is_file())
    print(f"\nFiles written to {OUTPUT_DIR}:")
    for name in files:
        print(f"  - {name}")

    # extract_one() crawls exactly ONE URL (no link-following) and returns the
    # extracted content directly as a value — a `str` when a single format is
    # requested (`formats` defaults to "markdown"). Nothing is persisted to disk.
    # It raises ContextractorError when the page cannot be extracted.
    page_md = contextractor.extract_one("https://example.com")
    print("\nextract_one() markdown preview:")
    for line in page_md.strip().splitlines()[:3]:
        print(f"  | {line}")


if __name__ == "__main__":
    main()
