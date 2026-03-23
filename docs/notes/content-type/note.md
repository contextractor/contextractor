# Apify Key-Value Store Content Type Behavior

## Summary

When saving data to Apify's Key-Value Store, the `contentType` option controls how the data is served. Most content types are served as-is, but `text/html` receives special treatment.

## Content Type Behavior Matrix

| Content Type | Script Injection | Browser Rendering | Notes |
|-------------|------------------|-------------------|-------|
| `application/json` | No | No (downloads) | Default when no contentType specified |
| `text/plain` | No | No (displays as text) | Safe for HTML storage |
| `text/plain; charset=utf-8` | No | No (displays as text) | Recommended for HTML |
| `image/png` | No | Yes | Binary, served as-is |
| `image/jpeg` | No | Yes | Binary, served as-is |
| `text/csv` | No | No (downloads) | Served as-is |
| **`text/html`** | **Yes** | Yes | Cookie-blocking script injected |

## The `text/html` Script Injection

Apify's infrastructure injects a cookie-blocking script into files served with `text/html` content type:

```html
<script>
Object.defineProperty(document, 'cookie', {
    get: function() { return ''; },
    set: function() { return true; }
});
if (cookieStore) {
    cookieStore = {};
}
</script>
```

This is a privacy/compliance feature - not a bug. It prevents cookie tracking in HTML files served from key-value stores.

### Evidence

- Actor logs show saved content starts with `<p>` (clean HTML)
- KV store served content starts with `<script>` (injected)
- MD5 hash mismatch between saved and served content confirms modification in transit

## Recommended Approach

Use `text/plain; charset=utf-8` for HTML content:

```typescript
// Correct - no injection
await keyValueStore.setValue(key, html, { contentType: 'text/plain; charset=utf-8' });

// Incorrect - causes script injection
await keyValueStore.setValue(key, html, { contentType: 'text/html' });
```

### Trade-offs

| Approach | Pros | Cons |
|----------|------|------|
| `text/plain` | Clean content, no injection, parseable | Won't render in browser, displays as text |
| `text/html` | Renders in browser | Injected script, modified content |

## Implementation in This Actor

```typescript
// actors/htmlwasher/src/internals/crawler_setup.ts

// Raw HTML storage
await this.keyValueStore.setValue(rawHtmlKey, rawHtml, { contentType: 'text/plain; charset=utf-8' });

// Cleaned HTML storage
await this.keyValueStore.setValue(cleanHtmlKey, cleanedHtml, { contentType: 'text/plain; charset=utf-8' });
```

## Default Content Type Behavior

From Apify SDK docs:

> By default, `value` is converted to JSON and stored with the `application/json; charset=utf-8` MIME content type.

If you pass a JavaScript object without specifying contentType, it becomes JSON automatically.

## References

- Apify SDK docs: https://docs.apify.com/sdk/js/reference/class/KeyValueStore#setValue
