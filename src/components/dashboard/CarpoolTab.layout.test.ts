import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("CarpoolTab offer cards layout", () => {
	it("stretches cards and anchors footer to the bottom", () => {
		const source = readFileSync(
			resolve(process.cwd(), "src/components/dashboard/CarpoolTab.tsx"),
			"utf8",
		);

		expect(source).toContain(
			"grid grid-cols-1 md:grid-cols-2 items-stretch gap-4",
		);
		expect(source).toContain("h-full w-full rounded-xl border p-4 text-left");
		expect(source).toContain("mt-auto pt-3");
	});
});
