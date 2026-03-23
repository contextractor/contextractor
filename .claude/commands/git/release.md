Create a new release of contextractor. This triggers GitHub Actions to build platform binaries and publish to npm.

## Steps

1. Determine the next version:
   - If `$ARGUMENTS` is provided (e.g. `1.2.0` or `v1.2.0`), use that version
   - Otherwise, read the current version from `apps/contextractor-standalone/pyproject.toml` and bump the patch version (e.g. `0.1.0` → `0.1.1`)

2. Update version in all package files (keep them in sync):
   - `apps/contextractor-standalone/pyproject.toml` → `version = "X.Y.Z"`
   - `apps/contextractor-standalone/npm/package.json` → `"version": "X.Y.Z"`
   - `apps/contextractor-apify/pyproject.toml` → `version = "X.Y.Z"`
   - `packages/contextractor_engine/pyproject.toml` → `version = "X.Y.Z"`
   - `pyproject.toml` (workspace root) → `version = "X.Y.Z"`

3. Commit the version bump:
   - Stage only the changed version files
   - Commit message: `Release vX.Y.Z`
   - Do NOT add any Co-Authored-By footer

4. Create and push the tag:
   - `git tag vX.Y.Z`
   - `git push && git push origin vX.Y.Z`

5. Show the user:
   - The GitHub Actions URL: `https://github.com/contextractor/contextractor/actions`
   - The npm package URL: `https://www.npmjs.com/package/contextractor`
   - Remind them to check the Actions tab for build progress
