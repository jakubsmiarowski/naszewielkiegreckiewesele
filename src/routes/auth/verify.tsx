import { createFileRoute } from "@tanstack/react-router";
import { api } from "../../../convex/_generated/api";
import { getConvexServerClient } from "@/lib/convex-server";
import { createInvitationCookie } from "@/lib/invitation-cookie";

export const Route = createFileRoute("/auth/verify")({
  component: () => null,
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get("token")?.trim();
        if (!token) {
          return new Response(null, {
            status: 302,
            headers: {
              Location: "/?error=missing-token",
            },
          });
        }

        const convex = getConvexServerClient();
        const invitationId = await convex.query(api.invitations.getIdByToken, {
          token,
        });

        if (!invitationId) {
          return new Response(null, {
            status: 302,
            headers: {
              Location: "/?error=invalid-token",
            },
          });
        }

        await convex.mutation(api.invitations.markViewed, { invitationId });

        const cookie = createInvitationCookie(invitationId, request);
        return new Response(null, {
          status: 302,
          headers: {
            Location: "/dashboard",
            "Set-Cookie": cookie,
          },
        });
      },
    },
  },
});
