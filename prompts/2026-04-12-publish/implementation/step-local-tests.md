# Step 1: Local Tests and Validation

## TLDR

Run local pytest suite, validate Python compilation, verify Apify login. Gate for all subsequent steps.

## Steps

Unless `--skip-tests` is in `$ARGUMENTS`:

1. Run tests:
   ```bash
   .venv/bin/python -m pytest apps/contextractor-standalone/tests/ -v
   ```

2. Validate Python syntax:
   ```bash
   .venv/bin/python -m compileall -q apps/contextractor-apify/src/
   ```

3. Verify Apify login:
   ```bash
   apify info
   ```
   If not logged in, stop and tell the user to run `! apify login`.

4. Verify clean git state:
   ```bash
   git status --porcelain
   ```
   Commit or warn if dirty.

If any test fails, stop and fix before proceeding.
