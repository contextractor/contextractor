# Step 2: Add Docker Build to CI

## TLDR
Add `publish-docker` job to `.github/workflows/release.yml` that builds and pushes multi-platform Docker image to GHCR on release.

## Context
- See `docker-notes/architecture.md` — registry, tagging, platforms
- Current workflow has: `build` → `release` → `publish-npm`
- Docker job should run in parallel with `publish-npm` (both depend on `release`)

## New job: `publish-docker`

Position: after `release`, parallel with `publish-npm`

```yaml
publish-docker:
  needs: release
  runs-on: ubuntu-latest
  permissions:
    contents: read
    packages: write
```

Steps:
1. Checkout
2. Set up Docker Buildx (for multi-platform)
3. Login to GHCR (`docker/login-action` with `ghcr.io`, `GITHUB_TOKEN`)
4. Extract version from tag (strip `v` prefix)
5. Build and push with `docker/build-push-action`:
   - Context: `.` (repo root)
   - File: `apps/contextractor-standalone/Dockerfile`
   - Platforms: `linux/amd64,linux/arm64`
   - Tags: `ghcr.io/contextractor/contextractor:$VERSION`, `ghcr.io/contextractor/contextractor:latest`
   - Push: true

## Top-level permissions
Add `packages: write` to the top-level permissions block (or keep it scoped to the job).

## Constraints
- Do NOT modify existing jobs
- Use standard GitHub Actions for Docker (docker/setup-buildx-action, docker/login-action, docker/build-push-action)
- Multi-platform is important for arm64 support (Apple Silicon users running Docker)
