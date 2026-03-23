# Docker Distribution for Contextractor

## TLDR
Create a public Docker image for the standalone CLI. Add Dockerfile, CI/CD build+publish to GHCR, and multi-platform support. Users get `docker run ghcr.io/contextractor/contextractor https://example.com`.

## Context
- See `docker-notes/architecture.md` — full architecture analysis
- Current `release.yml` builds binaries + publishes npm. Docker needs to be added as a parallel job.
- Root `Dockerfile` is Apify-specific — standalone needs its own.

## Steps

1. **step-dockerfile.md** — Create standalone Dockerfile with Playwright + Chromium
2. **step-ci.md** — Add `publish-docker` job to `release.yml` (GHCR, multi-platform)
3. **step-update-docs.md** — Add Docker usage to README, functional-spec, tech-spec, and site help
4. **step-review.md** — Build image locally, test `docker run`, verify CI config
