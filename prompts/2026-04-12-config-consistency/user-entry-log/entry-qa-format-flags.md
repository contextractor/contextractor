# Q&A: Format Flags and Audit Depth

## Q1: --format vs --save-* toggles
**Q:** CLI has both `--format` (primary) and `--save-*` (additional). Apify only has per-format toggles. What should happen?
**A:** Remove `--format`. Use only `--save-*` toggles like Apify. Default to markdown if none specified.

## Q2: Missing --save-markdown
**Q:** CLI is missing `--save-markdown`. Add it?
**A:** Yes, add `--save-markdown` for consistency with Apify.

## Q3: Audit depth
**Q:** How deep should the redundancy audit go?
**A:** Full audit + simplify — audit every setting across all 4 channels, actively remove redundant/rarely-used settings.
