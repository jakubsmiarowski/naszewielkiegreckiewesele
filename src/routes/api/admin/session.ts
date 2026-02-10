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
				let session: Awaited<ReturnType<typeof auth.api.getSession>> | null =
					null;
				try {
					session = await auth.api.getSession({
						headers: request.headers,
					});
				} catch (_error) {
					return Response.json(
						{ ok: false, error: "session_lookup_failed" },
						{ status: 500 },
					);
				}

				const email = session?.user?.email?.trim().toLowerCase();
				if (!email) {
					return Response.json(
						{ ok: false, error: "forbidden_no_email" },
						{ status: 403 },
					);
				}

				const convex = getConvexServerClient();
				let isAdmin = false;
				try {
					isAdmin = await convex.query(api.adminUsers.isEmailAdmin, {
						email,
					});
				} catch (_error) {
					return Response.json(
						{ ok: false, error: "convex_admin_check_failed" },
						{ status: 500 },
					);
				}

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
						{ ok: false, error: "forbidden_not_admin" },
						{ status: 403 },
					);
				}

				let token: string;
				let expiresAt: number;
				try {
					const issued = await createAdminAccessToken(email);
					token = issued.token;
					expiresAt = issued.expiresAt;
				} catch (_error) {
					return Response.json(
						{ ok: false, error: "admin_token_create_failed" },
						{ status: 500 },
					);
				}
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
