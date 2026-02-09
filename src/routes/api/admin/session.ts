import { createFileRoute } from "@tanstack/react-router";
import { createAdminAccessToken } from "@/lib/admin-access-token";
import { isAdminEmail } from "@/lib/admin";
import { auth } from "@/lib/auth";

export const Route = createFileRoute("/api/admin/session")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await auth.api.getSession({
          headers: request.headers,
        });

        const email = session?.user?.email;
        if (!isAdminEmail(email)) {
          return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
        }

        const { token, expiresAt } = await createAdminAccessToken(email);
        return Response.json(
          {
            ok: true,
            adminAccessToken: token,
            expiresAt,
          },
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
