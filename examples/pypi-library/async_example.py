"""Async example: crawl multiple pages concurrently with aextract().

aextract() is the asyncio counterpart of extract() — the same options, one crawl
per child process. aextract_one() fetches a single page and returns the content
as values. Run:  python async_example.py
"""

from __future__ import annotations

import asyncio
from pathlib import Path

import contextractor

OUTPUT_DIR = Path(__file__).parent / "output-async"


async def main() -> None:
    summary = await contextractor.aextract(
        ["https://example.com", "https://www.iana.org/domains/reserved"],
        # markdown inline in the dataset record; raw HTML as a key-value-store blob.
        save=["markdown-dataset", "original-kvs"],
        output_dir=str(OUTPUT_DIR),
        max_concurrency=2,
        max_requests_per_crawl=2,
    )
    print(
        f"aextract: {summary.succeeded} of {summary.total} succeeded "
        f"(failed={summary.failed}, skipped={summary.skipped})"
    )
    print(f"output_dir = {summary.output_dir}")

    # aextract_one() crawls exactly ONE URL (no link-following) and returns the
    # content directly — a dict[str, str] keyed by format when several formats
    # are requested (a plain str for one). Nothing is persisted to disk.
    contents = await contextractor.aextract_one(
        "https://example.com", formats=["markdown", "txt"]
    )
    assert isinstance(contents, dict)  # several formats -> dict keyed by format
    for fmt, text in contents.items():
        print(f"aextract_one {fmt}: {len(text)} chars")


if __name__ == "__main__":
    asyncio.run(main())
