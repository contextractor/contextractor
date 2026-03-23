"use strict";

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { getBinaryName } = require("./index");

const REPO = "contextractor/contextractor";
const BIN_DIR = path.join(__dirname, "bin");

function getPackageVersion() {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(__dirname, "package.json"), "utf8")
  );
  return pkg.version;
}

function follow(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    mod.get(url, { headers: { "User-Agent": "contextractor-npm" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return follow(res.headers.location).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      resolve(res);
    }).on("error", reject);
  });
}

async function download(url, dest) {
  const res = await follow(url);
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    res.pipe(file);
    file.on("finish", () => file.close(resolve));
    file.on("error", reject);
  });
}

async function main() {
  const binaryName = getBinaryName();
  const version = getPackageVersion();
  const tag = `v${version}`;
  const url = `https://github.com/${REPO}/releases/download/${tag}/${binaryName}`;

  fs.mkdirSync(BIN_DIR, { recursive: true });
  const dest = path.join(BIN_DIR, binaryName);

  // Skip if binary already exists
  if (fs.existsSync(dest)) {
    console.log(`Binary already exists: ${dest}`);
    return;
  }

  console.log(`Downloading contextractor ${tag} for ${process.platform}-${process.arch}...`);
  console.log(`  ${url}`);

  try {
    await download(url, dest);
  } catch (err) {
    console.error(
      `Failed to download binary: ${err.message}\n\n` +
        `Your platform (${process.platform}-${process.arch}) may not be supported.\n` +
        `Supported: darwin-x64, darwin-arm64, linux-x64, linux-arm64, win-x64\n` +
        `See https://github.com/${REPO}/releases for available binaries.`
    );
    process.exit(1);
  }

  // Make executable on Unix
  if (process.platform !== "win32") {
    fs.chmodSync(dest, 0o755);
  }

  console.log("Binary installed successfully.");

  // Install Playwright Chromium
  console.log("Installing Playwright Chromium...");
  try {
    execSync("npx playwright install chromium", {
      stdio: "inherit",
      timeout: 300000,
    });
  } catch {
    console.warn(
      "Warning: Failed to install Playwright Chromium automatically.\n" +
        "Run 'npx playwright install chromium' manually."
    );
  }
}

main();
