import { describe, expect, it } from "vitest";
import { buildIcsFile } from "@/components/dashboard/buildIcsFile";

describe("buildIcsFile", () => {
	it("generates calendar event for wedding date 2026-10-01 in UTC", () => {
		const ics = buildIcsFile({ now: new Date("2026-02-10T12:34:56Z") });

		expect(ics).toContain("DTSTAMP:20260210T123456Z");
		expect(ics).toContain("DTSTART:20261001T130000Z");
		expect(ics).toContain("DTEND:20261001T205900Z");
		expect(ics).toContain("UID:wesele-20261001T160000@kamila-kuba");
		expect(ics).not.toContain("20261002");
	});

	it("uses CRLF separators required by ICS format", () => {
		const ics = buildIcsFile({ now: new Date("2026-02-10T12:34:56Z") });
		const lines = ics.split("\r\n");

		expect(lines[0]).toBe("BEGIN:VCALENDAR");
		expect(lines.at(-2)).toBe("END:VCALENDAR");
		expect(ics.endsWith("\r\n")).toBe(true);
	});
});
