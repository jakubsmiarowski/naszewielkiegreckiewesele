import { getAdminTokenSecret, isConfiguredAdminEmail } from "./adminConfig";
import type { MutationCtx, QueryCtx } from "./_generated/server";

type AdminAccessPayload = {
  email: string;
  issuedAt: number;
  expiresAt: number;
};

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function signPayload(payload: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toHex(new Uint8Array(signature));
}

async function verifyAdminToken(token: string) {
  const separatorIndex = token.lastIndexOf(".");
  if (separatorIndex <= 0 || separatorIndex >= token.length - 1) {
    throw new Error("Nieprawidłowy token admina.");
  }

  const encodedPayload = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);
  const expectedSignature = await signPayload(encodedPayload, getAdminTokenSecret());
  if (!timingSafeEqual(signature, expectedSignature)) {
    throw new Error("Nieprawidłowy podpis tokenu admina.");
  }

  const rawPayload = decodeURIComponent(encodedPayload);
  const payload = JSON.parse(rawPayload) as AdminAccessPayload;
  if (
    typeof payload?.email !== "string" ||
    typeof payload?.issuedAt !== "number" ||
    typeof payload?.expiresAt !== "number"
  ) {
    throw new Error("Nieprawidłowy payload tokenu admina.");
  }

  if (payload.expiresAt <= Date.now()) {
    throw new Error("Token admina wygasł.");
  }

  if (!isConfiguredAdminEmail(payload.email)) {
    throw new Error("Konto nie ma już uprawnień administratora.");
  }

  return payload;
}

export async function requireAdminAccess(
  _ctx: QueryCtx | MutationCtx,
  adminAccessToken: string,
) {
  if (!adminAccessToken?.trim()) {
    throw new Error("Brak tokenu administratora.");
  }
  const payload = await verifyAdminToken(adminAccessToken.trim());
  return {
    email: payload.email.toLowerCase(),
    issuedAt: payload.issuedAt,
    expiresAt: payload.expiresAt,
  };
}
