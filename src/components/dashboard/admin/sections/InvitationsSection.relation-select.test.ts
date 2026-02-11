import { describe, expect, it } from "vitest";
import {
	EMPTY_RELATION_SELECT_VALUE,
	fromRelationSelectValue,
	toRelationSelectValue,
} from "@/components/dashboard/admin/sections/InvitationsSection";
import { RELATION_OPTIONS } from "@/lib/greetings";

describe("InvitationsSection relation select mapping", () => {
	it("maps empty relation to non-empty select value", () => {
		expect(toRelationSelectValue(undefined)).toBe(EMPTY_RELATION_SELECT_VALUE);
		expect(toRelationSelectValue("mama")).toBe("mama");
	});

	it("maps sentinel value back to undefined relation", () => {
		expect(
			fromRelationSelectValue(EMPTY_RELATION_SELECT_VALUE),
		).toBeUndefined();
		expect(fromRelationSelectValue("wujek")).toBe("wujek");
	});

	it("keeps select option values non-empty for radix select item", () => {
		const selectValues = RELATION_OPTIONS.map(
			(option) => option.value || EMPTY_RELATION_SELECT_VALUE,
		);
		for (const value of selectValues) {
			expect(value.length).toBeGreaterThan(0);
		}
	});
});
