# Update Docs, Site Help, and Logo Cleanup

## TLDR
Update contextractor docs and site help page to reflect CLI-first refactor (URLs as positional args, all flags). Add CLI and Docker sections to site help. Delete unused logo files from repo root. Commit both `contextractor` and `tools` repos.

## Repos involved
- `/Users/miroslavsekera/r/contextractor` — docs, logos
- `/Users/miroslavsekera/r/tools` — site help content

## Context
- See `docs-update-notes/research-findings.md` — current state of docs, help, logos
- See `user-entry-log/entry-qa-decisions.md` — user decisions on logos, Docker, CLI detail level
- The CLI was refactored in commit `f8b495f` — URLs are now positional args, config file is optional via `--config`, all settings have CLI flags

## Steps

1. **step-update-docs.md** — Update `docs/spec/functional-spec.md`, `docs/spec/tech-spec.md`, and `README.md` to reflect CLI-first changes + add Docker as 4th distribution method
2. **step-update-site-help.md** — Add CLI (full reference) and Docker sections to site help page. Run the site to visually verify.
3. **step-delete-logos.md** — Delete `logo.png`, `logo.svg`, `logo.src.svg` from repo root
4. **step-commit.md** — Commit both repos
5. **step-review.md** — Review all changes against requirements
