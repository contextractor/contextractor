write a prompt to `/Users/miroslavsekera/r/contextractor/prompts/prompt.md`

read the research report first: `/Users/miroslavsekera/r/contextractor/prompts/research.md`

into `/Users/miroslavsekera/r/contextractor/` a Python template https://apify.com/templates/python-crawlee-playwright

we need to import functionality from `/Users/miroslavsekera/r/playwright-scraper-apify/` which is a https://apify.com/apify/playwright-scraper. particularly be aware of `/Users/miroslavsekera/r/playwright-scraper-apify/INPUT_SCHEMA.json`

port the TypeScript patterns to Python Crawlee equivalents

the purpose of the actor is to extract text from scraped HTML using https://github.com/adbar/trafilatura

except the page function - we dont need the original data extraction, save HTML to Key-Value Store with URL-based keys

also, no need those fields and functionality:
`useChrome`
`preNavigationHooks`
`postNavigationHooks`

do not implement now, create an executable prompt for later

the generated prompt must use absolute paths when referencing projects:
- target: `/Users/miroslavsekera/r/contextractor/`
- source: `/Users/miroslavsekera/r/playwright-scraper-apify/`

all enumeration fields in schemas must be in `SCREAMING_SNAKE_CASE` format

the resulting prompt must be concise, avoid unnecessary info and filler text
