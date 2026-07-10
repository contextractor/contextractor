import type { ConversionFormat } from './conversion-format.js';
import type { Message } from './extraction-document.js';
import { toJson } from './json-output.js';
import { toMarkdown } from './markdown.js';
import { parseCleanedHtml } from './parse.js';
import { toPlainText } from './plain-text.js';

/** The non-content fields the `json` format carries alongside text/html/markdown. */
export interface JsonContext<M> {
  metadata: M;
  pageType: string | null;
  confidence: number | null;
  messages: Message[];
}

/** Input to {@link convert}. */
export interface ConvertOptions<M> {
  /** Cleaned HTML, as produced by the extraction engine. */
  html: string;
  /** Which formats to produce. Unrequested formats are absent from the result. */
  formats: readonly ConversionFormat[];
  /** Required when `formats` includes `'json'`. */
  json?: JsonContext<M>;
}

/**
 * Convert one cleaned-HTML string into the requested output formats.
 *
 * The HTML is parsed **once**; the resulting node feeds both the Markdown
 * conversion and the plain-text walk. `html` is a passthrough, and `json`
 * embeds text, html, and markdown together with {@link JsonContext}.
 *
 * (The `original` format — the raw, uncleaned page HTML — never reaches this
 * package: the crawler carries it straight to the sink.)
 *
 * @throws {TypeError} if `'json'` is requested without a `json` context.
 */
export function convert<M>(options: ConvertOptions<M>): Partial<Record<ConversionFormat, string>> {
  const { html, formats } = options;
  const wanted = new Set(formats);
  if (wanted.has('json') && options.json === undefined) {
    throw new TypeError("convert() requires a `json` context when 'json' is requested");
  }

  const out: Partial<Record<ConversionFormat, string>> = {};
  if (wanted.has('html')) out.html = html;
  if (wanted.size === 0 || (wanted.size === 1 && wanted.has('html'))) return out;

  const body = parseCleanedHtml(html);
  // `json` embeds both renderings, so it needs them even when not requested alone.
  const needsText = wanted.has('txt') || wanted.has('json');
  const needsMarkdown = wanted.has('markdown') || wanted.has('json');

  const text = needsText ? toPlainText(body) : '';
  const markdown = needsMarkdown ? toMarkdown(body) : '';

  if (wanted.has('txt')) out.txt = text;
  if (wanted.has('markdown')) out.markdown = markdown;
  if (options.json !== undefined && wanted.has('json')) {
    out.json = toJson({ text, html, markdown, ...options.json });
  }
  return out;
}
