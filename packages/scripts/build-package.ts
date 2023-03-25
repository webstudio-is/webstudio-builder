#!/usr/bin/env tsx

import { rm, cp, access } from "node:fs/promises";
import { join } from "node:path";
import { totalist } from "totalist";
import { build } from "esbuild";

const args = process.argv.slice(2);
const watch = args.includes("--watch");

const entryPoints: string[] = [];
const assets: string[] = [];

await totalist("./src", (rel) => {
  if (rel.endsWith(".ts") || rel.endsWith(".tsx")) {
    if (
      rel.includes(".test.") ||
      rel.includes(".stories.") ||
      rel.includes("__generated__/")
    ) {
      return;
    }
    entryPoints.push(join("src", rel));
  }
  if (rel.endsWith(".json")) {
    assets.push(rel);
  }
});

await rm("lib", { recursive: true, force: true });

await build({
  entryPoints,
  outdir: "lib",
  format: "esm",
  watch: watch && {
    onRebuild(error) {
      if (error) {
        console.error("watch build failed:", error);
      } else {
        console.info("watch build succeeded");
      }
    },
  },
});

await build({
  entryPoints,
  outdir: "lib/cjs",
  format: "cjs",
  outExtension: {
    ".js": ".cjs",
  },
  watch,
});

for (const rel of assets) {
  await cp(join("src", rel), join("lib", rel));
  await cp(join("src", rel), join("lib/cjs", rel));
}

if (
  await access("./src/__generated__")
    .then(() => true)
    .catch(() => false)
) {
  await cp("./src/__generated__", "./lib/__generated__", { recursive: true });
  await cp("./src/__generated__", "./lib/cjs/__generated__", {
    recursive: true,
  });
}

if (watch) {
  console.info("watching...");
} else {
  console.info("build succeeded");
}
