<table align="right">
  <tbody>
    <tr>
      <td>
        <img width="220" src="https://www.contextractor.com/media/cover-mini.svg" alt="Contextractor" />
        <br />
        <a href="https://www.npmjs.com/package/contextractor"><img src="https://img.shields.io/npm/v/contextractor.svg" alt="npm version" /></a>
        <br />
        <a href="https://www.npmjs.com/package/contextractor"><img src="https://img.shields.io/npm/dm/contextractor.svg" alt="npm downloads" /></a>
        <br />
        <a href="https://github.com/contextractor/contextractor/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/contextractor.svg" alt="license" /></a>
        <h3>Also available as:</h3>
        <ul>
          <li>
            <strong><a href="https://www.contextractor.com/">Online playground</a></strong>
            <br />
            <sub><a href="https://www.contextractor.com/">playground</a>, <a href="https://www.contextractor.com/help/web/">help</a></sub>
          </li>
          <li>
            <strong><a href="https://www.npmjs.com/package/contextractor">NPM package CLI &amp; lib</a></strong>
            <br />
            <sub><a href="https://www.npmjs.com/package/contextractor">package</a>, <a href="https://www.contextractor.com/help/npm/">CLI help</a>, <a href="https://www.contextractor.com/help/npm-lib/">lib help</a></sub>
          </li>
          <li>
            <strong><a href="https://github.com/contextractor/contextractor">Source code on GitHub</a></strong>
          </li>
        </ul>
        <h3>Social:</h3>
        <ul>
          <li>
            <strong><a href="https://x.com/contextractor">X (Twitter)</a></strong>
          </li>
        </ul>
      </td>
    </tr>
  </tbody>
</table>

**Crawl any website and extract clean, boilerplate-free main content** as
**Markdown, plain text, JSON, cleaned HTML, or raw original HTML** — ready to feed
**LLMs, RAG pipelines, and vector databases**. Contextractor uses the
[Trafilatura Core](https://www.trafilatura.dev/) extraction
engine to strip away navigation, ads, and cookie banners, and an adaptive
[Crawlee](https://crawlee.dev/) + Playwright crawler that automatically switches
between a real browser and fast HTTP — with proxy rotation and anti-blocking
handled for you.

Point it at a single page or crawl an entire site: Contextractor returns only the
content that matters, in the exact format your AI workflow needs.

## ✨ What can Contextractor do?

- **Extract clean main content** — the Trafilatura Core engine isolates the article
  body and removes navigation, headers, footers, ads, and cookie banners.
- **Five output formats** — Markdown, plain text (`txt`), JSON, cleaned HTML, and
  the original raw HTML, saved individually or together.
- **Adaptive crawling** — switches between a headless browser (for
  JavaScript-heavy pages) and raw HTTP per page; or force Chromium, Firefox,
  or HTTP-only.
- **Whole-site crawling** — follow links with a CSS selector and scope the crawl
  with include/exclude URL globs, sitemaps, and depth/page limits.
- **Tunable extraction** — choose `precision`, `balanced`, or `recall`, and toggle
  tables, links, images (alt text), and comments.
- **Built-in anti-blocking** — proxy rotation, persistent session pools, and
  automatic IP/fingerprint rotation when a block is detected.
- **Page metadata** — captures title, author, publication date, description, site
  name, and detected language.
- **Handles modern pages** — dismisses cookie modals, waits for selectors or
  network idle, scrolls lazy-loaded content, and accepts custom cookies and HTTP
  headers for logged-in or gated pages.
- **Deduplication** — skip already-seen pages by canonical URL or by
  extracted-content hash.

## 🚀 How to use Contextractor

No code required — run it straight from the Apify Console:

1. **Add your start URLs** — one or more pages or site sections you want to extract.
2. **Choose what to save and where** — the `Save` field takes `format-destination`
   tokens (e.g. `Markdown → Key-value store`, `Original HTML → Dataset`). Pick a
   format for each destination you want; selecting the same format for both the
   dataset and the key-value store saves it to both.
3. _(Optional)_ **Set the crawl scope and behavior** — link selector, include/exclude
   URL globs, depth, and page limits to follow links across a site; enable proxy
   rotation, `robots.txt`, or render waits as needed.
4. **Click Start** and watch the run progress live.
5. **Download your data** — from the dataset (JSON, CSV, Excel) or the key-value
   store, or pull it programmatically via the Apify API.

## Input recipes

**Start URLs** are the only required field; everything else has a sensible
default. The complete field-by-field reference lives on the
[Input tab](https://apify.com/glueo/contextractor/input-schema) — the recipes
below cover the common jobs.

Crawl a blog section and save Markdown for RAG ingestion:

```json
{
  "startUrls": [{ "url": "https://blog.example.com/" }],
  "selector": "a[href]",
  "globs": [{ "glob": "https://blog.example.com/**" }],
  "maxCrawlDepth": 2,
  "save": ["markdown-kvs"]
}
```

Extract a single page in several formats at once:

```json
{
  "startUrls": [{ "url": "https://example.com/article" }],
  "maxCrawlDepth": 0,
  "maxRequestsPerCrawl": 1,
  "save": ["markdown-kvs", "json-dataset", "original-kvs"]
}
```

Crawl a site that blocks datacenter traffic, with proxy rotation and a
persistent session pool:

```json
{
  "startUrls": [{ "url": "https://shop.example.com/" }],
  "proxyConfiguration": {
    "useApifyProxy": true,
    "apifyProxyGroups": ["RESIDENTIAL"]
  },
  "proxyRotation": "recommended",
  "sessionPoolName": "shop-example",
  "waitUntil": "networkidle"
}
```

Two shape rules to remember: `startUrls`, `globs`, and `exclude` take arrays of
objects (`{ "url": … }` / `{ "glob": … }`), not bare strings; `save` takes
`format-destination` tokens — format `txt`, `markdown`, `json`, `html`, or
`original`, destination `dataset` or `kvs` (e.g. `markdown-kvs`, `txt-dataset`).

Key settings worth knowing before a big run:

- **Crawler type** — `playwright-adaptive` (default) probes each page and uses a
  real browser only where JavaScript rendering is needed; `cheerio` is raw HTTP
  only — the fastest and cheapest when pages don't need JS.
- **Extraction mode** — `precision` trims aggressively, `recall` keeps more
  borderline content, `balanced` (default) sits between.
- **Deduplication** — `standard` (default) skips pages whose canonical URL was
  already extracted; `aggressive` also drops pages with identical extracted text.
- **Cookie consent** — `closeCookieModals` (default on) blocks trackers and
  dismisses consent walls before extraction.

## What data does Contextractor return?

Every crawled page becomes one dataset record. Successful pages carry
`status: "success"` with the extracted content and metadata; failed and skipped
pages are recorded too, so nothing is silently dropped.

| Field                                 | Description                                                                                                                                                            |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `url`                                 | The original request URL.                                                                                                                                              |
| `status`                              | Record outcome: `success`, `failed`, or `skipped`.                                                                                                                     |
| `metadata`                            | Extracted page metadata: `title`, `author`, `publishedAt`, `description`, `siteName`, `languageCode`.                                                                  |
| `crawl`                               | Crawl provenance: `loadedUrl` (final URL after redirects), `loadedTime`, `httpStatusCode`, `depth` (link distance from a start URL), `referrerUrl` (the linking page). |
| `original`                            | The raw page HTML as a content node — `hash` (MD5) and `bytes` always present; `content`, or `key` + `url`, added when `original` is saved.                            |
| `txt`, `markdown`, `json`, `html`     | One content node per saved format — `hash` and `bytes`, plus inline `content` (dataset) or a `key` + `url` reference (key-value store).                                |
| `errors`, `retryCount`, `crawledTime` | On `failed` records only: the error messages, number of retries, and when the request was abandoned.                                                                   |
| `skipReason`                          | On `skipped` records only: `robotsTxt`, `limit`, `enqueueLimit`, `filters`, `redirect`, or `depth`.                                                                    |

Example success record (default settings — Markdown saved to the key-value store):

```json
{
  "url": "https://blog.example.com/why-rag-matters",
  "status": "success",
  "metadata": {
    "title": "Why RAG Matters",
    "author": "Jane Doe",
    "publishedAt": "2026-01-15",
    "description": "A practical look at retrieval-augmented generation.",
    "siteName": "Example Blog",
    "languageCode": "en"
  },
  "crawl": {
    "loadedUrl": "https://blog.example.com/why-rag-matters",
    "loadedTime": "2026-05-31T10:00:00.000Z",
    "httpStatusCode": 200,
    "depth": 1,
    "referrerUrl": "https://blog.example.com/"
  },
  "original": {
    "hash": "f8e6bd335e04d03e1be6798c2c72349c",
    "bytes": 89898
  },
  "markdown": {
    "hash": "43f204bfbee5dbe6862cb38620f257b5",
    "bytes": 5234,
    "key": "markdown-c485356090a92c6a45e8c1155c14d8ee.md",
    "url": "https://api.apify.com/v2/key-value-stores/<storeId>/records/<key>"
  }
}
```

### Where your content is saved

- **Key-value store (default)** — each format is stored as a separate file keyed
  `{format}-{md5(url)}.{ext}` (e.g. `markdown-1a2b3c4d….md`), and the dataset record
  references it by `key` and `url`. Best for large content and bulk download.
- **Dataset** — the extracted content is embedded inline in each record under
  `content`. Best when you want everything in a single JSON, CSV, or Excel export.

Choose one or both with the **Save** option.

## 💰 How much will it cost?

Contextractor is usage-priced: you pay for the Apify compute units (CUs) a run
consumes, plus any proxy traffic, on top of your Apify plan. Cost scales with the
number of pages and the crawler type — the browser crawlers
(`playwright-adaptive`, `playwright-firefox`, `playwright-chromium`) use far more
compute than the HTTP-only `cheerio` crawler, so a large browser-based crawl costs
more than the same number of pages over plain HTTP. Keep runs efficient by using
`cheerio` where JavaScript isn't needed, setting a sensible `maxConcurrency`, and
bounding the crawl with `maxRequestsPerCrawl` and `maxCrawlDepth`. Apify's free
plan includes [$5 of usage monthly](https://apify.com/pricing); see the pricing
page for current compute-unit and proxy rates.

## Designed for LLMs, RAG, and AI pipelines

Contextractor turns messy web pages into clean, structured text that's ready for AI:

- **Build RAG knowledge bases** — crawl docs, blogs, or help centers and ingest
  clean Markdown into a vector database.
- **Feed and contextualize LLMs** — supply boilerplate-free content as context for
  ChatGPT, Claude, or your custom GPTs.
- **Create training and fine-tuning datasets** — gather large volumes of clean
  article text.
- **Bulk content processing** — summarize, translate, classify, or proofread pages
  at scale.
- **Content and SEO research** — archive competitor or reference content as plain
  text or JSON.

Each output format is suited to a different job:

| Format     | Best for                                                                |
| ---------- | ----------------------------------------------------------------------- |
| `markdown` | Chunking and embeddings, chat context, notebooks — the default for RAG. |
| `txt`      | Lightweight NLP, keyword stats, and simple text pipelines.              |
| `json`     | Structured, programmatic downstream processing.                         |
| `html`     | Layout-aware processing or feeding other HTML tools.                    |
| `original` | The full, unmodified page for re-processing, archival, or auditing.     |

## How does it work?

Contextractor runs a three-stage pipeline for every page:

- **Crawl** — an adaptive Crawlee + Playwright crawler fetches each page and follows
  links within the scope you set (selectors, URL globs, depth, sitemaps), respecting
  `robots.txt` when enabled.
- **Extract** — the Trafilatura Core engine isolates the main content and discards
  navigation, ads, and cookie modals, using your chosen precision/balanced/recall
  mode.
- **Output** — each page is emitted in the formats you selected, with an MD5 `hash`
  and byte length, and saved to your dataset or key-value store.

## Integrations and automation

Contextractor outputs standard JSON and Markdown, so its results drop straight into
AI and data pipelines:

- **Apify API & SDKs** — start runs, stream the dataset, and fetch key-value-store
  files programmatically; the [API tab](https://apify.com/glueo/contextractor/api)
  has ready-made JavaScript and Python client examples and an OpenAPI spec.
- **MCP server** — the same tab includes Model Context Protocol setup, so AI agents
  can call the Actor directly.
- **Scheduling & monitoring** — schedule recurring runs and monitor them from the
  Apify Console.
- **No-code connectors** — pipe results into Make, Zapier, n8n, Google Drive, Slack,
  and more via Apify's integrations.
- **LLM frameworks** — feed the extracted Markdown or JSON into LangChain,
  LlamaIndex, or a vector database such as Pinecone, Qdrant, Weaviate, or Chroma for
  retrieval-augmented generation.

## ❓ FAQ

### Is it legal to scrape website content?

Scraping publicly available, non-personal data is generally legal in most
jurisdictions. Contextractor can honor each site's `robots.txt` (enable **Respect
robots.txt**), and you remain responsible for complying with each site's Terms of
Service and for how you use extracted content — especially copyrighted material you
intend to republish.

### Why is some content missing or noisy?

Switch the **extraction mode**: `precision` removes more boilerplate (and may drop
borderline content), while `recall` keeps more (and may include some noise). For
pages that load content with JavaScript, add a **Wait for selector**, increase
**Wait for dynamic content**, or raise **Max scroll height** so lazy-loaded sections
appear before extraction.

### How do I avoid getting blocked?

Enable **Proxy configuration** with proxy rotation, set a **Session pool name** to
reuse working sessions across runs, and allow **session rotations** so the crawler
switches IP and fingerprint when a block is detected.

### How do I crawl an entire website?

Set a **Link selector** (e.g. `a[href]`) to follow links, then bound the crawl with
**include/exclude URL globs**, **Max crawl depth**, and **Max requests per crawl**. Enable
**Use sitemaps** to also pull URLs from each domain's `sitemap.xml`.

### How do I remove duplicate pages?

Use **Deduplication**: `standard` (the default) skips pages whose canonical URL was
already extracted; `aggressive` additionally skips pages with identical extracted text;
`minimal` keeps only Crawlee's built-in URL deduplication.

### Can I start runs from my own code or an AI agent?

Yes — the [API tab](https://apify.com/glueo/contextractor/api) carries ready-made
examples for the JavaScript and Python API clients, the Actor's OpenAPI
specification, and MCP server setup for AI agents.

### Found a bug or have a feature request?

We respond to issues on the **Issues** tab — please open one and we'll take a
look.
