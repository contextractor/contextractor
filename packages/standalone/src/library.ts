import { randomUUID } from 'node:crypto';
import {
  buildFailedRecord,
  buildRequests,
  buildRouteMap,
  buildSkippedRecord,
  createContextractorCrawler,
  type ExtractionResult,
  memorySink,
  ProxyConfiguration,
  SAVE_FORMATS,
  type SaveFormat,
  type Sink,
  SitemapRequestList,
} from '@contextractor/crawler';
import {
  ContextractorInput,
  type ContextractorInputType,
  type SaveRoute,
} from '@contextractor/schema';
import { Configuration, Dataset, KeyValueStore, LogLevel, log, RequestQueue } from 'crawlee';
import {
  buildCrawlConfig,
  type CliOnlyOverrides,
  type CrawlerRuntime,
  toCrawlerOptions,
} from './config.js';
import { createCrawleeStorageSink } from './sinks.js';
import { configureStorage, resolveStorageDir } from './storage/index.js';

/**
 * Options for the programmatic library API. The field names mirror
 * {@link ContextractorInputType} exactly (camelCase), minus `startUrls` — those
 * are passed to `run(urls)` — and minus the named-bucket fields
 * (`datasetName`/`keyValueStoreName`/`requestQueueName`), which are an Apify
 * Actor concept: the library always uses the `default` buckets under
 * `storageDir`. Three knobs are library-only and are intentionally NOT part of
 * the shared input schema (so they never leak into the Apify Actor input):
 * `includeHtml`, `storageDir`, and `logLevel`.
 */
export type ContextractorOptions = Partial<
  Omit<
    ContextractorInputType,
    'startUrls' | 'datasetName' | 'keyValueStoreName' | 'requestQueueName'
  >
> & {
  /** Include the raw page `html` on each returned record. Default `false`. */
  includeHtml?: boolean;
  /**
   * When set, ALSO persist full records to disk via the Crawlee storage sink
   * (dataset + key-value store). In-memory results are returned regardless;
   * this switch only adds the disk path. The storage location resolves the
   * same way as the CLI (`resolveStorageDir`).
   */
  storageDir?: string;
  /** Crawlee log threshold for this run. Default `'warning'` (keeps stdout clean). */
  logLevel?: 'off' | 'error' | 'warning' | 'info' | 'debug';
};

/**
 * A returned record. Identical to the crawler's {@link ExtractionResult} except
 * the raw `html` is omitted unless `includeHtml` is set. The
 * `rawHtmlHash` / `rawHtmlLength` metadata are always retained.
 */
export type LibraryRecord = Omit<ExtractionResult, 'html'> & { html?: string };

/** A subset of Crawlee's `FinalStatistics`, returned from {@link run}. */
export interface RunStatistics {
  requestsFinished: number;
  requestsFailed: number;
  requestsTotal: number;
}

/** The result handle returned by `run(urls)`. */
export interface RunResult {
  dataset: ResultDataset;
  statistics: RunStatistics;
}

/**
 * Compose several sinks into one. Each is awaited in order, so a disk sink
 * placed first receives the full {@link ExtractionResult} (including `html`)
 * before an in-memory adapter strips it.
 */
export function combineSinks<T>(...sinks: Sink<T>[]): Sink<T> {
  return async (result: T): Promise<void> => {
    for (const sink of sinks) {
      await sink(result);
    }
  };
}

/**
 * A `Dataset`-style handle over in-memory results (the Crawlee `Dataset`
 * pattern, minimally mirrored). Holds only successful extractions; failures and
 * skips are reflected in {@link RunStatistics}, not here.
 */
export class ResultDataset {
  constructor(private readonly items: LibraryRecord[]) {}

  /** Number of records held. */
  get count(): number {
    return this.items.length;
  }

  /** Return all records as a fresh array (the internal array is not exposed). */
  getData(): LibraryRecord[] {
    return [...this.items];
  }

  /** Alias of {@link getData}, mirroring Crawlee's `dataset.export()`. */
  export(): LibraryRecord[] {
    return this.getData();
  }

  /** Iterate records sequentially, awaiting an async iteratee. */
  async forEach(
    iteratee: (item: LibraryRecord, index: number) => void | Promise<void>,
  ): Promise<void> {
    let index = 0;
    for (const item of this.items) {
      await iteratee(item, index);
      index++;
    }
  }

  /** Write all records as JSON to a Crawlee key-value store (default store if omitted). */
  async exportToJSON(key: string, store?: KeyValueStore): Promise<void> {
    const kvs = store ?? (await KeyValueStore.open('default'));
    await kvs.setValue(key, this.items);
  }

  /** Write all records as CSV to a Crawlee key-value store (default store if omitted). */
  async exportToCSV(key: string, store?: KeyValueStore): Promise<void> {
    const kvs = store ?? (await KeyValueStore.open('default'));
    await kvs.setValue(key, toCsv(this.items), { contentType: 'text/csv; charset=utf-8' });
  }
}

const SUPPORTED_PROXY_SCHEMES = ['http:', 'https:', 'socks4:', 'socks5:'];

/**
 * Build a `ProxyConfiguration` from the schema's `proxyConfiguration.proxyUrls`,
 * validating each scheme. Throws (never `process.exit`) on an unsupported or
 * malformed URL, with credentials redacted from the message. Apify Proxy
 * (`useApifyProxy` / `groups`) is Actor-only and rejected here.
 */
function validateProxy(
  proxyConfiguration: Record<string, unknown> | undefined,
): ProxyConfiguration | undefined {
  if (!proxyConfiguration) return undefined;

  const proxyUrls = proxyConfiguration.proxyUrls;
  if (!Array.isArray(proxyUrls) || proxyUrls.length === 0) {
    if ('useApifyProxy' in proxyConfiguration || 'groups' in proxyConfiguration) {
      throw new Error(
        'Apify Proxy configuration is only supported in the Apify Actor build. ' +
          'Provide explicit proxyConfiguration.proxyUrls (http/https/socks4/socks5) instead.',
      );
    }
    return undefined;
  }

  const urls: string[] = [];
  for (const raw of proxyUrls) {
    if (typeof raw !== 'string') {
      throw new Error('proxyConfiguration.proxyUrls must be an array of URL strings.');
    }
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(raw);
    } catch {
      // Do not echo `raw` — it may embed credentials (user:pass@host).
      throw new Error('proxyConfiguration.proxyUrls contains a malformed URL.');
    }
    if (!SUPPORTED_PROXY_SCHEMES.includes(parsedUrl.protocol)) {
      // Report scheme + host only; never the userinfo segment.
      throw new Error(
        `Unsupported proxy scheme "${parsedUrl.protocol}" in "${parsedUrl.protocol}//${parsedUrl.host}". ` +
          'Use http://, https://, socks4:// or socks5://. ' +
          'Apify Proxy configuration is only supported in the Apify Actor build.',
      );
    }
    urls.push(raw);
  }
  return new ProxyConfiguration({ proxyUrls: urls });
}

function resolveLogLevel(level: ContextractorOptions['logLevel']): LogLevel {
  switch (level) {
    case 'off':
      return LogLevel.OFF;
    case 'error':
      return LogLevel.ERROR;
    case 'warning':
      return LogLevel.WARNING;
    case 'info':
      return LogLevel.INFO;
    case 'debug':
      return LogLevel.DEBUG;
    default:
      return LogLevel.WARNING;
  }
}

/**
 * In-memory result collector. Wraps `memorySink` and strips `html` (unless
 * `includeHtml`) at the TypeScript boundary — never in the native layer. The
 * `rawHtmlHash` / `rawHtmlLength` siblings are retained either way.
 */
function memoryAdapter(includeHtml: boolean): {
  sink: Sink<ExtractionResult>;
  results: LibraryRecord[];
} {
  const mem = memorySink<LibraryRecord>();
  const sink: Sink<ExtractionResult> = async (result) => {
    const { html, ...rest } = result;
    await mem(includeHtml ? { ...rest, html } : rest);
  };
  return { sink, results: mem.results };
}

function csvEscape(value: string): string {
  // Neutralize spreadsheet formula injection: a cell whose first character is
  // =, +, -, @, tab, or CR is evaluated as a formula by Excel/Sheets. Scraped
  // content is untrusted (security.md), so prefix such cells with an apostrophe
  // before RFC-4180 quoting.
  const v = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return csvEscape(JSON.stringify(value));
  return csvEscape(String(value));
}

/**
 * Minimal, dependency-free RFC-4180 CSV serializer for a flat array of records.
 * Columns are the sorted union of top-level keys; nested objects (`metadata`,
 * `formats`) are JSON-stringified into a single cell.
 */
function toCsv(items: LibraryRecord[]): string {
  const keys = new Set<string>();
  for (const item of items) {
    for (const key of Object.keys(item)) keys.add(key);
  }
  const header = [...keys].sort();
  const lines = [header.map(csvEscape).join(',')];
  for (const item of items) {
    const record = item as Record<string, unknown>;
    lines.push(header.map((key) => csvCell(record[key])).join(','));
  }
  return lines.join('\n');
}

async function executeRun(
  options: ContextractorOptions,
  urls: string[],
  runtimeExtras?: Pick<CrawlerRuntime, 'requestQueue' | 'configuration'>,
): Promise<RunResult> {
  const { includeHtml = false, storageDir, logLevel, ...schemaOptions } = options;

  // Validate through the shared input schema. `startUrls` come from run(urls);
  // unknown library-only keys were already removed by destructuring above.
  const parsed = ContextractorInput.safeParse({
    ...schemaOptions,
    startUrls: urls.map((url) => ({ url })),
  });
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid contextractor options: ${issues}`);
  }
  const input = parsed.data;

  const previousLogLevel = log.getLevel();
  log.setLevel(resolveLogLevel(logLevel));
  try {
    const cli: CliOnlyOverrides = {
      urls: input.startUrls
        .map((u) => u.url)
        .filter((u): u is string => typeof u === 'string' && u.length > 0),
      save: input.save,
      proxyUrls: [],
      proxyRotation: input.proxyRotation,
    };
    const cfg = buildCrawlConfig(input, cli);
    const proxyConfiguration = validateProxy(input.proxyConfiguration);

    const mem = memoryAdapter(includeHtml);
    let sink: Sink<ExtractionResult> = mem.sink;
    let onFailedRequest: CrawlerRuntime['onFailedRequest'];
    let onSkippedUrl: CrawlerRuntime['onSkippedUrl'];

    // Optional disk path — mirrors the CLI: full records to the storage sink,
    // plus failed/skipped records pushed to the dataset.
    if (storageDir !== undefined) {
      configureStorage(resolveStorageDir(storageDir));
      const kvs = await KeyValueStore.open('default');
      const ds = await Dataset.open('default');
      const diskSink = createCrawleeStorageSink({
        routes: buildRouteMap(input.save),
        kvs,
        dataset: ds,
      });
      sink = combineSinks(diskSink, mem.sink);
      onFailedRequest = async (info) => {
        await ds.pushData(buildFailedRecord(info));
      };
      if (input.storeSkippedUrls) {
        onSkippedUrl = (url, reason) => {
          void ds.pushData(buildSkippedRecord(url, reason));
        };
      }
    }

    const runtime: CrawlerRuntime = {
      sink,
      proxyConfiguration,
      proxyRotation: input.proxyRotation,
      onFailedRequest,
      onSkippedUrl,
      blockMediaExplicit: 'blockMedia' in schemaOptions,
      ...runtimeExtras,
    };

    if (input.useSitemaps) {
      const sitemapUrls = [...new Set(cfg.urls.map((u) => `${new URL(u).origin}/sitemap.xml`))];
      runtime.requestList = await SitemapRequestList.open({
        sitemapUrls,
        globs: cfg.globs,
        exclude: cfg.exclude,
      });
    }

    const crawler = createContextractorCrawler(toCrawlerOptions(cfg, runtime));
    const stats = await crawler.run(buildRequests(cfg.urls, cfg.keepUrlFragment));

    const max = input.maxResultsPerCrawl;
    const items = max > 0 ? mem.results.slice(0, max) : mem.results;

    return {
      dataset: new ResultDataset(items),
      statistics: {
        requestsFinished: stats.requestsFinished,
        requestsFailed: stats.requestsFailed,
        requestsTotal: stats.requestsTotal,
      },
    };
  } finally {
    log.setLevel(previousLogLevel);
  }
}

/**
 * Construct a programmatic extractor from a camelCase options object, then call
 * `run(urls)` to crawl and get results back in memory.
 *
 * Mirrors Crawlee minimally: construct-from-options, `run(urls)` resolving to a
 * `Dataset`-style handle plus a `statistics` subset of `FinalStatistics`.
 * `run()` never throws on partial failure and never calls `process.exit()` —
 * failures surface as counts in `statistics`. Returning in-memory data and
 * writing to disk (via `storageDir`) are independent and may both be active.
 */
export function createExtractor(options: ContextractorOptions = {}): {
  run(urls: string[]): Promise<RunResult>;
} {
  return {
    run: (urls: string[]) => executeRun(options, urls),
  };
}

/**
 * Options for {@link extractOne} — the single-page subset of
 * {@link ContextractorOptions}. The entire output-routing axis is dropped
 * (no `save`; the caller routes the returned values), as are `storageDir`
 * (nothing is persisted — use `formats: ['original']` instead of `includeHtml`
 * for the raw page HTML), `sessionPoolName` (cross-run session sharing needs
 * persisted session-pool state, and every `extractOne` run is isolated and
 * non-persisting), and the crawl-frontier knobs, which are hard-pinned to a
 * single URL (`maxCrawlDepth: 0`, `maxRequestsPerCrawl: 1`, no
 * globs/exclude/selector/sitemaps).
 */
export type ExtractOneOptions = Omit<
  ContextractorOptions,
  | 'save'
  | 'storageDir'
  | 'includeHtml'
  | 'maxCrawlDepth'
  | 'maxRequestsPerCrawl'
  | 'maxResultsPerCrawl'
  | 'globs'
  | 'exclude'
  | 'selector'
  | 'useSitemaps'
  | 'keepUrlFragment'
  | 'initialConcurrency'
  | 'maxConcurrency'
  | 'deduplication'
  | 'storeSkippedUrls'
  | 'sessionPoolName'
> & {
  /** Formats to extract and return. Default `['markdown']`. */
  formats?: SaveFormat[];
};

/**
 * Crawl exactly one URL (no link-following) and return the extracted content
 * as a `format → string` map keyed by the requested `formats`. A thin facade
 * over the {@link createExtractor} run path capped at one request: nothing is
 * persisted (the run uses a non-persisting in-memory storage client), and
 * output routing stays with the caller. Throws when the single request fails.
 */
export async function extractOne(
  url: string,
  options: ExtractOneOptions = {},
): Promise<Partial<Record<SaveFormat, string>>> {
  const { formats = ['markdown'], ...singlePage } = options;
  const requested = [...new Set(formats)];
  if (requested.length === 0) {
    throw new Error('extractOne: `formats` must list at least one format.');
  }
  for (const format of requested) {
    if (!(SAVE_FORMATS as readonly string[]).includes(format)) {
      throw new Error(`extractOne: unknown format '${format}'. Valid: ${SAVE_FORMATS.join(', ')}.`);
    }
  }

  // The save tokens only tell the engine which formats to produce — nothing
  // reaches a key-value store (no `storageDir` → memory sink only).
  const save = requested.map((format) => `${format}-kvs` as SaveRoute);

  // Keep the single-page run off the disk entirely and away from other crawls
  // in this process: an isolated, non-persisting Configuration (never the
  // mutable global one — Crawlee caches storages per client, so flipping the
  // global `persistStorage` would corrupt concurrent createExtractor runs).
  const configuration = new Configuration({
    storageClientOptions: { persistStorage: false },
    purgeOnStart: false,
  });
  // A per-run queue: a shared RequestQueue remembers handled URLs for the
  // lifetime of the process, which would no-op a repeated extractOne of the
  // same URL.
  const requestQueue = await RequestQueue.open(`extract-one-${randomUUID()}`, {
    config: configuration,
  });
  try {
    const result = await executeRun(
      {
        ...singlePage,
        save,
        includeHtml: requested.includes('original'),
        maxCrawlDepth: 0,
        maxRequestsPerCrawl: 1,
      },
      [url],
      { requestQueue, configuration },
    );
    const [record] = result.dataset.getData();
    if (!record) {
      throw new Error(
        `extractOne: extraction failed for ${url} ` +
          `(${result.statistics.requestsFailed} failed request(s)).`,
      );
    }
    const contents: Partial<Record<SaveFormat, string>> = {};
    for (const format of requested) {
      const content = format === 'original' ? record.html : record.formats[format];
      if (typeof content === 'string') contents[format] = content;
    }
    return contents;
  } finally {
    await requestQueue.drop();
  }
}
