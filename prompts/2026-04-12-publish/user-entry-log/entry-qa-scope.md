# Q&A: Prompt Scope and Testing

## Q1: Scope
**Q:** Should this cover full publish flow or only post-publish verification?
**A:** Replace /publish:all — merge existing publish command with new verification steps into a single prompt.

## Q2: Test scope
**Q:** What test URL and verification for published packages?
**A:** Full test matrix — test multiple URLs, all output formats, key extraction options, verify output content quality.

## Q3: Fix flow
**Q:** When a published package has issues, what's the expected fix flow?
**A:** Fix + re-release — fix the code, bump patch version, and publish a new release automatically.
