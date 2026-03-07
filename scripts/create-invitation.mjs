#!/usr/bin/env node
import process from "node:process";
import { ConvexHttpClient } from "convex/browser";

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
  process.env.BETTER_AUTH_SECRET ??
  "";

if (!internalApiKey) {
  console.error(
    "Missing INTERNAL_API_KEY. Provide --internal-api-key or set INTERNAL_API_KEY.",
  );
  process.exit(1);
}

const guests = getGuestsFromArgs(args);
if (guests.length === 0) {
  console.error(
    "Missing guest name. Use --guest \"Imię Nazwisko\" (repeatable) or --guests \"A, B\".",
  );
  process.exit(1);
}

const baseUrl = normalizeBaseUrl(
  args["base-url"] ??
    process.env.PUBLIC_APP_URL ??
    process.env.VITE_PUBLIC_APP_URL ??
    "https://naszewielkiegreckiewesele.com",
);

const hasPlusOne = args["plus-one"] === true;
const notes = typeof args.notes === "string" ? args.notes : undefined;

const client = new ConvexHttpClient(convexUrl);
const result = await client.mutation("invitations:createSingleInvitation", {
  internalApiKey,
  guests,
  hasPlusOne,
  notes,
});

const invitationUrl = `${baseUrl}/auth/verify?token=${result.qrToken}`;

console.log("Invitation created successfully.\n");
console.log(`Guests: ${result.guests.join(", ")}`);
console.log(`Display name: ${result.displayName}`);
console.log(`PIN: ${result.shortCode}`);
console.log(`Token: ${result.qrToken}`);
console.log(`Link: ${invitationUrl}`);

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;

    const key = arg.slice(2);
    const next = argv[index + 1];

    if (!next || next.startsWith("--")) {
      if (key === "guest") {
        result.guest = result.guest ?? [];
      } else {
        result[key] = true;
      }
      continue;
    }

    if (key === "guest") {
      result.guest = result.guest ?? [];
      result.guest.push(next);
    } else {
      result[key] = next;
    }
    index += 1;
  }
  return result;
}

function getGuestsFromArgs(argsObject) {
  const guests = [];

  if (Array.isArray(argsObject.guest)) {
    guests.push(...argsObject.guest);
  }

  if (typeof argsObject.guests === "string") {
    guests.push(
      ...argsObject.guests
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean),
    );
  }

  return guests;
}

function normalizeBaseUrl(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  const normalized = trimmed.replace(/\/+$/, "");
  if (/^https?:\/\//i.test(normalized)) return normalized;
  return `https://${normalized}`;
}

function printHelp() {
  console.log(`Usage:
  node scripts/create-invitation.mjs [options]

Options:
  --guest <name>         Guest full name (repeatable)
  --guests <list>        Comma-separated guest names
  --plus-one             Mark invitation as allowing +1
  --notes <text>         Optional invitation note
  --base-url <url>       Base URL for invitation link
  --convex-url <url>     Convex URL (default: VITE_CONVEX_URL)
  --internal-api-key     Internal key for admin mutation access
  --help                 Show this help
`);
}
