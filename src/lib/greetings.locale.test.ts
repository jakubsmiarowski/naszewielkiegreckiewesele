import { describe, expect, it } from "vitest";
import { buildGreeting } from "@/lib/greetings";

describe("buildGreeting locale support", () => {
	it("builds english greeting from guest first names", () => {
		const greeting = buildGreeting(
			[{ fullName: "John Smith" }, { fullName: "Anna Clark" }],
			"en",
		);

		expect(greeting).toBe("Hi John and Anna!");
	});

	it("keeps polish greeting behavior by default", () => {
		const greeting = buildGreeting([{ fullName: "Jan Kowalski" }]);

		expect(greeting).toBe("Cześć Jan!");
	});
});
