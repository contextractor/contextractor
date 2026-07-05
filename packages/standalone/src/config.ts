import { readFile } from 'node:fs/promises';
import {
  buildRouteMap,
  type ContextractorCrawlerOptions,
  type ExtractionResult,
  extractedFormats,
  type ProxyConfiguration,
  type RequestProvider,
  type Sink,
  type SitemapRequestList,
} from '@contextractor/crawler';
import type { ContextractorInputType, SaveRoute } from '@contextractor/schema';
import type { Configuration } from 'crawlee';

/**
 * Validate `--save` tokens against a `format-destination` vocabulary
 * (e.g. the schema's `SAVE_ROUTE_TOKENS` on `extract`/`export`, or the
 * CLI-local `EXTRACT_ONE_TOKENS` on `extract-one`). Normalizes
 * case/whitespace, dedupes, and throws on any unknown token.
 */
export function validateSaveTokens<T extends string>(
  tokens: string[],
  validTokens: readonly T[],
): T[] {
  const valid = new Set<string>(validTokens);
  const out: T[] = [];
  for (const raw of tokens) {
    const normalized = raw.trim().toLowerCase() as T;
    if (!valid.has(normalized)) {
      throw new Error(`Unknown --save token: '${normalized}'. Valid: ${validTokens.join(', ')}`);
    }
    if (!out.includes(normalized)) out.push(normalized);
  }
  return out;
}

interface CrawlConfig {
  urls: string[];
  maxRequestsPerCrawl: number;
  maxCrawlDepth: number;
  headless: boolean;
  mode: 'precision' | 'balanced' | 'recall';
  includeComments: boolean;
  includeTables: boolean;
  includeImages: boolean;
  includeLinks: boolean;
  languageCode: string;

  // Browser.
  crawlerType: 'playwright-adaptive' | 'playwright-firefox' | 'playwright-chromium' | 'cheerio';
  renderingTypeDetectionRatio: number;
  waitUntil: 'load' | 'domcontentloaded' | 'networkidle' | 'commit';
  navigationTimeoutSecs: number;
  ignoreCors: boolean;
  closeCookieModals: boolean;
  maxScrollHeight: number;
  blockMedia: boolean;
  ignoreHttpsErrors: boolean;
  userAgent: string;

  // Crawl filtering.
  globs: string[];
  exclude: string[];
  selector: string;
  keepUrlFragment: boolean;
  respectRobotsTxt: boolean;

  // Cookies & headers.
  cookies: unknown[];
  headers: Record<string, string>;

  // Concurrency & retries.
  initialConcurrency: number;
  maxConcurrency: number;
  maxRetries: number;
  maxResults: number;

  // Selector waits.
  waitForDynamicContentSecs: number;
  waitForSelector: string;
  softWaitForSelector: string;

  // Deduplication.
  deduplication: 'minimal' | 'standard' | 'aggressive';

  // Output routing: `format-destination` tokens.
  save: SaveRoute[];

  // Session pool.
  sessionPoolName: string | undefined;
  maxSessionRotations: number;
}

export interface CliOnlyOverrides {
  urls: string[];
  save: SaveRoute[];
  proxyUrls: string[];
  proxyRotation?: 'recommended' | 'per-request' | 'until-failure';
}

// TODO(phase-2): hoist this projection into `@contextractor/schema` so the
// Apify Actor and the standalone CLI share a single buildCrawlConfig.
export function buildCrawlConfig(
  input: ContextractorInputType,
  cli: CliOnlyOverrides,
): CrawlConfig {
  return {
    urls: cli.urls,
    save: cli.save,

    headless: input.headless,
    maxRequestsPerCrawl: input.maxRequestsPerCrawl,
    maxCrawlDepth: input.maxCrawlDepth,
    crawlerType: input.crawlerType,
    renderingTypeDetectionRatio: input.renderingTypeDetectionRatio,
    waitUntil: input.waitUntil,
    navigationTimeoutSecs: input.navigationTimeoutSecs,
    ignoreCors: input.ignoreCorsAndCsp,
    closeCookieModals: input.closeCookieModals,
    maxScrollHeight: input.maxScrollHeight,
    blockMedia: input.blockMedia,
    ignoreHttpsErrors: input.ignoreHttpsErrors,
    userAgent: input.userAgent,
    globs: input.globs.map((g) => g.glob).filter((g): g is string => Boolean(g)),
    exclude: input.exclude.map((g) => g.glob).filter((g): g is string => Boolean(g)),
    selector: input.selector,
    keepUrlFragment: input.keepUrlFragment,
    respectRobotsTxt: input.respectRobotsTxtFile,
    cookies: input.initialCookies ?? [],
    headers: input.customHttpHeaders ?? {},
    initialConcurrency: input.initialConcurrency,
    maxConcurrency: input.maxConcurrency,
    maxRetries: input.maxRequestRetries,
    maxResults: input.maxResultsPerCrawl,
    waitForDynamicContentSecs: input.waitForDynamicContentSecs,
    waitForSelector: input.waitForSelector,
    softWaitForSelector: input.softWaitForSelector,
    deduplication: input.deduplication,
    mode: input.mode,
    includeComments: input.includeComments,
    includeTables: input.includeTables,
    includeImages: input.includeImages,
    includeLinks: input.includeLinks,
    languageCode: input.languageCode,
    sessionPoolName: input.sessionPoolName,
    maxSessionRotations: input.maxSessionRotations,
  };
}

/**
 * Runtime wiring for {@link toCrawlerOptions} — the parts of a crawl that are
 * not derivable from {@link CrawlConfig}: the result sink, an (optional) proxy
 * configuration + rotation, an (optional) sitemap request list / request queue,
 * and the failure/skip callbacks. Both the CLI (`runExtractAction`) and the
 * library `run()` build one of these and hand it to `toCrawlerOptions`.
 */
export interface CrawlerRuntime {
  sink: Sink<ExtractionResult>;
  proxyConfiguration?: ProxyConfiguration;
  proxyRotation?: ContextractorInputType['proxyRotation'];
  requestList?: SitemapRequestList;
  requestQueue?: RequestProvider;
  /**
   * Crawlee Configuration binding the crawler and its default storages to an
   * isolated config instead of the mutable global one (used by `extractOne`
   * to keep its non-persisting run from touching other crawls).
   */
  configuration?: Configuration;
  onFailedRequest?: ContextractorCrawlerOptions['onFailedRequest'];
  onSkippedUrl?: ContextractorCrawlerOptions['onSkippedUrl'];
  /**
   * Whether the caller explicitly provided `blockMedia` (vs inheriting the
   * schema default of `true`). Gates the "blockMedia has no effect" warning so
   * the default does not warn on every cheerio/firefox run. Known only at the
   * call site (CLI flag/config-file presence, or the library options object).
   */
  blockMediaExplicit?: boolean;
}

/**
 * Map a resolved {@link CrawlConfig} plus its {@link CrawlerRuntime} onto the
 * `@contextractor/crawler` options object. This is the single source of truth
 * for the `CrawlConfig` → `ContextractorCrawlerOptions` projection, shared by
 * the CLI extract action and the programmatic library `run()`.
 */
export function toCrawlerOptions(
  cfg: CrawlConfig,
  rt: CrawlerRuntime,
): ContextractorCrawlerOptions {
  return {
    startUrls: cfg.urls,
    sink: rt.sink,
    formats: extractedFormats(buildRouteMap(cfg.save)),
    mode: cfg.mode,
    includeComments: cfg.includeComments,
    includeTables: cfg.includeTables,
    includeImages: cfg.includeImages,
    includeLinks: cfg.includeLinks,
    languageCode: cfg.languageCode,
    cookieStrategy: cfg.closeCookieModals ? 'ghostery' : 'none',
    scroll: cfg.maxScrollHeight > 0 ? { maxScrollHeight: cfg.maxScrollHeight } : undefined,
    headless: cfg.headless,
    crawlerType: cfg.crawlerType,
    renderingTypeDetectionRatio: cfg.renderingTypeDetectionRatio,
    ignoreHttpsErrors: cfg.ignoreHttpsErrors,
    bypassCSP: cfg.ignoreCors,
    initialCookies: cfg.cookies,
    extraHTTPHeaders: cfg.headers,
    userAgent: cfg.userAgent || undefined,
    maxRequestsPerCrawl: cfg.maxRequestsPerCrawl,
    maxRetries: cfg.maxRetries,
    initialConcurrency: cfg.initialConcurrency,
    maxConcurrency: cfg.maxConcurrency,
    blockMedia: cfg.blockMedia,
    blockMediaExplicit: rt.blockMediaExplicit,
    navigationTimeoutSecs: cfg.navigationTimeoutSecs,
    waitUntil: cfg.waitUntil,
    maxResults: cfg.maxResults > 0 ? cfg.maxResults : undefined,
    selector: cfg.selector || undefined,
    maxCrawlDepth: cfg.maxCrawlDepth,
    globs: cfg.globs,
    exclude: cfg.exclude,
    keepUrlFragment: cfg.keepUrlFragment,
    respectRobotsTxt: cfg.respectRobotsTxt,
    waitForDynamicContentSecs:
      cfg.waitForDynamicContentSecs > 0 ? cfg.waitForDynamicContentSecs : undefined,
    waitForSelector: cfg.waitForSelector || undefined,
    softWaitForSelector: cfg.softWaitForSelector || undefined,
    deduplication: cfg.deduplication,
    ...(rt.requestList !== undefined ? { requestList: rt.requestList } : {}),
    proxyConfiguration: rt.proxyConfiguration,
    proxyRotation: rt.proxyRotation,
    sessionPoolName: cfg.sessionPoolName,
    maxSessionRotations: cfg.maxSessionRotations,
    requestQueue: rt.requestQueue,
    configuration: rt.configuration,
    onFailedRequest: rt.onFailedRequest,
    ...(rt.onSkippedUrl ? { onSkippedUrl: rt.onSkippedUrl } : {}),
  };
}

export async function loadConfigFile(filePath: string): Promise<Partial<ContextractorInputType>> {
  const text = await readFile(filePath, 'utf8');
  const data: unknown = JSON.parse(text);

  if (!isRecord(data)) {
    return {};
  }
  // Tolerate a `$schema` association key so a config authored against the
  // published cli-input.schema.json (editor validation/hover) round-trips. It
  // is not a Contextractor field — strip it before merge/parse.
  if ('$schema' in data) {
    const clone = { ...data };
    delete clone.$schema;
    return clone;
  }
  return data;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
