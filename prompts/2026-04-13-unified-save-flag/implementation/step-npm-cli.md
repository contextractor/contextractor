# Step 4: Update npm CLI / JS Library

## TLDR

Replace individual boolean save options in the JS `extract()` function with a single `save: string[]` option. Update flag mapping to pass `--save` to the Python binary. Update type definitions and README.

## Changes

### `apps/contextractor-standalone/npm/index.js`

**JS function options** (lines 135-183): Remove individual boolean options:
- `saveMarkdown`, `saveRawHtml`, `saveText`, `saveJson`, `saveJsonl`, `saveXml`, `saveXmlTei`

Replace with single `save` option handling:
```javascript
// Output formats
if (options.save) {
  const saveList = Array.isArray(options.save) ? options.save : [options.save];
  args.push("--save", saveList.join(","));
}
```

Accept both `save: ["markdown", "xml"]` (array) and `save: "markdown,xml"` (string) for ergonomics.

**JSDoc / type comments**: Update the options documentation to show:
```javascript
@param {string|string[]} [options.save] - Output formats: markdown,html,text,json,jsonl,xml,xml-tei,all
```

### `apps/contextractor-standalone/npm/cli.js`

No changes — raw arg passthrough.

### `apps/contextractor-standalone/npm/README.md`

Update JS library usage examples:
```javascript
const { extract } = require("contextractor");
await extract(["https://example.com"], {
  save: ["markdown", "json"],
  outputDir: "./output",
});
```

Update CLI usage examples:
```
npx contextractor --save markdown,json https://example.com
```
