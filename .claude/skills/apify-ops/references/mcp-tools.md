# Apify MCP Tools Reference

MCP tools provide direct integration with Apify platform for running Actors and accessing storage.

## Actor Discovery

### search-actors
Search Apify Store to find Actors for specific platforms or use cases.

```
mcp__apify__search-actors
  keywords: "Instagram posts"
  limit: 10
```

### fetch-actor-details
Get Actor's README, input schema, pricing, and documentation.

```
mcp__apify__fetch-actor-details
  actor: "apify/rag-web-browser"
```

## Running Actors

### call-actor (Two-step workflow)

**Step 1: Get info**
```
mcp__apify__call-actor
  actor: "apify/rag-web-browser"
  step: "info"
```

**Step 2: Call with input**
```
mcp__apify__call-actor
  actor: "apify/rag-web-browser"
  step: "call"
  input: {"query": "example search", "maxResults": 5}
```

### add-actor
Register an Actor as a callable tool without executing it.

```
mcp__apify__add-actor
  actor: "apify/instagram-scraper"
```

## Monitoring Runs

### get-actor-run
Get detailed info about a specific run by runId.

```
mcp__apify__get-actor-run
  runId: "y2h7sK3Wc"
```

Returns: status, timestamps, performance stats, datasetId, keyValueStoreId

### get-actor-run-list
List runs with optional filtering and sorting.

```
mcp__apify__get-actor-run-list
  limit: 10
  desc: true
  status: "SUCCEEDED"  # Optional: READY, RUNNING, SUCCEEDED, FAILED, etc.
```

### get-actor-log
Get recent log lines for a run.

```
mcp__apify__get-actor-log
  runId: "y2h7sK3Wc"
  lines: 20
```

## Dataset Operations

### get-dataset
Get dataset metadata (itemCount, schema, fields).

```
mcp__apify__get-dataset
  datasetId: "xyz123"
```

### get-dataset-items
Retrieve items with pagination and field selection.

```
mcp__apify__get-dataset-items
  datasetId: "xyz123"
  limit: 100
  offset: 0
  fields: "title,url,price"
  clean: true
```

### get-dataset-list
List available datasets.

```
mcp__apify__get-dataset-list
  limit: 10
  desc: true
  unnamed: true  # Include auto-generated datasets from runs
```

### get-actor-output
Simplified retrieval of Actor run output.

```
mcp__apify__get-actor-output
  datasetId: "abc123"
  limit: 100
  fields: "crawl.statusCode,text"
```

### get-dataset-schema
Generate JSON schema from dataset sample.

```
mcp__apify__get-dataset-schema
  datasetId: "xyz123"
  limit: 5
```

## Key-Value Store Operations

### get-key-value-store
Get store metadata.

```
mcp__apify__get-key-value-store
  storeId: "username~my-store"
```

### get-key-value-store-keys
List keys in a store.

```
mcp__apify__get-key-value-store-keys
  storeId: "abc123"
  limit: 100
```

### get-key-value-store-record
Get a specific record by key.

```
mcp__apify__get-key-value-store-record
  storeId: "abc123"
  recordKey: "INPUT"
```

### get-key-value-store-list
List available key-value stores.

```
mcp__apify__get-key-value-store-list
  limit: 10
  unnamed: true
```

## Documentation

### search-apify-docs
Full-text search of Apify documentation.

```
mcp__apify__search-apify-docs
  query: "actor input schema"
  limit: 5
```

### fetch-apify-docs
Fetch complete documentation page.

```
mcp__apify__fetch-apify-docs
  url: "https://docs.apify.com/platform/actors/running"
```

## Limitations

MCP tools do NOT support:
- Build management (use CLI/API instead)
- Creating/updating Actors
- Modifying datasets or KV stores
- Schedule management
- Webhook configuration
