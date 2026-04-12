# Extraction Key Sync — Master

## TLDR

Rename `extraction` to `trafilaturaConfig` across CLI, config, docs, and tests. Hard rename, no backward compat. Apify actor is the source of truth — do not modify it. Then publish to all channels and verify each artifact.

## User Decisions

- `user-entry-log/entry-qa-config-key.md` — hard rename `extraction` → `trafilaturaConfig`, no backward compat
- `user-entry-log/entry-qa-scope.md` — full publish+verify cycle included

## Research

- `extraction-key-sync-notes/extraction-key-locations.md` — all code/doc locations to change

## Constraint

**Do NOT modify the Apify actor** (`apps/contextractor-apify/`). It is the primary product with existing users. All other channels must align to it.

## Steps

1. `step-rename-key.md` — Rename `extraction` to `trafilaturaConfig` in CrawlConfig, from_dict(), crawler, and all references
2. `step-docs-sync.md` — Update all READMEs, specs, config examples. Run `/sync:docs`
3. `step-publish.md` — Bump version, commit, tag, push. Run Apify push + GitHub Actions release
4. `step-verify.md` — Download and test PyPI, npm, Docker artifacts. Autofix and re-release if needed
5. `step-review.md` — Final review against user requirements, verify all changes, autofix gaps
