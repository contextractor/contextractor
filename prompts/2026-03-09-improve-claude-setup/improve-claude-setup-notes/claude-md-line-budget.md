# CLAUDE.md Line Budget Analysis

Current: 170 lines. Target: under 100 lines.

## Removable (covered by apify-actor-development skill)
- "What are Apify Actors?" (4 lines)
- "Core Concepts" (7 lines)
- "Do" list (18 lines)
- "Don't" list (11 lines)
- Total removable: ~40 lines → leaves ~130 lines

## To reach under 100 lines
Must also compress:
- Commands section: remove `pip install`/`pip freeze` lines (project uses uv), compress to ~8 lines
- Testing section: remove code example, compress to ~10 lines
- Project Structure: compress tree to essential paths only (~8 lines)
- Header/generatedBy note: can be trimmed

## Project-specific Do/Don't items
All items in the Do/Don't lists are covered by the `apify-actor-development` skill, including the `Dataset.get_info()` caveat. Safe to remove entirely.
