# Step: Add Node.js Library API to README

## TLDR

Add a "Node.js API" section to `README.md` after the CLI Usage section. Show how to call `extract()` from the npm package programmatically.

References: `add-library-api-docs-notes/current-docs-inventory.md`

## Instructions

### Read the actual API source

Read `/apps/contextractor-standalone/npm/index.js` to get the exact function signature, options, and behavior.

### Add section to README.md

After the "Config File" section and before "Docker", add a "## Node.js API" section covering:

- Import: `const { extract } = require("contextractor")` and ESM `import { extract } from "contextractor"`
- Basic usage: `await extract("https://example.com", { save: "markdown", outputDir: "./output" })`
- With extraction options: `precision`, `recall`, `fast`, `noLinks`, `noComments`, etc.
- Multiple URLs: `await extract(["https://a.com", "https://b.com"], { ... })`
- Using a config file: `await extract(urls, { config: "./config.json" })`
- Note that it returns `Promise<void>` — output goes to `outputDir` or stdout

### Keep it concise

- Show 3-4 code examples maximum
- Reference the CLI Options table for the full list (options use the same names)
- Don't duplicate the entire options table
