# Step 6: Verify Docker Image

## TLDR

Pull the published Docker image, test CLI with volume mount, verify extraction output.

See: `publish-notes/test-matrix.md` for test URLs.

## Steps

1. Pull the image:
   ```bash
   docker pull ghcr.io/contextractor/contextractor:$VERSION
   ```

2. Verify help:
   ```bash
   docker run ghcr.io/contextractor/contextractor:$VERSION --help
   ```

3. Test extraction with volume mount:
   ```bash
   mkdir -p /tmp/test-docker/output
   docker run -v /tmp/test-docker/output:/output \
     ghcr.io/contextractor/contextractor:$VERSION \
     https://example.com --format markdown -o /output --max-pages 1
   ```
   Verify output file exists in `/tmp/test-docker/output/` and has content.

4. Test all output formats:
   ```bash
   for fmt in txt markdown json jsonl xml xmltei; do
     mkdir -p /tmp/test-docker/output-$fmt
     docker run -v /tmp/test-docker/output-$fmt:/output \
       ghcr.io/contextractor/contextractor:$VERSION \
       https://example.com --format $fmt -o /output --max-pages 1
   done
   ```

5. Test with extraction options:
   ```bash
   mkdir -p /tmp/test-docker/output-options
   docker run -v /tmp/test-docker/output-options:/output \
     ghcr.io/contextractor/contextractor:$VERSION \
     https://en.wikipedia.org/wiki/Web_scraping \
     --precision --no-links --format json -o /output --max-pages 1
   ```

6. Cleanup:
   ```bash
   rm -rf /tmp/test-docker
   ```

## On Failure

If any test fails, diagnose the root cause (check Dockerfile, dependencies, sandbox settings). Fix, commit, and proceed to step-review.md for re-release.
