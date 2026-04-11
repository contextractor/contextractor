# Publish contextractor packages to PyPI

## Goal

Add PyPI publishing to the release workflow — version sync from release tag, OIDC trusted publishing (no stored tokens), two packages per release:

| PyPI package | Source | Audience |
|---|---|---|
| `contextractor-engine` | `packages/contextractor_engine/` | library |
| `contextractor` | `apps/contextractor-standalone/` | CLI |

## Part 1: Rename standalone package for PyPI

`apps/contextractor-standalone/pyproject.toml` currently has `name = "contextractor-standalone"`, which publishes as `contextractor-standalone` on PyPI. Change to `name = "contextractor"` so the CLI installs as `pip install contextractor`.

After renaming, run `uv lock` to update the lockfile.

## Part 2: Verify `pyproject.toml` metadata

PyPI rejects packages with missing required fields. Check both package `pyproject.toml` files and add if missing:

**Both packages need:**
- `authors = [{ name = "...", email = "..." }]`
- `readme = "README.md"`
- `[project.urls]` with `Homepage`, `Repository`, `Issues`

Create `packages/contextractor_engine/README.md` if it doesn't exist — PyPI requires it when `readme` is declared.

## Part 3: Add `publish-pypi` job to `.github/workflows/release.yml`

Add one job depending on `release` (same as `publish-npm` and `publish-docker`).

```yaml
publish-pypi:
  needs: release
  runs-on: ubuntu-latest
  environment: pypi
  permissions:
    contents: read
    id-token: write
  steps:
    - uses: actions/checkout@v4
    - uses: astral-sh/setup-uv@v4

    - name: Determine version
      id: version
      run: |
        VERSION="${{ needs.release.outputs.tag }}"
        VERSION="${VERSION#v}"
        echo "version=$VERSION" >> "$GITHUB_OUTPUT"

    - name: Set package versions
      run: |
        uv version --package contextractor-engine --frozen ${{ steps.version.outputs.version }}
        uv version --package contextractor --frozen ${{ steps.version.outputs.version }}

    - name: Build packages
      run: |
        uv build --package contextractor-engine --out-dir dist/
        uv build --package contextractor --out-dir dist/

    - name: Publish to PyPI
      run: uv publish dist/*
```

`--frozen` on `uv version` prevents re-locking in CI. `uv publish` auto-detects OIDC from `id-token: write`.

## Part 4: Configure trusted publishing on PyPI

Manual steps — must be done in the PyPI web UI before the first release. Add instructions to `docs/pypi-trusted-publishing.md`.

Register both packages as pending trusted publishers at https://pypi.org/manage/account/publishing/:

| Field | `contextractor-engine` | `contextractor` |
|---|---|---|
| PyPI project name | `contextractor-engine` | `contextractor` |
| GitHub owner | `contextractor` | `contextractor` |
| Repository | `contextractor` | `contextractor` |
| Workflow filename | `release.yml` | `release.yml` |
| Environment | `pypi` | `pypi` |

Also create a `pypi` environment in GitHub repo settings (`Settings → Environments → New environment`). No secrets needed.

## Key files

| File | Change |
|---|---|
| `apps/contextractor-standalone/pyproject.toml` | Rename to `contextractor`, add metadata |
| `packages/contextractor_engine/pyproject.toml` | Add metadata fields |
| `packages/contextractor_engine/README.md` | Create if missing |
| `.github/workflows/release.yml` | Add `publish-pypi` job |
| `docs/pypi-trusted-publishing.md` | New — manual setup instructions |
