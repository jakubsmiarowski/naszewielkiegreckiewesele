import { describe, expect, it } from "vitest";
import { resolveConvexUrl } from "./convex-url";

describe("resolveConvexUrl", () => {
	it("uses explicit VITE_CONVEX_URL in local mode", () => {
		const url = resolveConvexUrl({
			viteEnv: {
				DEV: true,
				VITE_CONVEX_URL: "https://explicit.convex.cloud",
			},
			processEnv: {},
			fallbackProdUrl: "https://prod.convex.cloud",
		});

		expect(url).toBe("https://explicit.convex.cloud");
	});

	it("uses production URL outside local development", () => {
		const url = resolveConvexUrl({
			viteEnv: {
				DEV: false,
				VITE_CONVEX_DEV_URL: "https://dev.convex.cloud",
				VITE_CONVEX_PROD_URL: "https://prod.convex.cloud",
			},
			processEnv: { NODE_ENV: "production" },
		});

		expect(url).toBe("https://prod.convex.cloud");
	});

	it("uses demo URL in demo mode", () => {
		const url = resolveConvexUrl({
			viteEnv: {
				DEV: false,
				VITE_APP_MODE: "demo",
				VITE_CONVEX_DEMO_URL: "https://demo.convex.cloud",
				VITE_CONVEX_PROD_URL: "https://prod.convex.cloud",
			},
			processEnv: { NODE_ENV: "production" },
		});

		expect(url).toBe("https://demo.convex.cloud");
	});

	it("uses demo fallback in local demo mode without explicit URL", () => {
		const url = resolveConvexUrl({
			viteEnv: {
				DEV: true,
				VITE_APP_MODE: "demo",
			},
			processEnv: {},
			fallbackProdUrl: "https://prod.convex.cloud",
			fallbackDemoUrl: "https://demo-fallback.convex.cloud",
		});

		expect(url).toBe("https://demo-fallback.convex.cloud");
	});
});
