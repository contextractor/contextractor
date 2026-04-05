# TLDR

Review all changes from prior steps against the original user intent. Verify Docker image is published and accessible. Autofix any issues.

**References:**
- `../user-entry-log/entry-initial-prompt.md` — original request
- `../user-entry-log/entry-qa-ghcr-fix.md` — GHCR fix decision

## Instructions

### 1. Capture all changes
```bash
git diff
git status
```

### 2. Verify each requirement

| Requirement | Covered by | Verify |
|---|---|---|
| Fix Docker build/push | step-fix-docker | Docker image builds locally |
| Publish Docker to GHCR | step-fix-docker | `docker pull ghcr.io/contextractor/contextractor:latest` works |
| Commit and push | step-commit-push | Clean git status, pushed to remote |

### 3. Verify Q&A decisions

- `entry-qa-ghcr-fix.md`: Uses `GITHUB_TOKEN` (not PAT), org settings configured — no secrets hardcoded

### 4. Run tests
```bash
cd /Users/miroslavsekera/r/contextractor
pytest
```

### 5. Verify Docker
```bash
docker build -f apps/contextractor-standalone/Dockerfile -t contextractor:review .
docker run contextractor:review --help
```

### 6. Check for issues
- No secrets or credentials in committed code
- Workflow changes are backward-compatible
- Package is publicly accessible on GHCR

### 7. Autofix
Fix any issues found above. Re-run failing tests until green. Commit fixes.
