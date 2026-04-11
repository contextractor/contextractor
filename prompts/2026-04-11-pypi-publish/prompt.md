# Publish contextractor packages to PyPI

## Goal

Add PyPI publishing to the release workflow, mirroring the `publish-npm` job exactly — version sync from the release tag, OIDC trusted publishing (no stored tokens), two packages published per release:

| PyPI package | Source | Audience |
|---|---|---|
| `contextractor-engine` | `packages/contextractor_engine/` | library |
| `contextractor` | `apps/contextractor-standalone/` | CLI |

## Part 1: Add `publish-pypi` job to `.github/workflows/release.yml`

Add one job after `publish-docker`, depending on `release` (same as `publish-npm` and `publish-docker`).

The job must mirror `publish-npm` step-for-step:

1. `actions/checkout@v4`
2. `astral-sh/setup-uv@v4`
3. **Determine version** — strip `v` prefix from the tag, identical to what `publish-npm` does:
   ```yaml
   - name: Determine version
     id: version
     run: |
       VERSION="${{ needs.release.outputs.tag }}"
       VERSION="${VERSION#v}"
       echo "version=$VERSION" >> "$GITHUB_OUTPUT"
   ```
4. **Set package versions** — sync both packages to the release version:
   ```yaml
   - name: Set package versions
     run: |
       uv version --package contextractor-engine ${{ steps.version.outputs.version }}
       uv version --package contextractor-standalone ${{ steps.version.outputs.version }}
   ```
5. **Build both packages**:
   ```yaml
   - name: Build packages
     run: |
       uv build --package contextractor-engine --out-dir dist/
       uv build --package contextractor-standalone --out-dir dist/
   ```
6. **Publish** — OIDC is picked up automatically from `id-token: write`:
   ```yaml
   - name: Publish to PyPI
     run: uv publish dist/*
   ```

### Full job

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
        uv version --package contextractor-engine ${{ steps.version.outputs.version }}
        uv version --package contextractor-standalone ${{ steps.version.outputs.version }}

    - name: Build packages
      run: |
        uv build --package contextractor-engine --out-dir dist/
        uv build --package contextractor-standalone --out-dir dist/

    - name: Publish to PyPI
      run: uv publish dist/*
```

The published CLI package name on PyPI is `contextractor` (from `[project] name` in `apps/contextractor-standalone/pyproject.toml`). `uv build --package contextractor-standalone` builds the package under its declared name — verify this is `contextractor`, not `contextractor-standalone`.

## Part 2: Verify `pyproject.toml` metadata

PyPI rejects packages with missing required fields. Check both package `pyproject.toml` files and add if missing:

**Both packages need:**
- `license = "MIT"`
- `authors = [{ name = "...", email = "..." }]`
- `readme = "README.md"`
- `[project.urls]` with `Homepage`, `Repository`, `Issues`

**`apps/contextractor-standalone/pyproject.toml`** additionally:
- `[project.scripts]` — already present: `contextractor = "contextractor_cli.main:app"` ✓
- `[tool.hatch.build.targets.wheel] packages = ["src/contextractor_cli"]` — verify present ✓

Create `packages/contextractor_engine/README.md` if it doesn't exist — PyPI requires it.

## Part 3: Configure trusted publishing on PyPI

Must be done manually in the PyPI web UI before the first release. Add instructions to `docs/pypi-trusted-publishing.md`.

Register both packages as pending trusted publishers at https://pypi.org/manage/account/publishing/:

**`contextractor-engine`:**
- PyPI project name: `contextractor-engine`
- GitHub owner: `contextractor`
- Repository: `contextractor`
- Workflow filename: `release.yml`
- Environment: `pypi`

**`contextractor`:**
- PyPI project name: `contextractor`
- GitHub owner: `contextractor`
- Repository: `contextractor`
- Workflow filename: `release.yml`
- Environment: `pypi`

Also create a `pypi` environment in GitHub repo settings (`Settings → Environments → New environment`). No secrets needed.

## Key files

| File | Change |
|---|---|
| `.github/workflows/release.yml` | Add `publish-pypi` job |
| `packages/contextractor_engine/pyproject.toml` | Add missing metadata fields |
| `apps/contextractor-standalone/pyproject.toml` | Add missing metadata fields |
| `packages/contextractor_engine/README.md` | Create if missing |
| `docs/pypi-trusted-publishing.md` | New — manual setup instructions |
