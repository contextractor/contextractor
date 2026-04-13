# Step 6: Update Tests

## TLDR

Rewrite output toggle tests in test_cli.py and test_config.py to use the new `--save` flag and `save` list config. Add validation tests for format names and `all` expansion.

## Changes

### `apps/contextractor-standalone/tests/test_cli.py`

**Replace `test_output_toggle_flags()` (lines 208-226)** with tests for:
- `--save markdown` produces `save: ["markdown"]`
- `--save xml,json` produces `save: ["xml", "json"]`
- `--save all` produces all 7 formats
- No `--save` flag produces default `["markdown"]`
- Invalid format name raises error

**Replace `test_save_markdown_default()` (lines 229-234)** with:
- Test that default config has `save: ["markdown"]`

**Replace `test_disable_markdown()` (lines 237-247)** with:
- Test that `--save json` does NOT include markdown (explicit override semantics)

### `apps/contextractor-standalone/tests/test_config.py`

**Replace `test_from_dict_output_toggles()` (lines 180-197)** with:
- `from_dict({"save": ["xml", "json"]})` → `config.save == ["xml", "json"]`
- `from_dict({})` → `config.save == ["markdown"]`

**Replace `test_from_dict_apify_long_names()` (lines 200-215)**: Remove entirely — old Apify boolean keys are no longer accepted in config files.

**Replace `test_from_dict_short_names_override_long()` (lines 218-225)**: Remove entirely — no longer applicable.

**Add new tests**:
- `test_validate_save_formats_all()` — verifies `all` expands to all 7
- `test_validate_save_formats_invalid()` — verifies ValueError on bad names
- `test_validate_save_formats_dedup()` — verifies duplicates removed
- `test_save_list_merge()` — verifies CLI overrides replace config save list entirely
