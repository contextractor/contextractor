# Step 5: Review

## TLDR
Final review of all changes from steps 1-4 across both repos.

## Review checklist

### 1. Run `git diff` in both repos

### 2. Verify against requirements
- See `user-entry-log/entry-initial-prompt.md` — original request
- See `user-entry-log/entry-qa-decisions.md` — decisions

Checklist:
- [ ] Docs updated to reflect CLI-first (URLs as positional args, --config optional, all flags)
- [ ] Site help has web app section (existing)
- [ ] Site help has CLI section (full reference)
- [ ] Site help has Docker section
- [ ] Site help has Apify section (existing)
- [ ] help-blurb.md mentions all 4 modes
- [ ] Logo files deleted from repo root
- [ ] No broken references to deleted logos
- [ ] Both repos committed

### 3. Visual verification
- Run the site and check `/help/` page renders correctly

### 4. Autofix any issues found
