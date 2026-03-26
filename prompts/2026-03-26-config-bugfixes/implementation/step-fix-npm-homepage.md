# Step 4: Fix npm Package Homepage URL

## TLDR

Change `homepage` in `package.json` from GitHub URL to `https://www.contextractor.com/`. This is visible on the npm package page. Requires a new publish to take effect.

## Reference

- Screenshot: `prompts/2026-03-26-config-review/user-entry-log/entry-screenshot-npm-homepage.md`

## Files to Change

### `apps/contextractor-standalone/npm/package.json`

Change:
```json
"homepage": "https://github.com/contextractor/contextractor"
```
To:
```json
"homepage": "https://www.contextractor.com/"
```

## Note

This change only takes effect on npm after the next `npm publish`. The release workflow triggers on version tags, so this will be included in the next release.
