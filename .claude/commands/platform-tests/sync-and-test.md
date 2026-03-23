---
description: Sync test cases with actor schema and run tests
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
---

# Sync and Test Command

Review actor configuration, sync test cases, and run the full test suite.

## Process

### Phase 1: Review Actor Configuration

Read and analyze:
- `apps/contextractor/.actor/input_schema.json` - input parameters
- `apps/contextractor/.actor/dataset_schema.json` - output schema
- `apps/contextractor/.actor/actor.json` - actor metadata
- `apps/contextractor/README.md` - documentation

Identify:
- New input parameters added
- Changed default values
- New output fields
- Deprecated options

### Phase 2: Sync Test Suites

For each test suite in `tools/platform-test-runner/test-suites/`:

1. **Check settings.json** - ensure settings match current input schema:
   - Remove deprecated options
   - Add new relevant options with appropriate values
   - Update changed default values if needed

2. **Check urls.json** - ensure URLs are still valid:
   - Remove URLs for sites known to block scraping
   - Add new URLs if testing new features

3. **Check description.md** - update if scope changed

### Phase 3: Run Tests

Execute the `run-and-fix` command:
- Run all test suites
- Analyze and fix any failures
- Generate analysis report

### Phase 4: Generate Unit Tests (Optional)

After tests pass, run `/platform-tests:generate-unit-tests` to create local vitest tests from the results.

## Success Criteria

- Test suites aligned with current actor schema
- All tests pass (or failures documented)
- Analysis report generated
