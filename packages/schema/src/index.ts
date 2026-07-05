import type { z } from 'zod';
import { ContextractorOutput } from './source-of-truth/output.js';

export type { ApifyMeta } from './apify/apify-meta.js';
export { apifyRegistry } from './apify/apify-registry.js';
export { KvsCollections, OutputViews } from './apify/output-views.js';
export {
  type ApifyInputSchemaJSON,
  type ToApifyInputSchemaOptions,
  toApifyInputSchema,
  writeApifyInputSchema,
} from './apify/to-apify-schema.js';
export { toDatasetSchema, writeDatasetSchema } from './apify/to-dataset-schema.js';
export { toKeyValueStoreSchema, writeKeyValueStoreSchema } from './apify/to-kvs-schema.js';
export { toOutputSchema, writeOutputSchema } from './apify/to-output-schema.js';
export {
  CLI_INPUT_SCHEMA_ID,
  type CliSurfaceOption,
  cliOptionDescription,
  cliSurface,
  toCliInputSchema,
  toCliSurface,
  writeCliInputSchema,
  writeCliSurface,
} from './cli/cli-surface.js';
export {
  ContextractorLibraryInput,
  LIBRARY_INPUT_SCHEMA_ID,
  SHARED_OUTPUT_SCHEMA_ID,
  toLibraryInputSchema,
  toSharedOutputSchema,
  writeLibraryInputSchema,
  writeSharedOutputSchema,
} from './library/to-library-schema.js';
export {
  type FieldPresentation,
  type FieldPresentationDocument,
  toFieldPresentation,
  writeFieldPresentation,
} from './presentation/to-field-presentation.js';
export {
  type FormatPresentation,
  type FormatPresentationDocument,
  toFormatPresentation,
  writeFormatPresentation,
} from './presentation/to-format-presentation.js';
export {
  ContextractorInput,
  type ContextractorInputType,
  SAVE_ROUTE_TOKENS,
  type SaveRoute,
} from './source-of-truth/input.js';
export { ContextractorOutput };
export type ContextractorOutputType = z.infer<typeof ContextractorOutput>;
