# Config Consistency — Master

## TLDR

Replace `--format` with `--save-*` toggles across CLI, npm JS API, Docker, and docs. Apify actor is the source of truth — do not modify it. Add `--save-markdown` (default: true) and `--save-jsonl`. Full settings audit to remove redundancy and align naming. Update all docs via `/sync:docs` and `/sync:gui`.

## User Decisions

- `user-entry-log/entry-qa-format-flags.md` — remove `--format`, add `--save-markdown`, full audit + simplify
- `user-entry-log/entry-qa-jsonl.md` — keep JSONL as `--save-jsonl`

## Research

- `config-consistency-notes/settings-comparison.md` — Apify vs CLI settings mapping
- `config-consistency-notes/full-audit.md` — complete change list

## Constraint

**Do NOT modify the Apify actor** (`apps/contextractor-apify/`). It is the primary product with existing users. All other channels must align to it.

## Steps

1. `step-cli-refactor.md` — Remove `--format`, add `--save-markdown` and `--save-jsonl`, update CrawlConfig and crawler
2. `step-js-api.md` — Update `index.js` JS API to match new CLI flags
3. `step-config-schema.md` — Update config file schema, remove `outputFormat`, add save toggles
4. `step-docs-sync.md` — Update all READMEs and run sync commands
5. `step-review.md` — Run tests, verify consistency, autofix
