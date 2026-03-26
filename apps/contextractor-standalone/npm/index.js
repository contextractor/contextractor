"use strict";

const path = require("path");
const os = require("os");
const { execFileSync, spawn } = require("child_process");

const PLATFORM_MAP = {
  darwin: "darwin",
  linux: "linux",
  win32: "win",
};

const ARCH_MAP = {
  x64: "x64",
  arm64: "arm64",
};

function getBinaryName() {
  const platform = PLATFORM_MAP[os.platform()];
  let arch = ARCH_MAP[os.arch()];

  if (!platform || !arch) {
    throw new Error(
      `Unsupported platform: ${os.platform()}-${os.arch()}\n` +
        "Supported: darwin-arm64, linux-x64, linux-arm64, win-x64"
    );
  }

  // macOS x64 uses arm64 binary via Rosetta
  if (platform === "darwin" && arch === "x64") {
    arch = "arm64";
  }

  const ext = os.platform() === "win32" ? ".exe" : "";
  return `contextractor-${platform}-${arch}${ext}`;
}

function getBinaryPath() {
  return path.join(__dirname, "bin", getBinaryName());
}

/**
 * Extract content from web pages.
 *
 * @param {string|string[]} urls - URL(s) to extract, or a config file path for backward compat
 * @param {object} [options={}] - Extraction options
 * @param {string} [options.config] - Path to YAML/JSON config file
 * @param {boolean} [options.precision] - High precision mode
 * @param {boolean} [options.recall] - High recall mode
 * @param {boolean} [options.fast] - Fast extraction mode
 * @param {boolean} [options.noLinks] - Exclude links
 * @param {boolean} [options.noComments] - Exclude comments
 * @param {string} [options.outputDir] - Output directory
 * @param {string} [options.format] - Output format (txt, markdown, json, xml, xmltei)
 * @param {number} [options.maxPages] - Max pages to crawl
 * @param {number} [options.crawlDepth] - Max crawl depth
 * @param {boolean} [options.headless] - Run headless (default true)
 * @param {boolean} [options.includeTables] - Include tables
 * @param {boolean} [options.includeImages] - Include images
 * @param {boolean} [options.includeFormatting] - Preserve formatting
 * @param {boolean} [options.deduplicate] - Deduplicate content
 * @param {string} [options.targetLanguage] - Filter by language
 * @param {boolean} [options.withMetadata] - Extract metadata
 * @param {string|string[]} [options.pruneXpath] - XPath patterns to prune
 * @param {string|string[]} [options.proxyUrls] - Proxy URLs
 * @param {string} [options.proxyRotation] - Proxy rotation strategy
 * @param {string} [options.launcher] - Browser engine (chromium, firefox)
 * @param {string} [options.waitUntil] - Page load event (networkidle, load, domcontentloaded)
 * @param {number} [options.pageLoadTimeout] - Page load timeout in seconds
 * @param {boolean} [options.ignoreCors] - Disable CORS/CSP
 * @param {boolean} [options.closeCookieModals] - Auto-dismiss cookie banners
 * @param {number} [options.maxScrollHeight] - Max scroll height in pixels
 * @param {boolean} [options.ignoreSslErrors] - Skip SSL verification
 * @param {string|string[]} [options.globs] - Glob patterns to include
 * @param {string|string[]} [options.excludes] - Glob patterns to exclude
 * @param {string} [options.linkSelector] - CSS selector for links
 * @param {boolean} [options.keepUrlFragments] - Preserve URL fragments
 * @param {boolean} [options.respectRobotsTxt] - Honor robots.txt
 * @param {object[]} [options.cookies] - Initial cookies array
 * @param {object} [options.headers] - Custom HTTP headers
 * @param {number} [options.maxConcurrency] - Max parallel requests
 * @param {number} [options.maxRetries] - Max request retries
 * @param {number} [options.maxResults] - Max results (0 = unlimited)
 * @param {boolean} [options.saveRawHtml] - Save raw HTML
 * @param {boolean} [options.saveText] - Save extracted text
 * @param {boolean} [options.saveJson] - Save extracted JSON
 * @param {boolean} [options.saveXml] - Save extracted XML
 * @param {boolean} [options.saveXmlTei] - Save extracted XML-TEI
 * @param {boolean} [options.verbose] - Verbose logging
 * @param {string} [options.stdio] - stdio option for child process
 * @returns {Promise<void>}
 */
function extract(urls, options = {}) {
  return new Promise((resolve, reject) => {
    const args = [];

    // Determine if first arg is a URL or config file path (backward compat)
    let urlList = [];
    if (typeof urls === "string") {
      if (urls.startsWith("http://") || urls.startsWith("https://")) {
        urlList = [urls];
      } else {
        // Backward compat: treat as config file path
        options = { ...options, config: urls };
      }
    } else if (Array.isArray(urls)) {
      urlList = urls;
    }

    // Config file
    if (options.config) args.push("--config", options.config);

    // CrawlConfig options
    if (options.maxPages != null) args.push("--max-pages", String(options.maxPages));
    if (options.crawlDepth != null) args.push("--crawl-depth", String(options.crawlDepth));
    if (options.headless === true) args.push("--headless");
    if (options.headless === false) args.push("--no-headless");
    if (options.outputDir) args.push("--output-dir", options.outputDir);
    if (options.format) args.push("--format", options.format);

    // Proxy
    if (options.proxyUrls) {
      const proxyList = Array.isArray(options.proxyUrls) ? options.proxyUrls : [options.proxyUrls];
      args.push("--proxy-urls", proxyList.join(","));
    }
    if (options.proxyRotation) args.push("--proxy-rotation", options.proxyRotation);

    // Browser settings
    if (options.launcher) args.push("--launcher", options.launcher);
    if (options.waitUntil) args.push("--wait-until", options.waitUntil);
    if (options.pageLoadTimeout != null) args.push("--page-load-timeout", String(options.pageLoadTimeout));
    if (options.ignoreCors) args.push("--ignore-cors");
    if (options.closeCookieModals) args.push("--close-cookie-modals");
    if (options.maxScrollHeight != null) args.push("--max-scroll-height", String(options.maxScrollHeight));
    if (options.ignoreSslErrors) args.push("--ignore-ssl-errors");

    // Crawl filtering
    if (options.globs) {
      const globList = Array.isArray(options.globs) ? options.globs : [options.globs];
      args.push("--globs", globList.join(","));
    }
    if (options.excludes) {
      const excludeList = Array.isArray(options.excludes) ? options.excludes : [options.excludes];
      args.push("--excludes", excludeList.join(","));
    }
    if (options.linkSelector) args.push("--link-selector", options.linkSelector);
    if (options.keepUrlFragments) args.push("--keep-url-fragments");
    if (options.respectRobotsTxt) args.push("--respect-robots-txt");

    // Cookies & headers
    if (options.cookies) args.push("--cookies", JSON.stringify(options.cookies));
    if (options.headers) args.push("--headers", JSON.stringify(options.headers));

    // Concurrency & retries
    if (options.maxConcurrency != null) args.push("--max-concurrency", String(options.maxConcurrency));
    if (options.maxRetries != null) args.push("--max-retries", String(options.maxRetries));
    if (options.maxResults != null) args.push("--max-results", String(options.maxResults));

    // Output toggles
    if (options.saveRawHtml) args.push("--save-raw-html");
    if (options.saveText) args.push("--save-text");
    if (options.saveJson) args.push("--save-json");
    if (options.saveXml) args.push("--save-xml");
    if (options.saveXmlTei) args.push("--save-xml-tei");

    // Extraction options
    if (options.precision) args.push("--precision");
    if (options.recall) args.push("--recall");
    if (options.fast) args.push("--fast");
    if (options.noLinks) args.push("--no-links");
    if (options.noComments) args.push("--no-comments");
    if (options.includeTables === true) args.push("--include-tables");
    if (options.includeTables === false) args.push("--no-tables");
    if (options.includeImages) args.push("--include-images");
    if (options.includeFormatting === true) args.push("--include-formatting");
    if (options.includeFormatting === false) args.push("--no-formatting");
    if (options.deduplicate) args.push("--deduplicate");
    if (options.targetLanguage) args.push("--target-language", options.targetLanguage);
    if (options.withMetadata === true) args.push("--with-metadata");
    if (options.withMetadata === false) args.push("--no-metadata");
    if (options.pruneXpath) {
      const xpaths = Array.isArray(options.pruneXpath) ? options.pruneXpath : [options.pruneXpath];
      for (const xp of xpaths) {
        args.push("--prune-xpath", xp);
      }
    }

    // Diagnostics
    if (options.verbose) args.push("--verbose");

    // URLs as positional args (at the end)
    args.push(...urlList);

    const child = spawn(getBinaryPath(), args, {
      stdio: options.stdio || "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`contextractor exited with code ${code}`));
    });
  });
}

module.exports = { getBinaryPath, getBinaryName, extract };
