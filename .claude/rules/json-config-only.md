# JSON Config Only in Documentation

All documentation, help text, examples, and user-facing references must use JSON for configuration files — never YAML.

## Rule

- Document config files as `.json` only (e.g., `config.json`, not `config.yaml`)
- CLI help strings: "Path to JSON config file"
- Examples: always show JSON format
- README, specs, JSDoc: reference JSON config only

## Implementation Note

The code silently supports YAML for backward compatibility, but YAML must not appear in any documentation, help text, or examples. Do not remove YAML support from the code — only from docs.
