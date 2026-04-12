# Step 2: JS API Update

## TLDR

Update `index.js` to remove `format` option and add `saveMarkdown`/`saveJsonl` options. Align all JS API options with new CLI flags.

## File to modify

- `apps/contextractor-standalone/npm/index.js`

## Changes

1. Remove `format` from JSDoc and `extract()` function
2. Remove the line: `if (options.format) args.push("--format", options.format);`
3. Add `saveMarkdown` option (mapped to `--save-markdown`)
4. Add `saveJsonl` option (mapped to `--save-jsonl`)
5. Update JSDoc `@param` annotations

Note: `saveMarkdown` defaults to true in the CLI, so the JS API doesn't need to pass it explicitly unless the user sets it to `false` (to disable markdown output).
