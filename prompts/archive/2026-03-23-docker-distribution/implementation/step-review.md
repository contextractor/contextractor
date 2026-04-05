# Step 4: Review and Test

## TLDR
Build the Docker image locally, test it, verify CI config, check all docs.

## Test checklist

### 1. Build locally
```bash
docker build -f apps/contextractor-standalone/Dockerfile -t contextractor:test .
```

### 2. Test basic usage
```bash
docker run contextractor:test --help
docker run contextractor:test https://example.com
docker run -v ./output:/output contextractor:test https://example.com -o /output
```

### 3. Verify CI config
- `release.yml` has valid `publish-docker` job
- Permissions include `packages: write`
- Tags use correct version extraction
- Multi-platform build configured

### 4. Check all docs
- README mentions Docker
- functional-spec lists Docker as 4th mode
- tech-spec has Docker CI/CD section
- Site help has Docker section with correct image name

### 5. Autofix any issues
