import { createFileRoute } from "@tanstack/react-router";
import {
	createAdminAccessToken,
	getInternalApiKey,
} from "@/lib/admin-access-token";
import { auth } from "@/lib/auth";
import { getConvexServerClient } from "@/lib/convex-server";
import { api } from "../../../../convex/_generated/api";

export const Route = createFileRoute("/api/admin/session")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const session = await auth.api.getSession({
					headers: request.headers,
				});

				const email = session?.user?.email?.trim().toLowerCase();
				if (!email) {
					return Response.json(
						{ ok: false, error: "forbidden" },
						{ status: 403 },
					);
				}

				const convex = getConvexServerClient();
				let isAdmin = await convex.query(api.adminUsers.isEmailAdmin, {
					email,
				});

				if (!isAdmin) {
					try {
						const bootstrapped = await convex.mutation(
							api.adminUsers.bootstrapFromEnv,
							{
								email,
								internalApiKey: getInternalApiKey(),
							},
						);
						isAdmin = bootstrapped;
					} catch (_error) {
						// Bootstrap is best-effort. Existing admins should still work without internal key.
					}
				}

				if (!isAdmin) {
					return Response.json(
						{ ok: false, error: "forbidden" },
						{ status: 403 },
					);
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
