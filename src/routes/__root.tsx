import { TanStackDevtools } from "@tanstack/react-devtools";
import {
	createRootRoute,
	HeadContent,
	Scripts,
	useLocation,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { type ReactNode, useEffect, useState } from "react";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Toaster } from "@/components/ui/toaster";
import { isDemoMode } from "@/lib/app-mode";
import { getBrowserCompatibilityIssue } from "@/lib/browser-compat";
import { getCoupleLabel } from "@/lib/couple";
import { LocaleProvider } from "@/lib/locale";
import {
	GlobalTelemetryListeners,
	TelemetryErrorBoundary,
	TelemetryProvider,
	useTelemetry,
} from "@/lib/telemetry";
import ConvexProvider from "../integrations/convex/provider";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: isDemoMode()
					? `Demo | ${getCoupleLabel()} - Wedding in Santorini`
					: `${getCoupleLabel()} - Ślub w Grecji`,
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg",
			},
			{
				rel: "icon",
				type: "image/png",
				sizes: "96x96",
				href: "/favicon-96x96.png",
			},
			{
				rel: "icon",
				sizes: "any",
				href: "/favicon.ico",
			},
			{
				rel: "apple-touch-icon",
				sizes: "180x180",
				href: "/apple-touch-icon.png",
			},
			{
				rel: "manifest",
				href: "/site.webmanifest",
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com",
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous",
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Lora:ital,wght@0,400..700;1,400..700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap",
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap",
			},
		],
	}),

	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: ReactNode }) {
	const htmlLang = isDemoMode() ? "en" : "pl";

	return (
		<html lang={htmlLang} className="light">
			<head>
				<HeadContent />
			</head>
			<body className="flex min-h-screen w-full flex-col bg-background text-foreground overflow-x-hidden font-sans">
				<ConvexProvider>
					<LocaleProvider>
						<TelemetryProvider>
							<AppRuntimeShell>{children}</AppRuntimeShell>
						</TelemetryProvider>
					</LocaleProvider>
				</ConvexProvider>
				<Scripts />
			</body>
		</html>
	);
}

function AppRuntimeShell({ children }: { children: ReactNode }) {
	const location = useLocation();
	const { captureClientError } = useTelemetry();
	const [compatibilityIssue, setCompatibilityIssue] = useState<string | null>(
		null,
	);

	useEffect(() => {
		setCompatibilityIssue(getBrowserCompatibilityIssue());
	}, []);

	if (compatibilityIssue) {
		return <UnsupportedBrowserFallback issue={compatibilityIssue} />;
	}

	return (
		<>
			<GlobalTelemetryListeners />
			<TelemetryErrorBoundary
				onError={captureClientError}
				resetKey={`${location.pathname}${location.search}`}
			>
				<HeaderWrapper />
				<DemoEnvironmentBanner />
				<main className="flex-1 flex w-full flex-col items-center">
					{children}
				</main>
				<FooterWrapper />
				<Toaster />
				{import.meta.env.DEV ? (
					<TanStackDevtools
						config={{
							position: "bottom-right",
						}}
						plugins={[
							{
								name: "Tanstack Router",
								render: <TanStackRouterDevtoolsPanel />,
							},
						]}
					/>
				) : null}
			</TelemetryErrorBoundary>
		</>
	);
}

function HeaderWrapper() {
	const location = useLocation();
	const isLandingPage = location.pathname === "/";

	if (isLandingPage) return null;

	return <DashboardHeader />;
}

function FooterWrapper() {
	const location = useLocation();
	const isLandingPage = location.pathname === "/";

	if (isLandingPage) return null;

	return <DashboardFooter />;
}

function DemoEnvironmentBanner() {
	if (!isDemoMode()) {
		return null;
	}

	return (
		<div className="w-full border-y border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
			This is a demo environment. Data is periodically reset.{" "}
			<a href="/demo.html" className="font-semibold underline">
				How to test demo
			</a>
		</div>
	);
}

function UnsupportedBrowserFallback({ issue }: { issue: string }) {
	return (
		<main className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-10 text-foreground">
			<section className="w-full max-w-xl rounded-3xl border border-border bg-white p-8 text-center shadow-sm">
				<p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
					Unsupported browser
				</p>
				<h1 className="mt-3 text-2xl font-bold">
					To urządzenie potrzebuje nowszej przeglądarki
				</h1>
				<p className="mt-3 text-sm text-muted-foreground">
					Wykryliśmy brak wsparcia dla: <span className="font-medium">{issue}</span>.
					Spróbuj zaktualizować Safari/Chrome albo otwórz stronę na nowszym
					telefonie.
				</p>
				<p className="mt-2 text-sm text-muted-foreground">
					We detected a missing browser capability:{" "}
					<span className="font-medium">{issue}</span>.
				</p>
			</section>
		</main>
	);
}
