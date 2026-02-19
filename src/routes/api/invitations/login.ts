import { createFileRoute } from "@tanstack/react-router";
import { getInternalApiKey } from "@/lib/admin-access-token";
import { isDemoMode } from "@/lib/app-mode";
import { getConvexServerClient } from "@/lib/convex-server";
import { createInvitationCookie } from "@/lib/invitation-cookie";
import { api } from "../../../../convex/_generated/api";

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
				try {
					const body = await request.json().catch(() => null);
					const shortCode =
						typeof body?.shortCode === "string" ? body.shortCode : "";
					const normalized = shortCode.replace(/\s+/g, "").trim();
					const throttleKeys = buildThrottleKeys(request, normalized);
					const hostname = new URL(request.url).hostname;
					const demoMode = isDemoMode({ hostname });
					let internalApiKey: string | null = null;
					try {
						internalApiKey = getInternalApiKey();
					} catch (_error) {
						if (!demoMode) {
							return Response.json(
								{ ok: false, error: "security-config-missing" },
								{ status: 503 },
							);
						}
					}
					const convex = getConvexServerClient();

					if (!normalized) {
						if (internalApiKey) {
							for (const key of throttleKeys) {
								await convex.mutation(api.security.recordPinLoginAttempt, {
									key,
									succeeded: false,
									internalApiKey,
								});
							}
						}
						return Response.json(
							{ ok: false, error: "missing-code" },
							{ status: 400 },
						);
					}

					if (internalApiKey) {
						for (const key of throttleKeys) {
							let state:
								| { isBlocked: boolean; retryAfterSeconds: number }
								| undefined;
							try {
								state = await convex.query(api.security.getPinThrottleState, {
									key,
									internalApiKey,
								});
							} catch (throttleError) {
								console.warn(
									"PIN throttle check unavailable, continuing without throttle.",
									throttleError,
								);
								break;
							}
							if (state?.isBlocked) {
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
					}

					let invitationId: string | null = null;
					try {
						invitationId = await convex.query(api.invitations.getIdByShortCode, {
							shortCode: normalized,
						});
					} catch (queryError) {
						console.error("Could not query invitation by PIN code.", queryError);
						return Response.json(
							{ ok: false, error: "backend-unavailable" },
							{ status: 503 },
						);
					}

					const attemptStates: Array<{
						isBlocked: boolean;
						retryAfterSeconds: number;
					}> = [];
					if (internalApiKey) {
						for (const key of throttleKeys) {
							try {
								const state = await convex.mutation(
									api.security.recordPinLoginAttempt,
									{
										key,
										succeeded: Boolean(invitationId),
										internalApiKey,
									},
								);
								attemptStates.push(state);
							} catch (throttleError) {
								console.warn(
									"PIN throttle recording unavailable, continuing without throttle.",
									throttleError,
								);
								break;
							}
						}
					}

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
							{ status: 401 },
						);
					}

					const cookie = createInvitationCookie(invitationId, request);
					return Response.json(
						{ ok: true },
						{
							headers: {
								"Set-Cookie": cookie,
							},
						},
					);
				} catch (error) {
					console.error("Invitation login failed:", error);
					return Response.json(
						{ ok: false, error: "login-failed" },
						{ status: 500 },
					);
				}
			},
		},
	},
});
