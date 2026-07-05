import { toLibraryInputSchema, toSharedOutputSchema } from '@contextractor/schema';

/**
 * The schema surface of the `contextractor` npm package. The headline public
 * artifact is the Zod objects (`ContextractorInput`/`ContextractorOutput`) +
 * their inferred types, re-exported from the shared `@contextractor/schema`
 * package — the CLI and library validate with the SAME Zod object (no second
 * schema). The JSON Schema helpers below are derived projections of that one
 * source, computed on demand so they can never drift from the Zod object; the
 * committed `contextractor/schema/*.json` files (shipped via `package.json`
 * `exports`/`files`) are the same projections for `$schema`/SchemaStore and
 * non-TypeScript consumers.
 */

export {
  ContextractorInput,
  type ContextractorInputType,
  ContextractorOutput,
  type ContextractorOutputType,
  SAVE_ROUTE_TOKENS,
  type SaveRoute,
} from '@contextractor/schema';

/** The canonical library-input JSON Schema (draft-07), derived from the Zod SoT. */
export function getInputJsonSchema(): Record<string, unknown> {
  return toLibraryInputSchema();
}

/** The single shared output/dataset JSON Schema (draft-07, top-level `oneOf`). */
export function getOutputJsonSchema(): Record<string, unknown> {
  return toSharedOutputSchema();
}
