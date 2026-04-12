 for npm package, python, docker, apify agent: make sure all the settings is consistent. for example: https://www.npmjs.com/package/contextractor there is this settings:
```
  --format, -f          Output format (txt, markdown, json, jsonl, xml, xmltei)
```
but also
```
  --save-raw-html       Save raw HTML to output
  --save-text           Save extracted text
  --save-json           Save extracted JSON
  --save-xml            Save extracted XML
  --save-xml-tei        Save extracted XML-TEI
```

we need to keep this:
```
  --save-raw-html       Save raw HTML to output
  --save-text           Save extracted text
  --save-json           Save extracted JSON
  --save-xml            Save extracted XML
  --save-xml-tei        Save extracted XML-TEI
```


review also other settings for inconsistency and make sure it uses the best practices and industry standards.

Fix NPM package, Paython Package, Docker. Do not fix apify actor - this is the primary package already used by users and msut be kept compactible.

Others (npm package, docker, python package) must follow apify actor settings, all must be compact and consistend

also update all the related docs and gui using 
/Users/miroslavsekera/r/contextractor/.claude/commands/sync/docs.md
/Users/miroslavsekera/r/contextractor/.claude/commands/sync/gui.md