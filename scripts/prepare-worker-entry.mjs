#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const entryPath = resolve("dist/server/index.js");
const entrySource =
  'export { default } from "@tanstack/react-start/server-entry";\n';

await mkdir(resolve("dist/server"), { recursive: true });
await writeFile(entryPath, entrySource, "utf8");

console.log(`[build-entry] Prepared ${entryPath}`);
