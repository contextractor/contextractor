import type { DatasetMetadata, OutputFormat } from '@contextractor/extraction';

export type Sink<T> = (result: T) => Promise<void>;

export interface ExtractionResult {
  url: string;
  loadedUrl: string;
  html: string;
  metadata: DatasetMetadata;
  formats: Partial<Record<OutputFormat, string>>;
  rawHtmlHash: string;
  rawHtmlLength: number;
  crawlDepth: number;
  referrerUrl: string | null;
}
