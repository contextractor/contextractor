import { parseArgs } from 'node:util';
import {
    runAllSuites,
    runSingleSuite,
    listTestSuites,
    loadTestSuite,
} from './runner.js';
import { generateReport } from './report.js';
import type { CLIOptions } from './types.js';

function printUsage(): void {
    console.log(`
Contextractor Test Runner

Usage:
  npm run test:run -- --suite <suite-slug>   Run a specific test suite
  npm run test:run:all                       Run all test suites
  npm run test:run -- --suite <slug> --dry-run   Show what would run

Options:
  --suite <slug>   Test suite slug to run
  --all            Run all test suites
  --dry-run        Show test cases without running
  --help           Show this help message
`);
}

async function dryRun(suiteSlug?: string): Promise<void> {
    if (suiteSlug) {
        const suite = await loadTestSuite(suiteSlug);
        console.log(`\nTest Suite: ${suite.slug}`);
        console.log(`Description: ${suite.description.split('\n')[0]}`);
        console.log(`Settings: ${JSON.stringify(suite.settings, null, 2)}`);
        console.log(`\nTest Cases (${suite.testCases.length}):`);
        for (const tc of suite.testCases) {
            console.log(`  - ${tc.slug}: ${tc.url}`);
        }
    } else {
        const slugs = await listTestSuites();
        console.log(`\nAvailable Test Suites (${slugs.length}):`);
        for (const slug of slugs) {
            const suite = await loadTestSuite(slug);
            console.log(`\n  ${slug}:`);
            console.log(`    ${suite.description.split('\n')[0]}`);
            console.log(`    Test cases: ${suite.testCases.length}`);
        }
    }
}

async function main(): Promise<void> {
    const { values } = parseArgs({
        options: {
            suite: { type: 'string', short: 's' },
            all: { type: 'boolean', short: 'a' },
            'dry-run': { type: 'boolean', short: 'd' },
            help: { type: 'boolean', short: 'h' },
        },
        allowPositionals: true,
    });

    const options: CLIOptions = {
        suite: values.suite,
        all: values.all,
        dryRun: values['dry-run'],
    };

    if (values.help) {
        printUsage();
        process.exit(0);
    }

    if (options.dryRun) {
        await dryRun(options.suite);
        return;
    }

    if (!options.suite && !options.all) {
        console.error('Error: Must specify --suite <slug> or --all');
        printUsage();
        process.exit(1);
    }

    console.log('Contextractor Test Runner');
    console.log('='.repeat(50));

    let results;

    if (options.all) {
        results = await runAllSuites();
    } else if (options.suite) {
        const result = await runSingleSuite(options.suite);
        results = [result];
    } else {
        throw new Error('No suite specified');
    }

    await generateReport(results);

    const totalTests = results.reduce((sum, r) => sum + r.results.size, 0);
    const passedTests = results.reduce((sum, r) => {
        let passed = 0;
        for (const result of r.results.values()) {
            if (result.status === 'success') passed++;
        }
        return sum + passed;
    }, 0);

    console.log('\n' + '='.repeat(50));
    console.log(`Total: ${passedTests}/${totalTests} test cases passed`);
}

main().catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
});
