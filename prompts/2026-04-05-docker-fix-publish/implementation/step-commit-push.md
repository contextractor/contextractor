# TLDR

Commit all changes made during previous steps and push to remote.

**Touches:** git history

## Instructions

1. Run `git status` to see all changed files
2. Review changes with `git diff` — ensure no secrets, no test artifacts
3. Stage relevant files (workflow changes, Dockerfile fixes — NOT test output)
4. Commit with a descriptive message summarizing what was fixed
5. Push to remote: `git push origin main`
6. If a new release is needed, use `/git:release` skill
