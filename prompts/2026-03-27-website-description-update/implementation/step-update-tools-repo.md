---
description: Update tools repo docs and GUI content to rename Web app → Playground
allowed-tools: Bash(*), Read(*), Edit(*), Write(*), Glob(*), Grep(*)
---

# Step 2: Update tools repo

## TLDR

Edit docs, about page, help pages, and blurb in `/Users/miroslavsekera/r/tools/` to rename "Web app" to "Playground." Mirror all `content/` changes to `dist-content/`.

See `website-description-update-notes/scope-and-locations.md` for full file list.
See `user-entry-log/entry-qa-naming-positioning.md` for user decisions.

## Changes

### `docs/contextractor.md`

- Remove the "Web app" row from the Platforms table (line 12)
- In "Detailed Docs" section (line 60), change:
  `- **Web app**: [contextractor.com](https://contextractor.com) — configure extraction settings interactively`
  to:
  `- **Playground**: [contextractor.com](https://contextractor.com) — configure extraction settings and preview commands`

### `apps/contextractor-site/content/automatic/about/about.md` (line 26)

**Before:** `- **Web app** — No download needed`
**After:** `- **Playground** — Configure and preview extraction settings at [contextractor.com](https://contextractor.com)`

### `apps/contextractor-site/content/automatic/help/help-blurb.md` (line 7)

**Before:** `Use it via the [Web App](/help/web/), [CLI](/help/cli/), [Docker](/help/docker/), or [Apify actor](https://apify.com/glueo/contextractor).`
**After:** `Use it via the [CLI](/help/cli/), [Docker](/help/docker/), or [Apify actor](https://apify.com/glueo/contextractor). Try the [Playground](/help/web/) to configure settings and preview commands.`

### `apps/contextractor-site/content/automatic/help/help.md`

- Update `description` and `excerpt` in frontmatter: replace "web app" with "playground"
- Line 16: change `[Web App help](/help/web/) — how to extract content in the browser` to `[Playground help](/help/web/) — configure extraction settings and preview commands`

### `apps/contextractor-site/content/automatic/help/web/web.md`

- Update `title` in frontmatter: `"Contextractor Playground — configure extraction settings and preview commands"`
- Update `description` and `excerpt`: `"Use Contextractor's playground to configure extraction settings, choose output formats, and generate ready-to-use CLI, Docker, and Apify commands."`
- Change `# Web App` heading to `# Playground`
- Rewrite opening paragraph: `Configure extraction settings, choose output formats, and generate ready-to-use commands for CLI, Docker, and Apify. Open the [homepage](/) to start.`
- The rest of the page (extract from URL, HTML, upload, output formats, download/copy) can stay — these are valid playground features.

### Mirror to `dist-content/`

After all content/ changes, copy each changed file:
```bash
cp content/automatic/about/about.md dist-content/automatic/about/about.md
cp content/automatic/help/help-blurb.md dist-content/automatic/help/help-blurb.md
cp content/automatic/help/help.md dist-content/automatic/help/help.md
cp content/automatic/help/web/web.md dist-content/automatic/help/web/web.md
```
