import { writeFileSync } from 'node:fs';
import { z } from 'zod';
import { OutputViews } from './output-views.js';

type JsonNode = Record<string, unknown>;
type Field = Record<string, unknown>;

/**
 * Transform the `ContextractorOutput` Zod discriminated union into an Apify
 * dataset schema. Merges the `oneOf` branches into one flat `fields` map,
 * recurses into nested object `properties` (`metadata`, `crawl`, and the
 * `ContentNode` content fields), and collapses nullable `anyOf:[X,null]` to X.
 * Mirrors the `to-apify-schema.ts` boundary used for the input schema.
 */
export function toDatasetSchema(
  schema: z.ZodType,
  views = OutputViews,
): { actorSpecification: number; fields: Record<string, Field>; views: Record<string, unknown> } {
  const jsonSchema = z.toJSONSchema(schema, {
    target: 'draft-07',
    unrepresentable: 'any',
    reused: 'inline',
  }) as JsonNode;

  const merged = mergeBranchProperties(jsonSchema);
  const fields: Record<string, Field> = {};
  for (const [name, node] of Object.entries(merged)) {
    const field = toDatasetField(node);
    if (field) fields[name] = field;
  }

  return { actorSpecification: 1, fields, views: views.views };
}

export function writeDatasetSchema(schema: z.ZodType, outPath: string): void {
  writeFileSync(outPath, `${JSON.stringify(toDatasetSchema(schema), null, 2)}\n`, 'utf8');
}

/** Merge every discriminated-union branch's properties into one flat map. */
function mergeBranchProperties(jsonSchema: JsonNode): Record<string, JsonNode> {
  const branches = Array.isArray(jsonSchema.oneOf)
    ? (jsonSchema.oneOf as JsonNode[])
    : [jsonSchema];
  const out: Record<string, JsonNode> = {};
  for (const branch of branches) {
    const props = (branch.properties as Record<string, JsonNode>) ?? {};
    for (const [name, node] of Object.entries(props)) {
      const existing = out[name];
      out[name] = existing ? mergeNode(existing, node) : node;
    }
  }
  return out;
}

/**
 * Merge a field that appears in multiple branches. The only real cross-branch
 * conflict in this schema is the `status` discriminator: each branch emits a
 * distinct `const`, which we accumulate into a single `enum`. Accumulating
 * (rather than pairwise-collapsing) is required so all three `status` values
 * survive a 3-branch merge.
 *
 * Any other field shared across branches (e.g. `loadedUrl`, which is plain
 * `string` in `success` but nullable in `failed`) keeps the first branch's
 * node. That is safe because `toDatasetField` normalizes leaf types downstream
 * — a nullable `anyOf:[X,null]` collapses to `X` regardless of which branch
 * wins, so the emitted dataset field type is identical either way.
 */
function mergeNode(a: JsonNode, b: JsonNode): JsonNode {
  const av = Array.isArray(a.enum) ? a.enum : a.const !== undefined ? [a.const] : null;
  const bv = Array.isArray(b.enum) ? b.enum : b.const !== undefined ? [b.const] : null;
  if (av && bv) {
    return {
      type: 'string',
      enum: [...new Set([...av, ...bv])],
      description: a.description ?? b.description,
    };
  }
  return a;
}

/**
 * Convert one JSON-Schema node into an Apify dataset field descriptor.
 * Recurses into object `properties` (e.g. `metadata`, `crawl`, and the
 * `ContentNode` content fields) and collapses nullable `anyOf:[X,null]` to X.
 * Leaf types: string, integer, number, boolean, array, object, null.
 */
function toDatasetField(raw: unknown): Field | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const prop = raw as JsonNode;
  const description = typeof prop.description === 'string' ? prop.description : undefined;

  if (Array.isArray(prop.anyOf)) {
    const branches = prop.anyOf as JsonNode[];
    const objectBranch = branches.find((b) => b.type === 'object' && b.properties);
    const chosen = objectBranch ?? branches.find((b) => b.type && b.type !== 'null');
    const field = toDatasetField({ ...chosen }) ?? { type: 'object' };
    delete (field as JsonNode).description;
    if (description) field.description = description;
    return field;
  }

  const field: Field = {};
  const t = prop.type;
  if (t === 'string') field.type = 'string';
  else if (t === 'integer') field.type = 'integer';
  else if (t === 'number') field.type = 'number';
  else if (t === 'boolean') field.type = 'boolean';
  else if (t === 'array') field.type = 'array';
  else if (t === 'null') field.type = 'null';
  else field.type = 'object';

  if (field.type === 'object' && prop.properties && typeof prop.properties === 'object') {
    const nested: Record<string, Field> = {};
    for (const [k, v] of Object.entries(prop.properties as Record<string, unknown>)) {
      const sub = toDatasetField(v);
      if (sub) nested[k] = sub;
    }
    if (Object.keys(nested).length > 0) field.properties = nested;
  }

  if (Array.isArray(prop.enum)) field.enum = prop.enum;
  if (prop.title) field.title = prop.title;
  if (description) field.description = description;
  return field;
}
