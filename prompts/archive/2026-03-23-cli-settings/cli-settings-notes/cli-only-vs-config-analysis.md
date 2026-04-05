# CLI-only vs Config File: Analysis

## Short answer: CLI-only is NOT recommended for contextractor

With ~30 settings (and growing toward Apify parity), pure CLI-only creates UX problems.

## Industry patterns

| Pattern | Examples | When appropriate |
|---------|----------|-----------------|
| CLI-only | ffmpeg | Every invocation is unique |
| CLI-first + optional config | curl, ripgrep, wget, yt-dlp | Moderate settings, repeated use |
| Config-first + CLI overrides | prettier, eslint | Per-project settings, team sharing |

## Why CLI-only fails for contextractor

1. **30 settings** — too many for comfortable CLI invocation
2. **Repeated use** — users scrape same sites/patterns repeatedly
3. **Nested settings** — extraction config has 15+ sub-options, awkward as flat flags
4. **No team sharing** — can't check CLI aliases into version control
5. **Shell history tax** — users create ad-hoc aliases/scripts, which are fragile and non-portable

## Recommended: CLI-first with optional config (yt-dlp model)

Precedence (lowest → highest):
1. Built-in defaults
2. User-level config (`~/.config/contextractor/config.toml`)
3. Project-level config (`contextractor.toml` in cwd)
4. Environment variables (`CONTEXTRACTOR_*`)
5. CLI arguments (always wins)

Key principles:
- **Works with zero config**: `contextractor https://example.com` must work
- **Every config key has a CLI equivalent** — no config-only settings
- **--config flag** for explicit config path
- **--no-config** to ignore files (scripting predictability)
- **TOML format** (modern, comments, Python stdlib since 3.11)

## What the current CLI already does well
- Config file + CLI override merge is correct pattern
- camelCase/snake_case normalization is solid

## What to change
- Make config file **optional** (not required positional arg)
- Add CLI flags for ALL settings (URLs as positional args)
- Support auto-discovery of project-level config
- Consider TOML alongside YAML/JSON
