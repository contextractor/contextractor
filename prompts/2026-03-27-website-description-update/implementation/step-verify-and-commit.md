---
description: Run the website locally, verify changes visually, autofix, commit both repos
allowed-tools: Bash(*), Read(*), Edit(*), Write(*), Glob(*), Grep(*)
---

# Step 3: Verify and Commit

## TLDR

Run the contextractor-site locally, verify the playground rename is reflected correctly in the GUI, fix any issues, then commit and push both repos.

## Verify

1. Start the contextractor-site dev server:
   ```bash
   cd /Users/miroslavsekera/r/tools/apps/contextractor-site && npm run dev
   ```

2. Check these pages visually (use claude agents/skills from the tools repo if available):
   - Homepage — verify blurb no longer says "Web App"
   - `/help/` — verify "Playground help" link
   - `/help/web/` — verify "Playground" heading and updated description
   - `/about/` — verify "Playground" bullet in features

3. Grep both repos for remaining "web app" or "Web App" references that should have been changed:
   ```bash
   grep -ri "web app" /Users/miroslavsekera/r/contextractor/README.md /Users/miroslavsekera/r/contextractor/apps/
   grep -ri "web app" /Users/miroslavsekera/r/tools/docs/contextractor.md /Users/miroslavsekera/r/tools/apps/contextractor-site/content/ /Users/miroslavsekera/r/tools/apps/contextractor-site/dist-content/
   ```

4. Fix any remaining references found.

## Commit

Commit contextractor repo:
```bash
cd /Users/miroslavsekera/r/contextractor
git add README.md apps/contextractor-standalone/npm/README.md apps/contextractor-apify/README.md
git commit -m "Rename website from Web app to Playground in docs"
git push
```

Commit tools repo:
```bash
cd /Users/miroslavsekera/r/tools
git add docs/contextractor.md apps/contextractor-site/content/ apps/contextractor-site/dist-content/
git commit -m "Rename website from Web app to Playground in docs and help pages"
git push
```
