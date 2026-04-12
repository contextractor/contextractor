# Q&A: Universal Dual-Case Config Acceptance

**Q:** Should both `snake_case` and `camelCase` be accepted everywhere?

**A:** Yes — in JSON configs, YAML configs, and CLI switches. Both `max_pages` and `maxPages` must work. Both `per_request` and `perRequest` must work as enum values. Normalization should happen in one central place (engine utils already has `normalize_config_keys`).

**Q:** What about the Apify input schema?

**A:** Leave Apify schema as-is — it uses its own conventions (`PER_REQUEST`, `UPPER_SNAKE` for enums, `camelCase` for keys) and dual-casing it would be too complicated.

**Q:** Should this be extensively documented?

**A:** No. It should just work silently. Don't complicate docs with it.
