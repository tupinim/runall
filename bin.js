#!/usr/bin/env node
const { spawnSync } = require("child_process");
const { platform } = require("os");
const { join } = require("path");
const { existsSync } = require("fs");

// This is a work in progress.

let cmd;
const binPath = (path) => {
  const joined = join(__dirname, path);

  if (!existsSync(joined)) {
    console.error("Unsupported OS/Architecture");
    process.exit(1);
  }

  return joined;
}

switch (platform()) {
  case "win32":
    console.error("Unsupported OS");
    process.exit(1);
    break;
  case "darwin":
    const path = binPath(`/out/runall-darwin-${os.arch()}/runall.app`);
    cmd = `open -a "${path}" --args --cwd="$(pwd)"`;
    break;
  case "linux":
    console.error("Unsupported OS");
    process.exit(1);
    break;
  default:
    console.error("Unsupported OS");
    process.exit(1);
}

const result = spawnSync(cmd, process.argv.slice(2), { stdio: "inherit" });
process.exit(result.status);
