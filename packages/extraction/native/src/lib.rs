#![deny(clippy::expect_used, clippy::unwrap_used, clippy::missing_errors_doc)]
#![allow(clippy::module_name_repetitions)]

//! napi-rs wrapper around rs-trafilatura 0.2.x.
//!
//! Exposes three Node entry points to the `@contextractor/extraction` TypeScript
//! package: [`extract`], [`extract_metadata`], [`extract_all_formats`].

use std::collections::HashMap;

use napi::bindgen_prelude::Result;
use napi_derive::napi;

use rs_trafilatura::page_type::PageType;
use rs_trafilatura::{Options as RsOptions, extract_with_options};

/// Forward-compat config object accepted from the TypeScript side.
///
/// camelCase fields (auto-converted by napi-derive) mirror the Python
/// `TrafilaturaConfig`. `teiValidation` and `withMetadata` are accepted but
/// ignored — they keep the cross-runtime config shape stable.
#[napi(object)]
#[derive(Default, Clone, Debug)]
pub struct TrafilaturaConfig {
    pub fast: Option<bool>,
    pub favor_precision: Option<bool>,
    pub favor_recall: Option<bool>,
    pub include_comments: Option<bool>,
    pub include_tables: Option<bool>,
    pub include_images: Option<bool>,
    pub include_formatting: Option<bool>,
    pub include_links: Option<bool>,
    pub deduplicate: Option<bool>,
    pub target_language: Option<String>,
    /// Forward-compat — rs-trafilatura always returns metadata; flag is ignored.
    pub with_metadata: Option<bool>,
    pub only_with_metadata: Option<bool>,
    /// Forward-compat — rs-trafilatura 0.2.x has no XML-TEI; flag is ignored.
    pub tei_validation: Option<bool>,
}

/// Options for a single extraction call.
#[napi(object)]
#[derive(Default, Clone, Debug)]
pub struct ExtractOptions {
    pub url: Option<String>,
    /// One of `txt | markdown | json | html`. Defaults to `txt`.
    pub format: Option<String>,
    pub config: Option<TrafilaturaConfig>,
}

/// Single-format extraction result returned to TypeScript.
#[napi(object)]
#[derive(Default, Clone, Debug)]
pub struct ExtractionResult {
    pub content: String,
    pub format: String,
}

/// Metadata superset returned by rs-trafilatura. Mirrors `Metadata` from the
/// upstream crate plus the `hostname` field (handy on the TS side).
#[napi(object)]
#[derive(Default, Clone, Debug)]
pub struct Metadata {
    pub title: Option<String>,
    pub author: Option<String>,
    /// ISO 8601 timestamp.
    pub date: Option<String>,
    pub description: Option<String>,
    pub sitename: Option<String>,
    pub hostname: Option<String>,
    pub language: Option<String>,
    pub categories: Option<Vec<String>>,
    pub tags: Option<Vec<String>>,
    pub license: Option<String>,
    pub image: Option<String>,
    pub page_type: Option<String>,
    pub url: Option<String>,
}

/// Extract a single output format from `html`.
///
/// # Errors
///
/// Returns a JS `Error` when rs-trafilatura fails to parse, finds no content,
/// or the requested format is unknown.
#[napi]
pub fn extract(html: String, options: Option<ExtractOptions>) -> Result<ExtractionResult> {
    let opts = options.unwrap_or_default();
    let format = normalize_format(opts.format.as_deref().unwrap_or("txt"))?;

    let mut rs_opts = build_rs_options(opts.config.as_ref(), opts.url.as_deref());
    if matches!(format, OutputFormat::Markdown) {
        rs_opts.output_markdown = true;
    }

    let result = extract_with_options(&html, &rs_opts)
        .map_err(|e| napi::Error::from_reason(e.to_string()))?;

    let content = render_format(&result, format)?;
    Ok(ExtractionResult {
        content,
        format: format.as_str().to_string(),
    })
}

/// Extract only metadata from `html`. Equivalent to calling [`extract`] with
/// `format: "txt"` and discarding the content.
///
/// # Errors
///
/// Returns a JS `Error` if rs-trafilatura fails to parse or finds no content.
#[napi]
pub fn extract_metadata(html: String, url: Option<String>) -> Result<Metadata> {
    let mut rs_opts = RsOptions::default();
    if let Some(u) = url {
        rs_opts.url = Some(u);
    }
    let result = extract_with_options(&html, &rs_opts)
        .map_err(|e| napi::Error::from_reason(e.to_string()))?;
    Ok(metadata_to_napi(&result.metadata))
}

/// Run a single extraction and return all four formats keyed by name.
/// Defaults to `["txt", "markdown", "json", "html"]`.
///
/// # Errors
///
/// Returns a JS `Error` if rs-trafilatura fails.
#[napi]
pub fn extract_all_formats(
    html: String,
    options: Option<ExtractOptions>,
) -> Result<HashMap<String, ExtractionResult>> {
    let opts = options.unwrap_or_default();
    let mut rs_opts = build_rs_options(opts.config.as_ref(), opts.url.as_deref());
    rs_opts.output_markdown = true;

    let result = extract_with_options(&html, &rs_opts)
        .map_err(|e| napi::Error::from_reason(e.to_string()))?;

    let formats = if let Some(fmt) = opts.format {
        vec![normalize_format(&fmt)?]
    } else {
        vec![
            OutputFormat::Txt,
            OutputFormat::Markdown,
            OutputFormat::Json,
            OutputFormat::Html,
        ]
    };

    let mut out: HashMap<String, ExtractionResult> = HashMap::with_capacity(formats.len());
    for fmt in formats {
        let content = render_format(&result, fmt)?;
        out.insert(
            fmt.as_str().to_string(),
            ExtractionResult {
                content,
                format: fmt.as_str().to_string(),
            },
        );
    }
    Ok(out)
}

#[derive(Clone, Copy, Debug)]
enum OutputFormat {
    Txt,
    Markdown,
    Json,
    Html,
}

impl OutputFormat {
    fn as_str(self) -> &'static str {
        match self {
            Self::Txt => "txt",
            Self::Markdown => "markdown",
            Self::Json => "json",
            Self::Html => "html",
        }
    }
}

fn normalize_format(value: &str) -> Result<OutputFormat> {
    match value.trim().to_ascii_lowercase().as_str() {
        "txt" | "text" | "plain" => Ok(OutputFormat::Txt),
        "markdown" | "md" => Ok(OutputFormat::Markdown),
        "json" => Ok(OutputFormat::Json),
        "html" => Ok(OutputFormat::Html),
        other => Err(napi::Error::from_reason(format!(
            "Unknown output format: {other}. Supported: txt | markdown | json | html",
        ))),
    }
}

fn build_rs_options(config: Option<&TrafilaturaConfig>, url: Option<&str>) -> RsOptions {
    let mut rs = RsOptions::default();
    if let Some(u) = url {
        rs.url = Some(u.to_string());
    }
    if let Some(cfg) = config {
        if let Some(v) = cfg.favor_precision {
            rs.favor_precision = v;
        }
        if let Some(v) = cfg.favor_recall {
            rs.favor_recall = v;
        }
        if let Some(v) = cfg.include_comments {
            rs.include_comments = v;
        }
        if let Some(v) = cfg.include_tables {
            rs.include_tables = v;
        }
        if let Some(v) = cfg.include_images {
            rs.include_images = v;
        }
        if let Some(v) = cfg.include_formatting {
            rs.include_formatting = v;
        }
        if let Some(v) = cfg.include_links {
            rs.include_links = v;
        }
        if let Some(v) = cfg.deduplicate {
            rs.deduplicate = v;
        }
        if let Some(v) = cfg.only_with_metadata {
            rs.only_with_metadata = v;
        }
        if let Some(v) = cfg.target_language.as_ref() {
            rs.target_language = Some(v.clone());
        }
        // `fast` maps to disabling fallback extraction in rs-trafilatura's
        // recall-tuned defaults.
        if let Some(true) = cfg.fast {
            rs.use_fallback_extraction = false;
        }
        // `with_metadata` and `tei_validation` are accepted but not forwarded —
        // rs-trafilatura 0.2.x has no backing fields for them.
        let _ = cfg.with_metadata;
        let _ = cfg.tei_validation;
    }
    rs
}

fn render_format(result: &rs_trafilatura::ExtractResult, format: OutputFormat) -> Result<String> {
    match format {
        OutputFormat::Txt => Ok(result.content_text.clone()),
        OutputFormat::Markdown => Ok(result.content_markdown.clone().unwrap_or_default()),
        OutputFormat::Html => Ok(result.content_html.clone().unwrap_or_default()),
        OutputFormat::Json => render_json(result),
    }
}

fn render_json(result: &rs_trafilatura::ExtractResult) -> Result<String> {
    let metadata = metadata_to_serde(&result.metadata);
    let value = serde_json::json!({
        "text": result.content_text,
        "html": result.content_html,
        "markdown": result.content_markdown,
        "comments": result.comments_text,
        "metadata": metadata,
        "extractionQuality": result.extraction_quality,
        "classificationConfidence": result.classification_confidence,
        "warnings": result.warnings,
    });
    serde_json::to_string(&value).map_err(|e| napi::Error::from_reason(e.to_string()))
}

fn metadata_to_napi(meta: &rs_trafilatura::Metadata) -> Metadata {
    Metadata {
        title: meta.title.clone(),
        author: meta.author.clone(),
        date: meta.date.map(|d| d.to_rfc3339()),
        description: meta.description.clone(),
        sitename: meta.sitename.clone(),
        hostname: meta.hostname.clone(),
        language: meta.language.clone(),
        categories: option_vec(&meta.categories),
        tags: option_vec(&meta.tags),
        license: meta.license.clone(),
        image: meta.image.clone(),
        page_type: meta.page_type.clone(),
        url: meta.url.clone(),
    }
}

fn metadata_to_serde(meta: &rs_trafilatura::Metadata) -> serde_json::Value {
    serde_json::json!({
        "title": meta.title,
        "author": meta.author,
        "date": meta.date.map(|d| d.to_rfc3339()),
        "description": meta.description,
        "sitename": meta.sitename,
        "hostname": meta.hostname,
        "language": meta.language,
        "categories": meta.categories,
        "tags": meta.tags,
        "license": meta.license,
        "image": meta.image,
        "pageType": meta.page_type,
        "url": meta.url,
    })
}

fn option_vec(values: &[String]) -> Option<Vec<String>> {
    if values.is_empty() {
        None
    } else {
        Some(values.to_vec())
    }
}

// Suppress dead-code warning for the `PageType` re-export — the enum is part
// of the upstream contract; we keep the import for future bridging.
#[allow(dead_code)]
fn _force_page_type_link() -> Option<PageType> {
    None
}

#[cfg(test)]
#[allow(clippy::panic, clippy::unwrap_used, clippy::expect_used)]
mod tests {
    use super::*;

    const SAMPLE: &str = r#"
        <!doctype html>
        <html lang="en">
          <head>
            <title>Hello world</title>
            <meta name="author" content="Test Author">
            <meta name="description" content="Sample description">
          </head>
          <body>
            <article>
              <h1>Hello world</h1>
              <p>This is a sample article with enough words to pass the
              minimum-length threshold that rs-trafilatura applies.</p>
              <p>It has two paragraphs to give the extractor something to
              cluster.</p>
            </article>
          </body>
        </html>
    "#;

    #[test]
    fn extract_txt_returns_non_empty_content() {
        let result = extract(
            SAMPLE.to_string(),
            Some(ExtractOptions {
                format: Some("txt".into()),
                ..ExtractOptions::default()
            }),
        );
        let r = result.unwrap_or_else(|e| panic!("extract failed: {e}"));
        assert_eq!(r.format, "txt");
        assert!(r.content.contains("sample article"));
    }

    #[test]
    fn extract_markdown_returns_non_empty_content() {
        let result = extract(
            SAMPLE.to_string(),
            Some(ExtractOptions {
                format: Some("markdown".into()),
                ..ExtractOptions::default()
            }),
        );
        let r = result.unwrap_or_else(|e| panic!("extract failed: {e}"));
        assert_eq!(r.format, "markdown");
        assert!(!r.content.is_empty());
    }

    #[test]
    fn extract_metadata_populates_some_fields() {
        let metadata = extract_metadata(SAMPLE.to_string(), None)
            .unwrap_or_else(|e| panic!("extract_metadata failed: {e}"));
        let title = metadata.title.unwrap_or_default();
        assert!(!title.is_empty(), "expected non-empty title");
    }

    #[test]
    fn extract_all_formats_returns_four_keys() {
        let results = extract_all_formats(SAMPLE.to_string(), None)
            .unwrap_or_else(|e| panic!("extract_all_formats failed: {e}"));
        let mut keys: Vec<&String> = results.keys().collect();
        keys.sort();
        assert_eq!(
            keys,
            vec![
                &"html".to_string(),
                &"json".to_string(),
                &"markdown".to_string(),
                &"txt".to_string(),
            ]
        );
    }

    #[test]
    fn unknown_format_is_rejected() {
        let result = extract(
            SAMPLE.to_string(),
            Some(ExtractOptions {
                format: Some("xml".into()),
                ..ExtractOptions::default()
            }),
        );
        assert!(result.is_err(), "xml must be rejected");
    }
}
