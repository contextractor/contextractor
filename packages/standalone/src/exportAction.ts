import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { type ContentKind, extForKind } from '@contextractor/crawler';
import { Dataset, KeyValueStore } from 'crawlee';
import { configureStorage, resolveStorageDir } from './storage/index.js';

export interface ExportOpts {
  outputDir?: string;
  storageDir?: string;
}

export interface ExportResult {
  outputDir: string;
  filesWritten: number;
  recordsTotal: number;
  manifestPath: string;
}

/**
 * Content kinds in the order they are written. The first kind to claim a given
 * base name keeps the clean `<slug>.<ext>` form, so the primary format
 * (`markdown`) wins over the raw `original` HTML when their extensions collide.
 */
const EXPORT_KINDS: readonly ContentKind[] = ['markdown', 'txt', 'json', 'html', 'original'];

/** A content node on a dataset record: inline `content` or a KVS `key` reference. */
interface ContentNodeLike {
  content?: string;
  key?: string;
}

function md5(value: string): string {
  return createHash('md5').update(value).digest('hex');
}

/** Slugify a string into a filesystem-safe base name (≈80 chars, no diacritics). */
function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');
}

/** Derive a filesystem-safe base name from the page URL (`host` + `pathname`). */
export function slugForUrl(url: string): string {
  try {
    const u = new URL(url);
    const slug = slugify(`${u.host}${u.pathname}`);
    if (slug) return slug;
  } catch {
    // fall through to the literal default
  }
  return 'page';
}

/** Derive a readable base name from the record title, then its URL, then `page`. */
function baseNameForRecord(record: Record<string, unknown>): string {
  const metadata = record.metadata;
  if (metadata && typeof metadata === 'object') {
    const title = (metadata as { title?: unknown }).title;
    if (typeof title === 'string') {
      const slug = slugify(title);
      if (slug) return slug;
    }
  }
  if (typeof record.url === 'string') return slugForUrl(record.url);
  return 'page';
}

/**
 * Resolve a non-colliding file name. The clean `<base>.<ext>` is tried first,
 * then a kind tag (`<base>.<kind>.<ext>` — resolves the html/original clash),
 * then a URL hash suffix, then numeric `-2`/`-3` fallbacks.
 */
function resolveFileName(
  base: string,
  kind: ContentKind,
  ext: string,
  url: string,
  used: Set<string>,
): string {
  const hash = md5(url).slice(0, 8);
  const candidates = [
    `${base}.${ext}`,
    `${base}.${kind}.${ext}`,
    `${base}-${hash}.${ext}`,
    `${base}.${kind}-${hash}.${ext}`,
  ];
  for (const candidate of candidates) {
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
  }
  for (let index = 2; ; index++) {
    const candidate = `${base}-${index}.${ext}`;
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
  }
}

/**
 * Export stored extraction content to a user-facing output directory.
 *
 * With the default `save: ['markdown-kvs']`, content lives as KVS blobs and the
 * dataset is the index; this reads `.content` inline nodes directly and fetches
 * `.key` blobs from the KVS. Only `success` records produce files; every record
 * (incl. failed/skipped) is written to `manifest.json`.
 *
 * Library-callable: never calls `process.exit` — the thin CLI wrapper owns
 * exit codes and the human-readable summary.
 */
export async function runExportAction(opts: ExportOpts): Promise<ExportResult> {
  const storageDir = resolveStorageDir(opts.storageDir);
  configureStorage(storageDir);

  const outputDir = path.resolve(opts.outputDir ?? './contextractor-output');
  await mkdir(outputDir, { recursive: true });

  // One `--storage` path fully identifies a run's storage — always the
  // `default` buckets (named buckets are an Apify Actor concept).
  const ds = await Dataset.open('default');
  const kvs = await KeyValueStore.open('default');
  const localKvsDir = path.join(storageDir, 'key_value_stores', 'default');

  /**
   * Read a KVS blob. Prefers Crawlee's `getValue` (works on the Apify platform
   * and for txt/json/html). Crawlee's local memory-storage cannot round-trip a
   * key whose extension differs from the content-type's canonical extension
   * (markdown's `.md` vs `text/markdown` → `.markdown`), so on a null result it
   * falls back to reading the blob file directly by key from local storage.
   */
  const readBlob = async (key: string): Promise<string | Buffer | object | null> => {
    const value = (await kvs.getValue(key)) as unknown;
    if (value !== null && value !== undefined) {
      return value as string | Buffer | object;
    }
    try {
      return await readFile(path.join(localKvsDir, key));
    } catch {
      return null;
    }
  };

  const manifest: Record<string, unknown>[] = [];
  const usedNames = new Set<string>();
  let filesWritten = 0;

  await ds.forEach(async (item) => {
    const record = item as Record<string, unknown>;
    manifest.push(record);

    if (record.status !== 'success') return;
    const url = typeof record.url === 'string' ? record.url : '';
    const base = baseNameForRecord(record);

    for (const kind of EXPORT_KINDS) {
      const node = record[kind];
      if (!node || typeof node !== 'object') continue;
      const { content, key } = node as ContentNodeLike;

      let payload: string | Buffer | undefined;
      if (typeof content === 'string') {
        payload = content;
      } else if (typeof key === 'string') {
        const value = await readBlob(key);
        if (value === null) {
          process.stderr.write(`Warning: KVS blob "${key}" missing — skipped.\n`);
          continue;
        }
        if (Buffer.isBuffer(value)) {
          payload = value;
        } else if (typeof value === 'string') {
          payload = value;
        } else {
          // JSON blobs come back parsed — re-serialize.
          payload = JSON.stringify(value, null, 2);
        }
      } else {
        // No inline content and no key (e.g. an unsaved `original` node) — skip.
        continue;
      }

      const fileName = resolveFileName(base, kind, extForKind(kind), url, usedNames);
      await writeFile(path.join(outputDir, fileName), payload);
      filesWritten++;
    }
  });

  const manifestPath = path.join(outputDir, 'manifest.json');
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  return { outputDir, filesWritten, recordsTotal: manifest.length, manifestPath };
}
