# Step 2: Push Apify Actor

## TLDR

Push actor to Apify platform, wait for build, run test crawl. Does NOT use GitHub Actions — pushes directly via `apify push`.

## Steps

1. Push to target:
   - If `--production` in `$ARGUMENTS`: `cd apps/contextractor-apify && apify push glueo/contextractor`
   - Otherwise: `cd apps/contextractor-apify && apify push glueo/contextractor-test`

2. The push command waits for build. If build fails, fetch log, fix, and retry.

3. Run test crawl:
   ```bash
   apify call <TARGET_ACTOR> --input '{"startUrls": [{"url": "https://en.wikipedia.org/wiki/List_of_sovereign_states"}], "maxPagesPerCrawl": 1}'
   ```

4. Verify test crawl succeeded (1 page extracted, 0 failures).
