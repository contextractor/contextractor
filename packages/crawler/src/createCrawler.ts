import {
  DEFAULT_CONFIG,
  type OutputFormat,
  type TrafilaturaConfig,
} from '@contextractor/extraction';
import type {
  AdaptivePlaywrightCrawlerOptions,
  Configuration,
  PlaywrightHook,
  ProxyConfiguration,
  RequestProvider,
  SessionPoolOptions,
} from 'crawlee';
import {
  AdaptivePlaywrightCrawler,
  CheerioCrawler,
  log,
  PlaywrightCrawler,
  playwrightUtils,
  Request,
  type SitemapRequestList,
} from 'crawlee';
import { installCookieDefences } from './browser/cookies.js';
import { buildBrowserLaunchOptions } from './browser/launchOptions.js';
import type { ScrollConfig } from './browser/scroll.js';
import { createAdaptiveHandler, createCheerioHandler, createHandler } from './handler.js';
import type { ExtractionResult, Sink } from './sinks/types.js';

export interface ContextractorCrawlerOptions {
  startUrls: string[];
  sink: Sink<ExtractionResult>;
  formats?: OutputFormat[];
  mode?: 'precision' | 'balanced' | 'recall';
  includeComments?: boolean;
  includeTables?: boolean;
  includeImages?: boolean;
  includeLinks?: boolean;
  languageCode?: string;
  scroll?: ScrollConfig;
  cookieStrategy?: 'ghostery' | 'none';
  sessionPool?: boolean | SessionPoolOptions;
  maxRequestsPerCrawl?: number;
  maxRetries?: number;
  initialConcurrency?: number;
  maxConcurrency?: number;
  navigationTimeoutSecs?: number;
  /**
   * Navigation lifecycle event to wait for in `page.goto`.
   * Forwarded to Crawlee via `preNavigationHooks` → `gotoOptions.waitUntil`.
   * If undefined, Playwright's default of `'load'` applies.
   */
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit';
  headless?: boolean;
  crawlerType?: 'playwright-adaptive' | 'playwright-firefox' | 'playwright-chromium' | 'cheerio';
  renderingTypeDetectionRatio?: number;
  ignoreHttpsErrors?: boolean;
  bypassCSP?: boolean;
  initialCookies?: unknown[];
  extraHTTPHeaders?: Record<string, string>;
  userAgent?: string;
  selector?: string;
  maxCrawlDepth?: number;
  maxResults?: number;
  globs?: string[];
  exclude?: string[];
  keepUrlFragment?: boolean;
  proxyConfiguration?: ProxyConfiguration;
  /**
   * Proxy rotation strategy. Maps to Crawlee `sessionPoolOptions`.
   * recommended uses the default session reuse count; per-request retires the
   * session after one request (new browser context per request); until-failure
   * forces a single-session pool that stays on one proxy URL until the session
   * retires from errors. Has no effect when `proxyConfiguration` is undefined.
   */
  proxyRotation?: 'recommended' | 'per-request' | 'until-failure';
  sessionPoolName?: string;
  maxSessionRotations?: number;
  requestQueue?: RequestProvider;
  requestList?: SitemapRequestList;
  /**
   * Crawlee Configuration for this crawler. When set, the crawler and its
   * default storages are bound to it instead of the mutable global config —
   * lets a run isolate its storage (e.g. a non-persisting in-memory client)
   * without affecting other crawls in the same process.
   */
  configuration?: Configuration;
  blockMedia?: boolean;
  /**
   * Whether the caller explicitly set `blockMedia` (vs inheriting the schema
   * default, which is `true`). Only used to decide whether to emit the
   * "blockMedia has no effect" warning on incompatible crawler types, so the
   * default does not produce a spurious warning on every cheerio/firefox run.
   */
  blockMediaExplicit?: boolean;
  respectRobotsTxt?: boolean;
  waitForDynamicContentSecs?: number;
  waitForSelector?: string;
  softWaitForSelector?: string;
  onFailedRequest?: (info: {
    url: string;
    loadedUrl: string | null;
    errorMessages: string[];
    retryCount: number;
  }) => Promise<void>;
  onSkippedUrl?: (url: string, reason: string) => void;
  deduplication?: 'minimal' | 'standard' | 'aggressive';
}

function toTrafilaturaConfig(opts: ContextractorCrawlerOptions): TrafilaturaConfig {
  return {
    ...DEFAULT_CONFIG,
    favorPrecision: opts.mode === 'precision',
    favorRecall: opts.mode === 'recall',
    includeComments: opts.includeComments ?? DEFAULT_CONFIG.includeComments,
    includeTables: opts.includeTables ?? DEFAULT_CONFIG.includeTables,
    includeImages: opts.includeImages ?? DEFAULT_CONFIG.includeImages,
    includeFormatting: true,
    includeLinks: opts.includeLinks ?? DEFAULT_CONFIG.includeLinks,
    deduplicate: false,
    targetLanguage:
      opts.languageCode !== undefined && opts.languageCode !== ''
        ? opts.languageCode
        : DEFAULT_CONFIG.targetLanguage,
    withMetadata: true,
    onlyWithMetadata: false,
    fast: false,
    teiValidation: false,
  };
}

// From @apify/scraper-tools SESSION_MAX_USAGE_COUNTS (apify/actor-scraper).
const SESSION_MAX_USAGE_COUNTS = Object.freeze({
  recommended: undefined,
  'per-request': 1,
  'until-failure': 1000,
} as const);

export function createContextractorCrawler(
  opts: ContextractorCrawlerOptions,
): CheerioCrawler | AdaptivePlaywrightCrawler | PlaywrightCrawler {
  const crawlerType = opts.crawlerType ?? 'playwright-adaptive';

  if (
    opts.blockMedia &&
    opts.blockMediaExplicit &&
    crawlerType !== 'playwright-chromium' &&
    crawlerType !== 'playwright-adaptive'
  ) {
    log.warning(
      `blockMedia has no effect with crawlerType: ${crawlerType}. It only works with playwright-chromium and playwright-adaptive.`,
    );
  }

  const cookieStrategy = opts.cookieStrategy ?? 'ghostery';
  // Consent-DOM stripping is gated on cookie handling being enabled. It is a
  // content-cleanup concern (remove server-rendered consent text before
  // extraction), distinct from ghostery's network/cosmetic blocking, and must
  // run on every crawler type — including cheerio, where the idnes consent-or-pay
  // disclaimer reproduces over raw HTTP with no browser involved.
  const stripConsent = cookieStrategy === 'ghostery';
  const formats = opts.formats ?? ['markdown'];
  const deduplication: 'minimal' | 'standard' | 'aggressive' = opts.deduplication ?? 'standard';
  const seenCanonicals = new Set<string>();
  const seenContentHashes = new Set<string>();

  if (crawlerType === 'cheerio') {
    const handler = createCheerioHandler({
      extractionConfig: toTrafilaturaConfig(opts),
      sink: opts.sink,
      formats,
      maxResults: opts.maxResults,
      selector: opts.selector,
      maxCrawlDepth: opts.maxCrawlDepth,
      globs: opts.globs,
      exclude: opts.exclude,
      keepUrlFragment: opts.keepUrlFragment,
      onSkippedUrl: opts.onSkippedUrl,
      stripConsent,
      deduplication,
      seenCanonicals,
      seenContentHashes,
    });

    const cheerioSessionPoolOpts = {
      ...(typeof opts.sessionPool === 'object' ? opts.sessionPool : {}),
      ...(opts.sessionPoolName ? { persistStateKey: opts.sessionPoolName } : {}),
    };
    const crawler = new CheerioCrawler(
      {
        useSessionPool: opts.sessionPool !== false,
        ...(Object.keys(cheerioSessionPoolOpts).length > 0
          ? { sessionPoolOptions: cheerioSessionPoolOpts }
          : {}),
        maxRequestsPerCrawl:
          opts.maxRequestsPerCrawl && opts.maxRequestsPerCrawl > 0
            ? opts.maxRequestsPerCrawl
            : undefined,
        maxRequestRetries: opts.maxRetries ?? 3,
        maxSessionRotations: opts.maxSessionRotations ?? 10,
        ...(opts.initialConcurrency ? { minConcurrency: opts.initialConcurrency } : {}),
        ...(opts.maxConcurrency !== undefined ? { maxConcurrency: opts.maxConcurrency } : {}),
        ...(opts.navigationTimeoutSecs !== undefined
          ? { requestHandlerTimeoutSecs: opts.navigationTimeoutSecs }
          : {}),
        ...(opts.respectRobotsTxt !== undefined
          ? { respectRobotsTxtFile: opts.respectRobotsTxt }
          : {}),
        proxyConfiguration: opts.proxyConfiguration,
        requestQueue: opts.requestQueue,
        ...(opts.requestList !== undefined ? { requestList: opts.requestList } : {}),
        additionalMimeTypes: ['text/html', 'application/xhtml+xml'],
        ...(opts.onFailedRequest
          ? {
              failedRequestHandler: async ({ request }, error) => {
                await opts.onFailedRequest?.({
                  url: request.url,
                  loadedUrl: request.loadedUrl ?? null,
                  errorMessages: [...(request.errorMessages ?? []), error.message],
                  retryCount: request.retryCount,
                });
              },
            }
          : {}),
      },
      opts.configuration,
    );
    crawler.router.addDefaultHandler(handler);
    return crawler;
  }

  const launcher = crawlerType === 'playwright-firefox' ? 'firefox' : 'chromium';

  const launchOptions = buildBrowserLaunchOptions({
    launcher,
    ignoreHttpsErrors: opts.ignoreHttpsErrors,
  });

  const useSessionPool = opts.sessionPool !== false;
  const userSessionPoolOptions =
    typeof opts.sessionPool === 'object' ? opts.sessionPool : undefined;

  const rotation = opts.proxyRotation ?? 'recommended';
  const maxUsageCount = SESSION_MAX_USAGE_COUNTS[rotation];
  const rotationSessionPoolOptions = {
    sessionOptions: {
      ...(userSessionPoolOptions?.sessionOptions ?? {}),
      ...(maxUsageCount !== undefined ? { maxUsageCount } : {}),
    },
    ...(rotation === 'until-failure' ? { maxPoolSize: 1 } : {}),
  };

  const sessionPoolOptions = {
    ...(userSessionPoolOptions ? { ...userSessionPoolOptions } : {}),
    ...rotationSessionPoolOptions,
    ...(opts.sessionPoolName ? { persistStateKey: opts.sessionPoolName } : {}),
  };

  const contextOptions: {
    bypassCSP?: boolean;
    storageState?: { cookies: unknown[] };
    extraHTTPHeaders?: Record<string, string>;
    userAgent?: string;
  } = {};
  if (opts.bypassCSP) contextOptions.bypassCSP = true;
  if (opts.initialCookies && opts.initialCookies.length > 0) {
    contextOptions.storageState = { cookies: opts.initialCookies };
  }
  if (opts.extraHTTPHeaders && Object.keys(opts.extraHTTPHeaders).length > 0) {
    contextOptions.extraHTTPHeaders = opts.extraHTTPHeaders;
  }
  if (opts.userAgent) contextOptions.userAgent = opts.userAgent;

  const baseOptions = {
    headless: opts.headless ?? true,
    launchContext: {
      launchOptions,
      ...(Object.keys(contextOptions).length > 0 ? { contextOptions } : {}),
    },
    useSessionPool,
    persistCookiesPerSession: useSessionPool,
    sessionPoolOptions,
    maxRequestsPerCrawl:
      opts.maxRequestsPerCrawl && opts.maxRequestsPerCrawl > 0
        ? opts.maxRequestsPerCrawl
        : undefined,
    maxRequestRetries: opts.maxRetries ?? 3,
    maxSessionRotations: opts.maxSessionRotations ?? 10,
    ...(opts.initialConcurrency ? { minConcurrency: opts.initialConcurrency } : {}),
    ...(opts.maxConcurrency !== undefined ? { maxConcurrency: opts.maxConcurrency } : {}),
    ...(opts.navigationTimeoutSecs !== undefined
      ? {
          requestHandlerTimeoutSecs: opts.navigationTimeoutSecs,
          navigationTimeoutSecs: opts.navigationTimeoutSecs,
        }
      : {}),
    ...(opts.respectRobotsTxt !== undefined ? { respectRobotsTxtFile: opts.respectRobotsTxt } : {}),
    proxyConfiguration: opts.proxyConfiguration,
    requestQueue: opts.requestQueue,
    ...(opts.requestList !== undefined ? { requestList: opts.requestList } : {}),
  };

  if (crawlerType === 'playwright-adaptive') {
    const adaptivePreHooks: AdaptivePlaywrightCrawlerOptions['preNavigationHooks'] = [];
    const waitUntil = opts.waitUntil;
    if (waitUntil !== undefined) {
      adaptivePreHooks.push(async (_ctx, gotoOptions) => {
        if (gotoOptions) gotoOptions.waitUntil = waitUntil;
      });
    }
    if (opts.blockMedia) {
      adaptivePreHooks.push(async ({ page }) => {
        if (page) await playwrightUtils.blockRequests(page);
      });
    }
    if (cookieStrategy === 'ghostery') {
      adaptivePreHooks.push(async ({ page }) => {
        if (page) await installCookieDefences(page);
      });
    }

    const adaptiveHandler = createAdaptiveHandler({
      extractionConfig: toTrafilaturaConfig(opts),
      sink: opts.sink,
      formats,
      maxResults: opts.maxResults,
      selector: opts.selector,
      maxCrawlDepth: opts.maxCrawlDepth,
      globs: opts.globs,
      exclude: opts.exclude,
      keepUrlFragment: opts.keepUrlFragment,
      onSkippedUrl: opts.onSkippedUrl,
      stripConsent,
      deduplication,
      seenCanonicals,
      seenContentHashes,
    });
    const adaptiveCrawler = new AdaptivePlaywrightCrawler(
      {
        ...baseOptions,
        preventDirectStorageAccess: false,
        renderingTypeDetectionRatio: opts.renderingTypeDetectionRatio ?? 0.1,
        ...(adaptivePreHooks.length > 0 ? { preNavigationHooks: adaptivePreHooks } : {}),
        ...(opts.onFailedRequest
          ? {
              failedRequestHandler: async ({ request }, error) => {
                await opts.onFailedRequest?.({
                  url: request.url,
                  loadedUrl: request.loadedUrl ?? null,
                  errorMessages: [...(request.errorMessages ?? []), error.message],
                  retryCount: request.retryCount,
                });
              },
            }
          : {}),
      },
      opts.configuration,
    );
    adaptiveCrawler.router.addDefaultHandler(adaptiveHandler);
    return adaptiveCrawler;
  }

  const preNavigationHooks: PlaywrightHook[] = [];
  const waitUntil = opts.waitUntil;
  if (waitUntil !== undefined) {
    preNavigationHooks.push(async (_ctx, gotoOptions) => {
      if (gotoOptions) gotoOptions.waitUntil = waitUntil;
    });
  }
  if (opts.blockMedia) {
    preNavigationHooks.push(async ({ page }) => playwrightUtils.blockRequests(page));
  }
  if (cookieStrategy === 'ghostery') {
    preNavigationHooks.push(async ({ page }) => installCookieDefences(page));
  }

  const handler = createHandler({
    extractionConfig: toTrafilaturaConfig(opts),
    sink: opts.sink,
    scroll: opts.scroll,
    formats,
    maxResults: opts.maxResults,
    selector: opts.selector,
    maxCrawlDepth: opts.maxCrawlDepth,
    globs: opts.globs,
    exclude: opts.exclude,
    keepUrlFragment: opts.keepUrlFragment,
    onSkippedUrl: opts.onSkippedUrl,
    waitForDynamicContentSecs: opts.waitForDynamicContentSecs,
    waitForSelector: opts.waitForSelector,
    softWaitForSelector: opts.softWaitForSelector,
    stripConsent,
    deduplication,
    seenCanonicals,
    seenContentHashes,
  });

  const crawler = new PlaywrightCrawler(
    {
      ...baseOptions,
      ...(preNavigationHooks.length > 0 ? { preNavigationHooks } : {}),
      ...(opts.onFailedRequest
        ? {
            failedRequestHandler: async ({ request }, error) => {
              await opts.onFailedRequest?.({
                url: request.url,
                loadedUrl: request.loadedUrl ?? null,
                errorMessages: [...(request.errorMessages ?? []), error.message],
                retryCount: request.retryCount,
              });
            },
          }
        : {}),
    },
    opts.configuration,
  );
  crawler.router.addDefaultHandler(handler);
  return crawler;
}

export function buildRequests(startUrls: string[], keepUrlFragment = false): Request[] {
  return startUrls.map((url) => new Request({ url, keepUrlFragment: keepUrlFragment }));
}
