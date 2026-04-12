# QA: Prompt Scope

**Q:** The previous config-consistency work (v0.3.9) already aligned --save-* toggles. This prompt also asks to publish and verify. Should the new prompt include a full publish+verify cycle, or just the config key sync?

**A:** Config sync + publish + verify. Full cycle: fix extraction key naming, sync docs, publish to all channels, download and verify each artifact.
