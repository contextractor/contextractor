# Publish Contextractor — Master

## TLDR

Replaces `/publish:all`. Publishes contextractor to all channels (Apify, npm, PyPI, Docker), then downloads and tests each published artifact with a full test matrix. If any artifact fails, fixes the code and re-releases automatically.

Touches: Apify actor, GitHub release workflow, npm/PyPI/Docker packages, version files.

## Shared Context

- Version files to update: see `publish-notes/release-workflow.md`
- Test matrix: see `publish-notes/test-matrix.md`
- User decisions: see `user-entry-log/entry-qa-scope.md`

## Arguments

`$ARGUMENTS` — optional flags:
- `--production` — Push Apify actor to production (`glueo/contextractor`) instead of test
- `--skip-tests` — Skip local pytest step
- Version string (e.g. `0.4.0` or `v0.4.0`) — Use specific version instead of auto-bumping

## Steps

1. `step-local-tests.md` — Run pytest, validate Python, verify Apify login
2. `step-apify-push.md` — Push Apify actor, wait for build, run test crawl
3. `step-release.md` — Bump versions, commit, tag, push (triggers GitHub Actions)
4. `step-verify-pypi.md` — Install from PyPI, test CLI and library import, all formats
5. `step-verify-npm.md` — Install from npm, test CLI and JS API, all formats
6. `step-verify-docker.md` — Pull and run Docker image, test with volume mount
7. `step-review.md` — Review all changes, verify all artifacts, autofix and re-release if needed
