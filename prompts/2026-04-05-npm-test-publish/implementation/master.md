# TLDR

Test the published npm `contextractor` package on idnes.cz pages locally. Fix any issues and re-publish to npm if needed. Commit and push.

## Steps

1. `step-test-npm.md` — Install and test `contextractor` npm package on idnes.cz pages
2. `step-fix-and-republish-npm.md` — Fix any issues found, re-publish npm if needed
3. `step-commit-push.md` — Commit all changes and push
4. `step-review.md` — Review against user intent, test, autofix

## Shared Context

- Working folder for testing: `/Users/miroslavsekera/r/testing-contextractor/`
- npm package: `contextractor` (currently v0.3.3)
- Release workflow: `.github/workflows/release.yml`
- Standalone app: `apps/contextractor-standalone/`
- npm wrapper: `apps/contextractor-standalone/npm/`
- Package state: see `../notes/npm-package-state.md`
