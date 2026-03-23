# Apify CLI Commands Reference

CLI commands for local development, builds, and deployment.

## Prerequisites

```bash
# Install Apify CLI
npm install -g apify-cli

# Authenticate
apify login

# Verify authentication
apify whoami
```

## Build Management

### List builds
```bash
apify builds ls --limit 5
```

### Get build info
```bash
apify builds info <buildId>
```

### Get build log
```bash
apify builds log <buildId>
```

### Trigger new build
```bash
# Build and show log
apify builds create --tag latest --log

# Build without waiting
apify builds create --tag latest
```

## Local Development

### Run Actor locally
```bash
# Using Apify CLI (recommended)
apify run

# Using npm (if configured in package.json)
npm run start:dev
```

### Validate input schema
```bash
apify validate-schema .actor/input_schema.json
```

## Deployment

### Push to Apify platform
```bash
# Deploy and build
apify push

# Deploy without building
apify push --no-build
```

## Actor Information

### Get actor info
```bash
apify info
```

### Get username
```bash
apify whoami
```

## Common Patterns

### Get latest build status
```bash
# List builds and get first one
apify builds ls --limit 1
```

### Rebuild after Git push
```bash
# If auto-build webhook is configured, just push:
git push

# Otherwise, trigger manually:
apify builds create --tag latest --log
```

### Check if build succeeded
```bash
# Get build info (check status field)
apify builds info <buildId>
```

### View build errors
```bash
# Full build log
apify builds log <buildId>

# Or use API for specific error lines
curl -s "https://api.apify.com/v2/logs/<buildId>?token=$APIFY_TOKEN" | tail -50
```

## Troubleshooting

### CLI not authenticated
```bash
apify login
# Follow prompts to enter API token
```

### CLI not installed
```bash
npm install -g apify-cli
```

### Token issues
```bash
# Check current token
echo $APIFY_TOKEN

# Re-login if needed
apify logout
apify login
```
