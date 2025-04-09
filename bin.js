#!/usr/bin/env node
const { spawnSync } = require("child_process");
const os = require("os");
const { join } = require("path");
const { existsSync } = require("fs");

const plat = os.platform();
const arch = os.arch();
const ext = plat === "win32" ? ".exe" : plat === "darwin" ? ".app" : "";
const path = join(__dirname, `out/Runall-${plat}-${arch}/Runall${ext}`);
let result;

if (!existsSync(path)) {
  console.error("Unsupported OS/Architecture");
  process.exit(1);
}

if (plat === 'darwin') {
  result = spawnSync('open', [
    '-a', path,
    '--args',
    '--cwd="$(pwd)"',
    ...process.argv.slice(2),
  ], { stdio: "inherit", shell: true });
}

if (['win32', 'linux'].includes(plat)) {
  result = spawnSync(path, process.argv.slice(2), { stdio: "inherit" });
}

process.exit(result.status);
