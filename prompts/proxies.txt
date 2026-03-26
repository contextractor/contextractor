we need to:
keep usig both YAML and JSON options for the config,
but in docs, mention only JSON
 then, we need to add proxyy configuration exactly in same way and like  use them.
 all the configs including the proxy config must be in both CLI and the config file configurable

 then, we need to update all the docs:
 /Users/miroslavsekera/r/contextractor/README.md
 /Users/miroslavsekera/r/contextractor/apps/contextractor-apify/README.md
 /Users/miroslavsekera/r/contextractor/apps/contextractor-standalone/npm/README.md

 /Users/miroslavsekera/r/tools/apps/contextractor-site/content/automatic/help

 all must be consistentt.

then, we need to make sure all the config, not only proxies, is consistent across apify actor (/Users/miroslavsekera/r/contextractor/apps/contextractor-apify), standalone (/Users/miroslavsekera/r/contextractor/apps/contextractor-standalone) and the contextrractor GUI at  /Users/miroslavsekera/r/tools/apps/contextractor-site


get everythig working, docker, npm js CLI, apify actor locally and in the apify Platform.

also, make sure all the config if consistent with GUI

run /Users/miroslavsekera/r/tools/apps/contextractor-site and using Claude  agents and skills in /Users/miroslavsekera/r/tools/ test it properly, make sure it works and the config is consistent with the apps in /Users/miroslavsekera/r/contextractor/apps


also, you will need to "import:contextractor-engine" at /Users/miroslavsekera/r/tools/package.json

use free proxies for testing of all of it - see this ressearch /Users/miroslavsekera/r/contextractor/prompts/free-proxies-for-web-scraping-testing.md

then publish everything - docker, apify actor, into npm js
