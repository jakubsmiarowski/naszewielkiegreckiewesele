import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("RsvpForm section order", () => {
	it("shows arrival and departure before accommodation", () => {
		const source = readFileSync(
			resolve(process.cwd(), "src/components/rsvp/RsvpForm.tsx"),
			"utf8",
		);

		const arrivalAndDepartureSectionIndex = source.indexOf("Przylot i wylot");
		const accommodationSectionIndex = source.indexOf("Nocleg");

		expect(arrivalAndDepartureSectionIndex).toBeGreaterThan(-1);
		expect(accommodationSectionIndex).toBeGreaterThan(-1);
		expect(arrivalAndDepartureSectionIndex).toBeLessThan(
			accommodationSectionIndex,
		);
	});
});
