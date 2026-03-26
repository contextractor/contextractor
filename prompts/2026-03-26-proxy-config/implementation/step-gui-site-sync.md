# Step 4: GUI Site Sync

## TLDR

Import contextractor-engine into the tools repo, update the GUI site to support new config options, and verify consistency between site and CLI/Apify Actor.

## Reference

- Tools repo: `/Users/miroslavsekera/r/tools`
- Site app: `/Users/miroslavsekera/r/tools/apps/contextractor-site`
- Import script: `npm run import:contextractor-engine` in `/Users/miroslavsekera/r/tools/package.json`
- Site help docs: `/Users/miroslavsekera/r/tools/apps/contextractor-site/content/automatic/help/`

## Implementation

1. Run `npm run import:contextractor-engine` from `/Users/miroslavsekera/r/tools/` to sync the engine package
2. Verify the imported engine includes all TrafilaturaConfig fields
3. Check site's extraction form/UI — does it expose config options? If so, add missing ones
4. Update site help docs (`help/cli/cli.md`, `help/docker/docker.md`, `help/web/web.md`) to match the docs from Step 3
5. Run the site locally and verify:
   - Help pages render correctly with new content
   - Config options shown on site match CLI and Apify Actor
   - Extraction functionality works end-to-end
6. Use Claude agents and skills at `/Users/miroslavsekera/r/tools/` for testing
