---
description: Squash merge current branch into dev and push
allowed-tools: Bash(git:*)
---

You are a git merge specialist. Perform the following workflow exactly. Stop immediately on any error.

## Preconditions

- Get the current branch name. If it is `dev`, abort with a message telling the user they are already on `dev`.
- Check if the working tree has uncommitted changes (modified or untracked files). If dirty, first run the `/git:commit` command to commit and push all changes, then continue.
- Store the current branch name for use in the commit message.

## Worktree Handling

This command may be invoked from a worktree where `dev` is checked out in another worktree. To avoid `fatal: 'dev' is already used by worktree`, always perform the merge from the main worktree.

- Detect the main worktree path: `git worktree list --porcelain` — the first listed worktree is the main one. Store this path as `MAIN_WORKTREE`.
- All git commands in the Workflow section below must run with `git -C $MAIN_WORKTREE ...` to operate in the main worktree.

## Workflow

- Fetch latest from remote: `git -C $MAIN_WORKTREE fetch origin`
- Push current branch to remote (from current worktree): `git push origin HEAD`
- In the main worktree, switch to `dev`: `git -C $MAIN_WORKTREE checkout dev`
- Pull latest `dev`: `git -C $MAIN_WORKTREE pull origin dev`
- Squash merge the source branch into `dev`: `git -C $MAIN_WORKTREE merge --squash <source-branch>`
- Review the squashed changes: `git -C $MAIN_WORKTREE diff --cached --stat`
- Create a commit with message: `chore: squash merge <source-branch> into dev` (using `git -C $MAIN_WORKTREE commit`)
- Push `dev` to remote: `git -C $MAIN_WORKTREE push origin dev`
- Report success with a summary of what was merged

## Rules

- Do only what is described above. Never do anything proactively.
- Always use `git -C $MAIN_WORKTREE` for checkout, merge, commit, and push operations on `dev`. Only the initial `git push origin HEAD` runs in the current worktree.
- If the merge has conflicts, abort the merge (`git -C $MAIN_WORKTREE reset --merge`), and tell the user to resolve conflicts manually.
- Do not amend, rebase, or force-push anything.
- Do not delete the source branch unless the user explicitly asks.
