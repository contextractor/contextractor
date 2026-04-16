# Sync Docs and Verify Consistency

Run the sync commands to ensure all documentation and package internals are consistent after the doc changes.

## Run `/sync:docs`

Execute `/Users/miroslavsekera/r/contextractor/.claude/commands/sync/docs.md`

This syncs READMEs, CLI reference, config tables, and format lists across all doc files.

## Run `/sync:gui`

Execute `/Users/miroslavsekera/r/contextractor/.claude/commands/sync/gui.md`

This verifies internal package consistency — config fields, output formats, CLI flags, and engine models all agree.

## Success Criteria

- All READMEs are in sync with CLI source of truth
- No stale or missing options in any doc
- Internal package fields are consistent
- Changes committed and pushed
