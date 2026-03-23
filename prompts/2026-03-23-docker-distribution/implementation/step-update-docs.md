# Step 3: Add Docker to All Docs

## TLDR
Add Docker usage documentation to README.md, functional-spec, tech-spec, and site help page.

## Files to update

### README.md
Add Docker as an alternative install/usage method:
```
docker run ghcr.io/contextractor/contextractor https://example.com
docker run -v ./output:/output ghcr.io/contextractor/contextractor https://example.com -o /output
```

### docs/spec/functional-spec.md
Add "Docker" as 4th availability mode in overview. Add Docker section with:
- Pull command
- Basic usage
- Volume mounts for output and config
- All CLI flags work the same inside Docker

### docs/spec/tech-spec.md
Add Docker section covering:
- Dockerfile location and base image
- Build context requirements (full workspace)
- CI/CD: `publish-docker` job in release.yml
- GHCR registry and tagging strategy
- Multi-platform support (linux/amd64, linux/arm64)

### Site help page (`/tools/apps/contextractor-site/content/automatic/help/help.md`)
Add Docker section (this is already in the docs-update prompt but needs the actual image name):
- Image: `ghcr.io/contextractor/contextractor`
- Usage examples with volume mounts
- Note that all CLI flags work the same

### Site help blurb (`help-blurb.md`)
Already planned to mention Docker in the docs-update prompt.

## Constraints
- Use `ghcr.io/contextractor/contextractor` as the image name consistently
- Show volume mount examples in every Docker section (output is inside container otherwise)
