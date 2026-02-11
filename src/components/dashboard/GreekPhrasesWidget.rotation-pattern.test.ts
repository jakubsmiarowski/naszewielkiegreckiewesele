import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("GreekPhrasesWidget rotation", () => {
	it("rotates phrases in an animated stacked card", () => {
		const source = readFileSync(
			resolve(process.cwd(), "src/components/dashboard/SidebarWidgets.tsx"),
			"utf8",
		);

		expect(source).toContain("export function GreekPhrasesWidget()");
		expect(source).toContain("window.setInterval");
		expect(source).toContain("}, 10000)");
		expect(source).toContain('AnimatePresence mode="wait"');
		expect(source).toContain("flex flex-col gap-3");
		expect(source).toContain("Po polsku");
		expect(source).toContain("Po grecku");
	});
});
