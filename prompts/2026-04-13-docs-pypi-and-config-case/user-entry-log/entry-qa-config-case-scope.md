# Q&A: Config Case Convention Scope

**Q:** Should changes be docs + code or docs-only for camelCase enum values in npm?

**A:** Docs + code. The npm wrapper (index.js) must accept camelCase values (`perRequest`, `untilFailure`) and convert them to snake_case (`per_request`, `until_failure`) before passing to the Python CLI.

**Q:** Should Python-facing docs keep snake_case?

**A:** Yes. Python CLI help text and standalone README keep `per_request`/`until_failure` (Python convention). Only npm/JS-facing docs use camelCase.
