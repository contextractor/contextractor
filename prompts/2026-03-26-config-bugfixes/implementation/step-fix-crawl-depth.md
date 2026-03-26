# Step 3: Fix crawl_depth Double-Handled

## TLDR

`crawl_depth` is passed to Crawlee as `max_crawl_depth` AND manually tracked via `user_data["depth"]` in the request handler. Remove the manual tracking — Crawlee handles it natively.

## Reference

- `apps/contextractor-standalone/src/contextractor_cli/crawler.py` — lines 108, 238-248
- Crawlee BasicCrawler has `max_crawl_depth` parameter (verified in SDK inspection)

## Files to Change

### `apps/contextractor-standalone/src/contextractor_cli/crawler.py`

1. Keep `max_crawl_depth` in crawler kwargs (already correct)
2. Remove the manual depth check in the handler:
   - Remove `user_data={"depth": 0}` from Request creation
   - Remove `current_depth = context.request.user_data.get("depth", 0)` check
   - Remove the `if config.crawl_depth > 0 and current_depth < config.crawl_depth:` condition
   - Simplify `enqueue_links()` call — just call it when crawl_depth > 0 (Crawlee handles depth limiting)

3. Simplify Request creation:
   - Remove `user_data={"depth": 0}` — Crawlee tracks depth internally

## Validation

Test with `--crawl-depth 1` and verify only 1 level of links is followed.
