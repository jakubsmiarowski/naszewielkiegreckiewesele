function readAdminEmailsRaw() {
  const viteEnv = (import.meta as { env?: Record<string, string | undefined> }).env;
  const nodeEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process?.env;
  return viteEnv?.VITE_ADMIN_EMAILS ?? nodeEnv?.ADMIN_EMAILS ?? nodeEnv?.VITE_ADMIN_EMAILS ?? "";
}

function parseAdminEmails(raw: string) {
  return new Set(
    raw
      .split(/[,\n; ]+/)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function getConfiguredAdminEmails() {
  return parseAdminEmails(readAdminEmailsRaw());
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  const admins = getConfiguredAdminEmails();
  return admins.has(email.trim().toLowerCase());
}
