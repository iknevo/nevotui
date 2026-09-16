import { execFileSync } from "node:child_process";
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
  "nevotui-win32-x64-msvc",
];

function npmPublish(dir) {
  const name = JSON.parse(readFileSync(path.join(dir, "package.json"))).name;
  console.log(`\n> npm publish ${name}`);
  execFileSync("npm", ["publish", "--access", "public"], {
    cwd: dir,
    stdio: "inherit",
    env: process.env,
  });
}

if (!existsSync(DIST)) {
  console.error("publish.mjs: dist/npm is missing - run scripts/build.mjs first");
  process.exit(1);
}

for (const pkg of ORDER) {
  const dir = path.join(DIST, pkg);
  if (existsSync(dir)) npmPublish(dir);
}

const packed = readdirSync(DIST)
  .filter((d) => !ORDER.includes(d) && existsSync(path.join(DIST, d, "package.json")));
for (const pkg of packed) npmPublish(path.join(DIST, pkg));

npmPublish(ROOT);
console.log("\nAll packages published.");