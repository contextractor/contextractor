import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { extForKind, SAVE_FORMATS, type SaveFormat } from '@contextractor/crawler';
import { slugForUrl } from './exportAction.js';

/** A single `extract-one` save token binding one format to file or stdout. */
export type ExtractOneRoute = `${SaveFormat}-${'file' | 'stdout'}`;

/**
 * The `--save` vocabulary for `extract-one`: the canonical `SAVE_FORMATS`
 * crossed with the CLI-local `file`/`stdout` destinations. Derived so a new
 * format flows into `extract-one` automatically. This union never enters the
 * shared schema or the Apify Actor — the storage destinations live in the
 * schema's `SAVE_ROUTE_TOKENS`.
 */
export const EXTRACT_ONE_TOKENS: readonly ExtractOneRoute[] = SAVE_FORMATS.flatMap(
  (format) => [`${format}-file`, `${format}-stdout`] as const,
);

/** The route used when `extract-one` is invoked without `--save`. */
export const DEFAULT_EXTRACT_ONE_SAVE: ExtractOneRoute = 'markdown-stdout';

/** The routing plan derived from validated `extract-one` save tokens. */
export interface ExtractOnePlan {
  /** Unique formats across all tokens, in first-seen order. */
  formats: SaveFormat[];
  /** Formats routed to `-file` tokens, in first-seen order. */
  fileFormats: SaveFormat[];
  /** The single format routed to stdout, if any. */
  stdoutFormat?: SaveFormat;
}

/**
 * Split validated `extract-one` tokens into a routing plan. Throws when more
 * than one `-stdout` token is present — the single stdout stream carries one
 * format only (raw content, never a JSON wrapper); route the rest to `-file`.
 */
export function planExtractOneRoutes(tokens: readonly ExtractOneRoute[]): ExtractOnePlan {
  const formats: SaveFormat[] = [];
  const fileFormats: SaveFormat[] = [];
  const stdoutFormats: SaveFormat[] = [];
  for (const token of tokens) {
    const idx = token.lastIndexOf('-');
    const format = token.slice(0, idx) as SaveFormat;
    const destination = token.slice(idx + 1);
    if (!formats.includes(format)) formats.push(format);
    if (destination === 'file') {
      if (!fileFormats.includes(format)) fileFormats.push(format);
    } else if (!stdoutFormats.includes(format)) {
      stdoutFormats.push(format);
    }
  }
  if (stdoutFormats.length > 1) {
    throw new Error(
      `--save routes ${stdoutFormats.length} formats to stdout ` +
        `(${stdoutFormats.map((f) => `${f}-stdout`).join(', ')}); stdout carries one ` +
        'format only — route the others to -file tokens.',
    );
  }
  return { formats, fileFormats, stdoutFormat: stdoutFormats[0] };
}

/**
 * Extensions recognized as a strippable suffix on a multi-format `--output`,
 * derived from the per-format `extForKind` mapping.
 */
const STRIP_EXTS = new Set<string>(SAVE_FORMATS.map((format) => `.${extForKind(format)}`));

/**
 * Per-format file suffix. `extForKind` maps both `html` and `original` to
 * `.html`, so an `original` that would collide with a written `html` file is
 * tagged `.original.html` (the export collision tag) so they never overwrite.
 */
function suffixFor(format: SaveFormat, fileFormats: readonly SaveFormat[]): string {
  const ext = extForKind(format);
  if (format === 'original' && fileFormats.includes('html')) return `.original.${ext}`;
  return `.${ext}`;
}

/** One resolved file write: which format goes to which path. */
export interface FileTarget {
  format: SaveFormat;
  filePath: string;
}

/**
 * Resolve the file path for each `-file` format from the `--output` value:
 *
 * - exactly one `-file` format → `--output` is a literal path; the format's
 *   extension is appended only when the value has none;
 * - two or more `-file` formats → `--output` is a base prefix; a trailing
 *   recognized extension (`.md`/`.html`/`.json`/`.txt`) is stripped and each
 *   format appends its own extension;
 * - a directory value (trailing slash or an existing dir) → URL-slug file
 *   names inside it;
 * - absent → URL-slug file names in the cwd.
 */
export function resolveFileTargets(
  url: string,
  fileFormats: readonly SaveFormat[],
  output: string | undefined,
): FileTarget[] {
  if (fileFormats.length === 0) return [];

  const isDir =
    output !== undefined &&
    (output.endsWith('/') ||
      output.endsWith(path.sep) ||
      (existsSync(output) && statSync(output).isDirectory()));

  if (output === undefined || isDir) {
    const dir = output ?? '.';
    const base = slugForUrl(url);
    return fileFormats.map((format) => ({
      format,
      filePath: path.join(dir, `${base}${suffixFor(format, fileFormats)}`),
    }));
  }

  if (fileFormats.length === 1) {
    const format = fileFormats[0] as SaveFormat;
    const filePath = path.extname(output) === '' ? `${output}.${extForKind(format)}` : output;
    return [{ format, filePath }];
  }

  const ext = path.extname(output);
  const base = STRIP_EXTS.has(ext.toLowerCase())
    ? output.slice(0, output.length - ext.length)
    : output;
  return fileFormats.map((format) => ({
    format,
    filePath: `${base}${suffixFor(format, fileFormats)}`,
  }));
}
