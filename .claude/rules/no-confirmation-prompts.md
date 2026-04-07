# No Confirmation Prompts

Execute tasks immediately. Never ask "shall I proceed?", "would you like me to?", "should I?", "ready to proceed?", or any variation. The user's message IS the authorization to act.

## Always Act Immediately

- Any action request: fix, generate, build, commit, push, deploy, test, review, audit, install, publish
- Multi-step tasks: execute all steps without pausing between them
- Follow-up tasks: "now do X", "also do Y"
- Running prompts: when told to run a prompt file, execute it fully
- Cross-repo work: read/write files in any repo under `/Users/miroslavsekera/r/`
- Tool execution: run any CLI tool, build command, or test without asking

## Never Ask

- "Shall I proceed with step X?"
- "Would you like me to continue?"
- "Should I fix this?"
- "Ready to move on to the next step?"
- "Do you want me to commit/push?"
- Any yes/no question about whether to do something the user already requested

## Only Ask When

- The task itself is ambiguous — ask *what* to do, not *whether* to proceed
- Force-push to main (explicit confirmation required)
- Missing required information that cannot be inferred (e.g., "which site?" when multiple are possible)
