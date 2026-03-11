import { describe, expect, it } from "vitest";
import {
	formatRsvpSubmitError,
	getRsvpSubmitErrorMessage,
} from "@/lib/rsvp-submit-error";

describe("rsvp submit errors", () => {
	it("extracts a readable Convex error message", () => {
		const error = new Error(
			"[CONVEX M(invitations:updateRsvp)] [Request ID: abc123] Server Error Uncaught Error: Podaj datę i godzinę przylotu. at handler (../../convex/invitations.ts:320:13) Called by client",
		);

		expect(getRsvpSubmitErrorMessage(error)).toBe(
			"Podaj datę i godzinę przylotu.",
		);
	});

	it("falls back to a generic localized message for unknown errors", () => {
		expect(formatRsvpSubmitError(null, "pl")).toBe(
			"Nie udało się zapisać RSVP. Spróbuj ponownie.",
		);
	});
});
