import { writeFileSync } from 'node:fs';
import { z } from 'zod';
import {
  canonicalizeJsonSchema,
  schemaId,
  TO_JSON_SCHEMA_INPUT,
} from '../canonical-json-schema.js';
import { ContextractorInput } from '../source-of-truth/input.js';

/**
 * The single definition site for the Contextractor CLI's flag surface — the
 * field↔flag↔kind↔subcommand mapping plus the help text. This is NOT a second
 * Zod schema: the running binary validates with the shared `ContextractorInput`
 * (Commander owns the flag grammar, Zod owns the contract). This module owns
 * only the metadata-about-the-flags:
 *
 * - `cliProgram.ts` looks up each option's help string here via
 *   `cliOptionDescription(id)` (so `--help` text has one source, not scattered
 *   literals);
 * - the README `cli-flags` region renders from Commander, which now carries
 *   these descriptions;
 * - `cli-surface.json` serializes this map for external consumers (e.g. the
 *   playground), and `cli-input.schema.json` is the config-file JSON Schema.
 *
 * Encodes the deliberate CLI renames (`respectRobotsTxtFile`→`--respect-robots-txt`,
 * `includeImages`→`--images`, `maxRequestRetries`→`--max-retries`,
 * `languageCode`→`--language`, `navigationTimeoutSecs`→`--navigation-timeout`,
 * …), the `--flag`/`--no-flag` boolean pairs, the repeatable flags, and the
 * CLI-only / orchestrator flags. When a CLI flag is added, renamed, or removed,
 * update THIS table (and its test) in the same change.
 */

type CliSubcommand = 'extract' | 'extract-one' | 'export' | 'purge';

type CliOptionKind =
  | 'scalar' // --flag <value>
  | 'switch' // --flag (bare boolean, no negation)
  | 'negation' // --no-flag (negates a default-true boolean)
  | 'boolean-on' // --flag, the positive half of a --flag/--no-flag pair
  | 'repeatable' // --flag <value>, repeatable
  | 'json'; // --flag <json>, value parsed as JSON

export interface CliSurfaceOption {
  /** Stable, unique id `cliProgram.ts` uses to look up the description. */
  id: string;
  /** The long flag, e.g. `--respect-robots-txt`. */
  flag: string;
  /** Short alias, e.g. `-c`, when one exists. */
  short?: string;
  /** The `ContextractorInput` field this maps to, or null for CLI-only flags. */
  field: string | null;
  kind: CliOptionKind;
  /** Help text — the single source for `--help` and the README flags table. */
  description: string;
  /** Subcommands this flag is registered on. */
  subcommands: CliSubcommand[];
}

const STORAGE_FLAG_HELP =
  'Storage directory holding the datasets/key_value_stores/request_queues ' +
  '(default: ./storage or the XDG data dir)';

const SINGLE_PAGE: CliSurfaceOption[] = [
  {
    id: 'headless',
    flag: '--headless',
    field: 'headless',
    kind: 'boolean-on',
    description: 'Run browser in headless mode',
    subcommands: ['extract', 'extract-one'],
  },
  {
    id: 'no-headless',
    flag: '--no-headless',
    field: 'headless',
    kind: 'negation',
    description: 'Run browser with UI',
    subcommands: ['extract', 'extract-one'],
  },
  {
    id: 'proxy',
    flag: '--proxy',
    field: null,
    kind: 'repeatable',
    description: 'Proxy URL (repeatable)',
    subcommands: ['extract', 'extract-one'],
  },
  {
    id: 'proxy-rotation',
    flag: '--proxy-rotation',
    field: 'proxyRotation',
    kind: 'scalar',
    description: 'Proxy rotation: recommended, per-request, until-failure',
    subcommands: ['extract', 'extract-one'],
  },
  {
    id: 'max-session-rotations',
    flag: '--max-session-rotations',
    field: 'maxSessionRotations',
    kind: 'scalar',
    description: 'Max session rotations per request on block detection',
    subcommands: ['extract', 'extract-one'],
  },
  {
    id: 'crawler-type',
    flag: '--crawler-type',
    field: 'crawlerType',
    kind: 'scalar',
    description: 'Crawler engine: adaptive, firefox, chromium, cheerio',
    subcommands: ['extract', 'extract-one'],
  },
  {
    id: 'rendering-type-detection',
    flag: '--rendering-type-detection',
    field: 'renderingTypeDetectionRatio',
    kind: 'scalar',
    description: 'Rendering type detection ratio 0–1 (adaptive only)',
    subcommands: ['extract', 'extract-one'],
  },
  {
    id: 'wait-until',
    flag: '--wait-until',
    field: 'waitUntil',
    kind: 'scalar',
    description: 'Page load event: load, domcontentloaded, networkidle, commit',
    subcommands: ['extract', 'extract-one'],
  },
  {
    id: 'navigation-timeout',
    flag: '--navigation-timeout',
    field: 'navigationTimeoutSecs',
    kind: 'scalar',
    description: 'Navigation timeout in seconds',
    subcommands: ['extract', 'extract-one'],
  },
  {
    id: 'block-media',
    flag: '--block-media',
    field: 'blockMedia',
    kind: 'boolean-on',
    description: 'Block images, stylesheets, fonts, PDFs, and ZIPs (default)',
    subcommands: ['extract', 'extract-one'],
  },
  {
    id: 'no-block-media',
    flag: '--no-block-media',
    field: 'blockMedia',
    kind: 'negation',
    description: 'Do not block media requests',
    subcommands: ['extract', 'extract-one'],
  },
  {
    id: 'ignore-cors-and-csp',
    flag: '--ignore-cors-and-csp',
    field: 'ignoreCorsAndCsp',
    kind: 'switch',
    description: 'Disable CORS/CSP restrictions',
    subcommands: ['extract', 'extract-one'],
  },
  {
    id: 'close-cookie-modals',
    flag: '--close-cookie-modals',
    field: 'closeCookieModals',
    kind: 'boolean-on',
    description: 'Auto-dismiss cookie banners',
    subcommands: ['extract', 'extract-one'],
  },
  {
    id: 'no-close-cookie-modals',
    flag: '--no-close-cookie-modals',
    field: 'closeCookieModals',
    kind: 'negation',
    description: 'Do not auto-dismiss cookie banners',
    subcommands: ['extract', 'extract-one'],
  },
  {
    id: 'max-scroll-height',
    flag: '--max-scroll-height',
    field: 'maxScrollHeight',
    kind: 'scalar',
    description: 'Max scroll height in pixels',
    subcommands: ['extract', 'extract-one'],
  },
  {
    id: 'ignore-https-errors',
    flag: '--ignore-https-errors',
    field: 'ignoreHttpsErrors',
    kind: 'switch',
    description: 'Skip HTTPS certificate verification',
    subcommands: ['extract', 'extract-one'],
  },
  {
    id: 'user-agent',
    flag: '--user-agent',
    field: 'userAgent',
    kind: 'scalar',
    description: 'Custom User-Agent string',
    subcommands: ['extract', 'extract-one'],
  },
  {
    id: 'respect-robots-txt',
    flag: '--respect-robots-txt',
    field: 'respectRobotsTxtFile',
    kind: 'switch',
    description: 'Honor robots.txt',
    subcommands: ['extract', 'extract-one'],
  },
  {
    id: 'cookies',
    flag: '--cookies',
    field: 'initialCookies',
    kind: 'json',
    description: 'JSON array of cookie objects',
    subcommands: ['extract', 'extract-one'],
  },
  {
    id: 'headers',
    flag: '--headers',
    field: 'customHttpHeaders',
    kind: 'json',
    description: 'JSON object of custom HTTP headers',
    subcommands: ['extract', 'extract-one'],
  },
  {
    id: 'max-retries',
    flag: '--max-retries',
    field: 'maxRequestRetries',
    kind: 'scalar',
    description: 'Max request retries',
    subcommands: ['extract', 'extract-one'],
  },
  {
    id: 'mode',
    flag: '--mode',
    field: 'mode',
    kind: 'scalar',
    description:
      'Extraction mode: precision (less noise), balanced (default), or recall (more content)',
    subcommands: ['extract', 'extract-one'],
  },
  {
    id: 'no-links',
    flag: '--no-links',
    field: 'includeLinks',
    kind: 'negation',
    description: 'Exclude links from output',
    subcommands: ['extract', 'extract-one'],
  },
  {
    id: 'no-comments',
    flag: '--no-comments',
    field: 'includeComments',
    kind: 'negation',
    description: 'Exclude comments from output',
    subcommands: ['extract', 'extract-one'],
  },
  {
    id: 'no-tables',
    flag: '--no-tables',
    field: 'includeTables',
    kind: 'negation',
    description: 'Exclude tables from output',
    subcommands: ['extract', 'extract-one'],
  },
  {
    id: 'images',
    flag: '--images',
    field: 'includeImages',
    kind: 'boolean-on',
    description: 'Include image alt text and captions',
    subcommands: ['extract', 'extract-one'],
  },
  {
    id: 'no-images',
    flag: '--no-images',
    field: 'includeImages',
    kind: 'negation',
    description: 'Exclude image alt text and captions (default)',
    subcommands: ['extract', 'extract-one'],
  },
  {
    id: 'language',
    flag: '--language',
    field: 'languageCode',
    kind: 'scalar',
    description: 'Filter by language (e.g. en)',
    subcommands: ['extract', 'extract-one'],
  },
  {
    id: 'verbose',
    flag: '--verbose',
    short: '-v',
    field: null,
    kind: 'switch',
    description: 'Enable verbose logging',
    subcommands: ['extract', 'extract-one'],
  },
  {
    id: 'wait-for-dynamic-content',
    flag: '--wait-for-dynamic-content',
    field: 'waitForDynamicContentSecs',
    kind: 'scalar',
    description:
      'Maximum seconds to wait for dynamic content after navigation; the crawler continues as soon as the network is idle or this timeout elapses, whichever comes first (0 = disabled)',
    subcommands: ['extract', 'extract-one'],
  },
  {
    id: 'wait-for-selector',
    flag: '--wait-for-selector',
    field: 'waitForSelector',
    kind: 'scalar',
    description: 'CSS selector to wait for before extracting (fails on timeout)',
    subcommands: ['extract', 'extract-one'],
  },
  {
    id: 'soft-wait-for-selector',
    flag: '--soft-wait-for-selector',
    field: 'softWaitForSelector',
    kind: 'scalar',
    description: 'CSS selector to wait for before extracting (continues on timeout)',
    subcommands: ['extract', 'extract-one'],
  },
];

const CRAWL: CliSurfaceOption[] = [
  {
    id: 'config-file',
    flag: '--config-file',
    short: '-c',
    field: null,
    kind: 'scalar',
    description: 'Path to JSON config file',
    subcommands: ['extract'],
  },
  {
    id: 'purge',
    flag: '--purge',
    field: null,
    kind: 'switch',
    description: 'Purge the storage at --storage before extracting (datasets, KVS, request queues)',
    subcommands: ['extract'],
  },
  {
    id: 'max-requests-per-crawl',
    flag: '--max-requests-per-crawl',
    field: 'maxRequestsPerCrawl',
    kind: 'scalar',
    description: 'Max requests to handle (0 = unlimited)',
    subcommands: ['extract'],
  },
  {
    id: 'max-crawl-depth',
    flag: '--max-crawl-depth',
    field: 'maxCrawlDepth',
    kind: 'scalar',
    description: 'Max link depth from start URLs (0 = unlimited)',
    subcommands: ['extract'],
  },
  {
    id: 'globs',
    flag: '--globs',
    field: 'globs',
    kind: 'repeatable',
    description: 'Glob pattern to include (repeatable)',
    subcommands: ['extract'],
  },
  {
    id: 'exclude',
    flag: '--exclude',
    field: 'exclude',
    kind: 'repeatable',
    description: 'Glob pattern to exclude (repeatable)',
    subcommands: ['extract'],
  },
  {
    id: 'selector',
    flag: '--selector',
    field: 'selector',
    kind: 'scalar',
    description: 'CSS selector for links to follow',
    subcommands: ['extract'],
  },
  {
    id: 'keep-url-fragment',
    flag: '--keep-url-fragment',
    field: 'keepUrlFragment',
    kind: 'switch',
    description: 'Preserve URL fragments',
    subcommands: ['extract'],
  },
  {
    id: 'use-sitemaps',
    flag: '--use-sitemaps',
    field: 'useSitemaps',
    kind: 'switch',
    description: 'Discover and enqueue URLs from sitemap.xml at each start URL domain root',
    subcommands: ['extract'],
  },
  {
    id: 'initial-concurrency',
    flag: '--initial-concurrency',
    field: 'initialConcurrency',
    kind: 'scalar',
    description: 'Initial parallel requests (0 = Crawlee default)',
    subcommands: ['extract'],
  },
  {
    id: 'max-concurrency',
    flag: '--max-concurrency',
    field: 'maxConcurrency',
    kind: 'scalar',
    description: 'Max parallel requests',
    subcommands: ['extract'],
  },
  {
    id: 'max-results',
    flag: '--max-results',
    field: 'maxResultsPerCrawl',
    kind: 'scalar',
    description: 'Max results per crawl (0 = unlimited)',
    subcommands: ['extract'],
  },
  {
    id: 'save',
    flag: '--save',
    field: 'save',
    kind: 'repeatable',
    description:
      'Format-destination token, e.g. markdown-kvs, original-dataset (repeatable). ' +
      'Format: txt|markdown|json|html|original; destination: dataset|kvs. ' +
      'List a format twice to save to both. Saving original/html to the dataset risks OOM on large pages.',
    subcommands: ['extract'],
  },
  {
    id: 'deduplication',
    flag: '--deduplication',
    field: 'deduplication',
    kind: 'scalar',
    description: 'Deduplication level: minimal, standard (default), or aggressive',
    subcommands: ['extract'],
  },
  {
    id: 'session-pool-name',
    flag: '--session-pool-name',
    field: 'sessionPoolName',
    kind: 'scalar',
    description: 'Named session pool for cross-run session sharing',
    subcommands: ['extract'],
  },
  {
    id: 'storage',
    flag: '--storage',
    field: null,
    kind: 'scalar',
    description: STORAGE_FLAG_HELP,
    subcommands: ['extract', 'export', 'purge'],
  },
  {
    id: 'store-skipped-urls',
    flag: '--store-skipped-urls',
    field: 'storeSkippedUrls',
    kind: 'switch',
    description: 'Push skipped URL records to the dataset after crawl',
    subcommands: ['extract'],
  },
];

const EXTRACT_ONLY: CliSurfaceOption[] = [
  {
    id: 'start-urls-file',
    flag: '--start-urls-file',
    field: null,
    kind: 'scalar',
    description: 'Read start URLs (one per line) from a file',
    subcommands: ['extract'],
  },
];

const EXTRACT_ONE_ONLY: CliSurfaceOption[] = [
  {
    id: 'save-one',
    flag: '--save',
    field: null,
    kind: 'repeatable',
    description:
      'Format-destination token, e.g. markdown-stdout, html-file (repeatable). ' +
      'Format: txt|markdown|json|html|original; destination: file|stdout. ' +
      'At most one format may target stdout.',
    subcommands: ['extract-one'],
  },
  {
    id: 'output',
    flag: '--output',
    short: '-o',
    field: null,
    kind: 'scalar',
    description:
      'File path for -file tokens: a literal path for one format, a base prefix for several, ' +
      'or a directory (trailing slash or an existing dir) for URL-slug names',
    subcommands: ['extract-one'],
  },
];

const ORCHESTRATOR: CliSurfaceOption[] = [
  {
    id: 'output-dir',
    flag: '--output-dir',
    field: null,
    kind: 'scalar',
    description: 'Output directory (default: ./contextractor-output)',
    subcommands: ['export'],
  },
];

/** The authoritative, ordered CLI option surface (registration order). */
export const cliSurface: readonly CliSurfaceOption[] = [
  ...EXTRACT_ONLY,
  ...SINGLE_PAGE,
  ...CRAWL,
  ...EXTRACT_ONE_ONLY,
  ...ORCHESTRATOR,
];

const DESCRIPTION_BY_ID = new Map(cliSurface.map((o) => [o.id, o.description]));

/** Look up an option's help text by its surface id. Throws on an unknown id. */
export function cliOptionDescription(id: string): string {
  const description = DESCRIPTION_BY_ID.get(id);
  if (description === undefined) {
    throw new Error(`cliOptionDescription: no CLI surface option with id "${id}"`);
  }
  return description;
}

/** The serializable field↔flag↔kind↔subcommand map written to `cli-surface.json`. */
export function toCliSurface(): Record<string, unknown> {
  return {
    title: 'Contextractor CLI surface',
    description:
      'Generated field-to-flag mapping for the contextractor CLI. Derived from the Zod source of truth; do not edit by hand.',
    options: cliSurface,
  };
}

export function writeCliSurface(outPath: string): void {
  writeFileSync(outPath, `${JSON.stringify(toCliSurface(), null, 2)}\n`, 'utf8');
}

export const CLI_INPUT_SCHEMA_ID = schemaId('cli-input.schema.json');

/**
 * The CLI config-file JSON Schema — the nested camelCase shape users author and
 * associate via `$schema`. A partial of `ContextractorInput` (every field
 * optional, since args/flags can supply any of them) minus the Apify-only named
 * buckets the CLI does not surface. A `$schema` key is tolerated (no
 * `additionalProperties: false`), matching `loadConfigFile`.
 */
export function toCliInputSchema(): Record<string, unknown> {
  const config = ContextractorInput.omit({
    datasetName: true,
    keyValueStoreName: true,
    requestQueueName: true,
  }).partial();
  const generated = z.toJSONSchema(config, TO_JSON_SCHEMA_INPUT) as Record<string, unknown>;
  return canonicalizeJsonSchema(generated, {
    id: CLI_INPUT_SCHEMA_ID,
    title: 'Contextractor CLI config',
  });
}

export function writeCliInputSchema(outPath: string): void {
  writeFileSync(outPath, `${JSON.stringify(toCliInputSchema(), null, 2)}\n`, 'utf8');
}
