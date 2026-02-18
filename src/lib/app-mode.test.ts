import { describe, expect, it } from "vitest";
import { isDemoMode, resolveAppMode } from "./app-mode";

describe("resolveAppMode", () => {
	it("returns demo when APP_MODE is set", () => {
		const mode = resolveAppMode({
			viteEnv: {},
			processEnv: { APP_MODE: "demo" },
		});

		expect(mode).toBe("demo");
	});

	it("falls back to hostname for demo subdomain", () => {
		const mode = resolveAppMode({
			viteEnv: {},
			processEnv: {},
			hostname: "demo.naszewielkiegreckiewesele.com",
		});

		expect(mode).toBe("demo");
	});

	it("defaults to production", () => {
		const mode = resolveAppMode({
			viteEnv: {},
			processEnv: {},
			hostname: "naszewielkiegreckiewesele.com",
		});

		expect(mode).toBe("production");
	});

	it("reports demo mode via helper", () => {
		expect(
			isDemoMode({
				viteEnv: { VITE_APP_MODE: "demo" },
				processEnv: {},
			}),
		).toBe(true);
	});
});
