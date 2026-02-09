const ADMIN_ACCESS_TTL_MS = 30 * 60 * 1000;
const ENV = (globalThis as { process?: { env?: Record<string, string | undefined> } })
	.process?.env ?? {};

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

function getRequiredEnv(name: string) {
  const value = ENV[name];
  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }
  return value;
}

export function getInternalApiKey() {
  return ENV.INTERNAL_API_KEY ?? getRequiredEnv("BETTER_AUTH_SECRET");
}

export async function createAdminAccessToken(email: string) {
  const now = Date.now();
  const payload = {
    email: email.trim().toLowerCase(),
    issuedAt: now,
    expiresAt: now + ADMIN_ACCESS_TTL_MS,
  };
  const encodedPayload = encodeURIComponent(JSON.stringify(payload));
  const signature = await signPayload(
    encodedPayload,
    ENV.ADMIN_TOKEN_SECRET ?? getRequiredEnv("BETTER_AUTH_SECRET"),
  );
  return {
    token: `${encodedPayload}.${signature}`,
    expiresAt: payload.expiresAt,
  };
}
