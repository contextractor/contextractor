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

function extract(configPath, options = {}) {
  return new Promise((resolve, reject) => {
    const args = [configPath];
    if (options.precision) args.push("--precision");
    if (options.recall) args.push("--recall");
    if (options.noLinks) args.push("--no-links");
    if (options.noComments) args.push("--no-comments");
    if (options.outputDir) args.push("--output-dir", options.outputDir);
    if (options.format) args.push("--format", options.format);
    if (options.verbose) args.push("--verbose");

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
