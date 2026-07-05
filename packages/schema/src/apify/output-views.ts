/**
 * Apify presentation config for the dataset / output / key-value-store
 * schemas. These are UI and storage-grouping concerns NOT derivable from the
 * Zod data schema (column choice, display formats, output link templates, KVS
 * collection grouping). The schema generators consume this alongside
 * `ContextractorOutput`.
 */

export const OutputViews = {
  title: 'Output schema',
  views: {
    overview: {
      title: 'Overview',
      transformation: {
        fields: [
          'crawl.loadedUrl',
          'crawl.httpStatusCode',
          'metadata.title',
          'metadata.languageCode',
        ],
      },
      display: {
        component: 'table',
        properties: {
          'crawl.loadedUrl': { label: 'URL', format: 'link' },
          'crawl.httpStatusCode': { label: 'Status', format: 'number' },
          'metadata.title': { label: 'Title', format: 'text' },
          'metadata.languageCode': { label: 'Language', format: 'text' },
        },
      },
    },
  },
  output: {
    overview: {
      type: 'string',
      title: 'Overview',
      template: '{{links.apiDefaultDatasetUrl}}/items?view=overview',
    },
  },
} as const;

/**
 * Key-value-store collection grouping. Each content format is written under a
 * deterministic `{format}-{md5(url)}.{ext}` key (see the crawler sink core), so
 * the collections group cleanly by `keyPrefix`. These prefixes MUST stay in
 * sync with `kvsKey` in `@contextractor/crawler`; a test asserts they match.
 */
export const KvsCollections = {
  title: 'Stored content',
  collections: {
    txt: { title: 'Plain text', keyPrefix: 'txt-' },
    markdown: { title: 'Markdown', keyPrefix: 'markdown-' },
    json: { title: 'JSON', keyPrefix: 'json-' },
    html: { title: 'Extracted HTML', keyPrefix: 'html-' },
    original: { title: 'Original HTML', keyPrefix: 'original-' },
  },
} as const;
