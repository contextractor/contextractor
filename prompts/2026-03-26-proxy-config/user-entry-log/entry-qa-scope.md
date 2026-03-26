# QA: Scope Decisions

## Q1: Proxy only or full config parity?
**Answer: Full parity** — Add all missing Apify Actor settings to CLI (browser, cookies, headers, globs, concurrency, output toggles, proxy).

## Q2: Include GUI site updates?
**Answer: Yes** — Update site help docs, ensure contextractor-engine import works, test GUI consistency.

## Q3: Include publish/deploy step?
**Answer: Yes** — Final step publishes to Docker, Apify Platform, and npm.
