import { createExtractor, extractOne } from 'contextractor';

// extractOne(url, options) crawls exactly one URL (no link-following) and
// returns the content directly — nothing is persisted. `formats` defaults to
// ['markdown'], so this resolves to { markdown: '…' }.
const single = await extractOne('https://example.com', { crawlerType: 'cheerio' });
console.log('extractOne default markdown length:', single.markdown?.length);

// Request several formats at once: the returned map is keyed by the requested
// formats. 'original' carries the raw page HTML (extractOne has no includeHtml).
const multi = await extractOne('https://example.com', {
  crawlerType: 'cheerio',
  formats: ['markdown', 'original'],
});
console.log('extractOne multi-format keys:', Object.keys(multi));
console.log('original HTML length:', multi.original?.length);

// Construct an extractor from a camelCase options object (field names match the
// input schema), then run(urls) and consume the in-memory result handle.
const extractor = createExtractor({
  crawlerType: 'cheerio', // browserless — runs without a Playwright install
  // `save` is a SaveRoute[] of `format-destination` tokens: markdown to BOTH the
  // dataset and the key-value store, and the raw HTML to the KVS only. The set of
  // extracted formats is derived from the tokens (here: markdown).
  save: ['markdown-dataset', 'markdown-kvs', 'original-kvs'],
  includeHtml: false, // default: raw HTML is excluded from returned records
  deduplication: 'minimal',
  maxResultsPerCrawl: 10, // bounds the in-memory result set
});

const { dataset, statistics } = await extractor.run(['https://example.com']);

// statistics is a subset of Crawlee's FinalStatistics; failures surface here,
// never as a throw or process.exit.
console.log(
  `finished=${statistics.requestsFinished} failed=${statistics.requestsFailed} total=${statistics.requestsTotal}`,
);
console.log(`Extracted ${dataset.count} item(s)`);

// Stream records without loading everything at once.
await dataset.forEach((item, i) => {
  console.log(i, 'url:', item.url, 'depth:', item.crawlDepth, 'referrer:', item.referrerUrl);
});

// Or grab the whole array (raw HTML excluded by default — only metadata + formats).
const records = dataset.export();
const first = records[0];
if (first) {
  console.log('first record formats:', Object.keys(first.formats));
  console.log('html included?', first.html !== undefined);
}

// Optionally persist to the default Crawlee key-value store. extractOne runs
// under its own isolated, non-persisting Configuration, so mixing it with
// createExtractor in one process leaves this default store untouched.
await dataset.exportToJSON('results.json');
await dataset.exportToCSV('results.csv');
console.log('Wrote results.json and results.csv to the default key-value store.');
