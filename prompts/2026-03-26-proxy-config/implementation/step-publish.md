# Step 6: Publish

## TLDR

Build and publish Docker image, Apify Actor, and npm package after all tests pass.

## Pre-publish Checklist

- [ ] All tests from Step 5 pass
- [ ] Docs reviewed in Step 3 are accurate
- [ ] Version bumped if needed (check `package.json`, `pyproject.toml`)
- [ ] CHANGELOG updated if one exists

## Docker

```bash
docker build -t contextractor .
# Push to registry if applicable
```

## Apify Actor

```bash
# Test actor first
apify push  # pushes to shortc/contextractor-test by default

# Production (only when explicitly confirmed)
# apify push --production  (pushes to shortc/contextractor)
```

See CLAUDE.md production protection rules.

## NPM Package

1. Build platform binaries: `python apps/contextractor-standalone/build.py`
2. Create GitHub release with binaries attached (for postinstall download)
3. Bump version in `apps/contextractor-standalone/npm/package.json`
4. Publish: `cd apps/contextractor-standalone/npm && npm publish`

## Post-publish Verification

- Install npm package globally and test: `npx contextractor --help`
- Run Apify Actor from platform UI
- Pull Docker image and test extraction
