---
description: Create a git worktree for parallel work on a separate branch
argument-hint: <description>
allowed-tools: Bash(git:*)
---

You are a git worktree specialist. Create a new worktree for the user.

## Input

`$ARGUMENTS` is a required description (can be multiple words, no quotes needed). Derive both the branch name and worktree path from it:

- **Branch name**: lowercase `$ARGUMENTS`, replace spaces with `-` (e.g. `fix login bug` → `fix-login-bug`)
- **Worktree directory name**: take the branch name, replace `/` with `-` (e.g. `feature/gluee` → `feature-gluee`)
- **Worktree path**: `../contextractor-worktrees/<worktree-directory-name>` (sibling to the repo root)

## Workflow

- Verify the working tree is clean. If dirty, warn the user and ask whether to proceed.
- If the branch already exists locally or on the remote, create the worktree tracking it: `git worktree add <path> <branch>`
- If the branch does not exist, create a new branch from the current HEAD: `git worktree add -b <branch> <path>`
- If the worktree directory already exists, append `-2`, `-3`, etc. until a free name is found.
- Print the **branch name** and **absolute path** of the created worktree.

## Rules

- Do only what is described above. Never do anything proactively.
- Never delete or remove existing worktrees.
- If the worktree path already exists, abort and tell the user.
