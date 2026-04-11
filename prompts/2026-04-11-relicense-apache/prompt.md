# Relicense contextractor from MIT to Apache-2.0

## Goal

Replace the MIT license with Apache 2.0 across all packages, metadata, and documentation. Then run the sync commands to propagate the change through READMEs and verify internal consistency.

## Part 1: Replace LICENSE file

Replace `/Users/miroslavsekera/r/contextractor/LICENSE` with the canonical Apache 2.0 text from https://www.apache.org/licenses/LICENSE-2.0.txt — keep `Copyright (c) 2026 contextractor` as the copyright line.

## Part 2: Add NOTICE file

Create `/Users/miroslavsekera/r/contextractor/NOTICE`:

```
contextractor
Copyright 2026 contextractor
```

## Part 3: Update pyproject.toml license fields

Add `license = "Apache-2.0"` to the `[project]` section of each package that is missing it:

- `packages/contextractor_engine/pyproject.toml`
- `apps/contextractor-standalone/pyproject.toml`
- `apps/contextractor-apify/pyproject.toml`

## Part 4: Update npm package

In `apps/contextractor-standalone/npm/package.json`, change:

```json
"license": "MIT"
```

to:

```json
"license": "Apache-2.0"
```

## Part 5: Update all license mentions in documentation

Find every occurrence of `MIT` used as a license reference (not package names) across:

- `README.md` (root)
- `apps/contextractor-standalone/npm/README.md`
- `apps/contextractor-apify/README.md`

Replace with `Apache-2.0`. The `## License` section in each README should read:

```
## License

Apache-2.0
```

## Part 6: Sync docs

Run the sync/docs command: read all CLI source-of-truth files and update all READMEs for consistency per the steps in `.claude/commands/sync/docs.md`.

## Part 7: Verify internal consistency

Run the sync/gui command: cross-check `CrawlConfig`, `TrafilaturaConfig`, `FORMAT_EXTENSIONS`, CLI flags, and Apify input schema per the steps in `.claude/commands/sync/gui.md`.

## Part 8: Commit

```bash
cd /Users/miroslavsekera/r/contextractor
git add LICENSE NOTICE \
  packages/contextractor_engine/pyproject.toml \
  apps/contextractor-standalone/pyproject.toml \
  apps/contextractor-apify/pyproject.toml \
  apps/contextractor-standalone/npm/package.json \
  README.md \
  apps/contextractor-standalone/npm/README.md \
  apps/contextractor-apify/README.md
git commit -m "chore: relicense MIT → Apache-2.0"
git push
```

## Publish targets

After the commit is pushed, verify the license field is correct before triggering a release. The license change propagates to all three distribution targets automatically on the next release tag:

| Target | Where license appears |
|---|---|
| **npm** (`contextractor`) | `package.json` `license` field + README |
| **Docker** (`ghcr.io/contextractor/contextractor`) | `LICENSE` and `NOTICE` files baked into image |
| **Apify actor** (`glueo/contextractor`) | `apps/contextractor-apify/README.md` |
| **PyPI** `contextractor` + `contextractor-engine` | `pyproject.toml` `license` field |
