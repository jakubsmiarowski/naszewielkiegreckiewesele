#!/usr/bin/env node
import process from "node:process";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const DEFAULT_EMAILS = [
  "admin.demo+1@example.com",
  "admin.demo+2@example.com",
];

const args = parseArgs(process.argv.slice(2));

if (args.help || args.h) {
  printHelp();
  process.exit(0);
}

const convexUrl =
  args["convex-url"] ??
  process.env.VITE_CONVEX_URL ??
  process.env.CONVEX_URL ??
  "";

if (!convexUrl) {
  console.error(
    "Missing Convex URL. Provide --convex-url or set VITE_CONVEX_URL.",
  );
  process.exit(1);
}

const internalApiKey =
  args["internal-api-key"] ??
  process.env.INTERNAL_API_KEY ??
  "";

if (!internalApiKey) {
  console.error(
    "Missing INTERNAL_API_KEY. Provide --internal-api-key or set INTERNAL_API_KEY.",
  );
  process.exit(1);
}

const emails = parseEmailsArg(args.emails) ?? DEFAULT_EMAILS;
if (emails.length === 0) {
  console.error("No emails provided. Use --emails or keep defaults.");
  process.exit(1);
}

const client = new ConvexHttpClient(convexUrl);

const result = await client.mutation(api.adminUsers.seedAdmins, {
  emails,
  internalApiKey,
});

console.log("Admin seeding completed.");
console.log(`Processed: ${result.totalProcessed}`);
console.log(`Inserted: ${result.inserted}`);
console.log(`Reactivated: ${result.reactivated}`);
console.log(`Already active: ${result.alreadyActive}`);
console.log("Emails:");
for (const email of emails) {
  console.log(`- ${email}`);
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

function parseEmailsArg(value) {
  if (typeof value !== "string") return null;
  const entries = value
    .split(/[,\n; ]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from(new Set(entries));
}

function printHelp() {
  console.log(`Usage:
  node scripts/seed-admin-users.mjs [options]

Options:
  --convex-url <url>     Convex URL (default: VITE_CONVEX_URL)
  --internal-api-key     Internal API key
  --emails "<list>"      Comma/space separated emails (optional)
  --help                 Show this help

Defaults:
  ${DEFAULT_EMAILS.join(", ")}
`);
}
