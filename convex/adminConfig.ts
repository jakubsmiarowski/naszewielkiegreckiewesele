const ENV = (globalThis as { process?: { env?: Record<string, string | undefined> } })
  .process?.env;

function parseEmails(raw: string | undefined) {
  return new Set(
    (raw ?? "")
      .split(/[,\n; ]+/)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function getConfiguredAdminEmails() {
  return parseEmails(ENV?.ADMIN_EMAILS ?? ENV?.VITE_ADMIN_EMAILS);
}

export function isConfiguredAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  const admins = getConfiguredAdminEmails();
  return admins.has(email.trim().toLowerCase());
}

export function getAdminTokenSecret() {
  const secret = ENV?.ADMIN_TOKEN_SECRET ?? ENV?.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error("Brak ADMIN_TOKEN_SECRET (lub BETTER_AUTH_SECRET) w środowisku Convex.");
  }
  return secret;
}

export function getInternalApiKey() {
  const key = ENV?.INTERNAL_API_KEY ?? ENV?.BETTER_AUTH_SECRET;
  if (!key) {
    throw new Error("Brak INTERNAL_API_KEY (lub BETTER_AUTH_SECRET) w środowisku Convex.");
  }
  return key;
}
