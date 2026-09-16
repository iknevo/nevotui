#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const { platform, arch } = process;

const targets = {
  "linux-x64": [
    { name: "nevotui-linux-x64-gnu", bin: "bin/nevotui" },
    { name: "nevotui-linux-x64-musl", bin: "bin/nevotui" },
  ],
  "linux-arm64": [
    { name: "nevotui-linux-arm64-gnu", bin: "bin/nevotui" },
    { name: "nevotui-linux-arm64-musl", bin: "bin/nevotui" },
  ],
  "darwin-x64": [{ name: "nevotui-darwin-x64", bin: "bin/nevotui" }],
  "darwin-arm64": [{ name: "nevotui-darwin-arm64", bin: "bin/nevotui" }],
  "win32-x64": [{ name: "nevotui-windows-x64-msvc", bin: "bin/nevotui.exe" }],
};

const candidates = targets[`${platform}-${arch}`];
if (!candidates) {
  console.error(
    `nevotui: unsupported platform "${platform}-${arch}".\n` +
      "Supported platforms: linux x64/arm64, macOS x64/arm64, Windows x64.",
  );
  process.exit(1);
}

let binPath = null;
let lastError = null;
for (const { name, bin } of candidates) {
  try {
    const pkgDir = path.dirname(require.resolve(`${name}/package.json`));
    binPath = path.join(pkgDir, bin);
    break;
  } catch (err) {
    lastError = err;
  }
}

if (!binPath) {
  const tried = candidates.map((c) => c.name).join(", ");
  console.error(
    `nevotui: the binary package is not installed (tried ${tried}).\n` +
      "This usually means the optional dependency didn't resolve.\n" +
      "Try reinstalling: npm install -g nevotui  (or npx nevotui --yes)",
  );
  if (process.env.NEVOTUI_DEBUG) console.error(lastError);
  process.exit(1);
}

const child = spawn(binPath, process.argv.slice(2), { stdio: "inherit" });
child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
child.on("error", (err) => {
  console.error(`nevotui: failed to launch binary at ${binPath}:`, err.message);
  process.exit(1);
});