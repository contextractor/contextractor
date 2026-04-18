---
description: Archive prompt text or file to @/prompts/ — words verbatim, clutter trimmed
allowed-tools: Read, Write, Bash, Glob, Grep, AskUserQuestion
model: claude-opus-4-7
argument-hint: <prompt text or file path>
---

# Store Prompt

Save raw prompt text or move an existing prompt file into the organized `@/prompts/` directory. Words are saved **exactly verbatim** — only trim clutter (stray `\`, extra line breaks, extra tabs/spaces).

## Input

`$ARGUMENTS` = either raw prompt text **or** a file path to an existing prompt file.

## Step DETECT: Determine Input Type

Check if `$ARGUMENTS` is a file path:
- Use the Read tool to check if the path exists as a file
- If it exists, treat as **file mode** (move the file)
- If it does not exist, treat as **text mode** (save raw text)

## Step NAME: Determine Topic Name

**Text mode**: Analyze the prompt text to extract a short kebab-case topic name.
**File mode**: Read the file content and extract the topic from its content and/or filename.

- Derive from the main subject/intent of the prompt
- Keep it concise: 2-4 words max
- Ask the user if the topic is unclear

## Step PATH: Build the File Path

Destination: `@/prompts/YYYY-MM-DD-<topic>/prompt.md`

- Use today's date for the `YYYY-MM-DD` prefix
- `<topic>` is the kebab-case topic name from Step NAME
- If only one prompt file is needed, name it `prompt.md`
- If the directory already exists, add the file to it (ask user for filename if `prompt.md` already exists)

## Step SAVE: Write or Move the File

Create the directory:
```bash
mkdir -p @/prompts/YYYY-MM-DD-<topic>
```

**Text mode**:
- Write the prompt text using the Write tool
- Words stay **exactly verbatim** — never rephrase, reword, reorder, or add/remove words
- Only trim clutter characters: stray `\`, excessive consecutive line breaks (collapse 3+ to 2), leading/trailing whitespace on lines, extra tabs
- Do NOT change any wording, spelling, punctuation, or meaning

**File mode**:
- Move the file to the new location using `mv`
- Apply the same clutter-trimming rules before saving
- Words stay **exactly verbatim**

## Step CONFIRM: Report Result

Display:
- The full file path where it was saved
- The topic name extracted
- (File mode only) The original file path that was moved
- Do not commit — let the user review via `git diff`
