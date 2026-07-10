/**
 * `@contextractor/extraction` — TypeScript content-extraction package.
 *
 * Built on **Trafilatura Core** (`trafilaturacore`, https://www.trafilatura.dev/),
 * a hybrid Rust + TypeScript extraction engine: HTML in, cleaned HTML out. Its
 * `clean()` is called **once** per page; `@contextractor/conversion` then renders
 * that single cleaned-HTML string into every requested output format.
 *
 * Consumed by the `@contextractor/apify` Actor and the standalone CLI, which
 * both also use Crawlee (TypeScript) for crawling.
 */

import { convert } from '@contextractor/conversion';
import {
  type CleanOptions,
  clean,
  type Metadata as EngineMetadata,
  type Message,
} from 'trafilaturacore';
import { applyLanguageFilter } from './language.js';

/** Supported output formats. */
export type OutputFormat = 'txt' | 'markdown' | 'json' | 'html';

const DEFAULT_FORMATS: readonly OutputFormat[] = ['txt', 'markdown', 'json', 'html'];

/**
 * Extraction config, mapped onto the engine's `CleanOptions`.
 *
 * `favorPrecision` / `favorRecall` select the engine's boilerplate-removal mode;
 * the three `include*` content toggles pass straight through.
 */
export interface TrafilaturaConfig {
  favorPrecision: boolean;
  favorRecall: boolean;
  /**
   * **Soft no-op.** The engine accepts this flag, but comment retention is
   * decided by its page-type extraction profile, not by a tag-level toggle. It
   * is kept because it is part of Contextractor's public input contract; it does
   * not change the output. Do not present it as effective.
   */
  includeComments: boolean;
  includeTables: boolean;
  includeImages: boolean;
  includeLinks: boolean;
  /**
   * Keep only content whose **declared** language matches this primary subtag.
   * Never statistical detection — see `language.ts`.
   */
  targetLanguage: string | null;
}

/** Defaults matching the engine's balanced preset. */
export const DEFAULT_CONFIG: Readonly<TrafilaturaConfig> = Object.freeze({
  favorPrecision: false,
  favorRecall: false,
  includeComments: true,
  includeTables: true,
  includeImages: false,
  includeLinks: true,
  targetLanguage: null,
});

/** Single-format extraction result. */
export interface ExtractionResult {
  content: string;
  format: OutputFormat;
}

/**
 * Page metadata. Core fields: `title`, `author`, `date`, `description`,
 * `sitename`, `language`. Extended: `categories`, `tags`, `license`, `image`,
 * `pageType`, `hostname`, `url`.
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

/** Everything one `clean()` call produced, before it is rendered to formats. */
interface CleanedPage {
  html: string;
  metadata: Metadata;
  pageType: string | null;
  confidence: number | null;
  messages: Message[];
  /** `true` when the declared-language filter rejected the whole page. */
  rejected: boolean;
}

/**
 * One page, cleaned once and rendered into every requested format.
 *
 * This is what a crawler wants: the previous engine forced N+1 native parses per
 * page (one per format, plus one for metadata), whereas one `clean()` call now
 * yields the metadata and the single cleaned-HTML string that every format is
 * rendered from.
 */
export interface PageExtraction {
  metadata: Metadata;
  /** Only the formats that produced content. A rejected page yields none. */
  formats: Partial<Record<OutputFormat, string>>;
  pageType: string | null;
  confidence: number | null;
  messages: Message[];
}

/**
 * Trafilatura Core wrapper with configurable extraction.
 *
 * Every method is **async**: the engine's `clean()` loads its native addon
 * lazily and runs extraction on the libuv threadpool.
 *
 * `clean()` never throws — on a native failure it degrades to cleaning the whole
 * document and records a warning in `messages`. So unlike the previous engine,
 * these methods do not swallow errors into `null`; the only `null`/empty result
 * is a page the declared-language filter rejected.
 */
export class ContentExtractor {
  private readonly config: TrafilaturaConfig;

  constructor(config?: Partial<TrafilaturaConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...(config ?? {}) };
  }

  /** Read-only view of the resolved config (defaults merged with overrides). */
  getConfig(): Readonly<TrafilaturaConfig> {
    return this.config;
  }

  /**
   * Clean `html` **once** and render the requested formats, returning them
   * alongside the metadata and the engine's diagnostics. The call every crawler
   * handler should make: it is the only one that pays for a single engine pass.
   */
  async extractPage(
    html: string,
    opts: { url?: string; formats?: readonly OutputFormat[] } = {},
  ): Promise<PageExtraction> {
    const formats = opts.formats ?? DEFAULT_FORMATS;
    const page = await this.cleanPage(html, opts.url);
    const rendered = page.rejected
      ? {}
      : convert({ html: page.html, formats, json: jsonContext(page) });

    const nonEmpty: Partial<Record<OutputFormat, string>> = {};
    for (const format of formats) {
      const content = rendered[format];
      if (content !== undefined && content !== '') nonEmpty[format] = content;
    }
    return {
      metadata: page.metadata,
      formats: nonEmpty,
      pageType: page.pageType,
      confidence: page.confidence,
      messages: page.messages,
    };
  }

  /** Extract a single output format from `html`. `null` when nothing survived. */
  async extract(
    html: string,
    opts: { url?: string; format?: OutputFormat } = {},
  ): Promise<ExtractionResult | null> {
    const format = opts.format ?? 'txt';
    const page = await this.cleanPage(html, opts.url);
    if (page.rejected) return null;
    const content = convert({ html: page.html, formats: [format], json: jsonContext(page) })[
      format
    ];
    return content === undefined ? null : { content, format };
  }

  /** Extract metadata from `html`. Returns an all-`null` `Metadata` on failure. */
  async extractMetadata(html: string, url?: string): Promise<Metadata> {
    const page = await this.cleanPage(html, url);
    return page.metadata;
  }

  /** Clean `html` once and return every requested format keyed by format name. */
  async extractAllFormats(
    html: string,
    opts: { url?: string; formats?: OutputFormat[] } = {},
  ): Promise<Record<OutputFormat, ExtractionResult>> {
    const formats = opts.formats ?? DEFAULT_FORMATS;
    const out = createEmptyResultMap();

    const page = await this.cleanPage(html, opts.url);
    if (page.rejected) return out;

    const converted = convert({ html: page.html, formats, json: jsonContext(page) });
    for (const format of formats) {
      const content = converted[format];
      if (content !== undefined) out[format] = { content, format };
    }
    return out;
  }

  /**
   * The single engine call. Applies the declared-language filter to the raw HTML
   * first, then hands the survivors to `clean()`.
   */
  private async cleanPage(html: string, url?: string): Promise<CleanedPage> {
    const filtered = applyLanguageFilter(html, this.config.targetLanguage);
    if (filtered.rejected) {
      return {
        html: '',
        metadata: { ...EMPTY_METADATA, language: filtered.language, url: url ?? null },
        pageType: null,
        confidence: null,
        messages: [
          {
            type: 'info',
            text: `declared language ${filtered.language ?? 'unknown'} does not match the requested ${this.config.targetLanguage ?? ''}`,
          },
        ],
        rejected: true,
      };
    }

    const result = await clean(filtered.html, this.toCleanOptions(url));
    return {
      html: result.html,
      metadata: toMetadata(result.metadata, filtered.language, result.pageType ?? null, url),
      pageType: result.pageType ?? null,
      confidence: result.confidence ?? null,
      messages: result.messages,
      rejected: false,
    };
  }

  private toCleanOptions(url: string | undefined): CleanOptions {
    const options: CleanOptions = {
      boilerplate: this.config.favorPrecision
        ? 'precision'
        : this.config.favorRecall
          ? 'recall'
          : 'balanced',
      includeComments: this.config.includeComments,
      includeTables: this.config.includeTables,
      // The engine keeps images unless told otherwise; Contextractor defaults
      // them off. Always pass the resolved boolean so the defaults cannot drift.
      includeImages: this.config.includeImages,
      includeLinks: this.config.includeLinks,
    };
    if (url !== undefined) options.url = url;
    return options;
  }
}

/** Returns a fresh copy of `DEFAULT_CONFIG`. */
export function getDefaultConfig(): TrafilaturaConfig {
  return { ...DEFAULT_CONFIG };
}

function jsonContext(page: CleanedPage): {
  metadata: Metadata;
  pageType: string | null;
  confidence: number | null;
  messages: Message[];
} {
  return {
    metadata: page.metadata,
    pageType: page.pageType,
    confidence: page.confidence,
    messages: page.messages,
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

/**
 * Project the engine's optional metadata sidecar onto Contextractor's all-nullable
 * `Metadata`. `language` is not an engine field — it comes from the declared-lang
 * reader — and `pageType` falls back to the classifier's own verdict.
 */
function toMetadata(
  meta: EngineMetadata | undefined,
  language: string | null,
  pageType: string | null,
  url: string | undefined,
): Metadata {
  return {
    title: meta?.title ?? null,
    author: meta?.author ?? null,
    date: meta?.date ?? null,
    description: meta?.description ?? null,
    sitename: meta?.sitename ?? null,
    language,
    hostname: meta?.hostname ?? null,
    url: meta?.url ?? url ?? null,
    categories: meta?.categories ?? null,
    tags: meta?.tags ?? null,
    license: meta?.license ?? null,
    image: meta?.image ?? null,
    pageType: meta?.pageType ?? pageType,
  };
}

export * from './contentInfo.js';
export { applyLanguageFilter, declaredLanguage, normalizeLanguage } from './language.js';
export * from './metadata.js';
