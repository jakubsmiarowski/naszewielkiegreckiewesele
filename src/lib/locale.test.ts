import { describe, expect, it } from "vitest";
import { isAppLocale, resolveLocale } from "@/lib/locale";

describe("locale helpers", () => {
	it("accepts supported app locales", () => {
		expect(isAppLocale("pl")).toBe(true);
		expect(isAppLocale("en")).toBe(true);
		expect(isAppLocale("de")).toBe(false);
	});

	it("resolves unknown values to polish", () => {
		expect(resolveLocale("pl")).toBe("pl");
		expect(resolveLocale("en")).toBe("en");
		expect(resolveLocale("de")).toBe("pl");
		expect(resolveLocale(null)).toBe("pl");
		expect(resolveLocale(undefined)).toBe("pl");
	});
});
