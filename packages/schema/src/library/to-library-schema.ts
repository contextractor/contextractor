import { writeFileSync } from 'node:fs';
import { z } from 'zod';
import {
  canonicalizeJsonSchema,
  schemaId,
  TO_JSON_SCHEMA_INPUT,
  TO_JSON_SCHEMA_OUTPUT,
} from '../canonical-json-schema.js';
import { ContextractorInput } from '../source-of-truth/input.js';
import { ContextractorOutput } from '../source-of-truth/output.js';

/**
 * Canonical JSON Schema projections of the ONE Zod source-of-truth for the
 * npm library surface. Unlike `to-apify-schema.ts` these emit vanilla draft-07
 * JSON Schema — no Apify dialect. INPUT is per-surface (the library surface
 * differs from the Apify and CLI surfaces); OUTPUT is byte-identical across
 * surfaces, so there is exactly ONE shared output schema — never per-surface
 * copies.
 */

export const LIBRARY_INPUT_SCHEMA_ID = schemaId('library-input.schema.json');
export const SHARED_OUTPUT_SCHEMA_ID = schemaId('output.schema.json');

/**
 * The library's programmatic input surface as a Zod object — the single source
 * for the library-input JSON Schema. Equals `ContextractorInput` minus the
 * Apify-only start-URL / named-bucket fields, plus the three library-only knobs.
 * Mirrors `ContextractorOptions` in the `contextractor` package
 * (`packages/standalone/src/library.ts`): `startUrls` is passed to `run(urls)`,
 * so it is not part of the options object; `datasetName`/`keyValueStoreName`/
 * `requestQueueName` are an Apify Actor storage concept; `includeHtml`/
 * `storageDir`/`logLevel` are library-only and intentionally absent from the
 * shared `ContextractorInput` so they never leak into the Apify Actor input.
 *
 * The `extractOne` subset additionally drops the output-routing and
 * crawl-frontier axes (see `ExtractOneOptions`); it is documented, not a
 * separate schema.
 */
export const ContextractorLibraryInput = ContextractorInput.omit({
  startUrls: true,
  datasetName: true,
  keyValueStoreName: true,
  requestQueueName: true,
}).extend({
  includeHtml: z
    .boolean()
    .default(false)
    .describe('Include the raw page `html` on each returned record.')
    .meta({ title: 'Include HTML' }),
  storageDir: z
    .string()
    .optional()
    .describe(
      'When set, ALSO persist full records to disk (Crawlee dataset + key-value store) at this location, in addition to returning them in memory.',
    )
    .meta({ title: 'Storage directory' }),
  logLevel: z
    .enum(['off', 'error', 'warning', 'info', 'debug'])
    .default('warning')
    .describe("Crawlee log threshold for the run. Default 'warning' keeps stdout clean.")
    .meta({ title: 'Log level' }),
});

/** Build the canonical library-input JSON Schema (camelCase, library fields). */
export function toLibraryInputSchema(): Record<string, unknown> {
  const generated = z.toJSONSchema(ContextractorLibraryInput, TO_JSON_SCHEMA_INPUT) as Record<
    string,
    unknown
  >;
  return canonicalizeJsonSchema(generated, {
    id: LIBRARY_INPUT_SCHEMA_ID,
    title: 'Contextractor library input',
  });
}

/**
 * Build the SINGLE shared output/dataset JSON Schema (top-level `oneOf` over the
 * success/failed/skipped record shapes). Consumed by library and CLI alike.
 */
export function toSharedOutputSchema(
  schema: z.ZodType = ContextractorOutput,
): Record<string, unknown> {
  const generated = z.toJSONSchema(schema, TO_JSON_SCHEMA_OUTPUT) as Record<string, unknown>;
  return canonicalizeJsonSchema(generated, {
    id: SHARED_OUTPUT_SCHEMA_ID,
    title: 'Contextractor output record',
  });
}

export function writeLibraryInputSchema(outPath: string): void {
  writeFileSync(outPath, `${JSON.stringify(toLibraryInputSchema(), null, 2)}\n`, 'utf8');
}

export function writeSharedOutputSchema(outPath: string): void {
  writeFileSync(outPath, `${JSON.stringify(toSharedOutputSchema(), null, 2)}\n`, 'utf8');
}
