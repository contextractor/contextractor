# Q: How to fix GHCR 403 Forbidden?

**Question:** The Docker push to GHCR has failed on every release with 403 Forbidden. This is a permissions issue — the org needs to allow GitHub Actions to create packages. How should we fix it?

**Answer:** Use an industry standard solution, a best practice.

**Decision:** Use the standard GitHub-recommended approach:
1. Enable "Allow GitHub Actions to create and manage packages" in org settings (Settings → Actions → General)
2. Keep using `GITHUB_TOKEN` (not a PAT) — this is the official best practice per GitHub docs
3. After first successful push, configure package visibility and repo access in package settings
4. If org setting alone doesn't work, do a one-time manual `docker push` from local to bootstrap the package, then Actions takes over
