import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("GreekPhrasesWidget rotation", () => {
	it("rotates phrases in an animated text-only layout", () => {
		const source = readFileSync(
			resolve(process.cwd(), "src/components/dashboard/SidebarWidgets.tsx"),
			"utf8",
		);

		expect(source).toContain("export function GreekPhrasesWidget()");
		expect(source).toContain("window.setInterval");
		expect(source).toContain("}, 10000)");
		expect(source).toContain('AnimatePresence mode="wait"');
		expect(source).toContain('className="space-y-4"');
		expect(source).toContain("Po polsku");
		expect(source).toContain("Po grecku");
		expect(source).not.toContain("min-h-[236px]");
		expect(source).not.toContain(
			"rounded-lg border border-border bg-background p-3",
		);
	});
});
