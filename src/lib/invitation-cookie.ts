const COOKIE_NAME = "crux";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

export function getInvitationIdFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const parts = cookieHeader.split(";").map((part) => part.trim());
  const cookie = parts.find((part) => part.startsWith(`${COOKIE_NAME}=`));
  if (!cookie) return null;

  const value = cookie.slice(COOKIE_NAME.length + 1).trim();
  return value ? decodeURIComponent(value) : null;
}

export function createInvitationCookie(invitationId: string, request: Request) {
  const url = new URL(request.url);
  const isSecure = url.protocol === "https:";
  const attributes = [
    `${COOKIE_NAME}=${encodeURIComponent(invitationId)}`,
    "Path=/",
    `Max-Age=${MAX_AGE_SECONDS}`,
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (isSecure) {
    attributes.push("Secure");
  }
  return attributes.join("; ");
}

export function clearInvitationCookie(request: Request) {
  const url = new URL(request.url);
  const isSecure = url.protocol === "https:";
  const attributes = [
    `${COOKIE_NAME}=`,
    "Path=/",
    "Max-Age=0",
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (isSecure) {
    attributes.push("Secure");
  }
  return attributes.join("; ");
}

export const INVITATION_COOKIE_NAME = COOKIE_NAME;
