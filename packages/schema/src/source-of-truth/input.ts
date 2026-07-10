import { z } from 'zod';
import { apifyRegistry } from '../apify/apify-registry.js';

const initialCookiesDescription = [
  'Cookies that will be pre-set to all pages the scraper opens. This is useful for pages that require login. The value is expected to be a JSON array of objects with `name` and `value` properties. For example: ',
  '',
  '```json',
  '[',
  '  {',
  '    "name": "cookieName",',
  '    "value": "cookieValue",',
  '    "path": "/",',
  '    "domain": ".example.com"',
  '  }',
  ']',
  '```',
  '',
  'You can use the [EditThisCookie](https://docs.apify.com/academy/tools/edit-this-cookie) browser extension to copy browser cookies in this format, and paste it here.',
  '',
  'Note that the value is secret and encrypted to protect your login cookies.',
].join('\n');

/**
 * The `save` vocabulary: the cross-product of the five output formats and the
 * two destinations, as `format-destination` kebab-case tokens (destination
 * shorthand `kvs` = key-value store). This is the single source of truth for the
 * Zod enum, the generated Apify schema, and the npm library's `SaveRoute` type.
 * Order is fixed and MUST stay in lockstep with the `enumTitles` below.
 */
export const SAVE_ROUTE_TOKENS = [
  'txt-dataset',
  'txt-kvs',
  'markdown-dataset',
  'markdown-kvs',
  'json-dataset',
  'json-kvs',
  'html-dataset',
  'html-kvs',
  'original-dataset',
  'original-kvs',
] as const;

/** A single `save` token binding one output format to one destination. */
export type SaveRoute = (typeof SAVE_ROUTE_TOKENS)[number];

export const ContextractorInput = z.object({
  startUrls: z
    .array(z.object({ url: z.string() }).loose())
    .min(1)
    .describe('URLs to extract content from')
    .meta({ title: 'Start URLs' })
    .register(apifyRegistry, {
      editor: 'requestListSources',
      prefill: [{ url: 'https://blog.apify.com/what-is-web-scraping/' }],
    }),

  crawlerType: z
    .enum(['playwright-adaptive', 'playwright-firefox', 'playwright-chromium', 'cheerio'])
    .default('playwright-adaptive')
    .describe(
      'Browser engine or HTTP client for crawling. playwright-adaptive automatically switches between browser and HTTP client per page. cheerio uses raw HTTP only (fastest, no JS).',
    )
    .meta({ title: 'Crawler type' })
    .register(apifyRegistry, {
      sectionCaption: 'Crawler settings',
      editor: 'select',
      enumTitles: [
        'Adaptive switching (Recommended)',
        'Headless browser (Firefox+Playwright)',
        'Headless browser (Chromium+Playwright)',
        'Raw HTTP client (Cheerio)',
      ],
    }),

  renderingTypeDetectionRatio: z
    .number()
    .min(0)
    .max(1)
    .default(0.1)
    .describe(
      '(Adaptive only) Ratio (0–1) of pages on which the crawler runs a rendering-type detection probe. Higher values are more accurate but slower.',
    )
    .meta({ title: 'Rendering type detection' }),

  globs: z
    .array(z.object({ glob: z.string() }).loose())
    .default([])
    .describe(
      'Glob patterns matching URLs of pages that will be included in crawling. Setting this option allows you to customize the crawling scope. For example `https://{store,docs}.example.com/**` lets the crawler access all URLs starting with `https://store.example.com/` or `https://docs.example.com/`.',
    )
    .meta({ title: 'Include URLs (globs)' })
    .register(apifyRegistry, { editor: 'globs' }),

  exclude: z
    .array(z.object({ glob: z.string() }).loose())
    .default([])
    .describe(
      'Glob patterns matching URLs of pages that will be excluded from crawling. Note that this affects only links found on pages, but not Start URLs, which are always crawled.',
    )
    .meta({ title: 'Exclude URLs (globs)' })
    .register(apifyRegistry, { editor: 'globs' }),

  selector: z
    .string()
    .default('')
    .describe('CSS selector for links to enqueue. Leave empty to disable link enqueueing.')
    .meta({ title: 'Link Selector' })
    .register(apifyRegistry, { editor: 'textfield' }),

  keepUrlFragment: z
    .boolean()
    .default(false)
    .describe(
      'URL fragments (the parts of URL after a #) are not considered when the scraper determines whether a URL has already been visited. Turn this on to treat URLs with different fragments as different pages.',
    )
    .meta({ title: 'Keep URL fragment' }),

  useSitemaps: z
    .boolean()
    .default(false)
    .describe(
      'If enabled, the crawler looks for sitemap.xml at the root of each start URL domain and enqueues matching URLs from it in addition to link-following.',
    )
    .meta({ title: 'Use sitemaps' }),

  deduplication: z
    .enum(['minimal', 'standard', 'aggressive'])
    .default('standard')
    .describe(
      "Deduplication level applied on top of Crawlee's built-in URL deduplication. " +
        'standard (default): skip pages whose <link rel="canonical"> was already extracted, across all handler types. ' +
        'aggressive: also skip pages whose extracted text content matches a previously extracted page. ' +
        "minimal: disable additional deduplication — only Crawlee's built-in URL dedup remains active.",
    )
    .meta({ title: 'Deduplication' })
    .register(apifyRegistry, {
      editor: 'select',
      enumTitles: [
        'Minimal — Crawlee URL dedup only',
        'Standard — + canonical URL (default)',
        'Aggressive — + content hash',
      ],
    }),

  respectRobotsTxtFile: z
    .boolean()
    .default(false)
    .describe(
      'If enabled, the crawler will consult the robots.txt file for each domain before crawling pages.',
    )
    .meta({ title: 'Respect robots.txt' }),

  initialCookies: z
    .array(z.unknown())
    .optional()
    .describe(initialCookiesDescription)
    .meta({ title: 'Initial cookies' })
    .register(apifyRegistry, { editor: 'json', prefill: [], isSecret: true }),

  customHttpHeaders: z
    .record(z.string(), z.string())
    .optional()
    .describe(
      'HTTP headers that will be added to all requests made by the crawler. This is useful for setting custom authentication headers or other headers required by the target website. The value is expected to be a JSON object with header names as keys and header values as values. For example: `{ "Authorization": "Bearer token123", "X-Custom-Header": "value" }`.',
    )
    .meta({ title: 'Custom HTTP headers' })
    .register(apifyRegistry, { editor: 'json', prefill: {} }),

  maxRequestsPerCrawl: z
    .int()
    .min(0)
    .default(0)
    .describe(
      'Maximum number of requests the crawler will handle. Counts handled page outcomes (successes and final failures), including start URLs and pagination pages. The crawler automatically finishes after reaching this number. 0 means unlimited.',
    )
    .meta({ title: 'Max requests per crawl' }),

  maxResultsPerCrawl: z
    .int()
    .min(0)
    .default(0)
    .describe(
      'Maximum number of results that will be saved to dataset. The scraper will terminate after reaching this number. 0 means unlimited.',
    )
    .meta({ title: 'Max results' })
    .register(apifyRegistry, { unit: 'results' }),

  maxCrawlDepth: z
    .int()
    .min(0)
    .default(0)
    .describe(
      'Maximum link depth from Start URLs. Pages discovered further from start URLs than this limit will not be crawled. 0 means unlimited.',
    )
    .meta({ title: 'Max crawling depth' }),

  initialConcurrency: z
    .int()
    .min(0)
    .default(0)
    .describe(
      'Initial number of browser pages or HTTP clients running in parallel. Crawlee auto-scales up to maxConcurrency. 0 lets Crawlee pick the default.',
    )
    .meta({ title: 'Initial concurrency' }),

  maxConcurrency: z
    .int()
    .min(1)
    .default(3)
    .describe(
      'Maximum number of browser pages running in parallel. Kept low by default because the browser crawler cannot abort in-flight pages, so concurrency is the only hard cap on peak memory — large pages can exhaust memory at higher values. Raise it for lightweight pages or the HTTP (cheerio) crawler. This setting also avoids overloading target websites and getting blocked.',
    )
    .meta({ title: 'Max concurrency' }),

  maxRequestRetries: z
    .int()
    .min(0)
    .default(3)
    .describe('Maximum number of retries for failed requests on network, proxy, or server errors.')
    .meta({ title: 'Max request retries' }),

  mode: z
    .enum(['precision', 'balanced', 'recall', 'keep'])
    .default('balanced')
    .describe(
      'Extraction mode. precision minimizes noise (may miss some content); recall maximizes content (may include noise); balanced is the default; keep skips main-content extraction entirely and just sanitizes the whole document, keeping boilerplate (no page type or confidence).',
    )
    .meta({ title: 'Extraction mode' })
    .register(apifyRegistry, {
      editor: 'select',
      sectionCaption: 'Content extraction',
      enumTitles: [
        'Precision (less noise)',
        'Balanced (default)',
        'Recall (more content)',
        'Keep boilerplate (sanitize only)',
      ],
    }),

  includeComments: z
    .boolean()
    .default(true)
    .describe('Include HTML comments in the extracted text.')
    .meta({ title: 'Include comments' }),

  includeTables: z
    .boolean()
    .default(true)
    .describe('Include table content in the extracted text.')
    .meta({ title: 'Include tables' }),

  includeImages: z
    .boolean()
    .default(false)
    .describe('Include image alt text and captions in the extracted text.')
    .meta({ title: 'Include images' }),

  includeLinks: z
    .boolean()
    .default(true)
    .describe('Include hyperlinks in the extracted text.')
    .meta({ title: 'Include links' }),

  languageCode: z
    .string()
    .default('')
    .describe(
      'Filter extracted content by language code (e.g. "en"). Leave empty to accept any language.',
    )
    .meta({ title: 'Language' })
    .register(apifyRegistry, { editor: 'textfield' }),

  save: z
    .array(z.enum(SAVE_ROUTE_TOKENS))
    .min(1, 'Select at least one save route')
    .default(['markdown-kvs'])
    .describe(
      'What to save and where, as `format-destination` tokens. Format is one of ' +
        '`txt`, `markdown`, `json`, `html`, `original` (raw page HTML before extraction); ' +
        'destination is `dataset` (inline in the dataset record) or `kvs` (a blob in the ' +
        'key-value store). List a format twice to save it to both, e.g. ' +
        '`markdown-dataset markdown-kvs`. Saving `original` or `html` (large content) to the ' +
        'dataset is not recommended — it risks out-of-memory on large pages; prefer `kvs`.',
    )
    .meta({ title: 'Save' })
    .register(apifyRegistry, {
      editor: 'select',
      sectionCaption: 'Output settings',
      enumTitles: [
        'Plain text → Dataset',
        'Plain text → Key-value store',
        'Markdown → Dataset',
        'Markdown → Key-value store',
        'JSON → Dataset',
        'JSON → Key-value store',
        'HTML → Dataset (large; OOM risk)',
        'HTML → Key-value store',
        'Original HTML → Dataset (large; OOM risk)',
        'Original HTML → Key-value store',
      ],
    }),

  datasetName: z
    .string()
    .optional()
    .describe(
      'Name or ID of the dataset for storing results. Leave empty to use the default run dataset.',
    )
    .meta({ title: 'Dataset name' })
    .register(apifyRegistry, { editor: 'textfield' }),

  keyValueStoreName: z
    .string()
    .optional()
    .describe(
      'Name or ID of the key-value store for content files. Leave empty to use the default store.',
    )
    .meta({ title: 'Key-value store name' })
    .register(apifyRegistry, { editor: 'textfield' }),

  requestQueueName: z
    .string()
    .optional()
    .describe('Name of the request queue for pending URLs. Leave empty to use the default queue.')
    .meta({ title: 'Request queue name' })
    .register(apifyRegistry, { editor: 'textfield' }),

  storeSkippedUrls: z
    .boolean()
    .default(false)
    .describe(
      'If enabled, pushes a dataset record for each URL skipped during crawling (excluded by globs, robots.txt, depth limit, or concurrency cap). Can produce high record volume — enable for auditing only.',
    )
    .meta({ title: 'Store skipped URLs' }),

  proxyConfiguration: z
    .record(z.string(), z.unknown())
    .optional()
    .describe(
      'Enables loading websites from IP addresses in specific geographies and to circumvent blocking.',
    )
    .meta({ title: 'Proxy configuration' })
    .register(apifyRegistry, { editor: 'proxy', sectionCaption: 'Proxy' }),

  proxyRotation: z
    .enum(['recommended', 'per-request', 'until-failure'])
    .default('recommended')
    .describe(
      'Proxy rotation strategy. recommended automatically picks the best proxies. per-request uses a new proxy for each request. until-failure uses one proxy until it fails.',
    )
    .meta({ title: 'Proxy rotation' })
    .register(apifyRegistry, {
      editor: 'select',
      enumTitles: ['Recommended', 'Rotate per request', 'Use until failure'],
    }),

  sessionPoolName: z
    .string()
    .min(3)
    .max(200)
    .regex(/^[0-9A-Za-z_-]+$/)
    .optional()
    .describe(
      'Name for a persistent, shared session pool. Sessions (IP + cookies) are saved under this ' +
        'key and reused across Actor runs. Useful when proxies are frequently blocked — previously ' +
        'working sessions are preferred over random ones.',
    )
    .meta({ title: 'Session pool name' })
    .register(apifyRegistry, { editor: 'textfield' }),

  maxSessionRotations: z
    .int()
    .min(0)
    .max(20)
    .default(10)
    .describe(
      'Maximum number of session (IP + browser fingerprint) rotations per request on block ' +
        'detection. Independent of maxRequestRetries. Set to 0 to disable session rotation.',
    )
    .meta({
      title: 'Max session rotations',
    }),

  navigationTimeoutSecs: z
    .int()
    .min(1)
    .default(60)
    .describe('Maximum time to wait for page navigation in seconds')
    .meta({ title: 'Navigation timeout' })
    .register(apifyRegistry, { unit: 'seconds', sectionCaption: 'Performance and limits' }),

  blockMedia: z
    .boolean()
    .default(true)
    .describe(
      'Block loading of images, stylesheets, fonts (.woff), PDFs, and ZIPs. On by default: it cuts browser memory and bandwidth substantially, which helps avoid out-of-memory on large pages. Disable it (set to false) if a page needs media to render its content (e.g. image- or CSS-driven lazy loading). Has no effect when using the raw HTTP crawler type or non-Chromium browsers (Chromium only).',
    )
    .meta({ title: 'Block media' }),

  waitForSelector: z
    .string()
    .default('')
    .describe(
      'Wait for this CSS selector to appear before extracting content. The request fails and is retried if the selector does not appear within the timeout. Leave empty to disable.',
    )
    .meta({ title: 'Wait for selector' })
    .register(apifyRegistry, { editor: 'textfield' }),

  softWaitForSelector: z
    .string()
    .default('')
    .describe(
      'Wait for this CSS selector to appear before extracting content. Unlike waitForSelector, the request continues even if the selector does not appear within the timeout. Leave empty to disable.',
    )
    .meta({ title: 'Soft wait for selector' })
    .register(apifyRegistry, { editor: 'textfield' }),

  waitForDynamicContentSecs: z
    .int()
    .min(0)
    .default(0)
    .describe(
      'Maximum seconds to wait for dynamic page content to load after navigation. The crawler continues when the network goes idle or this timeout elapses, whichever comes first. 0 disables this wait. Also used as the timeout for waitForSelector and softWaitForSelector.',
    )
    .meta({ title: 'Wait for dynamic content' })
    .register(apifyRegistry, { unit: 'seconds' }),

  waitUntil: z
    .enum(['load', 'domcontentloaded', 'networkidle', 'commit'])
    .default('load')
    .describe(
      'When to consider navigation finished. networkidle waits for 500ms of network silence (best for JS-heavy SPAs, slower); load waits for the load event (default, good for most articles); domcontentloaded is fastest but may fire before client-side rendering completes; commit fires when network response is received and the document has started loading.',
    )
    .meta({ title: 'Navigation wait until' })
    .register(apifyRegistry, {
      editor: 'select',
      enumTitles: ['Load event', 'DOM content loaded', 'Network idle', 'Commit'],
    }),

  headless: z
    .boolean()
    .default(true)
    .describe('Run browser in headless mode')
    .meta({ title: 'Headless mode' }),

  ignoreCorsAndCsp: z
    .boolean()
    .default(false)
    .describe(
      'Ignore Content Security Policy and Cross-Origin Resource Sharing restrictions. Enables free XHR/Fetch requests from pages.',
    )
    .meta({ title: 'Ignore CORS and CSP' }),

  closeCookieModals: z
    .boolean()
    .default(true)
    .describe(
      'Automatically handle cookie consent: Ghostery-based ad/tracker blocking, accepting consent walls that replace the page (e.g. consent-or-pay) via the site’s own consent manager and re-fetching the article, and removing residual consent/CMP containers before extraction.',
    )
    .meta({ title: 'Close cookie modals' }),

  maxScrollHeight: z
    .int()
    .min(0)
    .default(5000)
    .describe(
      'Maximum pixels (px) to scroll down the page until all content is loaded. Setting to 0 disables scrolling.',
    )
    .meta({
      title: 'Max scroll height',
    }),

  userAgent: z
    .string()
    .default('')
    .describe(
      'Custom User-Agent string for the browser. Leave empty to use the default browser User-Agent.',
    )
    .meta({ title: 'User-Agent' })
    .register(apifyRegistry, { editor: 'textfield' }),

  ignoreHttpsErrors: z
    .boolean()
    .default(false)
    .describe('Ignore HTTPS certificate errors. Use at your own risk.')
    .meta({ title: 'Ignore HTTPS errors' }),
});

export type ContextractorInputType = z.infer<typeof ContextractorInput>;
