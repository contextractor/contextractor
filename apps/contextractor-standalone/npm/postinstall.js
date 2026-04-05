"use strict";

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { getBinaryName, getBrowsersPath } = require("./index");

const REPO = "contextractor/contextractor";
const BIN_DIR = path.join(__dirname, "bin");
const BROWSERS_DIR = getBrowsersPath();

function getPackageJson() {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, "package.json"), "utf8")
  );
}

function getPackageVersion() {
  return getPackageJson().version;
}

function getPlaywrightVersion() {
  return getPackageJson().playwrightVersion;
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

  // Download binary if not present
  if (fs.existsSync(dest)) {
    console.log(`Binary already exists: ${dest}`);
  } else {
    console.log(`Downloading contextractor ${tag} for ${process.platform}-${process.arch}...`);
    console.log(`  ${url}`);

    try {
      await download(url, dest);
    } catch (err) {
      console.error(
        `Failed to download binary: ${err.message}\n\n` +
          `Your platform (${process.platform}-${process.arch}) may not be supported.\n` +
          `Supported: darwin-arm64, linux-x64, linux-arm64, win-x64\n` +
          `See https://github.com/${REPO}/releases for available binaries.`
      );
      process.exit(1);
    }

    // Make executable on Unix
    if (process.platform !== "win32") {
      fs.chmodSync(dest, 0o755);
    }

    console.log("Binary installed successfully.");
  }

  // Install Playwright Chromium into package-local browsers dir
  // Use the exact Playwright version that matches the bundled Python binary
  const pwVersion = getPlaywrightVersion();
  if (fs.existsSync(BROWSERS_DIR) && fs.readdirSync(BROWSERS_DIR).length > 0) {
    console.log(`Playwright browsers already installed: ${BROWSERS_DIR}`);
  } else {
    console.log(`Installing Playwright ${pwVersion} Chromium...`);
    fs.mkdirSync(BROWSERS_DIR, { recursive: true });
    try {
      execSync(`npx -y playwright@${pwVersion} install chromium`, {
        stdio: "inherit",
        timeout: 300000,
        env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: BROWSERS_DIR },
      });
    } catch {
      console.warn(
        "Warning: Failed to install Playwright Chromium automatically.\n" +
          `Run 'PLAYWRIGHT_BROWSERS_PATH=${BROWSERS_DIR} npx playwright@${pwVersion} install chromium' manually.`
      );
    }
  }
}

main();
