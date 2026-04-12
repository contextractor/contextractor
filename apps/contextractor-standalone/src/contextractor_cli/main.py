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
        typer.Option("--config", "-c", help="Path to JSON config file",
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
    # -- Proxy --
    proxy_urls: Annotated[
        Optional[str],
        typer.Option("--proxy-urls",
                     help="Comma-separated proxy URLs (http://user:pass@host:port)"),
    ] = None,
    proxy_rotation: Annotated[
        Optional[str],
        typer.Option("--proxy-rotation",
                     help="Proxy rotation: recommended, per_request, until_failure"),
    ] = None,
    # -- Browser settings --
    launcher: Annotated[
        Optional[str],
        typer.Option("--launcher", help="Browser engine: chromium, firefox"),
    ] = None,
    wait_until: Annotated[
        Optional[str],
        typer.Option("--wait-until",
                     help="Page load event: networkidle, load, domcontentloaded"),
    ] = None,
    page_load_timeout: Annotated[
        Optional[int],
        typer.Option("--page-load-timeout", help="Page load timeout in seconds"),
    ] = None,
    ignore_cors: Annotated[
        Optional[bool],
        typer.Option("--ignore-cors", help="Disable CORS/CSP restrictions"),
    ] = None,
    close_cookie_modals: Annotated[
        Optional[bool],
        typer.Option("--close-cookie-modals", help="Auto-dismiss cookie banners"),
    ] = None,
    max_scroll_height: Annotated[
        Optional[int],
        typer.Option("--max-scroll-height", help="Max scroll height in pixels"),
    ] = None,
    ignore_ssl_errors: Annotated[
        Optional[bool],
        typer.Option("--ignore-ssl-errors", help="Skip SSL certificate verification"),
    ] = None,
    user_agent: Annotated[
        Optional[str],
        typer.Option("--user-agent", help="Custom User-Agent string"),
    ] = None,
    # -- Crawl filtering --
    globs: Annotated[
        Optional[str],
        typer.Option("--globs", help="Comma-separated glob patterns to include"),
    ] = None,
    excludes: Annotated[
        Optional[str],
        typer.Option("--excludes", help="Comma-separated glob patterns to exclude"),
    ] = None,
    link_selector: Annotated[
        Optional[str],
        typer.Option("--link-selector", help="CSS selector for links to follow"),
    ] = None,
    keep_url_fragments: Annotated[
        Optional[bool],
        typer.Option("--keep-url-fragments", help="Preserve URL fragments"),
    ] = None,
    respect_robots_txt: Annotated[
        Optional[bool],
        typer.Option("--respect-robots-txt", help="Honor robots.txt"),
    ] = None,
    # -- Cookies & headers --
    cookies: Annotated[
        Optional[str],
        typer.Option("--cookies", help="JSON array of cookie objects"),
    ] = None,
    headers: Annotated[
        Optional[str],
        typer.Option("--headers", help="JSON object of custom HTTP headers"),
    ] = None,
    # -- Concurrency & retries --
    max_concurrency: Annotated[
        Optional[int],
        typer.Option("--max-concurrency", help="Max parallel requests"),
    ] = None,
    max_retries: Annotated[
        Optional[int],
        typer.Option("--max-retries", help="Max request retries"),
    ] = None,
    max_results: Annotated[
        Optional[int],
        typer.Option("--max-results", help="Max results per crawl (0 = unlimited)"),
    ] = None,
    # -- Output toggles --
    save_markdown: Annotated[
        Optional[bool],
        typer.Option("--save-markdown/--no-save-markdown",
                     help="Save extracted markdown (default: true)"),
    ] = None,
    save_raw_html: Annotated[
        Optional[bool],
        typer.Option("--save-raw-html", help="Save raw HTML to output"),
    ] = None,
    save_text: Annotated[
        Optional[bool],
        typer.Option("--save-text", help="Save extracted text"),
    ] = None,
    save_json: Annotated[
        Optional[bool],
        typer.Option("--save-json", help="Save extracted JSON"),
    ] = None,
    save_jsonl: Annotated[
        Optional[bool],
        typer.Option("--save-jsonl", help="Save all pages as JSONL (single file)"),
    ] = None,
    save_xml: Annotated[
        Optional[bool],
        typer.Option("--save-xml", help="Save extracted XML"),
    ] = None,
    save_xml_tei: Annotated[
        Optional[bool],
        typer.Option("--save-xml-tei", help="Save extracted XML-TEI"),
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
    import json as json_mod

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
        # Proxy
        "proxy_urls": [u.strip() for u in proxy_urls.split(",")] if proxy_urls else None,
        "proxy_rotation": proxy_rotation,
        # Browser
        "launcher": launcher.lower() if launcher else None,
        "wait_until": wait_until.lower() if wait_until else None,
        "page_load_timeout": page_load_timeout,
        "ignore_cors": ignore_cors,
        "close_cookie_modals": close_cookie_modals,
        "max_scroll_height": max_scroll_height,
        "ignore_ssl_errors": ignore_ssl_errors,
        "user_agent": user_agent,
        # Crawl filtering
        "globs": [g.strip() for g in globs.split(",")] if globs else None,
        "excludes": [e.strip() for e in excludes.split(",")] if excludes else None,
        "link_selector": link_selector,
        "keep_url_fragments": keep_url_fragments,
        "respect_robots_txt": respect_robots_txt,
        # Cookies & headers
        "cookies": json_mod.loads(cookies) if cookies else None,
        "headers": json_mod.loads(headers) if headers else None,
        # Concurrency & retries
        "max_concurrency": max_concurrency,
        "max_retries": max_retries,
        "max_results": max_results,
        # Output toggles
        "save_markdown": save_markdown,
        "save_raw_html": save_raw_html,
        "save_text": save_text,
        "save_json": save_json,
        "save_jsonl": save_jsonl,
        "save_xml": save_xml,
        "save_xml_tei": save_xml_tei,
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

    # Build list of active output formats for display
    active_formats = []
    if cfg.save_markdown:
        active_formats.append("markdown")
    if cfg.save_raw_html:
        active_formats.append("html")
    if cfg.save_text:
        active_formats.append("text")
    if cfg.save_json:
        active_formats.append("json")
    if cfg.save_jsonl:
        active_formats.append("jsonl")
    if cfg.save_xml:
        active_formats.append("xml")
    if cfg.save_xml_tei:
        active_formats.append("xml-tei")
    formats_str = ", ".join(active_formats) if active_formats else "markdown"

    typer.echo(f"Extracting {len(cfg.urls)} URL(s) → {cfg.output_dir}/ ({formats_str})")
    asyncio.run(run_crawl(cfg))
