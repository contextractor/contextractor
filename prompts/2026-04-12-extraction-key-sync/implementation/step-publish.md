# Step 3: Publish

## TLDR

Bump version, commit, tag, push. Push Apify actor to test, wait for GitHub Actions release. Follows the same flow as `prompts/2026-04-12-publish/implementation/master.md`.

## Steps

1. Run local tests:
   ```bash
   .venv/bin/python -m pytest apps/contextractor-standalone/tests/ -v
   ```

2. Push Apify actor to test:
   ```bash
   cd apps/contextractor-apify && apify push glueo/contextractor-test
   ```
   Run test crawl to verify build.

3. Read current version from `apps/contextractor-standalone/npm/package.json`, bump patch.

4. Update version in all 5 files:
   - `apps/contextractor-standalone/pyproject.toml`
   - `apps/contextractor-standalone/npm/package.json`
   - `apps/contextractor-apify/pyproject.toml`
   - `packages/contextractor_engine/pyproject.toml`
   - `pyproject.toml` (workspace root)

5. Commit, tag, push:
   ```bash
   git add <version-files> && git commit -m "Release vX.Y.Z" && git tag vX.Y.Z && git push && git push origin vX.Y.Z
   ```

6. Wait for GitHub Actions to complete. If any job fails, fetch logs, fix, re-release.
