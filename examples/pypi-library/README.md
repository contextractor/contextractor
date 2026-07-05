# contextractor — Python (PyPI) library example

A runnable example of the [`contextractor`](https://pypi.org/project/contextractor/)
Python library: crawl pages and extract clean main-content text (`txt`, `markdown`,
`json`, `html`) straight from Python.

The library is a thin, typed wrapper that **drives a bundled Node engine** via
subprocess — no Node.js install is required, and Python never loads the native
`.node` module. The engine is built on
[`rs-trafilatura`](https://github.com/Murrough-Foley/rs-trafilatura) (extraction)
and [Crawlee](https://crawlee.dev/) + [Playwright](https://playwright.dev/)
(crawling).

## What it shows

- `main.py` — synchronous `extract()`: crawl one page, save `markdown` (dataset + KVS), `json`, and the original HTML (KVS),
  print the `ExtractSummary`, then read `manifest.json` and list the written files;
  then `extract_one()`: fetch a single page (no link-following) and get its markdown back as a `str`.
- `async_example.py` — asynchronous `aextract()`: crawl several pages concurrently;
  then `aextract_one()`: fetch one page in several formats, returned as a `dict[str, str]` keyed by format.

## Install

```bash
pip install contextractor
python -m contextractor install   # one-time: download Chromium
python main.py
```

## Run from this repository

To test unreleased changes, `run.sh` builds the wrapper from source (it
bundles the Node CLI into a local wheel), installs it into a throwaway `.venv`,
provisions Chromium, and runs both example scripts:

```bash
./run.sh
```

Requirements for the from-source build: `pnpm`, `uv`, and this repo checked out.
`run.sh` handles the rest — build the CLI, flatten it, stage the assets, build and
install the wheel, install the browser, then run the examples. No Node.js install
is needed (the wheel bundles a Node runtime).

## Options

All crawl options are snake_case keyword arguments — for example
`save=["markdown-kvs", "original-dataset"]` (`format-destination` tokens),
`max_requests_per_crawl=10`, `max_crawl_depth=2`,
`mode="precision"`, `proxy=["http://user:pass@host:3128"]`.

`extract_one()` / `aextract_one()` take `formats=` (default `"markdown"`; valid:
`txt`, `markdown`, `json`, `html`, `original`) plus the single-page subset of the
options (`ExtractOneOptions`) — the crawl-frontier, storage, and `save` options
are `extract()`-only. One requested format returns a `str`, several return a
`dict[str, str]` keyed by format.

See the
[package README](../../packages/standalone-python/README.md) for the full list and the
return-value (`ExtractSummary`) reference.
