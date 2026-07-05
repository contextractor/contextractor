# Contextractor

<table align="right">
  <tbody>
    <tr>
      <td>
        <img width="220" src="media/cover-mini.svg" alt="Contextractor" />
        <br />
        <a href="https://www.npmjs.com/package/contextractor"><img src="https://img.shields.io/npm/v/contextractor.svg" alt="npm version" /></a>
        <br />
        <a href="https://www.npmjs.com/package/contextractor"><img src="https://img.shields.io/npm/dm/contextractor.svg" alt="npm downloads" /></a>
        <br />
        <a href="https://github.com/contextractor/contextractor/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/contextractor.svg" alt="license" /></a>
        <h3>Available as:</h3>
        <ul>
          <li>
            <strong><a href="https://www.contextractor.com/">Online playground</a></strong>
            <br />
            <sub><a href="https://www.contextractor.com/">playground</a>, <a href="https://www.contextractor.com/help/web/">help</a></sub>
          </li>
          <li>
            <strong><a href="https://apify.com/glueo/contextractor?fpr=glueo">Apify Actor</a></strong>
            <br />
            <sub><a href="https://apify.com/glueo/contextractor?fpr=glueo">actor</a>, <a href="https://www.contextractor.com/help/apify/">help</a></sub>
          </li>
          <li>
            <strong><a href="https://www.npmjs.com/package/contextractor">NPM package CLI &amp; lib</a></strong>
            <br />
            <sub><a href="https://www.npmjs.com/package/contextractor">package</a>, <a href="https://www.contextractor.com/help/npm/">CLI help</a>, <a href="https://www.contextractor.com/help/npm-lib/">lib help</a></sub>
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

Crawl any website and extract clean, boilerplate-free main-content text as
Markdown, plain text, JSON, HTML, or raw original HTML — ready to feed LLMs, RAG
pipelines, and vector databases. The extraction engine is
[`rs-trafilatura`](https://github.com/Murrough-Foley/rs-trafilatura), the Rust
port of Trafilatura, which scores
[0.966 F1](https://github.com/Murrough-Foley/rs-trafilatura#scrapinghub-article-extraction-benchmark)
on the [ScrapingHub article-extraction benchmark](https://github.com/scrapinghub/article-extraction-benchmark).
Crawling is [Crawlee](https://crawlee.dev/), driving Playwright or fetching
pages over plain HTTP with Cheerio.

One engine, every surface: the same extraction runs behind the
[Apify Actor](https://apify.com/glueo/contextractor?fpr=glueo) (no install), the
npm CLI and library, and an alpha
[PyPI wrapper](https://pypi.org/project/contextractor/) — all validated by one
shared Zod input schema, so an option means the same thing everywhere.

The adaptive crawler picks a headless browser or raw HTTP per page; crawls are
scoped with link selectors, URL globs, depth limits, and sitemaps; blocks are
survived with proxy rotation and persistent session pools; duplicates are
dropped by canonical URL or content hash. Cookie consent is handled before
extraction — a Ghostery-based blocker strips trackers and dismisses consent
walls. Extraction is tunable between `precision`, `balanced`, and `recall`
modes, with toggles for tables, links, images, and comments.

**Website & docs:** [contextractor.com](https://www.contextractor.com) · **Try it:**
[Apify Actor](https://apify.com/glueo/contextractor?fpr=glueo) · **Install:**
[npm](https://www.npmjs.com/package/contextractor) ·
[PyPI (alpha)](https://pypi.org/project/contextractor/)

## Quick start

```bash
npm install contextractor
npx contextractor extract-one https://www.iana.org/help/example-domains \
  --crawler-type cheerio
```

The `cheerio` crawler fetches over plain HTTP, so no browser download is
needed. Output (Markdown on stdout, logs on stderr; trimmed here):

```markdown
# Example Domains

As described in [RFC 2606](/go/rfc2606) and [RFC 6761](/go/rfc6761), a
number of domains such as example.com and example.org are maintained
for documentation purposes. These domains may be used as illustrative
examples in documents without prior coordination with us. They are not
available for registration or transfer.
```

For JavaScript-heavy pages, install a browser once and let the adaptive
crawler decide per page (`firefox` crawler: install `firefox` instead):

```bash
npx playwright install chromium
npx contextractor extract-one https://example.com/
```

Python (alpha, experimental):

```bash
pip install contextractor
python -m contextractor install   # one-time browser download
```

Or run it with no install at all via the
[Apify Actor](https://apify.com/glueo/contextractor?fpr=glueo). Per-surface
usage docs: [npm CLI/library](./packages/standalone/README.md) ·
[Python](./packages/standalone-python/README.md) ·
[Apify Actor](./packages/apify-actor/README.md).

## Why Contextractor

<!-- @generated:start name="why-contextractor" -->

<!-- This block is auto-generated by @contextractor/gen-md-regions. Do not edit. -->

Contextractor ships the [Rust port of Trafilatura](https://github.com/Murrough-Foley/rs-trafilatura)
as a native (napi-rs) binding — no Python extraction runtime. On the Scrapinghub article set it
scores an **F1 of 0.966** (precision 0.942, recall 0.991) — ahead of go-trafilatura (0.960) and the
original Python Trafilatura (0.958); see the
[benchmark write-up](https://www.contextractor.com/trafilatura/) for the methodology.

It is free and open source (Apache-2.0), runs locally with **no API key and no per-page credits**,
and its Markdown output is typically **80–90% fewer tokens** than the raw HTML — cheap to feed to
an LLM.

|                   | Contextractor                                    | Firecrawl                      | Jina Reader                                | Crawl4AI                                          |
| ----------------- | ------------------------------------------------ | ------------------------------ | ------------------------------------------ | ------------------------------------------------- |
| Extraction engine | rs-trafilatura (heuristic + ML routing)          | LLM / heuristic                | ReaderLM neural model                      | LLM / heuristic                                   |
| Runtime           | Rust + Node (no Python engine)                   | hosted API / self-host         | hosted API                                 | Python                                            |
| Surfaces          | Apify Actor · npm CLI · npm library · PyPI       | API · SDKs · self-hosted · MCP | API                                        | Python library · crwl CLI · Docker REST API · MCP |
| Output formats    | txt · markdown · json · html · original          | markdown · html · etc.         | markdown · html · text · screenshot · etc. | markdown · etc.                                   |
| Crawling          | Crawlee + Playwright (adaptive / browser / HTTP) | built-in                       | none (single URL)                          | built-in                                          |

<!-- @generated:end name="why-contextractor" -->

## Features

- **Clean main-content extraction** via `rs-trafilatura` — strips navigation,
  headers, footers, ads, and cookie banners.
- **Adaptive crawling** — switches between a headless browser and raw HTTP per
  page, or force Chromium, Firefox, or HTTP-only (Cheerio).
- **Five output formats** — `txt`, `markdown`, `json`, `html`, and `original`
  (raw page HTML).
- **Whole-site crawling** — link-following with CSS selectors, include/exclude URL
  globs, sitemaps, and depth/page limits.
- **Anti-blocking** — proxy rotation, persistent session pools, and IP/fingerprint
  rotation on block detection.
- **Metadata + deduplication** — extracts title, author, date, description, site
  name, and language; deduplicates by canonical URL or content hash.

## CLI usage

Four subcommands cover the whole extract-to-files workflow:

```bash
contextractor extract https://example.com    # crawl into storage
contextractor extract-one https://a.com/x/   # one page to stdout
contextractor export --output-dir ./out      # storage → files
contextractor purge                          # clear the storage
```

Scope a crawl and route formats to destinations:

```bash
contextractor extract https://blog.example.com/ \
  --globs 'https://blog.example.com/**' \
  --max-crawl-depth 2 \
  --save markdown-kvs --save json-dataset
```

Full flag reference and JSON config:
[npm package README](./packages/standalone/README.md) ·
[contextractor.com/help/npm](https://www.contextractor.com/help/npm/).

## Library usage

The same engine is callable from Node code — `extractOne` for a single page,
`createExtractor(...).run(urls)` for a crawl with in-memory results:

```typescript
import { createExtractor, extractOne } from 'contextractor';

// One page, nothing persisted
const { markdown } = await extractOne('https://example.com/');

// A crawl, results returned in memory
const extractor = createExtractor({ maxRequestsPerCrawl: 10 });
const { dataset, statistics } = await extractor.run([
  'https://example.com/',
]);
console.log(statistics.requestsFinished, 'pages');
```

API reference: [npm package README](./packages/standalone/README.md) ·
[contextractor.com/help/npm-lib](https://www.contextractor.com/help/npm-lib/).

## How it works

Every page goes through three stages:

- **Crawl** — Crawlee fetches the page. The default `playwright-adaptive`
  crawler probes each page and uses a headless browser only where JavaScript
  rendering is needed; everything else goes over plain HTTP with Cheerio. A
  Ghostery-based blocker strips trackers and dismisses cookie-consent walls
  before extraction.
- **Extract** — the rendered HTML goes to `rs-trafilatura` through a
  [napi-rs](https://napi.rs/) native binding: Trafilatura's heuristic cascade
  (tree pruning, text/link-density scoring, Readability- and jusText-style
  fallbacks) plus the port's XGBoost page-type classifier, which routes each of
  seven page types to a tuned extraction profile. Prebuilt binaries ship for
  macOS, Linux, and Windows — no Python runtime, no build step on install.
- **Output** — each page is emitted in the formats you chose (`txt`,
  `markdown`, `json`, `html`, `original`), each with an MD5 hash and byte
  length, and saved to a dataset or key-value store.

One Zod schema (`@contextractor/schema`) validates input on every surface; the
Apify `input_schema.json` and the docs' flag tables are code-generated from it,
so the CLI, library, and Actor cannot drift apart.

## Benchmarks

The headline number: **0.966 F1** (precision 0.942, recall 0.991) on the
[ScrapingHub article-extraction benchmark](https://github.com/scrapinghub/article-extraction-benchmark)
(181 news articles), as
[self-reported by rs-trafilatura](https://github.com/Murrough-Foley/rs-trafilatura#scrapinghub-article-extraction-benchmark)
— ahead of [go-trafilatura](https://github.com/markusmobius/go-trafilatura#comparison-with-other-go-packages)
(0.960) and the original
[Python Trafilatura](https://trafilatura.readthedocs.io/en/latest/evaluation.html)
(0.958, [ACL 2021 paper](https://aclanthology.org/2021.acl-demo.15/)).

Articles are the easy case, though. On multi-type pages — forums, listings,
product pages — every extractor scores lower, and this one is no exception;
the [benchmark write-up](https://www.contextractor.com/trafilatura/) covers the
per-page-type numbers honestly.

## Input schema

The Zod 4 schema in
[`@contextractor/schema`](./packages/schema/README.md) is the
single source of truth for every input field. The standalone CLI and the Apify
Actor both feed user input through `ContextractorInput.parse(...)`;
`packages/apify-actor/.actor/input_schema.json` is generated from the schema by
`@contextractor/gen-input-schema` (committed codegen output — regenerate and
commit when the Zod schema changes).

The `save` enum below (`-dataset` / `-kvs`) is the `ContextractorInput.save`
field for the crawl `extract` command and the Apify Actor. The `extract-one`
command instead writes to `file` / `stdout` destinations — e.g. the
`--save txt-stdout` token.

<details>
<summary>Full <code>ContextractorInputType</code> interface</summary>

<!-- @generated:start name="input-type" -->

<!-- This block is auto-generated by @contextractor/gen-md-regions. Do not edit. -->

```ts
interface ContextractorInputType {
  startUrls: Array<{ url: string }>;
  crawlerType:
    | 'playwright-adaptive'
    | 'playwright-firefox'
    | 'playwright-chromium'
    | 'cheerio';
  renderingTypeDetectionRatio: number;
  globs: Array<{ glob: string }>;
  exclude: Array<{ glob: string }>;
  selector: string;
  keepUrlFragment: boolean;
  useSitemaps: boolean;
  deduplication: 'minimal' | 'standard' | 'aggressive';
  respectRobotsTxtFile: boolean;
  initialCookies?: Array<unknown>;
  customHttpHeaders?: Record<string, string>;
  maxRequestsPerCrawl: number;
  maxResultsPerCrawl: number;
  maxCrawlDepth: number;
  initialConcurrency: number;
  maxConcurrency: number;
  maxRequestRetries: number;
  mode: 'precision' | 'balanced' | 'recall';
  includeComments: boolean;
  includeTables: boolean;
  includeImages: boolean;
  includeLinks: boolean;
  languageCode: string;
  save: Array<
    | 'txt-dataset'
    | 'txt-kvs'
    | 'markdown-dataset'
    | 'markdown-kvs'
    | 'json-dataset'
    | 'json-kvs'
    | 'html-dataset'
    | 'html-kvs'
    | 'original-dataset'
    | 'original-kvs'
  >;
  datasetName?: string;
  keyValueStoreName?: string;
  requestQueueName?: string;
  storeSkippedUrls: boolean;
  proxyConfiguration?: Record<string, unknown>;
  proxyRotation: 'recommended' | 'per-request' | 'until-failure';
  sessionPoolName?: string;
  maxSessionRotations: number;
  navigationTimeoutSecs: number;
  blockMedia: boolean;
  waitForSelector: string;
  softWaitForSelector: string;
  waitForDynamicContentSecs: number;
  waitUntil: 'load' | 'domcontentloaded' | 'networkidle' | 'commit';
  headless: boolean;
  ignoreCorsAndCsp: boolean;
  closeCookieModals: boolean;
  maxScrollHeight: number;
  userAgent: string;
  ignoreHttpsErrors: boolean;
}
```

<!-- @generated:end name="input-type" -->

</details>

## Credits

- [Trafilatura](https://github.com/adbar/trafilatura) by Adrien Barbaresi — the
  original extraction algorithm and its heuristics
  ([ACL 2021 paper](https://aclanthology.org/2021.acl-demo.15/)).
- [rs-trafilatura](https://github.com/Murrough-Foley/rs-trafilatura) by
  Murrough Foley — the Rust port this project ships, plus its ML page-type
  routing and benchmark work.
- [Crawlee](https://crawlee.dev/) by Apify — the crawling layer (Playwright +
  Cheerio, session pools, proxy rotation).

## Contributing

Issues and pull requests are welcome at the
[issue tracker](https://github.com/contextractor/contextractor/issues). The
sections below are for working on the monorepo itself; end users do not need any
of this — see [Quick start](#quick-start) instead.

### Local prerequisites

- **Rust toolchain** via `rustup` (cargo + rustc on PATH for napi build).
- **Apify CLI ≥ 1.4** (older versions reject the modern `actor.json` format
  with "Actor is of an unknown format").
- **Node 22+**, **pnpm 10+**.

### Workspace commands

```bash
pnpm build        # build all TS packages
pnpm test         # run all vitest suites
pnpm lint         # Biome lint
pnpm --filter @contextractor/extraction-native build:rebuild
cargo build --workspace
cargo test --workspace
cargo clippy --workspace --all-targets -- -D warnings
biome check .     # workspace lint + format
apify run         # run the Actor locally (packages/apify-actor/)
```

### Architecture

```
packages/
├── apify-actor/            # Apify Actor
├── standalone/             # TypeScript CLI + library
├── extraction/             # Pure extraction package + napi binding
│   └── native/             # napi-rs Rust crate (rs-trafilatura)
│       └── npm/<platform>/ # Per-platform .node prebuilds
├── crawler/                # Shared Crawlee + Playwright crawler
├── schema/                 # Shared Zod input + output schema
└── standalone-python/      # PyPI wrapper around the standalone CLI
```

## License

[Apache-2.0](./LICENSE)
