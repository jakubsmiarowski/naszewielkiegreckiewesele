import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_APP_MODE = process.env.APP_MODE;
const ORIGINAL_VITE_APP_MODE = process.env.VITE_APP_MODE;

async function importPlanTimelineModule() {
	vi.resetModules();
	return import("@/data/plan-timeline");
}

describe("plan timeline demo mode", () => {
	afterEach(() => {
		if (ORIGINAL_APP_MODE === undefined) {
			delete process.env.APP_MODE;
		} else {
			process.env.APP_MODE = ORIGINAL_APP_MODE;
		}

		if (ORIGINAL_VITE_APP_MODE === undefined) {
			delete process.env.VITE_APP_MODE;
		} else {
			process.env.VITE_APP_MODE = ORIGINAL_VITE_APP_MODE;
		}
	});

	it("returns Santorini schedule in demo mode", async () => {
		process.env.APP_MODE = "demo";
		const { getPlanTimelineDays } = await importPlanTimelineModule();

		const days = getPlanTimelineDays("en");
		expect(days[0]?.subtitle).toContain("Santorini");
		expect(days.some((day: { events: Array<{ location?: string }> }) =>
			day.events.some((event) => event.location?.includes("Santorini")),
		)).toBe(true);
	});
});
