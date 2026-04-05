# TLDR

Install the published `contextractor` npm package in a clean test folder and run it against 2-3 idnes.cz pages. Verify output is valid extracted content.

**Touches:** `/Users/miroslavsekera/r/testing-contextractor/` (external test folder only)

## Instructions

1. Create test subfolder: `/Users/miroslavsekera/r/testing-contextractor/npm-test/`
2. Initialize a new npm project: `npm init -y`
3. Install contextractor: `npm install contextractor`
   - Watch for postinstall errors (binary download, Playwright Chromium install)
4. Run against idnes.cz homepage:
   ```
   npx contextractor https://www.idnes.cz/ --max-pages 1 --format markdown -o ./output
   ```
5. Run against one article page (pick any from idnes.cz):
   ```
   npx contextractor https://www.idnes.cz/zpravy --max-pages 2 --format markdown -o ./output2
   ```
6. Verify:
   - Binary downloaded successfully during postinstall
   - CLI runs without crash
   - Output files exist and contain meaningful extracted content (not empty, not just boilerplate)
   - No error messages in stderr

7. Log results: note what worked and what failed. If something fails, document the exact error for the next step.
