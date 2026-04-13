# CLI Multi-Format Output: Best Practices Research

## Real-world precedents for "save to multiple file formats"

| Tool | Mechanism | Notes |
|------|-----------|-------|
| nmap | `-oN`, `-oX`, `-oG` per-format flags + `-oA` for all | Strongest file-output precedent |
| scrapy | `-o items.json -o items.csv` (repeated) | File-writer tool |
| yt-dlp | `-f 22,17,18` comma-separated | Format selection from known set |
| kubectl | `-o json` single value | stdout-only, not applicable |
| trafilatura | `--output-format {csv,json,...}` single value | Only one format per run |

## Why comma-separated wins for contextractor

- Small fixed enum (7 formats) — not open-ended
- Users commonly want 2-3 formats at once
- `--save markdown,json` more ergonomic than `--save markdown --save json`
- Contextractor already uses comma-separated pattern for `--globs` and `--excludes`
- Shell completion less important for known short enum

## Typer/Click implementation

Comma-separated values require a custom parser in Typer:
```python
save: Annotated[Optional[str], typer.Option("--save", help="Output formats (comma-separated)")] = None
```
Then split on comma in the handler. Typer's `multiple=True` would require repeated flags.

## `all` shortcut

nmap's `-oA` pattern — a single keyword that expands to all formats. Standard practice for tools with multiple output formats.
