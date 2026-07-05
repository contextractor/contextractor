export type { RequestProvider } from 'crawlee';
export { ProxyConfiguration, SitemapRequestList } from 'crawlee';
export { getBlocker, installCookieDefences } from './browser/cookies.js';
export type { ScrollConfig } from './browser/scroll.js';
export { autoScroll } from './browser/scroll.js';
export type { ContextractorCrawlerOptions } from './createCrawler.js';
export { buildRequests, createContextractorCrawler } from './createCrawler.js';
export { memorySink } from './sinks/memory.js';
export {
  buildRouteMap,
  extractedFormats,
  type FormatRoute,
  type RouteMap,
  SAVE_FORMATS,
  type SaveFormat,
  savesOriginal,
  warnDangerousRoutes,
} from './sinks/routes.js';
export {
  type BuildSuccessRecordOpts,
  buildFailedRecord,
  buildSkippedRecord,
  buildSuccessRecord,
  type ContentKind,
  type ContentNode,
  extForKind,
  type FailedRequestInfo,
  type KvsLike,
  kvsKey,
} from './sinks/storage.js';
export type { ExtractionResult, Sink } from './sinks/types.js';
