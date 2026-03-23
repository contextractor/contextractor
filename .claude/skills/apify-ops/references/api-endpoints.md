# Apify API Endpoints Reference

Direct HTTP API access for all Apify platform operations.

## Prerequisites

```bash
# Set token environment variable
export APIFY_TOKEN="your-api-token"
```

## Build Management

### List builds
```bash
curl -s "https://api.apify.com/v2/acts/~/<actor-name>/builds?token=$APIFY_TOKEN&limit=5"
```

### Get build info
```bash
curl -s "https://api.apify.com/v2/builds/<buildId>?token=$APIFY_TOKEN"
```

### Get build log
```bash
curl -s "https://api.apify.com/v2/logs/<buildId>?token=$APIFY_TOKEN"
```

### Trigger new build
```bash
# Start build
curl -X POST "https://api.apify.com/v2/acts/~/<actor-name>/builds?token=$APIFY_TOKEN&tag=latest"

# Start build and wait for completion (up to 60 seconds)
curl -X POST "https://api.apify.com/v2/acts/~/<actor-name>/builds?token=$APIFY_TOKEN&tag=latest&waitForFinish=60"
```

## Actor Runs

### Run Actor
```bash
curl -X POST "https://api.apify.com/v2/acts/~/<actor-name>/runs?token=$APIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"startUrls": [{"url": "https://example.com"}]}'
```

### Get run info
```bash
curl -s "https://api.apify.com/v2/runs/<runId>?token=$APIFY_TOKEN"
```

### List runs
```bash
curl -s "https://api.apify.com/v2/acts/~/<actor-name>/runs?token=$APIFY_TOKEN&limit=10&desc=true"
```

### Get run log
```bash
curl -s "https://api.apify.com/v2/logs/<runId>?token=$APIFY_TOKEN"
```

### Abort run
```bash
curl -X POST "https://api.apify.com/v2/runs/<runId>/abort?token=$APIFY_TOKEN"
```

## Dataset Operations

### Get dataset info
```bash
curl -s "https://api.apify.com/v2/datasets/<datasetId>?token=$APIFY_TOKEN"
```

### Get dataset items
```bash
# Basic
curl -s "https://api.apify.com/v2/datasets/<datasetId>/items?token=$APIFY_TOKEN"

# With pagination and fields
curl -s "https://api.apify.com/v2/datasets/<datasetId>/items?token=$APIFY_TOKEN&limit=100&offset=0&fields=title,url"
```

### List datasets
```bash
curl -s "https://api.apify.com/v2/datasets?token=$APIFY_TOKEN&limit=10"
```

## Key-Value Store Operations

### Get store info
```bash
curl -s "https://api.apify.com/v2/key-value-stores/<storeId>?token=$APIFY_TOKEN"
```

### List keys
```bash
curl -s "https://api.apify.com/v2/key-value-stores/<storeId>/keys?token=$APIFY_TOKEN&limit=100"
```

### Get record
```bash
curl -s "https://api.apify.com/v2/key-value-stores/<storeId>/records/<key>?token=$APIFY_TOKEN"
```

### Set record
```bash
curl -X PUT "https://api.apify.com/v2/key-value-stores/<storeId>/records/<key>?token=$APIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'
```

## Actor Information

### Get actor info
```bash
curl -s "https://api.apify.com/v2/acts/~/<actor-name>?token=$APIFY_TOKEN"
```

### Get current user
```bash
curl -s "https://api.apify.com/v2/users/me?token=$APIFY_TOKEN"
```

## Common Patterns

### Check latest build status
```bash
# Get latest build
BUILD_ID=$(curl -s "https://api.apify.com/v2/acts/~/<actor-name>/builds?token=$APIFY_TOKEN&limit=1" | jq -r '.data.items[0].id')

# Check status
curl -s "https://api.apify.com/v2/builds/$BUILD_ID?token=$APIFY_TOKEN" | jq '.data.status'
```

### Poll build until complete
```bash
while true; do
  STATUS=$(curl -s "https://api.apify.com/v2/builds/<buildId>?token=$APIFY_TOKEN" | jq -r '.data.status')
  echo "Build status: $STATUS"
  if [[ "$STATUS" == "SUCCEEDED" || "$STATUS" == "FAILED" || "$STATUS" == "ABORTED" ]]; then
    break
  fi
  sleep 5
done
```

### Get build error from log
```bash
curl -s "https://api.apify.com/v2/logs/<buildId>?token=$APIFY_TOKEN" | tail -100
```

## Response Structure

All API responses follow this structure:
```json
{
  "data": { ... },
  "status": 200
}
```

For list endpoints:
```json
{
  "data": {
    "items": [ ... ],
    "total": 42,
    "offset": 0,
    "limit": 10
  }
}
```

## Error Handling

- 401: Invalid or expired token
- 404: Resource not found
- 429: Rate limit exceeded (retry with backoff)
