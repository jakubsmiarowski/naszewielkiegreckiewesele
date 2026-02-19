import { describe, expect, it } from "vitest";
import {
	calculateRequestedCarpoolSeats,
	formatCarpoolRequestError,
	formatSeatCount,
} from "@/lib/rsvp-carpool";

describe("calculateRequestedCarpoolSeats", () => {
	it("counts guests, plus one and children", () => {
		const seats = calculateRequestedCarpoolSeats({
			guestAttendances: {
				a: "yes",
				b: "yes",
				c: "no",
			},
			hasPlusOne: true,
			plusOneAttendance: "yes",
			childrenCount: 1,
		});

		expect(seats).toBe(4);
	});

	it("returns at least one seat", () => {
		const seats = calculateRequestedCarpoolSeats({
			guestAttendances: {},
			hasPlusOne: false,
			plusOneAttendance: undefined,
			childrenCount: 0,
		});

		expect(seats).toBe(1);
	});
});

describe("formatCarpoolRequestError", () => {
	it("returns friendly not-enough-seats message for Convex errors", () => {
		const error = new Error(
			"[CONVEX M(carpool:createRequest)] [Request ID: abc123] Server Error Uncaught Error: Brak wystarczającej liczby wolnych miejsc. at handler (../../convex/carpool.ts:723:16) Called by client",
		);

		const message = formatCarpoolRequestError({
			error,
			requestedSeats: 3,
			seatsAvailable: 2,
		});

		expect(message).toContain(`ma ${formatSeatCount(2)}`);
		expect(message).toContain(`potrzebuje ${formatSeatCount(3)}`);
	});

	it("maps unavailable-offer errors to a clear message", () => {
		const error = new Error("Ta oferta nie przyjmuje już zgłoszeń.");

		const message = formatCarpoolRequestError({
			error,
			requestedSeats: 2,
		});

		expect(message).toBe(
			"Wybrana oferta car pool nie jest już dostępna. Wybierz inną ofertę.",
		);
	});

	it("returns English seat labels when locale is en", () => {
		expect(formatSeatCount(1, "en")).toBe("1 seat");
		expect(formatSeatCount(3, "en")).toBe("3 seats");
	});

	it("returns English unavailable-offer message when locale is en", () => {
		const error = new Error("Ta oferta nie jest już dostępna.");

		const message = formatCarpoolRequestError({
			error,
			requestedSeats: 2,
			locale: "en",
		});

		expect(message).toBe(
			"The selected car pool offer is no longer available. Please choose another offer.",
		);
	});
});
