# Angle Brackets in Plain Text

> **Note**: This test case references `htmlprocessing-server` from a different project.
> For the reader-mode actor in this monorepo, see [test-case-readermode.md](./test-case-readermode.md).

**Component**: htmlprocessing-server (HTML sanitization pipeline) - *not in this monorepo*
**Status**: Fixed
**Date**: 2026-01-16

## Summary

The HTML sanitization pipeline fails when input contains angle brackets that describe HTML transformations rather than actual HTML markup. The parser incorrectly interprets descriptive text as HTML tags, creating invalid nesting that causes formatting errors.

## Test Input

```
Replaces: <b> to <strong>, <i> to <em>, <div> to <p>
```

This is plain text describing tag transformations, not actual HTML.

## Expected Behavior

Process without errors or warnings. The text should be treated as content, not as HTML structure.

## Actual Behavior (Before Fix)

**Error Message:**
```
HTML formatting failed: Unexpected closing tag "p". It may happen when the tag has already been closed by another tag.
```

**Corrupted Output:**
```html
Replaces: <strong> to <strong>, <em> to <em>, <p> to <p></p></p></em></em></strong></strong>
```

## Root Cause

The sanitization pipeline has three stages:

1. **parse5 normalization** - Interprets `<b>`, `<strong>`, etc. as HTML tags
2. **sanitize-html** - Applies tag transformations (b→strong, i→em, div→p)
3. **Prettier formatting** - Fails on malformed structure

The problem occurs because:

1. parse5 creates nested structure from descriptive text:
   ```html
   Replaces: <b> to <strong>, <i> to <em>, <div> to <p></p></div></em></i></strong></b>
   ```

2. Tag transformations (especially div→p) create invalid HTML nesting:
   - `<p>` cannot be nested inside inline elements (`<em>`, `<strong>`)
   - HTML5 spec auto-closes tags in unexpected ways

3. Prettier fails when formatting the malformed result

## Fix Applied

Two changes in `packages/htmlprocessing-server`:

### Change 1: Re-normalize after sanitization

Added re-normalization step in `process-html.ts` after tag transformations:

```typescript
// Re-normalize after sanitization when tag transformations are applied
// This fixes invalid nesting that can occur when block elements (div)
// are transformed to other block elements (p) inside inline elements
if (setup.transformTags !== undefined) {
  const reNormalizeResult = normalizeHtml(currentHtml, !isHtmlDocument(currentHtml));
  if (reNormalizeResult.html !== undefined) {
    currentHtml = reNormalizeResult.html;
  }
}
```

### Change 2: Remove div→p transformation

Removed `div: "p"` from `semantic-standard.ts` preset. Now `div` tags are stripped instead of transformed to `p`, avoiding the nesting issue entirely.

## Test Cases

```typescript
describe("plain text with angle brackets (not HTML)", () => {
  it("should handle text describing HTML tags without corrupting it", async () => {
    const input = "Replaces: <b> to <strong>, <i> to <em>, <div> to <p>";
    const result = await processHtmlString(input, "semantic-standard");
    expect(result.messages).toEqual([]);
    expect(result.html).not.toContain("</p></p></em></em></strong></strong>");
  });

  it("should handle angle brackets in plain text without tag transformation artifacts", async () => {
    const input = "Use <div> for containers and <span> for inline";
    const result = await processHtmlString(input, "semantic-standard");
    expect(result.messages).toEqual([]);
    expect(result.html).not.toContain("</p></p>");
  });

  it("should handle comparison operators in text", async () => {
    const input = "Check if a < b and c > d";
    const result = await processHtmlString(input, { minify: true });
    expect(result.html).toBeDefined();
    expect(result.messages).toEqual([]);
  });

  it("should handle mixed HTML and descriptive text about tags", async () => {
    const input = "<p>Replaces: <b> to <strong></p>";
    const result = await processHtmlString(input, "semantic-standard");
    expect(result.messages).toEqual([]);
  });
});
```

## Related Files

*These paths reference the original `htmlprocessing-server` project, not this monorepo:*

- `packages/htmlprocessing-server/src/process-html.ts` - Main processing pipeline
- `packages/htmlprocessing-server/src/normalize-html.ts` - parse5 normalization
- `packages/htmlprocessing-server/src/presets/semantic-standard.ts` - Preset config
- `packages/htmlprocessing-server/src/index.test.ts` - Test file

## Lessons Learned

1. **Tag transformations can create invalid HTML** - Transforming block elements (div) to other block elements (p) inside inline contexts creates invalid nesting
2. **Re-normalization fixes structure** - Running parse5 again after sanitization repairs invalid nesting
3. **Simpler is safer** - Stripping tags (removing div) is safer than transforming them when nesting rules differ
