import { createFileRoute } from "@tanstack/react-router";
import { api } from "../../../../convex/_generated/api";
import { getConvexServerClient } from "@/lib/convex-server";
import { createInvitationCookie } from "@/lib/invitation-cookie";

export const Route = createFileRoute("/api/invitations/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => null);
        const shortCode = typeof body?.shortCode === "string" ? body.shortCode : "";
        const normalized = shortCode.replace(/\s+/g, "").trim();

        if (!normalized) {
          return Response.json(
            { ok: false, error: "missing-code" },
            { status: 400 }
          );
        }

        const convex = getConvexServerClient();
        const invitationId = await convex.query(api.invitations.getIdByShortCode, {
          shortCode: normalized,
        });

        if (!invitationId) {
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
