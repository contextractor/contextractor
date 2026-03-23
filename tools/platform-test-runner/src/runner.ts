import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type {
    TestSuite,
    TestCase,
    TestCaseInput,
    TestResult,
    SuiteRunResult,
    ActorSettings,
    DatasetItem,
} from './types.js';
import { runActor, fetchDatasetItems } from './apify-client.js';

const TEST_SUITES_DIR = path.join(import.meta.dirname, '..', 'test-suites');
const OUTPUT_DIR = path.join(import.meta.dirname, '..', 'test-suites-output');

/**
 * Load a test suite from disk
 */
export async function loadTestSuite(suiteSlug: string): Promise<TestSuite> {
    const suiteDir = path.join(TEST_SUITES_DIR, suiteSlug);

    const descriptionPath = path.join(suiteDir, 'description.md');
    const settingsPath = path.join(suiteDir, 'settings.json');
    const urlsPath = path.join(suiteDir, 'urls.json');

    const [description, settingsContent, urlsContent] = await Promise.all([
        fs.readFile(descriptionPath, 'utf-8'),
        fs.readFile(settingsPath, 'utf-8'),
        fs.readFile(urlsPath, 'utf-8'),
    ]);

    const settings: ActorSettings = JSON.parse(settingsContent);
    const urlInputs: TestCaseInput[] = JSON.parse(urlsContent);

    const testCases: TestCase[] = urlInputs.map((input) => ({
        slug: input.slug,
        url: input.url,
        suiteSlug,
    }));

    return {
        slug: suiteSlug,
        description: description.trim(),
        settings,
        testCases,
    };
}

/**
 * List all available test suite slugs
 */
export async function listTestSuites(): Promise<string[]> {
    const entries = await fs.readdir(TEST_SUITES_DIR, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

/**
 * Purge and recreate the output directory
 */
async function prepareOutputDir(): Promise<void> {
    try {
        await fs.rm(OUTPUT_DIR, { recursive: true, force: true });
    } catch {
        // Directory may not exist
    }
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
}

/**
 * Save a dataset item and result for a test case
 */
async function saveTestCaseOutput(
    suiteSlug: string,
    testCaseSlug: string,
    result: TestResult,
    datasetItem: DatasetItem | null
): Promise<void> {
    const caseDir = path.join(OUTPUT_DIR, suiteSlug, testCaseSlug);
    await fs.mkdir(caseDir, { recursive: true });

    await fs.writeFile(
        path.join(caseDir, 'result.json'),
        JSON.stringify(result, null, 2)
    );

    if (datasetItem) {
        await fs.writeFile(
            path.join(caseDir, 'dataset-item.json'),
            JSON.stringify(datasetItem, null, 2)
        );
    }
}

/**
 * Match dataset items to test cases by URL
 */
function matchDatasetItemToUrl(
    items: DatasetItem[],
    url: string
): DatasetItem | null {
    return (
        items.find(
            (item) =>
                item.loadedUrl === url ||
                item.loadedUrl?.replace(/\/$/, '') === url.replace(/\/$/, '')
        ) || null
    );
}

/**
 * Run a test suite and save results
 */
export async function runSuite(suite: TestSuite): Promise<SuiteRunResult> {
    console.log(`\nRunning test suite: ${suite.slug}`);
    console.log(`  Test cases: ${suite.testCases.length}`);

    const urls = suite.testCases.map((tc) => tc.url);

    const { runId, datasetId, status } = await runActor(urls, suite.settings);

    if (status !== 'SUCCEEDED') {
        console.warn(`  Warning: Actor run status is ${status}`);
    }

    const datasetItems = await fetchDatasetItems(datasetId);
    console.log(`  Retrieved ${datasetItems.length} dataset items`);

    const results = new Map<string, TestResult>();

    for (const testCase of suite.testCases) {
        const datasetItem = matchDatasetItemToUrl(datasetItems, testCase.url);

        let result: TestResult;

        if (!datasetItem) {
            result = {
                url: testCase.url,
                status: 'error',
                errorMessage: 'No dataset item found for URL',
                datasetItemPath: null,
            };
        } else if (datasetItem['#error']) {
            result = {
                url: testCase.url,
                status: 'error',
                errorMessage: datasetItem['#errorMessage'] || 'Unknown error',
                datasetItemPath: path.join(
                    OUTPUT_DIR,
                    suite.slug,
                    testCase.slug,
                    'dataset-item.json'
                ),
            };
        } else {
            result = {
                url: testCase.url,
                status: 'success',
                errorMessage: null,
                datasetItemPath: path.join(
                    OUTPUT_DIR,
                    suite.slug,
                    testCase.slug,
                    'dataset-item.json'
                ),
            };
        }

        await saveTestCaseOutput(
            suite.slug,
            testCase.slug,
            result,
            datasetItem
        );
        results.set(testCase.slug, result);

        const statusIcon = result.status === 'success' ? '✅' : '❌';
        console.log(`  ${statusIcon} ${testCase.slug}`);
    }

    return {
        suiteSlug: suite.slug,
        results,
        runId,
        datasetId,
    };
}

/**
 * Run all test suites
 */
export async function runAllSuites(): Promise<SuiteRunResult[]> {
    await prepareOutputDir();

    const suiteSlugs = await listTestSuites();
    console.log(`Found ${suiteSlugs.length} test suite(s)`);

    const results: SuiteRunResult[] = [];

    for (const slug of suiteSlugs) {
        const suite = await loadTestSuite(slug);
        const result = await runSuite(suite);
        results.push(result);
    }

    return results;
}

/**
 * Run a single test suite by slug
 */
export async function runSingleSuite(suiteSlug: string): Promise<SuiteRunResult> {
    await prepareOutputDir();

    const suite = await loadTestSuite(suiteSlug);
    return runSuite(suite);
}

export { OUTPUT_DIR, TEST_SUITES_DIR };
