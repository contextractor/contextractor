 for npm package, python, docker, apify agent: make sure all the settings is consistent. 


in apify actor input schema https://apify.com/glueo/contextractor/input-schema, traffilatura settings is called `trafilaturaConfig`


but for example in npm package, it is called `extraction` and it is also `extraction` differently called in python package.

deeply reanalyze and make all those and also docker in sync with apify actor

review also other settings for inconsistency and make sure it uses the best practices and industry standards. make sure there is not any redundant settings, remove other redundat settings. All config files must be in JSOn in the docks (but also in YAML for compatibility, but YAML is undocumented for compatibility only)

Fix NPM package, Paython Package, Docker. Do not fix apify actor - this is the primary package already used by users and msut be kept compactible.

Others (npm package, docker, python package) must follow apify actor settings, all must be compact and consistend

also update all the related docs and gui using 
/Users/miroslavsekera/r/contextractor/.claude/commands/sync/docs.md
/Users/miroslavsekera/r/contextractor/.claude/commands/sync/gui.md



then publish python package docker npm using /Users/miroslavsekera/r/contextractor/.claude/commands/publish/all.md


then download the python package from pypi and test both lib and cli, autofix, publish fixed version if needed
then download the npm package from npmjs and test both lib and cli, autofix, publish fixed version if needed
then download docker pypi and test both lib and cli, autofix, publish fixed version if needed
