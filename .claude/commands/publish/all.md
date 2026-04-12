---
description: Publish everything: Apify actor (test), npm (prod), PyPI (prod), Docker (prod) — with post-publish verification
allowed-tools: Bash(*), Read(*), Edit(*), Write(*), Glob(*), Grep(*), Skill(*)
---

# Publish All

Publish contextractor to all distribution channels, then download and verify each published artifact. If any artifact fails testing, fix and re-release automatically.

## Arguments

`$ARGUMENTS` — optional flags:
- `--production` — Push Apify actor to **production** (`glueo/contextractor`) instead of test (`glueo/contextractor-test`)
- `--skip-tests` — Skip the local test step (use when tests were already verified)
- Version string (e.g. `0.4.0` or `v0.4.0`) — Use this version instead of auto-bumping

## Step 0: Local Tests and Validation

Unless `--skip-tests` is in `$ARGUMENTS`:

```bash
cd /Users/miroslavsekera/r/contextractor
.venv/bin/python -m pytest apps/contextractor-standalone/tests/ -v
.venv/bin/python -m compileall -q apps/contextractor-apify/src/
```

Verify Apify login:
```bash
apify info
```
If not logged in, stop and tell the user to run `apify login`.

If any test fails, stop and fix before proceeding.

## Step 1: Push Apify Actor

Push directly via `apify push` (not via GitHub Actions).

1. Push to target:
   - If `--production` in `$ARGUMENTS`: `cd apps/contextractor-apify && apify push glueo/contextractor`
   - Otherwise: `cd apps/contextractor-apify && apify push glueo/contextractor-test`

2. Wait for build to succeed. If build fails, fetch log, fix, and retry.

3. Run test crawl:
   ```bash
   apify call <TARGET_ACTOR> --input '{"startUrls": [{"url": "https://en.wikipedia.org/wiki/List_of_sovereign_states"}], "maxPagesPerCrawl": 1}'
   ```

## Step 2: Release (Version Bump + Tag + Push)

Triggers GitHub Actions which builds binaries and publishes to npm, PyPI, and Docker.

1. Determine version:
   - If a version string is in `$ARGUMENTS`, use it
   - Otherwise, read current version from `apps/contextractor-standalone/npm/package.json` and bump patch

2. Update version in all package files:
   - `apps/contextractor-standalone/pyproject.toml`
   - `apps/contextractor-standalone/npm/package.json`
   - `apps/contextractor-apify/pyproject.toml`
   - `packages/contextractor_engine/pyproject.toml`
   - `pyproject.toml` (workspace root)

3. Commit, tag, and push:
   ```bash
   git add <version-files>
   git commit -m "Release vX.Y.Z"
   git tag vX.Y.Z
   git push && git push origin vX.Y.Z
   ```

4. Wait for GitHub Actions to complete (poll `gh run list --workflow=release.yml --limit=1` every 30s).

5. If any job fails, fetch logs with `gh run view <RUN_ID> --log-failed`, fix, and re-release (bump patch, new tag).

## Step 3: Verify PyPI Package

1. Create isolated test environment:
   ```bash
   uv venv /tmp/test-pypi --python 3.12
   /tmp/test-pypi/bin/pip install contextractor
   ```

2. Verify CLI: `/tmp/test-pypi/bin/contextractor --help`

3. Verify engine bundled: `/tmp/test-pypi/bin/python -c "from contextractor_engine import ContentExtractor; print('OK')"`

4. Test all output formats:
   ```bash
   for fmt in txt markdown json jsonl xml xmltei; do
     /tmp/test-pypi/bin/contextractor https://example.com --format $fmt -o /tmp/test-pypi/output-$fmt --max-pages 1
   done
   ```

5. Test extraction options:
   ```bash
   /tmp/test-pypi/bin/contextractor https://en.wikipedia.org/wiki/Web_scraping \
     --precision --no-links --no-tables --format json -o /tmp/test-pypi/output-options --max-pages 1
   ```

6. Test metadata:
   ```bash
   /tmp/test-pypi/bin/contextractor https://blog.apify.com/what-is-web-scraping/ \
     --with-metadata --format markdown -o /tmp/test-pypi/output-meta --max-pages 1
   ```

7. Cleanup: `rm -rf /tmp/test-pypi`

## Step 4: Verify npm Package

1. Install: `npm install -g contextractor --prefix /tmp/test-npm`

2. Verify CLI: `/tmp/test-npm/bin/contextractor --help`

3. Test all output formats:
   ```bash
   for fmt in txt markdown json jsonl xml xmltei; do
     /tmp/test-npm/bin/contextractor https://example.com --format $fmt -o /tmp/test-npm/output-$fmt --max-pages 1
   done
   ```

4. Test JS API:
   ```bash
   node -e "
     const { extract } = require('/tmp/test-npm/lib/node_modules/contextractor');
     extract('https://example.com', { format: 'markdown', outputDir: '/tmp/test-npm/output-api', maxPages: 1 })
       .then(() => console.log('JS API OK'))
       .catch(e => { console.error(e); process.exit(1); });
   "
   ```

5. Test extraction options:
   ```bash
   /tmp/test-npm/bin/contextractor https://en.wikipedia.org/wiki/Web_scraping \
     --precision --no-links --format json -o /tmp/test-npm/output-options --max-pages 1
   ```

6. Cleanup: `rm -rf /tmp/test-npm`

## Step 5: Verify Docker Image

1. Pull: `docker pull ghcr.io/contextractor/contextractor:$VERSION`

2. Verify help: `docker run ghcr.io/contextractor/contextractor:$VERSION --help`

3. Test all output formats:
   ```bash
   for fmt in txt markdown json jsonl xml xmltei; do
     mkdir -p /tmp/test-docker/output-$fmt
     docker run -v /tmp/test-docker/output-$fmt:/output \
       ghcr.io/contextractor/contextractor:$VERSION \
       https://example.com --format $fmt -o /output --max-pages 1
   done
   ```

4. Test with extraction options:
   ```bash
   mkdir -p /tmp/test-docker/output-options
   docker run -v /tmp/test-docker/output-options:/output \
     ghcr.io/contextractor/contextractor:$VERSION \
     https://en.wikipedia.org/wiki/Web_scraping \
     --precision --no-links --format json -o /output --max-pages 1
   ```

5. Cleanup: `rm -rf /tmp/test-docker`

## Step 6: Review and Re-release

If any verification step failed and code was fixed:
1. Run local tests again
2. Bump patch version in all 5 files
3. Commit, tag, push
4. Wait for GitHub Actions
5. Re-run only the failed verification steps

Report final status:
- Version published
- Channel URLs: PyPI, npm, Docker, Apify, GitHub Release
- Issues found and fixed
- Any remaining manual steps

## Success Criteria

- Apify actor build succeeded and test crawl produced output
- GitHub Release workflow completed (all jobs green)
- PyPI: `pip install contextractor` works, CLI and library import functional, all formats work
- npm: `npm install -g contextractor` works, CLI and JS API functional, all formats work
- Docker: `docker run` works, volume mount extraction functional, all formats work
- All version files in sync
