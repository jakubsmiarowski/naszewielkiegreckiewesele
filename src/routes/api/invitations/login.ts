import { createFileRoute } from "@tanstack/react-router";
import { api } from "../../../../convex/_generated/api";
import { getInternalApiKey } from "@/lib/admin-access-token";
import { getConvexServerClient } from "@/lib/convex-server";
import { createInvitationCookie } from "@/lib/invitation-cookie";

function extractClientIp(request: Request) {
  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}

function buildThrottleKeys(request: Request, normalizedShortCode: string) {
  const ipKey = `ip:${extractClientIp(request)}`;
  const codeKey = normalizedShortCode ? `code:${normalizedShortCode}` : null;
  return [ipKey, codeKey].filter((key): key is string => Boolean(key));
}

export const Route = createFileRoute("/api/invitations/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => null);
        const shortCode = typeof body?.shortCode === "string" ? body.shortCode : "";
        const normalized = shortCode.replace(/\s+/g, "").trim();
        const throttleKeys = buildThrottleKeys(request, normalized);
        const internalApiKey = getInternalApiKey();
        const convex = getConvexServerClient();

        if (!normalized) {
          for (const key of throttleKeys) {
            await convex.mutation(api.security.recordPinLoginAttempt, {
              key,
              succeeded: false,
              internalApiKey,
            });
          }
          return Response.json(
            { ok: false, error: "missing-code" },
            { status: 400 }
          );
        }

        for (const key of throttleKeys) {
          const state = await convex.query(api.security.getPinThrottleState, {
            key,
            internalApiKey,
          });
          if (state.isBlocked) {
            return Response.json(
              {
                ok: false,
                error: "too-many-attempts",
                retryAfterSeconds: state.retryAfterSeconds,
              },
              {
                status: 429,
                headers: {
                  "Retry-After": String(state.retryAfterSeconds),
                },
              },
            );
          }
        }

        const invitationId = await convex.query(api.invitations.getIdByShortCode, {
          shortCode: normalized,
        });
        const attemptStates = await Promise.all(
          throttleKeys.map((key) =>
            convex.mutation(api.security.recordPinLoginAttempt, {
              key,
              succeeded: Boolean(invitationId),
              internalApiKey,
            }),
          ),
        );

        if (!invitationId) {
          const blockedState = attemptStates.find((state) => state.isBlocked);
          if (blockedState) {
            return Response.json(
              {
                ok: false,
                error: "too-many-attempts",
                retryAfterSeconds: blockedState.retryAfterSeconds,
              },
              {
                status: 429,
                headers: {
                  "Retry-After": String(blockedState.retryAfterSeconds),
                },
              },
            );
          }
          return Response.json(
            { ok: false, error: "invalid-code" },
            { status: 401 }
          );
        }

        const cookie = createInvitationCookie(invitationId, request);
        return Response.json(
          { ok: true },
          {
            headers: {
              "Set-Cookie": cookie,
            },
          }
        );
      },
    },
  },
});
