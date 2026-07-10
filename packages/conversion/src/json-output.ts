import type { ExtractionDocument } from './extraction-document.js';

/**
 * Serialize the `json` output format.
 *
 * No library and no schema file: {@link ExtractionDocument} *is* the schema.
 * Nothing downstream parses this blob — the Actor dataset types it as an opaque
 * string — so its only contract is the TypeScript type.
 */
export function toJson<M>(document: ExtractionDocument<M>): string {
  return JSON.stringify(document);
}
