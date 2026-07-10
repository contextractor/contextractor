# contextractor

<table>
  <tbody>
    <tr>
      <td>
        <img align="right" width="220" src="https://www.contextractor.com/media/cover-mini.svg" alt="Contextractor" />
        <a href="https://pypi.org/project/contextractor/"><img src="https://img.shields.io/pypi/v/contextractor.svg" alt="PyPI version" /></a>
        <a href="https://pypi.org/project/contextractor/"><img src="https://img.shields.io/pypi/dm/contextractor.svg" alt="PyPI downloads" /></a>
        <a href="https://github.com/contextractor/contextractor/blob/main/LICENSE"><img src="https://img.shields.io/pypi/l/contextractor.svg" alt="license" /></a>
        <h3>Also available as:</h3>
        <strong><a href="https://www.contextractor.com/">Online playground</a></strong> <sub><a href="https://www.contextractor.com/">playground</a>, <a href="https://www.contextractor.com/help/web/">help</a></sub> | <strong><a href="https://apify.com/glueo/contextractor?fpr=glueo">Apify Actor</a></strong> <sub><a href="https://apify.com/glueo/contextractor?fpr=glueo">actor</a>, <a href="https://www.contextractor.com/help/apify/">help</a></sub> | <strong><a href="https://www.npmjs.com/package/contextractor">NPM package CLI &amp; lib</a></strong> <sub><a href="https://www.npmjs.com/package/contextractor">package</a>, <a href="https://www.contextractor.com/help/npm/">CLI help</a>, <a href="https://www.contextractor.com/help/npm-lib/">lib help</a></sub> | <strong><a href="https://github.com/contextractor/contextractor">Source code on GitHub</a></strong>
        <h3>Social:</h3>
        <strong><a href="https://x.com/contextractor">X (Twitter)</a></strong>
      </td>
    </tr>
  </tbody>
</table>

Drive the Contextractor Node crawler from Python — clean content in txt/markdown/json/html, plus raw original HTML.

> **⚠️ Alpha / experimental.** This Python wrapper for Contextractor is currently
> an **alpha**, experimental release — not fully tested or officially supported,
> though still maintained.

Crawl web pages and extract clean main-content text — `txt`, `markdown`, `json`,
`html`, or raw `original` HTML — from Python. Built on [Trafilatura Core](https://www.trafilatura.dev/)
(extraction) and [Crawlee](https://crawlee.dev/) with Playwright or a pure-HTTP
Cheerio crawler (crawling).

This package is a thin, typed wrapper that **drives the bundled Node CLI**. A
self-contained Node runtime is installed automatically as a dependency
(`nodejs-wheel-binaries`), so no separate Node.js install is required — but no
Python code touches the extraction engine itself.

## Install

```bash
pip install contextractor
# one-time: download Chromium (only for the browser engines:
# adaptive/firefox/chromium)
python -m contextractor install
```

Platform wheels are published for macOS (arm64, x86_64), Linux (x86_64, aarch64;
glibc ≥ 2.28), and Windows (x64). Requires Python 3.12+.

## Quick start

`extract_one()` fetches exactly one URL (no link-following) and returns the
extracted content directly; the `cheerio` crawler works before any browser
download:

```pycon
>>> import contextractor
>>> md = contextractor.extract_one(
...     "https://www.iana.org/help/example-domains",
...     crawler_type="cheerio",
... )
>>> md.splitlines()[0]
'# Example Domains'
```

With one requested format the return value is a `str`; with several it is a
`dict[str, str]`:

```pycon
>>> contents = contextractor.extract_one(
...     "https://www.iana.org/help/example-domains",
...     formats=["markdown", "json", "original"],
...     crawler_type="cheerio",
... )
>>> sorted(contents)
['json', 'markdown', 'original']
```

`aextract_one()` is the async variant.

## Crawling multiple pages

`extract()` crawls one or more URLs (with link-following) and writes extracted
files plus a `manifest.json` index to `output_dir`:

```python
import contextractor

summary = contextractor.extract(
    ["https://en.wikipedia.org/wiki/Web_scraping"],
    save=["markdown-kvs"],
    output_dir="./out",
)
print(summary.succeeded, "of", summary.total)
```

Each `save` token is `<format>-<kvs|dataset>` — the format name plus the
destination — so it reads `markdown-kvs`, not bare `markdown` (the bare names
like `markdown` and `json` are what `extract_one(formats=[...])` takes instead).

An async variant, `aextract()`, takes the same arguments. Crawl failures —
partial or total — never raise from `extract()`; check `summary.failed`. Invalid
arguments raise `ContextractorError`, a missing browser raises
`MissingBrowserError` pointing you at `python -m contextractor install`, and
`extract_one()` raises `ContextractorError` when its single URL fails.

## Options

Every crawl option is a typed keyword argument; the `ExtractOptions` /
`ExtractOneOptions` `TypedDict`s are the authoritative list of keywords and
accepted values, surfaced to editors and type checkers. Each snake_case keyword
maps one-to-one onto a flag of the
[npm CLI](https://www.contextractor.com/help/npm/):

- `max_crawl_depth=3` → `--max-crawl-depth 3`
- `headless=False` → `--no-headless`
- `save=["markdown-kvs", "json-dataset"]` → `--save markdown-kvs --save json-dataset`

See the [Python documentation](https://www.contextractor.com/help/pypi/) for
the full keyword list. Only `http`, `https`, `socks4`, and `socks5` proxy URLs
are accepted; credentials are never echoed in errors or logs. Set
`CONTEXTRACTOR_NODE_PATH` to use a host Node binary instead of the bundled
runtime.

## Why Contextractor

<!-- @generated:start name="why-contextractor" -->

<!-- This block is auto-generated by @contextractor/gen-md-regions. Do not edit. -->

Contextractor extracts with [Trafilatura Core](https://www.trafilatura.dev/), a hybrid Rust +
TypeScript port of [Trafilatura](https://www.contextractor.com/trafilatura/) — no Python extraction
runtime and no LLM in the loop. A Rust core removes boilerplate and classifies the page type; a
TypeScript stage cleans the result and renders it to Markdown, plain text, JSON, or HTML.

It is free and open source (Apache-2.0), runs locally with **no API key and no per-page credits**,
and its Markdown output is typically a fraction of the raw HTML's token count — cheap to feed to
an LLM.

|                   | Contextractor                                                          | Firecrawl                      | Jina Reader                                | Crawl4AI                                          |
| ----------------- | ---------------------------------------------------------------------- | ------------------------------ | ------------------------------------------ | ------------------------------------------------- |
| Extraction engine | Trafilatura Core (heuristic + ML routing)                              | LLM / heuristic                | ReaderLM neural model                      | LLM / heuristic                                   |
| Runtime           | Rust + Node (no Python engine)                                         | hosted API / self-host         | hosted API                                 | Python                                            |
| Surfaces          | Online playground · Apify Actor · npm CLI · npm library · PyPI (alpha) | API · SDKs · self-hosted · MCP | API                                        | Python library · crwl CLI · Docker REST API · MCP |
| Output formats    | txt · markdown · json · html · original                                | markdown · html · etc.         | markdown · html · text · screenshot · etc. | markdown · etc.                                   |
| Crawling          | Crawlee + Playwright (adaptive / browser / HTTP)                       | built-in                       | none (single URL)                          | built-in                                          |

<!-- @generated:end name="why-contextractor" -->

## Contributing

Issues and pull requests are welcome at the
[issue tracker](https://github.com/contextractor/contextractor/issues). The
extraction engine, npm CLI, and Apify Actor all live in the same
[source repository](https://github.com/contextractor/contextractor).

## License

[Apache-2.0](https://github.com/contextractor/contextractor/blob/main/LICENSE)
