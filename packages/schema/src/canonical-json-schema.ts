/**
 * Shared helpers for the canonical (non-Apify) JSON Schema projections — the
 * library-input, shared-output, and CLI-config schemas. These emit vanilla
 * draft-07 JSON Schema with a stable `$schema`/`$id`/`title` and assert that no
 * Apify dialect key (which now lives only in `apifyRegistry`) ever leaks in.
 */

import type { ApifyMeta } from './apify/apify-meta.js';

const DRAFT_07 = 'http://json-schema.org/draft-07/schema#';

// Stable, resolvable `$id` base for `$schema`/SchemaStore association.
// Versioning is done by changing this URL, never the payload.
const SCHEMA_BASE =
  'https://raw.githubusercontent.com/contextractor/contextractor/main/packages/standalone/schema';

export const schemaId = (file: string): string => `${SCHEMA_BASE}/${file}`;

export const TO_JSON_SCHEMA_INPUT = {
  target: 'draft-07',
  io: 'input',
  unrepresentable: 'any',
  reused: 'inline',
} as const;

export const TO_JSON_SCHEMA_OUTPUT = {
  target: 'draft-07',
  io: 'output',
  unrepresentable: 'any',
  reused: 'inline',
} as const;

/**
 * Every Apify-only hint key, derived structurally from {@link ApifyMeta} so this
 * leak-guard cannot silently drift from the interface: a key added to `ApifyMeta`
 * but forgotten here would let an Apify-dialect key slip past
 * {@link assertNoApifyDialect}. The `Record<keyof ApifyMeta, true>` shape makes
 * the compiler reject any missing or extra key.
 */
const APIFY_META_KEYS: Record<keyof ApifyMeta, true> = {
  editor: true,
  prefill: true,
  sectionCaption: true,
  sectionDescription: true,
  groupCaption: true,
  groupDescription: true,
  enumTitles: true,
  enumSuggestedValues: true,
  isSecret: true,
  nullable: true,
  unit: true,
  dateType: true,
  resourceType: true,
  resourcePermissions: true,
  patternKey: true,
  patternValue: true,
  placeholderKey: true,
  placeholderValue: true,
  mcpServers: true,
};

/**
 * Apify dialect keys that must NEVER appear in a canonical library/CLI schema:
 * the {@link ApifyMeta} per-field hints plus the `schemaVersion` input ENVELOPE
 * key (not a per-field hint, so appended explicitly).
 */
export const APIFY_DIALECT_KEYS: ReadonlySet<string> = new Set([
  ...Object.keys(APIFY_META_KEYS),
  'schemaVersion',
]);

export interface CanonicalizeOptions {
  id: string;
  title: string;
}

/**
 * Stamp a stable `$schema`/`$id`/`title` (first, in that order) onto a generated
 * JSON Schema, drop defaulted fields from a top-level `required` (the zod #4134
 * `io:'input'` workaround), and assert no Apify dialect leaked in.
 */
export function canonicalizeJsonSchema(
  generated: Record<string, unknown>,
  { id, title }: CanonicalizeOptions,
): Record<string, unknown> {
  assertNoApifyDialect(generated);

  const props = generated.properties as Record<string, Record<string, unknown>> | undefined;
  let required = Array.isArray(generated.required) ? (generated.required as string[]) : undefined;
  // Workaround for https://github.com/colinhacks/zod/issues/4134 — `io:'input'`
  // still emits defaulted fields in `required`. Drop any whose property carries
  // a `default`.
  if (required && props) {
    required = required.filter((name) => !(props[name] && 'default' in props[name]));
  }

  const out: Record<string, unknown> = { $schema: DRAFT_07, $id: id, title };
  for (const [key, value] of Object.entries(generated)) {
    if (key === '$schema' || key === '$id' || key === 'title' || key === 'required') continue;
    out[key] = value;
  }
  if (required && required.length > 0) out.required = required;
  return out;
}

/** Recursively assert no Apify-dialect key appears anywhere in the schema tree. */
function assertNoApifyDialect(node: unknown): void {
  if (Array.isArray(node)) {
    for (const item of node) assertNoApifyDialect(item);
    return;
  }
  if (typeof node !== 'object' || node === null) return;
  for (const [key, value] of Object.entries(node)) {
    if (APIFY_DIALECT_KEYS.has(key)) {
      throw new Error(
        `Apify dialect key "${key}" leaked into a canonical JSON Schema. Apify-only UI hints must live in apifyRegistry, never inline in .meta().`,
      );
    }
    assertNoApifyDialect(value);
  }
}
