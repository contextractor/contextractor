# Step 3: Update All Documentation

## TLDR

Update all 3 READMEs and site help pages with consistent, complete config documentation. Show only JSON examples in docs. Cover all options added in Step 1.

## Reference

- Config gaps: `proxy-config-notes/config-consistency-gaps.md`
- User decision on JSON-only docs: `user-entry-log/entry-initial-prompt.md`

## Files to Update

1. `/Users/miroslavsekera/r/contextractor/README.md` — main project README
2. `/Users/miroslavsekera/r/contextractor/apps/contextractor-apify/README.md` — Apify Actor README
3. `/Users/miroslavsekera/r/contextractor/apps/contextractor-standalone/npm/README.md` — npm package README
4. `/Users/miroslavsekera/r/tools/apps/contextractor-site/content/automatic/help/cli/cli.md` — site CLI help
5. `/Users/miroslavsekera/r/tools/apps/contextractor-site/content/automatic/help/docker/docker.md` — site Docker help

## Rules

- Show only JSON config examples (even though YAML is supported)
- All docs must list the same config options
- Group options: Crawl Settings, Content Extraction, Proxy, Browser, Output
- Each option: name, type, default, description
- CLI flags table must match config file keys
- Apify Actor README can additionally document Apify-specific features (platform proxy editor, storage names)

## Documentation Sections to Add/Update

### Proxy Configuration (new section in all docs)
```json
{
  "proxy": {
    "urls": ["http://user:pass@host:port"],
    "rotation": "recommended"
  }
}
```
CLI: `--proxy-urls http://host:port --proxy-rotation recommended`

### Browser Settings (new section)
Document: launcher, waitUntil, pageLoadTimeout, ignoreCors, closeCookieModals, maxScrollHeight, ignoreSslErrors

### Crawl Filtering (expand existing)
Document: globs, excludes, linkSelector, keepUrlFragments, respectRobotsTxt

### Concurrency (new section)
Document: maxConcurrency, maxRetries, maxResults

### Output Toggles (new section)
Document: saveRawHtml, saveText, saveJson, saveXml, saveXmlTei
