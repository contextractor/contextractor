/**
 * `@contextractor/conversion` — cleaned HTML in, output formats out.
 *
 * The extraction engine (`trafilaturacore`) returns exactly one artifact: a
 * cleaned-HTML string. This package turns that string into Contextractor's
 * remaining formats, parsing it **once** and reusing the node:
 *
 * - `markdown` — Turndown + the GFM plugin (tables, strikethrough, task lists)
 * - `txt` — a whitespace-collapsing DOM walk (no library)
 * - `json` — `JSON.stringify` over {@link ExtractionDocument} (no library)
 * - `html` — a passthrough of the cleaned HTML
 *
 * XML and XML-TEI are deliberately absent: Contextractor exposes neither.
 *
 * It is also the repo's single owner of `@mixmark-io/domino` and of the
 * structural DOM types above it, which `@contextractor/extraction` reuses for
 * its declared-language filter.
 */

export { type ConversionFormat, isConversionFormat } from './conversion-format.js';
export { type ConvertOptions, convert, type JsonContext } from './convert.js';
export {
  type DomDocument,
  type DomElement,
  type DomNode,
  type DomNodeList,
  elementsOf,
} from './dom-node.js';
export type { ExtractionDocument, Message, MessageType } from './extraction-document.js';
export { toJson } from './json-output.js';
export { toMarkdown } from './markdown.js';
export { parseCleanedHtml, parseDocument } from './parse.js';
export { toPlainText } from './plain-text.js';
