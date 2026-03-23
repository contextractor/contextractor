# adjust the actor:

## Rename field plus captions for users
`exportHtml` to `saveRawHtmlToKeyValueStore` plus captions for users

rename names for the processed content:
`exportMarkdown` to `saveExtractedMarkdownToKeyValueStore`
pplus all the others..

## Remove
`downloadMedia` it must never download media
`downloadCss` it must never download css
`includeMetadata` it must always include metadata

## Organize
organize fields into categories like at `/Users/miroslavsekera/r/contextractor/prompts/2026-adjust/website-content-crawler-input-schema.json`

## Review
check if any fields arent missing,
compare with `/Users/miroslavsekera/r/contextractor/prompts/2026-adjust/website-content-crawler-input-schema.json`
 but do not add them without confirmation.
instead, create a report of missing fields or other features at `/Users/miroslavsekera/r/contextractor/prompts/2026-adjust`


