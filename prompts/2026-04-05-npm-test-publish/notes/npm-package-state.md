# npm Package Current State

- Package: `contextractor@0.3.3` on npm
- Published via GitHub Actions with OIDC provenance
- Works as a thin wrapper: postinstall downloads a PyInstaller binary from GitHub Releases
- Supported platforms: darwin-arm64, linux-x64, linux-arm64, win-x64
- macOS x64 uses arm64 binary via Rosetta

## How it works
1. `npm install contextractor` → runs `postinstall.js`
2. `postinstall.js` downloads platform binary from `https://github.com/contextractor/contextractor/releases/download/v{version}/contextractor-{platform}-{arch}`
3. Also runs `npx playwright install chromium` for browser-based crawling
4. `cli.js` spawns the downloaded binary with passed args

## Release workflow
- Tag push triggers `.github/workflows/release.yml`
- Builds binaries for 4 platforms → uploads to GitHub Release
- `publish-npm` job sets version and publishes
