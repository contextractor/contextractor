"""CLI entry point using Typer."""

from __future__ import annotations

import asyncio
import logging
from pathlib import Path
from typing import Annotated, Optional

import typer

from .config import CrawlConfig
from .crawler import run_crawl

app = typer.Typer(
    name="contextractor",
    help="Extract web content from URLs using configurable extraction options.",
)


@app.command()
def extract(
    urls: Annotated[
        Optional[list[str]],
        typer.Argument(help="URLs to extract content from"),
    ] = None,
    # -- Config file --
    config: Annotated[
        Optional[Path],
        typer.Option("--config", "-c", help="Path to YAML or JSON config file",
                     exists=True, readable=True),
    ] = None,
    # -- CrawlConfig fields --
    max_pages: Annotated[
        Optional[int],
        typer.Option("--max-pages", help="Max pages to crawl (0 = unlimited)"),
    ] = None,
    crawl_depth: Annotated[
        Optional[int],
        typer.Option("--crawl-depth", help="Max link depth from start URLs (0 = start only)"),
    ] = None,
    headless: Annotated[
        Optional[bool],
        typer.Option("--headless/--no-headless", help="Run browser in headless mode"),
    ] = None,
    output_dir: Annotated[
        Optional[str],
        typer.Option("--output-dir", "-o", help="Output directory"),
    ] = None,
    output_format: Annotated[
        Optional[str],
        typer.Option("--format", "-f",
                     help="Output format (txt, markdown, json, xml, xmltei)"),
    ] = None,
    # -- TrafilaturaConfig fields --
    precision: Annotated[
        Optional[bool],
        typer.Option("--precision", help="High precision mode (less noise)"),
    ] = None,
    recall: Annotated[
        Optional[bool],
        typer.Option("--recall", help="High recall mode (more content)"),
    ] = None,
    fast: Annotated[
        Optional[bool],
        typer.Option("--fast", help="Fast extraction mode (less thorough)"),
    ] = None,
    no_links: Annotated[
        Optional[bool],
        typer.Option("--no-links", help="Exclude links from output"),
    ] = None,
    no_comments: Annotated[
        Optional[bool],
        typer.Option("--no-comments", help="Exclude comments from output"),
    ] = None,
    include_tables: Annotated[
        Optional[bool],
        typer.Option("--include-tables/--no-tables", help="Include tables in output"),
    ] = None,
    include_images: Annotated[
        Optional[bool],
        typer.Option("--include-images", help="Include image descriptions"),
    ] = None,
    include_formatting: Annotated[
        Optional[bool],
        typer.Option("--include-formatting/--no-formatting",
                     help="Preserve text formatting"),
    ] = None,
    deduplicate: Annotated[
        Optional[bool],
        typer.Option("--deduplicate", help="Deduplicate extracted content"),
    ] = None,
    target_language: Annotated[
        Optional[str],
        typer.Option("--target-language", help="Filter by language (e.g. 'en')"),
    ] = None,
    with_metadata: Annotated[
        Optional[bool],
        typer.Option("--with-metadata/--no-metadata",
                     help="Extract metadata along with content"),
    ] = None,
    prune_xpath: Annotated[
        Optional[list[str]],
        typer.Option("--prune-xpath", help="XPath patterns to remove from content"),
    ] = None,
    # -- Diagnostics --
    verbose: Annotated[
        bool,
        typer.Option("--verbose", "-v", help="Enable verbose logging"),
    ] = False,
) -> None:
    """Extract content from web pages."""
    # Set up logging
    log_level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%H:%M:%S",
    )

    # 1. Start with defaults
    cfg = CrawlConfig()

    # 2. If config file provided, load and merge
    if config is not None:
        file_config = CrawlConfig.from_file(config)
        # Replace with file-loaded config as base
        cfg = file_config

    # 3. Merge CLI args (CLI wins over file)
    cli_overrides: dict[str, object] = {
        "max_pages": max_pages,
        "crawl_depth": crawl_depth,
        "headless": headless,
        "output_dir": output_dir,
        "output_format": output_format,
        # Extraction settings
        "fast": fast,
        "favor_precision": precision,
        "favor_recall": recall,
        "include_tables": include_tables,
        "include_images": include_images,
        "include_formatting": include_formatting,
        "deduplicate": deduplicate,
        "target_language": target_language,
        "with_metadata": with_metadata,
        "prune_xpath": prune_xpath if prune_xpath else None,
    }

    # Handle --no-links and --no-comments (invert to include_*)
    if no_links:
        cli_overrides["include_links"] = False
    if no_comments:
        cli_overrides["include_comments"] = False

    cfg.merge(cli_overrides)

    # 4. URLs from positional args extend/override config urls
    if urls:
        cfg.urls = list(urls)

    # 5. Validate
    if not cfg.urls:
        typer.echo("Error: No URLs specified. Provide URLs as arguments or via --config.", err=True)
        raise typer.Exit(1)

    typer.echo(f"Extracting {len(cfg.urls)} URL(s) → {cfg.output_dir}/ ({cfg.output_format})")
    asyncio.run(run_crawl(cfg))
