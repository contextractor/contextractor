# Step: Add Docker Programmatic Usage to README

## TLDR

Expand the existing Docker section in `README.md` with examples showing how to call Docker extraction from Node.js and Python code.

References: `add-library-api-docs-notes/current-docs-inventory.md`

## Instructions

### Expand the existing Docker section

After the current Docker CLI examples, add a "### Docker from Code" subsection with:

- **Node.js** example using `child_process.execSync`:
  ```javascript
  const { execSync } = require("child_process");
  const result = execSync(
    "docker run ghcr.io/contextractor/contextractor https://example.com",
    { encoding: "utf-8" }
  );
  ```

- **Python** example using `subprocess.run`:
  ```python
  import subprocess
  result = subprocess.run(
      ["docker", "run", "ghcr.io/contextractor/contextractor", "https://example.com"],
      capture_output=True, text=True
  )
  print(result.stdout)
  ```

- Volume mounting for output:
  ```bash
  docker run -v $(pwd)/output:/output ghcr.io/contextractor/contextractor https://example.com -o /output
  ```

- Note: All CLI flags work inside Docker — reference the CLI Options table
