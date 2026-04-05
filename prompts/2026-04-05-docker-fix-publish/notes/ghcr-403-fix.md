# GHCR 403 Forbidden — Root Cause and Fix

## Error
```
failed to push ghcr.io/contextractor/contextractor:0.3.3: unexpected status from HEAD request: 403 Forbidden
```

Every release workflow run (v0.2.0 through v0.3.3) has failed at the `publish-docker` job with this same error.

## Root Cause
GHCR requires the **container package** itself to grant repository write access. The workflow has correct permissions (`packages: write`), but:

1. For a **first push under an org**, the package doesn't exist yet, so there's no settings page to configure
2. The `GITHUB_TOKEN` scoped to the repo doesn't automatically get write access to org-level packages

## Fix Options

### Option A: Use a PAT (Personal Access Token)
Create a classic PAT with `write:packages` scope, store as repo secret (e.g., `GHCR_PAT`), use instead of `GITHUB_TOKEN` for the first push. After the package exists, can switch back to `GITHUB_TOKEN`.

### Option B: Manual first push
Push the image manually from a local machine using `docker login ghcr.io` with a PAT, then configure package settings to allow the repository write access via Actions.

### Option C: Org-level package permissions
Go to org settings → Packages → ensure "Allow GitHub Actions to create and manage packages" is enabled. Then the `GITHUB_TOKEN` should work for first push.

## Post-First-Push
After the package is created:
1. Go to `https://github.com/orgs/contextractor/packages/container/contextractor/settings`
2. Under "Manage Actions access" → Add the `contextractor/contextractor` repo with **Write** role
3. Optionally make the package public

## Sources
- https://hackmd.io/@maelvls/fixing-403-forbidden-ghcr
- https://github.com/docker/build-push-action/issues/687
- https://github.com/orgs/community/discussions/26274
