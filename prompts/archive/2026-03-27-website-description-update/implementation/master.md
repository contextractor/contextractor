---
description: Rename website from "Web app" to "Playground" across both repos, reposition as configuration tool
allowed-tools: Bash(*), Read(*), Edit(*), Write(*), Glob(*), Grep(*)
---

# Website Description Update — Master

## TLDR

Rename contextractor.com from "Web app" to "Playground" in all docs and GUI across both repos (`contextractor` and `tools`). Remove it from the "Available as" distribution list. Reword it as a configuration/experimentation tool for npm CLI, Docker, and Apify actor. Then verify the site, commit both repos, publish, sync, and commit again.

## Shared Context

- **contextractor repo**: `/Users/miroslavsekera/r/contextractor/`
- **tools repo**: `/Users/miroslavsekera/r/tools/`
- New label: **"Playground"** (not "Web app")
- The site generates CLI/Docker/Apify commands from user-configured extraction settings — it's a configurator, not a standalone extraction tool
- See `website-description-update-notes/scope-and-locations.md` for full file list
- See `user-entry-log/entry-qa-naming-positioning.md` for user decisions

## Steps

1. **step-update-contextractor-repo.md** — Update README, npm README, and Apify README in the contextractor repo
2. **step-update-tools-repo.md** — Update docs, about page, help pages, and blurb in the tools repo. Mirror content/ to dist-content/.
3. **step-verify-and-commit.md** — Run the contextractor-site locally, visually verify changes, autofix issues, commit and push both repos
4. **step-publish-and-sync.md** — Run publish/all, sync/docs, sync/gui, then commit both repos again
5. **step-review.md** — Review all changes against user intent, run tests, autofix
