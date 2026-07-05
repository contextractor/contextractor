import { writeFileSync } from 'node:fs';
import { z } from 'zod';
import { apifyRegistry } from '../apify/apify-registry.js';
import { TO_JSON_SCHEMA_OUTPUT } from '../canonical-json-schema.js';
import { ContextractorInput, SAVE_ROUTE_TOKENS } from '../source-of-truth/input.js';
import { ContextractorOutput } from '../source-of-truth/output.js';

/**
 * The presentation artifact — one entry per output FORMAT (not per save route) —
 * that gives an external form UI (the playground's "Output" checkboxes)
 * everything it needs to render a format and its `?` help in a SINGLE import: a
 * human label plus the prose description.
 *
 * Mirrors {@link ./to-field-presentation.ts to-field-presentation}: it is an
 * EXPLICIT presentation artifact (it MAY carry Apify-derived UI strings such as
 * the `enumTitles`-based label), NOT a canonical input/output schema, so it is
 * not subject to the no-Apify-dialect guard.
 *
 * Everything is derived — never hand-edit the generated JSON:
 * - `format`: the format key as it appears in `save` tokens (`txt`, `markdown`,
 *   `json`, `html`, `original`), in `SAVE_ROUTE_TOKENS` declaration order.
 * - `label`: the format part of the `save` field's Apify `enumTitles` (the text
 *   before the "→ destination", e.g. `Plain text` from `Plain text → Dataset`).
 * - `description`: the per-format `.describe(...)` text on the output
 *   source-of-truth's `success` record (`txt`/`markdown`/`json`/`html`/`original`).
 *
 * Change the Zod SoT (or `apifyRegistry`) and regenerate; the snapshot test
 * keeps the on-disk JSON in lockstep.
 */
export interface FormatPresentation {
  /** The output format key as used in `save` tokens (the join key). */
  format: string;
  /** Form label, derived from the `save` `enumTitles` (e.g. "Plain text"). */
  label: string;
  /** Prose help, from the output record field's `.describe(...)`. */
  description: string;
}

export interface FormatPresentationDocument {
  title: string;
  description: string;
  formats: FormatPresentation[];
}

/** A `save` token without its `-dataset`/`-kvs` destination suffix. */
function formatOf(token: string): string {
  return token.replace(/-(?:dataset|kvs)$/, '');
}

/** The output formats in `SAVE_ROUTE_TOKENS` declaration order, de-duplicated. */
function orderedFormats(): string[] {
  const seen = new Set<string>();
  const formats: string[] = [];
  for (const token of SAVE_ROUTE_TOKENS) {
    const format = formatOf(token);
    if (!seen.has(format)) {
      seen.add(format);
      formats.push(format);
    }
  }
  return formats;
}

/**
 * Map each format to its label, from the first `save` `enumTitle` whose token
 * matches that format — the text before the "→ destination" arrow.
 */
function formatLabels(): Map<string, string> {
  const enumTitles = apifyRegistry.get(ContextractorInput.shape.save)?.enumTitles ?? [];
  const labels = new Map<string, string>();
  SAVE_ROUTE_TOKENS.forEach((token, index) => {
    const format = formatOf(token);
    if (labels.has(format)) return;
    const title = enumTitles[index];
    if (typeof title === 'string') {
      labels.set(format, (title.split('→')[0] ?? format).trim());
    }
  });
  return labels;
}

interface OutputVariant {
  properties?: Record<string, { const?: unknown; enum?: unknown[]; description?: string }>;
}

/** The discriminated-union variant whose `status` literal is `success`. */
function isSuccessVariant(variant: OutputVariant): boolean {
  const status = variant.properties?.status;
  if (!status) return false;
  if (status.const === 'success') return true;
  return Array.isArray(status.enum) && status.enum.length === 1 && status.enum[0] === 'success';
}

/**
 * Map each output format field to its `.describe(...)` text, read off the
 * `success` variant of the output JSON Schema (derived from the Zod SoT exactly
 * like to-field-presentation derives its field metadata).
 */
function formatDescriptions(): Map<string, string> {
  const schema = z.toJSONSchema(ContextractorOutput, TO_JSON_SCHEMA_OUTPUT) as {
    anyOf?: OutputVariant[];
    oneOf?: OutputVariant[];
  };
  const variants = schema.anyOf ?? schema.oneOf ?? [];
  const success = variants.find(isSuccessVariant);
  const properties = success?.properties ?? {};
  const descriptions = new Map<string, string>();
  for (const [field, prop] of Object.entries(properties)) {
    if (typeof prop.description === 'string') descriptions.set(field, prop.description);
  }
  return descriptions;
}

/** Build the format-presentation document for the output formats. */
export function toFormatPresentation(): FormatPresentationDocument {
  const labels = formatLabels();
  const descriptions = formatDescriptions();
  const formats: FormatPresentation[] = orderedFormats().map((format) => ({
    format,
    label: labels.get(format) ?? format,
    description: descriptions.get(format) ?? '',
  }));

  return {
    title: 'Contextractor format presentation',
    description:
      'Generated per-output-format presentation metadata (label + description) for the contextractor extraction formats. Derived from the Zod source of truth — the save-route enumTitles and the output record descriptions; do not edit by hand.',
    formats,
  };
}

export function writeFormatPresentation(outPath: string): void {
  writeFileSync(outPath, `${JSON.stringify(toFormatPresentation(), null, 2)}\n`, 'utf8');
}
