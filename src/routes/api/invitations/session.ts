import { createFileRoute } from "@tanstack/react-router";
import { getInvitationIdFromRequest } from "@/lib/invitation-cookie";

export const Route = createFileRoute("/api/invitations/session")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const invitationId = getInvitationIdFromRequest(request);
        if (!invitationId) {
          return Response.json(
            { ok: false, invitationId: null },
            {
              headers: {
                "Cache-Control": "no-store",
              },
            },
          );
        }

        return Response.json(
          { ok: true, invitationId },
          {
            headers: {
              "Cache-Control": "no-store",
            },
          },
        );
      },
    },
  },
});
