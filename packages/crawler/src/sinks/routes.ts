import type { OutputFormat } from '@contextractor/extraction';
import { log } from 'crawlee';

/**
 * The five savable kinds: the four extracted output formats plus the raw
 * `original` page HTML. Structurally equal to `ContentKind` in `storage.ts`,
 * but defined here so the route helpers stay free of a circular import.
 */
export const SAVE_FORMATS = ['txt', 'markdown', 'json', 'html', 'original'] as const;

/** A savable kind: an extracted format or the raw `original` HTML. */
export type SaveFormat = (typeof SAVE_FORMATS)[number];

/** Whether one format targets the key-value store, the dataset, or both. */
export interface FormatRoute {
  toKvs: boolean;
  toDataset: boolean;
}

/** Per-format destination lookup derived from the `save` token array. */
export type RouteMap = Record<SaveFormat, FormatRoute>;

function isSaveFormat(value: string): value is SaveFormat {
  return (SAVE_FORMATS as readonly string[]).includes(value);
}

/**
 * Parse the `save` token array (`format-destination`, e.g. `markdown-dataset`,
 * `original-kvs`) into a per-format destination map. A format listed against both
 * destinations (`markdown-dataset markdown-kvs`) yields `{ toKvs: true, toDataset:
 * true }`. Throws on an unknown token. Pure — no I/O.
 */
export function buildRouteMap(tokens: readonly string[]): RouteMap {
  const map: RouteMap = {
    txt: { toKvs: false, toDataset: false },
    markdown: { toKvs: false, toDataset: false },
    json: { toKvs: false, toDataset: false },
    html: { toKvs: false, toDataset: false },
    original: { toKvs: false, toDataset: false },
  };
  for (const token of tokens) {
    // Each token has exactly one hyphen — the format is hyphen-free and the
    // destination (`kvs`/`dataset`) is hyphen-free — so the last `-` splits cleanly.
    const idx = token.lastIndexOf('-');
    const fmt = idx === -1 ? token : token.slice(0, idx);
    const dest = idx === -1 ? '' : token.slice(idx + 1);
    if (!isSaveFormat(fmt) || (dest !== 'kvs' && dest !== 'dataset')) {
      throw new Error(
        `Invalid save token: '${token}'. Expected <format>-<destination> where format is one ` +
          `of ${SAVE_FORMATS.join(', ')} and destination is dataset or kvs.`,
      );
    }
    if (dest === 'kvs') map[fmt].toKvs = true;
    else map[fmt].toDataset = true;
  }
  return map;
}

/**
 * The extracted formats to run for a route map — every format with at least one
 * destination, excluding `original` (raw HTML, not an extraction). May be empty
 * (e.g. `save: ['original-kvs']`), which the extraction engine accepts.
 */
export function extractedFormats(map: RouteMap): OutputFormat[] {
  const out: OutputFormat[] = [];
  for (const fmt of ['txt', 'markdown', 'json', 'html'] as const) {
    if (map[fmt].toKvs || map[fmt].toDataset) out.push(fmt);
  }
  return out;
}

/** Whether any `original-*` token is present (the raw HTML should be saved). */
export function savesOriginal(map: RouteMap): boolean {
  return map.original.toKvs || map.original.toDataset;
}

/**
 * Emit a single warning when large content (`original` or `html`) is routed to
 * the dataset, where it is inlined into each record and can cause out-of-memory
 * on large pages. Call once at sink construction (per run), not per page.
 */
export function warnDangerousRoutes(map: RouteMap): void {
  const danger = (['original', 'html'] as const).filter((f) => map[f].toDataset);
  if (danger.length === 0) return;
  const kvsSuggestion = danger.map((f) => `${f}-kvs`).join(', ');
  log.warning(
    `Saving ${danger.join(' and ')} to the dataset can cause out-of-memory on large pages. ` +
      `Prefer the key-value store (${kvsSuggestion}) for large content.`,
  );
}
