---
description: Run Contextractor test suites, analyze failures, and fix code
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
---

# Run and Fix Command

Run all Contextractor test suites, analyze results, fix any failures, and generate analysis report.

## Process

### Phase 1: Run Test Suites

```bash
cd tools/platform-test-runner && npm run test:run:all
```

Note: `APIFY_TOKEN` is provided via Claude's environment settings in `.claude/settings.local.json`.

### Phase 2: Analyze Results

Read `tools/platform-test-runner/test-suites-output/report.md` to identify:
- Which test cases passed
- Which test cases failed and why

For each failed test case:
1. Read `tools/platform-test-runner/test-suites-output/{suite}/{test-case}/result.json`
2. Read `tools/platform-test-runner/test-suites-output/{suite}/{test-case}/dataset-item.json`
3. Identify root cause (actor code issue, test case issue, or external site issue)

### Phase 3: Fix Code

If failures are due to actor code:
1. Read relevant code in `apps/contextractor/src/`
2. Fix the issue
3. Re-run test suites to verify fix

If failures are due to test case configuration:
1. Update `tools/platform-test-runner/test-suites/{suite}/settings.json` or `urls.json`
2. Re-run test suites

Skip fixing if failure is due to external site issues (blocked, changed structure, etc.)

### Phase 4: Generate Analysis Report

Write `tools/platform-test-runner/test-suites-output/analysis-report.md` with:
- Summary of test run
- List of passed test cases
- List of failed test cases with root cause
- Code changes made (if any)
- Recommendations

## Test Suite Cost Limits

When creating or modifying test suites, ensure they stay within these limits:

- Keep `maxPagesPerCrawl` under 50 pages
- Do not use residential proxies (`proxyConfiguration` with residential groups)
- Prefer `DOMCONTENTLOADED` over `NETWORKIDLE` when possible
- Keep the number of start URLs reasonable (under 10 per suite)

## Success Criteria

- All fixable test cases pass
- Analysis report generated
- Any code changes are minimal and targeted
