#!/usr/bin/env bash
# Demonstrates calling glueo/contextractor-test via the Apify CLI.
# Requires: npm install -g apify-cli && apify login
set -euo pipefail

# Extract a page: text inline in the dataset record, raw HTML as a key-value-store blob.
apify call glueo/contextractor-test --input '{
  "startUrls": [{"url": "https://example.com"}],
  "save": ["txt-dataset", "original-kvs"]
}'
