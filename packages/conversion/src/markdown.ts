import { gfm } from '@joplin/turndown-plugin-gfm';
import TurndownService from 'turndown';
import type { DomElement } from './dom-node.js';

/**
 * ATX headings and fenced code blocks are the forms every Markdown renderer
 * handles; the rest are Turndown's own defaults (`_em_`, `**strong**`, inlined
 * links, three-space list-item indent).
 */
const TURNDOWN_OPTIONS = {
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
} as const;

let service: TurndownService | undefined;

/**
 * The Turndown service, created once and reused. `turndown()` clones its input
 * and keeps no state between calls, so one instance per process is safe.
 */
function turndownService(): TurndownService {
  if (service === undefined) {
    service = new TurndownService(TURNDOWN_OPTIONS);
    // GFM adds tables, strikethrough, task-list items, and highlighted code.
    service.use(gfm);
  }
  return service;
}

/**
 * Render an already-parsed cleaned-HTML body to Markdown.
 *
 * Turndown collapses the engine's prettier-formatted whitespace itself, so a
 * `<p>` broken across source lines still renders as a single paragraph.
 *
 * `@types/turndown` types the node parameter with `lib.dom` globals this package
 * deliberately does not load, so the structural {@link DomElement} is cast in at
 * this one boundary.
 */
export function toMarkdown(body: DomElement): string {
  return turndownService()
    .turndown(body as unknown as TurndownService.Node)
    .trim();
}
