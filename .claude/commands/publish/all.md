---
description: Publish everything: Apify actor (test), npm standalone (prod), Docker standalone (prod)
allowed-tools: Bash(*), Read(*), Edit(*), Write(*), Glob(*), Grep(*), Skill(*)
---

# Publish All

Publish contextractor to all distribution channels in sequence. Runs tests first, then publishes to each target.

**IMPORTANT:** This is a fully automated workflow. Do NOT ask for confirmation at any step. Execute all steps automatically without pausing for user input.

## Arguments

`$ARGUMENTS` — optional flags:
- `--production` — Push Apify actor to **production** (`shortc/contextractor`) instead of test (`shortc/contextractor-test`)
- `--skip-tests` — Skip the local test step (use when tests were already verified)
- Version string (e.g. `0.4.0` or `v0.4.0`) — Use this version for npm/Docker release instead of auto-bumping

## Step 0: Run Local Tests

Unless `--skip-tests` is in `$ARGUMENTS`:

```bash
cd /Users/miroslavsekera/r/contextractor
.venv/bin/python -m pytest apps/contextractor-standalone/tests/ -v
```

If any tests fail, stop and fix before proceeding.

## Step 1: Push Apify Actor

Push the Apify actor. This does NOT use the GitHub release workflow — it pushes directly via `apify push`.

1. Verify login:
   ```bash
   apify info
   ```
   If not logged in, stop and tell the user to run `apify login`.

2. Validate Python:
   ```bash
   .venv/bin/python -m compileall -q apps/contextractor-apify/src/
   ```

3. Push to target:
   - If `--production` in `$ARGUMENTS`: `cd apps/contextractor-apify && apify push shortc/contextractor`
   - Otherwise: `cd apps/contextractor-apify && apify push shortc/contextractor-test`

4. Wait for build to succeed (poll `apify builds ls` every 15s). If build fails, fetch log with `apify builds log <BUILD_ID>`, fix, and retry.

5. Run test crawl:
   ```bash
   apify call <TARGET_ACTOR> --input '{"startUrls": [{"url": "https://en.wikipedia.org/wiki/List_of_sovereign_states"}], "maxPagesPerCrawl": 1}'
   ```

## Step 2: Release npm + Docker via GitHub Actions

This uses the existing `/git:release` workflow which triggers GitHub Actions to build cross-platform binaries, publish to npm, and push Docker image to GHCR.

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

4. The tag push triggers `.github/workflows/release.yml` which automatically:
   - Builds binaries for linux-x64, linux-arm64, darwin-arm64, win-x64
   - Creates GitHub Release with binaries
   - Publishes npm package to registry
   - Builds and pushes Docker image to `ghcr.io/contextractor/contextractor`

5. Report URLs:
   - GitHub Actions: `https://github.com/contextractor/contextractor/actions`
   - npm: `https://www.npmjs.com/package/contextractor`
   - Docker: `ghcr.io/contextractor/contextractor:X.Y.Z`

## Success Criteria

- Apify actor build succeeded and test crawl produced output
- GitHub Release workflow triggered (tag pushed)
- All version files in sync
