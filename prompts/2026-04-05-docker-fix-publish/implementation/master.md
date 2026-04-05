# TLDR

Fix the GHCR 403 Forbidden error that has blocked every Docker publish since v0.2.0. Get the Docker image built, pushed, and publicly accessible. Commit and push.

## Steps

1. `step-fix-docker.md` — Fix GHCR 403 and publish Docker image
2. `step-commit-push.md` — Commit all changes and push
3. `step-review.md` — Review against user intent, verify image is accessible, autofix

## Shared Context

- Docker image: `ghcr.io/contextractor/contextractor`
- Release workflow: `.github/workflows/release.yml`
- Dockerfile: `apps/contextractor-standalone/Dockerfile`
- GHCR 403 root cause: see `../notes/ghcr-403-fix.md`
- GHCR fix approach: see `../user-entry-log/entry-qa-ghcr-fix.md`
