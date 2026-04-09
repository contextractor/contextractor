# Position website as a playground for CLI, Docker, and Apify Actor

## Goal

Update all documentation in `/Users/miroslavsekera/r/contextractor` so it's clear that contextractor.com is a **playground** — a web interface for trying out extraction settings and generating ready-to-use commands — not the primary product. The primary ways to use Contextractor are CLI, Docker, and Apify Actor. The website helps you configure and preview before running real workloads.

## Messaging hierarchy

1. **Contextractor** = web content extraction tool (CLI, Docker, Apify Actor)
2. **contextractor.com** = playground for configuring settings, previewing extraction, and generating commands
3. The website is NOT a standalone product — it's a companion to the real tools

## Key phrasing

- "Try the playground at contextractor.com" (not "use the tool at")
- "Configure extraction settings and generate CLI, Docker, or Apify commands"
- "Preview results before running real workloads"
- The playground is for exploration; production use is via CLI/Docker/Apify

## Files to update

### `README.md` (repo root)

Current line 7: `Try the [Playground](https://contextractor.com) to configure extraction settings and preview commands before running.`

This is already good. Verify the rest of the README emphasizes CLI/Docker/Apify as primary, and the website as playground only.

### `apps/contextractor-apify/README.md`

Verify features section mentions the playground as a companion tool, not the primary experience. Add a line like:
> Try the [Playground](https://contextractor.com) to configure extraction settings and preview results before running the Actor.

### `apps/contextractor-standalone/npm/README.md`

Must match the root README (they should already be identical via sync).

### `docs/spec/functional-spec.md`

Update the overview section to list deployment targets in order of importance:
1. CLI (standalone binary via npm/pipx)
2. Docker (container image)
3. Apify Actor (cloud platform)
4. Web playground (contextractor.com) — for configuration preview only

## Do NOT change

- Any code or functionality
- The `.claude/` directory
- Test files
- The actual website code (that's in the tools repo)

## After updating docs

Run these sync commands in order:

```bash
# 1. Sync docs within this repo
```
Execute `/Users/miroslavsekera/r/contextractor/.claude/commands/sync/docs.md`

```bash
# 2. Verify internal consistency
```
Execute `/Users/miroslavsekera/r/contextractor/.claude/commands/sync/gui.md`
