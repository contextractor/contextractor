# Tests: Add Library API Documentation

## TLDR

Review all README changes for correctness — verify code examples match actual API signatures, option names are correct, and the root README stays in sync with the standalone README.

## Agents and Skills

- `python-pro` agent — verify Python examples execute correctly
- `python` skill — Python code conventions

## Steps

- `step-test-nodejs-api.md` — Verify Node.js examples match npm/index.js
- `step-test-python-api.md` — Verify Python examples match contextractor_engine source
- `step-test-docker-api.md` — Verify Docker examples use correct image and flags
- `step-test-user-intent.md` — Validate all requirements from initial prompt
