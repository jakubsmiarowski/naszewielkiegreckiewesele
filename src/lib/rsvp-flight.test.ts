import { describe, expect, it } from "vitest";
import { resolveRsvpFlightDateTimes } from "@/lib/rsvp-flight";

describe("resolveRsvpFlightDateTimes", () => {
	it("accepts RSVP without flight dates and clears both values", () => {
		expect(
			resolveRsvpFlightDateTimes({
				arrivalDateTime: "",
				departureDateTime: "",
			}),
		).toEqual({
			arrivalDateTime: undefined,
			departureDateTime: undefined,
			hasFlightDates: false,
		});
	});

	it("throws when only arrival is provided", () => {
		expect(() =>
			resolveRsvpFlightDateTimes({
				arrivalDateTime: "2026-10-01T10:00",
				departureDateTime: "",
			}),
		).toThrow("Podaj datę i godzinę wylotu.");
	});
});
