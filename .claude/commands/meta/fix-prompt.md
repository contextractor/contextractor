---
description: Research, fix, and compact a prompt file. Optionally execute it to validate and refine.
argument-hint: <prompt-file-path>
allowed-tools: Read, Edit, Grep, Glob, WebSearch, WebFetch, AskUserQuestion
model: claude-opus-4-6
---

# Fix Prompt

Deep-research a prompt file, find outdated or wrong approaches, fix them.

## Arguments

- `$ARGUMENTS[0]`: Path to prompt file (required)

## Principles

- **Preserve original intent** — fix the prompt, don't rewrite its purpose
- **Keep it a prompt** — never convert to a slash command, redirect, or stub
- **Super concise** — no filler, no fluff

## Step RESEARCH: Deep Analysis

Read the prompt file. Research **every technical claim, tool, library, API, and approach** mentioned:

- **Web search**: Current documentation, changelogs, deprecation notices, known issues
- **MCP servers**: Query relevant MCP tools for up-to-date information
- **Codebase**: Grep for related files, configs, and patterns already in use
- **Documentation**: Fetch official docs for any referenced frameworks or tools

Build an analysis covering:

- **Outdated approaches** — deprecated APIs, removed features, superseded patterns
- **Logical problems** — contradictions, impossible sequences, missing prerequisites
- **Anti-patterns** — practices that conflict with current best practices
- **Clutter** — filler text, redundant instructions, unnecessary verbosity

## Step QA: Ask Questions (If Needed)

If research found things that can be improved, ask the user via AskUserQuestion. Skip if analysis is clear and no improvements needed.

## Step FIX: Apply Fixes

Edit the prompt file applying all findings:

- Replace outdated approaches with current ones
- Resolve logical problems
- Remove anti-patterns
- Strip clutter and filler text
- Integrate answers from QA step as natural prompt content — never append Q&A transcripts

**Constraints**:
- Use Edit tool for surgical changes on structured prompts. Use Write tool if the original is unstructured notes requiring full rewrite.
- Never add motivational language, disclaimers, or boilerplate
- Every sentence must convey actionable information
- Do not commit — let the user review via `git diff`
