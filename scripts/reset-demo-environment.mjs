#!/usr/bin/env node
import process from "node:process";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const args = parseArgs(process.argv.slice(2));

if (args.help || args.h) {
  printHelp();
  process.exit(0);
}

const convexUrl =
  args["convex-url"] ??
  process.env.VITE_CONVEX_DEMO_URL ??
  process.env.VITE_CONVEX_URL ??
  process.env.CONVEX_DEMO_URL ??
  process.env.CONVEX_URL ??
  "";

if (!convexUrl) {
  console.error("Missing Convex URL. Provide --convex-url or set VITE_CONVEX_DEMO_URL.");
  process.exit(1);
}

const internalApiKey =
  args["internal-api-key"] ?? process.env.INTERNAL_API_KEY ?? "";

if (!internalApiKey) {
  console.error(
    "Missing INTERNAL_API_KEY. Provide --internal-api-key or set INTERNAL_API_KEY.",
  );
  process.exit(1);
}

const client = new ConvexHttpClient(convexUrl);

const result = await client.mutation((api).demo.resetDemoEnvironment, {
  internalApiKey,
});

console.log("Demo reset completed.");
console.log(`Removed invitations: ${result.removed.invitations}`);
console.log(`Removed guests: ${result.removed.guests}`);
console.log(`Removed offers: ${result.removed.carpoolOffers}`);
console.log(`Removed requests: ${result.removed.carpoolRequests}`);
console.log(`Removed Q&A: ${result.removed.qaQuestions}`);
console.log(`Seeded invitations: ${result.seeded.invitations}`);
console.log(`Seeded guests: ${result.seeded.guests}`);
console.log(`Seeded Q&A: ${result.seeded.qaQuestions}`);
console.log("Demo PIN codes:");
for (const shortCode of result.demoShortCodes) {
  console.log(`- ${shortCode}`);
}

function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      result[key] = true;
    } else {
      result[key] = next;
      i += 1;
    }
  }
  return result;
}

function printHelp() {
  console.log(`Usage:
  node scripts/reset-demo-environment.mjs [options]

Options:
  --convex-url <url>      Demo Convex URL (default: VITE_CONVEX_DEMO_URL)
  --internal-api-key      Internal API key
  --help                  Show this help
`);
}
