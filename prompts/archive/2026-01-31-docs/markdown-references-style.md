# Markdown References Style Guide

Pure markdown clickable references using header anchors.

## Inline Citation

```markdown
Some claim. [[1]](#1-article-title)
```

## Reference Entry

```markdown
##### 1. Article Title
Author Name. [Source Name](https://example.com/url)
```

## Rules

- **Inline**: `[[N]](#anchor)` where anchor = header slug
- **Header**: `##### N. Title` — no quotes, no author
- **Body**: `Author. [Source](url)` on next line
- **Anchor**: Auto-generated from header text (lowercase, hyphens, no special chars)

## Example

```markdown
Text with citation. [[1]](#1-example-article)

### References

##### 1. Example Article
Smith, John. [Journal Name](https://example.com/article)
```
