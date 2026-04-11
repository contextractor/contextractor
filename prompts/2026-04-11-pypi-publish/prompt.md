# Publish contextractor to PyPI

## Goal

Add PyPI publishing to the release workflow — single `contextractor` package with engine bundled inside the wheel. Uses OIDC trusted publishing (no stored tokens).

| PyPI package | Source | Contents |
|---|---|---|
| `contextractor` | `apps/contextractor-standalone/` | CLI + engine (bundled via force-include) |

## Part 1: Package name and metadata

`apps/contextractor-standalone/pyproject.toml` must have `name = "contextractor"` (not `contextractor-standalone`).

Required metadata:
- `authors = [{ name = "...", email = "..." }]`
- `readme = "README.md"`
- `[project.urls]` with `Homepage`, `Repository`, `Issues`

Engine code is bundled via hatch force-include — no separate `contextractor-engine` package on PyPI:

```toml
[tool.hatch.build.targets.wheel]
packages = ["src/contextractor_cli"]

[tool.hatch.build.targets.wheel.force-include]
"../../packages/contextractor_engine/src/contextractor_engine" = "contextractor_engine"
```

The `contextractor-engine` dependency should be removed from `[project] dependencies` (replaced by `trafilatura>=2.0.0` directly). The workspace `[tool.uv.sources]` section is also removed since the engine is no longer a declared dependency.

After changes, run `uv lock` to update the lockfile.

## Part 2: Add `publish-pypi` job to `.github/workflows/release.yml`

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

    - name: Set package version
      run: uv version --package contextractor --frozen ${{ steps.version.outputs.version }}

    - name: Build wheel
      run: uv build --package contextractor --wheel --out-dir dist/

    - name: Publish to PyPI
      run: uv publish dist/*
```

`--frozen` on `uv version` prevents re-locking in CI. `--wheel` is required because force-include paths are relative to the checkout and don't survive sdist extraction. `uv publish` auto-detects OIDC from `id-token: write`.

## Part 3: Configure trusted publishing on PyPI

Manual steps — must be done in the PyPI web UI before the first release. Add instructions to `docs/pypi-trusted-publishing.md`.

Register one pending publisher at https://pypi.org/manage/account/publishing/:

| Field | Value |
|---|---|
| PyPI project name | `contextractor` |
| GitHub owner | `contextractor` |
| Repository | `contextractor` |
| Workflow filename | `release.yml` |
| Environment | `pypi` |

Also create a `pypi` environment in GitHub repo settings (`Settings > Environments > New environment`). No secrets needed.

## Key files

| File | Change |
|---|---|
| `apps/contextractor-standalone/pyproject.toml` | Rename to `contextractor`, add metadata, force-include engine, remove engine dep |
| `.github/workflows/release.yml` | Add `publish-pypi` job (single package, wheel only) |
| `docs/pypi-trusted-publishing.md` | New — manual setup instructions |
