Publish the `contextractor` npm package from `apps/contextractor-standalone/` to npmjs.com.

## Context

The CLI app (see `prompts/2026-03-15-cli-crawlee-app/prompt.md`) includes an npm distribution channel. The npm package wraps platform-specific binaries compiled with PyInstaller, providing both a CLI (`bin`) and JS library API (`main`/`exports`).

This prompt covers building the binaries, packaging for npm, and publishing.

## Auth

- NPM auth token is in `.env` as `NPM_TOKEN=...`
- Use token-based auth: set `//registry.npmjs.org/:_authToken=${NPM_TOKEN}` in a local `.npmrc` (do NOT commit it)
- Load the token from `.env` before publishing

## Package name

- Package name: `contextractor` (unscoped)
- This name is owned by us — use it directly, no fallback needed
- GitHub repository: `https://github.com/contextractor/contextractor`

## Steps

### 1. Build platform binaries

- Use PyInstaller to compile the Python CLI into standalone binaries
- Build for the current platform first (proof of concept)
- Target naming: `contextractor-{platform}-{arch}` (e.g., `contextractor-darwin-arm64`)
- Output binaries to `apps/contextractor-standalone/dist/`

### 2. Set up npm package

- Create/verify `package.json` in `apps/contextractor-standalone/npm/` (or similar packaging dir)
- Required fields: `name`, `version`, `description`, `bin`, `main`, `exports`, `files`, `os`, `cpu`
- `bin` entry: `contextractor` → points to a JS wrapper that locates and runs the correct binary
- `postinstall` script: downloads platform binary + runs `playwright install chromium`
- Include a JS wrapper (`index.js` or `cli.js`) that:
  - Detects platform/arch
  - Finds the correct binary
  - Spawns it with forwarded args and stdio

### 3. Publish

```bash
# Load token from .env
export $(grep NPM_TOKEN .env)

# Set up auth
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > apps/contextractor-standalone/npm/.npmrc

# Dry run first
cd apps/contextractor-standalone/npm && npm publish --dry-run

# Publish for real (ask for confirmation before this step)
npm publish --access public
```

- Always do a `--dry-run` first and show output
- Ask for confirmation before the actual publish
- Clean up `.npmrc` after publishing

### 4. Verify

- `npm view <package-name>` to confirm it's live
- `npx <package-name> --help` to verify the CLI works

## Important

- Do NOT commit `.npmrc` or the auth token
- Add `.npmrc` to `.gitignore` if not already there
- The `.env` file is already gitignored
- Start with the current platform only — cross-platform CI builds are a separate task
- Version should match the Python package version in `pyproject.toml`
