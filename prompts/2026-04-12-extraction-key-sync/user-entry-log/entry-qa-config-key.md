# QA: Config Key Naming

**Q:** The CLI config file uses `extraction` as the key for Trafilatura settings, while Apify uses `trafilaturaConfig`. How should we align them?

**A:** Rename to `trafilaturaConfig` only. Replace `extraction` with `trafilaturaConfig` everywhere. Breaking change for existing CLI config file users.

**Q:** Renaming is a breaking change. Should we maintain backward compatibility?

**A:** Hard rename, no compat. Remove `extraction` entirely. Users must update config files. Clean break, single key everywhere.
