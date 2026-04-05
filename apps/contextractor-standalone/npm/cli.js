#!/usr/bin/env node

"use strict";

const { spawn } = require("child_process");
const { getBinaryPath, getBrowsersPath } = require("./index");

const binaryPath = getBinaryPath();
const child = spawn(binaryPath, process.argv.slice(2), {
  stdio: "inherit",
  env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: getBrowsersPath() },
});

child.on("error", (err) => {
  if (err.code === "ENOENT") {
    console.error(
      `contextractor binary not found at ${binaryPath}\n` +
        "Try reinstalling: npm install contextractor"
    );
    process.exit(1);
  }
  throw err;
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
