#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import QRCode from "qrcode";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

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

const baseUrl = normalizeBaseUrl(
  args["base-url"] ??
    process.env.PUBLIC_APP_URL ??
    process.env.VITE_PUBLIC_APP_URL ??
    "https://naszewielkiegreckiewesele.com",
);

const outDir = path.resolve(process.cwd(), args["out-dir"] ?? "qr-codes");
const format = String(args.format ?? "png").toLowerCase();
const size = args.size ? Number(args.size) : 512;
const limit = args.limit ? Number(args.limit) : undefined;

if (Number.isNaN(size) || size <= 0) {
  console.error("--size must be a positive number.");
  process.exit(1);
}

if (limit !== undefined && (Number.isNaN(limit) || limit <= 0)) {
  console.error("--limit must be a positive number when provided.");
  process.exit(1);
}

if (!["png", "svg"].includes(format)) {
  console.error("--format must be png or svg.");
  process.exit(1);
}

const client = new ConvexHttpClient(convexUrl);
const invitations = await client.query(api.invitations.listForAdmin, {});

const sortedInvitations = invitations
  .slice()
  .sort((a, b) => a.displayName.localeCompare(b.displayName));

const selected = limit ? sortedInvitations.slice(0, limit) : sortedInvitations;

await fs.mkdir(outDir, { recursive: true });

const manifest = [];

for (const invitation of selected) {
  const url = `${baseUrl}/auth/verify?token=${invitation.qrToken}`;
  const safeName =
    slugify(invitation.displayName) || `invitation-${invitation.shortCode}`;
  const filename = `${safeName}-${invitation.shortCode}.${format}`;
  const filePath = path.join(outDir, filename);

  await writeQrCode(filePath, url, format, size);

  manifest.push({
    displayName: invitation.displayName,
    shortCode: invitation.shortCode,
    qrToken: invitation.qrToken,
    url,
    file: filename,
  });
}

await fs.writeFile(
  path.join(outDir, "index.csv"),
  toCsv(manifest),
  "utf8",
);

await fs.writeFile(
  path.join(outDir, "index.json"),
  JSON.stringify(manifest, null, 2) + "\n",
  "utf8",
);

console.log(
  `Generated ${manifest.length} QR codes (${format}) in ${outDir}.`,
);

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

function normalizeBaseUrl(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  const normalized = trimmed.replace(/\/+$/, "");
  if (/^https?:\/\//i.test(normalized)) return normalized;
  return `https://${normalized}`;
}

function slugify(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

async function writeQrCode(filePath, value, format, size) {
  const options = {
    errorCorrectionLevel: "Q",
    margin: 2,
  };

  if (format === "png") {
    await QRCode.toFile(filePath, value, { ...options, width: size });
    return;
  }

  const svg = await QRCode.toString(value, { ...options, type: "svg" });
  await fs.writeFile(filePath, svg, "utf8");
}

function toCsv(rows) {
  const header = ["displayName", "shortCode", "qrToken", "url", "file"];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.displayName,
        row.shortCode,
        row.qrToken,
        row.url,
        row.file,
      ]
        .map(escapeCsv)
        .join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

function escapeCsv(value) {
  const raw = String(value ?? "");
  if (/[",\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function printHelp() {
  console.log(`Usage:
  node scripts/generate-qr.mjs [options]

Options:
  --base-url <url>     Base URL for QR links (default: production domain)
  --convex-url <url>   Convex URL (default: VITE_CONVEX_URL)
  --out-dir <dir>      Output directory (default: ./qr-codes)
  --format <png|svg>   Output format (default: png)
  --size <px>          PNG size in pixels (default: 512)
  --limit <n>          Only generate first n invitations
  --help               Show this help
`);
}
