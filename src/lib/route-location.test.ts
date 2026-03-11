import { describe, expect, it } from "vitest";
import { buildRouteWithSearch } from "@/lib/route-location";

describe("buildRouteWithSearch", () => {
	it("keeps plain routes readable when search is an object", () => {
		expect(buildRouteWithSearch("/dashboard", {})).toBe("/dashboard");
	});

	it("serializes object search params instead of producing object-object", () => {
		expect(buildRouteWithSearch("/dashboard", { tab: "rsvp", page: 2 })).toBe(
			"/dashboard?tab=rsvp&page=2",
		);
	});
});
