# Step 3: Update Crawler Save Logic

## TLDR

Replace `if config.save_markdown:` boolean checks in the crawler with `if "markdown" in config.save:` set membership checks. All 7 format blocks affected.

## Changes

### `apps/contextractor-standalone/src/contextractor_cli/crawler.py`

**Lines 231-293**: Replace each boolean check:

| Old | New |
|-----|-----|
| `if config.save_markdown:` | `if "markdown" in config.save:` |
| `if config.save_text:` | `if "text" in config.save:` |
| `if config.save_json:` | `if "json" in config.save:` |
| `if config.save_jsonl:` | `if "jsonl" in config.save:` |
| `if config.save_xml:` | `if "xml" in config.save:` |
| `if config.save_xml_tei:` | `if "xml-tei" in config.save:` |
| `if config.save_raw_html:` | `if "html" in config.save:` |

No other changes needed in the crawler — the extraction logic and file naming stay the same.
