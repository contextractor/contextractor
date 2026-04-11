# Relicense contextractor from MIT to Apache-2.0

## Goal

Replace MIT with Apache 2.0 across all packages, metadata, documentation, and container labels.

## Part 1: Replace LICENSE file

Replace `/Users/miroslavsekera/r/contextractor/LICENSE` with the canonical Apache 2.0 text from https://www.apache.org/licenses/LICENSE-2.0.txt — no copyright line in this file (Apache 2.0 puts copyright in NOTICE, not LICENSE).

## Part 2: Create NOTICE file

Create `/Users/miroslavsekera/r/contextractor/NOTICE`:

```
Contextractor
Copyright 2026 Glueo, s.r.o.
```

## Part 3: Update pyproject.toml license fields

Add `license = "Apache-2.0"` to the `[project]` section of all four packages:

- `pyproject.toml` (workspace root)
- `packages/contextractor_engine/pyproject.toml`
- `apps/contextractor-standalone/pyproject.toml`
- `apps/contextractor-apify/pyproject.toml`

## Part 4: Update npm package

In `apps/contextractor-standalone/npm/package.json`, change `"license": "MIT"` to `"license": "Apache-2.0"`.

## Part 5: Update Dockerfile label

In `apps/contextractor-standalone/Dockerfile`, change the OCI license label from `"MIT"` to `"Apache-2.0"`.

## Part 6: Update all license mentions in documentation

Replace `MIT` with `Apache-2.0` in the `## License` section of:

- `README.md` (root)
- `apps/contextractor-standalone/npm/README.md`

Add a `## License` section to `apps/contextractor-apify/README.md` (currently missing):

```
## License

Apache-2.0
```

## Part 7: Commit

```bash
cd /Users/miroslavsekera/r/contextractor
git add LICENSE NOTICE \
  pyproject.toml \
  packages/contextractor_engine/pyproject.toml \
  apps/contextractor-standalone/pyproject.toml \
  apps/contextractor-apify/pyproject.toml \
  apps/contextractor-standalone/npm/package.json \
  apps/contextractor-standalone/Dockerfile \
  README.md \
  apps/contextractor-standalone/npm/README.md \
  apps/contextractor-apify/README.md
git commit -m "Relicense MIT → Apache-2.0"
git push
```

## Publish targets

The license change propagates to all distribution targets on the next release:

| Target | Where license appears |
|---|---|
| **npm** (`contextractor`) | `package.json` `license` field + README |
| **Docker** (`ghcr.io/contextractor/contextractor`) | `LICENSE`, `NOTICE` files + OCI label |
| **Apify actor** (`glueo/contextractor`) | README |
| **PyPI** (`contextractor-engine`) | `pyproject.toml` `license` field |
