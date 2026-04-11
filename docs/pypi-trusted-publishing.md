# PyPI Trusted Publishing Setup

One-time manual setup required before the first release that publishes to PyPI.

Users install with `pip install contextractor` — this pulls in `contextractor-engine` as a dependency automatically. Both packages must be registered on PyPI, but only `contextractor` is user-facing.

## 1. Register pending publishers on PyPI

Go to https://pypi.org/manage/account/publishing/ and add two pending publishers:

### contextractor-engine (internal dependency)

| Field | Value |
|---|---|
| PyPI project name | `contextractor-engine` |
| GitHub owner | `contextractor` |
| Repository | `contextractor` |
| Workflow filename | `release.yml` |
| Environment | `pypi` |

### contextractor (user-facing CLI)

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
