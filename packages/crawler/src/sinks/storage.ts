import { createHash } from 'node:crypto';
import { computeContentInfo, type OutputFormat } from '@contextractor/extraction';
import { type FormatRoute, type RouteMap, savesOriginal } from './routes.js';
import type { ExtractionResult } from './types.js';

/** A content kind written to the key-value store: an output format, or the raw original HTML. */
export type ContentKind = OutputFormat | 'original';

interface KvsSpec {
  ext: string;
  contentType: string;
  keyPrefix: string;
}

/**
 * Per-kind key-value-store metadata. The `keyPrefix` values MUST match the
 * `KvsCollections` keyPrefixes in `@contextractor/schema`; a test asserts this.
 */
const KVS_SPECS: Record<ContentKind, KvsSpec> = {
  txt: { ext: 'txt', contentType: 'text/plain; charset=utf-8', keyPrefix: 'txt-' },
  markdown: { ext: 'md', contentType: 'text/markdown; charset=utf-8', keyPrefix: 'markdown-' },
  json: { ext: 'json', contentType: 'application/json; charset=utf-8', keyPrefix: 'json-' },
  html: { ext: 'html', contentType: 'text/html; charset=utf-8', keyPrefix: 'html-' },
  original: { ext: 'html', contentType: 'text/html; charset=utf-8', keyPrefix: 'original-' },
};

/** Output formats written from `result.formats` (everything except the raw original HTML). */
const CONTENT_FORMATS: readonly OutputFormat[] = ['txt', 'markdown', 'json', 'html'];

/**
 * A piece of content (an extracted format or the raw original HTML). `hash` +
 * `bytes` are always present; `content` carries the inline string (dataset
 * destination), while `key` + `url` reference the stored blob (key-value-store
 * destination).
 */
export interface ContentNode {
  hash: string;
  bytes: number;
  content?: string;
  key?: string;
  url?: string;
}

/** Minimal key-value-store surface shared by the Apify SDK and Crawlee stores. */
export interface KvsLike {
  setValue(key: string, value: string, options?: { contentType?: string }): Promise<void>;
  getPublicUrl?(key: string): string | Promise<string>;
}

/** Deterministic KVS key for a content blob: `{keyPrefix}{md5(url)}.{ext}`. */
export function kvsKey(kind: ContentKind, url: string): string {
  const spec = KVS_SPECS[kind];
  const hash = createHash('md5').update(url).digest('hex');
  return `${spec.keyPrefix}${hash}.${spec.ext}`;
}

/** File extension for a content kind (`txt`, `md`, `json`, `html`; `original` → `html`). */
export function extForKind(kind: ContentKind): string {
  return KVS_SPECS[kind].ext;
}

/** Current time as an ISO 8601 timestamp truncated to whole seconds. */
function isoSecond(): string {
  return new Date().toISOString().replace(/\.\d+Z$/, 'Z');
}

/**
 * Build a `ContentNode` for one piece of content, driven by its per-format
 * route. A format may target both destinations at once: when `toDataset`, the
 * string is inlined as `content`; when `toKvs`, the blob is written to the
 * key-value store and referenced by `key` (+ `url` when the store exposes a
 * public URL — the Apify platform; local Crawlee storage has none). Both `content`
 * and `key`/`url` are set when the format routes to both.
 */
async function buildContentNode(
  kvs: KvsLike,
  kind: ContentKind,
  url: string,
  content: string,
  info: { hash: string; bytes: number },
  r: FormatRoute,
): Promise<ContentNode> {
  const node: ContentNode = { hash: info.hash, bytes: info.bytes };
  if (r.toDataset) {
    node.content = content;
  }
  if (r.toKvs) {
    const key = kvsKey(kind, url);
    await kvs.setValue(key, content, { contentType: KVS_SPECS[kind].contentType });
    node.key = key;
    if (kvs.getPublicUrl) {
      const publicUrl = await kvs.getPublicUrl(key);
      if (publicUrl) node.url = publicUrl;
    }
  }
  return node;
}

export interface BuildSuccessRecordOpts {
  kvs: KvsLike;
  /** Per-format destination map parsed from the `save` token array. */
  routes: RouteMap;
}

/**
 * Assemble the `status: 'success'` dataset record for one extracted page, shared
 * by the Apify Actor and the standalone CLI/lib so their records are identical.
 * Each content field (`txt`/`markdown`/`json`/`html` and `original`) is written
 * as a `ContentNode` only when its `route` selects a destination: inlined as
 * `content` for the dataset, referenced by `key`/`url` for the key-value store,
 * or both when the format targets both. `original` is always present (at least
 * `{ hash, bytes }`); its raw HTML is included only when an `original-*` token
 * is in save.
 */
export async function buildSuccessRecord(
  result: ExtractionResult,
  opts: BuildSuccessRecordOpts,
): Promise<Record<string, unknown>> {
  const { kvs, routes } = opts;

  const data: Record<string, unknown> = {
    url: result.url,
    status: 'success',
    metadata: result.metadata,
    crawl: {
      loadedUrl: result.loadedUrl,
      loadedTime: isoSecond(),
      httpStatusCode: 200,
      depth: result.crawlDepth,
      referrerUrl: result.referrerUrl,
    },
  };

  const originalInfo = { hash: result.rawHtmlHash, bytes: result.rawHtmlLength };
  data.original = savesOriginal(routes)
    ? await buildContentNode(
        kvs,
        'original',
        result.url,
        result.html,
        originalInfo,
        routes.original,
      )
    : { ...originalInfo };

  for (const fmt of CONTENT_FORMATS) {
    const r = routes[fmt];
    if (!r.toKvs && !r.toDataset) continue;
    const content = result.formats[fmt];
    if (content === undefined) continue;
    const info = computeContentInfo(content);
    data[fmt] = await buildContentNode(
      kvs,
      fmt,
      result.url,
      content,
      { hash: info.hash, bytes: info.length },
      r,
    );
  }

  return data;
}

export interface FailedRequestInfo {
  url: string;
  loadedUrl: string | null;
  errorMessages: string[];
  retryCount: number;
}

/** Assemble the `status: 'failed'` dataset record. Shared across surfaces. */
export function buildFailedRecord(info: FailedRequestInfo): Record<string, unknown> {
  return {
    url: info.url,
    status: 'failed',
    crawl: { loadedUrl: info.loadedUrl },
    errors: info.errorMessages,
    retryCount: info.retryCount,
    crawledTime: isoSecond(),
  };
}

/** Assemble the `status: 'skipped'` dataset record. Shared across surfaces. */
export function buildSkippedRecord(url: string, skipReason: string): Record<string, unknown> {
  return { url, status: 'skipped', skipReason };
}
