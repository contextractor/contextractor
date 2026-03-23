---
description: Push to Apify directly, wait for build, fix errors, and run a test crawl
allowed-tools: Bash(*), Read(*), Edit(*), Write(*), Glob(*), Grep(*), Skill(*)
---

# Push and Get Working

Automated workflow to push code directly to Apify platform, wait for build, fix any build errors until the build succeeds, and then run a test crawl to verify the actor works.

**IMPORTANT:** This is a fully automated workflow. Do NOT ask for confirmation at any step. Execute all steps automatically without pausing for user input.

## Target Actor Selection

Check `$ARGUMENTS` for the target:

- If `$ARGUMENTS` contains `--production` → Push to **production** actor `shortc/contextractor`
- Otherwise → Push to **test** actor `shortc/contextractor-test` (default)

Set the target actor ID based on the argument and use it consistently throughout the workflow.

**Actor location:** `apps/contextractor/`

## Step 0: Run Local Tests (REQUIRED)

Before anything else, run local unit tests to catch issues early:

```
/local-tests:prompt
```

If any tests fail, fix the issues before proceeding. Do NOT continue with the push if tests fail.

---

## Pre-flight Checks (REQUIRED)

### 1. Verify Apify CLI Login

```bash
apify info
```

If not logged in, stop and inform the user to run `apify login` first.

### 2. Verify Actor Target

The `apify push` command uses:
- **Actor name** from `apps/contextractor/.actor/actor.json` (`name` field)
- **Logged-in user** to form `<username>/<actor-name>`

Check the current actor configuration:

```bash
cat apps/contextractor/.actor/actor.json | grep '"name"'
apify info
```

Proceed automatically with the push. Do NOT ask for confirmation - only stop if not logged in.

### 3. Check Git Integration

If `apify info` shows the actor source is "Git repository", proceed anyway - the user invoked this command intentionally.

## Workflow

Execute this loop until the build succeeds:

### 1. Validate Locally First

Validate Python code compiles before pushing:

```bash
python3 -m compileall -q apps/contextractor/src/
```

If local validation fails, fix Python errors before proceeding.

### 2. Push to Apify

Deploy directly to Apify platform from the actor directory:

```bash
# If --production argument was provided:
cd apps/contextractor && apify push shortc/contextractor

# Otherwise (default - test):
cd apps/contextractor && apify push shortc/contextractor-test
```

This uploads source code and triggers a build on Apify infrastructure.

### 3. Wait for Build

Poll build status:

```bash
# Wait for build to start processing
sleep 5

# Check build status
apify builds ls
```

Keep polling every 10-15 seconds until the latest build shows "Succeeded" or "Failed".

### 4. Check Build Result

If **SUCCEEDED**: Proceed to step 5 (Run Test Crawl).

If **FAILED**:
1. Fetch build log using the build ID from `apify builds ls`:
   ```bash
   apify builds log <BUILD_ID>
   ```

2. Analyze the error type:
   - Schema validation errors → Fix `apps/contextractor/.actor/*_schema.json` files
   - Dockerfile errors → Fix `apps/contextractor/Dockerfile`
   - Dependency errors → Fix `apps/contextractor/requirements.txt`, run `pip install -r apps/contextractor/requirements.txt`
   - Python syntax errors → Fix source files, run `python3 -m compileall -q apps/contextractor/src/`
   - Import errors → Check dependencies in `apps/contextractor/requirements.txt`

3. Apply fix locally

4. **Repeat from step 1** (validate locally and push again)

### 5. Run Test Crawl

After a successful build, run the actor with a single test URL to verify it works:

```bash
# Call the actor on the platform with test input (use the target actor based on --production flag)
apify call <TARGET_ACTOR> --input '{"startUrls": [{"url": "https://en.wikipedia.org/wiki/List_of_sovereign_states"}], "maxPagesPerCrawl": 1}'
```

Wait for the run to complete. The `apify call` command will wait and show the output.

If **RUN SUCCEEDED**:
1. Check the dataset output:
   ```bash
   apify runs ls
   # Get the latest run ID, then:
   apify datasets get-items <DATASET_ID>
   ```
2. Report success with run URL and sample output to user.

If **RUN FAILED**:
1. Fetch run log:
   ```bash
   apify runs ls
   apify runs log <RUN_ID>
   ```
2. Analyze the error and fix the source code
3. **Repeat from step 1** (push and rebuild)

## Arguments

$ARGUMENTS - Optional arguments:
- `--production` - Push to production actor `shortc/contextractor` instead of test
- `skip-validation` - Skip local validation step

## Error Type Reference

| Error Pattern | Fix Location |
|--------------|--------------|
| `Invalid input schema` | `apps/contextractor/.actor/input_schema.json` |
| `Invalid output schema` | `apps/contextractor/.actor/output_schema.json` |
| `Invalid dataset schema` | `apps/contextractor/.actor/dataset_schema.json` |
| `COPY failed` | `apps/contextractor/Dockerfile` |
| `pip ERR` | `apps/contextractor/requirements.txt` |
| `SyntaxError:` | Python source files in `apps/contextractor/src/` |
| `IndentationError:` | Python source files in `apps/contextractor/src/` |
| `ModuleNotFoundError:` | Missing dependency in `apps/contextractor/requirements.txt` |
| `ImportError:` | Missing dependency or wrong import |

## Apify CLI Commands Reference

```bash
# Check login status and actor info
apify info

# Login to Apify (if needed)
apify login

# Push to Apify from actor directory (triggers build)
cd apps/contextractor && apify push shortc/contextractor-test  # test
cd apps/contextractor && apify push shortc/contextractor       # production (with --production flag)

# List recent builds
apify builds ls

# Get build log
apify builds log <BUILD_ID>

# Run the actor locally
cd apps/contextractor && apify run

# Call the actor on platform (waits for completion)
apify call <TARGET_ACTOR> --input '{"startUrls": [{"url": "https://en.wikipedia.org/wiki/List_of_sovereign_states"}], "maxPagesPerCrawl": 1}'

# List recent runs
apify runs ls

# Get run log
apify runs log <RUN_ID>

# Get dataset items from a run
apify datasets get-items <DATASET_ID>
```

## Success Criteria

The workflow completes when:
- Pre-flight checks pass (logged in)
- Local `python3 -m compileall -q apps/contextractor/src/` passes
- `apify push` succeeds
- Build status is `SUCCEEDED`
- No errors in build log
- Test crawl run completes successfully
- Dataset contains at least one item with extracted content

Report the final URLs to the user:
- Build: `https://console.apify.com/actors/<actorId>/builds/<buildId>`
- Run: `https://console.apify.com/actors/<actorId>/runs/<runId>`

## Restoring Git Integration

If you need to restore Git integration after using this command:
1. Go to Apify Console → Actor Settings → Source
2. Change source type back to "Git repository"
3. Re-link the repository URL and branch
