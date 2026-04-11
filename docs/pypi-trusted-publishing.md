# PyPI Trusted Publishing Setup

One-time manual setup required before the first release that publishes to PyPI.

Only the `contextractor` package is published — the engine code is bundled inside the wheel.

## 1. Register pending publisher on PyPI

Go to https://pypi.org/manage/account/publishing/ and add one pending publisher:

| Field | Value |
|---|---|
| PyPI project name | `contextractor` |
| GitHub owner | `contextractor` |
| Repository | `contextractor` |
| Workflow filename | `release.yml` |
| Environment | `pypi` |

## 2. Create GitHub environment

Go to `Settings > Environments > New environment` in the GitHub repo and create an environment named `pypi`. No secrets needed — OIDC handles authentication automatically.

## How it works

The `publish-pypi` job in `.github/workflows/release.yml` uses `id-token: write` permission to request an OIDC token from GitHub. PyPI verifies this token against the registered trusted publisher configuration. No API tokens or passwords are stored anywhere.
