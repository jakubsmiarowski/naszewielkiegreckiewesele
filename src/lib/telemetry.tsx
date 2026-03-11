import { useMutation } from "convex/react";
import {
	createContext,
	type ErrorInfo,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
} from "react";
import React from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { ClientTelemetryKind } from "@/components/dashboard/types";

const TELEMETRY_THROTTLE_MS = 5_000;
const MAX_JSON_LENGTH = 20_000;
const SENSITIVE_KEY_PATTERN =
	/(token|secret|authorization|cookie|qr|shortcode|pin|password)/i;
const recentlyReportedEvents = new Map<string, number>();

function getAppRelease() {
	return typeof __APP_RELEASE__ === "string" ? __APP_RELEASE__ : "dev";
}

export interface ClientTelemetryEvent {
	kind: ClientTelemetryKind;
	route?: string;
	message: string;
	stack?: string;
	invitationId?: string;
	payload?: unknown;
	context?: Record<string, unknown>;
	release?: string;
	fingerprint?: string;
}

interface TelemetryContextValue {
	captureClientError: (event: ClientTelemetryEvent) => void;
}

const TelemetryContext = createContext<TelemetryContextValue>({
	captureClientError() {},
});

function normalizeSegment(value: string | undefined) {
	return (
		value
			?.trim()
			.toLowerCase()
			.replace(/\s+/g, "-")
			.replace(/[^a-z0-9:_./-]/g, "")
			.slice(0, 80) ?? "unknown"
	);
}

function truncateJson(value: string | undefined) {
	if (!value) return undefined;
	return value.slice(0, MAX_JSON_LENGTH);
}

function sanitizeTelemetryValue(
	value: unknown,
	visited: WeakSet<object> = new WeakSet(),
): unknown {
	if (value === null || typeof value === "undefined") {
		return value;
	}

	if (
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "boolean"
	) {
		return value;
	}

	if (value instanceof Date) {
		return value.toISOString();
	}

	if (value instanceof Error) {
		return {
			name: value.name,
			message: value.message,
			stack: value.stack,
		};
	}

	if (Array.isArray(value)) {
		return value.map((item) => sanitizeTelemetryValue(item, visited));
	}

	if (typeof value === "object") {
		if (visited.has(value)) {
			return "[Circular]";
		}
		visited.add(value);

		const next: Record<string, unknown> = {};
		for (const [key, rawValue] of Object.entries(
			value as Record<string, unknown>,
		)) {
			if (SENSITIVE_KEY_PATTERN.test(key)) {
				next[key] = "[Redacted]";
				continue;
			}
			next[key] = sanitizeTelemetryValue(rawValue, visited);
		}
		return next;
	}

	return String(value);
}

function serializeTelemetryValue(value: unknown) {
	if (typeof value === "undefined") {
		return undefined;
	}

	try {
		return truncateJson(JSON.stringify(sanitizeTelemetryValue(value)));
	} catch {
		return JSON.stringify({ serializationError: true });
	}
}

function getCurrentRoute() {
	if (typeof window === "undefined") {
		return undefined;
	}
	return `${window.location.pathname}${window.location.search}`;
}

function getDeviceInfo() {
	if (typeof window === "undefined" || typeof navigator === "undefined") {
		return undefined;
	}

	return serializeTelemetryValue({
		language: navigator.language,
		platform: navigator.platform,
		maxTouchPoints: navigator.maxTouchPoints,
		online: navigator.onLine,
		viewport: {
			width: window.innerWidth,
			height: window.innerHeight,
		},
		screen: {
			width: window.screen?.width,
			height: window.screen?.height,
		},
	});
}

function getUserAgent() {
	if (typeof navigator === "undefined") {
		return undefined;
	}
	return navigator.userAgent;
}

function toErrorMessage(reason: unknown) {
	if (reason instanceof Error) {
		return reason.message;
	}
	if (typeof reason === "string" && reason.trim()) {
		return reason.trim();
	}
	if (typeof reason === "object" && reason !== null) {
		return "Unhandled rejection";
	}
	return "Unknown client error";
}

function getErrorStack(reason: unknown) {
	if (reason instanceof Error) {
		return reason.stack;
	}
	return undefined;
}

function shouldReportEvent(fingerprint: string) {
	const now = Date.now();
	const lastReportedAt = recentlyReportedEvents.get(fingerprint) ?? 0;
	if (now - lastReportedAt < TELEMETRY_THROTTLE_MS) {
		return false;
	}

	recentlyReportedEvents.set(fingerprint, now);
	return true;
}

export function computeTelemetryFingerprint(
	event: Pick<ClientTelemetryEvent, "kind" | "route" | "message" | "stack">,
) {
	const stackFrame = event.stack?.split("\n")[0];
	return [
		normalizeSegment(event.kind),
		normalizeSegment(event.route),
		normalizeSegment(event.message),
		normalizeSegment(stackFrame),
	].join(":");
}

export function buildTelemetryReportArgs(event: ClientTelemetryEvent) {
	const route = event.route ?? getCurrentRoute();
	const message = toErrorMessage(event.message);
	const fingerprint =
		event.fingerprint?.trim() ||
		computeTelemetryFingerprint({
			kind: event.kind,
			route,
			message,
			stack: event.stack,
		});

	return {
		kind: event.kind,
		fingerprint,
		route,
		release: event.release ?? getAppRelease(),
		invitationId: event.invitationId,
		userAgent: getUserAgent(),
		deviceInfo: getDeviceInfo(),
		message,
		stack: event.stack,
		payloadJson: serializeTelemetryValue(event.payload),
		contextJson: serializeTelemetryValue(event.context),
	};
}

export function TelemetryProvider({ children }: { children: ReactNode }) {
	const reportClientError = useMutation(api.telemetry.reportClientError);

	const value = useMemo<TelemetryContextValue>(() => {
		return {
			captureClientError(event) {
				const reportArgs = buildTelemetryReportArgs(event);
				if (!shouldReportEvent(reportArgs.fingerprint)) {
					return;
				}

				void reportClientError({
					...reportArgs,
					invitationId: reportArgs.invitationId as
						| Id<"invitations">
						| undefined,
				}).catch(() => undefined);
			},
		};
	}, [reportClientError]);

	return (
		<TelemetryContext.Provider value={value}>
			{children}
		</TelemetryContext.Provider>
	);
}

export function useTelemetry() {
	return useContext(TelemetryContext);
}

export function GlobalTelemetryListeners() {
	const { captureClientError } = useTelemetry();

	useEffect(() => {
		if (typeof window === "undefined") {
			return undefined;
		}

		function handleWindowError(event: ErrorEvent) {
			captureClientError({
				kind: "runtime_error",
				route: getCurrentRoute(),
				message: event.message || "Runtime error",
				stack: event.error instanceof Error ? event.error.stack : undefined,
				context: {
					filename: event.filename,
					line: event.lineno,
					column: event.colno,
				},
			});
		}

		function handleUnhandledRejection(event: PromiseRejectionEvent) {
			captureClientError({
				kind: "unhandled_rejection",
				route: getCurrentRoute(),
				message: toErrorMessage(event.reason),
				stack: getErrorStack(event.reason),
				context: {
					reason: sanitizeTelemetryValue(event.reason),
				},
			});
		}

		window.addEventListener("error", handleWindowError);
		window.addEventListener("unhandledrejection", handleUnhandledRejection);

		return () => {
			window.removeEventListener("error", handleWindowError);
			window.removeEventListener("unhandledrejection", handleUnhandledRejection);
		};
	}, [captureClientError]);

	return null;
}

export class TelemetryErrorBoundary extends React.Component<
	{
		children: ReactNode;
		onError: (event: ClientTelemetryEvent) => void;
		resetKey?: string;
	},
	{ hasError: boolean }
> {
	override state = { hasError: false };

	static getDerivedStateFromError() {
		return { hasError: true };
	}

	override componentDidCatch(error: unknown, info: ErrorInfo) {
		this.props.onError({
			kind: "runtime_error",
			route: getCurrentRoute(),
			message: toErrorMessage(error),
			stack: getErrorStack(error),
			context: {
				componentStack: info.componentStack,
			},
		});
	}

	override componentDidUpdate(
		prevProps: Readonly<{ resetKey?: string }>,
		prevState: Readonly<{ hasError: boolean }>,
	) {
		if (
			prevState.hasError &&
			this.state.hasError &&
			prevProps.resetKey !== this.props.resetKey
		) {
			this.setState({ hasError: false });
		}
	}

	override render() {
		if (!this.state.hasError) {
			return this.props.children;
		}

		return (
			<main className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-10 text-foreground">
				<section className="w-full max-w-xl rounded-3xl border border-border bg-white p-8 text-center shadow-sm">
					<h1 className="text-2xl font-bold">Coś poszło nie tak</h1>
					<p className="mt-3 text-sm text-muted-foreground">
						Aplikacja napotkała błąd i zapisaliśmy szczegóły dla organizatorów.
					</p>
					<p className="mt-2 text-sm text-muted-foreground">
						The app hit an error and we saved the details for the hosts.
					</p>
					<button
						type="button"
						onClick={() => window.location.reload()}
						className="mt-6 inline-flex h-10 items-center justify-center rounded-full bg-(--color-primary) px-5 text-sm font-semibold text-white transition hover:opacity-90"
					>
						Odśwież stronę
					</button>
				</section>
			</main>
		);
	}
}
