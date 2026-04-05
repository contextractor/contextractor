# TLDR

Fix the GHCR 403 Forbidden error and get the Docker image published. Build and test locally first, then push to GHCR.

**Touches:** `.github/workflows/release.yml`, GitHub org settings, Docker image at `ghcr.io/contextractor/contextractor`

## Background

Every release since v0.2.0 has failed at `publish-docker` with:
```
failed to push ghcr.io/contextractor/contextractor: 403 Forbidden
```
Root cause: GHCR org permissions. See `../notes/ghcr-403-fix.md`.
Fix approach: see `../user-entry-log/entry-qa-ghcr-fix.md`.

## Instructions

### 1. Test Docker build locally

```bash
cd /Users/miroslavsekera/r/contextractor
docker build -f apps/contextractor-standalone/Dockerfile -t contextractor:local .
docker run contextractor:local https://www.idnes.cz/ --max-pages 1
```

Fix any build errors before proceeding.

### 2. Fix GHCR permissions (requires user action)

Ask the user to do these steps in the GitHub UI:

1. Go to https://github.com/organizations/contextractor/settings/actions → under "Workflow permissions" ensure **Read and write** is selected
2. Under "Allow GitHub Actions to create and manage packages" — ensure it's **enabled**

### 3. Bootstrap the package with manual push

If org settings alone don't resolve it, do a one-time manual push:

```bash
# User must run interactively:
# docker login ghcr.io -u <username>
# (use a PAT with write:packages scope as password)

docker tag contextractor:local ghcr.io/contextractor/contextractor:latest
docker push ghcr.io/contextractor/contextractor:latest
```

### 4. Configure package access

After first successful push:
1. Go to https://github.com/orgs/contextractor/packages/container/contextractor/settings
2. Under "Manage Actions access" → Add `contextractor/contextractor` repo with **Write** role
3. Set package visibility to **Public**

### 5. Verify via workflow

Re-run the latest failed release workflow:
```bash
gh run rerun 23665167004 --repo contextractor/contextractor --failed
```

Or trigger a new release to verify end-to-end.

### 6. Verify Docker image is accessible

```bash
docker pull ghcr.io/contextractor/contextractor:latest
docker run ghcr.io/contextractor/contextractor:latest --help
```
