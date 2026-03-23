# Contextractor — Trafilatura Powered Web Content Extractor

Extract clean, readable content from any website. Uses [Trafilatura](https://trafilatura.readthedocs.io/) to strip away navigation, ads, and boilerplate—leaving just the text you need.

## Why Trafilatura?

Trafilatura is a Python library designed for web content extraction, created by Adrien Barbaresi at the Berlin-Brandenburg Academy of Sciences. The library achieves the **highest F1 score (0.958)** among open-source content extraction tools in independent benchmarks, outperforming newspaper4k (0.949), Mozilla Readability (0.947), and goose3 (0.896). [[1]](#1-article-extraction-benchmark)[[2]](#2-evaluation)

With over 4,900 GitHub stars and production deployments at HuggingFace, IBM, and Microsoft Research, Trafilatura has become the de facto standard for text extraction in data pipelines and LLM applications. [[3]](#3-trafilatura-a-python-package--command-line-tool-to-gather-text-on-the-web)

### Understanding the F1 Score

The F1 score is a standard metric for evaluating extraction quality, combining two complementary measures:

- **Precision**: How much of the extracted content is actually relevant (avoiding noise like ads, navigation, footers)
- **Recall**: How much of the relevant content was successfully extracted (avoiding missed paragraphs or sections)

The F1 score is the harmonic mean of precision and recall, ranging from 0 to 1. A score of 0.958 means Trafilatura correctly extracts 95.8% of the main content while excluding nearly all boilerplate — the best balance among tested tools. [[2]](#2-evaluation)

For comparison, a tool with high precision but low recall might extract clean content but miss important paragraphs. Conversely, high recall with low precision captures everything but includes unwanted elements like sidebars and advertisements.

### Benchmark Comparison

The following results are from the ScrapingHub Article Extraction Benchmark, which tests extraction quality across 181 diverse web pages: [[1]](#1-article-extraction-benchmark)

| Tool | F1 Score | Precision | Recall | Best For |
|------|----------|-----------|--------|----------|
| **Trafilatura** | **0.958** | 0.938 | 0.978 | General web content, LLM pipelines |
| newspaper4k | 0.949 | 0.964 | 0.934 | News sites with rich metadata |
| @mozilla/readability | 0.947 | 0.914 | 0.982 | Browser-based extraction |
| readability-lxml | 0.922 | 0.913 | 0.931 | Simple HTML preservation |
| goose3 | 0.896 | 0.940 | 0.856 | High-precision requirements |
| jusText | 0.804 | 0.858 | 0.756 | Academic corpus building |

Trafilatura's 0.978 recall is particularly notable — it captures nearly all relevant content while maintaining excellent precision. This balance is achieved through a hybrid extraction approach that combines multiple algorithms. [[2]](#2-evaluation)

### Key Advantages

**LLM-optimized output formats**

Trafilatura natively supports markdown output, which reduces token count by approximately 67% compared to raw HTML. [[4]](#4-an-introduction-to-preparing-your-own-dataset-for-llm-training) This makes it ideal for RAG pipelines, LLM fine-tuning datasets, and any application where token efficiency matters. The library supports seven output formats: plain text, Markdown, HTML, XML, XML-TEI (for academic research), JSON, and CSV.

**Comprehensive metadata extraction**

Beyond main content, Trafilatura automatically extracts structured metadata including title, author, publication date, language (via py3langid), site name, categories, tags, and content license. This metadata is invaluable for content organization, filtering, and downstream processing. [[3]](#3-trafilatura-a-python-package--command-line-tool-to-gather-text-on-the-web)

**Hybrid extraction with intelligent fallbacks**

Trafilatura achieves its superior accuracy through a multi-stage approach: it first applies its own heuristic algorithms, then falls back to jusText and readability-lxml when needed. This redundancy ensures robust extraction across diverse page layouts and edge cases. [[2]](#2-evaluation)

**Production-proven at scale**

The library is trusted by major organizations including HuggingFace (for dataset curation), IBM, and Microsoft Research. Its efficient implementation handles large-scale crawling workloads without performance bottlenecks. [[3]](#3-trafilatura-a-python-package--command-line-tool-to-gather-text-on-the-web)

**Academic validation**

Unlike many extraction tools, Trafilatura has peer-reviewed academic backing. It was published at ACL 2021 (Association for Computational Linguistics), providing transparency into its methodology and benchmarks. [[5]](#5-trafilatura-a-web-scraping-library-and-command-line-tool-for-text-discovery-and-extraction)

### Limitations

- Results vary on galleries, catalogs, and link-heavy pages where main content is ambiguous [[3]](#3-trafilatura-a-python-package--command-line-tool-to-gather-text-on-the-web)

## Features

- **Multiple output formats** - Markdown, plain text, JSON, XML, or XML-TEI (scholarly)
- **JavaScript rendering** - Handles dynamic sites with Playwright (Chromium/Firefox)
- **Link crawling** - Follow links across a site with glob/pseudo-URL filtering
- **Metadata extraction** - Title, author, date, description, site name, and language
- **Configurable precision** - Balance between extracting more content vs. less noise

## Use cases

- Build training datasets for LLMs
- Research and academic text extraction
- Feed content into RAG pipelines
- Monitor content changes

## Input

| Parameter | Description | Default |
|-----------|-------------|---------|
| `startUrls` (required) | URLs to extract content from |  |
| `globs` | Glob patterns for URLs to include in crawling | `[]` |
| `excludes` | Glob patterns for URLs to exclude | `[]` |
| `trafilaturaConfig` | Extraction options object (e.g., `{"favorPrecision": true}`) | `{}` (balanced) |
| `maxPagesPerCrawl` | Limit total pages crawled (0 = unlimited) | `0` |
| `maxCrawlingDepth` | Limit link depth from start URLs | `0` |
| `saveExtractedMarkdownToKeyValueStore` | Save Markdown to key-value store | `true` |

See the full input schema for browser settings, proxy configuration, cookies, and custom headers.

## Output

Each crawled page produces a dataset item:

```json
{
  "loadedUrl": "https://example.com/article",
  "httpStatus": 200,
  "loadedAt": "2025-01-31T12:00:00.000Z",
  "metadata": {
    "title": "Article Title",
    "author": "John Doe",
    "publishedAt": "2025-01-15",
    "description": "Article description",
    "siteName": "Example Blog",
    "lang": "en"
  },
  "rawHtml": {
    "hash": "f8e6bd335e04d03e1be6798c2c72349c",
    "length": 45000
  },
  "extractedMarkdown": {
    "key": "a1b2c3d4e5f67890.md",
    "url": "https://api.apify.com/v2/key-value-stores/.../records/a1b2c3d4e5f67890.md",
    "hash": "43f204bfbee5dbe6862cb38620f257b5",
    "length": 5000
  }
}
```

Extracted content is saved to the key-value store. The `extractedMarkdown` (and similar fields for other formats) contains a `url` you can use to download the content directly.

## Example

Extract all blog posts from a site:

```json
{
  "startUrls": [{ "url": "https://example.com/blog" }],
  "globs": [{ "glob": "https://example.com/blog/**" }],
  "linkSelector": "a",
  "maxPagesPerCrawl": 100,
  "trafilaturaConfig": {},
  "saveExtractedMarkdownToKeyValueStore": true
}
```

## References

##### 1. Article Extraction Benchmark
ScrapingHub. [GitHub](https://github.com/scrapinghub/article-extraction-benchmark)

##### 2. Evaluation
Barbaresi, Adrien. [Trafilatura Documentation v2.0.0](https://trafilatura.readthedocs.io/en/latest/evaluation.html)

##### 3. Trafilatura: A Python package & command-line tool to gather text on the Web
Barbaresi, Adrien. [GitHub](https://github.com/adbar/trafilatura)

##### 4. An introduction to preparing your own dataset for LLM training
AWS Machine Learning Blog. [Amazon Web Services](https://aws.amazon.com/blogs/machine-learning/an-introduction-to-preparing-your-own-dataset-for-llm-training/)

##### 5. Trafilatura: A Web Scraping Library and Command-Line Tool for Text Discovery and Extraction
Barbaresi, Adrien (2021). [ACL Anthology](https://aclanthology.org/2021.acl-demo.15/)


## Docs version
2026-01-31T18:42:11Z
