---
description: Review all changes against user intent, test, autofix
allowed-tools: Bash(*), Read(*), Edit(*), Write(*), Glob(*), Grep(*)
---

# Step 5: Review

## TLDR

Final review of all code changes from steps 1-4. Verify every requirement from the initial prompt is covered, all Q&A decisions are reflected, and no issues remain.

## Review process

### 1. Capture full diff

```bash
cd /Users/miroslavsekera/r/contextractor && git diff HEAD~3..HEAD
cd /Users/miroslavsekera/r/tools && git diff HEAD~3..HEAD
```

Adjust `HEAD~N` to cover all commits from this prompt's execution.

### 2. Verify against user intent

Read `user-entry-log/entry-initial-prompt.md` and check each requirement:

| Requirement | Expected step |
|---|---|
| Website no longer called "web version" | Steps 1, 2 |
| Website described as configure/experiment tool | Steps 1, 2 |
| Used for: npm package, Docker, Apify agent config | Steps 1, 2 |
| Updated in both repos | Steps 1, 2 |
| See sync/docs and sync/gui commands for update locations | Step 4 |
| Commit and push both repos | Steps 3, 4 |
| Run the website, check visually | Step 3 |
| Autofix | Step 3 |
| Run publish/all, sync/docs, sync/gui | Step 4 |
| Final commit both repos | Step 4 |

### 3. Verify Q&A decisions

Read `user-entry-log/entry-qa-naming-positioning.md` and confirm:

- [ ] Label changed to "Playground" (not "Web app")
- [ ] Removed from "Available as" / distribution list
- [ ] Placed on a separate line
- [ ] Not linked from homepage blurb
- [ ] About page bullet reworded

### 4. Run tests

```bash
cd /Users/miroslavsekera/r/contextractor && .venv/bin/python -m pytest -v
```

### 5. Grep for stragglers

Search both repos for remaining "Web app" or "web app" references in docs that should have been updated (exclude code files, article content, and terms of service):

```bash
grep -ri "web app" /Users/miroslavsekera/r/contextractor/{README.md,apps/} --include="*.md"
grep -ri "web app" /Users/miroslavsekera/r/tools/docs/ /Users/miroslavsekera/r/tools/apps/contextractor-site/content/automatic/help/ /Users/miroslavsekera/r/tools/apps/contextractor-site/content/automatic/about/ --include="*.md"
```

### 6. Autofix

Fix any issues found: stale references, test failures, missing mirrors in dist-content/, inconsistencies between repos. Commit fixes.
