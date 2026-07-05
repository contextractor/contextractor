/**
 * `@contextractor/extraction` — TypeScript content-extraction package.
 *
 * Built on `rs-trafilatura` (Rust port of Trafilatura) via the napi-rs
 * binding in `@contextractor/extraction-native`, and consumed by the
 * `@contextractor/apify` Actor and the standalone CLI which both also use
 * Crawlee (TypeScript) for crawling.
 *
 * Exposes the metadata superset that rs-trafilatura provides.
 */

import {
  type ExtractionResult as NativeExtractionResult,
  type ExtractOptions as NativeExtractOptions,
  type Metadata as NativeMetadata,
  type TrafilaturaConfig as NativeTrafilaturaConfig,
  extract as nativeExtract,
  extractAllFormats as nativeExtractAllFormats,
  extractMetadata as nativeExtractMetadata,
} from '@contextractor/extraction-native';

/** Supported output formats. See engine README for the upstream-format gap. */
export type OutputFormat = 'txt' | 'markdown' | 'json' | 'html';

const DEFAULT_FORMATS: readonly OutputFormat[] = ['txt', 'markdown', 'json', 'html'];

const OUTPUT_FORMAT_SET = new Set<string>(DEFAULT_FORMATS);

function isOutputFormat(value: string): value is OutputFormat {
  return OUTPUT_FORMAT_SET.has(value);
}

/**
 * Trafilatura extraction config. `teiValidation` and `withMetadata` are
 * forward-compat placeholders accepted by the binding but ignored by
 * rs-trafilatura.
 */
export interface TrafilaturaConfig {
  fast: boolean;
  favorPrecision: boolean;
  favorRecall: boolean;
  includeComments: boolean;
  includeTables: boolean;
  includeImages: boolean;
  includeFormatting: boolean;
  includeLinks: boolean;
  deduplicate: boolean;
  targetLanguage: string | null;
  /** Forward-compat — rs-trafilatura always returns metadata; flag is ignored. */
  withMetadata: boolean;
  onlyWithMetadata: boolean;
  /** Forward-compat placeholder — accepted by the binding, not forwarded. */
  teiValidation: boolean;
}

/** Defaults matching rs-trafilatura's balanced preset. */
export const DEFAULT_CONFIG: Readonly<TrafilaturaConfig> = Object.freeze({
  fast: false,
  favorPrecision: false,
  favorRecall: false,
  includeComments: true,
  includeTables: true,
  includeImages: false,
  includeFormatting: true,
  includeLinks: true,
  deduplicate: false,
  targetLanguage: null,
  withMetadata: true,
  onlyWithMetadata: false,
  teiValidation: false,
});

/** Single-format extraction result. */
export interface ExtractionResult {
  content: string;
  format: OutputFormat;
}

/**
 * Metadata returned by rs-trafilatura. Core fields: `title`, `author`,
 * `date`, `description`, `sitename`, `language`. Extended fields:
 * `categories`, `tags`, `license`, `image`, `pageType`, `hostname`, `url`.
 */
export interface Metadata {
  title: string | null;
  author: string | null;
  /** ISO 8601 string. */
  date: string | null;
  description: string | null;
  sitename: string | null;
  language: string | null;
  hostname: string | null;
  url: string | null;
  categories: string[] | null;
  tags: string[] | null;
  license: string | null;
  image: string | null;
  pageType: string | null;
}

const EMPTY_METADATA: Readonly<Metadata> = Object.freeze({
  title: null,
  author: null,
  date: null,
  description: null,
  sitename: null,
  language: null,
  hostname: null,
  url: null,
  categories: null,
  tags: null,
  license: null,
  image: null,
  pageType: null,
});

/** Trafilatura wrapper with configurable extraction. */
export class ContentExtractor {
  private readonly config: TrafilaturaConfig;

  constructor(config?: Partial<TrafilaturaConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...(config ?? {}) };
  }

  /** Read-only view of the resolved config (defaults merged with overrides). */
  getConfig(): Readonly<TrafilaturaConfig> {
    return this.config;
  }

  /** Extract a single output format from `html`. */
  extract(
    html: string,
    opts: { url?: string; format?: OutputFormat } = {},
  ): ExtractionResult | null {
    const format = opts.format ?? 'txt';
    try {
      const native = nativeExtract(html, this.buildNativeOptions(opts.url, format));
      return toResult(native);
    } catch {
      return null;
    }
  }

  /** Extract metadata from `html`. Returns an all-`null` `Metadata` on failure. */
  extractMetadata(html: string, url?: string): Metadata {
    try {
      const native = nativeExtractMetadata(html, url);
      return toMetadata(native);
    } catch {
      return { ...EMPTY_METADATA };
    }
  }

  /** Extract `html` once and return all four formats keyed by format name. */
  extractAllFormats(
    html: string,
    opts: { url?: string; formats?: OutputFormat[] } = {},
  ): Record<OutputFormat, ExtractionResult> {
    const formats = opts.formats ?? DEFAULT_FORMATS;
    const out = createEmptyResultMap();

    try {
      const native = nativeExtractAllFormats(html, this.buildNativeOptions(opts.url));
      for (const fmt of formats) {
        const value = native[fmt];
        if (value) {
          out[fmt] = toResult(value);
        }
      }
    } catch {}

    return out;
  }

  private buildNativeOptions(url: string | undefined, format?: OutputFormat): NativeExtractOptions {
    const options: NativeExtractOptions = {
      config: toNativeConfig(this.config),
    };
    if (url !== undefined) options.url = url;
    if (format !== undefined) options.format = format;
    return options;
  }
}

/** Returns a fresh copy of `DEFAULT_CONFIG`. */
export function getDefaultConfig(): TrafilaturaConfig {
  return { ...DEFAULT_CONFIG };
}

function toNativeConfig(config: TrafilaturaConfig): NativeTrafilaturaConfig {
  const out: NativeTrafilaturaConfig = {
    fast: config.fast,
    favorPrecision: config.favorPrecision,
    favorRecall: config.favorRecall,
    includeComments: config.includeComments,
    includeTables: config.includeTables,
    includeImages: config.includeImages,
    includeFormatting: config.includeFormatting,
    includeLinks: config.includeLinks,
    deduplicate: config.deduplicate,
    withMetadata: config.withMetadata,
    onlyWithMetadata: config.onlyWithMetadata,
    teiValidation: config.teiValidation,
  };
  if (config.targetLanguage !== null) out.targetLanguage = config.targetLanguage;
  return out;
}

function toResult(value: NativeExtractionResult): ExtractionResult {
  return {
    content: value.content,
    format: isOutputFormat(value.format) ? value.format : 'txt',
  };
}

function createEmptyResultMap(): Record<OutputFormat, ExtractionResult> {
  return {
    txt: { content: '', format: 'txt' },
    markdown: { content: '', format: 'markdown' },
    json: { content: '', format: 'json' },
    html: { content: '', format: 'html' },
  };
}

function toMetadata(value: NativeMetadata): Metadata {
  return {
    title: value.title ?? null,
    author: value.author ?? null,
    date: value.date ?? null,
    description: value.description ?? null,
    sitename: value.sitename ?? null,
    language: value.language ?? null,
    hostname: value.hostname ?? null,
    url: value.url ?? null,
    categories: value.categories ?? null,
    tags: value.tags ?? null,
    license: value.license ?? null,
    image: value.image ?? null,
    pageType: value.pageType ?? null,
  };
}

export * from './contentInfo.js';
export * from './metadata.js';
