# Research Findings

## Docs (`/docs/`)
- Contains: `spec/functional-spec.md`, `spec/tech-spec.md`, `notes/content-type/note.md`, `troubleshooting/timeout/report.md`, `unit-test-cases/angle-brackets-in-text/`
- Both specs are **outdated** — they describe the old CLI interface (`contextractor <config-file>` required, limited CLI flags)
- Need updating to reflect: URLs as positional args, `--config` optional, all new flags

## Site help (`/tools/apps/contextractor-site/content/automatic/help/`)
- `help.md` — only mentions web app and Apify actor. **Missing**: CLI and Docker info
- `help-blurb.md` — mentions web app and Apify actor only. **Missing**: CLI and Docker

## Logo files in repo root
- `logo.png` (22K), `logo.svg` (8K), `logo.src.svg` (4K) — sitting in repo root
- **Not referenced** by any code, README, or config in the contextractor repo
- Brand logos live in `internal-brands/dist-content/contextractor/` in the tools repo
- The repo copies are **stale** — different MD5 hashes from the current brand assets
- `logo.src.svg` has no equivalent in internal-brands (it's the editable source SVG)
- **Recommendation**: Delete all 3 from repo root. They serve no purpose here — the site gets logos from internal-brands package.

## Site architecture
- Next.js site in `/tools/apps/contextractor-site/`
- Logos sourced from `internal-brands` package via `getBrandAsset()`
- Press kit page exists at `/press-kit/`
- Content stored in `content/automatic/` (markdown with frontmatter)
