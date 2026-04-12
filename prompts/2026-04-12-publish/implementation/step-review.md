# Step 7: Review, Re-release if Needed

## TLDR

Review all changes from prior steps. If any verification step found issues and code was fixed, bump patch version and re-release. Verify all user requirements from the initial prompt are satisfied.

## References

- Initial prompt: `user-entry-log/entry-initial-prompt.md`
- User decisions: `user-entry-log/entry-qa-scope.md`
- Test matrix: `publish-notes/test-matrix.md`
- Release architecture: `publish-notes/release-workflow.md`

## Steps

1. Run `git diff` to capture all changes since the release tag.

2. Check each prior step's results:
   - Step 1 (local tests): Did all 34 tests pass?
   - Step 2 (Apify): Did build succeed and test crawl produce output?
   - Step 3 (release): Did all GitHub Actions jobs complete successfully?
   - Step 4 (PyPI): Did all format tests pass? Does library import work?
   - Step 5 (npm): Did CLI and JS API tests pass?
   - Step 6 (Docker): Did volume-mount extraction work?

3. If any step failed and code was fixed:
   - Run the full local test suite again to verify fixes don't break anything
   - Bump patch version in all 5 version files
   - Commit, tag, push new version
   - Wait for GitHub Actions
   - Re-run only the failed verification steps

4. Verify user requirements from `entry-initial-prompt.md`:
   - PyPI package downloadable and functional
   - npm package downloadable and functional
   - Docker image pullable and functional
   - All settings consistent across channels

5. Report final status:
   - Version published
   - All channel URLs
   - Any issues found and fixed
   - Any remaining manual steps needed
