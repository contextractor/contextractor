---
description: Update contextractor repo docs to rename Web app → Playground
allowed-tools: Bash(*), Read(*), Edit(*), Write(*), Glob(*), Grep(*)
---

# Step 1: Update contextractor repo

## TLDR

Edit 3 files in `/Users/miroslavsekera/r/contextractor/` to rename "Web app" to "Playground" and reposition it outside the distribution list.

See `website-description-update-notes/scope-and-locations.md` for rationale.
See `user-entry-log/entry-qa-naming-positioning.md` — user wants it removed from "Available as" and placed on a separate line.

## Changes

### `README.md` (line 5)

**Before:**
```
Available as: [npm CLI](#install) | [Docker](#docker) | [Apify actor](https://apify.com/glueo/contextractor) | [Web app](https://contextractor.com)
```

**After:**
```
Available as: [npm CLI](#install) | [Docker](#docker) | [Apify actor](https://apify.com/glueo/contextractor)

Try the [Playground](https://contextractor.com) to configure extraction settings and preview commands before running.
```

### `apps/contextractor-standalone/npm/README.md` (line 5)

Same change as root README.

### `apps/contextractor-apify/README.md` (lines 63-65)

**Before:**
```
## Web App

Try the interactive web app at **[contextractor.com](https://contextractor.com)** to configure extraction settings, preview commands, and explore all options before running at scale.
```

**After:**
```
## Playground

Try the [Playground](https://contextractor.com) to configure extraction settings and preview commands before running at scale.
```
