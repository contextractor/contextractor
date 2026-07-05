# Migration Test Follow-up

## Goal

Finish the remaining work from the `prompts/2026-04-26-migrate-py-to-ts-rust-v2/tests/master.md` run.

## Remaining work

- [ ] Reconfigure `glueo/contextractor-test` in Apify Console to use a Git-connected build instead of `SOURCE_FILES`.
- [ ] Point the test actor at this repository and the `apps/apify-actor/` folder.
- [ ] Verify the remote actor uses the migrated setup:
  - `apps/apify-actor/.actor/actor.json`
  - `dockerContextDir = "../../.."`
  - multi-stage Dockerfile
  - `npm run deploy --prod -w @contextractor/apify -- /deploy`
- [ ] Trigger a new build for `glueo/contextractor-test` and confirm the latest build finishes with `SUCCEEDED`.
- [ ] Run a remote smoke test against `glueo/contextractor-test` and confirm it produces non-empty extracted output.
- [ ] Run `tools/platform-test-runner/` against `glueo/contextractor-test` after the remote actor is updated.
- [ ] Confirm `glueo/contextractor` production did not change during the verification run.

## Notes

- Local verification already passed:
  - `npm ci`
  - `npm run build -ws --if-present`
  - `npm run lint -ws --if-present`
  - `npm run test -ws --if-present`
  - `cargo build --workspace`
  - `cargo clippy --workspace --all-targets -- -D warnings`
  - `cargo test --workspace`
  - `npx biome check .`
  - local `apify run`
  - standalone CLI smoke run
- Follow-up prompt for the `r/tools` repo already exists:
  - `/Users/miroslavsekera/r/tools/prompts/2026-04-26-propagate-contextractor-rewrite/`
- Current remote status captured during the last run:
  - `glueo/contextractor-test`: latest build `0.3.1`, `SUCCEEDED`, finished `2026-04-26T15:45:29.126Z`, source type `SOURCE_FILES`
  - `glueo/contextractor`: latest build `0.3.7`, `SUCCEEDED`, finished `2026-04-26T18:25:17.313Z`, source type `SOURCE_FILES`
