import { execFileSync } from "node:child_process";
import { copyFileSync, chmodSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DIST = path.join(ROOT, "dist", "npm");

const TARGETS = {
  "x86_64-unknown-linux-gnu": {
    pkg: "nevotui-linux-x64-gnu",
    os: ["linux"],
    cpu: ["x64"],
    libc: ["glibc"],
  },
  "aarch64-unknown-linux-gnu": {
    pkg: "nevotui-linux-arm64-gnu",
    os: ["linux"],
    cpu: ["arm64"],
    libc: ["glibc"],
  },
  "x86_64-unknown-linux-musl": {
    pkg: "nevotui-linux-x64-musl",
    os: ["linux"],
    cpu: ["x64"],
    libc: ["musl"],
  },
  "aarch64-unknown-linux-musl": {
    pkg: "nevotui-linux-arm64-musl",
    os: ["linux"],
    cpu: ["arm64"],
    libc: ["musl"],
  },
  "x86_64-apple-darwin": {
    pkg: "nevotui-darwin-x64",
    os: ["darwin"],
    cpu: ["x64"],
  },
  "aarch64-apple-darwin": {
    pkg: "nevotui-darwin-arm64",
    os: ["darwin"],
    cpu: ["arm64"],
  },
  "x86_64-pc-windows-msvc": {
    pkg: "nevotui-windows-x64-msvc",
    os: ["win32"],
    cpu: ["x64"],
  },
};

function parseArgs() {
  const args = process.argv.slice(2);
  const flags = new Set();
  const triples = [];
  let tool = "cargo";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--tool" && args[i + 1]) {
      tool = args[++i];
    } else if (args[i] === "--list-targets") {
      flags.add("list-targets");
    } else if (args[i] === "--clean") {
      flags.add("clean");
    } else if (args[i].startsWith("--")) {
      console.error(`build.mjs: unknown flag ${args[i]}`);
      process.exit(1);
    } else {
      triples.push(args[i]);
    }
  }
  return { tool, triples, flags };
}

function rustVersion() {
  const out = execFileSync("cargo", [
    "metadata",
    "--no-deps",
    "--format-version=1",
    "--manifest-path",
    path.join(ROOT, "Cargo.toml"),
  ]).toString();
  return JSON.parse(out).packages[0].version;
}

function buildBinary(tool, triple) {
  const wrapped = `${tool} build --release --target ${triple}`;
  console.log(`\n> ${wrapped}`);
  execFileSync(tool, ["build", "--release", "--target", triple], {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });
}

function main() {
  const { tool, triples, flags } = parseArgs();
  const version = rustVersion();
  console.log(`nevotui v${version}`);

  if (flags.has("list-targets")) {
    for (const t of Object.keys(TARGETS)) console.log(t);
    return;
  }

  if (flags.has("clean")) rmSync(DIST, { recursive: true, force: true });
  mkdirSync(DIST, { recursive: true });

  for (const triple of triples) {
    const meta = TARGETS[triple];
    if (!meta) {
      console.error(`build.mjs: unknown target "${triple}"`);
      process.exit(1);
    }
    buildBinary(tool, triple);
    const pkgDir = path.join(DIST, meta.pkg);
    mkdirSync(path.join(pkgDir, "bin"), { recursive: true });

    const isWindows = triple.endsWith("msvc");
    const binName = isWindows ? "nevotui.exe" : "nevotui";
    const srcBin = path.join(ROOT, "target", triple, "release", binName);
    const dstBin = path.join(pkgDir, "bin", binName);
    copyFileSync(srcBin, dstBin);
    if (!isWindows) chmodSync(dstBin, 0o755);

    const pkg = {
      name: meta.pkg,
      version,
      description: `nevotui binary for ${triple}`,
      license: "MIT",
      os: meta.os,
      cpu: meta.cpu,
      ...(meta.libc ? { libc: meta.libc } : {}),
      files: ["bin"],
    };
    writeFileSync(path.join(pkgDir, "package.json"), JSON.stringify(pkg, null, 2) + "\n");
    console.log(`  -> ${path.relative(ROOT, dstBin)}`);
  }
}

main();