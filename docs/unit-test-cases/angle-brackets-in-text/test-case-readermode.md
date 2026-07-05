# Angle Brackets in Plain Text - Reader Mode Actor

**Component**: htmlwasher-readermode-apify (Readability-based content extraction)
**Status**: Testing
**Date**: 2026-01-16

## Summary

This test case validates that the HTML processing pipeline correctly handles plain text containing angle brackets that describe HTML transformations rather than actual HTML markup. The parser should not corrupt such text when processing article content.

## Architecture Differences from htmlprocessing-server

This actor uses a different processing pipeline:

1. **JSDOM** - Parses HTML into DOM
2. **Mozilla Readability** - Extracts main article content
3. **sanitize-html** - Cleans and sanitizes the extracted content
4. **html-minifier-terser** - Minifies the final output

Unlike the htmlprocessing-server (which uses parse5 normalization), JSDOM's HTML parser will interpret angle brackets as HTML tags during initial parsing. This means text like `<b>` will be parsed as an actual `<b>` tag before Readability even sees it.

## Test Input

Plain text describing tag transformations embedded in article content:

```
Replaces: <b> to <strong>, <i> to <em>, <div> to <p>
```

## Expected Behavior

1. The HTML should be processed without errors
2. Text content should be preserved (though tags like `<b>` may be parsed as HTML)
3. No malformed or corrupted output structures
4. Comparison operators (`<`, `>`) in text should be handled gracefully

## Root Cause Analysis

When angle brackets appear in HTML content without proper escaping:

1. **JSDOM parsing** - Interprets `<b>`, `<i>`, `<div>` as actual HTML tags
2. **Readability extraction** - Works on the parsed DOM, sees tags not text
3. **sanitize-html** - May transform or strip tags based on configuration

The key insight: In a DOM-based parser, `<b>` in text **will** become a `<b>` tag unless escaped as `&lt;b&gt;`. This is different from the parse5 normalization issue in the original test case.

## Test Cases

### Test 1: Angle brackets describing HTML tags

Input contains angle brackets that look like tags. Since JSDOM parses these as actual tags, the output should still be valid HTML without structural corruption.

### Test 2: Comparison operators in text

Input like `a < b and c > d` should be handled without creating malformed elements. The `<` and `>` that don't form valid tag patterns should be preserved or safely handled.

### Test 3: Mixed HTML and tag descriptions

Content in actual HTML containers with text describing tags should process without errors.

### Test 4: Properly escaped angle brackets

Content with `&lt;b&gt;` should display as literal `<b>` text.

## Related Files

- `actors/htmlwasher/packages/engine/src/process.ts` - Main processing pipeline with `processHtml` and `processHtmlWithOptions`
- `actors/htmlwasher/src/__tests__/process.test.ts` - Existing tests
- `actors/htmlwasher/src/__tests__/sanitization.test.ts` - Sanitization option tests

## Lessons Learned

1. **DOM parsers interpret angle brackets as tags** - Unlike text-based processing, JSDOM will parse `<b>` as a bold tag
2. **Proper escaping is the solution** - Authors should use `&lt;` and `&gt;` for literal angle brackets
3. **Focus on non-corruption** - The goal is to ensure processing doesn't crash or produce malformed HTML, even if the semantic meaning changes
