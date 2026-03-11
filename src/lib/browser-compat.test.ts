import { describe, expect, it } from "vitest";
import {
	getBrowserCompatibilityIssue,
	isBrowserCompatibilitySupported,
} from "./browser-compat";

describe("browser compatibility", () => {
	it("accepts a baseline-compatible environment", () => {
		const target = {
			fetch: () => Promise.resolve(),
			URLSearchParams,
			Intl,
		} as unknown as Partial<typeof globalThis>;

		expect(isBrowserCompatibilitySupported(target)).toBe(true);
		expect(getBrowserCompatibilityIssue(target)).toBeNull();
	});

	it("reports the first missing critical API", () => {
		const target = {
			URLSearchParams,
			Intl,
		} as unknown as Partial<typeof globalThis>;

		expect(getBrowserCompatibilityIssue(target)).toBe("fetch");
		expect(isBrowserCompatibilitySupported(target)).toBe(false);
	});
});
