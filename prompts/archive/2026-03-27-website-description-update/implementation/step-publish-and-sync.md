---
description: Run publish/all, sync/docs, sync/gui, then commit both repos
allowed-tools: Bash(*), Read(*), Edit(*), Write(*), Glob(*), Grep(*), Skill(*)
---

# Step 4: Publish and Sync

## TLDR

Run the publish and sync commands to propagate changes to all distribution channels. Then commit any additional changes in both repos.

## Execute commands

Run these in order from the contextractor repo:

1. `/publish:all` — Publishes Apify actor (test), npm standalone, Docker standalone
2. `/sync:docs` — Syncs all documentation between both repos
3. `/sync:gui` — Syncs GUI with latest package changes

Each of these is a skill/command defined in `/Users/miroslavsekera/r/contextractor/.claude/commands/`.

## Final commit

After all syncs complete, commit any new changes in both repos:

```bash
cd /Users/miroslavsekera/r/contextractor
git add -A && git diff --cached --quiet || git commit -m "Post-sync documentation updates"
git push

cd /Users/miroslavsekera/r/tools
git add -A && git diff --cached --quiet || git commit -m "Post-sync documentation and GUI updates"
git push
```
