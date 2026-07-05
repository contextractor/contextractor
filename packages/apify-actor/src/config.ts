import {
  buildRouteMap,
  type ContextractorCrawlerOptions,
  type ExtractionResult,
  extractedFormats,
  type ProxyConfiguration,
  type RequestProvider,
  type Sink,
} from '@contextractor/crawler';
import type { ContextractorInputType } from '@contextractor/schema';

export function buildCrawlerOpts(
  input: ContextractorInputType,
  sink: Sink<ExtractionResult>,
  proxyConfiguration?: ProxyConfiguration,
  requestQueue?: RequestProvider,
  proxyRotation?: ContextractorInputType['proxyRotation'],
): ContextractorCrawlerOptions {
  // Extract only the formats the `save` tokens request (excluding `original`,
  // which is raw HTML). May be empty (e.g. only `original-kvs`) — the engine
  // accepts zero extracted formats and the sink then writes only `original`.
  const formats = extractedFormats(buildRouteMap(input.save));

  return {
    startUrls: [],
    sink,
    formats,
    mode: input.mode,
    includeComments: input.includeComments,
    includeTables: input.includeTables,
    includeImages: input.includeImages,
    includeLinks: input.includeLinks,
    languageCode: input.languageCode,
    cookieStrategy: input.closeCookieModals ? 'ghostery' : 'none',
    scroll: input.maxScrollHeight > 0 ? { maxScrollHeight: input.maxScrollHeight } : undefined,
    headless: input.headless,
    crawlerType: input.crawlerType,
    renderingTypeDetectionRatio: input.renderingTypeDetectionRatio,
    ignoreHttpsErrors: input.ignoreHttpsErrors,
    bypassCSP: input.ignoreCorsAndCsp,
    initialCookies: input.initialCookies,
    extraHTTPHeaders: input.customHttpHeaders ?? undefined,
    userAgent: input.userAgent || undefined,
    maxRequestsPerCrawl: input.maxRequestsPerCrawl,
    maxRetries: input.maxRequestRetries,
    initialConcurrency: input.initialConcurrency,
    maxConcurrency: input.maxConcurrency,
    navigationTimeoutSecs: input.navigationTimeoutSecs,
    waitUntil: input.waitUntil,
    maxResults: input.maxResultsPerCrawl > 0 ? input.maxResultsPerCrawl : undefined,
    selector: input.selector,
    maxCrawlDepth: input.maxCrawlDepth,
    globs: input.globs.map((g) => g.glob).filter((g): g is string => Boolean(g)),
    exclude: input.exclude.map((g) => g.glob).filter((g): g is string => Boolean(g)),
    keepUrlFragment: input.keepUrlFragment,
    proxyConfiguration,
    proxyRotation,
    requestQueue,
    blockMedia: input.blockMedia,
    respectRobotsTxt: input.respectRobotsTxtFile,
    waitForDynamicContentSecs: input.waitForDynamicContentSecs,
    waitForSelector: input.waitForSelector || undefined,
    softWaitForSelector: input.softWaitForSelector || undefined,
    deduplication: input.deduplication,
    sessionPoolName: input.sessionPoolName,
    maxSessionRotations: input.maxSessionRotations,
  };
}
