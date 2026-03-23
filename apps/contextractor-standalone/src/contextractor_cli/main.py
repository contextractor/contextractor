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
    no_args_is_help=True,
)


@app.command()
def extract(
    config_file: Annotated[
        Path,
        typer.Argument(
            help="Path to YAML or JSON config file",
            exists=True,
            readable=True,
        ),
    ],
    precision: Annotated[
        bool,
        typer.Option("--precision", help="High precision mode (less noise)"),
    ] = False,
    recall: Annotated[
        bool,
        typer.Option("--recall", help="High recall mode (more content)"),
    ] = False,
    no_links: Annotated[
        bool,
        typer.Option("--no-links", help="Exclude links from output"),
    ] = False,
    no_comments: Annotated[
        bool,
        typer.Option("--no-comments", help="Exclude comments from output"),
    ] = False,
    verbose: Annotated[
        bool,
        typer.Option("--verbose", "-v", help="Enable verbose logging"),
    ] = False,
    output_dir: Annotated[
        Optional[str],
        typer.Option("--output-dir", "-o", help="Override output directory"),
    ] = None,
    output_format: Annotated[
        Optional[str],
        typer.Option(
            "--format", "-f",
            help="Override output format (txt, markdown, json, xml, xmltei)",
        ),
    ] = None,
) -> None:
    """Extract content from web pages defined in a config file."""
    # Set up logging
    log_level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%H:%M:%S",
    )

    # Load config from file
    config = CrawlConfig.from_file(config_file)

    # Apply CLI overrides
    config.apply_cli_overrides(
        precision=precision,
        recall=recall,
        no_links=no_links,
        no_comments=no_comments,
    )

    if output_dir:
        config.output_dir = output_dir
    if output_format:
        config.output_format = output_format

    if not config.urls:
        typer.echo("Error: No URLs specified in config file.", err=True)
        raise typer.Exit(1)

    typer.echo(f"Extracting {len(config.urls)} URL(s) → {config.output_dir}/ ({config.output_format})")
    asyncio.run(run_crawl(config))
