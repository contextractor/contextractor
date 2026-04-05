# Scope and Locations

## What's changing

The website contextractor.com is currently described as a "Web app" — implying it's a standalone extraction tool. In reality, it's a **playground** for configuring and experimenting with extraction settings, then generating commands for npm CLI, Docker, and Apify actor.

New label: **"Playground"**
New positioning: Separate line, not in "Available as" distribution list.

## Files to update

### contextractor repo (`/Users/miroslavsekera/r/contextractor/`)

1. **`README.md`** line 5 — Remove `[Web app](https://contextractor.com)` from "Available as" line. Add separate line mentioning playground.
2. **`apps/contextractor-standalone/npm/README.md`** line 5 — Same change as root README.
3. **`apps/contextractor-apify/README.md`** line 63-65 — "## Web App" section. Rename to "## Playground" and reword.

### tools repo (`/Users/miroslavsekera/r/tools/`)

4. **`docs/contextractor.md`** line 12 — Remove "Web app" row from Platforms table. Add playground mention in Detailed Docs section (line 60).
5. **`apps/contextractor-site/content/automatic/about/about.md`** line 26 — Reword "Web app — No download needed" bullet.
6. **`apps/contextractor-site/content/automatic/help/help-blurb.md`** line 7 — Remove "Web App" from "Use it via" line.
7. **`apps/contextractor-site/content/automatic/help/help.md`** lines 3-4, 16 — Update meta description and "Web App help" link text.
8. **`apps/contextractor-site/content/automatic/help/web/web.md`** — Update title and content to reflect playground nature.
9. **`apps/contextractor-site/dist-content/`** — Mirror all content/ changes.

## What NOT to change

- `api.contextractor.com` references (API is separate)
- `site.json`, `package.json` homepage URLs (those are correct)
- Terms of service references
- Article content that mentions the site in passing
