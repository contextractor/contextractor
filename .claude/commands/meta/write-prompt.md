---
description: Research, structure, and produce implementation prompts from a raw prompt idea
argument-hint: <raw-meta-prompt> [--- optional instructions after separator]
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, WebSearch, WebFetch, AskUserQuestion, Task
model: claude-opus-4-6
---

# Write Prompt

Transform a raw prompt idea into structured, validated prompt files. Produces user intent capture and implementation steps (including a final review/test/autofix step). Does **not** execute the prompt.

## Arguments

- `$ARGUMENTS`: Contains the raw meta-prompt (required). If `---` separator is present, text after it is treated as optional instructions/overrides.

## Principles

- **Add only critically required text** — every added word must earn its place
- **Super concise** — no filler, no fluff, no motivational phrasing
- **No code examples** — reference documentation or MCP servers instead
- **Preserve original intent** — fix the prompt, don't rewrite its purpose
- Follow `@/.claude/rules/meta/formatting-guidelines.md`

## Output Structure

All output goes to `@/prompts/{date}-{slug}/`:

```
@/prompts/{date}-{slug}/
├── {slug}-notes/                  # Research findings
├── user-entry-log/                # User intent capture
│   ├── entry-initial-prompt.md
│   ├── entry-instructions.md
│   └── entry-qa-*.md
└── implementation/                # Implementation prompts
    ├── master.md
    ├── step-*.md
    └── step-review.md             # Final step: review, test, autofix
```

## Step CLEAN_GIT: Verify Clean Working Directory

Run `git status --porcelain`. If output is not empty, stop with error:

> "Git working directory must be clean. Commit or stash changes before running this command."

## Step SAVE: Create Directory Structure and Log Input

- Derive a topic slug from the raw prompt content (kebab-case, concise)
- Create `@/prompts/{today's date}-{slug}/` with subdirectories: `user-entry-log/`, `implementation/`
- If `$ARGUMENTS` is a file path that exists, **move** the original file exactly as-is to `user-entry-log/entry-initial-prompt.md` — no headers, no modifications, no reformatting
- If `$ARGUMENTS` is raw text, save it **verbatim** as `user-entry-log/entry-initial-prompt.md`
- Save a copy as working file `{slug}.md` at prompt root
- If optional instructions were provided (after `---` separator), save as `user-entry-log/entry-instructions.md`
- If the user pasted attachments (images, screenshots, diagrams), save each file into `user-entry-log/` with a descriptive name and add a markdown link to it from `entry-initial-prompt.md`

## Step RESEARCH: Deep Analysis

Read the working file. Research **every technical claim, tool, library, API, and approach** mentioned:

- **Web search**: Current documentation, changelogs, deprecation notices, known issues
- **MCP servers**: Query relevant MCP tools for up-to-date information
- **Codebase**: Grep for related files, configs, and patterns already in use
- **Documentation**: Fetch official docs for any referenced frameworks or tools

Build an analysis covering:

- **Typos and grammar** — fix all spelling, punctuation, and formatting errors
- **Outdated approaches** — flag deprecated APIs, removed features, superseded patterns
- **Logical problems** — contradictions, impossible sequences, missing prerequisites
- **Anti-patterns** — practices that conflict with current best practices
- **Missing structure** — add headers and named steps where the prompt lacks them
- **Clutter** — identify filler text, redundant instructions, unnecessary verbosity

## Step NOTES: Persist Research Findings

Save detailed research findings to `{slug}-notes/` at the prompt root.

**What to save** — one focused `.md` file per topic:

- Deprecation discoveries (what changed, what replaces it, links)
- Implementation gotchas found via web research
- Version-specific behavior differences
- Edge cases and workarounds
- Links to key documentation pages and GitHub issues

**What NOT to save**:

- Obvious or trivial findings
- Information already in the codebase's rules or CLAUDE.md
- Temporary debugging notes

**File naming**: `{topic}.md` (e.g., `turbopack-svg-handling.md`, `redirect-patterns.md`)

Skip if research produced no substantial findings worth persisting.

Every notes file must be referenced from the implementation steps. Notes that aren't referenced are invisible to implementers.

## Step QA_BEFORE: Pre-Fix Questions (MANDATORY Review)

**Default: ASK.** If anything is even slightly unclear, ambiguous, or open to interpretation — ask. It is always better to ask too many questions than to implement something wrong. Wrong implementation wastes far more time than a few clarifying questions.

Use AskUserQuestion to clarify:

- Ambiguous scope or boundaries ("does this apply to X or also Y?")
- Unclear intent behind a phrase or instruction
- Multiple valid interpretations of a requirement
- Missing context that affects implementation approach
- Assumptions you'd need to make without asking

Log each Q&A exchange as a separate file in `user-entry-log/` (e.g., `entry-qa-redirect-scope.md` with the question and answer). Reference each logged entry from the implementation steps where relevant.

Only skip if the prompt is unambiguous and every requirement has a single clear interpretation.

## Step FIX: Apply Fixes to Working File

Edit the working file (`{slug}.md`) applying all findings:

- Fix typos, grammar, formatting
- Replace outdated approaches with current ones
- Resolve logical problems
- Remove anti-patterns
- Add missing structure (named steps, headers)
- Strip all clutter and filler text
- Remove code examples (replace with doc references)
- Add inline references to notes files where relevant
- Add inline references to user-entry-log files where relevant

**Constraints**:
- Use Edit tool for surgical changes on structured prompts. Use Write tool if the original is unstructured notes requiring full rewrite.
- Never add motivational language, disclaimers, or boilerplate
- Every sentence must convey actionable information

## Step SPLIT: Create Implementation Steps

Split the fixed working file into step files inside `implementation/`. **Always split** — even simple prompts get at least one step file.

**For each step file** (`implementation/step-{name}.md`):
- Standalone executable prompt that can be run independently
- Starts with a **TLDR** (2-5 lines) — what it does and what it touches
- References relevant notes files and user-entry-log entries

**Create `implementation/master.md`**:
- Starts with a **TLDR** summarizing the entire prompt's goal and codebase impact
- Lists all step files in execution order with one-line descriptions (including `step-review.md` as the final step)
- Includes shared context needed across steps
- Must be concise — only TLDR, step list, and shared context

Delete the working file `{slug}.md` after splitting — the content now lives in implementation steps.

## Step GENERATE_REVIEW: Create Final Review Step

Create `implementation/step-review.md` as the **last step** in the implementation sequence:

- An executable prompt that reviews and tests all code changes from prior steps
- Runs `git diff` to capture the full set of changes
- For each prior `step-*.md`, reviews code changes against its instructions
- Runs relevant tests and build verification
- References all files in `user-entry-log/` (initial prompt, instructions, Q&A entries)
- For each requirement in `entry-initial-prompt.md`, verifies which implementation step covers it
- Verifies all Q&A decisions from `entry-qa-*.md` are reflected in the code
- Flags gaps (requirements not covered) and mismatches (contradictions with user intent)
- **Automatically fixes** all discovered issues — code quality problems, test failures, missing edge cases, and deviations from user intent
