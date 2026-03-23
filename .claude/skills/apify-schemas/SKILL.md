---
name: apify-schemas
description: Apify Actor schema specifications for input, output, dataset, and key-value store. Use when defining or modifying `.actor/*.json` schema files.
---

# Apify Actor Schema Specifications

## Actor Input Schema

The input schema defines the input parameters for an Actor. It's a JSON object comprising various field types supported by the Apify platform.

### Structure

```json
{
    "title": "<INPUT-SCHEMA-TITLE>",
    "type": "object",
    "schemaVersion": 1,
    "properties": {
        /* define input fields here */
    },
    "required": []
}
```

### Example

```json
{
    "title": "E-commerce Product Scraper Input",
    "type": "object",
    "schemaVersion": 1,
    "properties": {
        "startUrls": {
            "title": "Start URLs",
            "type": "array",
            "description": "URLs to start scraping from (category pages or product pages)",
            "editor": "requestListSources",
            "default": [{ "url": "https://example.com/category" }],
            "prefill": [{ "url": "https://example.com/category" }]
        },
        "followVariants": {
            "title": "Follow Product Variants",
            "type": "boolean",
            "description": "Whether to scrape product variants (different colors, sizes)",
            "default": true
        },
        "maxRequestsPerCrawl": {
            "title": "Max Requests per Crawl",
            "type": "integer",
            "description": "Maximum number of pages to scrape (0 = unlimited)",
            "default": 1000,
            "minimum": 0
        },
        "proxyConfiguration": {
            "title": "Proxy Configuration",
            "type": "object",
            "description": "Proxy settings for anti-bot protection",
            "editor": "proxy",
            "default": { "useApifyProxy": false }
        },
        "locale": {
            "title": "Locale",
            "type": "string",
            "description": "Language/country code for localized content",
            "default": "cs",
            "enum": ["cs", "en", "de", "sk"],
            "enumTitles": ["Czech", "English", "German", "Slovak"]
        }
    },
    "required": ["startUrls"]
}
```

## Actor Output Schema

The Actor output schema builds upon the schemas for the dataset and key-value store. It specifies where an Actor stores its output and defines templates for accessing that output. Apify Console uses these output definitions to display run results.

### Structure

```json
{
    "actorOutputSchemaVersion": 1,
    "title": "<OUTPUT-SCHEMA-TITLE>",
    "properties": {
        /* define your outputs here */
    }
}
```

### Example

```json
{
    "actorOutputSchemaVersion": 1,
    "title": "Output schema of the files scraper",
    "properties": {
        "files": {
            "type": "string",
            "title": "Files",
            "template": "{{links.apiDefaultKeyValueStoreUrl}}/keys"
        },
        "dataset": {
            "type": "string",
            "title": "Dataset",
            "template": "{{links.apiDefaultDatasetUrl}}/items"
        }
    }
}
```

### Output Schema Template Variables

- `links` (object) - Contains quick links to most commonly used URLs
- `links.publicRunUrl` (string) - Public run url in format `https://console.apify.com/view/runs/:runId`
- `links.consoleRunUrl` (string) - Console run url in format `https://console.apify.com/actors/runs/:runId`
- `links.apiRunUrl` (string) - API run url in format `https://api.apify.com/v2/actor-runs/:runId`
- `links.apiDefaultDatasetUrl` (string) - API url of default dataset in format `https://api.apify.com/v2/datasets/:defaultDatasetId`
- `links.apiDefaultKeyValueStoreUrl` (string) - API url of default key-value store in format `https://api.apify.com/v2/key-value-stores/:defaultKeyValueStoreId`
- `links.containerRunUrl` (string) - URL of a webserver running inside the run in format `https://<containerId>.runs.apify.net/`
- `run` (object) - Contains information about the run same as it is returned from the `GET Run` API endpoint
- `run.defaultDatasetId` (string) - ID of the default dataset
- `run.defaultKeyValueStoreId` (string) - ID of the default key-value store

## Dataset Schema Specification

The dataset schema defines how your Actor's output data is structured, transformed, and displayed in the Output tab in the Apify Console.

### Example

Consider an example Actor that calls `Actor.push_data()` to store data into dataset:

```python
from apify import Actor
from datetime import datetime

async def main() -> None:
    async with Actor:
        # Actor code
        await Actor.push_data({
            'numericField': 10,
            'pictureUrl': 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png',
            'linkUrl': 'https://google.com',
            'textField': 'Google',
            'booleanField': True,
            'dateField': datetime.now().isoformat(),
            'arrayField': ['#hello', '#world'],
            'objectField': {},
        })
```

To set up the Actor's output tab UI, reference a dataset schema file in `.actor/actor.json`:

```json
{
    "actorSpecification": 1,
    "name": "book-library-scraper",
    "title": "Book Library Scraper",
    "version": "1.0.0",
    "storages": {
        "dataset": "./dataset_schema.json"
    }
}
```

Then create the dataset schema in `.actor/dataset_schema.json`:

```json
{
    "actorSpecification": 1,
    "fields": {},
    "views": {
        "overview": {
            "title": "Overview",
            "transformation": {
                "fields": [
                    "pictureUrl",
                    "linkUrl",
                    "textField",
                    "booleanField",
                    "arrayField",
                    "objectField",
                    "dateField",
                    "numericField"
                ]
            },
            "display": {
                "component": "table",
                "properties": {
                    "pictureUrl": {
                        "label": "Image",
                        "format": "image"
                    },
                    "linkUrl": {
                        "label": "Link",
                        "format": "link"
                    },
                    "textField": {
                        "label": "Text",
                        "format": "text"
                    },
                    "booleanField": {
                        "label": "Boolean",
                        "format": "boolean"
                    },
                    "arrayField": {
                        "label": "Array",
                        "format": "array"
                    },
                    "objectField": {
                        "label": "Object",
                        "format": "object"
                    },
                    "dateField": {
                        "label": "Date",
                        "format": "date"
                    },
                    "numericField": {
                        "label": "Number",
                        "format": "number"
                    }
                }
            }
        }
    }
}
```

### Structure

```json
{
    "actorSpecification": 1,
    "fields": {},
    "views": {
        "<VIEW_NAME>": {
            "title": "string (required)",
            "description": "string (optional)",
            "transformation": {
                "fields": ["string (required)"],
                "unwind": ["string (optional)"],
                "flatten": ["string (optional)"],
                "omit": ["string (optional)"],
                "limit": "integer (optional)",
                "desc": "boolean (optional)"
            },
            "display": {
                "component": "table (required)",
                "properties": {
                    "<FIELD_NAME>": {
                        "label": "string (optional)",
                        "format": "text|number|date|link|boolean|image|array|object (optional)"
                    }
                }
            }
        }
    }
}
```

**Dataset Schema Properties:**

- `actorSpecification` (integer, required) - Specifies the version of dataset schema structure document (currently only version 1)
- `fields` (JSONSchema object, required) - Schema of one dataset object (use JsonSchema Draft 2020-12 or compatible)
- `views` (DatasetView object, required) - Object with API and UI views description

**DatasetView Properties:**

- `title` (string, required) - Visible in UI Output tab and API
- `description` (string, optional) - Only available in API response
- `transformation` (ViewTransformation object, required) - Data transformation applied when loading from Dataset API
- `display` (ViewDisplay object, required) - Output tab UI visualization definition

**ViewTransformation Properties:**

- `fields` (string[], required) - Fields to present in output (order matches column order)
- `unwind` (string[], optional) - Deconstructs nested children into parent object
- `flatten` (string[], optional) - Transforms nested object into flat structure
- `omit` (string[], optional) - Removes specified fields from output
- `limit` (integer, optional) - Maximum number of results (default: all)
- `desc` (boolean, optional) - Sort order (true = newest first)

**ViewDisplay Properties:**

- `component` (string, required) - Only `table` is available
- `properties` (Object, optional) - Keys matching `transformation.fields` with ViewDisplayProperty values

**ViewDisplayProperty Properties:**

- `label` (string, optional) - Table column header
- `format` (string, optional) - One of: `text`, `number`, `date`, `link`, `boolean`, `image`, `array`, `object`

## Key-Value Store Schema Specification

The key-value store schema organizes keys into logical groups called collections for easier data management.

### Example

Consider an example Actor that calls `Actor.set_value()` to save records into the key-value store:

```python
from apify import Actor

async def main() -> None:
    async with Actor:
        # Actor code
        await Actor.set_value('document-1', 'my text data', content_type='text/plain')

        await Actor.set_value(f'image-{image_id}', image_buffer, content_type='image/jpeg')
```

To configure the key-value store schema, reference a schema file in `.actor/actor.json`:

```json
{
    "actorSpecification": 1,
    "name": "data-collector",
    "title": "Data Collector",
    "version": "1.0.0",
    "storages": {
        "keyValueStore": "./key_value_store_schema.json"
    }
}
```

Then create the key-value store schema in `.actor/key_value_store_schema.json`:

```json
{
    "actorKeyValueStoreSchemaVersion": 1,
    "title": "Key-Value Store Schema",
    "collections": {
        "documents": {
            "title": "Documents",
            "description": "Text documents stored by the Actor",
            "keyPrefix": "document-"
        },
        "images": {
            "title": "Images",
            "description": "Images stored by the Actor",
            "keyPrefix": "image-",
            "contentTypes": ["image/jpeg"]
        }
    }
}
```

### Structure

```json
{
    "actorKeyValueStoreSchemaVersion": 1,
    "title": "string (required)",
    "description": "string (optional)",
    "collections": {
        "<COLLECTION_NAME>": {
            "title": "string (required)",
            "description": "string (optional)",
            "key": "string (conditional - use key OR keyPrefix)",
            "keyPrefix": "string (conditional - use key OR keyPrefix)",
            "contentTypes": ["string (optional)"],
            "jsonSchema": "object (optional)"
        }
    }
}
```

**Key-Value Store Schema Properties:**

- `actorKeyValueStoreSchemaVersion` (integer, required) - Version of key-value store schema structure document (currently only version 1)
- `title` (string, required) - Title of the schema
- `description` (string, optional) - Description of the schema
- `collections` (Object, required) - Object where each key is a collection ID and value is a Collection object

**Collection Properties:**

- `title` (string, required) - Collection title shown in UI tabs
- `description` (string, optional) - Description appearing in UI tooltips
- `key` (string, conditional) - Single specific key for this collection
- `keyPrefix` (string, conditional) - Prefix for keys included in this collection
- `contentTypes` (string[], optional) - Allowed content types for validation
- `jsonSchema` (object, optional) - JSON Schema Draft 07 format for `application/json` content type validation

Either `key` or `keyPrefix` must be specified for each collection, but not both.

## Date and Time Format Standards (ISO 8601 / RFC 3339)

Timestamps must be provided in **ISO 8601** format (also conformant with **RFC 3339**), using Coordinated Universal Time (UTC) with the `Z` suffix as the timezone designator. The `T` separates date and time components; the trailing `Z` indicates zero UTC offset. Fractional seconds are optional. All times are interpreted as UTC; **local timezone offsets are not accepted**.

### Datetime Format (for system timestamps)
Use for crawl/system timestamps like `loadedAt`, `crawledAt`, `createdAt`:
- Format: `YYYY-MM-DDTHH:mm:ss.sssZ`
- Example: `"2025-01-15T14:30:00.000Z"`

### Date-Only Format (for content dates)
Use for article/content dates like `publishedAt`, `modifiedAt`:
- Format: `YYYY-MM-DD`
- Example: `"2025-01-15"`

### Schema Type Definitions
```json
// Datetime with timezone (system timestamps)
"loadedAt": {
    "type": "string",
    "format": "date-time",
    "description": "ISO 8601 datetime when page was loaded (YYYY-MM-DDTHH:mm:ss.sssZ)"
}

// Date only (content dates)
"publishedAt": {
    "type": ["string", "null"],
    "description": "ISO 8601 date when article was published (YYYY-MM-DD)"
}
```

### Implementation
```python
from datetime import datetime

# System timestamp (with time)
loaded_at = datetime.utcnow().isoformat() + 'Z'  # "2025-01-15T14:30:00.000000Z"

# Content date (date only, extracted from article)
published_at = article.get('publishedTime', '').split('T')[0] or None  # "2025-01-15"
```
