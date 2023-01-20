/* eslint-disable no-console */

import { execSync } from "child_process";
import camelCase from "camelcase";
import { readFileSync, writeFileSync, existsSync, rmSync } from "fs";
import { z, type ZodType } from "zod";

const SOURCE_FILE = "./src/__generated__/figma-design-tokens.json";
const TMP_OUTPUT_FILE = "./src/__generated__/figma-design-tokens.tmp";
const OUTPUT_FILE = "./src/__generated__/figma-design-tokens.ts";

const TreeLeaf = z.object({
  type: z.string(),
  value: z.unknown(),
});

const SingleShadow = z.object({
  color: z.string(),
  type: z.enum(["dropShadow", "innerShadow"]),
  x: z.number(),
  y: z.number(),
  blur: z.number(),
  spread: z.number(),
});
const Shadow = z.union([SingleShadow, z.array(SingleShadow)]);

const parse = <T>(path: string[], value: unknown, schema: ZodType<T>) => {
  const result = schema.safeParse(value);
  if (result.success === false) {
    throw new Error(
      `Could not parse ${path.join(".")}. Got a error: ${result.error.message}`
    );
  }
  return result.data;
};

const printShadow = (path: string[], value: unknown) => {
  const shadow = parse(path, value, Shadow);

  const printSingleShadow = (shadow: z.infer<typeof SingleShadow>) => {
    return [
      shadow.type === "innerShadow" ? "inset" : "",
      `${shadow.x}px`,
      `${shadow.y}px`,
      `${shadow.blur}px`,
      `${shadow.spread}px`,
      `${shadow.color}`,
    ]
      .join(" ")
      .trim();
  };

  if (Array.isArray(shadow)) {
    return shadow.map(printSingleShadow).join(", ");
  }

  return printSingleShadow(shadow);
};

const traverse = (
  node: unknown,
  nodePath: string[],
  fn: (path: string[], type: string, value: unknown) => void
) => {
  if (typeof node !== "object" || node === null) {
    return;
  }

  const asLeaf = TreeLeaf.safeParse(node);
  if (asLeaf.success && asLeaf.data.value !== undefined) {
    fn(nodePath, asLeaf.data.type, asLeaf.data.value);
    return;
  }

  for (const [key, value] of Object.entries(node)) {
    traverse(value, [...nodePath, key], fn);
  }
};

const pathToName = (path: string[], type: string) => {
  const cleanedUp = path.join(" ").replace(/[^a-z0-9]+/gi, " ");

  const withoutPrefix = cleanedUp
    .toLocaleLowerCase()
    .startsWith(type.toLocaleLowerCase())
    ? cleanedUp.slice(type.length)
    : cleanedUp;

  return camelCase(withoutPrefix, { locale: false });
};

const main = () => {
  execSync(`token-transformer ${SOURCE_FILE} ${TMP_OUTPUT_FILE}`, {
    stdio: "inherit",
  });

  const data = JSON.parse(readFileSync(TMP_OUTPUT_FILE, "utf-8"));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byType = new Map<string, Record<string, any>>();

  traverse(data, [], (path, type, value) => {
    const record = byType.get(type) ?? {};
    byType.set(type, record);

    let printedValue = value;

    if (type === "boxShadow") {
      printedValue = printShadow(path, value);
    }

    // no need to check for __proto__ (prototype polution)
    // because we know pathToName returns a string without "_"
    record[pathToName(path, type)] = printedValue;
  });

  writeFileSync(
    OUTPUT_FILE,
    `// Generated by transform-figma-tokens.ts from ${SOURCE_FILE}\n\n` +
      [...byType.entries()]
        .map(
          ([type, values]) =>
            `export const ${type} = ${JSON.stringify(values)} as const`
        )
        .join(";\n\n")
  );

  execSync(`prettier --write ${OUTPUT_FILE}`, { stdio: "inherit" });
};

const cleanup = () => {
  if (existsSync(TMP_OUTPUT_FILE)) {
    rmSync(TMP_OUTPUT_FILE);
  }
};

try {
  main();
} catch (error) {
  try {
    cleanup();
  } catch (cleanupError) {
    console.error("Cleanup failed:", cleanupError);
  }
  throw error;
}
cleanup();
