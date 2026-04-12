# Step 2: Documentation Sync

## TLDR

Update all READMEs, specs, and config examples to use `trafilaturaConfig` instead of `extraction`. Run `/sync:docs`.

See: `extraction-key-sync-notes/extraction-key-locations.md` for doc locations.

## Files to update

- `README.md` (repo root)
- `apps/contextractor-standalone/npm/README.md`
- `docs/spec/functional-spec.md`
- `docs/spec/tech-spec.md`

## Changes

### Config file examples

Replace:
```json
"extraction": {
```
With:
```json
"trafilaturaConfig": {
```

### Config tables

Replace "All options go under the `extraction` key" with "All options go under the `trafilaturaConfig` key".

### Functional spec

Remove the dual-key note ("Shared extraction options used by both the Apify Actor (`trafilaturaConfig` key) and standalone CLI (`extraction` key)") — now they use the same key.

## Sync commands

After manual updates, run:
```
/sync:docs
```
