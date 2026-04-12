# Release Workflow Architecture

## Current Flow (from /publish:all and release.yml)

1. **Local tests** — pytest on standalone tests
2. **Apify push** — direct `apify push` to test actor, build, test crawl
3. **Version bump** — update 5 files: standalone pyproject.toml, npm package.json, apify pyproject.toml, engine pyproject.toml, workspace pyproject.toml
4. **Tag + push** — `git tag vX.Y.Z && git push && git push origin vX.Y.Z`
5. **GitHub Actions** (triggered by tag):
   - Build binaries (4 platforms: linux-x64, linux-arm64, darwin-arm64, win-x64)
   - Create GitHub Release with binaries
   - Publish npm (with provenance, syncs Playwright version from uv.lock)
   - Publish PyPI (single `contextractor` wheel via OIDC, engine bundled via force-include)
   - Publish Docker (multi-arch: amd64, arm64)

## Version Files
- `apps/contextractor-standalone/pyproject.toml`
- `apps/contextractor-standalone/npm/package.json`
- `apps/contextractor-apify/pyproject.toml`
- `packages/contextractor_engine/pyproject.toml`
- `pyproject.toml` (workspace root)

## PyPI Specifics
- Only wheel (no sdist) — force-include paths break in sdist
- Engine bundled via `[tool.hatch.build.targets.wheel.force-include]`
- OIDC trusted publishing via `pypi` environment

## Re-release on Failure
- Must delete the failed tag before re-tagging same version
- Or bump to next patch and release fresh
- `gh release delete vX.Y.Z --yes && git tag -d vX.Y.Z && git push origin :refs/tags/vX.Y.Z`
