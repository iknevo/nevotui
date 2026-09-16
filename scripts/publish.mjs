import { spawnSync } from "node:child_process";
import { readdirSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST = path.join(ROOT, "dist", "npm");

const ORDER = [
  "nevotui-linux-x64-gnu",
  "nevotui-linux-arm64-gnu",
  "nevotui-linux-x64-musl",
  "nevotui-linux-arm64-musl",
  "nevotui-darwin-x64",
  "nevotui-darwin-arm64",
  "nevotui-windows-x64-msvc",
];

const EXISTING_MSG = "cannot publish over the previously published versions";

function npmPublish(dir) {
  const name = JSON.parse(readFileSync(path.join(dir, "package.json"))).name;
  console.log(`\n> npm publish ${name}`);
  const res = spawnSync("npm", ["publish", "--access", "public"], {
    cwd: dir,
    encoding: "utf8",
    env: process.env,
  });
  process.stdout.write(res.stdout ?? "");
  process.stderr.write(res.stderr ?? "");
  if (res.status === 0) return;
  if (res.stderr?.includes(EXISTING_MSG)) {
    console.log(`! ${name} already published - skipping`);
    return;
  }
  throw new Error(`npm publish ${name} failed (exit ${res.status})`);
}

let failed = false;
function publishOrSkip(label, dir) {
  if (existsSync(dir)) {
    try {
      npmPublish(dir);
    } catch (err) {
      failed = true;
      console.error(`\n! Skipped ${label}: ${err.message}`);
    }
  }
}

if (!existsSync(DIST)) {
  console.error("publish.mjs: dist/npm is missing - run scripts/build.mjs first");
  process.exit(1);
}

for (const pkg of ORDER) publishOrSkip(pkg, path.join(DIST, pkg));

const packed = readdirSync(DIST)
  .filter((d) => !ORDER.includes(d) && existsSync(path.join(DIST, d, "package.json")));
for (const pkg of packed) publishOrSkip(pkg, path.join(DIST, pkg));

publishOrSkip("nevotui", ROOT);
if (failed) process.exit(1);
console.log("\nAll packages published.");