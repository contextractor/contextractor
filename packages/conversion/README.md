# @contextractor/conversion

Internal package. Turns one cleaned-HTML string into Contextractor's `txt`, `markdown`, `json`, and
`html` output formats.

The extraction engine ([Trafilatura Core](https://www.trafilatura.dev/)) returns exactly one
artifact: cleaned HTML. This package parses it **once** and renders every requested format from that
single node.

```ts
import { convert } from '@contextractor/conversion';

const out = convert({
  html: cleanedHtml,
  formats: ['txt', 'markdown', 'json'],
  json: { metadata, pageType, confidence, messages },
});
```

| Format     | How                                                                           |
| ---------- | ----------------------------------------------------------------------------- |
| `markdown` | `turndown` + `@joplin/turndown-plugin-gfm`                                    |
| `txt`      | a whitespace-collapsing DOM walk (no library); table cells joined by `" \| "` |
| `json`     | `JSON.stringify` over a typed result object (no library)                      |
| `html`     | the cleaned HTML, passed through                                              |

XML and XML-TEI are deliberately absent: Contextractor exposes neither.

See `SPEC.md` for the full API, the plain-text conventions, and why this package owns the
`@mixmark-io/domino` dependency.
