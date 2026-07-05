"""snake_case kwargs -> Contextractor CLI flags.

This module is the single, data-driven translation boundary (per
``.claude/rules/python-option-mapping.md``). ``OPTION_SPECS`` is the source of
truth; ``ExtractOptions`` is the matching typed surface for callers. The CLI flag
set lives in ``packages/standalone/src/cliProgram.ts`` (``addSinglePageOptions`` +
``addCrawlOptions`` plus the ``extract`` subcommand) — keep this table in sync
with it.

``storage_dir``, ``output_dir`` and ``timeout`` are intentionally absent: they are
explicit parameters of :func:`contextractor.extract` handled by the orchestrator,
not passthrough crawl flags.
"""

from __future__ import annotations

import enum
import json
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from typing import Any, Literal, TypedDict
from urllib.parse import urlsplit

from ._errors import ContextractorError, ProxySchemeError

_ALLOWED_PROXY_SCHEMES = frozenset({"http", "https", "socks4", "socks5"})


class _Kind(enum.Enum):
    SCALAR = "scalar"  # --flag <value>
    BOOL_PAIR = "bool_pair"  # True -> --flag, False -> --no-flag
    NEGATION_ONLY = "negation_only"  # default True; False -> --no-flag; True -> nothing
    BARE_SWITCH = "bare_switch"  # True -> --flag; else nothing
    REPEATABLE = "repeatable"  # list -> one --flag per item
    JSON = "json"  # value -> --flag <json.dumps(value)>


@dataclass(frozen=True, slots=True)
class _Spec:
    flag: str
    kind: _Kind
    no_flag: str | None = None  # only for BOOL_PAIR


# Keys MUST stay equal to ``ExtractOptions`` (enforced by a unit test).
OPTION_SPECS: dict[str, _Spec] = {
    # --- scalar value flags -------------------------------------------------
    "config_file": _Spec("--config-file", _Kind.SCALAR),
    "max_requests_per_crawl": _Spec("--max-requests-per-crawl", _Kind.SCALAR),
    "max_crawl_depth": _Spec("--max-crawl-depth", _Kind.SCALAR),
    "proxy_rotation": _Spec("--proxy-rotation", _Kind.SCALAR),
    "session_pool_name": _Spec("--session-pool-name", _Kind.SCALAR),
    "max_session_rotations": _Spec("--max-session-rotations", _Kind.SCALAR),
    "crawler_type": _Spec("--crawler-type", _Kind.SCALAR),
    "rendering_type_detection": _Spec("--rendering-type-detection", _Kind.SCALAR),
    "wait_until": _Spec("--wait-until", _Kind.SCALAR),
    "navigation_timeout": _Spec("--navigation-timeout", _Kind.SCALAR),
    "max_scroll_height": _Spec("--max-scroll-height", _Kind.SCALAR),
    "user_agent": _Spec("--user-agent", _Kind.SCALAR),
    "selector": _Spec("--selector", _Kind.SCALAR),
    "initial_concurrency": _Spec("--initial-concurrency", _Kind.SCALAR),
    "max_concurrency": _Spec("--max-concurrency", _Kind.SCALAR),
    "max_retries": _Spec("--max-retries", _Kind.SCALAR),
    "max_results": _Spec("--max-results", _Kind.SCALAR),
    "mode": _Spec("--mode", _Kind.SCALAR),
    "language": _Spec("--language", _Kind.SCALAR),
    "wait_for_dynamic_content": _Spec("--wait-for-dynamic-content", _Kind.SCALAR),
    "wait_for_selector": _Spec("--wait-for-selector", _Kind.SCALAR),
    "soft_wait_for_selector": _Spec("--soft-wait-for-selector", _Kind.SCALAR),
    "deduplication": _Spec("--deduplication", _Kind.SCALAR),
    "start_urls_file": _Spec("--start-urls-file", _Kind.SCALAR),
    # --- boolean --flag / --no-flag pairs -----------------------------------
    "headless": _Spec("--headless", _Kind.BOOL_PAIR, "--no-headless"),
    "block_media": _Spec("--block-media", _Kind.BOOL_PAIR, "--no-block-media"),
    "images": _Spec("--images", _Kind.BOOL_PAIR, "--no-images"),
    "close_cookie_modals": _Spec(
        "--close-cookie-modals", _Kind.BOOL_PAIR, "--no-close-cookie-modals"
    ),
    # --- negation-only (default include; False emits the --no- flag) ---------
    "links": _Spec("--no-links", _Kind.NEGATION_ONLY),
    "comments": _Spec("--no-comments", _Kind.NEGATION_ONLY),
    "tables": _Spec("--no-tables", _Kind.NEGATION_ONLY),
    # --- bare switches ------------------------------------------------------
    "purge": _Spec("--purge", _Kind.BARE_SWITCH),
    "ignore_cors_and_csp": _Spec("--ignore-cors-and-csp", _Kind.BARE_SWITCH),
    "ignore_https_errors": _Spec("--ignore-https-errors", _Kind.BARE_SWITCH),
    "keep_url_fragment": _Spec("--keep-url-fragment", _Kind.BARE_SWITCH),
    "use_sitemaps": _Spec("--use-sitemaps", _Kind.BARE_SWITCH),
    "respect_robots_txt": _Spec("--respect-robots-txt", _Kind.BARE_SWITCH),
    "store_skipped_urls": _Spec("--store-skipped-urls", _Kind.BARE_SWITCH),
    "verbose": _Spec("-v", _Kind.BARE_SWITCH),
    # --- repeatable (one flag per list item) --------------------------------
    "proxy": _Spec("--proxy", _Kind.REPEATABLE),
    "globs": _Spec("--globs", _Kind.REPEATABLE),
    "exclude": _Spec("--exclude", _Kind.REPEATABLE),
    "save": _Spec("--save", _Kind.REPEATABLE),
    # --- JSON-serialized ----------------------------------------------------
    "cookies": _Spec("--cookies", _Kind.JSON),
    "headers": _Spec("--headers", _Kind.JSON),
}


class ExtractOptions(TypedDict, total=False):
    """Typed crawl options. Every key maps to a CLI flag in :data:`OPTION_SPECS`.

    ``apify_proxy`` / ``groups`` / ``use_apify_proxy`` are intentionally absent —
    the CLI accepts only http/https/socks4/socks5 proxies and rejects Apify Proxy.
    """

    config_file: str
    max_requests_per_crawl: int
    max_crawl_depth: int
    proxy_rotation: Literal["recommended", "per-request", "until-failure"]
    session_pool_name: str
    max_session_rotations: int
    crawler_type: Literal["adaptive", "firefox", "chromium", "cheerio"]
    rendering_type_detection: float
    wait_until: Literal["load", "domcontentloaded", "networkidle", "commit"]
    navigation_timeout: int
    max_scroll_height: int
    user_agent: str
    selector: str
    initial_concurrency: int
    max_concurrency: int
    max_retries: int
    max_results: int
    mode: Literal["precision", "balanced", "recall"]
    language: str
    wait_for_dynamic_content: int
    wait_for_selector: str
    soft_wait_for_selector: str
    deduplication: Literal["minimal", "standard", "aggressive"]
    start_urls_file: str
    headless: bool
    block_media: bool
    images: bool
    links: bool
    comments: bool
    tables: bool
    purge: bool
    ignore_cors_and_csp: bool
    close_cookie_modals: bool
    ignore_https_errors: bool
    keep_url_fragment: bool
    use_sitemaps: bool
    respect_robots_txt: bool
    store_skipped_urls: bool
    verbose: bool
    proxy: list[str]
    globs: list[str]
    exclude: list[str]
    save: list[
        Literal[
            "txt-dataset",
            "txt-kvs",
            "markdown-dataset",
            "markdown-kvs",
            "json-dataset",
            "json-kvs",
            "html-dataset",
            "html-kvs",
            "original-dataset",
            "original-kvs",
        ]
    ]
    cookies: list[dict[str, Any]]
    headers: dict[str, str]


class ExtractOneOptions(TypedDict, total=False):
    """Typed single-page options for ``extract_one``/``aextract_one``.

    A subset of :class:`ExtractOptions` mirroring the CLI's ``extract-one``
    surface: only the extraction/rendering/network/content knobs that apply to
    one page. The crawl-frontier, storage, and output-routing options are
    ``extract``-only (``extract_one`` returns values; nothing is persisted), as
    is ``session_pool_name`` — cross-run session sharing needs persisted
    session-pool state under ``--storage``, which ``extract-one`` never touches.
    """

    proxy_rotation: Literal["recommended", "per-request", "until-failure"]
    max_session_rotations: int
    crawler_type: Literal["adaptive", "firefox", "chromium", "cheerio"]
    rendering_type_detection: float
    wait_until: Literal["load", "domcontentloaded", "networkidle", "commit"]
    navigation_timeout: int
    max_scroll_height: int
    user_agent: str
    max_retries: int
    mode: Literal["precision", "balanced", "recall"]
    language: str
    wait_for_dynamic_content: int
    wait_for_selector: str
    soft_wait_for_selector: str
    headless: bool
    block_media: bool
    images: bool
    links: bool
    comments: bool
    tables: bool
    ignore_cors_and_csp: bool
    close_cookie_modals: bool
    ignore_https_errors: bool
    respect_robots_txt: bool
    verbose: bool
    proxy: list[str]
    cookies: list[dict[str, Any]]
    headers: dict[str, str]


# Keys valid on the extract-one subcommand (enforced by a unit test to stay a
# subset of OPTION_SPECS and equal to ExtractOneOptions).
EXTRACT_ONE_OPTION_KEYS: frozenset[str] = frozenset(ExtractOneOptions.__annotations__)


def validate_proxies(proxies: Sequence[str]) -> None:
    """Reject any proxy whose scheme is not http/https/socks4/socks5.

    Mirrors the CLI's ``validateProxy`` but fails fast in Python, before spawn.
    The raw URL (which carries credentials) is never echoed in the error.
    """
    for raw in proxies:
        try:
            scheme = urlsplit(raw).scheme.lower()
        except ValueError:
            # urlsplit rejects e.g. malformed IPv6 brackets; stay inside the
            # ContextractorError hierarchy and never echo the raw URL.
            raise ProxySchemeError("malformed proxy URL") from None
        if scheme not in _ALLOWED_PROXY_SCHEMES:
            raise ProxySchemeError(
                f"unsupported proxy scheme {scheme or '(none)'!r}; "
                "use one of: http, https, socks4, socks5"
            )


def build_extract_one_args(opts: Mapping[str, Any]) -> list[str]:
    """Translate ``extract_one`` options to CLI flags.

    Rejects every key outside the single-page subset (the ``extract``-only
    crawl-frontier/storage/output options are invalid on ``extract-one``).
    """
    for key in opts:
        if key not in EXTRACT_ONE_OPTION_KEYS:
            raise ContextractorError(f"unknown extract_one option: {key!r}")
    return build_extract_args(opts)


def build_extract_args(opts: Mapping[str, Any]) -> list[str]:
    """Translate set options to CLI flags. Unknown keys raise; ``None`` is skipped."""
    args: list[str] = []
    for key, value in opts.items():
        if value is None:
            continue
        spec = OPTION_SPECS.get(key)
        if spec is None:
            raise ContextractorError(f"unknown option: {key!r}")
        if key == "proxy":
            validate_proxies(value)
        if spec.kind is _Kind.SCALAR:
            args += [spec.flag, str(value)]
        elif spec.kind is _Kind.BOOL_PAIR:
            args.append(spec.flag if value else spec.no_flag)  # type: ignore[arg-type]
        elif spec.kind is _Kind.NEGATION_ONLY:
            if value is False:
                args.append(spec.flag)
        elif spec.kind is _Kind.BARE_SWITCH:
            if value:
                args.append(spec.flag)
        elif spec.kind is _Kind.REPEATABLE:
            for item in value:
                args += [spec.flag, str(item)]
        elif spec.kind is _Kind.JSON:
            args += [spec.flag, json.dumps(value, separators=(",", ":"))]
    return args
