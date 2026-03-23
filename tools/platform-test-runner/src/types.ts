/**
 * Terminology based on ISTQB/ISO 29119
 * - TestSuite: Batch job with settings
 * - TestCase: Individual URL test
 * - TestResult: Single URL result
 * - SuiteConfig: Suite configuration
 */

/** URL entry in urls.json */
export interface TestCaseInput {
    slug: string;
    url: string;
}

/** Actor input settings from settings.json (Contextractor schema) */
export interface ActorSettings {
    // Crawl settings
    waitUntil?: 'NETWORKIDLE' | 'LOAD' | 'DOMCONTENTLOADED';
    maxRequestRetries?: number;
    pageLoadTimeoutSecs?: number;
    maxConcurrency?: number;
    headless?: boolean;
    launcher?: 'CHROMIUM' | 'FIREFOX';
    closeCookieModals?: boolean;
    maxScrollHeightPixels?: number;
    ignoreSslErrors?: boolean;
    downloadMedia?: boolean;
    downloadCss?: boolean;

    // Export options
    exportHtml?: boolean;
    exportText?: boolean;
    exportJson?: boolean;
    exportMarkdown?: boolean;
    exportXml?: boolean;
    exportXmlTei?: boolean;

    // Extraction options
    extractionMode?: 'FAVOR_PRECISION' | 'BALANCED' | 'FAVOR_RECALL';
    includeMetadata?: boolean;

    [key: string]: unknown;
}

/** Test suite loaded from disk */
export interface TestSuite {
    slug: string;
    description: string;
    settings: ActorSettings;
    testCases: TestCase[];
}

/** Individual test case */
export interface TestCase {
    slug: string;
    url: string;
    suiteSlug: string;
}

/** Result of running a single test case */
export interface TestResult {
    url: string;
    status: 'success' | 'error';
    errorMessage: string | null;
    datasetItemPath: string | null;
}

/** Content reference stored in KVS */
export interface ContentRef {
    key?: string;
    url?: string;
    hash: string;
    length: number;
}

/** Dataset item from Contextractor actor output */
export interface DatasetItem {
    loadedUrl: string;
    rawHtml?: ContentRef;
    loadedAt?: string;
    httpStatus?: number;
    metadata?: {
        title?: string | null;
        author?: string | null;
        publishedAt?: string | null;
        description?: string | null;
        siteName?: string | null;
        lang?: string | null;
    };
    extractedText?: ContentRef;
    extractedJson?: ContentRef;
    extractedMarkdown?: ContentRef;
    extractedXml?: ContentRef;
    extractedXmlTei?: ContentRef;
    '#error'?: boolean;
    '#errorMessage'?: string;
}

/** Suite run result */
export interface SuiteRunResult {
    suiteSlug: string;
    results: Map<string, TestResult>;
    runId: string;
    datasetId: string;
}

/** CLI options */
export interface CLIOptions {
    suite?: string;
    all?: boolean;
    dryRun?: boolean;
}

/** Report entry for markdown table */
export interface ReportEntry {
    suiteName: string;
    testCaseSlug: string;
    url: string;
    status: 'success' | 'error';
    errorMessage: string | null;
}
