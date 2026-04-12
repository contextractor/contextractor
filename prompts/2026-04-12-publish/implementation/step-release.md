# Step 3: Release (Version Bump + Tag + Push)

## TLDR

Bump version in all package files, commit, tag, and push. The tag triggers GitHub Actions which builds binaries and publishes to npm, PyPI, and Docker.

See: `publish-notes/release-workflow.md` for version file list and workflow details.

## Steps

1. Determine version:
   - If version string in `$ARGUMENTS`, use it
   - Otherwise read current version from `apps/contextractor-standalone/npm/package.json` and bump patch

2. Update version in all 5 files:
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

5. If any job fails, fetch logs with `gh run view <RUN_ID> --log-failed`, diagnose, fix code, and re-release (bump patch, new tag).
